import mongoose from "mongoose";
import { ProductModel } from "../models/product.model.js";
import { variantModel } from "../models/variant.modal.js";
import { categoryModel } from "../models/category.model.js";
import {
  addProductValidation,
  productIdValidation,
  editProductDetailsValidation,
  editProductVariantValidation,
  productStatusChangeValidation,
} from "../shared/validation.js";

import { StockStatus, productStatus, categoryStatus } from "../shared/constants.js";
import HttpError from "../shared/htttp.error.js";
import cloudinary from "cloudinary";
import { cloudinaryConfig } from "../shared/cloudinary.config.js";
import { getCloudinaryProductId } from "../shared/cloudinary.productId.js";

////////////////////////////////////////  Display Product Admin //////////////////////////
export const displayProduct = async (request) => {
  const { page, per_page, search, slug, status } = request;

  const categoryIdSet = await categoryModel.find(
    { categoryStatus: categoryStatus.active },
    { _id: 1 }
  );

  const convertArrayCategoryId = categoryIdSet.map((category) => category._id.toString());

  let query = { category: { $in: convertArrayCategoryId } };

  if (status) {
    query.productStatus = { $regex: status };
  }

  if (search) {
    query.productName = { $regex: search };
  }

  if (slug) {
    query.slug = { $regex: slug };
  }

  const options = {
    page: page,
    lean: true,
    limit: per_page,
    populate: [
      {
        path: "category",
        select: { categoryName: 1, _id: 1 },
      },
      {
        path: "defaultVariant",
      },
      [{ path: "variants" }],
    ],
    sort: {
      createdAt: -1,
    },
  };
  const products = await ProductModel.paginate(query, options);
  return products;
};

////////////////////////////////////////  Display Online Product WebSite //////////////////////////
export const displayOnlineProduct = async (request) => {
  const { page, per_page, search, slug, status, PriceMax, priceMin, categoryId } = request;

  const categoryIdSet = await categoryModel
    .find({ categoryStatus: categoryStatus.active }, { _id: 1 })
    .distinct("_id");

  let query = {
    productStatus: productStatus.active,
    category: { $in: categoryIdSet },
  };

  if (status) {
    query.productStatus = { $regex: status };
  }

  if (search) {
    query.productName = { $regex: search };
  }

  if (slug) {
    query.slug = { $regex: slug };
  }

  if (priceMin && PriceMax) {
    query.variants = {
      $in: await variantModel
        .find({
          price: { $gte: priceMin, $lt: PriceMax },
        })
        .distinct("_id"),
    };
  }

  if (categoryId) {
    const arr = categoryId.split(",");
    query.category = { $in: arr };
  }

  const options = {
    page: page,
    lean: true,
    limit: per_page,
    populate: [
      {
        path: "category",
      },
      {
        path: "defaultVariant",
        select: {
          cost: 0,
        },
      },
      {
        path: "variants",
        select: {
          cost: 0,
        },
      },
    ],
    sort: {
      createdAt: -1,
    },
  };

  const products = await ProductModel.paginate(query, options);
  return products;
};

//////////////////////////////////////// Product Display Id //////////////////////////
export const displayByIdProduct = async (id) => {
  const { error } = productIdValidation(id);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const Product = await ProductModel.find({ _id: id }).populate([
    {
      path: "category",
      select: { categoryName: 1 },
    },
    {
      path: "defaultVariant",
    },
    [{ path: "variants" }],
  ]);

  return Product;
};

////////////////////////////////////////  Add Product //////////////////////////
export const addProductService = async (uploadImage, body) => {
  const data = JSON.parse(JSON.stringify(body));

  const { error } = addProductValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const uploadImageUrl = await cloudinary.v2.uploader.upload(uploadImage);
  if (!uploadImageUrl) throw HttpError.badRequest("define image url");

  const sortVariantArray = data.variant.sort((a, b) => a.price - b.price);
  const savedVariantsData = await variantModel.insertMany(sortVariantArray);

  const VariantsId = savedVariantsData.reduce((current, previous) => {
    current.push(previous._id);
    return current;
  }, []);

  const product = await new ProductModel({
    productName: data.productName,
    category: data.categoryId,
    primaryDescription: data.primaryDescription,
    secondaryDescription: data.secondaryDescription,
    imageSet: [{ url: uploadImageUrl.secure_url }],
    primaryImage: uploadImageUrl.secure_url,
    variants: VariantsId,
    defaultVariant: VariantsId[0],
  });

  const savedProduct = await product.save();
  return savedProduct;
};

////////////////////////////////////////  Add Multiple Image //////////////////////////
export const addMultipleImageService = async (uploadImage, productId) => {
  const productObjExists = await ProductModel.findById(
    {
      _id: productId,
    },
    { imageSet: 1, productName: 1 }
  );

  if (!productObjExists) throw HttpError.badRequest("product id wrong");

  if (productObjExists.imageSet.length === process.env.MAX_IMAGE_SET_COUNT)
    throw HttpError.badRequest(`You Already Image Set`);

  const currentImageCount = process.env.MAX_IMAGE_SET_COUNT - productObjExists.imageSet.length;

  if (currentImageCount < uploadImage.length)
    throw HttpError.badRequest(`Sorry, You can add Maximum ${currentImageCount} Images`);

  var newVariant = [];

  newVariant = await Promise.all(
    uploadImage.map(async (data) => {
      const uploadImageUrl = await cloudinary.v2.uploader.upload(data.path);
      if (!uploadImageUrl) throw HttpError.badRequest("define image url");

      let imageObject = {
        url: uploadImageUrl.secure_url,
      };

      return { ...newVariant, ...imageObject };
    })
  );

  const updateUpdate = await ProductModel.updateMany(
    { _id: productId },
    { $push: { imageSet: newVariant } }
  );

  const designResponseMessage = `${productObjExists.productName} Add ${uploadImage.length} Images`;

  return designResponseMessage;
};

