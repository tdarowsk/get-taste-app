import type { NextApiRequest, NextApiResponse } from "next";
import type { RecommendationHistoryDTO, RecommendationWithFeedbackDTO } from "../../../../types";
import { RecommendationFeedbackType as FeedbackType } from "../../../../types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const type = req.query.type as string | undefined;
    const feedbackType = req.query.feedback_type as string | undefined;
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "User ID must be a number" });
    }

    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return res.status(400).json({ message: "Invalid limit or offset values" });
    }

    if (feedbackType && !Object.values(FeedbackType).includes(feedbackType as FeedbackType)) {
      return res.status(400).json({ message: "Invalid feedback type" });
    }

    if (type && type !== "music" && type !== "film") {
      return res.status(400).json({ message: "Invalid recommendation type" });
    }

    // In a real implementation, we would query the database for recommendation history
    // For now, let's return mock data

    // Generate some mock data
    const mockHistory: RecommendationWithFeedbackDTO[] = [
      {
        recommendation: {
          id: 101,
          user_id: userId,
          type: "music",
          data: {
            title: "Rock Music for Your Taste",
            description: "Based on your preferences, we think you might enjoy these rock artists and albums.",
            items: [
              {
                id: "artist-1",
                name: "AC/DC",
                type: "artist",
                details: {
                  genres: ["hard rock", "rock"],
                  popularity: 85,
                },
              },
            ],
          },
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        },
        feedback: {
          id: 201,
          recommendation_id: 101,
          user_id: userId,
          feedback_type: FeedbackType.LIKE,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(), // 1 week ago + 1 hour
        },
      },
      {
        recommendation: {
          id: 102,
          user_id: userId,
          type: "music",
          data: {
            title: "Pop Hits You Might Enjoy",
            description: "Based on your preferences, we think you might enjoy these pop artists and albums.",
            items: [
              {
                id: "artist-3",
                name: "Taylor Swift",
                type: "artist",
                details: {
                  genres: ["pop", "country pop"],
                  popularity: 95,
                },
              },
            ],
          },
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        },
        feedback: {
          id: 202,
          recommendation_id: 102,
          user_id: userId,
          feedback_type: FeedbackType.DISLIKE,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 1800000).toISOString(), // 5 days ago + 30 minutes
        },
      },
      {
        recommendation: {
          id: 201,
          user_id: userId,
          type: "film",
          data: {
            title: "Action Films for Your Taste",
            description: "Based on your preferences, we think you might enjoy these action films.",
            items: [
              {
                id: "movie-1",
                name: "The Dark Knight",
                type: "movie",
                details: {
                  director: "Christopher Nolan",
                  year: 2008,
                  genres: ["action", "crime", "drama"],
                },
              },
            ],
          },
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        },
        feedback: {
          id: 203,
          recommendation_id: 201,
          user_id: userId,
          feedback_type: FeedbackType.LIKE,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 7200000).toISOString(), // 3 days ago + 2 hours
        },
      },
      {
        recommendation: {
          id: 202,
          user_id: userId,
          type: "film",
          data: {
            title: "Drama Films for Your Taste",
            description: "Based on your preferences, we think you might enjoy these drama films.",
            items: [
              {
                id: "movie-4",
                name: "The Shawshank Redemption",
                type: "movie",
                details: {
                  director: "Frank Darabont",
                  year: 1994,
                  genres: ["drama"],
                },
              },
            ],
          },
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        },
        feedback: {
          id: 204,
          recommendation_id: 202,
          user_id: userId,
          feedback_type: FeedbackType.LIKE,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3600000).toISOString(), // 1 day ago + 1 hour
        },
      },
    ];

    // Apply filters if provided
    let filteredHistory = [...mockHistory];

    if (type) {
      filteredHistory = filteredHistory.filter((item) => item.recommendation.type === type);
    }

    if (feedbackType) {
      filteredHistory = filteredHistory.filter((item) => item.feedback.feedback_type === feedbackType);
    }

    // Sort by most recent feedback
    filteredHistory.sort(
      (a, b) => new Date(b.feedback.created_at).getTime() - new Date(a.feedback.created_at).getTime()
    );

    // Apply pagination
    const paginatedHistory = filteredHistory.slice(offset, offset + limit);

    const response: RecommendationHistoryDTO = {
      data: paginatedHistory,
      count: filteredHistory.length,
      limit,
      offset,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error processing recommendation history request:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
