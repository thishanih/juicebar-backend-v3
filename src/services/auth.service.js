import { userModel } from "../models/user.model.js";
import { RefreshTokenModel } from "../models/refreshToken.modal.js";
import { loginValidation } from "../shared/validation.js";
import HttpError from "../shared/htttp.error.js";
import { userStatus } from "../shared/constants.js";
import bencrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../shared/authTokens.js";

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

  const newAccessToken = createAccessToken(tokenInfo);
  const newRefreshToken = createRefreshToken(tokenInfo);
  const refreshTokenFamilyId = randomUUID();

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
    token: hashRefreshToken(newRefreshToken),
    familyId: refreshTokenFamilyId,
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

  const refreshTokenHash = hashRefreshToken(bearerToken);
  let refreshTokenDecoded;
  try {
    refreshTokenDecoded = verifyRefreshToken(bearerToken);
  } catch (err) {
    throw HttpError.badRequest("Refresh token services are not verified");
  }

  const refreshData = await RefreshTokenModel.findOneAndUpdate(
    { token: refreshTokenHash, revokedAt: null },
    { $set: { revokedAt: new Date(), familyId: randomUUID() } },
    { new: true }
  );

  if (!refreshData) {
    const reusedToken = await RefreshTokenModel.findOne({ token: refreshTokenHash });
    if (reusedToken?.revokedAt && reusedToken.familyId) {
      await RefreshTokenModel.updateMany(
        { familyId: reusedToken.familyId, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }
    throw HttpError.badRequest("Refresh token services are no longer valid");
  }

  const userExists = await userModel.findById(refreshTokenDecoded._id);
  if (!userExists) throw HttpError.badRequest("Invalid user details");
  if (userExists.userStatus === userStatus.inactive)
    throw HttpError.badRequest(`currently userStatus ${userExists.userStatus}`);

  const tokenInfo = {
    _id: refreshTokenDecoded._id,
    role: refreshTokenDecoded.role,
    displayName: refreshTokenDecoded.displayName,
  };

  const newAccessToken = createAccessToken(tokenInfo);
  const newRefreshToken = createRefreshToken(tokenInfo);

  const newRefreshData = new RefreshTokenModel({
    userId: userExists._id,
    token: hashRefreshToken(newRefreshToken),
    familyId: refreshData.familyId,
  });

  await newRefreshData.save();

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
    token: hashRefreshToken(bearerToken),
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
  if (!bearerHeader || !bearerHeader.startsWith("Bearer "))
    throw HttpError.unauthorized("Invalid token format");

  const bearer = bearerHeader.split(" ");
  const bearerToken = bearer[1];
  let verified;
  try {
    verified = verifyAccessToken(bearerToken);
  } catch (err) {
    throw HttpError.unauthorized("Invalid Token");
  }

  const userExists = await userModel.findById({ _id: verified._id }, { password: 0 });
  if (!userExists) throw HttpError.badRequest("Invalid users details");

  return userExists;
};
