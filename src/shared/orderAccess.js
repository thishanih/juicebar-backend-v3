import { createHash, randomBytes } from "crypto";

export const createOrderAccessToken = () => randomBytes(32).toString("base64url");

export const hashOrderAccessToken = (accessToken) =>
  createHash("sha256").update(accessToken).digest("hex");

export const customerOrderResponse = (order, orderAccessToken, clientSecret) => {
  const orderData = typeof order.toObject === "function" ? order.toObject() : order;
  const {
    customerAccessTokenHash,
    paymentInfo,
    profit,
    product = [],
    ...customerOrder
  } = orderData;

  return {
    ...customerOrder,
    product: product.map(({ cost, ...orderProduct }) => orderProduct),
    orderAccessToken,
    ...(clientSecret ? { clientSecret } : {}),
  };
};
