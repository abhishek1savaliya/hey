import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    encryptedDescription: String, // For E2E encryption
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tagId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
    },
    files: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        filename: String,
        originalname: String,
        mimetype: String,
        size: Number,
        path: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalFileSize: {
      type: Number,
      default: 0,
    },
    expiryDate: Date,
    isExpired: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for user notes and search
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, tagId: 1 });

export default mongoose.models.Note || mongoose.model('Note', noteSchema);