////////////////////////////////////////  Delete Image //////////////////////////
export const deleteMultipleImage = async (request) => {
  const { productId, imageId } = request;

  const Product = await ProductModel.find({ _id: productId });
  if (!Product) throw HttpError.badRequest("product id wrong");

  const bracketRemoveProduct = Product.pop();

  const filterImageObject = await bracketRemoveProduct.imageSet.filter((image) => {
    return image._id == imageId;
  });

  if (filterImageObject.length == 0) throw HttpError.badRequest(`Image object None`);

  const { url } = filterImageObject.pop();

  const cloudinaryImageId = await getCloudinaryProductId(url);
  await cloudinary.v2.uploader.destroy(cloudinaryImageId);

  await ProductModel.updateMany({ _id: productId }, { $pull: { imageSet: { _id: imageId } } });

  return filterImageObject;
};

////////////////////////////////////////  Edit Product Details //////////////////////////
export const editProductDetailsService = async (data, uploadImage) => {
  const { error } = editProductDetailsValidation(data, uploadImage);
  if (error) throw HttpError.badRequest(error.details[0].message);

  let imageUrl;

  const Product = await ProductModel.findById(
    {
      _id: data.productId,
    },
    { primaryImage: 1 }
  );

  if (!Product) throw HttpError.badRequest("Invalid product Id");

  const category = await categoryModel.findById(
    {
      _id: data.categoryId,
    },
    { categoryName: 1 }
  );
  if (!category) throw HttpError.badRequest("Invalid Category Id");

  const previousImageUrl = Product.primaryImage;

  if (uploadImage) {
    const getProductId = await getCloudinaryProductId(previousImageUrl);
    await cloudinary.v2.uploader.destroy(getProductId);
    const uploadImageUrl = await cloudinary.v2.uploader.upload(uploadImage);
    imageUrl = uploadImageUrl.secure_url;
  } else {
    imageUrl = data.image;
  }

  const editWithObject = {
    productName: data.productName,
    category: data.categoryId,
    primaryDescription: data.primaryDescription,
    secondaryDescription: data.secondaryDescription,
    primaryImage: imageUrl,
  };

  const updatedProduct = await ProductModel.updateOne(
    { _id: data.productId },
    {
      $set: { ...editWithObject },
    }
  );

  return editWithObject;
};

//////////////////  Edit Product Variant Services/////////////

export const editProductVariantService = async (data) => {
  const { error } = editProductVariantValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const { productId, variantId, ...variantObj } = data;

  const product = await ProductModel.findById({ _id: productId }, { _id: 1 });
  if (!product) throw HttpError.badRequest("Invalid product Id");

  const variant = await variantModel.findById({ _id: variantId }, { _id: 1 });
  if (!variant) throw HttpError.badRequest("Invalid variant Id");

  const checkDiscountStatus = variantObj.discountPrice > 0 ? true : false;
  const checkStockStatus = variantObj.stock > 0 ? StockStatus.inStock : StockStatus.outOfStock;

  const finalUpdatedVariant = {
    ...variantObj,
    ...{ discountStatus: checkDiscountStatus, stockStatus: checkStockStatus },
  };

  await variantModel.updateOne(
    { _id: variantId },
    {
      $set: { ...finalUpdatedVariant },
    }
  );

  const [products] = await ProductModel.find({ _id: productId }).populate([[{ path: "variants" }]]);

  const sortVariants = products.variants
    .sort((a, b) => a.price - b.price)
    .reduce((previousValue, currentValue) => {
      previousValue.push(currentValue._id);
      return previousValue;
    }, []);

  const updatedProductObj = {
    defaultVariant: sortVariants[0],
    variants: sortVariants,
  };

  await ProductModel.updateOne(
    { _id: productId },
    {
      $set: { ...updatedProductObj },
    }
  );

  return finalUpdatedVariant;
};

/////////////// Product Status Change ////////////////////////

export const productStatusChange = async (data) => {
  const { error } = productStatusChangeValidation(data);
  if (error) throw HttpError.badRequest(error.details[0].message);

  const productObjExists = await ProductModel.findById({
    _id: data.ProductId,
  });
  if (!productObjExists) throw HttpError.badRequest("Invalid Product Id");

  const isCheckStatus = Object.values(productStatus).includes(data.status);
  if (!isCheckStatus) throw HttpError.badRequest("Invalid Product Status");

  const updatedProductStatus = {
    productStatus: data.status,
  };

  await ProductModel.updateOne(
    { _id: data.ProductId },
    {
      $set: { ...updatedProductStatus },
    }
  );

  const designResponseMessage = `${productObjExists.productName} Status is ${data.status}`;
  return designResponseMessage;
};

/////////////// Related Product Services ////////////////////////
export const relatedProductServices = async (categoryId) => {
  const ObjectId = mongoose.Types.ObjectId;
  const productArray = await ProductModel.aggregate([
    {
      $match: { category: ObjectId(categoryId) },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $sample: {
        size: 4,
      },
    },
  ]);

  return productArray;
};
