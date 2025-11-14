const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 4,
      maxLength: 50,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      minLength: 4,
      // validate(value) {
      //   if (!validator.isStrongPassword(value)) {
      //     throw new Error("Enter Strong Password!");
      //   }
      // },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
