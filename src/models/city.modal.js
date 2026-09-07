import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { cityStatus } from "../shared/constants.js";

let citySchema = mongoose.Schema(
  {
    cityName: {
      type: String,
      require: true,
    },
    deliverCharges: {
      type: String,
      require: true,
    },
    status: {
      type: String,
      require: true,
      enum: cityStatus,
      default: cityStatus.active,
    },
  },
  {
    timestamps: true,
  }
);

citySchema.plugin(mongoosePaginate);
export const cityModal = mongoose.model("City", citySchema);
