import { categoryModel } from "../models/category.model.js";
import {
  addCategoryValidation,
  editCategoryValidation,
  updatedCategoryStatusValidation,
  categoryIdValidation,
} from "../shared/validation.js";
import { categoryStatus } from "../shared/constants.js";

import HttpError from "../shared/htttp.error.js";
import { getCloudinary } from "../shared/cloudinary.config.js";
import { getCloudinaryProductId } from "../shared/cloudinary.productId.js";

//////////////////////////////////////// Category Add //////////////////////////
export const addCategoryService = async (uploadImage, data) => {
  const { error } = addCategoryValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const cloudinary = getCloudinary();
  const uploadImageUrl = await cloudinary.uploader.upload(uploadImage);
  if (!uploadImageUrl) throw HttpError.badRequest("define image url");

  const category = new categoryModel({
    categoryName: data.categoryName,
    description: data.description,
    image: uploadImageUrl.secure_url,
  });

  const savedCategory = await category.save();

  return savedCategory;
};

//////////////////////////////////////// Category Display //////////////////////////
export const displayCategory = async (request) => {
  const { page, per_page, search, slug, status } = request;

  let query = {};

  if (status) {
    query.categoryStatus = { $regex: status };
  }

  if (search) {
    query.categoryName = { $regex: search };
  }

  if (slug) {
    query.slug = { $regex: slug };
  }

  const options = {
    page: page,
    limit: per_page,
    sort: {
      createdAt: -1,
    },
  };

  const category = await categoryModel.paginate(query, options);
  return category;
};

//////////////////////////////////////// Category Display Id //////////////////////////
export const displayByIdCategory = async (id) => {
  const { error } = categoryIdValidation(id);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const category = await categoryModel.findById({ _id: id });
  return category;
};

//////////////////////////////////////// Edit Category //////////////////////////
export const editCategory = async (data, uploadImage) => {
  const { error } = editCategoryValidation(data, uploadImage);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const categoryObjExists = await categoryModel.findById({
    _id: data.categoryId,
  });
  if (!categoryObjExists) throw HttpError.badRequest("Invalid Category Id");
  const previousImageUrl = categoryObjExists.image;

  let imageUrl;

  if (uploadImage) {
    const cloudinary = getCloudinary();
    const getProductId = await getCloudinaryProductId(previousImageUrl);
    await cloudinary.uploader.destroy(getProductId);
    const uploadImageUrl = await cloudinary.uploader.upload(uploadImage);
    imageUrl = uploadImageUrl.secure_url;
  } else {
    imageUrl = data.photo;
  }

  const updatedCategory = {
    categoryName: data.categoryName,
    description: data.description,
    image: imageUrl,
  };

  await categoryModel.updateOne(
    { _id: data.categoryId },
    {
      $set: { ...updatedCategory },
    }
  );

  return updatedCategory;
};

//////////////////////////////////////// Updated Status Category //////////////////////////
export const updatedStatusCategory = async (data) => {
  const { error } = updatedCategoryStatusValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const categoryObjExists = await categoryModel.findById({
    _id: data.categoryId,
  });
  if (!categoryObjExists) throw HttpError.badRequest("Invalid Category Id");

  const isCheckStatus = Object.values(categoryStatus).includes(data.status);
  if (!isCheckStatus) throw HttpError.badRequest("Invalid Category Status");

  const updatedCategoryStatus = {
    categoryStatus: data.status,
  };

  await categoryModel.updateOne(
    { _id: data.categoryId },
    {
      $set: { ...updatedCategoryStatus },
    }
  );

  const designResponseMessage = `${categoryObjExists.categoryName} Status is ${data.status}`;

  return designResponseMessage;
};
