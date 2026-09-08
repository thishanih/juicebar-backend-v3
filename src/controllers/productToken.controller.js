import express from "express";
import { userType } from "../shared/constants.js";
import { userAuthorization } from "../middleware/authorization.js";
import {
  addProductTokenService,
  editProductTokenService,
  updatedStatusProductTokenService,
  displayProductToken,
} from "../services/productToken.service.js";

const productTokenRouter = express.Router();

//////////////////  Add Product Token /////////////
productTokenRouter.post("/add", userAuthorization([userType.admin]), async (req, res, next) => {
  try {
    const result = await addProductTokenService(req.body);
    res.status(200).json({
      message: "Successfully add Product Token",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Display Product Token /////////////
productTokenRouter.get("/", async (req, res, next) => {
  try {
    const result = await displayProductToken(req.query);
    res.status(200).json({
      message: "Successfully Display Product Token",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Edit Product Token  /////////////
productTokenRouter.put("/edit", userAuthorization([userType.admin]), async (req, res, next) => {
  try {
    const result = await editProductTokenService(req.body);
    res.status(200).json({
      message: "Successfully Edit Product Token",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Updated  Product Token Status /////////////
productTokenRouter.put(
  "/edit-status",
  userAuthorization([userType.admin]),
  async (req, res, next) => {
    try {
      const result = await updatedStatusProductTokenService(req.body);
      res.status(200).json({
        message: "Successfully Updated Product Token Status",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default productTokenRouter;
