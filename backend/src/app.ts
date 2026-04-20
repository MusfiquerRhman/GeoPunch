import express, { Application } from "express";
import cors from "cors";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import userRoutes from "./routes/users.route";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

app.use(globalErrorHandler);

export default app;