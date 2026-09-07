import express from "express";
import { userType } from "../shared/constants.js";
import { userAuthorization } from "../middleware/authorization.js";
import { checkoutRateLimit, orderLookupRateLimit } from "../middleware/rateLimit.js";

import {
  addOrderService,
  displayAllOrderService,
  OrderByIdService,
  CancelOrderServices,
  CompleteOrderServices,
  OrderByIdServiceAdmin,
} from "../services/order.v2.service.js";

const orderRouter = express.Router();

//////////////////  Add new Order /////////////
orderRouter.post("/add-order", checkoutRateLimit, async (req, res, next) => {
  try {
    const result = await addOrderService(req.body);
    res.status(200).json({
      message: "Add Order Successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Display order admin /////////////
orderRouter.get(
  "/",
  userAuthorization([userType.admin, userType.staff]),
  async (req, res, next) => {
    try {
      const result = await displayAllOrderService(req.query);
      res.status(200).json({
        message: "Display All Order Successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////  Display Order Id /////////////
orderRouter.get("/:orderId", orderLookupRateLimit, async (req, res, next) => {
  try {
    const result = await OrderByIdService(req.params.orderId, req.headers["x-order-access-token"]);
    res.status(200).json({
      message: "Display Order Id Successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////   Display Order Id (admin and Staff) /////////////
orderRouter.get(
  "/admin/:orderId",
  userAuthorization([userType.admin, userType.staff]),
  async (req, res, next) => {
    try {
      const result = await OrderByIdServiceAdmin(req.params.orderId);
      res.status(200).json({
        message: "Order Id Successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////   Order Cancel /////////////
orderRouter.put(
  "/cancel/:orderId",
  userAuthorization([userType.admin, userType.staff]),
  async (req, res, next) => {
    try {
      const result = await CancelOrderServices(req.params.orderId);
      res.status(200).json({
        message: "Order Cancel Successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////   Order Complete /////////////
orderRouter.put(
  "/complete/:orderId",
  userAuthorization([userType.admin, userType.staff]),
  async (req, res, next) => {
    try {
      const result = await CompleteOrderServices(req.params.orderId);
      res.status(200).json({
        message: "Order Complete Successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default orderRouter;
