import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  age: number;
  class: number;
  parentEmail: string;
  password: string;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 8,
    max: 14,
  },
  class: {
    type: Number,
    required: [true, 'Class is required'],
    min: 4,
    max: 6,
  },
  parentEmail: {
    type: String,
    required: [true, 'Parent email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUser>('User', UserSchema);
