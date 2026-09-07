import mongoose from "mongoose";

const contactSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      require: true,
    },
    lastName: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
    },
    phone: {
      type: String,
      require: true,
    },
    address1: {
      type: String,
      require: true,
    },
    address2: {
      type: String,
      require: true,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "City",
    },
  },
  { _id: false }
);

export const contactModal = contactSchema;
