import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizResult extends Document {
  userId: mongoose.Types.ObjectId;
  quizType: string;
  score: number;
  timeTaken: number;
  accuracy: number;
  answers?: any[];
  date: Date;
}

const QuizResultSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quizType: {
    type: String,
    required: true,
    enum: ['memory', 'pattern', 'logic', 'reading', 'speed'],
  },
  score: {
    type: Number,
    required: true,
  },
  timeTaken: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  answers: {
    type: Array,
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
QuizResultSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);
