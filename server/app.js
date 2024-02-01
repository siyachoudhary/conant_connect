const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const express = require("express");
const app = express();
const bodyParser = require('body-parser');

const dbConnect = require("./db/dbConnect");

const User = require("./db/userModel");

const auth = require("./auth");

dbConnect();

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// body parser configuration
app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (request, response, next) => {
  response.json({ message: "Hey! This is your server response!" });
  next();
});


// register endpoint
app.post("/register", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        name: request.body.name,
        password: hashedPassword,
        user_type: request.body.type
      });

      // save the new user
      user.save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            email: request.body.email,
            name: request.body.name,
            type: request.body.user_type,
            _id: result._id
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: error.message,
            error,
          });
        });
    })
    // catch error if the password hash isn't successful
    .catch((e) => {
      response.status(500).send({
        message: "Password was not hashed successfully",
        e,
      });
    });
});

// login endpoint
app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email })
    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)
        // if the passwords match
        .then((passwordCheck) => {
          // check if password matches
          if(!passwordCheck) {
            return response.status(400).send({
              message: "Password does not match",
              error,
            });
          }
          //   create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email
            },
            "RANDOM-TOKEN",
            { expiresIn: "24h" }
          );
          //   return success response
          response.status(200).send({
            email: user.email,
            name: user.name,
            _id: user._id,
            profile: user.imgProfile,
            token,
          });
        })
        // catch error if password does not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

// // update endpoint
// app.post("/updateUser/:email", (request, response) => {
//   // check if email exists
//   console.log(request.body.name )
//   User.updateOne({ email: request.params.email }, { "$set":{"email": request.body.email, "name":request.body.name}}, {runValidators:true,new:true}) 
//     .then((user) => {
//       const token = jwt.sign(
//         {
//           userId: user._id,
//           userEmail: user.email
//         },
//         "RANDOM-TOKEN",
//         { expiresIn: "24h" }
//       );
      
//       User.findOne({ email: request.body.email }) 
//     .then((user) => {
//       response.status(200).send({
//         message: "data stored successfully",
//         email: request.body.email,
//         name: request.body.name,
//         _id:request.body.userId,
//         profile: user.imgProfile,
//         token,
//       });
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "user not found, proceed",
//         e,
//       });
//     });

//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not update user",
//         e,
//       });
//     });
// });

// // delete endpoint
// app.post("/checkDuplicates/:email", (request, response) => {
//   // check if email exists
//   console.log(request.params.email)
//   User.findOne({ email: request.params.email }) 
//     .then((user) => {
//       console.log(user)
//       if(user!=null){
//         response.status(200).send({
//           message: "user found successfully",
//         });
//       }else{
//         response.status(404).send({
//           message: "user not found, proceed",
//         });
//       }
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "user not found, proceed",
//         e,
//       });
//     });
// });

// // delete endpoint
// app.post("/deleteUser/:email", (request, response) => {
//   // check if email exists
//   User.deleteOne({ email: request.params.email }) 
//     .then(() => {
//       response.status(200).send({
//         message: "user deleted successfully",
//       });
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not delete user",
//         e,
//       });
//     });
// });

// //  get all user friends
// app.get("/getUsers/:emailStr", (request, response) => { 
//   User.find({$or: [{name: {$regex: request.params.emailStr, $options: "i"}}, {email: {$regex: request.params.emailStr, $options: "i"}}]})
//     .then((user) => {
//       response.status(200).send({
//         users: user
//       });
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not find",
//         e,
//       });
//     });
// });

// app.get("/getFriendReqs/:_id", (request, response) => { 
//   User.findOne({ _id: request.params._id }) 
//     .then((user) => {
//       response.status(200).send({
//         users: user.friendReqs
//       });
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "user not found, proceed",
//         e,
//       });
//     });
// });

// app.get("/getPendings/:_id", (request, response) => { 
//   User.findOne({ _id: request.params._id }) 
//     .then((user) => {
//       response.status(200).send({
//         users: user.pendingReqs
//       });
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "user not found, proceed",
//         e,
//       });
//     });
// });

