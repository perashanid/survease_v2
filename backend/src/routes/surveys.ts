import express, { Request, Response } from 'express';
import { Survey, Response as SurveyResponse } from '../models';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import mongoose from 'mongoose';
import {
  createSurveySchema,
  updateSurveySchema,
  submitResponseSchema
} from '../validation/schemas';

const router = express.Router();

/**
 * POST /api/surveys
 * Create a new survey
 */
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createSurveySchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid survey data',
          details: error.details[0].message
        }
      });
      return;
    }

    const { title, description, questions, settings } = value;
    const userId = req.user!.id;

    // Generate unique slug from title
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await Survey.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const survey = new Survey({
      user_id: userId,
      title,
      description,
      slug,
      configuration: {
        questions,
        settings: {
          is_public: settings.is_public || false,
          allow_anonymous: settings.allow_anonymous !== false,
          collect_email: settings.collect_email || false,
          one_response_per_user: settings.one_response_per_user !== false,
          show_results: settings.show_results || false,
          close_date: settings.close_date
        }
      },
      is_public: settings.is_public || false,
      is_active: true
    });

    await survey.save();

    res.status(201).json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/survey/${survey.slug}`,
          questions: survey.configuration.questions,
          settings: survey.configuration.settings,
          is_public: survey.is_public,
          is_active: survey.is_active,
          created_at: survey.created_at,
          response_count: 0
        }
      }
    });
  } catch (error: any) {
    console.error('Survey creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create survey'
      }
    });
  }
});

/**
 * GET /api/surveys
 * Get user's surveys
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const surveys = await Survey.find({ user_id: userId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Get response counts for each survey
    const surveysWithCounts = await Promise.all(
      surveys.map(async (survey) => {
        const responseCount = await SurveyResponse.countDocuments({ survey_id: survey._id });
        return {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/survey/${survey.slug}`,
          is_public: survey.is_public,
          is_active: survey.is_active,
          created_at: survey.created_at,
          updated_at: survey.updated_at,
          response_count: responseCount,
          questions: survey.configuration.questions,
          settings: survey.configuration.settings
        };
      })
    );

    const total = await Survey.countDocuments({ user_id: userId });

    res.json({
      success: true,
      data: {
        surveys: surveysWithCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Get surveys error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch surveys'
      }
    });
  }
});

/**
 * GET /api/surveys/public
 * Get public surveys
 */
router.get('/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const surveys = await Survey.find({ is_public: true, is_active: true })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'first_name last_name email');

    const surveysWithCounts = await Promise.all(
      surveys.map(async (survey) => {
        const responseCount = await SurveyResponse.countDocuments({ survey_id: survey._id });
        return {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/survey/${survey.slug}`,
          created_at: survey.created_at,
          response_count: responseCount,
          author: {
            name: `${(survey.user_id as any).first_name || ''} ${(survey.user_id as any).last_name || ''}`.trim() || 'Anonymous'
          }
        };
      })
    );

    const total = await Survey.countDocuments({ is_public: true, is_active: true });

    res.json({
      success: true,
      surveys: surveysWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Get public surveys error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch public surveys'
      }
    });
  }
});

/**
 * GET /api/public/surveys
 * Get public surveys (alias for /api/surveys/public for consistency)
 */
router.get('/public/surveys', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const surveys = await Survey.find({ is_public: true, is_active: true })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'first_name last_name email');

    const surveysWithCounts = await Promise.all(
      surveys.map(async (survey) => {
        const responseCount = await SurveyResponse.countDocuments({ survey_id: survey._id });
        return {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/survey/${survey.slug}`,
          created_at: survey.created_at,
          response_count: responseCount,
          allow_import: survey.allow_import || false,
          import_count: survey.import_count || 0,
          author: {
            name: `${(survey.user_id as any).first_name || ''} ${(survey.user_id as any).last_name || ''}`.trim() || 'Anonymous'
          }
        };
      })
    );

    const total = await Survey.countDocuments({ is_public: true, is_active: true });

    res.json({
      success: true,
      data: {
        surveys: surveysWithCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Get public surveys error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch public surveys'
      }
    });
  }
});

/**
 * GET /api/public/surveys/:id/analytics
 * Get analytics for a public survey
 */
