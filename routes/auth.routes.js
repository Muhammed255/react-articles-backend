import express from "express";
import authController from "../controllers/auth.controller.js";
import { checkAuth } from "./../middleware/check-auth.js";

import fileUpload from '../middleware/file-upload.js'

export const authRouter = express.Router();

authRouter.post("/login", authController.login);

authRouter.post("/signup", fileUpload.single("imageUrl"), authController.signup);

authRouter.get("/get-all", authController.getUsers);

authRouter.get("/:userId", authController.findUserById);

