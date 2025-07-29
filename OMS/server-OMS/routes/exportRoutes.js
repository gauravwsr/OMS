import express from "express";
import { exportToExcel } from "../controllers/exportController.js";

const router = express.Router();
router.get("/", exportToExcel);
export default router;
