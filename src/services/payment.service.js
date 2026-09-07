import Stripe from "stripe";
import { orderModel } from "../models/oder.model.js";
import { createPaymentIntentValidation } from "../shared/validation.js";
import { PaymentType, orderStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";

//////////////////////////////////////// Create payment Service ///////////////////////////////////////////////

export const createPaymentIntentService = async (orderId, total) => {
  const orderAmount = Math.round(Number(total) * 100);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const paymentIntent = await stripe.paymentIntents.create({
    currency: "USD",
    amount: orderAmount,
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: orderId },
  });

  const clientSecret = paymentIntent.client_secret;
  return clientSecret;
};

//////////////////////////////////////// Webhook Services  ///////////////////////////////////////////////

export const webhookService = async (stripeHerder, dataBody) => {
  let message;
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

  const event = await stripe.webhooks.constructEvent(dataBody, stripeHerder, endpointSecret);
  if (!event) throw HttpError.badRequest("event null");

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;

      await orderModel.updateOne(
        { orderId: paymentIntent.metadata.orderId },
        {
          $set: {
            orderStatus: orderStatus.processing,
            "paymentInfo.logFile": event,
          },
        }
      );

      message = "payment_intent.succeeded";
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      message = `Unhandled event type ${event.type}`;
  }

  return message;
};
