import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { randomUUID } from "crypto";
import { PaymentType, orderStatus } from "../shared/constants.js";
import { contactModal } from "./sub/contact.subModal.js";
import { orderProductModal } from "./sub/orderProduct.subModel.js";
import { paymentModal } from "./sub/onlinePayment.subModal.js";

let orderSchema = mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: function () {
        return "Inv-" + randomUUID();
      },
    },
    customerAccessTokenHash: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      select: false,
    },
    orderStatus: {
      type: String,
      require: true,
      enum: orderStatus,
      default: orderStatus.pending,
    },
    contactInfo: {
      require: true,
      type: contactModal,
    },
    product: {
      require: true,
      type: [orderProductModal],
      default: [],
    },
    paymentMethod: {
      type: String,
      require: true,
      enum: PaymentType,
    },
    paymentInfo: {
      type: paymentModal,
      default: {},
    },
    subTotal: {
      type: Number,
      require: true,
    },
    discount: {
      type: Number,
    },
    shippingFees: {
      type: Number,
      require: true,
    },
    profit: {
      type: Number,
      require: true,
    },
    total: {
      type: Number,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ "paymentInfo.paymentId": 1 }, { unique: true, sparse: true });
orderSchema.index({ "paymentInfo.eventId": 1 }, { unique: true, sparse: true });
orderSchema.plugin(mongoosePaginate);
export const orderModel = mongoose.model("Order", orderSchema);
