import express from "express";
import { userType } from "../shared/constants.js";
import { userAuthorization } from "../middleware/authorization.js";
import {
  OrderIncomeSummaryServices,
  OrderStatusCountByDateServices,
  OrderPerformanceChartData,
  ProductSaleByDateServices,
} from "../services/dashboard.service.js";

const dashboardRouter = express.Router();

//////////////////   Order status count /////////////
dashboardRouter.get(
  "/admin/order-status-count",
  userAuthorization([userType.admin]),
  async (req, res, next) => {
    try {
      const result = await OrderStatusCountByDateServices(req.query);
      res.status(200).json({
        message: "Successfully order status count",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

dashboardRouter.get(
  "/admin/income-summary",
  userAuthorization([userType.admin]),
  async (req, res, next) => {
    try {
      const result = await OrderIncomeSummaryServices(req.query);
      res.status(200).json({
        message: "Successfully retrieved order income summary",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////  Order performance chart /////////////
dashboardRouter.get(
  "/admin/order-performance-chart",
  userAuthorization([userType.admin]),
  async (req, res, next) => {
    try {
      const result = await OrderPerformanceChartData(req.query);
      res.status(200).json({
        message: "Successfully retrieved order performance chart",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////  Product sale data /////////////
dashboardRouter.get(
  "/admin/product-sale",
  userAuthorization([userType.admin]),
  async (req, res, next) => {
    try {
      const result = await ProductSaleByDateServices(req.query);
      res.status(200).json({
        message: "Successfully retrieved product sale data",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default dashboardRouter;