router.get('/public/surveys/:id/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    // Find the survey and ensure it's public
    const survey = await Survey.findOne({ 
      _id: id, 
      is_public: true, 
      is_active: true 
    }).populate('user_id', 'first_name last_name');

    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Public survey not found'
        }
      });
      return;
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ survey_id: survey._id });
    const totalResponses = responses.length;

    // Calculate completion rate (estimate based on responses)
    const estimatedViews = Math.max(totalResponses * 3, totalResponses + 50);
    const completionRate = totalResponses > 0 ? (totalResponses / estimatedViews) * 100 : 0;

    // Calculate average completion time
    const responsesWithTime = responses.filter(r => r.completion_time && r.completion_time > 0);
    const averageCompletionTime = responsesWithTime.length > 0 
      ? responsesWithTime.reduce((sum, r) => sum + (r.completion_time || 0), 0) / responsesWithTime.length 
      : null;

    // Generate question analytics
    const questionAnalytics = survey.configuration.questions.map(question => {
      const questionResponses = responses
        .map(r => r.response_data[question.id])
        .filter(response => response !== undefined && response !== null && response !== '');

      const responseCount = questionResponses.length;
      const responseRate = totalResponses > 0 ? (responseCount / totalResponses) * 100 : 0;

      let analytics: any = {
        questionId: question.id,
        question: question.question,
        type: question.type,
        responseCount,
        responseRate: Math.round(responseRate * 10) / 10
      };

      // Generate specific analytics based on question type
      if (question.type === 'multiple_choice' || question.type === 'checkbox') {
        const optionCounts: { [key: string]: number } = {};
        const options = question.options || [];
        
        // Initialize all options with 0 count
        options.forEach(option => {
          optionCounts[option] = 0;
        });

        // Count responses
        questionResponses.forEach(response => {
          if (Array.isArray(response)) {
            // For checkbox questions
            response.forEach(option => {
              if (optionCounts.hasOwnProperty(option)) {
                optionCounts[option]++;
              }
            });
          } else {
            // For multiple choice questions
            if (optionCounts.hasOwnProperty(response)) {
              optionCounts[response]++;
            }
          }
        });

        analytics.optionBreakdown = Object.entries(optionCounts).map(([option, count]) => ({
          option,
          count,
          percentage: responseCount > 0 ? Math.round((count / responseCount) * 100 * 10) / 10 : 0
        }));
      } else if (question.type === 'rating') {
        const ratingCounts: { [key: string]: number } = {};
        const maxRating = question.max_rating || 5;
        
        // Initialize rating counts
        for (let i = 1; i <= maxRating; i++) {
          ratingCounts[i.toString()] = 0;
        }

        // Count ratings
        questionResponses.forEach(response => {
          const rating = response.toString();
          if (ratingCounts.hasOwnProperty(rating)) {
            ratingCounts[rating]++;
          }
        });

        analytics.ratingBreakdown = Object.entries(ratingCounts).map(([rating, count]) => ({
          rating: parseInt(rating),
          count,
          percentage: responseCount > 0 ? Math.round((count / responseCount) * 100 * 10) / 10 : 0
        }));

        // Calculate average rating
        const totalRatingValue = questionResponses.reduce((sum, response) => {
          const rating = parseInt(response.toString());
          return sum + (isNaN(rating) ? 0 : rating);
        }, 0);
        analytics.averageRating = responseCount > 0 ? Math.round((totalRatingValue / responseCount) * 10) / 10 : 0;
      } else if (question.type === 'text' || question.type === 'textarea') {
        // For text questions, just provide response samples (first 5, anonymized)
        analytics.sampleResponses = questionResponses.slice(0, 5).map(response => {
          const text = response.toString();
          // Truncate long responses
          return text.length > 100 ? text.substring(0, 100) + '...' : text;
        });
      }

      return analytics;
    });

    // Generate response timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const timelineData: Array<{ date: string; responses: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayResponses = responses.filter(r => 
        r.submitted_at >= dayStart && r.submitted_at < dayEnd
      ).length;
      
      timelineData.push({
        date: dayStart.toISOString().split('T')[0],
        responses: dayResponses
      });
    }

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          author: {
            name: `${(survey.user_id as any).first_name || ''} ${(survey.user_id as any).last_name || ''}`.trim() || 'Anonymous'
          },
          created_at: survey.created_at
        },
        analytics: {
          totalResponses,
          completionRate: Math.round(completionRate * 10) / 10,
          averageCompletionTime: averageCompletionTime ? Math.round(averageCompletionTime) : null,
          questionAnalytics,
          responseTimeline: timelineData
        }
      }
    });
  } catch (error: any) {
    console.error('Get public survey analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch public survey analytics'
      }
    });
  }
});

/**
 * GET /api/public/surveys/:id/export/csv
 * Export public survey responses as CSV
 */
router.get('/public/surveys/:id/export/csv', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    // Find the survey and ensure it's public
    const survey = await Survey.findOne({ 
      _id: id, 
      is_public: true, 
      is_active: true 
    });

    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Public survey not found'
        }
      });
      return;
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ survey_id: survey._id });

    if (responses.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_RESPONSES',
          message: 'No responses found for this survey'
        }
      });
      return;
    }

    // Generate CSV headers
    const headers = ['Response ID', 'Submitted At', 'Completion Time (seconds)'];
    
    // Add question headers
    survey.configuration.questions.forEach(question => {
      headers.push(`Q${question.id}: ${question.question}`);
    });

    // Add respondent email header (only if survey collects emails and responses are not anonymous)
    const hasNonAnonymousResponses = responses.some(r => !r.is_anonymous && r.respondent_email);
    if (hasNonAnonymousResponses) {
      headers.push('Respondent Email');
    }

    // Generate CSV rows
    const csvRows = [headers.join(',')];
    
    responses.forEach(response => {
      const row = [
        (response._id as mongoose.Types.ObjectId).toString(),
        response.submitted_at.toISOString(),
        response.completion_time?.toString() || ''
      ];

      // Add question responses
      survey.configuration.questions.forEach(question => {
        const answer = response.response_data[question.id];
        let formattedAnswer = '';
        
        if (answer !== undefined && answer !== null) {
          if (Array.isArray(answer)) {
            formattedAnswer = answer.join('; ');
          } else {
            formattedAnswer = answer.toString();
          }
        }
        
        // Escape commas and quotes in CSV
        if (formattedAnswer.includes(',') || formattedAnswer.includes('"') || formattedAnswer.includes('\n')) {
          formattedAnswer = `"${formattedAnswer.replace(/"/g, '""')}"`;
        }
        
        row.push(formattedAnswer);
      });

      // Add respondent email if applicable
      if (hasNonAnonymousResponses) {
        const email = (!response.is_anonymous && response.respondent_email) ? response.respondent_email : '';
        row.push(email);
      }

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const filename = `${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Export public survey CSV error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export survey data'
      }
    });
  }
});

/**
 * GET /api/public/surveys/:id/export/json
 * Export public survey responses as JSON
 */
router.get('/public/surveys/:id/export/json', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    // Find the survey and ensure it's public
    const survey = await Survey.findOne({ 
      _id: id, 
      is_public: true, 
      is_active: true 
    });

    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Public survey not found'
        }
      });
      return;
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ survey_id: survey._id });

    if (responses.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_RESPONSES',
          message: 'No responses found for this survey'
        }
      });
      return;
    }

    // Format responses for JSON export
    const formattedResponses = responses.map(response => {
      const formattedResponse: any = {
        response_id: response._id,
        submitted_at: response.submitted_at,
        completion_time: response.completion_time,
        responses: {}
      };

      // Add question responses with question text
      survey.configuration.questions.forEach(question => {
        const answer = response.response_data[question.id];
        formattedResponse.responses[question.id] = {
          question: question.question,
          type: question.type,
          answer: answer !== undefined ? answer : null
        };
      });

      // Add respondent email if not anonymous
      if (!response.is_anonymous && response.respondent_email) {
        formattedResponse.respondent_email = response.respondent_email;
      }

      return formattedResponse;
    });

    const exportData = {
      survey: {
        id: survey._id,
        title: survey.title,
        description: survey.description,
        created_at: survey.created_at,
        questions: survey.configuration.questions
      },
      responses: formattedResponses,
      export_metadata: {
        exported_at: new Date(),
        total_responses: responses.length,
        export_type: 'json'
      }
    };

    const filename = `${survey.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);
  } catch (error: any) {
    console.error('Export public survey JSON error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export survey data'
      }
    });
  }
});

