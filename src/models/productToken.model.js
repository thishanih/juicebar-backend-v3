import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { tokenStatus } from "../shared/constants.js";

let ProductTokenSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    status: {
      type: String,
      require: true,
      enum: tokenStatus,
      default: tokenStatus.active,
    },
  },
  {
    timestamps: true,
  }
);

ProductTokenSchema.plugin(mongoosePaginate);
export const ProductTokenModel = mongoose.model("ProductToken", ProductTokenSchema);
