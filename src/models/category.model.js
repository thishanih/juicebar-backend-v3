import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import slug from "mongoose-slug-updater";
import { categoryStatus } from "../shared/constants.js";

let categorySchema = mongoose.Schema(
  {
    categoryName: {
      type: String,
      require: true,
    },
    image: {
      type: String,
      require: true,
    },
    categoryStatus: {
      type: String,
      require: true,
      enum: categoryStatus,
      default: categoryStatus.active,
    },
    description: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      require: true,
      unique: true,
      slug: "categoryName",
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.plugin(mongoosePaginate);
categorySchema.plugin(slug);
export const categoryModel = mongoose.model("Category", categorySchema);
