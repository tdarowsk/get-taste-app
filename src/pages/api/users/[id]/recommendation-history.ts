import type { NextApiRequest, NextApiResponse } from "next";
import type { RecommendationHistoryDTO, RecommendationWithFeedbackDTO } from "../../../../types";
import { RecommendationFeedbackType as FeedbackType } from "../../../../types";
import { supabaseClient } from "../../../../db/supabase.client";

// Type for row returned by the RPC get_recommendation_history view
interface RecommendationHistoryRow {
  recommendation_id: number;
  user_id: string;
  type: string;
  data: unknown;
  recommendation_created_at: string;
  feedback_id: number;
  feedback_type: FeedbackType;
  feedback_created_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const idParam = req.query.id;
  const recParam = req.query.rec_id;
  if (!idParam || Array.isArray(idParam)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  const userId = parseInt(idParam as string, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "User ID must be a number" });
  }

  if (req.method === "DELETE") {
    // Remove a liked recommendation (feedback) by recommendation ID
    if (!recParam || Array.isArray(recParam)) {
      return res.status(400).json({ message: "Invalid recommendation ID" });
    }
    const recId = parseInt(recParam as string, 10);
    if (isNaN(recId)) {
      return res.status(400).json({ message: "Recommendation ID must be a number" });
    }
    // @ts-ignore: recommendation_feedback table may not be in types
    const { error: deleteError } = await (supabaseClient as any)
      .from("recommendation_feedback")
      .delete()
      .eq("recommendation_id", recId)
      .eq("user_id", userId);
    if (deleteError) {
      console.error("Error deleting feedback:", deleteError);
      return res.status(500).json({ message: "Failed to delete recommendation" });
    }
    // Return no content
    return res.status(204).send(undefined);
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const type = req.query.type as string | undefined;
    const feedbackType = req.query.feedback_type as string | undefined;
    const limit = parseInt((req.query.limit as string) || "10", 10);
    const offset = parseInt((req.query.offset as string) || "0", 10);

    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return res.status(400).json({ message: "Invalid limit or offset values" });
    }

    if (feedbackType && !Object.values(FeedbackType).includes(feedbackType as FeedbackType)) {
      return res.status(400).json({ message: "Invalid feedback type" });
    }

    if (type && type !== "music" && type !== "film") {
      return res.status(400).json({ message: "Invalid recommendation type" });
    }

    // Fetch real history via RPC get_recommendation_history
    // @ts-ignore: RPC function may not be in types
    const { data: rows, error: rpcError } = await (supabaseClient as any).rpc("get_recommendation_history", {
      user_uuid: userId,
    });
    if (rpcError) {
      console.error("Error fetching recommendation history:", rpcError);
      return res.status(500).json({ message: "Failed to fetch history" });
    }
    const historyRows = (rows || []) as RecommendationHistoryRow[];
    // Map rows to RecommendationWithFeedbackDTO
    const mapped: RecommendationWithFeedbackDTO[] = historyRows.map((r) => ({
      recommendation: {
        id: r.recommendation_id,
        user_id: Number(r.user_id),
        type: r.type,
        data: r.data as any,
        created_at: r.recommendation_created_at,
      },
      feedback: {
        id: r.feedback_id,
        recommendation_id: r.recommendation_id,
        user_id: Number(r.user_id),
        feedback_type: r.feedback_type,
        created_at: r.feedback_created_at,
      },
    }));

    let filteredHistory = mapped;
    if (type) {
      filteredHistory = filteredHistory.filter((item) => item.recommendation.type === type);
    }
    if (feedbackType) {
      filteredHistory = filteredHistory.filter((item) => item.feedback.feedback_type === feedbackType);
    }
    // Sort and paginate
    filteredHistory.sort(
      (a, b) => new Date(b.feedback.created_at).getTime() - new Date(a.feedback.created_at).getTime()
    );
    const paginated = filteredHistory.slice(offset, offset + limit);
    const response: RecommendationHistoryDTO = {
      data: paginated,
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
