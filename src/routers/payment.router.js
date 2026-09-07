import express from "express";
import { webhookService } from "../services/payment.service.js";

const onlinePaymentRouter = express.Router();

onlinePaymentRouter.get("/config", (req, res) => {
  try {
    const result = {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
    res.status(200).json({
      message: "Successfully sent stripe public key",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

onlinePaymentRouter.post("/webhook", async (req, res, next) => {
  try {
    const stripeHeaders = req.headers["stripe-signature"];
    const dataBody = req.body;

    const result = await webhookService(stripeHeaders, dataBody);

    res.status(200).json({
      message: "Webhook Successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default onlinePaymentRouter;
