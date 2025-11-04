import express, { Request, Response } from 'express';
import { Notification } from '../models';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    const query: any = { user_id: userId };
    if (unreadOnly) {
      query.is_read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('related_user_id', 'first_name last_name email')
      .populate('related_survey_id', 'title slug');

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user_id: userId, is_read: false });

    res.json({
      success: true,
      data: {
        notifications: notifications.map(notif => ({
          id: notif._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          is_read: notif.is_read,
          created_at: notif.created_at,
          read_at: notif.read_at,
          related_survey: notif.related_survey_id ? {
            id: (notif.related_survey_id as any)._id,
            title: (notif.related_survey_id as any).title,
            slug: (notif.related_survey_id as any).slug
          } : null,
          related_user: notif.related_user_id ? {
            name: `${(notif.related_user_id as any).first_name || ''} ${(notif.related_user_id as any).last_name || ''}`.trim() || 'Anonymous'
          } : null
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        unread_count: unreadCount
      }
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch notifications'
      }
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOne({ _id: id, user_id: userId });

    if (!notification) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found'
        }
      });
      return;
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({
      success: true,
      data: {
        notification: {
          id: notification._id,
          is_read: notification.is_read,
          read_at: notification.read_at
        }
      }
    });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notification as read'
      }
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark all notifications as read'
      }
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await Notification.deleteOne({ _id: id, user_id: userId });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete notification'
      }
    });
  }
});

export default router;
