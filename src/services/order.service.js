import mongoose from "mongoose";
import moment from "moment";
import { orderModel } from "../models/oder.model.js";
import { ProductModel } from "../models/product.model.js";
import { cityModal } from "../models/city.modal.js";
import { addCityValidation, addOrderValidation } from "../shared/validation.js";
import { PaymentType, cityStatus, orderStatus, StockStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";
import { createPaymentIntentService } from "../services/payment.service.js";

//////////////////////////////////////// Add Order  //////////////////////////
export const addOrderService = async (data) => {
  const { error } = addOrderValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const isCheckPaymentType = Object.values(PaymentType).includes(data.paymentMethod);
  if (!isCheckPaymentType) throw HttpError.badRequest("Invalid Payment Type");

  let subtotal = 0;
  let totalDiscount = 0;
  let shippingFees = 0;
  let total = 0;
  let newStockWithVariantArrayObj = [];
  let orderItems = [];

  //   is checking qty,discount,subtotal and new Stock With VariantArray Obj Create
  newStockWithVariantArrayObj = await Promise.all(
    data.product.map(async (product) => {
      let stockStatus = "";

      const result = await ProductModel.findOne(
        { _id: product.productId },

        {
          variant: {
            $elemMatch: {
              variantId: product.variantId,
              stock: { $gte: product.qty },
            },
          },
        }
      );

      if (result.variant[0] === undefined) throw HttpError.notFound("stock no more");

      const productVariant = result.variant[0];

      if (productVariant.discountStatus === true) {
        const itemTotalDiscount = (productVariant.oldPrice - productVariant.newPrice) * product.qty;

        totalDiscount += itemTotalDiscount;
      }

      const itemTotal = productVariant.newPrice * product.qty;
      subtotal += itemTotal;

      const variantNewStock = Number(productVariant.stock) - Number(product.qty);

      if (variantNewStock > 0) {
        stockStatus = StockStatus.inStock;
      } else {
        stockStatus = StockStatus.outOfStock;
      }

      const variantNewObj = {
        stock: variantNewStock,
        variantId: product.variantId,
        stockStatus: stockStatus,
        productId: product.productId,
      };

      newStockWithVariantArrayObj = {
        ...newStockWithVariantArrayObj,
        ...variantNewObj,
      };

      return newStockWithVariantArrayObj;
    })
  );

  orderItems = await Promise.all(
    data.product.map(async (product) => {
      const result = await ProductModel.findOne(
        { _id: product.productId },

        {
          variant: {
            $elemMatch: {
              variantId: product.variantId,
            },
          },
        }
      );

      const productVariant = result.variant[0];

      const orderItem = {
        qty: product.qty,
        variantId: product.variantId,
        productId: product.productId,
        price: productVariant.newPrice,
      };

      orderItems = {
        ...orderItems,
        ...orderItem,
      };

      return orderItems;
    })
  );

  const cityInfo = await cityModal.findById({ _id: data.cityId });
  if (!cityInfo) throw HttpError.notFound("cityId Invalid");
  if (cityInfo.status === cityStatus.deactivate)
    throw HttpError.badRequest(`Correctly shipping city is ${cityStatus.deactivate}`);

  shippingFees = cityInfo.deliverCharges;
  total = Number(subtotal) + Number(shippingFees);

  const contactInfo = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phoneNumber,
    address1: data.address1,
    address2: data.address2,
    cityId: data.cityId,
  };

  // reduce stock product variant
  await Promise.all(
    newStockWithVariantArrayObj.map(async (variant) => {
      await ProductModel.updateOne(
        { _id: variant.productId, "variant.variantId": variant.variantId },
        {
          $set: {
            "variant.$.stock": variant.stock,
            "variant.$.stockStatus": variant.stockStatus,
          },
        }
      );
    })
  );

  if (PaymentType.cashOnDelivery === data.paymentMethod) {
    const saveOrder = new orderModel({
      orderStatus: orderStatus.processing,
      contactInfo: contactInfo,
      product: orderItems,
      paymentMethod: data.paymentMethod,
      subTotal: subtotal,
      discount: totalDiscount,
      shippingFees: shippingFees,
      total: total,
    });

    const savedOrder = await saveOrder.save();
    return savedOrder;
  } else {
    const initOrder = new orderModel({
      orderStatus: orderStatus.pending,
      contactInfo: contactInfo,
      product: orderItems,
      paymentMethod: data.paymentMethod,
      subTotal: subtotal,
      discount: totalDiscount,
      shippingFees: shippingFees,
      total: total,
    });

    const savedOrder = await initOrder.save();

    const clientSecret = await createPaymentIntentService(savedOrder.orderId, savedOrder.total);

    const updatedCity = await orderModel.updateOne(
      { orderId: savedOrder.orderId },
      {
        $set: { "paymentInfo.clientSecret": clientSecret },
      }
    );

    return savedOrder;
  }
};

