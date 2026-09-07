import express from "express";
import EmailService from "../shared/email.services.js";

const mailRouter = express.Router();

mailRouter.get("/", async (req, res, next) => {
  try {
    const resEmail = await EmailService.registerStaff();
    console.log("🚀 ~ file: mail.router.js:10 ~ mailRouter.get ~ resEmail:", resEmail);

    res.status(200).json({
      message: "Successfully sent email",
      data: resEmail,
    });
  } catch (err) {
    next(err);
  }
});

export default mailRouter;
