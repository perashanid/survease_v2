import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Segment, Survey } from '../models';
import { SegmentationService } from '../services/SegmentationService';
import mongoose from 'mongoose';

const router = express.Router();
const segmentationService = new SegmentationService();

// GET /api/segments/:surveyId
router.get('/:surveyId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user.userId;

    // Verify survey access
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (survey.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const segments = await Segment.find({
      survey_id: new mongoose.Types.ObjectId(surveyId),
      user_id: new mongoose.Types.ObjectId(userId)
    });

    res.json({ segments });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

// POST /api/segments/:surveyId
router.post('/:surveyId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user.userId;
    const { name, criteria, color } = req.body;

    if (!name || !criteria) {
      return res.status(400).json({ error: 'Name and criteria are required' });
    }

    // Verify survey access
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (survey.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const segment = new Segment({
      user_id: new mongoose.Types.ObjectId(userId),
      survey_id: new mongoose.Types.ObjectId(surveyId),
      name,
      criteria,
      color: color || '#3b82f6'
    });

    await segment.save();

    res.status(201).json({ segment });
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

// PUT /api/segments/:segmentId
router.put('/:segmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const userId = (req as any).user.userId;
    const { name, criteria, color } = req.body;

    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    if (segment.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (name) segment.name = name;
    if (criteria) segment.criteria = criteria;
    if (color) segment.color = color;

    await segment.save();

    res.json({ segment });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({ error: 'Failed to update segment' });
  }
});

// DELETE /api/segments/:segmentId
router.delete('/:segmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const userId = (req as any).user.userId;

    const segment = await Segment.findById(segmentId);
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    if (segment.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Segment.findByIdAndDelete(segmentId);

    res.json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
});

// POST /api/segments/:surveyId/compare
router.post('/:surveyId/compare', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const userId = (req as any).user.userId;
    const { segmentIds } = req.body;

    if (!Array.isArray(segmentIds) || segmentIds.length < 2 || segmentIds.length > 5) {
      return res.status(400).json({ error: 'Between 2 and 5 segment IDs required' });
    }

    // Verify survey access
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    if (survey.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get segments
    const segments = await Segment.find({
      _id: { $in: segmentIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      user_id: new mongoose.Types.ObjectId(userId),
      survey_id: new mongoose.Types.ObjectId(surveyId)
    });

    if (segments.length !== segmentIds.length) {
      return res.status(404).json({ error: 'One or more segments not found' });
    }

    const segmentData = segments.map(s => ({
      id: (s._id as mongoose.Types.ObjectId).toString(),
      name: s.name,
      criteria: s.criteria
    }));

    const comparison = await segmentationService.compareSegments(surveyId, segmentData);

    res.json({ comparison });
  } catch (error) {
    console.error('Error comparing segments:', error);
    res.status(500).json({ error: 'Failed to compare segments' });
  }
});

export default router;
