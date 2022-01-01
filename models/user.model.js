import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

import uniqueValidator from "mongoose-unique-validator";

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bio: {
    type: String,
  },
  bookmarks: [
    {
      type: ObjectId,
      ref: "ArticlePost",
      default: [],
    },
  ],
  likes: [
    {
      type: ObjectId,
      ref: "ArticlePost",
      default: [],
    },
  ],
  imageUrl: {
    type: String,
    required: String,
  },
  articles: [{ type: ObjectId, ref: "ArticlePost", default: [] }],
});

userSchema.plugin(uniqueValidator);

export default mongoose.model("User", userSchema);
