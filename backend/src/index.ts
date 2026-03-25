import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";

import { authMiddleware, AuthenticatedRequest } from "./middlewares/auth.middleware";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.send("OK");
});

app.get("/protected", authMiddleware, (req: AuthenticatedRequest, res) => {
  return res.json({
    message: "Entraste a una ruta protegida",
    user: req.user,
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});