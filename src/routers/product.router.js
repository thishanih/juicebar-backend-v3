import express from "express";
import { userType } from "../shared/constants.js";
import { userAuthorization } from "../middleware/authorization.js";
import {
  displayProduct,
  addProductService,
  addMultipleImageService,
  displayByIdProduct,
  deleteMultipleImage,
  editProductDetailsService,
  editProductVariantService,
  productStatusChange,
  displayOnlineProduct,
  relatedProductServices,
} from "../services/product.service.js";
import uploader from "../shared/multer.config.js";

const productRouter = express.Router();

//////////////////  Add Product  /////////////

productRouter.post(
  "/add",
  userAuthorization([userType.admin]),
  uploader.single("image"),
  async (req, res, next) => {
    try {
      const result = await addProductService(req.file.path, req.body);
      res.status(200).json({
        message: "Successfully add Product",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////  Display Product  /////////////
productRouter.get(
  "/",
  userAuthorization([userType.admin, userType.staff]),
  async (req, res, next) => {
    try {
      const result = await displayProduct(req.query);
      res.status(200).json({
        message: "Successfully Display Product",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////  Display Web Product  /////////////
productRouter.get("/online", async (req, res, next) => {
  try {
    const result = await displayOnlineProduct(req.query);
    res.status(200).json({
      message: "Successfully WebSite Display Product",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////   Display Product Id   /////////////
productRouter.get("/:id", async (req, res, next) => {
  try {
    const result = await displayByIdProduct(req.params.id);
    res.status(200).json({
      message: "Successfully Display Single Product",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Add Multiple Image /////////////
productRouter.put(
  "/add-multiple-image/:productId",
  userAuthorization([userType.admin, userType.staff]),
  uploader.array("image"),
  async (req, res, next) => {
    try {
      const result = await addMultipleImageService(req.files, req.params.productId);
      res.status(200).json({
        message: "Successfully add Multiple Image",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////   Multiple Image Delete /////////////
productRouter.delete("/delete-multiple-image", async (req, res, next) => {
  try {
    const result = await deleteMultipleImage(req.query);
    res.status(200).json({
      message: "Successfully Delete Multiple Image",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Edit Product Details /////////////
productRouter.put("/edit-details", uploader.single("image"), async (req, res, next) => {
  try {
    const filePath = typeof req.file !== "undefined" ? req.file.path : null;
    const result = await editProductDetailsService(req.body, filePath);
    res.status(200).json({
      message: "Successfully Edit Product Details",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Edit Product Variant /////////////
productRouter.put("/edit-variant", async (req, res, next) => {
  try {
    const result = await editProductVariantService(req.body);
    res.status(200).json({
      message: "Successfully Edit Product Variant",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////   Product Status Change /////////////
productRouter.put("/status-change", async (req, res, next) => {
  try {
    const result = await productStatusChange(req.body);
    res.status(200).json({
      message: "Successfully Product Status Change",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////   Related Products /////////////
productRouter.get("/related-product/:categoryId", async (req, res, next) => {
  try {
    const result = await relatedProductServices(req.params.categoryId);
    res.status(200).json({
      message: "Successfully display related product",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default productRouter;
