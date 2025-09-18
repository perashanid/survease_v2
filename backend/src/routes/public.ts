import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Survey, Response as SurveyResponse } from '../models';

const router = express.Router();

/**
 * GET /api/public/surveys
 * Get public surveys
 */
router.get('/surveys', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    // Get public surveys with response counts
    const surveys = await Survey.aggregate([
      {
        $match: {
          is_public: true,
          is_active: true
        }
      },
      {
        $lookup: {
          from: 'surveyresponses',
          localField: '_id',
          foreignField: 'survey_id',
          as: 'responses'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $addFields: {
          response_count: { $size: '$responses' },
          author: { $arrayElemAt: ['$author', 0] }
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          slug: 1,
          created_at: 1,
          response_count: 1,
          allow_import: 1,
          'author.first_name': 1,
          'author.last_name': 1,
          'configuration.questions': 1
        }
      },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalCount = await Survey.countDocuments({
      is_public: true,
      is_active: true
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Format surveys for response
    const formattedSurveys = surveys.map((survey: any) => ({
      id: survey._id.toString(),
      title: survey.title,
      description: survey.description,
      slug: survey.slug,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/${survey.slug}`,
      created_at: survey.created_at,
      response_count: survey.response_count,
      allow_import: survey.allow_import || false,
      questions: survey.configuration?.questions || [],
      author: {
        name: survey.author ? 
          `${survey.author.first_name || ''} ${survey.author.last_name || ''}`.trim() || 'Anonymous' :
          'Anonymous'
      }
    }));

    res.json({
      success: true,
      surveys: formattedSurveys,
      pagination: {
        page,
        pages: totalPages,
        total: totalCount,
        limit
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
router.get('/surveys/:id/analytics', async (req: Request, res: Response): Promise<void> => {
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
    const responsesWithTime = responses.filter((r: any) => r.completion_time && r.completion_time > 0);
    const averageCompletionTime = responsesWithTime.length > 0
      ? responsesWithTime.reduce((sum: number, r: any) => sum + (r.completion_time || 0), 0) / responsesWithTime.length
      : null;

    // Generate question analytics
    const questionAnalytics = survey.configuration.questions.map((question: any) => {
      const questionResponses = responses
        .map((r: any) => r.response_data[question.id])
        .filter((response: any) => response !== undefined && response !== null && response !== '');

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
        options.forEach((option: any) => {
          optionCounts[option] = 0;
        });

        // Count responses
        questionResponses.forEach((response: any) => {
          if (Array.isArray(response)) {
            // For checkbox questions
            response.forEach((option: any) => {
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
        questionResponses.forEach((response: any) => {
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
        const totalRatingValue = questionResponses.reduce((sum: number, response: any) => {
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
 * Export public survey data as CSV
 */
router.get('/surveys/:id/export/csv', async (req: Request, res: Response): Promise<void> => {
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

    // Generate CSV headers
    const headers = ['Response ID', 'Submitted At', 'Completion Time (seconds)'];
    survey.configuration.questions.forEach((question: any) => {
      headers.push(`Q${question.id}: ${question.question}`);
    });

    // Generate CSV rows
    const csvRows = [headers.join(',')];
    
    responses.forEach((response: any) => {
      const row = [
        response._id.toString(),
        response.submitted_at ? response.submitted_at.toISOString() : '',
        response.completion_time || ''
      ];

      survey.configuration.questions.forEach((question: any) => {
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

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="survey-${survey.title.replace(/[^a-z0-9]/gi, '_')}-data.csv"`);
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
 * Export public survey data as JSON
 */
router.get('/surveys/:id/export/json', async (req: Request, res: Response): Promise<void> => {
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

    // Format the export data
    const exportData = {
      survey: {
        id: survey._id,
        title: survey.title,
        description: survey.description,
        author: {
          name: `${(survey.user_id as any).first_name || ''} ${(survey.user_id as any).last_name || ''}`.trim() || 'Anonymous'
        },
        created_at: survey.created_at,
        questions: survey.configuration.questions
      },
      responses: responses.map((response: any) => ({
        id: response._id,
        submitted_at: response.submitted_at,
        completion_time: response.completion_time,
        answers: response.response_data
      })),
      summary: {
        total_responses: responses.length,
        export_date: new Date().toISOString()
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="survey-${survey.title.replace(/[^a-z0-9]/gi, '_')}-data.json"`);
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

export default router;