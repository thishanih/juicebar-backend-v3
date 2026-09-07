import express from "express";
import https from "https";
import { readFileSync } from "fs";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

import HttpError from "./shared/htttp.error.js";
import { logger } from "./middleware/logEvents.js";
import { errorHandler } from "./middleware/errorHandler.js";

const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development";
dotenv.config({
  path: `env/${env}.env`,
});
console.log("Running environment : " + env);

const { default: Database } = await import("./shared/database.js");
const { default: apiRouter } = await import("./routers/api.router.js");
const { recoverAbandonedPaymentOrders } = await import("./services/payment.service.js");

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = new Set(
  (process.env.WEB_BASE_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const sentryDsn = process.env.SENTRY_DSN;
const sentryTracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0);
const sentryEnabled = Boolean(sentryDsn);

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    tracesSampleRate: Number.isFinite(sentryTracesSampleRate) ? sentryTracesSampleRate : 0,
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(
  helmet({
    strictTransportSecurity: env === "production" ? undefined : false,
  })
);
app.use("/api/online-payment/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (process.env.FORCE_HTTPS === "true" && !req.secure) {
    return res.redirect(308, `https://${req.get("host")}${req.originalUrl}`);
  }
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(HttpError.forbidden("Origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Order-Access-Token"],
  })
);
app.use("/api", apiRouter);
if (sentryEnabled) app.use(Sentry.Handlers.errorHandler());
app.use(errorHandler);

Database();
const port = process.env.PORT || 5000;
const httpsKeyPath = process.env.HTTPS_KEY_PATH;
const httpsCertPath = process.env.HTTPS_CERT_PATH;
const server =
  httpsKeyPath && httpsCertPath
    ? https.createServer(
        {
          key: readFileSync(httpsKeyPath),
          cert: readFileSync(httpsCertPath),
        },
        app
      )
    : app;

server.listen(port, () => {
  console.log(`${httpsKeyPath && httpsCertPath ? "HTTPS" : "HTTP"} server connected port ${port}`);
});

if (process.env.STRIPE_SECRET_KEY) {
  const recoveryInterval = setInterval(
    () => {
      recoverAbandonedPaymentOrders().catch((error) => {
        console.error("Failed to recover abandoned payment orders", error);
      });
    },
    5 * 60 * 1000 // 5 minutes in milliseconds
  );
  recoveryInterval.unref();
}
