import mongoose, { Document, Schema } from 'mongoose';

export interface ICognitiveProfile extends Document {
  userId: mongoose.Types.ObjectId;
  logicalThinking: number;
  visualLearning: number;
  memory: number;
  readingSkill: number;
  problemSolving: number;
  learningStyle?: string;
  recommendations: string[];
  lastUpdated: Date;
}

const CognitiveProfileSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  logicalThinking: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  visualLearning: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  memory: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  readingSkill: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  problemSolving: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  learningStyle: {
    type: String,
    default: 'Not analyzed',
  },
  recommendations: {
    type: [String],
    default: [],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
CognitiveProfileSchema.index({ userId: 1 });

export default mongoose.model<ICognitiveProfile>('CognitiveProfile', CognitiveProfileSchema);
