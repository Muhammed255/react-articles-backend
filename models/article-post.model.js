import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ObjectId = Schema.Types.ObjectId;

// Validate Function to check comment length
let commentLengthChecker = (comment) => {
  // Check if comment exists
  if (!comment[0]) {
    return false; // Return error
  } else {
    // Check comment length
    if (comment[0].length < 1 || comment[0].length > 200) {
      return false; // Return error if comment length requirement is not met
    } else {
      return true; // Return comment as valid
    }
  }
};

// Array of Comment validators
const commentValidators = [
  // First comment validator
  {
    validator: commentLengthChecker,
    message: "Comments may not exceed 200 characters.",
  },
];

// Declare the Schema of the Mongo model
var articlePostSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  article_image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    required: true,
  },
  autherId: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  comments: [
    {
      comment: { type: String, validate: commentValidators },
      commentator: { type: Schema.Types.ObjectId, ref: "User" },
      comment_date: { type: Date, default: Date.now },
      replies: [
        {
          reply: { type: String, validate: commentValidators },
          replier: { type: Schema.Types.ObjectId, ref: "User" },
          reply_date: { type: Date, default: Date.now },
        },
      ],
    },
  ],
  created: {
    type: Date,
    default: Date.now,
  },
  likedBy: [
    {
      type: ObjectId,
      ref: "User",
    },
  ],
  likes: {
    type: Number,
    default: 0,
  },
});

articlePostSchema.index({ title: "text", content: "text" });

export default mongoose.model("ArticlePost", articlePostSchema);
