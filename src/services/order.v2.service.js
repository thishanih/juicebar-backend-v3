import mongoose from "mongoose";
import { orderModel } from "../models/oder.model.js";
import { variantModel } from "../models/variant.modal.js";
import { cityModal } from "../models/city.modal.js";
import { addOrderValidation } from "../shared/validation.js";
import { PaymentType, cityStatus, orderStatus, StockStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";
import { createPaymentIntentService } from "../services/payment.service.js";

//////////////////////////////////////// Add Order  //////////////////////////
export const addOrderService = async (data) => {
  const { error } = addOrderValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const isCheckPaymentType = Object.values(PaymentType).includes(data.paymentMethod);
  if (!isCheckPaymentType) throw HttpError.badRequest("Invalid Payment Type");

  const orderItemsArrayObj = await Promise.all(
    data.product.map(async (currentObj) => {
      const result = await variantModel.findOne({
        _id: currentObj.variantId,
        stock: { $gte: currentObj.qty },
      });

      if (!result) throw HttpError.notFound("stock no more");

      const variantNewObj = {
        ...currentObj,
        ...{
          price: result.price,
          discountPrice: result.discountPrice,
          cost: result.cost,
          variantName: result.variantName,
          stock: result.stock,
        },
      };

      return variantNewObj;
    })
  );

  const orderDetails = orderItemsArrayObj.reduce(
    (perviousValue, currentValue) => {
      if (currentValue.discountPrice > 0) {
        const orderSale = currentValue.qty * currentValue.discountPrice;
        const orderCost = currentValue.qty * currentValue.cost;
        perviousValue.profit += orderSale - orderCost;
        perviousValue.subtotal += orderSale;
        perviousValue.discount +=
          currentValue.qty * (currentValue.price - currentValue.discountPrice);
      } else {
        const orderSale = currentValue.qty * currentValue.price;
        const orderCost = currentValue.qty * currentValue.cost;
        perviousValue.profit += orderSale - orderCost;
        perviousValue.subtotal += orderSale;
      }
      return perviousValue;
    },
    {
      profit: 0,
      subtotal: 0,
      discount: 0,
    }
  );

  const cityInfo = await cityModal.findById({ _id: data.cityId });
  if (!cityInfo) throw HttpError.notFound("cityId Invalid");

  if (cityInfo.status === cityStatus.deactivate)
    throw HttpError.badRequest(`Correctly shipping city is ${cityStatus.deactivate}`);

  orderDetails.shippingFees = +cityInfo.deliverCharges;
  orderDetails.total = Number(orderDetails.subtotal) + Number(cityInfo.deliverCharges);

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
    orderItemsArrayObj.map(async (variant) => {
      const currentStock = Number(variant.stock) - Number(variant.qty);
      const stockStatus = currentStock === 0 ? StockStatus.outOfStock : StockStatus.inStock;
      await variantModel.updateOne(
        { _id: variant.variantId },
        { $set: { stock: currentStock, stockStatus: stockStatus } }
      );
    })
  );

  const saveOrderItems = orderItemsArrayObj.map((orderItem) => {
    const { stock, ...order } = orderItem;
    return order;
  });

  if (PaymentType.cashOnDelivery === data.paymentMethod) {
    const saveOrder = new orderModel({
      orderStatus: orderStatus.processing,
      contactInfo: contactInfo,
      product: saveOrderItems,
      paymentMethod: data.paymentMethod,
      subTotal: orderDetails.subtotal,
      discount: orderDetails.discount,
      shippingFees: orderDetails.shippingFees,
      total: orderDetails.total,
      profit: orderDetails.profit,
    });
    const savedOrder = await saveOrder.save();
    return savedOrder;
  } else if (PaymentType.online === data.paymentMethod) {
    const initOrder = new orderModel({
      orderStatus: orderStatus.pending,
      contactInfo: contactInfo,
      product: saveOrderItems,
      paymentMethod: data.paymentMethod,
      subTotal: orderDetails.subtotal,
      discount: orderDetails.discount,
      shippingFees: orderDetails.shippingFees,
      total: orderDetails.total,
      profit: orderDetails.profit,
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
      populate: [
        {
          path: "variantId",
        },
        {
          path: "productId",
          select: {
            productName: 1,
            primaryImage: 1,
            category: 1,
            productCode: 1,
            createdAt: 1,
          },
          populate: {
            path: "category",
            select: { categoryName: 1 },
          },
        },
      ],
    },
  ]);

  return order;
};

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
        populate: [
          {
            path: "variantId",
          },
          {
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
        ],
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
  const order = await orderModel
    .findOne(
      { orderId: id },
      {
        profit: 0,
        product: {
          cost: 0,
        },
      }
    )
    .populate([
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
        populate: [
          {
            path: "variantId",
            select: {
              variantName: 1,
              price: 1,
              discountPrice: 1,
            },
          },
          {
            path: "productId",
            select: {
              productName: 1,
              primaryImage: 1,
              category: 1,
              productCode: 1,
              createdAt: 1,
            },
            populate: {
              path: "category",
              select: { categoryName: 1 },
            },
          },
        ],
      },
    ]);

  if (!order) throw HttpError.notFound("Invalid order Id");
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

//////////////////////////////////////// Get Order Cancel  ///////////////////////////////////////////////
export const CancelOrderServices = async (id) => {
  const currentOrder = await orderModel.findOne({ orderId: id });
  if (!currentOrder) throw HttpError.notFound("Invalid order Id");

  if (currentOrder.orderStatus !== orderStatus.processing)
    throw HttpError.badRequest(`Sorry currently order status ${order.orderStatus}`);

  await Promise.all(
    currentOrder.product.map(async (item) => {
      const variant = await variantModel.findOne({
        _id: item.variantId,
      });
      const newStock = Number(variant.stock) + Number(item.qty);
      await variantModel.updateOne(
        { _id: item.variantId },
        { $set: { stock: newStock, stockStatus: StockStatus.inStock } }
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
