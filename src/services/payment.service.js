import Stripe from "stripe";
import { orderModel } from "../models/oder.model.js";
import { variantModel } from "../models/variant.modal.js";
import { PaymentType, orderStatus, StockStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";
import {
  paymentAmountInCents,
  paymentCurrency,
  paymentIntentMatchesOrder,
} from "../shared/paymentVerification.js";

const restoreOrderStock = async (order) => {
  await Promise.all(
    order.product.map((item) =>
      variantModel.updateOne(
        { _id: item.variantId },
        {
          $inc: { stock: Number(item.qty) },
          $set: { stockStatus: StockStatus.inStock },
        }
      )
    )
  );
};

const releasePendingOrderStock = async (orderId, paymentId, eventId) => {
  const order = await orderModel.findOneAndUpdate(
    {
      orderId: orderId,
      paymentMethod: PaymentType.online,
      orderStatus: orderStatus.pending,
      "paymentInfo.paymentId": paymentId,
      "paymentInfo.stockReleasedAt": { $exists: false },
    },
    {
      $set: {
        orderStatus: orderStatus.reject,
        "paymentInfo.eventId": eventId,
        "paymentInfo.stockReleasedAt": new Date(),
      },
    },
    { new: true }
  );

  if (!order) return false;
  await restoreOrderStock(order);
  return true;
};

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
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.orderId;

      if (!orderId || !paymentIntent.id) throw HttpError.badRequest("Invalid failed payment event");

      const released = await releasePendingOrderStock(orderId, paymentIntent.id, event.id);
      return released ? "payment stock restored" : "Payment already processed";
    }
    default:
      return `Unhandled event type ${event.type}`;
  }
};

export const recoverAbandonedPaymentOrders = async () => {
  const timeoutMinutes = Number(process.env.PAYMENT_PENDING_TIMEOUT_MINUTES || 60);
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000); // Calculate the cutoff time for pending orders based on the timeout setting
  const pendingOrders = await orderModel.find({
    paymentMethod: PaymentType.online,
    orderStatus: orderStatus.pending,
    createdAt: { $lt: cutoff },
    "paymentInfo.paymentId": { $exists: true },
  });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  for (const order of pendingOrders) {
    const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentInfo.paymentId);
    if (paymentIntent.status === "succeeded" || paymentIntent.status === "processing") continue;

    if (paymentIntent.status !== "canceled") {
      await stripe.paymentIntents.cancel(paymentIntent.id);
    }

    await releasePendingOrderStock(
      order.orderId,
      paymentIntent.id,
      `abandoned-${paymentIntent.id}`
    );
  }
};
