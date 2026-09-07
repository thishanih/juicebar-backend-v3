import { userModel } from "../models/user.model.js";
import { RefreshTokenModel } from "../models/refreshToken.modal.js";
import { loginValidation } from "../shared/validation.js";
import HttpError from "../shared/htttp.error.js";
import { userStatus } from "../shared/constants.js";
import bencrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (data) => {
  const { error } = loginValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const userExists = await userModel.findOne({ email: data.email });
  if (!userExists) throw HttpError.badRequest("Invalid Email or Password");

  if (userExists.userStatus == userStatus.inactive)
    throw HttpError.badRequest(`Currently user status ${userExists.userStatus}`);

  const passCheck = await bencrypt.compare(data.password, userExists.password);
  if (!passCheck) throw HttpError.badRequest("Invalid password");

  const tokenInfo = {
    _id: userExists.id,
    role: userExists.userType,
    displayName: userExists.firstName + " " + userExists.lastName,
  };

  const newAccessToken = jwt.sign(tokenInfo, process.env.TOKEN_SECRET, {
    expiresIn: process.env.SET_TOKEN,
  });

  const newRefreshToken = jwt.sign(tokenInfo, process.env.TOKEN_SECRET, {
    expiresIn: process.env.RESET_TOKEN,
  });

  const authorization = {
    userid: userExists.id,
    userName: userExists.firstName + " " + userExists.lastName,
    userType: userExists.userType,
    userStatus: userExists.userStatus,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };

  // save refresh data save
  const refreshData = new RefreshTokenModel({
    userId: userExists.id,
    token: newRefreshToken,
  });

  await refreshData.save();

  return authorization;
};

///////////////// Refresh Token /////////////////////
export const refreshToken = async (refreshTokenKey) => {
  // Ensure refreshTokenKey is in the "Bearer <token>" format
  if (!refreshTokenKey || !refreshTokenKey.startsWith("Bearer ")) {
    throw HttpError.badRequest("Invalid token format");
  }

  // Extract the token part after "Bearer "
  const bearerToken = refreshTokenKey.split(" ")[1];
  if (!bearerToken) throw HttpError.badRequest("Token missing");

  const isToken = await RefreshTokenModel.findOne({ token: bearerToken });
  if (!isToken) throw HttpError.badRequest("Refresh token services are no longer valid");

  await RefreshTokenModel.deleteOne({ token: bearerToken });

  // Verify the bearerToken instead of refreshToken to decode
  const RefreshTokenDecoded = jwt.verify(bearerToken, process.env.TOKEN_SECRET);
  if (!RefreshTokenDecoded) throw HttpError.badRequest("Refresh token services are not verified");

  const userExists = await userModel.findById(RefreshTokenDecoded._id);
  if (userExists.userStatus === userStatus.inactive)
    throw HttpError.badRequest(`currently userStatus ${userExists.userStatus}`);

  const tokenInfo = {
    _id: RefreshTokenDecoded._id,
    role: RefreshTokenDecoded.role,
    displayName: RefreshTokenDecoded.displayName,
  };

  const newAccessToken = jwt.sign(tokenInfo, process.env.TOKEN_SECRET, {
    expiresIn: process.env.SET_TOKEN,
  });

  const newRefreshToken = jwt.sign(tokenInfo, process.env.TOKEN_SECRET, {
    expiresIn: process.env.RESET_TOKEN,
  });

  const refreshData = new RefreshTokenModel({
    userId: userExists._id,
    token: newRefreshToken,
  });

  await refreshData.save();

  const authorization = {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };

  return authorization;
};

///////////////// Sign Out /////////////////////
export const signOut = async (refreshTokenKey) => {
  if (!refreshTokenKey || !refreshTokenKey.startsWith("Bearer ")) {
    throw HttpError.badRequest("Invalid token format");
  }

  const bearerToken = refreshTokenKey.split(" ")[1];
  if (!bearerToken) throw HttpError.badRequest("Token missing");

  const deletedToken = await RefreshTokenModel.deleteOne({
    token: bearerToken,
  });
  if (deletedToken.deletedCount === 0) {
    throw HttpError.badRequest("Refresh token services are no longer valid");
  }

  return true;
};

/**
 * Retrieves the user information based on the provided bearer token.
 *
 * @param {string} bearerHeader - The bearer header containing the access token.
 * @returns {Promise<Object>} - The user information, excluding the password.
 * @throws {HttpError} - If the user does not exist or the token is invalid.
 */
export const userInfo = async (bearerHeader) => {
  const bearer = bearerHeader.split(" ");
  const bearerToken = bearer[1];
  const verified = jwt.verify(bearerToken, process.env.TOKEN_SECRET);

  const userExists = await userModel.findById({ _id: verified._id }, { password: 0 });
  if (!userExists) throw HttpError.badRequest("Invalid users details");

  return userExists;
};
