import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrderAccessToken,
  customerOrderResponse,
  hashOrderAccessToken,
} from "../src/shared/orderAccess.js";
import {
  paymentAmountInCents,
  paymentIntentMatchesOrder,
} from "../src/shared/paymentVerification.js";

process.env.TOKEN_SECRET = "test-access-secret";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
process.env.JWT_ISSUER = "juice-bar-api";
process.env.JWT_AUDIENCE = "juice-bar-client";
process.env.SET_TOKEN = "1m";
process.env.RESET_TOKEN = "1h";

const { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } =
  await import("../src/shared/authTokens.js");
const { default: authRouter } = await import("../src/controllers/auth.controller.js");
const { default: orderRouter } = await import("../src/controllers/order.controller.js");

test("customer order responses exclude payment and internal cost data", () => {
  const orderAccessToken = createOrderAccessToken();
  const order = {
    customerAccessTokenHash: hashOrderAccessToken(orderAccessToken),
    paymentInfo: { paymentId: "pi_123", clientSecret: "secret" },
    profit: 12,
    product: [{ productId: "product_123", cost: 4, price: 8 }],
  };

  const result = customerOrderResponse(order, orderAccessToken, "client-secret");

  assert.equal(result.customerAccessTokenHash, undefined);
  assert.equal(result.paymentInfo, undefined);
  assert.equal(result.profit, undefined);
  assert.equal(result.product[0].cost, undefined);
  assert.equal(result.clientSecret, "client-secret");
  assert.equal(result.orderAccessToken, orderAccessToken);
});

test("access and refresh tokens cannot be used interchangeably", () => {
  const tokenInfo = { _id: "user_123", role: "Admin" };
  const accessToken = createAccessToken(tokenInfo);
  const refreshToken = createRefreshToken(tokenInfo);

  assert.equal(verifyAccessToken(accessToken).tokenType, "access");
  assert.equal(verifyRefreshToken(refreshToken).tokenType, "refresh");
  assert.throws(() => verifyAccessToken(refreshToken));
  assert.throws(() => verifyRefreshToken(accessToken));
});

test("refresh token rotation uses POST", () => {
  const refreshRoute = authRouter.stack.find(
    (layer) => layer.route?.path === "/refresh-token"
  ).route;

  assert.equal(refreshRoute.methods.post, true);
  assert.equal(refreshRoute.methods.get, undefined);
});

test("payment intent must match the expected successful order payment", () => {
  const order = { total: 15.99 };
  const paymentIntent = {
    status: "succeeded",
    currency: "USD",
    amount: 1599,
    amount_received: 1599,
  };

  assert.equal(paymentAmountInCents(order.total), 1599);
  assert.equal(paymentIntentMatchesOrder(paymentIntent, order), true);
  assert.equal(
    paymentIntentMatchesOrder({ ...paymentIntent, amount_received: 1598 }, order),
    false
  );
  assert.equal(paymentIntentMatchesOrder({ ...paymentIntent, currency: "eur" }, order), false);
});

test("order status mutations use PUT instead of GET", () => {
  const orderRoutes = Object.fromEntries(
    orderRouter.stack
      .filter((layer) => layer.route)
      .map((layer) => [layer.route.path, layer.route.methods])
  );

  assert.equal(orderRoutes["/cancel/:orderId"].put, true);
  assert.equal(orderRoutes["/cancel/:orderId"].get, undefined);
  assert.equal(orderRoutes["/complete/:orderId"].put, true);
  assert.equal(orderRoutes["/complete/:orderId"].get, undefined);
});

test("payment failure events are supported for stock restoration", async () => {
  const paymentServiceSource = await import("../src/services/payment.service.js");
  assert.equal(typeof paymentServiceSource.webhookService, "function");
  assert.equal(typeof paymentServiceSource.recoverAbandonedPaymentOrders, "function");
});