/**
 * GET /api/surveys/public/importable
 * Get public surveys that can be imported
 */
router.get('/public/importable', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user!.id;

    const surveys = await Survey.find({ 
      is_public: true, 
      is_active: true, 
      allow_import: true,
      user_id: { $ne: userId } // Exclude user's own surveys
    })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'first_name last_name email');

    const surveysWithCounts = await Promise.all(
      surveys.map(async (survey) => {
        const responseCount = await SurveyResponse.countDocuments({ survey_id: survey._id });
        return {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          created_at: survey.created_at,
          response_count: responseCount,
          import_count: survey.import_count,
          allow_import: survey.allow_import,
          author: {
            name: `${(survey.user_id as any).first_name || ''} ${(survey.user_id as any).last_name || ''}`.trim() || 'Anonymous'
          },
          questions: survey.configuration.questions
        };
      })
    );

    const total = await Survey.countDocuments({ 
      is_public: true, 
      is_active: true, 
      allow_import: true,
      user_id: { $ne: userId }
    });

    res.json({
      success: true,
      data: {
        surveys: surveysWithCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Get importable surveys error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch importable surveys'
      }
    });
  }
});

/**
 * POST /api/surveys/:id/import
 * Import a public survey to user's dashboard
 */
router.post('/:id/import', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    // Find the original survey
    const originalSurvey = await Survey.findOne({ 
      _id: id, 
      is_public: true, 
      is_active: true, 
      allow_import: true 
    });

    if (!originalSurvey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found or not available for import'
        }
      });
      return;
    }

    // Check if user is trying to import their own survey
    if (originalSurvey.user_id.toString() === userId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_IMPORT_OWN_SURVEY',
          message: 'You cannot import your own survey'
        }
      });
      return;
    }

    // Generate unique slug for the imported survey
    const baseSlug = originalSurvey.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    let slug = `${baseSlug}-imported`;
    let counter = 1;
    
    // Ensure slug is unique
    while (await Survey.findOne({ slug })) {
      slug = `${baseSlug}-imported-${counter}`;
      counter++;
    }

    // Create the imported survey
    const importedSurvey = new Survey({
      user_id: userId,
      title: `${originalSurvey.title} (Imported)`,
      description: originalSurvey.description,
      slug,
      configuration: {
        questions: originalSurvey.configuration.questions,
        settings: {
          ...originalSurvey.configuration.settings,
          is_public: false // Imported surveys are private by default
        }
      },
      is_public: false,
      is_active: true,
      allow_import: true,
      import_count: 0,
      original_survey_id: originalSurvey._id
    });

    await importedSurvey.save();

    // Increment import count on original survey
    await Survey.updateOne(
      { _id: originalSurvey._id },
      { $inc: { import_count: 1 } }
    );

    res.status(201).json({
      success: true,
      data: {
        survey: {
          id: importedSurvey._id,
          title: importedSurvey.title,
          description: importedSurvey.description,
          slug: importedSurvey.slug,
          url: `${req.protocol}://${req.get('host')}/survey/${importedSurvey.slug}`,
          questions: importedSurvey.configuration.questions,
          settings: importedSurvey.configuration.settings,
          is_public: importedSurvey.is_public,
          is_active: importedSurvey.is_active,
          created_at: importedSurvey.created_at,
          response_count: 0,
          original_survey_id: importedSurvey.original_survey_id
        }
      }
    });
  } catch (error: any) {
    console.error('Import survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to import survey'
      }
    });
  }
});

/**
 * GET /api/surveys/:slug
 * Get survey by slug for responding
 */
router.get('/:slug', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { token } = req.query;
    const survey = await Survey.findOne({ slug, is_active: true });

    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found'
        }
      });
      return;
    }

    // Check if survey is public or user owns it
    const isOwner = req.user && survey.user_id.toString() === req.user.id;
    let hasValidToken = false;

    // If survey is private and user doesn't own it, check for invitation token
    if (!survey.is_public && !isOwner) {
      if (token && typeof token === 'string') {
        // Import InvitationToken model
        const { InvitationToken } = await import('../models/InvitationToken');
        
        // Validate invitation token
        const invitation = await InvitationToken.findOne({
          token,
          survey_id: survey._id,
          is_active: true
        });

        if (invitation) {
          // Check if token is expired
          if (invitation.expires_at && new Date() > invitation.expires_at) {
            res.status(403).json({
              success: false,
              error: {
                code: 'INVITATION_EXPIRED',
                message: 'This invitation has expired'
              }
            });
            return;
          }

          // Check if usage limit exceeded
          if (invitation.max_uses && invitation.usage_count >= invitation.max_uses) {
            res.status(403).json({
              success: false,
              error: {
                code: 'INVITATION_USAGE_EXCEEDED',
                message: 'This invitation has reached its usage limit'
              }
            });
            return;
          }

          hasValidToken = true;
          
          // Increment usage count
          await InvitationToken.updateOne(
            { _id: invitation._id },
            { $inc: { usage_count: 1 } }
          );
        }
      }

      if (!hasValidToken) {
        res.status(403).json({
          success: false,
          error: {
            code: 'SURVEY_PRIVATE',
            message: 'This survey is private. You need a valid invitation link to access it.'
          }
        });
        return;
      }
    }

    // Check if survey is closed
    if (survey.configuration.settings.close_date && new Date() > survey.configuration.settings.close_date) {
      res.status(410).json({
        success: false,
        error: {
          code: 'SURVEY_CLOSED',
          message: 'This survey is no longer accepting responses'
        }
      });
      return;
    }

    // Check if user already responded (always check for authenticated users)
    if (req.user) {
      const existingResponse = await SurveyResponse.findOne({
        survey_id: survey._id,
        user_id: req.user.id
      });
      if (existingResponse) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_RESPONDED',
            message: 'You have already responded to this survey'
          }
        });
        return;
      }
    }

    // For anonymous users, check by IP address if one_response_per_user is enabled
    if (!req.user && survey.configuration.settings.one_response_per_user) {
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const existingResponse = await SurveyResponse.findOne({
        survey_id: survey._id,
        user_id: null,
        ip_address: clientIP
      });
      if (existingResponse) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_RESPONDED',
            message: 'A response has already been submitted from this location'
          }
        });
        return;
      }
    }

    const responseCount = await SurveyResponse.countDocuments({ survey_id: survey._id });

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          questions: survey.configuration.questions,
          settings: survey.configuration.settings,
          response_count: responseCount,
          created_at: survey.created_at
        }
      }
    });
  } catch (error: any) {
    console.error('Get survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch survey'
      }
    });
  }
});

