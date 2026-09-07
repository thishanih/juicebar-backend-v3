import Joi from "joi";

export const dashboardDateRangeValidation = (data) => {
  const dateRangeSchema = Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  })
    .custom((value, helpers) => {
      if (value.endDate < value.startDate) {
        return helpers.error("dateRange.order");
      }

      const maximumEndDate = new Date(value.startDate);
      maximumEndDate.setFullYear(maximumEndDate.getFullYear() + 1);

      if (value.endDate > maximumEndDate) {
        return helpers.error("dateRange.maxYear");
      }

      return value;
    })
    .messages({
      "dateRange.order": "endDate must be greater than or equal to startDate",
      "dateRange.maxYear": "The date range cannot be longer than 1 year",
    });

  return dateRangeSchema.validate(data);
};

////////////////////// Register User  //////////////////////////
export const registrationUserValidation = (data) => {
  const userSchema = Joi.object({
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    email: Joi.string().min(2).required().email(),
    branch: Joi.string().min(2).max(100).required(),
  });
  return userSchema.validate(data);
};

////////////////////// Login User  //////////////////////////

export const loginValidation = (data) => {
  const userSchema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().max(40).required(),
  });
  return userSchema.validate(data);
};

////////////////////// Profile edit User  //////////////////////////
export const profileEditValidation = (data, uploadImage) => {
  if (uploadImage) {
    const userSchema = Joi.object({
      userId: Joi.string().required(),
      isActivePassword: Joi.boolean().required(),
      firstName: Joi.string().min(2).max(100).required(),
      lastName: Joi.string().min(2).max(100).required(),
      email: Joi.string().min(2).required().email(),
      branch: Joi.string().min(2).max(100).required(),
      oldPassword: Joi.string().when("isActivePassword", {
        is: true,
        then: Joi.required(),
      }),
      newPassword: Joi.string().when("isActivePassword", {
        is: true,
        then: Joi.required(),
      }),
    });
    return userSchema.validate(data);
  } else {
    const userSchema = Joi.object({
      userId: Joi.string().required(),
      isActivePassword: Joi.boolean().required(),
      firstName: Joi.string().min(2).max(100).required(),
      lastName: Joi.string().min(2).max(100).required(),
      email: Joi.string().min(2).required().email(),
      branch: Joi.string().min(2).max(100).required(),
      image: Joi.string().required(),
      oldPassword: Joi.string().when("isActivePassword", {
        is: true,
        then: Joi.required(),
      }),
      newPassword: Joi.string().when("isActivePassword", {
        is: true,
        then: Joi.required(),
      }),
    });
    return userSchema.validate(data);
  }
};

////////////////////// User Status Change   //////////////////////////
export const userStatusChangeValidation = (data) => {
  const userSchema = Joi.object({
    userId: Joi.string().required(),
    userStatus: Joi.string().required(),
  });

  return userSchema.validate(data);
};

////////////////////// Add Category   //////////////////////////
export const addCategoryValidation = (data) => {
  const userSchema = Joi.object({
    categoryName: Joi.string().max(100).required(),
    description: Joi.string().min(5).max(1000).required(),
  });

  return userSchema.validate(data);
};

////////////////////// Display Category By Id  //////////////////////////
export const categoryIdValidation = (data) => {
  const userSchema = Joi.string().required();
  return userSchema.validate(data);
};

////////////////////// Edit Category   //////////////////////////
export const editCategoryValidation = (data, uploadImage) => {
  if (uploadImage) {
    const userSchema = Joi.object({
      categoryName: Joi.string().max(100).required(),
      description: Joi.string().min(5).max(1000).required(),
      categoryId: Joi.string().required(),
    });
    return userSchema.validate(data);
  } else {
    const userSchema = Joi.object({
      categoryName: Joi.string().max(100).required(),
      description: Joi.string().min(5).max(1000).required(),
      photo: Joi.string().required(),
      categoryId: Joi.string().required(),
    });
    return userSchema.validate(data);
  }
};

////////////////////// Edit Category   //////////////////////////
export const updatedCategoryStatusValidation = (data) => {
  const userSchema = Joi.object({
    status: Joi.string().required(),
    categoryId: Joi.string().required(),
  });
  return userSchema.validate(data);
};

////////////////////// Add Token   //////////////////////////
export const addTokenValidation = (data) => {
  const userSchema = Joi.object({
    name: Joi.string().required(),
  });
  return userSchema.validate(data);
};

////////////////////// Edit Token   //////////////////////////
export const editTokenValidation = (data) => {
  const userSchema = Joi.object({
    name: Joi.string().required(),
    tokenId: Joi.string().required(),
  });
  return userSchema.validate(data);
};

