import fs from "fs";
import path from "path";

import express from "express";
import mongoose from "mongoose";
import compression from "compression";
import cors from "cors";
import HttpError from './models/http-error.js';

import dotenv from "dotenv";

dotenv.config();

import { authRouter } from "./routes/auth.routes.js";
import { categoryRoutes } from "./routes/category.routes.js";
import { articlePostRoutes } from "./routes/article-post.routes.js";
import { tagRoutes } from "./routes/tag.routes.js";

const app = express();

const port = process.env.PORT || 8888;

app.use(compression());

app.use(express.json());

app.use("/images", express.static(path.join("images")));

// Mongoose Connection to Database
mongoose.Promise = global.Promise;

mongoose
  .connect(process.env.DATABASE_URL, {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("Connected to mongo db ....");
  })
  .catch((err) => {
    console.log("Error occur " + err);
  });

//Setup CORS
app.use(cors());

app.use("/api/users", authRouter);

app.use("/api/categories", categoryRoutes);

app.use("/api/tags", tagRoutes);

app.use("/api/articles", articlePostRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  console.log(error.message);
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

app.listen(port, () => {
  console.log("running on port " + port);
});
