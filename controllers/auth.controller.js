import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import HttpError from "../models/http-error.js";

export default {
  async signup(req, res, next) {
    try {
      const { name, email, password, bio } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const error = new HttpError("Email already exists!", 403);
        return next(error);
      }

      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(password, salt);

      const user = new User({
        name: name,
        email: email,
        password: hash,
        bio: bio,
        imageUrl: req.file.path,
      });
      const newUser = await user.save();

      const token = jwt.sign(
        {
          email: newUser.email,
          userId: newUser._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        userId: newUser._id,
        token: token,
      });
    } catch (err) {
      const error = new HttpError("Error while signing up", 500);
      return next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        const error = new HttpError(
          "Auth failed .... Email is not registered",
          403
        );
        return next(error);
      }

      const compare = await bcrypt.compare(password, user.password);
      if (!compare) {
        const error = new HttpError(
          "Auth failed .... Password is incorrect",
          403
        );
        return next(error);
      }
      const token = jwt.sign(
        {
          email: user.email,
          userId: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.status(200).json({ userId: user._id, token });
    } catch (err) {
      const error = new HttpError("Error occurred while login!", 500);
      return next(error);
    }
  },

  async getUsers(req, res, next) {
    try {
      let query = {};
      if (req.userData) {
        query = { _id: { $ne: req.userData.userId } };
      }
      const users = await User.find(query);
      return res.status(200).json({ users });
    } catch (err) {
      const error = new HttpError("Fetching users failed!, try again", 500);
      return next(error);
    }
  },

  async findUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        const error = new HttpError("No user found!", 404);
        return next(error);
      }
      return res.status(200).json({ user });
    } catch (e) {
      const error = new HttpError("Fetching user failed!, try again", 500);
      return next(error);
    }
  },
};