/**
 * POST /api/surveys/:slug/responses
 * Submit survey response
 */
router.post('/:slug/responses', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { error, value } = submitResponseSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid response data',
          details: error.details[0].message
        }
      });
      return;
    }

    const { responses, respondent_email, completion_time, started_at } = value;
    const survey = await Survey.findOne({ slug, is_active: true });

    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found'
        }
      });
      return;
    }

    // Check if survey allows anonymous responses
    if (!survey.configuration.settings.allow_anonymous && !req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'This survey requires authentication'
        }
      });
      return;
    }

    // Check if user already responded (always check for authenticated users)
    if (req.user) {
      const existingResponse = await SurveyResponse.findOne({
        survey_id: survey._id,
        user_id: req.user.id
      });
      if (existingResponse) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_RESPONDED',
            message: 'You have already responded to this survey'
          }
        });
        return;
      }
    }

    // For anonymous users, check by IP address if one_response_per_user is enabled
    if (!req.user && survey.configuration.settings.one_response_per_user) {
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const existingResponse = await SurveyResponse.findOne({
        survey_id: survey._id,
        user_id: null,
        ip_address: clientIP
      });
      if (existingResponse) {
        res.status(409).json({
          success: false,
          error: {
            code: 'ALREADY_RESPONDED',
            message: 'A response has already been submitted from this location'
          }
        });
        return;
      }
    }

    // Validate responses against survey questions
    const questions = survey.configuration.questions;
    const responseData: any = {};
    
    for (const question of questions) {
      const response = responses[question.id];
      
      // Check required questions
      if (question.required && (response === undefined || response === null || response === '')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'REQUIRED_QUESTION',
            message: `Question "${question.question}" is required`
          }
        });
        return;
      }
      
      if (response !== undefined && response !== null && response !== '') {
        responseData[question.id] = response;
      }
    }

    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Parse device information from user agent
    const userAgent = req.headers['user-agent'] || '';
    const { parseUserAgent } = await import('../utils/deviceDetection');
    const deviceInfo = parseUserAgent(userAgent);
    
    const surveyResponse = new SurveyResponse({
      survey_id: survey._id,
      user_id: req.user?.id || null,
      response_data: responseData,
      respondent_email: respondent_email || null,
      is_anonymous: !req.user && !respondent_email, // Only truly anonymous if no user AND no email provided
      ip_address: clientIP,
      completion_time: completion_time || null,
      started_at: started_at ? new Date(started_at) : null,
      device_info: deviceInfo
    });

    await surveyResponse.save();

    res.status(201).json({
      success: true,
      data: {
        response_id: surveyResponse._id,
        message: 'Response submitted successfully'
      }
    });
  } catch (error: any) {
    console.error('Submit response error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit response'
      }
    });
  }
});

/**
 * PUT /api/surveys/:id/visibility
 * Toggle survey visibility (public/private)
 */
router.put('/:id/visibility', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { is_public } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    if (typeof is_public !== 'boolean') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'is_public must be a boolean value'
        }
      });
      return;
    }

    const survey = await Survey.findOne({ _id: id, user_id: userId });
    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found'
        }
      });
      return;
    }

    // Update visibility
    survey.is_public = is_public;
    survey.configuration.settings.is_public = is_public;
    
    // If making survey public, ensure allow_import is set
    if (is_public && survey.allow_import === undefined) {
      survey.allow_import = true;
    }

    await survey.save();

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          is_public: survey.is_public,
          allow_import: survey.allow_import,
          updated_at: survey.updated_at
        }
      }
    });
  } catch (error: any) {
    console.error('Update survey visibility error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update survey visibility'
      }
    });
  }
});

/**
 * PUT /api/surveys/:id
 * Update survey
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    const { error, value } = updateSurveySchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid survey data',
          details: error.details[0].message
        }
      });
      return;
    }

    const survey = await Survey.findOne({ _id: id, user_id: userId });
    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found'
        }
      });
      return;
    }

    const { title, description, questions, settings } = value;
    
    if (title) survey.title = title;
    if (description !== undefined) survey.description = description;
    if (questions) survey.configuration.questions = questions;
    if (settings) {
      survey.configuration.settings = { ...survey.configuration.settings, ...settings };
      if (settings.is_public !== undefined) survey.is_public = settings.is_public;
    }

    await survey.save();

    const responseCount = await SurveyResponse.countDocuments({ survey_id: survey._id });

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          slug: survey.slug,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/survey/${survey.slug}`,
          questions: survey.configuration.questions,
          settings: survey.configuration.settings,
          is_public: survey.is_public,
          is_active: survey.is_active,
          created_at: survey.created_at,
          updated_at: survey.updated_at,
          response_count: responseCount
        }
      }
    });
  } catch (error: any) {
    console.error('Update survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update survey'
      }
    });
  }
});

/**
 * GET /api/surveys/analytics
 * Get analytics data for user's surveys
 */