// app.post("/addFriendReq/:_id", (request, response) => {
//   User.updateOne({ _id: request.params._id}, {$push: {friendReqs: request.body.friendReq}},) 
//     .then((user) => {
//       User.updateOne({ _id: request.body.friendReq}, {$push: {pendingReqs: request.params._id}},) 
//       .then((user) => {
//           response.status(200).send({
//             message: "user friend request sent successfully",
//       });
//       })
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not add user friend request",
//         e,
//       });
//     });
// });


// // friends endpoint
// // add friend
// app.post("/addFriends/:_id", (request, response) => {
//   // check if email exists
//   User.updateOne({ _id: request.params._id}, {$push: {friends: request.body.friend}},) 
//     .then((user) => {
//       User.updateOne({ _id: request.body.friend}, {$push: {friends: request.params._id}},) 
//       .then((user) => {
//         User.updateOne({ _id: request.body.friend}, {$pull: {pendingReqs: request.params._id}},) 
//       .then((user) => {
//         User.updateOne({ _id: request.params._id}, {$pull: {friendReqs: request.body.friend}},) 
//       .then((user) => {
//         response.status(200).send({
//           message: "user friend added successfully",
//           friends: user.friends
//       })
//       })
//       })
//     });
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not add user friend",
//         e,
//       });
//     });
// });

// app.post("/declineFriends/:_id", (request, response) => {
//   // check if email exists
//         User.updateOne({ _id: request.body.friend}, {$pull: {pendingReqs: request.params._id}},) 
//       .then((user) => {
//         User.updateOne({ _id: request.params._id}, {$pull: {friendReqs: request.body.friend}},) 
//       .then((user) => {
//         response.status(200).send({
//           message: "user request revoked successfully",
//           friends: user.friends
//       })
//       })
//       })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not add user friend",
//         e,
//       });
//     });
// });

// // remove friend
// app.post("/removeFriend/:_id", (request, response) => {
//   // check if email exists
//   User.updateOne({ _id: request.params._id}, {$pull: {friends: request.body.friend}},) 
//     .then((user) => {
//       User.updateOne({ _id: request.body.friend}, {$pull: {friends: request.params._id}},) 
//       .then((user) => {
//         response.status(200).send({
//           message: "user friend removed successfully",
//           friends: user.friends
//       });
//     });
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not remove user friend",
//         e,
//       });
//     });
// });

// //  get all user friends
// app.get("/findFriends/:_id", (request, response) => {

//   User.findOne({ _id: request.params._id}) 
//     .then((user) => {
//       var allFriends=[]
//       var amount = user.friends.length
//       fetched = 0
//       for(var i = 0; i<amount; i++){
//         (function() {
//         User.findOne({ _id: user.friends[i]}) 
//         .then((user2) => {
//           fetched++
//           // console.log(user2)
//           allFriends.push({
//             name: user2.name,
//             email: user2.email,
//             _id: user2._id,
//             friends: user2.friends,
//             profile: user2.imgProfile
//         });
//         console.log(fetched)
//         if(fetched===amount){
//           console.log(allFriends)
//           response.status(200).send(allFriends)
//           return
//         }
//         })
//         .catch((e) => {
//           console.log(e)
//           response.status(404).send({
//             message: "Could not find user friends",
//             e,
//           });
//         });
//       })();
//       }
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not find user friends",
//         e,
//       });
//     });
// });

// app.get("/findFriendsList/:_id", (request, response) => {
//   User.findOne({ _id: request.params._id}) 
//     .then((user) => {
//       response.json(user.friends)
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not find user friends",
//         e,
//       });
//     });
// });


// app.get("/findUser/:_id", (request, response) => {
//   // check if email exists
//   User.findOne({ _id: request.params._id}) 
//     .then((user) => {
//       response.status(200).send({
//         name: user.name,
//         email: user.email,
//         _id: user._id,
//         friends: user.friends,
//         profile: user.imgProfile
//     });
//     })
//     .catch((e) => {
//       console.log(e)
//       response.status(404).send({
//         message: "Could not find user friends",
//         e,
//       });
//     });
// });


// free endpoint
app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

// authentication endpoint
app.get("/auth-endpoint", auth, (request, response) => {
  response.json({ message: "You are authorized to access me" });
});


module.exports = app;
