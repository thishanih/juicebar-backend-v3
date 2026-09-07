import express from "express";
import { userType } from "../shared/constants.js";
import { userAuthorization } from "../middleware/authorization.js";
import uploader from "../shared/multer.config.js";
import {
  userRegister,
  displayAgent,
  profileEdit,
  userStatusChange,
  displaySingleUser,
} from "../services/user.service.js";
import { userInfo } from "../services/auth.service.js";

const userRouter = express.Router();

//////////////////  Register a Staff /////////////
userRouter.post(
  "/addUser",
  userAuthorization([userType.admin]),
  uploader.single("image"),
  async (req, res, next) => {
    try {
      const result = await userRegister(req.file.path, req.body);

      res.status(200).json({
        message: "Successfully created the agent",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

////////////////// Display all staff ////////////////////
userRouter.get("/displaystaff", userAuthorization([userType.admin]), async (req, res, next) => {
  try {
    const result = await displayAgent(req.query);
    res.status(200).json({
      message: "Successfully Display Agent",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

//////////////////   Display User Id   /////////////
userRouter.get(
  "/display-staff/:id",
  userAuthorization([userType.admin, userType.staff]),
  async (req, res, next) => {
    try {
      const result = await displaySingleUser(req.params.id);
      res.status(200).json({
        message: "Successfully Display Single User",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////  Profile edit & change password /////////////
userRouter.put(
  "/profile-edit",
  userAuthorization([userType.admin, userType.staff]),
  uploader.single("image"),
  async (req, res, next) => {
    try {
      const filePath = typeof req.file !== "undefined" ? req.file.path : null;
      const result = await profileEdit(req.body, filePath);
      res.status(200).json({
        message: "Successfully Save Password",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////   User Status Change /////////////
userRouter.put(
  "/user-status-change",
  userAuthorization([userType.admin]),
  async (req, res, next) => {
    try {
      const result = await userStatusChange(req.body);
      res.status(200).json({
        message: "Successfully User Status Change",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

//////////////////   User Info /////////////
userRouter.get(
  "/info",
  userAuthorization([userType.admin, userType.staff]),
  async (req, res, next) => {
    try {
      const result = await userInfo(req.headers["authorization"]);
      res.status(200).json({
        message: "Successfully user info",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default userRouter;
