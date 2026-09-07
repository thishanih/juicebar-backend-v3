import { rateLimit } from "express-rate-limit";

const rateLimitOptions = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
};

export const checkoutRateLimit = rateLimit({
  ...rateLimitOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: "Too many checkout attempts. Please try again later." },
});

export const orderLookupRateLimit = rateLimit({
  ...rateLimitOptions,
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: { message: "Too many order lookup attempts. Please try again later." },
});

export const loginRateLimit = rateLimit({
  ...rateLimitOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: "Too many login attempts. Please try again later." },
});
