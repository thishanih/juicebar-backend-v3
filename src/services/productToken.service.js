import { ProductTokenModel } from "../models/productToken.model.js";
import {
  addTokenValidation,
  editTokenValidation,
  updatedStatusTokenValidation,
} from "../shared/validation.js";
import { tokenStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";

//////////////////  Add New Product Token /////////////
export const addProductTokenService = async (data) => {
  const { error } = addTokenValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const ProductToken = new ProductTokenModel({
    name: data.name,
  });

  const savedProductToken = await ProductToken.save();
  return savedProductToken;
};

//////////////////////////////////////// Display Product Token  //////////////////////////
export const displayProductToken = async (request) => {
  const { page, per_page, search, status } = request;

  let query = {};

  if (status) {
    query.status = { $regex: status };
  }

  if (search) {
    query.name = { $regex: search };
  }

  const options = {
    page: page,
    limit: per_page,
    sort: {
      createdAt: -1,
    },
  };

  const productToken = await ProductTokenModel.paginate(query, options);
  return productToken;
};

//////////////////  Edit  Product Token /////////////
export const editProductTokenService = async (data) => {
  const { error } = editTokenValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const tokenObjExists = await ProductTokenModel.findById({
    _id: data.tokenId,
  });
  if (!tokenObjExists) throw HttpError.badRequest("Invalid Product Token Id");

  const updatedTokenObj = {
    name: data.name,
  };

  const updatedToken = await ProductTokenModel.updateOne(
    { _id: data.tokenId },
    {
      $set: { ...updatedTokenObj },
    }
  );

  return updatedTokenObj;
};

//////////////////  Updated Status Product Token /////////////
export const updatedStatusProductTokenService = async (data) => {
  const { error } = updatedStatusTokenValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const tokenObjExists = await ProductTokenModel.findById({
    _id: data.tokenId,
  });
  if (!tokenObjExists) throw HttpError.badRequest("Invalid Product Token Id");

  const isCheckStatus = Object.values(tokenStatus).includes(data.status);
  if (!isCheckStatus) throw HttpError.badRequest("Invalid Product Token Status");

  const updatedTokenObj = {
    status: data.status,
  };

  const updatedToken = await ProductTokenModel.updateOne(
    { _id: data.tokenId },
    {
      $set: { ...updatedTokenObj },
    }
  );

  const designResponseMessage = `${tokenObjExists.name} Status is ${data.status}`;

  return designResponseMessage;
};
