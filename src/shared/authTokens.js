import { createHash } from "crypto";
import jwt from "jsonwebtoken";

const getIssuer = () => process.env.JWT_ISSUER || "juice-bar-api";
const getAudience = () => process.env.JWT_AUDIENCE || "juice-bar-client";

const verificationOptions = () => ({
  algorithms: ["HS256"],
  issuer: getIssuer(),
  audience: getAudience(),
});

const accessTokenSecret = () => process.env.TOKEN_SECRET;
const refreshTokenSecret = () => process.env.REFRESH_TOKEN_SECRET || process.env.TOKEN_SECRET;

const createToken = (tokenInfo, tokenType, secret, expiresIn) =>
  jwt.sign({ ...tokenInfo, tokenType: tokenType }, secret(), {
    algorithm: "HS256",
    issuer: getIssuer(),
    audience: getAudience(),
    expiresIn: expiresIn,
  });

const verifyToken = (token, secret, expectedTokenType) => {
  const decoded = jwt.verify(token, secret(), verificationOptions());

  if (typeof decoded !== "object" || decoded.tokenType !== expectedTokenType)
    throw new Error("Invalid token type");

  return decoded;
};

export const createAccessToken = (tokenInfo) =>
  createToken(tokenInfo, "access", accessTokenSecret, process.env.SET_TOKEN);

export const createRefreshToken = (tokenInfo) =>
  createToken(tokenInfo, "refresh", refreshTokenSecret, process.env.RESET_TOKEN);

export const verifyAccessToken = (token) => verifyToken(token, accessTokenSecret, "access");

export const verifyRefreshToken = (token) => verifyToken(token, refreshTokenSecret, "refresh");

export const hashRefreshToken = (token) => createHash("sha256").update(token).digest("hex");
