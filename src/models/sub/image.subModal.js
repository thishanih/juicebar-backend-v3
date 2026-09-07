import mongoose from "mongoose";

const imageSchema = mongoose.Schema({
  url: {
    type: String,
    require: true,
  },
});

export const imageModal = imageSchema;
