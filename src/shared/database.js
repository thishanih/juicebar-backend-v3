import mongoose from "mongoose";

mongoose.set("strictQuery", true);

export default function connection() {
  try {
    const connectionParams = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    mongoose.connect(process.env.DB, connectionParams);
    console.log("connected to database.");
  } catch (error) {
    console.log(error, "could not connect database.");
  }
}
