import { Request, Response, NextFunction } from 'express';
import { AnalyticsCache } from '../models';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, prefix: string = ''): string {
  const { surveyId } = req.params;
  const queryString = JSON.stringify(req.query);
  const bodyString = JSON.stringify(req.body);
  
  const hash = crypto
    .createHash('md5')
    .update(`${surveyId}-${queryString}-${bodyString}`)
    .digest('hex');
  
  return `${prefix}:${hash}`;
}

/**
 * Cache middleware for analytics endpoints
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, keyPrefix = 'analytics' } = options; // Default 5 minutes

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const { surveyId } = req.params;
    if (!surveyId) {
      return next();
    }

    const cacheKey = generateCacheKey(req, keyPrefix);

    try {
      // Check if cached data exists and is not expired
      const cached = await AnalyticsCache.findOne({
        survey_id: surveyId,
        cache_key: cacheKey,
        expires_at: { $gt: new Date() }
      });

      if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return res.json(cached.data);
      }

      console.log(`Cache miss: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = function (data: any) {
        // Cache the response
        const expiresAt = new Date(Date.now() + ttl * 1000);
        
        AnalyticsCache.findOneAndUpdate(
          {
            survey_id: surveyId,
            cache_key: cacheKey
          },
          {
            survey_id: surveyId,
            cache_key: cacheKey,
            data,
            computed_at: new Date(),
            expires_at: expiresAt
          },
          {
            upsert: true,
            new: true
          }
        ).catch(err => {
          console.error('Cache save error:', err);
        });

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Invalidate cache for a survey
 */
export async function invalidateCache(surveyId: string, keyPrefix?: string) {
  try {
    const query: any = { survey_id: surveyId };
    
    if (keyPrefix) {
      query.cache_key = { $regex: `^${keyPrefix}:` };
    }

    const result = await AnalyticsCache.deleteMany(query);
    console.log(`Invalidated ${result.deletedCount} cache entries for survey ${surveyId}`);
    
    return result.deletedCount;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache() {
  try {
    const result = await AnalyticsCache.deleteMany({
      expires_at: { $lt: new Date() }
    });
    
    console.log(`Cleared ${result.deletedCount} expired cache entries`);
    return result.deletedCount;
  } catch (error) {
    console.error('Clear expired cache error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const total = await AnalyticsCache.countDocuments();
    const expired = await AnalyticsCache.countDocuments({
      expires_at: { $lt: new Date() }
    });
    const active = total - expired;

    // Get cache size by survey
    const bySurvey = await AnalyticsCache.aggregate([
      {
        $match: {
          expires_at: { $gt: new Date() }
        }
      },
      {
        $group: {
          _id: '$survey_id',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return {
      total,
      active,
      expired,
      topSurveys: bySurvey
    };
  } catch (error) {
    console.error('Get cache stats error:', error);
    return null;
  }
}

// Schedule periodic cache cleanup (run every hour)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    clearExpiredCache();
  }, 60 * 60 * 1000); // 1 hour
}
