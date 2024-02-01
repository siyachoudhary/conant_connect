const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please provide an email!"],
        unique: [true, "Email Exist"],
      },

      name: {
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
  })

  module.exports = mongoose.model.Users || mongoose.model("Users", UserSchema);

  