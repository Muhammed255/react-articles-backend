import Category from "../models/category.model.js";
import HttpError from "../models/http-error.js";

export default {
  async create_category(req, res, next) {
    try {
      const { name, description } = req.body;
      const newCat = new Category({
        name,
        description,
        userId: req.userData.userId,
      });
      await newCat.save();
      return res.status(200).json({ msg: "Category created!" });
    } catch (err) {
      const error = new HttpError("Error while creating catgeory!", 500);
      return next(error);
    }
  },

  async findAllCategories(req, res, next) {
    try {
      const categories = await Category.find()
        .populate({ path: "userId", model: "User", select: "-password -__v" })
        .exec();
      return res.status(200).json({ categories });
    } catch (err) {
      const error = new HttpError("Error while fetching categories", 404);
      return next(error);
    }
  },
  async removeCategory(req, res, next) {
    try {
      const catToDelete = await Category.findById(req.params.catId);

      if (catToDelete) {
        const error = new HttpError("No category found", 404);
        return next(error);
      }

      if (catToDelete.userId.toString() !== req.userData.userId.toString()) {
        const error = new HttpError(
          "Not allowed to deleted this category!!",
          403
        );
        return next(error);
      }

      await Category.findByIdAndDelete(req.params.catId);
      res.status(200).json({ msg: "removed" });
    } catch (err) {
      const error = new HttpError("Error deleting category", 404);
      return next(error);
    }
  },
};