////////////////////// Updated Status Token   //////////////////////////
export const updatedStatusTokenValidation = (data) => {
  const userSchema = Joi.object({
    tokenId: Joi.string().required(),
    status: Joi.string().required(),
  });
  return userSchema.validate(data);
};

////////////////////// Display Product By Id  //////////////////////////
export const productIdValidation = (data) => {
  const userSchema = Joi.string().required();
  return userSchema.validate(data);
};

////////////////////// Add Product   //////////////////////////
export const addProductValidation = (data) => {
  const userSchema = Joi.object({
    productName: Joi.string().required(),
    categoryId: Joi.string().required(),
    primaryDescription: Joi.string().min(5).max(500).required(),
    secondaryDescription: Joi.string().min(5).max(1500).required(),
    variant: Joi.array().items(
      Joi.object({
        variantName: Joi.string().max(50).required(),
        stock: Joi.number().min(1).max(100).required(),
        price: Joi.number().min(1).max(999999).required(),
        cost: Joi.number().less(Joi.ref("price")).required().messages({
          "number.less": "The cost must be less than the price.",
        }),
      })
    ),
  });
  return userSchema.validate(data);
};

////////////////////// Edit Product Details   //////////////////////////
export const editProductDetailsValidation = (data, uploadImage) => {
  if (uploadImage) {
    const userSchema = Joi.object({
      productId: Joi.string().required(),
      productName: Joi.string().required(),
      categoryId: Joi.string().required(),
      primaryDescription: Joi.string().max(500).required(),
      secondaryDescription: Joi.string().max(1500).required(),
    });
    return userSchema.validate(data);
  } else {
    const userSchema = Joi.object({
      productId: Joi.string().required(),
      productName: Joi.string().required(),
      categoryId: Joi.string().required(),
      primaryDescription: Joi.string().max(500).required(),
      secondaryDescription: Joi.string().max(1500).required(),
      image: Joi.string().required(),
    });
    return userSchema.validate(data);
  }
};

////////////////////// Edit Product Variant  Validation //////////////////////////
export const editProductVariantValidation = (data) => {
  const userSchema = Joi.object({
    productId: Joi.string().required(),
    variantId: Joi.string().required(),
    variantName: Joi.string().required(),
    stock: Joi.number().min(0).max(100).required(),
    price: Joi.number().min(1).max(999999).required(),
    discountPrice: Joi.number().less(Joi.ref("price")).required().messages({
      "number.less": "The discount must be less than the price.",
    }),
    cost: Joi.number().less(Joi.ref("price")).required().messages({
      "number.less": "The cost must be less than the price.",
    }),
  });
  return userSchema.validate(data);
};

////////////////////// Product  Status Change   //////////////////////////
export const productStatusChangeValidation = (data) => {
  const userSchema = Joi.object({
    status: Joi.string().required(),
    ProductId: Joi.string().required(),
  });
  return userSchema.validate(data);
};

////////////////////// Add City   //////////////////////////

export const addCityValidation = (data) => {
  const userSchema = Joi.object({
    cityName: Joi.string().required(),
    deliverCharges: Joi.number().max(999).required(),
  });
  return userSchema.validate(data);
};

////////////////////// Edit City   //////////////////////////

export const editCityValidation = (data) => {
  const userSchema = Joi.object({
    cityId: Joi.string().required(),
    cityName: Joi.string().required(),
    deliverCharges: Joi.number().max(999).required(),
  });
  return userSchema.validate(data);
};

////////////////////// Updated City Status   //////////////////////////
export const updatedStatusCityValidation = (data) => {
  const userSchema = Joi.object({
    cityId: Joi.string().required(),
    status: Joi.string().required(),
  });
  return userSchema.validate(data);
};

////////////////////// Add Order validation   //////////////////////////

export const addOrderValidation = (data) => {
  const userSchema = Joi.object({
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).required(),
    email: Joi.string().email().max(100).required(),
    phoneNumber: Joi.string().max(100).required(),
    address1: Joi.string().max(100).required(),
    address2: Joi.string().max(100).required(),
    cityId: Joi.string().required(),
    paymentMethod: Joi.string().max(15).required(),
    product: Joi.array()
      .required()
      .items(
        Joi.object({
          variantId: Joi.string().required(),
          productId: Joi.string().required(),
          qty: Joi.number().min(1).required(),
        })
      ),
  });
  return userSchema.validate(data);
};

////////////////////// Display city By Id  //////////////////////////
export const cityIdValidation = (data) => {
  const userSchema = Joi.string().required();
  return userSchema.validate(data);
};

////////////////////// Create Payment Intent  //////////////////////////
export const createPaymentIntentValidation = (data) => {
  const userSchema = Joi.object({
    orderId: Joi.string().required(),
  });
  return userSchema.validate(data);
};
