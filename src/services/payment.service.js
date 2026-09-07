import Stripe from "stripe";
import { orderModel } from "../models/oder.model.js";
import { PaymentType, orderStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";
import {
  paymentAmountInCents,
  paymentCurrency,
  paymentIntentMatchesOrder,
} from "../shared/paymentVerification.js";

//////////////////////////////////////// Create payment Service ///////////////////////////////////////////////

export const createPaymentIntentService = async (orderId, total) => {
  const orderAmount = paymentAmountInCents(total);
  if (!orderAmount) throw HttpError.badRequest("Invalid order amount");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const paymentIntent = await stripe.paymentIntents.create(
    {
      currency: paymentCurrency,
      amount: orderAmount,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: orderId },
    },
    {
      idempotencyKey: `order-${orderId}`,
    }
  );

  if (!paymentIntent.id || !paymentIntent.client_secret)
    throw HttpError.badRequest("Unable to create payment intent");

  return {
    paymentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
};

//////////////////////////////////////// Webhook Services  ///////////////////////////////////////////////

export const webhookService = async (stripeHerder, dataBody) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    appInfo: {
      name: "juiceBar",
      version: "1.2.34", // Optional
      url: "http://localhost:3000", // Optional
    },
  });

  if (!stripe) throw HttpError.badRequest("stripe null");

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY;
  if (!endpointSecret) throw HttpError.badRequest("webhook secret key null");

  let event;
  try {
    event = stripe.webhooks.constructEvent(dataBody, stripeHerder, endpointSecret);
  } catch (err) {
    throw HttpError.badRequest("Invalid Stripe webhook signature");
  }

  const isLiveMode = process.env.STRIPE_LIVE_MODE === "true";
  if (event.livemode !== isLiveMode) throw HttpError.badRequest("Unexpected Stripe event mode");

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId || !paymentIntent.id || paymentIntent.status !== "succeeded")
        throw HttpError.badRequest("Invalid payment event");

      const order = await orderModel.findOne({
        orderId: orderId,
        paymentMethod: PaymentType.online,
        "paymentInfo.paymentId": paymentIntent.id,
      });
      if (!order) throw HttpError.notFound("Order not found for payment");

      if (!paymentIntentMatchesOrder(paymentIntent, order)) {
        throw HttpError.badRequest("Payment amount does not match order");
      }

      if (order.paymentInfo?.eventId === event.id || order.orderStatus !== orderStatus.pending)
        return "Payment already processed";

      const updateResult = await orderModel.updateOne(
        {
          _id: order._id,
          orderStatus: orderStatus.pending,
          "paymentInfo.paymentId": paymentIntent.id,
          "paymentInfo.eventId": { $ne: event.id },
        },
        {
          $set: {
            orderStatus: orderStatus.processing,
            "paymentInfo.eventId": event.id,
            "paymentInfo.paidAt": new Date(event.created * 1000),
          },
        }
      );

      if (updateResult.modifiedCount === 0) return "Payment already processed";

      return "payment_intent.succeeded";
    default:
      return `Unhandled event type ${event.type}`;
  }
};
