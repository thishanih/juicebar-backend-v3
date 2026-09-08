import express from "express";
import authRouter from "../controllers/auth.controller.js";
import userRouter from "../controllers/user.controller.js";
import categoryRouter from "../controllers/category.controller.js";
import productRouter from "../controllers/product.controller.js";
import cityRouter from "../controllers/city.controller.js";
import orderRouter from "../controllers/order.controller.js";
import dashboardRouter from "../controllers/dashboard.controller.js";
import onlinePaymentRouter from "../controllers/payment.controller.js";
import mailRouter from "../controllers/mail.controller.js";

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
apiRouter.use("/auth", authRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/category", categoryRouter);
apiRouter.use("/product", productRouter);
apiRouter.use("/city", cityRouter);
apiRouter.use("/order", orderRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/online-payment", onlinePaymentRouter);
apiRouter.use("/mail", mailRouter);

export default apiRouter;
