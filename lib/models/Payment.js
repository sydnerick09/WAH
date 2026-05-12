import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'mobile_money', 'bank_transfer'],
      default: 'card',
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    description: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    paystackResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
