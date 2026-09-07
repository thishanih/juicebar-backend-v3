import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { userType, userStatus } from "../shared/constants.js";

let userSchema = mongoose.Schema(
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
      unique: true,
      require: true,
    },
    password: {
      type: String,
      require: true,
    },
    userType: {
      type: String,
      require: true,
      enum: userType,
    },
    image: {
      type: String,
      require: true,
    },
    branch: {
      type: String,
      require: true,
    },
    userStatus: {
      type: String,
      require: true,
      enum: userStatus,
      default: userStatus.active,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(mongoosePaginate);
export const userModel = mongoose.model("Users", userSchema);
