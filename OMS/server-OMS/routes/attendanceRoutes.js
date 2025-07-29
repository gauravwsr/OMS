import express from "express";
import { getAllAttendance } from "../controllers/attendanceController.js";

const router = express.Router();
router.get("/", getAllAttendance);
export default router;
