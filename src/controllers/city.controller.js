import express from "express";
import { userType } from "../shared/constants.js";
import { userAuthorization } from "../middleware/authorization.js";
import { apiKeyAuthorization } from "../middleware/apiKey.js";
import {
  addCityService,
  displayCity,
  displayCityWebSite,
  editCityService,
  updatedStatusCityService,
  displayByIdCategory,
} from "../services/city.service.js";

const cityRouter = express.Router();

//////////////////  Add City /////////////
cityRouter.post("/add", userAuthorization([userType.admin]), async (req, res, next) => {
  try {
    const result = await addCityService(req.body);
    res.status(200).json({
      message: "Successfully add city",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

////////////////  Display City /////////////
cityRouter.get("/", userAuthorization([userType.admin, userType.staff]), async (req, res, next) => {
  try {
    const result = await displayCity(req.query);
    res.status(200).json({
      message: "Successfully Display All City",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

////////////////  Display City (web Site) /////////////
cityRouter.get("/web", apiKeyAuthorization, async (req, res, next) => {
  try {
    const result = await displayCityWebSite();
    res.status(200).json({
      message: "Successfully Display All City web",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////  Display City Id /////////////
cityRouter.get("/:id", apiKeyAuthorization, async (req, res, next) => {
  try {
    const result = await displayByIdCategory(req.params.id);
    res.status(200).json({
      message: "Successfully display city id",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// //////////////////  Edit City  /////////////
cityRouter.put("/edit", userAuthorization([userType.admin]), async (req, res, next) => {
  try {
    const result = await editCityService(req.body);
    res.status(200).json({
      message: "Successfully Edit City",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// //////////////////  Updated City Status /////////////
cityRouter.put("/edit-status", userAuthorization([userType.admin]), async (req, res, next) => {
  try {
    const result = await updatedStatusCityService(req.body);
    res.status(200).json({
      message: "Successfully Updated Product Token Status",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default cityRouter;