router.get('/analytics/data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const timeRange = req.query.range as string || '30d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get user's surveys
    const surveys = await Survey.find({ user_id: userId });
    const surveyIds = surveys.map(s => s._id);

    // Get total responses
    const totalResponses = await SurveyResponse.countDocuments({ 
      survey_id: { $in: surveyIds }
    });

    // Get responses in time range
    const recentResponses = await SurveyResponse.countDocuments({
      survey_id: { $in: surveyIds },
      submitted_at: { $gte: startDate }
    });

    // Get survey performance data with real metrics
    const surveyPerformance = await Promise.all(
      surveys.map(async (survey) => {
        const responseCount = await SurveyResponse.countDocuments({ survey_id: survey._id });
        const recentResponseCount = await SurveyResponse.countDocuments({
          survey_id: survey._id,
          submitted_at: { $gte: startDate }
        });
        
        // Calculate average completion time for this survey
        const responsesWithTime = await SurveyResponse.find({ 
          survey_id: survey._id,
          completion_time: { $exists: true, $gt: 0 }
        });
        const averageCompletionTime = responsesWithTime.length > 0 
          ? responsesWithTime.reduce((sum, r) => sum + (r.completion_time || 0), 0) / responsesWithTime.length 
          : null;
        
        // Calculate days since creation for more accurate rate calculation
        const daysSinceCreation = Math.max(1, Math.floor((now.getTime() - new Date(survey.created_at).getTime()) / (1000 * 60 * 60 * 24)));
        const responsesPerDay = responseCount / daysSinceCreation;
        
        // Calculate completion rate (assuming 100 views per response as baseline)
        const estimatedViews = Math.max(responseCount * 3, responseCount + 50); // More realistic view estimation
        const completionRate = responseCount > 0 ? (responseCount / estimatedViews) * 100 : 0;
        
        return {
          id: survey._id,
          title: survey.title,
          responseCount,
          recentResponseCount,
          responseRate: Math.min(completionRate, 100), // Cap at 100%
          responsesPerDay: Math.round(responsesPerDay * 10) / 10, // Round to 1 decimal
          averageCompletionTime: averageCompletionTime ? Math.round(averageCompletionTime) : null,
          daysSinceCreation,
          isActive: survey.is_active,
          isPublic: survey.is_public,
          questionCount: survey.configuration.questions.length,
          created_at: survey.created_at
        };
      })
    );

    // Sort by response count for top performing
    const topPerforming = surveyPerformance
      .sort((a, b) => b.responseCount - a.responseCount)
      .slice(0, 5);

    // Recent activity - get latest responses across all surveys
    const recentResponseDocuments = await SurveyResponse.find({
      survey_id: { $in: surveyIds },
      submitted_at: { $gte: startDate }
    })
    .sort({ submitted_at: -1 })
    .limit(10)
    .populate('survey_id', 'title');

    // Group recent responses by survey
    const activityMap = new Map();
    recentResponseDocuments.forEach(response => {
      const surveyId = response.survey_id._id.toString();
      const surveyTitle = (response.survey_id as any).title;
      
      if (!activityMap.has(surveyId)) {
        activityMap.set(surveyId, {
          id: surveyId,
          surveyTitle,
          responseCount: 0,
          date: response.submitted_at
        });
      }
      activityMap.get(surveyId).responseCount++;
    });

    const recentActivity = Array.from(activityMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Generate time-based response data based on selected range
    const responsesByTime: Array<{ month: string; responses: number }> = [];
    
    if (timeRange === '7d') {
      // Show daily data for 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        const dayResponses = await SurveyResponse.countDocuments({
          survey_id: { $in: surveyIds },
          submitted_at: { $gte: dayStart, $lt: dayEnd }
        });
        
        responsesByTime.push({
          month: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          responses: dayResponses
        });
      }
    } else if (timeRange === '30d') {
      // Show weekly data for 30 days (4 weeks)
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        const weekResponses = await SurveyResponse.countDocuments({
          survey_id: { $in: surveyIds },
          submitted_at: { $gte: weekStart, $lte: weekEnd }
        });
        
        responsesByTime.push({
          month: `Week ${4 - i}`,
          responses: weekResponses
        });
      }
    } else if (timeRange === '90d') {
      // Show monthly data for 3 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999); // Include the entire last day
        
        const monthResponses = await SurveyResponse.countDocuments({
          survey_id: { $in: surveyIds },
          submitted_at: { $gte: monthStart, $lte: monthEnd }
        });
        
        responsesByTime.push({
          month: months[monthDate.getMonth()],
          responses: monthResponses
        });
      }
    } else {
      // Show monthly data for 1 year (12 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999); // Include the entire last day
        
        const monthResponses = await SurveyResponse.countDocuments({
          survey_id: { $in: surveyIds },
          submitted_at: { $gte: monthStart, $lte: monthEnd }
        });
        
        responsesByTime.push({
          month: months[monthDate.getMonth()],
          responses: monthResponses
        });
      }
    }

    // Debug logging for response trends
    console.log(`Analytics Debug - Time Range: ${timeRange}`);
    console.log(`Analytics Debug - Survey IDs: ${surveyIds.length}`);
    console.log(`Analytics Debug - Total Responses: ${totalResponses}`);
    console.log(`Analytics Debug - Response Trends:`, responsesByTime.map(r => `${r.month}: ${r.responses}`).join(', '));

    // Calculate real statistics
    const averageResponseRate = surveyPerformance.length > 0 
      ? surveyPerformance.reduce((sum, s) => sum + s.responseRate, 0) / surveyPerformance.length 
      : 0;

    // Calculate overall average completion time
    const allResponsesWithTime = await SurveyResponse.find({ 
      survey_id: { $in: surveyIds },
      completion_time: { $exists: true, $gt: 0 }
    });
    const overallAverageCompletionTime = allResponsesWithTime.length > 0 
      ? Math.round(allResponsesWithTime.reduce((sum, r) => sum + (r.completion_time || 0), 0) / allResponsesWithTime.length)
      : null;

    const activeSurveys = surveys.filter(s => s.is_active).length;
    const publicSurveys = surveys.filter(s => s.is_public).length;
    const totalQuestions = surveys.reduce((sum, s) => sum + s.configuration.questions.length, 0);
    const averageQuestionsPerSurvey = surveys.length > 0 ? totalQuestions / surveys.length : 0;

    // Calculate response trends
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime()));
    
    const previousPeriodResponses = await SurveyResponse.countDocuments({
      survey_id: { $in: surveyIds },
      submitted_at: { $gte: previousPeriodStart, $lt: startDate }
    });

    const responseGrowth = previousPeriodResponses > 0 
      ? ((recentResponses - previousPeriodResponses) / previousPeriodResponses) * 100 
      : recentResponses > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        totalSurveys: surveys.length,
        totalResponses,
        recentResponses,
        averageResponseRate,
        overallAverageCompletionTime: overallAverageCompletionTime,
        responsesWithTiming: allResponsesWithTime.length,
        activeSurveys,
        publicSurveys,
        totalQuestions,
        averageQuestionsPerSurvey: Math.round(averageQuestionsPerSurvey * 10) / 10,
        responseGrowth: Math.round(responseGrowth * 10) / 10,
        topPerformingSurveys: topPerforming,
        recentActivity,
        responsesByMonth: responsesByTime,
        timeRange
      }
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch analytics data'
      }
    });
  }
});

