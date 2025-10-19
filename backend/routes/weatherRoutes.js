import express from "express";
import { getWeatherForPlace } from "../controllers/weatherController.js";

const router = express.Router();

router.get("/weather", getWeatherForPlace);

export default router;
