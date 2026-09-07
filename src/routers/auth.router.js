import express from "express";
import { login, refreshToken, signOut } from "../services/auth.service.js";

const authRouter = express.Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.status(200).json({
      message: "Successfully login",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/refresh-token", async (req, res, next) => {
  try {
    const result = await refreshToken(req.headers["authorization"]);
    res.status(200).json({
      message: "Successfully create refresh token",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/sign-out", async (req, res, next) => {
  try {
    await signOut(req.headers["authorization"]);
    res.status(200).json({
      message: "Successfully sign out",
    });
  } catch (err) {
    next(err);
  }
});

export default authRouter;
