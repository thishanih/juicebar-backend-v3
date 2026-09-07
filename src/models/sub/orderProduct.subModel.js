import mongoose from "mongoose";

const orderProductSchema = mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Variant",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Product",
    },
    variantName: {
      type: String,
      require: true,
    },
    qty: {
      type: Number,
      require: true,
    },
    price: {
      type: Number,
      require: true,
    },
    discountPrice: {
      type: Number,
      require: true,
    },
    cost: {
      type: Number,
      require: true,
    },
  },
  { _id: false }
);

export const orderProductModal = orderProductSchema;
