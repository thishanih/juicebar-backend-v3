import { userModel } from "../models/user.model.js";
import cloudinary from "cloudinary";
import {
  registrationUserValidation,
  profileEditValidation,
  userStatusChangeValidation,
} from "../shared/validation.js";
import HttpError from "../shared/htttp.error.js";
import { generatePassword } from "../shared/generatePassword.js";
import { userType, userStatus } from "../shared/constants.js";
import bencrypt from "bcryptjs";
import { cloudinaryConfig } from "../shared/cloudinary.config.js";
import { getCloudinaryProductId } from "../shared/cloudinary.productId.js";

//////////////////////////////////////// Staff Register //////////////////////////
export const userRegister = async (uploadImage, data) => {
  const { error } = registrationUserValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  // fixed get email already error message
  const emailExists = await userModel.findOne({ email: data.email });
  if (emailExists) throw HttpError.badRequest("Email Already Exists");

  const randomPassword = await generatePassword();

  const salt = await bencrypt.genSalt(10);
  const hashPassword = await bencrypt.hash(randomPassword, salt);

  const uploadImageUrl = await cloudinary.v2.uploader.upload(uploadImage);
  if (!uploadImageUrl) throw HttpError.badRequest("define image url");

  const user = new userModel({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: hashPassword,
    userType: userType.staff,
    branch: data.branch,
    image: uploadImageUrl.secure_url,
  });

  const savedAgent = await user.save();
  return savedAgent;
};

//////////////////////////////////////// Staff Member Display //////////////////////////
export const displayAgent = async (request) => {
  const { page, per_page, search, branch } = request;

  let query = {
    userStatus: { $ne: userStatus.rejected },
    userType: userType.staff,
  };

  if (search) {
    query.firstName = { $regex: search };
  }

  if (branch) {
    query.branch = { $regex: branch };
  }

  const options = {
    page: page,
    limit: per_page,
    sort: {
      createdAt: -1,
    },
  };

  let users = await userModel.paginate(query, options);
  return users;
};

//////////////////////////////////////// Staff Member Display //////////////////////////
export const displaySingleUser = async (id) => {
  const users = userModel.findOne({ _id: id });
  if (!users) throw HttpError.badRequest("Invalid User ID");
  return users;
};

//////////////////////////////////////// User Profile Edit //////////////////////////
export const profileEdit = async (data, uploadImage) => {
  const { error } = profileEditValidation(data, uploadImage);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const userExists = await userModel.findById({ _id: data.userId });
  if (!userExists) throw HttpError.badRequest("Invalid userID");

  const alreadyUsingEmail = await userModel.findOne({
    _id: { $ne: data.userId },
    email: data.email,
  });

  if (alreadyUsingEmail) throw HttpError.badRequest("Email already exists");

  let updatedUser = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    branch: data.branch,
  };

  if (data.isActivePassword === "true") {
    const passCheck = await bencrypt.compare(data.oldPassword, userExists.password);

    if (!passCheck) throw HttpError.badRequest("Invalid current password");

    const salt = await bencrypt.genSalt(10);
    const hashPassword = await bencrypt.hash(data.newPassword, salt);

    updatedUser = { ...updatedUser, ...{ password: hashPassword } };
  }
  const previousImageUrl = userExists.image;
  let imageUrl;

  if (uploadImage) {
    const getProductId = await getCloudinaryProductId(previousImageUrl);
    await cloudinary.v2.uploader.destroy(getProductId);
    const uploadImageUrl = await cloudinary.v2.uploader.upload(uploadImage);
    imageUrl = uploadImageUrl.secure_url;
  } else {
    imageUrl = data.image;
  }

  updatedUser = await { ...updatedUser, ...{ image: imageUrl } };

  const updateUpdate = await userModel.updateOne(
    { _id: data.userId },
    {
      $set: { ...updatedUser },
    }
  );

  return updateUpdate;
};

////////////////////////// Staff Active Or Inactive ///////////////////

export const userStatusChange = async (data) => {
  const { error } = userStatusChangeValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const userExists = await userModel.findById({ _id: data.userId });
  if (!userExists) throw HttpError.badRequest("Invalid userID");

  let isCheckStatus = Object.values(userStatus).includes(data.userStatus);
  if (!isCheckStatus) throw HttpError.badRequest("Invalid User Status");

  const updateUpdate = await userModel.updateOne(
    { _id: data.userId },
    {
      $set: {
        userStatus: data.userStatus,
      },
    }
  );

  return data.userStatus;
};
