import express from "express";
import cors from "cors";
import statusCodes from "http-status-codes";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

import Database from "./shared/database.js";
import apiRouter from "./routers/api.router.js";
import HttpError from "./shared/htttp.error.js";
import { logger } from "./middleware/logEvents.js";
import { errorHandler } from "./middleware/errorHandler.js";

const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development";
dotenv.config({
  path: `env/${env}.env`,
});
console.log("Running environment : " + env);

const app = express();
const { BAD_REQUEST } = statusCodes;

Sentry.init({
  dsn: "https://c0cf40a79ed24bb7b21ff10e4290eda8@o4505175094525952.ingest.sentry.io/4505175097409536",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    // new Tracing.Integrations.Express({ app }),
    // Automatically instrument Node.js libraries and frameworks
    ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// Add Routes
// app.use(express.json());
app.use((req, res, next) => {
  if (req.originalUrl === "/api/online-payment/webhook") {
    next(); // Do nothing with the body because I need it in a raw state.
  } else {
    express.json()(req, res, next); // ONLY do express.json() if the received request is NOT a WebHook from Stripe.
  }
});

app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api", apiRouter);
app.use(errorHandler);
app.use(Sentry.Handlers.errorHandler());

app.use(function (err, req, res, next) {
  let status = BAD_REQUEST;
  if (err instanceof HttpError) {
    status = err.httpStatusCode;
  }
  res.status(res.sentry + "\n");
  return res.status(status).json({
    message: err.message,
  });
});

Database();
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log("Sever Connected port " + port);
});
