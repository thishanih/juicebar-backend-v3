import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import slug from "mongoose-slug-updater";
import { productStatus } from "../shared/constants.js";
import { imageModal } from "./sub/image.subModal.js";
import generateUniqueId from "generate-unique-id";

let productSchema = mongoose.Schema(
  {
    productName: {
      type: String,
      require: true,
    },
    productCode: {
      type: String,
      unique: true,
      default: function () {
        const id = generateUniqueId({
          length: 8,
        });
        return "pro-" + id;
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Category",
    },
    defaultVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
    },
    primaryImage: {
      type: String,
      require: true,
    },
    imageSet: {
      type: [imageModal],
      default: [],
    },
    productStatus: {
      type: String,
      require: true,
      enum: productStatus,
      default: productStatus.active,
    },
    primaryDescription: {
      type: String,
      required: true,
    },
    secondaryDescription: {
      type: String,
    },
    slug: {
      type: String,
      require: true,
      unique: true,
      slug: "productName",
    },
    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
      },
    ],
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(mongoosePaginate);
productSchema.plugin(slug);
export const ProductModel = mongoose.model("Product", productSchema);