/**
 * GET /api/surveys/:id/analytics
 * Get detailed analytics for a specific survey
 */
router.get('/:id/analytics', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    const survey = await Survey.findOne({ _id: id, user_id: userId });
    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found'
        }
      });
      return;
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ survey_id: survey._id }).sort({ submitted_at: -1 });
    
    // Calculate question analytics
    const questionAnalytics: any = {};
    const questions = survey.configuration.questions;
    
    questions.forEach(question => {
      const questionResponses = responses
        .map(r => r.response_data[question.id])
        .filter(r => r !== undefined && r !== null && r !== '');
      
      const totalResponses = questionResponses.length;
      const responseRate = responses.length > 0 ? (totalResponses / responses.length) * 100 : 0;
      
      // Calculate response distribution
      const distribution: { [key: string]: number } = {};
      let averageRating: number | undefined;
      
      if (question.type === 'rating') {
        // For rating questions, calculate average and distribution
        const ratings = questionResponses.map(r => parseFloat(r)).filter(r => !isNaN(r));
        if (ratings.length > 0) {
          averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        }
        
        ratings.forEach(rating => {
          const key = rating.toString();
          distribution[key] = (distribution[key] || 0) + 1;
        });
      } else if (question.type === 'multiple_choice' || question.type === 'dropdown') {
        // For choice questions, count each option
        questionResponses.forEach(response => {
          const key = response.toString();
          distribution[key] = (distribution[key] || 0) + 1;
        });
      } else if (question.type === 'checkbox') {
        // For checkbox questions, count each selected option
        questionResponses.forEach(response => {
          if (Array.isArray(response)) {
            response.forEach(option => {
              distribution[option] = (distribution[option] || 0) + 1;
            });
          }
        });
      } else {
        // For text questions, group similar responses or show word count
        questionResponses.forEach(response => {
          const key = response.toString().substring(0, 50); // Truncate long responses
          distribution[key] = (distribution[key] || 0) + 1;
        });
      }
      
      // Find most common answer
      const mostCommonAnswer = Object.entries(distribution)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      questionAnalytics[question.id] = {
        type: question.type,
        question: question.question,
        totalResponses,
        responseDistribution: distribution,
        averageRating,
        mostCommonAnswer,
        responseRate
      };
    });

    // Calculate demographics and timeline data
    const responsesByDate: { [date: string]: number } = {};
    const responsesByHour: { [hour: number]: number } = {};
    
    responses.forEach(response => {
      // Ensure we have a valid date
      const submittedDate = new Date(response.submitted_at);
      if (!isNaN(submittedDate.getTime())) {
        const dateKey = submittedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const hour = submittedDate.getHours();
        
        responsesByDate[dateKey] = (responsesByDate[dateKey] || 0) + 1;
        responsesByHour[hour] = (responsesByHour[hour] || 0) + 1;
      }
    });

    // Convert to arrays for frontend
    const responsesByDateArray = Object.entries(responsesByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Ensure all 24 hours are represented
    const responsesByHourArray = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: responsesByHour[hour] || 0
    }));

    // Calculate completion rate (assuming all responses are complete for now)
    const completionRate = 100; // This could be enhanced with partial response tracking

    // Calculate average completion time
    const responsesWithTime = responses.filter(r => r.completion_time && r.completion_time > 0);
    const averageCompletionTime = responsesWithTime.length > 0 
      ? Math.round(responsesWithTime.reduce((sum, r) => sum + r.completion_time!, 0) / responsesWithTime.length)
      : null;

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          questions: survey.configuration.questions,
          responseCount: responses.length,
          createdAt: survey.created_at
        },
        responses: responses.map(r => ({
          id: (r._id as mongoose.Types.ObjectId).toString(),
          submitted_at: r.submitted_at,
          is_anonymous: r.is_anonymous,
          respondent_email: r.respondent_email,
          response_data: r.response_data,
          completion_time: r.completion_time,
          started_at: r.started_at
        })),
        questionAnalytics,
        demographics: {
          responsesByDate: responsesByDateArray,
          responsesByHour: responsesByHourArray,
          completionRate,
          averageCompletionTime
        }
      }
    });
  } catch (error: any) {
    console.error('Survey analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch survey analytics'
      }
    });
  }
});

/**
 * GET /api/surveys/:id/export
 * Export survey data in JSON or CSV format
 */
