import express from "express";
import { checkAuth } from "../middleware/check-auth.js";
import articlePostController from "../controllers/article-post.controller.js";

import fileUpload from "../middleware/file-upload.js";

export const articlePostRoutes = express.Router();

articlePostRoutes.post(
  "/add-post",
  checkAuth,
  fileUpload.single("article_image"),
  articlePostController.add_post
);

articlePostRoutes.post(
  "/add-comment",
  checkAuth,
  articlePostController.articleComment
);

articlePostRoutes.post(
  "/do-reply",
  checkAuth,
  articlePostController.articleCommentReply
);

articlePostRoutes.post(
  "/like-article",
  checkAuth,
  articlePostController.likeArticle
);

articlePostRoutes.post(
  "/dislike-article",
  checkAuth,
  articlePostController.disLikeArticle
);

articlePostRoutes.post(
  "/search-article",
  articlePostController.articles_search
);

articlePostRoutes.get("/get-articles", articlePostController.getArticles);

articlePostRoutes.get("/:postId", articlePostController.findArticle)

articlePostRoutes.get("/user/:userId", articlePostController.getUserArticles);


articlePostRoutes.put(
  "/add-to-bookmark/:postId",
  checkAuth,
  articlePostController.addArticleToBookmark
);

articlePostRoutes.put(
  "/remove-from-bookmark/:postId",
  checkAuth,
  articlePostController.removeArticleFromBookmarks
);

articlePostRoutes.get(
  "/admin-articles/:adminId",
  articlePostController.getSpecificAdminArticles
);

articlePostRoutes
  .route("/:postId")
  .put(checkAuth, articlePostController.updateArticle)
  .delete(checkAuth, articlePostController.deleteArticle);
