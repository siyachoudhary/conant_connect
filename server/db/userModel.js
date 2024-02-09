const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please provide an email!"],
        unique: [true, "Email Exist"],
      },

      first: {
        type: String,
        required: [true, "Please provide a name!"],
        unique: false,
      },

      last: {
        type: String,
        required: [true, "Please provide a name!"],
        unique: false,
      },
    
      password: {
        type: String,
        required: [true, "Please provide a password!"],
        // unique: false,
      },

      user_type: {
        type: String,
        required: [true, "Please provide a user type!"],
        // unique: false,
      },

      complete: {
        type: Boolean,
        // unique: false,
      },


      college: {
        type: String,
        // unique: false,
      },

      major: {
        type: String,
        // unique: false,
      },

      grade: {
        type: String,
        // unique: false,
      },

      bio: {
        type: String,
        // unique: false,
      },
  })

  module.exports = mongoose.model.Users || mongoose.model("Users", UserSchema);

  