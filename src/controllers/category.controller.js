import express from "express";
import { userType } from "../shared/constants.js";
import { userAuthorization } from "../middleware/authorization.js";
import { apiKeyAuthorization } from "../middleware/apiKey.js";
import {
  addCategoryService,
  displayCategory,
  displayByIdCategory,
  editCategory,
  updatedStatusCategory,
} from "../services/category.service.js";
import uploader from "../shared/multer.config.js";

const categoryRouter = express.Router();

//////////////////  Add new category /////////////
categoryRouter.post(
  "/add-category",
  userAuthorization([userType.admin]),
  uploader.single("file"),
  async (req, res, next) => {
    try {
      const result = await addCategoryService(req.file.path, req.body);
      res.status(200).json({
        message: "Successfully add category",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////  Display category Admin /////////////
categoryRouter.get("/", apiKeyAuthorization, async (req, res, next) => {
  try {
    const result = await displayCategory(req.query);
    res.status(200).json({
      message: "Successfully Display category",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Display category Id /////////////
categoryRouter.get(
  "/:id",
  userAuthorization([userType.admin, userType.staff]),
  async (req, res, next) => {
    try {
      const result = await displayByIdCategory(req.params.id);
      res.status(200).json({
        message: "Successfully Display category Id",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////  Edit Category /////////////
categoryRouter.put(
  "/edit-category",
  userAuthorization([userType.admin]),
  uploader.single("photo"),
  async (req, res, next) => {
    try {
      const filePath = typeof req.file !== "undefined" ? req.file.path : null;
      const result = await editCategory(req.body, filePath);

      res.status(200).json({
        message: "Successfully Edit Category",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

////////////////// Category Status Updated /////////////
categoryRouter.put(
  "/update-status",
  userAuthorization([userType.admin]),
  async (req, res, next) => {
    try {
      const result = await updatedStatusCategory(req.body);
      res.status(200).json({
        message: "Successfully Updated Status",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default categoryRouter;
