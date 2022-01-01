import fs from "fs";
import ArticlePost from "../models/article-post.model.js";
import User from "../models/user.model.js";
import HttpError from "../models/http-error.js";

export default {
  async add_post(req, res, next) {
    try {
      const { title, content, category, tag } = req.body;

      const newPost = new ArticlePost({
        title,
        content,
        category: category,
        tag: tag,
        article_image: req.file.path,
        autherId: req.userData.userId,
      });
      await newPost.save();

      const authUser = await User.findById(req.userData.userId);
      if (!authUser) {
        const error = new HttpError("No user found", 404);
        return next(error);
      }
      authUser.articles.push(newPost);
      await authUser.save();

      return res.status(200).json({ msg: "Article created!" });
    } catch (err) {
      const error = new HttpError("Error creating article", 500);
      return next(error);
    }
  },

  async getArticles(req, res, next) {
    try {
      const articles = await ArticlePost.find().populate("autherId");
      return res.status(200).json({ articles });
    } catch (err) {
      const error = new HttpError("Fetching articles failed!, try again", 401);
      return next(error);
    }
  },

  findArticle(req, res, next) {
    ArticlePost.findById(req.params.postId)
      .populate({
        path: "autherId",
        model: "User",
        select: "-password -bookmarks -likes -__v",
      })
      .populate({
        path: "comments.commentator",
        model: "User",
        select: "-password -bookmarks -likes -__v",
      })
      .populate({
        path: "comments.replies.replier",
        model: "User",
        select: "-password -bookmarks -likes -__v",
      })
      .then((article) => {
        if (!article) {
          const error = new HttpError("No article found", 404);
          return next(error);
        }
        return res.status(200).json({ article });
      })
      .catch((err) => {
        const error = new HttpError("Error Fetching article", 500);
        return next(error);
      });
  },

  async updateArticle(req, res, next) {
    try {
      const { title, content } = req.body;

      const article = await ArticlePost.findById(req.params.postId);
      if (!article) {
        const error = new HttpError("No article found", 404);
        return next(error);
      }

      if (article.autherId.toString() !== req.userData.userId.toString()) {
        const error = new HttpError(
          "Not allowed to perform this operation!",
          401
        );
        return next(error);
      }

      article.title = title;
      article.content = content;

      await article.save();

      return res.status(200).json({ msg: "Article updated." });
    } catch (e) {
      const error = new HttpError("Error while updating the article!", 500);
      return next(error);
    }
  },

  async deleteArticle(req, res, next) {
    try {
      const {postId} = req.params;
      const article = await ArticlePost.findById(postId);

      const authUser = await User.findById(req.userData.userId);

      if (!authUser) {
        const error = new HttpError("No user found", 404);
        return next(error);
      }
      if (!article) {
        const error = new HttpError("No article found", 404);
        return next(error);
      }

      if (article.autherId.toString() !== req.userData.userId.toString()) {
        const error = new HttpError(
          "Not allowed to perform this operation!",
          401
        );
        return next(error);
      }

      const filePath = article.article_image;

      await ArticlePost.findOneAndDelete({
        _id: postId,
        autherId: req.userData.userId,
      });
      authUser.articles.pull(postId);
      await authUser.save();

      fs.unlink(filePath, (err) => {
        console.log(err);
      });
      res.status(200).json({ msg: "Deleted!" });
    } catch (err) {
      const error = new HttpError("Error while updating the article!", 500);
      return next(error);
    }
  },

  getUserArticles: async (req, res, next) => {
    try {
      const {userId} = req.params;
      const user = await User.findOne({_id: userId});
      if(!user) {
        const error = new HttpError("Could not find user!", 404);
        return next(error);
      }
      const articles = await ArticlePost.find({autherId: user._id}).populate("autherId");
      if(!articles || articles.length === 0) {
        return next(new HttpError("No articles found for this user", 404));
      }
      return res.status(200).json({articles})
    } catch (err) {
      return next(new HttpError("Error while getting user articles!", 500));
    }
  },

  async articles_search(req, res, next) {
    try {
      const { searchString } = req.body;
      const docs = await ArticlePost.find({
        $or: [
          { title: { $regex: searchString, $options: "i" } },
          { sub_title: { $regex: searchString, $options: "i" } },
          { content: { $regex: searchString, $options: "i" } },
        ],
      });
      if (!docs) {
        return res
          .status(401)
          .json({ success: false, msg: "Could not fetch!" });
      }
      return res
        .status(200)
        .json({ success: true, msg: "fetched", articles: docs });
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, msg: "Error occured: " + err.message });
    }
  },

  async articleComment(req, res, next) {
    try {
      const { comment, articleId } = req.body;
      if (!comment) {
        const error = new HttpError("No comment provided!", 400);
        return next(error);
      }
      if (!articleId) {
        const error = new HttpError("No article id provided!", 400);
        return next(error);
      }
      const article = await ArticlePost.findOne({ _id: articleId });
      if (!article) {
        const error = new HttpError("No article found", 404);
        return next(error);
      }
      // Grab data of user that is logged in
      const authUser = await User.findOne({ _id: req.userData.userId });
      if (!authUser) {
        const error = new HttpError("No user found", 404);
        return next(error);
      }

      const updatedArticle = await ArticlePost.findOneAndUpdate(
        { _id: articleId },
        { $push: { comments: { comment, commentator: authUser._id } } },
        { new: true }
      )
        .populate({
          path: "autherId",
          model: "User",
          select: "-password -bookmarks -likes -__v",
        })
        .populate({
          path: "comments.commentator",
          model: "User",
          select: "-password -bookmarks -likes -__v",
        })
        .populate({
          path: "comments.replies.replier",
          model: "User",
          select: "-password -bookmarks -likes -__v",
        });
      return res.status(200).json({ article: updatedArticle });
    } catch (err) {
      const error = new HttpError("Error while commenting!", 500);
      return next(error);
    }
  },

  articleCommentReply(req, res, next) {
    const replyData = {
      "comments.$.replies": {
        reply: req.body.reply,
        replier: req.userData.userId,
      },
    };

    ArticlePost.findOneAndUpdate(
      { _id: req.body.postId, "comments._id": req.body.commentId },
      {
        $addToSet: replyData,
      },
      { new: true, upsert: true }
    )
      .then((article) => {
        console.log(article);
        res.status(200).json({ article: article });
      })
      .catch((error) => {
        res.status(500).json({ err: "error: " + error });
      });
  },

  addArticleToBookmark(req, res, next) {
    let response = { success: false, msg: "" };
    let fetchedUser;
    User.findOne({ _id: req.userData.userId })
      .then((user) => {
        if (!user) {
          response.msg = "No user found..";
          res.status(400).json({ response });
        }
        fetchedUser = user;
        return ArticlePost.findById(req.params.postId);
      })
      .then((post) => {
        if (!post) {
          response.msg = "No post found..";
          res.status(400).json({ response });
        }
        fetchedUser.bookmarks.push(post._id);
        return fetchedUser.save();
      })
      .then(() => {
        response.success = true;
        response.msg = "Bookmarked...";
        res.status(201).json({ response });
      })
      .catch((err) => {
        response.success = false;
        response.msg = "Error Occurred..";
        const error = new Error(err);
        next(err);
        return res.status(500).json({ response });
      });
  },

  removeArticleFromBookmarks(req, res, next) {
    let response = { success: false, msg: "" };
    let fetchedUser;
    User.findOne({ _id: req.userData.userId })
      .then((user) => {
        if (!user) {
          response.msg = "No user found..";
          res.status(400).json({ response });
        }
        fetchedUser = user;
        return ArticlePost.findById(req.params.postId);
      })
      .then((post) => {
        if (!post) {
          response.msg = "No post found..";
          res.status(400).json({ response });
        }
        const postIndex = fetchedUser.bookmarks.findIndex((id) => {
          return id.toString() === post._id;
        });
        if (postIndex !== -1) {
          fetchedUser.bookmarks.splice(postIndex, 1);
        }
        fetchedUser.bookmarks.pull(post._id);
        return fetchedUser.save();
      })
      .then(() => {
        response.success = true;
        response.msg = "Removed from bookmarks...";
        res.status(201).json({ response });
      })
      .catch((err) => {
        response.success = false;
        response.msg = "Error Occurred..";
        const error = new Error(err);
        next(err);
        return res.status(500).json({ response });
      });
  },

  likeArticle(req, res, next) {
    let response = { success: false, msg: "" };
    if (!req.body.id) {
      response.msg = "No id was provided.";
      res.status(402).json({ response });
    } else {
      ArticlePost.findOne({ _id: req.body.id }, (err, article) => {
        if (err) {
          response.msg = "Invalid article id";
          res.status(402).json({ response });
        } else {
          if (!article) {
            response.msg = "That article was not found.";
            res.status(404).json({ response });
          } else {
            User.findOne({ _id: req.userData.userId }, (err, user) => {
              if (err) {
                response.msg = "Something went wrong.";
                res.status(500).json({ response });
              } else {
                if (!user) {
                  response.msg = "You are not authorized to like this article";
                  res.status(402).json({ response });
                } else {
                  if (user._id === article.autherId) {
                    response.msg = "Cannot like your own post.";
                    res.status(500).json({ response });
                  } else {
                    if (article.likedBy.includes(user._id)) {
                      response.msg = "You already liked this post.";
                      res.status(500).json({ response }); // Return error message
                    } else {
                      // Check if user who liked post has previously disliked a post
                      if (article.dislikedBy.includes(user._id)) {
                        article.dislikes--;
                        const arrayIndex = article.dislikedBy.indexOf(user._id);
                        article.dislikedBy.splice(arrayIndex, 1);
                        article.likes++;
                        article.likedBy.push(user._id);

                        article.save((err) => {
                          if (err) {
                            response.msg = "Something went wrong.";
                            res.status(500).json({ response });
                          } else {
                            response.success = true;
                            response.msg = "article liked!";
                            res.status(200).json({ response });
                          }
                        });
                      } else {
                        article.likes++;
                        article.likedBy.push(user._id);
                        article.save((err) => {
                          if (err) {
                            response.msg = "Something went wrong.";
                            res.status(500).json({ response });
                          } else {
                            response.success = true;
                            response.msg = "article liked!";
                            res.status(200).json({ response });
                          }
                        });
                      }
                    }
                  }
                }
              }
            });
          }
        }
      });
    }
  },

  disLikeArticle(req, res, next) {
    let response = { success: false, msg: "" };
    if (!req.body.id) {
      response.msg = "No id was provided.";
      res.status(402).json({ response });
    } else {
      ArticlePost.findOne({ _id: req.body.id }, (err, article) => {
        if (err) {
          response.msg = "Invalid article id";
          res.status(402).json({ response });
        } else {
          if (!article) {
            response.msg = "That article was not found.";
            res.status(404).json({ response });
          } else {
            User.findOne({ _id: req.userData.userId }, (err, user) => {
              if (err) {
                response.msg = "Something went wrong.";
                res.status(500).json({ response });
              } else {
                if (!user) {
                  response.msg =
                    "You are not authorized to dislike this article";
                  res.status(402).json({ response });
                } else {
                  if (user._id === article.autherId) {
                    response.msg = "Cannot dislike your own post.";
                    res.status(500).json({ response });
                  } else {
                    if (article.dislikedBy.includes(user._id)) {
                      response.msg = "You already disliked this post.";
                      res.status(500).json({ response });
                    } else {
                      if (article.likedBy.includes(user._id)) {
                        article.likes--;
                        const arrayIndex = article.likedBy.indexOf(user._id);
                        article.likedBy.splice(arrayIndex, 1);
                        article.dislikes++;
                        article.dislikedBy.push(user._id);
                        article.save((err) => {
                          if (err) {
                            response.msg = "Something went wrong.";
                            res.status(500).json({ response });
                          } else {
                            response.success = true;
                            response.msg = "article disliked!";
                            res.status(200).json({ response });
                          }
                        });
                      } else {
                        article.dislikes++;
                        article.dislikedBy.push(user._id);
                        article.save((err) => {
                          if (err) {
                            response.msg = "Something went wrong.";
                            res.status(500).json({ response });
                          } else {
                            response.success = true;
                            response.msg = "article disliked!";
                            res.status(200).json({ response });
                          }
                        });
                      }
                    }
                  }
                }
              }
            });
          }
        }
      });
    }
  },

  async getSpecificAdminArticles(req, res, next) {
    let response = { success: false, msg: "", articles: null };
    try {
      const checkAdmin = await User.findById(req.params.adminId);
      if (checkAdmin.role !== "admin") {
        response.msg = "This User is Not Admin";
        return res.status(401).json({ response });
      }
      const articles = await ArticlePost.find({ autherId: req.params.adminId })
        .populate("autherId")
        .populate("comments.commentator")
        .populate("comments.replies.replier");

      response.success = true;
      response.msg = "Fetched ...";
      response.articles = articles;

      return res.status(200).json({ response });
    } catch (err) {
      response.success = false;
      response.msg = "Error Occurred!";
      response.articles = null;
      const error = new Error(err);
      next(error);
      return res.status(500).json({ response });
    }
  },
};
