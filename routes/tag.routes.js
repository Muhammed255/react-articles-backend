import express from "express";

import { checkAuth } from "../middleware/check-auth.js";
import tagController from "../controllers/tag.controller.js";

export const tagRoutes = express.Router();

tagRoutes.post("/create", checkAuth, tagController.create_tag);

tagRoutes.get("/all-tags", tagController.getAllTags);

tagRoutes.route("/:tagId").delete(checkAuth, tagController.removeTag);
