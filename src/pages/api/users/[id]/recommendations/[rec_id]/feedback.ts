import type { NextApiRequest, NextApiResponse } from "next";
import type { SubmitRecommendationFeedbackCommand } from "../../../../../../types";

/**
 * API handler for feedback on recommendations
 * POST /api/users/[id]/recommendations/[rec_id]/feedback
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Extract IDs from the URL
    const userId = Array.isArray(req.query.id) ? parseInt(req.query.id[0] || "") : parseInt(req.query.id || "");

    const recId = Array.isArray(req.query.rec_id)
      ? parseInt(req.query.rec_id[0] || "")
      : parseInt(req.query.rec_id || "");

    // Validate IDs
    if (isNaN(userId) || isNaN(recId)) {
      return res.status(400).json({
        error: "Invalid user ID or recommendation ID",
      });
    }

    // Parse request body
    const body = req.body as SubmitRecommendationFeedbackCommand;

    // Validate feedback type
    if (!body.feedback_type || !["like", "dislike"].includes(body.feedback_type)) {
      return res.status(400).json({
        error: "Invalid feedback type. Must be 'like' or 'dislike'",
      });
    }

    // In a real implementation, we would:
    // 1. Verify that the recommendation belongs to the user
    // 2. Check if feedback already exists and update it, or create new feedback
    // 3. Handle database interactions

    // For now, we'll simulate saving the feedback
    const feedback = {
      id: Math.floor(Math.random() * 10000),
      recommendation_id: recId,
      user_id: userId,
      feedback_type: body.feedback_type,
      created_at: new Date().toISOString(),
    };

    // Return success response
    return res.status(201).json({
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return res.status(500).json({
      error: "An error occurred while processing your feedback",
    });
  }
}