router.get('/:id/export', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    const survey = await Survey.findOne({ _id: id, user_id: userId });
    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found'
        }
      });
      return;
    }

    const responses = await SurveyResponse.find({ survey_id: survey._id }).sort({ submitted_at: -1 });
    
    // Calculate timing statistics
    const responsesWithTime = responses.filter(r => r.completion_time && r.completion_time > 0);
    const averageCompletionTime = responsesWithTime.length > 0 
      ? Math.round(responsesWithTime.reduce((sum, r) => sum + r.completion_time!, 0) / responsesWithTime.length)
      : null;

    if (format === 'csv') {
      // Generate CSV with timing data
      const questions = survey.configuration.questions;
      const headers = [
        'Response ID', 
        'Submitted At', 
        'Started At',
        'Completion Time (seconds)',
        'Completion Time (minutes)',
        'Is Anonymous', 
        'Respondent Email',
        'IP Address',
        ...questions.map(q => q.question)
      ];
      
      const csvRows = [
        headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
        ...responses.map(response => {
          const completionTimeSeconds = response.completion_time || null;
          const completionTimeMinutes = completionTimeSeconds ? Math.round((completionTimeSeconds / 60) * 100) / 100 : null;
          
          const row = [
            `"${(response._id as mongoose.Types.ObjectId).toString()}"`,
            `"${response.submitted_at.toISOString()}"`,
            `"${response.started_at ? response.started_at.toISOString() : ''}"`,
            `"${completionTimeSeconds !== null ? completionTimeSeconds : ''}"`,
            `"${completionTimeMinutes !== null ? completionTimeMinutes : ''}"`,
            `"${response.is_anonymous.toString()}"`,
            `"${response.respondent_email || ''}"`,
            `"${response.ip_address || ''}"`,
            ...questions.map(q => {
              const answer = response.response_data[q.id];
              if (Array.isArray(answer)) {
                return `"${answer.join('; ').replace(/"/g, '""')}"`;
              }
              return `"${(answer || '').toString().replace(/"/g, '""')}"`;
            })
          ];
          return row.join(',');
        })
      ];
      
      // Add summary row with average completion time
      if (averageCompletionTime) {
        csvRows.push('');
        csvRows.push('SUMMARY STATISTICS');
        csvRows.push(`Average Completion Time (seconds),${averageCompletionTime}`);
        csvRows.push(`Average Completion Time (minutes),${Math.round((averageCompletionTime / 60) * 100) / 100}`);
        csvRows.push(`Total Responses,${responses.length}`);
        csvRows.push(`Responses with Timing Data,${responsesWithTime.length}`);
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="survey-${survey.title.replace(/[^a-z0-9]/gi, '_')}-data.csv"`);
      res.send(csvRows.join('\n'));
    } else {
      // Generate JSON with timing data
      const exportData = {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          questions: survey.configuration.questions,
          settings: survey.configuration.settings,
          created_at: survey.created_at
        },
        responses: responses.map(r => ({
          id: (r._id as mongoose.Types.ObjectId).toString(),
          submitted_at: r.submitted_at,
          started_at: r.started_at || null,
          completion_time_seconds: r.completion_time || null,
          completion_time_minutes: r.completion_time ? Math.round((r.completion_time / 60) * 100) / 100 : null,
          is_anonymous: r.is_anonymous,
          respondent_email: r.respondent_email || null,
          response_data: r.response_data,
          ip_address: r.ip_address || null
        })),
        analytics: {
          total_responses: responses.length,
          responses_with_timing: responsesWithTime.length,
          average_completion_time_seconds: averageCompletionTime,
          average_completion_time_minutes: averageCompletionTime ? Math.round((averageCompletionTime / 60) * 100) / 100 : null,
          fastest_completion_seconds: responsesWithTime.length > 0 ? Math.min(...responsesWithTime.map(r => r.completion_time!)) : null,
          slowest_completion_seconds: responsesWithTime.length > 0 ? Math.max(...responsesWithTime.map(r => r.completion_time!)) : null
        },
        export_metadata: {
          exported_at: new Date().toISOString(),
          total_responses: responses.length,
          exported_by: req.user!.email
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="survey-${survey.title.replace(/[^a-z0-9]/gi, '_')}-data.json"`);
      res.json(exportData);
    }
  } catch (error: any) {
    console.error('Survey export error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export survey data'
      }
    });
  }
});

/**
 * GET /api/surveys/public/:id/analytics
 * Get public analytics for a specific survey
 */
router.get('/public/:id/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    // Find public survey
    const survey = await Survey.findOne({ 
      _id: id, 
      is_public: true, 
      is_active: true 
    });

    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Public survey not found'
        }
      });
      return;
    }

    // Get all responses for this survey
    const responses = await SurveyResponse.find({ survey_id: survey._id }).sort({ submitted_at: -1 });
    
    // Calculate question analytics
    const questionAnalytics: any = {};
    
    survey.configuration.questions.forEach(question => {
      const questionResponses = responses
        .map(r => r.response_data[question.id])
        .filter(response => response !== undefined && response !== null && response !== '');

      if (questionResponses.length === 0) {
        questionAnalytics[question.id] = {
          type: question.type,
          question: question.question,
          totalResponses: 0,
          data: []
        };
        return;
      }

      switch (question.type) {
        case 'rating':
          const ratings = questionResponses.map(r => parseInt(r)).filter(r => !isNaN(r));
          const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
          const ratingDistribution = Array.from({ length: (question.max_rating || 5) - (question.min_rating || 1) + 1 }, (_, i) => {
            const rating = (question.min_rating || 1) + i;
            return {
              rating,
              count: ratings.filter(r => r === rating).length,
              percentage: ratings.length > 0 ? (ratings.filter(r => r === rating).length / ratings.length) * 100 : 0
            };
          });
          
          questionAnalytics[question.id] = {
            type: question.type,
            question: question.question,
            totalResponses: ratings.length,
            averageRating: Math.round(averageRating * 100) / 100,
            distribution: ratingDistribution
          };
          break;

        case 'multiple_choice':
        case 'dropdown':
          const choiceDistribution = (question.options || []).map(option => ({
            option,
            count: questionResponses.filter(r => r === option).length,
            percentage: questionResponses.length > 0 ? (questionResponses.filter(r => r === option).length / questionResponses.length) * 100 : 0
          }));
          
          questionAnalytics[question.id] = {
            type: question.type,
            question: question.question,
            totalResponses: questionResponses.length,
            distribution: choiceDistribution
          };
          break;

        case 'checkbox':
          const allSelectedOptions: string[] = [];
          questionResponses.forEach(response => {
            if (Array.isArray(response)) {
              allSelectedOptions.push(...response);
            } else if (typeof response === 'string') {
              allSelectedOptions.push(response);
            }
          });
          
          const checkboxDistribution = (question.options || []).map(option => ({
            option,
            count: allSelectedOptions.filter(selected => selected === option).length,
            percentage: questionResponses.length > 0 ? (allSelectedOptions.filter(selected => selected === option).length / questionResponses.length) * 100 : 0
          }));
          
          questionAnalytics[question.id] = {
            type: question.type,
            question: question.question,
            totalResponses: questionResponses.length,
            distribution: checkboxDistribution
          };
          break;

        default:
          questionAnalytics[question.id] = {
            type: question.type,
            question: question.question,
            totalResponses: questionResponses.length,
            data: questionResponses.slice(0, 100) // Limit to first 100 text responses for privacy
          };
      }
    });

    // Calculate demographics and timing data
    const demographics = {
      totalResponses: responses.length,
      responsesByHour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: responses.filter(r => new Date(r.submitted_at).getHours() === hour).length
      })),
      responsesByDay: Array.from({ length: 7 }, (_, day) => ({
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
        count: responses.filter(r => new Date(r.submitted_at).getDay() === day).length
      }))
    };

    // Calculate completion time statistics (only for responses with timing data)
    const responsesWithTiming = responses.filter(r => r.completion_time && r.completion_time > 0);
    const completionTimes = responsesWithTiming.map(r => r.completion_time).filter((time): time is number => time !== undefined && time !== null);
    
    const timingStats = completionTimes.length > 0 ? {
      averageCompletionTime: Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length),
      medianCompletionTime: completionTimes.sort((a, b) => a - b)[Math.floor(completionTimes.length / 2)] || 0,
      fastestCompletion: Math.min(...completionTimes),
      slowestCompletion: Math.max(...completionTimes),
      responsesWithTiming: responsesWithTiming.length
    } : {
      averageCompletionTime: null,
      medianCompletionTime: null,
      fastestCompletion: null,
      slowestCompletion: null,
      responsesWithTiming: 0
    };

    res.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          created_at: survey.created_at,
          questions: survey.configuration.questions
        },
        responses: responses.length,
        questionAnalytics,
        demographics,
        timingStats
      }
    });
  } catch (error: any) {
    console.error('Public survey analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch survey analytics'
      }
    });
  }
});

