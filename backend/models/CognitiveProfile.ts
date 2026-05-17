import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendedVideo {
  title: string;
  url: string;
  rationale: string;
}

export interface IReportGuideline {
  category: string;
  instruction: string;
}

export interface IRemedialPathItem {
  trait: string;
  score: number;
  videoUrl: string;
  videoTitle: string;
  improvementTip: string;
}

export interface ICognitiveProfile extends Document {
  userId: mongoose.Types.ObjectId;
  visualMemory: number;
  logicalReasoning: number;
  attentionFocus: number;
  processingSpeed: number;
  readingComprehension: number;
  learningStyle: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  recommendedVideos: IRecommendedVideo[];
  reportGuidelines: IReportGuideline[];
  detailedAnalysisReport: string;
  diagnosticSummary: string;
  remedialPath: IRemedialPathItem[];
  overallGrade: string;
  createdAt: Date;
}

const CognitiveProfileSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  visualMemory: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  logicalReasoning: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  attentionFocus: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  processingSpeed: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  readingComprehension: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  learningStyle: {
    type: String,
    enum: ['visual', 'logical', 'verbal', 'kinesthetic'],
    required: true,
  },
  strengths: {
    type: [String],
    default: [],
  },
  weaknesses: {
    type: [String],
    default: [],
  },
  recommendations: {
    type: [String],
    default: [],
  },
  recommendedVideos: {
    type: [{
      title: { type: String, required: true },
      url: { type: String, required: true },
      rationale: { type: String, required: true },
    }],
    default: [],
  },
  reportGuidelines: {
    type: [{
      category: { type: String, required: true },
      instruction: { type: String, required: true },
    }],
    default: [],
  },
  detailedAnalysisReport: {
    type: String,
    default: '',
  },
  diagnosticSummary: {
    type: String,
    default: '',
  },
  remedialPath: {
    type: [{
      trait: { type: String, required: true },
      score: { type: Number, required: true },
      videoUrl: { type: String, required: true },
      videoTitle: { type: String, required: true },
      improvementTip: { type: String, required: true },
    }],
    default: [],
  },
  overallGrade: {
    type: String,
    default: 'Developing Learner',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
CognitiveProfileSchema.index({ userId: 1 });

export default mongoose.model<ICognitiveProfile>('CognitiveProfile', CognitiveProfileSchema);
