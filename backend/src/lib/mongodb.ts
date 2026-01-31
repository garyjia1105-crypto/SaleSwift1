import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env');
}

let connected = false;

export async function connectDB(): Promise<void> {
  if (connected) return;
  try {
    await mongoose.connect(MONGODB_URI);
    connected = true;
    console.log('MongoDB connected');
  } catch (e) {
    console.error('MongoDB connection failed:', e);
    throw e;
  }
}

// User schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    displayName: { type: String },
    avatar: { type: String },
    language: { type: String, default: 'zh' },
    theme: { type: String, default: 'classic' },
    authProvider: { type: String, enum: ['email', 'google'], required: true },
  },
  { timestamps: true }
);
export const User = mongoose.model('User', userSchema);

// Customer schema
const customerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    company: { type: String, required: true },
    role: { type: String, default: '' },
    industry: { type: String, default: '' },
    email: { type: String },
    phone: { type: String },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);
customerSchema.index({ userId: 1, createdAt: -1 });
export const Customer = mongoose.model('Customer', customerSchema);

// Interaction schema
const interactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    date: { type: String, default: '' },
    rawInput: { type: String, default: '' },
    customerProfile: { type: mongoose.Schema.Types.Mixed },
    intelligence: { type: mongoose.Schema.Types.Mixed },
    metrics: { type: mongoose.Schema.Types.Mixed },
    suggestions: { type: [String], default: [] },
  },
  { timestamps: true }
);
interactionSchema.index({ userId: 1, customerId: 1 });
export const Interaction = mongoose.model('Interaction', interactionSchema);

// Schedule schema
const scheduleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String },
    description: { type: String },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  },
  { timestamps: true }
);
scheduleSchema.index({ userId: 1, customerId: 1 });
export const Schedule = mongoose.model('Schedule', scheduleSchema);

// CoursePlan schema
const coursePlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    title: { type: String, required: true },
    objective: { type: String, default: '' },
    modules: [
      {
        name: String,
        topics: [String],
        duration: String,
      },
    ],
    resources: { type: [String], default: [] },
  },
  { timestamps: true }
);
coursePlanSchema.index({ userId: 1, customerId: 1 });
export const CoursePlan = mongoose.model('CoursePlan', coursePlanSchema);
