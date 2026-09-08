import { timingSafeEqual } from "node:crypto";

export const apiKeyAuthorization = (req, res, next) => {
  const configuredKey = process.env.PUBLIC_API_KEY;
  const providedKey = req.headers["x-api-key"];

  if (!configuredKey || typeof providedKey !== "string") {
    return res.status(401).json("Invalid API key");
  }

  const configuredKeyBuffer = Buffer.from(configuredKey);
  const providedKeyBuffer = Buffer.from(providedKey);

  if (
    configuredKeyBuffer.length !== providedKeyBuffer.length ||
    !timingSafeEqual(configuredKeyBuffer, providedKeyBuffer)
  ) {
    return res.status(401).json("Invalid API key");
  }

  next();
};
