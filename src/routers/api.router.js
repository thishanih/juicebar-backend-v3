import express from "express";
import authRouter from "./auth.router.js";
import userRouter from "./user.router.js";
import categoryRouter from "./category.router.js";
import productRouter from "./product.router.js";
import productTokenRouter from "./productToken.router.js";
import cityRouter from "./city.router.js";
import orderRouter from "./order.router.js";
import dashboardRouter from "./dashboard.router.js";
import onlinePaymentRouter from "./payment.router.js";
import mailRouter from "./mail.router.js";

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
apiRouter.use("/product-token", productTokenRouter);
apiRouter.use("/city", cityRouter);
apiRouter.use("/order", orderRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/online-payment", onlinePaymentRouter);
apiRouter.use("/mail", mailRouter);

export default apiRouter;
