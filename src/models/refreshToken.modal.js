import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: {
    type: String,
    required: true,
  },
  familyId: {
    type: String,
    required: true,
    index: true,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: Number(process.env.RESET_TOKEN_SCE),
  },
});

// Create a Mongoose model based on the schema
export const RefreshTokenModel = mongoose.model("tokens", tokenSchema);
