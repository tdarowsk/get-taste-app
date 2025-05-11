// Domain models
export * from "./domain/models/Recommendation";
export * from "./domain/models/RecommendationItem";
export * from "./domain/models/Feedback";
export * from "./domain/models/MetadataInsight";
export * from "./domain/models/MetadataItem";

// Domain enums
export * from "./domain/enums/RecommendationType";
export * from "./domain/enums/FeedbackType";
export * from "./domain/enums/MetadataType";

// UI components
export * from "./ui/components/RecommendationsView";

// UI hooks
export * from "./ui/hooks/useRecommendations";

// Application use cases (only exported for testing or specific use cases)
export * from "./application/useCases/GetRecommendationsUseCase";
export * from "./application/useCases/SubmitFeedbackUseCase";
export * from "./application/useCases/GetMetadataInsightUseCase";
export * from "./application/useCases/UpdateMetadataWeightsUseCase";
