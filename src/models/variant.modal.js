import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import generateUniqueId from "generate-unique-id";

import { productStatus, StockStatus } from "../shared/constants.js";

let variantSchema = mongoose.Schema(
  {
    variantId: {
      type: String,
      require: true,
      unique: true,
      default: function () {
        const id = generateUniqueId({
          length: 8,
        });
        return "ltx-" + id;
      },
    },
    variantName: {
      type: String,
      require: true,
    },
    variantStatus: {
      type: String,
      require: true,
      enum: productStatus,
      default: productStatus.active,
    },
    discountStatus: {
      type: Boolean,
      default: false,
    },
    cost: {
      type: Number,
      require: true,
    },
    price: {
      type: Number,
      require: true,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      require: true,
    },
    stockStatus: {
      type: String,
      require: true,
      enum: StockStatus,
      default: StockStatus.inStock,
    },
  },
  {
    timestamps: true,
  }
);

variantSchema.plugin(mongoosePaginate);
export const variantModel = mongoose.model("Variant", variantSchema);
