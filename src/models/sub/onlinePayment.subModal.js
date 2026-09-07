import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    paymentId: {
      type: String,
    },
    clientSecret: {
      type: String,
    },
    logFile: {
      type: Object,
    },
  },
  {
    timestamps: true,
  },
  { _id: false }
);

export const paymentModal = paymentSchema;
