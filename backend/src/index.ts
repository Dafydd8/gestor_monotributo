import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import invoiceRoutes from "./routes/invoice.routes";
import categoryRoutes from "./routes/category.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/invoices", invoiceRoutes);
app.use("/categories", categoryRoutes);
app.use("/dashboard", dashboardRoutes);

app.get("/health", (req, res) => {
  res.send("OK");
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});