/**
 * GET /api/surveys/public/:id/export/csv
 * Export public survey responses as CSV
 */
router.get('/public/:id/export/csv', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    // Find public survey
    const survey = await Survey.findOne({ 
      _id: id, 
      is_public: true, 
      is_active: true 
    });

    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Public survey not found'
        }
      });
      return;
    }

    const responses = await SurveyResponse.find({ survey_id: survey._id }).sort({ submitted_at: -1 });
    
    if (responses.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NO_RESPONSES',
          message: 'No responses found for this survey'
        }
      });
      return;
    }

    // Create CSV headers
    const headers = ['Response ID', 'Submitted At', 'Completion Time (seconds)', 'Is Anonymous'];
    survey.configuration.questions.forEach(question => {
      headers.push(`"${question.question.replace(/"/g, '""')}"`);
    });

    // Create CSV rows
    const rows = responses.map(response => {
      const row = [
        `"${(response._id as mongoose.Types.ObjectId).toString()}"`,
        `"${response.submitted_at.toISOString()}"`,
        response.completion_time ? response.completion_time.toString() : '',
        response.is_anonymous ? 'Yes' : 'No'
      ];
      
      survey.configuration.questions.forEach(question => {
        const answer = response.response_data[question.id];
        if (answer !== undefined && answer !== null) {
          if (Array.isArray(answer)) {
            row.push(`"${answer.join(', ').replace(/"/g, '""')}"`);
          } else {
            row.push(`"${answer.toString().replace(/"/g, '""')}"`);
          }
        } else {
          row.push('""');
        }
      });
      
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="survey-${survey.title.replace(/[^a-z0-9]/gi, '_')}-responses.csv"`);
    res.send(csvContent);
  } catch (error: any) {
    console.error('Public CSV export error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export CSV'
      }
    });
  }
});

/**
 * GET /api/surveys/public/:id/export/json
 * Export public survey responses as JSON
 */
router.get('/public/:id/export/json', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    // Find public survey
    const survey = await Survey.findOne({ 
      _id: id, 
      is_public: true, 
      is_active: true 
    });

    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Public survey not found'
        }
      });
      return;
    }

    const responses = await SurveyResponse.find({ survey_id: survey._id }).sort({ submitted_at: -1 });
    
    // Calculate analytics
    const responsesWithTiming = responses.filter(r => r.completion_time && r.completion_time > 0);
    const completionTimes = responsesWithTiming.map(r => r.completion_time).filter((time): time is number => time !== undefined && time !== null);
    
    const analytics = {
      total_responses: responses.length,
      responses_with_timing: responsesWithTiming.length,
      average_completion_time_seconds: completionTimes.length > 0 
        ? Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length)
        : null,
      fastest_completion_seconds: completionTimes.length > 0 ? Math.min(...completionTimes) : null,
      slowest_completion_seconds: completionTimes.length > 0 ? Math.max(...completionTimes) : null,
      anonymous_responses: responses.filter(r => r.is_anonymous).length,
      authenticated_responses: responses.filter(r => !r.is_anonymous).length
    };

    const exportData = {
      survey: {
        id: survey._id,
        title: survey.title,
        description: survey.description,
        created_at: survey.created_at,
        questions: survey.configuration.questions,
        settings: survey.configuration.settings
      },
      responses: responses.map(response => ({
        id: response._id,
        submitted_at: response.submitted_at,
        completion_time_seconds: response.completion_time || null,
        is_anonymous: response.is_anonymous,
        response_data: response.response_data
      })),
      analytics,
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_type: 'json',
        total_records: responses.length
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="survey-${survey.title.replace(/[^a-z0-9]/gi, '_')}-data.json"`);
    res.json(exportData);
  } catch (error: any) {
    console.error('Public JSON export error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export JSON'
      }
    });
  }
});

/**
 * DELETE /api/surveys/:id
 * Delete survey
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid survey ID'
        }
      });
      return;
    }

    const survey = await Survey.findOne({ _id: id, user_id: userId });
    if (!survey) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SURVEY_NOT_FOUND',
          message: 'Survey not found'
        }
      });
      return;
    }

    // Delete all responses for this survey
    await SurveyResponse.deleteMany({ survey_id: survey._id });
    
    // Delete the survey
    await Survey.deleteOne({ _id: survey._id });

    res.json({
      success: true,
      message: 'Survey deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete survey error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete survey'
      }
    });
  }
});

export default router;
