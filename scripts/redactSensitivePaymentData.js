import dotenv from "dotenv";
import mongoose from "mongoose";

const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : "development";
dotenv.config({ path: `env/${env}.env` });

if (process.env.CONFIRM_PAYMENT_DATA_REDACTION !== "true") {
  console.error("Set CONFIRM_PAYMENT_DATA_REDACTION=true before running this command.");
  process.exitCode = 1;
} else if (!process.env.DB) {
  console.error("DB must be configured before running this command.");
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.DB);
    const result = await mongoose.connection.collection("orders").updateMany(
      {},
      {
        $unset: {
          "paymentInfo.clientSecret": "",
          "paymentInfo.logFile": "",
        },
      }
    );
    console.log(`Redacted sensitive payment data from ${result.modifiedCount} orders.`);
  } finally {
    await mongoose.disconnect();
  }
}
