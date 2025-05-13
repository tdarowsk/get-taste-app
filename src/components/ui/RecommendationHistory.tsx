import React, { useState, useEffect, useCallback } from "react";
import type {
  RecommendationHistoryDTO,
  RecommendationWithFeedbackDTO,
  RecommendationFeedbackType,
} from "../../types";

interface RecommendationHistoryProps {
  userId: string;
  className?: string;
}

const RecommendationHistory: React.FC<RecommendationHistoryProps> = ({ userId, className }) => {
  const [history, setHistory] = useState<RecommendationWithFeedbackDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: "",
    feedbackType: "",
  });
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    count: 0,
  });

  // Fetch recommendation history
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      if (filters.type) {
        queryParams.append("type", filters.type);
      }

      if (filters.feedbackType) {
        queryParams.append("feedback_type", filters.feedbackType);
      }

      queryParams.append("limit", pagination.limit.toString());
      queryParams.append("offset", pagination.offset.toString());

      const response = await fetch(
        `/api/users/${userId}/recommendation-history?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendation history: ${response.statusText}`);
      }

      const data: RecommendationHistoryDTO = await response.json();
      setHistory(data.data);
      setPagination((prev) => ({ ...prev, count: data.count }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [userId, filters, pagination.offset, pagination.limit]);

  // Fetch history when component mounts or filters/pagination changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle type filter change
  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, type: e.target.value }));
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset to first page
  };

  // Handle feedback type filter change
  const handleFeedbackTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, feedbackType: e.target.value }));
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset to first page
  };

  // Handle pagination
  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.count) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination((prev) => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit),
      }));
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get color classes based on feedback type
  const getFeedbackColorClasses = (feedbackType: RecommendationFeedbackType) => {
    switch (feedbackType) {
      case "like":
        return "bg-green-100 text-green-800 border-green-300";
      case "dislike":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className={`recommendation-history ${className || ""}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Your Recommendation History</h2>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full sm:w-auto">
            <label
              htmlFor="content-type-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Content Type
            </label>
            <select
              id="content-type-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.type}
              onChange={handleTypeFilterChange}
            >
              <option value="">All Types</option>
              <option value="music">Music</option>
              <option value="film">Film</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label
              htmlFor="feedback-type-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Feedback
            </label>
            <select
              id="feedback-type-filter"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.feedbackType}
              onChange={handleFeedbackTypeFilterChange}
            >
              <option value="">All Feedback</option>
              <option value="like">Liked</option>
              <option value="dislike">Disliked</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <p>Error: {error}</p>
          <button
            className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
            onClick={fetchHistory}
          >
            Try Again
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center text-gray-500">
          <p className="text-lg mb-2">No recommendation history found</p>
          <p>Try changing the filters or come back after rating some recommendations.</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {history.map((item) => (
              <div
                key={`${item.recommendation.id}-${item.feedback.id}`}
                className="border rounded-lg overflow-hidden shadow-sm"
              >
                <div className="p-4 bg-white border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {item.recommendation.data.title ||
                          `${item.recommendation.type.charAt(0).toUpperCase() + item.recommendation.type.slice(1)} Recommendation`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(item.recommendation.created_at)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getFeedbackColorClasses(item.feedback.feedback_type)}`}
                    >
                      {item.feedback.feedback_type === "like" ? "Liked" : "Disliked"}
                    </span>
                  </div>

                  {item.recommendation.data.description && (
                    <p className="mt-2 text-gray-600">{item.recommendation.data.description}</p>
                  )}
                </div>

                {item.recommendation.data.items && item.recommendation.data.items.length > 0 && (
                  <div className="p-4 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Items:</h4>
                    <ul className="space-y-2">
                      {item.recommendation.data.items.map((recommendedItem) => (
                        <li key={recommendedItem.id} className="text-sm">
                          <span className="font-medium">{recommendedItem.name}</span>
                          <span className="ml-2 text-gray-500">({recommendedItem.type})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 bg-gray-100 text-right">
                  <span className="text-xs text-gray-500">
                    Feedback given {formatDate(item.feedback.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-500">
              Showing {pagination.offset + 1} to{" "}
              {Math.min(pagination.offset + history.length, pagination.count)} of {pagination.count}{" "}
              results
            </div>
            <div className="flex space-x-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
              >
                Previous
              </button>
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleNextPage}
                disabled={pagination.offset + pagination.limit >= pagination.count}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecommendationHistory;
