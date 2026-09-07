export const paymentCurrency = "usd";

export const paymentAmountInCents = (total) => {
  const amount = Math.round(Number(total) * 100);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
};

export const paymentIntentMatchesOrder = (paymentIntent, order) => {
  const expectedAmount = paymentAmountInCents(order.total);

  return (
    paymentIntent.status === "succeeded" &&
    paymentIntent.currency?.toLowerCase() === paymentCurrency &&
    paymentIntent.amount === expectedAmount &&
    paymentIntent.amount_received === expectedAmount
  );
};
