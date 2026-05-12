import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Writing',
        'Research',
        'Data Entry',
        'Design',
        'Transcription',
        'Survey',
        'Translation',
        'Other',
      ],
    },
    questions: {
      type: [String],
      default: [],
    },
    budget: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acceptedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    location: {
      type: String,
    },
    attachments: {
      type: [String],
      default: [],
    },
    deliverables: {
      type: [String],
      default: [],
    },
    reviews: [
      {
        reviewerId: mongoose.Schema.Types.ObjectId,
        rating: Number,
        comment: String,
        createdAt: Date,
      },
    ],
    isUrgent: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    applicants: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        appliedAt: Date,
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending',
        },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'disputed', 'refunded'],
      default: 'pending',
    },
    paymentReference: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model('Task', taskSchema);
