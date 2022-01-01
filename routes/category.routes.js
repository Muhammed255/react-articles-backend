import express from "express";
import categoryController from "../controllers/category.controller.js";
import { checkAuth } from "../middleware/check-auth.js";

export const categoryRoutes = express.Router();

categoryRoutes.post("/new-cat", checkAuth, categoryController.create_category);

categoryRoutes.get("/get-all", categoryController.findAllCategories);

categoryRoutes.delete("/:catId", checkAuth, categoryController.removeCategory);