//////////////////////////////////////// Display All Order  ///////////////////////////////////////////////

export const displayAllOrderService = async (request) => {
  const { page, per_page, search, status } = request;

  let query = {};

  if (status) {
    query.orderStatus = { $regex: status };
  }

  if (search) {
    query.orderId = { $regex: search };
  }

  const options = {
    page: page,
    lean: true,
    limit: per_page,

    populate: [
      {
        path: "contactInfo",
        populate: {
          path: "cityId",
          select: {
            cityName: 1,
            deliverCharges: 1,
          },
        },
      },

      {
        path: "product",
        populate: {
          path: "productId",
          select: {
            productName: 1,
            category: 1,
            variant: 1,
            productCode: 1,
            createdAt: 1,
          },
          populate: {
            path: "category",
            select: { categoryName: 1 },
          },
        },
      },
    ],
    sort: {
      createdAt: -1,
    },
  };

  const allOrder = await orderModel.paginate(query, options);
  return allOrder;
};

//////////////////////////////////////// Get Order ID  ///////////////////////////////////////////////
export const OrderByIdService = async (id) => {
  const order = await orderModel.findOne({ orderId: id }).populate([
    {
      path: "contactInfo",
      populate: {
        path: "cityId",
        select: {
          cityName: 1,
          deliverCharges: 1,
        },
      },
    },
    {
      path: "product",
      populate: {
        path: "productId",
        select: {
          productName: 1,
          primaryImage: 1,
          category: 1,
          variant: {
            discountStatus: 1,
            newPrice: 1,
            variantName: 1,
            variantId: 1,
          },
          productCode: 1,
          createdAt: 1,
        },
        populate: {
          path: "category",
          select: { categoryName: 1 },
        },
      },
    },
  ]);

  if (!order) throw HttpError.notFound("Invalid order Id");
  return order;
};

//////////////////////////////////////// Get Order Cancel  ///////////////////////////////////////////////
export const CancelOrderServices = async (id) => {
  const ObjectId = mongoose.Types.ObjectId;

  const order = await orderModel.findOne({ orderId: id });
  if (!order) throw HttpError.notFound("Invalid order Id");

  if (order.orderStatus !== orderStatus.processing)
    throw HttpError.badRequest(`Sorry currently order status ${order.orderStatus}`);

  await Promise.all(
    order.product.map(async (item) => {
      const filterVariantWithProduct = await ProductModel.aggregate([
        {
          $unwind: "$variant",
        },
        {
          $match: {
            _id: ObjectId(item.productId),
            "variant.variantId": item.variantId,
          },
        },
        {
          $project: {
            productName: 1,
            "variant.variantId": 1,
            "variant.stock": 1,
          },
        },
      ]);

      const newStock = Number(filterVariantWithProduct.pop().variant?.stock) + Number(item.qty);

      await ProductModel.updateOne(
        { _id: item.productId, "variant.variantId": item.variantId },
        {
          $set: {
            "variant.$.stock": newStock,
            "variant.$.stockStatus": StockStatus.inStock,
          },
        }
      );
    })
  );

  await orderModel.updateOne(
    { orderId: id },
    {
      $set: { orderStatus: orderStatus.reject },
    }
  );
  const message = "Successfully Order Cancel";
  return message;
};

//////////////////////////////////////// Get Order ID Admin And Staff  ///////////////////////////////////////////////
export const OrderByIdServiceAdmin = async (id) => {
  const order = await orderModel.findOne({ orderId: id }).populate([
    {
      path: "contactInfo",
      populate: {
        path: "cityId",
        select: {
          cityName: 1,
          deliverCharges: 1,
        },
      },
    },
    {
      path: "product",
      populate: {
        path: "productId",
        select: {
          productName: 1,
          primaryImage: 1,
          category: 1,
          variant: {
            discountStatus: 1,
            newPrice: 1,
            variantName: 1,
            variantId: 1,
          },
          productCode: 1,
          createdAt: 1,
        },
        populate: {
          path: "category",
          select: { categoryName: 1 },
        },
      },
    },
  ]);

  return order;
};

