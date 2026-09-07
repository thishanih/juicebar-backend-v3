import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    paymentId: {
      type: String,
    },
    eventId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
  { _id: false }
);

export const paymentModal = paymentSchema;
