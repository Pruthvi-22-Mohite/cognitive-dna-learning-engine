import mongoose, { Document, Schema } from 'mongoose';

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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
CognitiveProfileSchema.index({ userId: 1 });

export default mongoose.model<ICognitiveProfile>('CognitiveProfile', CognitiveProfileSchema);