//////////////////////////////////////// complete order  ///////////////////////////////////////////////
export const CompleteOrderServices = async (id) => {
  const order = await orderModel.findOne({ orderId: id });
  if (!order) throw HttpError.notFound("Invalid order Id");

  if (order.orderStatus !== orderStatus.processing)
    throw HttpError.badRequest(`sorry ...currently order status ${order.orderStatus}`);

  await orderModel.updateOne(
    { orderId: id },
    {
      $set: { orderStatus: orderStatus.complete },
    }
  );

  return id;
};

////////////////////////////////////////  order count  ///////////////////////////////////////////////
export const OrderCountServices = async (request) => {
  const { startDate, endDate } = request;
  try {
    const query = {
      createdAt: {
        $gte: `${moment(startDate).startOf("day").toDate()}`,
        $lte: `${moment(endDate).endOf("day").toDate()}`,
      },
      orderStatus: { $nin: [orderStatus.pending, orderStatus.reject] },
    };
    const order = await orderModel.count(query);
    return order;
  } catch (error) {
    throw error;
  }
};

////////////////////////////////////////  order total  ///////////////////////////////////////////////
export const OrderTotalServices = async (request) => {
  const { startDate, endDate } = request;
  try {
    const query = {
      createdAt: {
        $gte: `${moment(startDate).startOf("day").toDate()}`,
        $lte: `${moment(endDate).endOf("day").toDate()}`,
      },
      orderStatus: { $nin: [orderStatus.pending, orderStatus.reject] },
    };
    const order = await orderModel.find(query);

    const total = order.reduce((previousValue, currentObj) => {
      return Number(previousValue) + Number(currentObj.total);
    }, 0);
    return total;
  } catch (error) {
    throw error;
  }
};

////////////////////////////////////////  order chart data  ///////////////////////////////////////////////
export const OrderWeekChartData = async (request) => {
  const { numberOfDate } = request;
  try {
    const today = moment().endOf("day");

    const last7Days = moment().subtract(Number(numberOfDate), "days").startOf("day");

    const dateFormat = "YYYY-MM-DD";

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: last7Days.toDate(), $lte: today.toDate() },
          orderStatus: { $nin: [orderStatus.pending, orderStatus.reject] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          orderCount: { $sum: 1 },
          totalOrderAmount: { $sum: "$total" },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          orderCount: 1,
          totalOrderAmount: 1,
        },
      },
    ];

    const result = await orderModel.aggregate(pipeline);

    const datesArray = Array.from({ length: Number(numberOfDate) }, (_, index) =>
      moment(today).subtract(index, "days").startOf("day").toDate()
    );

    const completeResult = datesArray.map((date) => {
      const match = result.find(
        (item) => moment(item.date).format(dateFormat) === moment(date).format(dateFormat)
      );
      return {
        date,
        orderCount: match ? match.orderCount : 0,
        totalOrderAmount: match ? match.totalOrderAmount : 0,
      };
    });

    return completeResult;
  } catch (error) {
    throw error;
  }
};

export const ProductWeeklySale = async () => {
  const today = moment().endOf("day");
  const last7Days = moment().subtract(7, "days").startOf("day");

  const query = {
    createdAt: {
      $gte: `${moment(last7Days).startOf("day").toDate()}`,
      $lte: `${moment(today).endOf("day").toDate()}`,
    },
    orderStatus: { $nin: [orderStatus.pending, orderStatus.reject] },
  };

  const order = await orderModel.find(query).populate([
    {
      path: "product",
      populate: {
        path: "productId",
        select: {
          productName: 1,
          productCode: 1,
        },
      },
    },
  ]);

  const finalFilterProduct = order.reduce((result, item) => {
    item.product.forEach((orderItem) => {
      const existingProductIndex = result.findIndex(
        (product) => product.productCode === orderItem.productId.productCode
      );
      if (existingProductIndex !== -1) {
        result[existingProductIndex].qty += orderItem.qty;
      } else {
        result.push({
          productCode: orderItem.productId.productCode,
          qty: orderItem.qty,
          productName: orderItem.productId.productName,
        });
      }
    });
    return result;
  }, []);

  return finalFilterProduct;
};
