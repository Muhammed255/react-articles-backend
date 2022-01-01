import HttpError from "../models/http-error.js";
import Tag from "../models/tag.model.js";

export default {
  async create_tag(req, res, next) {
    try {
      const { name, description } = req.body;

      const newTag = new Tag({
        name,
        description,
        userId: req.userData.userId,
      });

      await newTag.save();
      res.status(200).json({ msg: "Tag created!" });
    } catch (err) {
      const error = new HttpError("Error while creating tag!", 500);
      return next(error);
    }
  },

  async getAllTags(req, res, next) {
    try {
      const tags = await Tag.find();
      return res.status(200).json({ tags });
    } catch (err) {
      const error = new HttpError("Error while fetching tags", 404);
      return next(error);
    }
  },

  async removeTag(req, res, next) {
    try {
      const tagToDelete = await Tag.findById(req.params.tagId);

      if (!tagToDelete) {
        const error = new HttpError("No tag found", 404);
        return next(error);
      }

      if (tagToDelete.userId.toString() !== req.userData.userId.toString()) {
        const error = new HttpError("Not allowed to deleted this tag!!", 404);
        return next(error);
      }

      await Tag.findOneAndRemove({
        _id: req.params.tagId,
        userId: req.userData.userId,
      });
      res.status(200).json({ msg: "Removed!" });
    } catch (err) {
      const error = new HttpError("Error deleting category", 404);
      return next(error);
    }
  },
};
