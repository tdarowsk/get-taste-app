import { Feedback } from "../models/Feedback";

export class FeedbackSubmittedEvent {
  constructor(public readonly feedback: Feedback) {}
}
