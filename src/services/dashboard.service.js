import moment from "moment";
import { orderModel } from "../models/oder.model.js";
import { PaymentType, orderStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";
import { dashboardDateRangeValidation } from "../shared/validation.js";

////////////////////////////////////////  order status count  ///////////////////////////////////////
export const OrderStatusCountByDateServices = async (request) => {
  const { error, value } = dashboardDateRangeValidation(request);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const start = moment(value.startDate).startOf("day");
  const end = moment(value.endDate).endOf("day");
  const statusCounts = Object.fromEntries(
    Object.keys(orderStatus).map((statusKey) => [statusKey, 0])
  );

  const results = await orderModel.aggregate([
    {
      $match: {
        createdAt: { $gte: start.toDate(), $lte: end.toDate() },
      },
    },
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
      },
    },
  ]);

  for (const result of results) {
    const statusKey = Object.keys(orderStatus).find((key) => orderStatus[key] === result._id);

    if (statusKey) statusCounts[statusKey] = result.count;
  }

  return {
    data: statusCounts,
    dataRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
  };
};

export const OrderIncomeSummaryServices = async (request) => {
  const { startDate, endDate } = request;
  const start = moment(startDate, moment.ISO_8601, true);
  const end = moment(endDate, moment.ISO_8601, true);

  if (!start.isValid() || !end.isValid()) {
    throw HttpError.badRequest("startDate and endDate must be valid ISO dates");
  }

  if (end.isBefore(start, "day")) {
    throw HttpError.badRequest("endDate must be greater than or equal to startDate");
  }

  if (end.isAfter(start.clone().add(1, "year").endOf("day"))) {
    throw HttpError.badRequest("The date range cannot be longer than 1 year");
  }

  const results = await orderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start.startOf("day").toDate(),
          $lte: end.endOf("day").toDate(),
        },
        orderStatus: { $nin: [orderStatus.pending, orderStatus.reject] },
      },
    },
    {
      $group: {
        _id: "$paymentMethod",
        income: { $sum: "$total" },
      },
    },
  ]);

  const paymentMethodIncome = {
    [PaymentType.online]: 0,
    [PaymentType.cashOnDelivery]: 0,
  };

  for (const result of results) {
    if (result._id in paymentMethodIncome) {
      paymentMethodIncome[result._id] = result.income;
    }
  }

  return {
    dataRange: {
      startDate: start.startOf("day").toISOString(),
      endDate: end.endOf("day").toISOString(),
    },
    totalIncome: Object.values(paymentMethodIncome).reduce((total, income) => total + income, 0),
    paymentMethodIncome,
  };
};

////////////////////////////////////////  order chart data  ///////////////////////////////////////////////
export const OrderPerformanceChartData = async (request) => {
  const { error, value } = dashboardDateRangeValidation(request);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const start = moment(value.startDate).startOf("day");
  const end = moment(value.endDate).endOf("day");

  try {
    const dateFormat = "YYYY-MM-DD";

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: start.toDate(), $lte: end.toDate() },
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
          onlineAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", PaymentType.online] }, "$total", 0],
            },
          },
          cashAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentMethod", PaymentType.cashOnDelivery] }, "$total", 0],
            },
          },
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
          onlineAmount: 1,
          cashAmount: 1,
        },
      },
    ];

    const result = await orderModel.aggregate(pipeline);

    const datesArray = Array.from({ length: end.diff(start, "days") + 1 }, (_, index) =>
      moment(start).add(index, "days").toDate()
    );

    const completeResult = datesArray.map((date) => {
      const match = result.find(
        (item) => moment(item.date).format(dateFormat) === moment(date).format(dateFormat)
      );
      return {
        date,
        orderCount: match ? match.orderCount : 0,
        totalOrderAmount: match ? match.totalOrderAmount : 0,
        paymentSummary: {
          Online: match ? match.onlineAmount : 0,
          Cash: match ? match.cashAmount : 0,
        },
      };
    });

    return {
      data: completeResult,
      dataRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    };
  } catch (error) {
    throw error;
  }
};

export const ProductSaleByDateServices = async (request) => {
  const { error, value } = dashboardDateRangeValidation(request);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const start = moment(value.startDate).startOf("day");
  const end = moment(value.endDate).endOf("day");

  const query = {
    createdAt: {
      $gte: start.toDate(),
      $lte: end.toDate(),
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

  return {
    data: finalFilterProduct,
    dataRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
  };
};
