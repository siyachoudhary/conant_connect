const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");
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

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

function sendEmail({ recipient_email, OTP }) {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD,
      },
    });

    const mail_configs = {
      from: process.env.MY_EMAIL,
      to: recipient_email,
      subject: "CONANT CONNECT PASSWORD RECOVERY",
      html: `<!DOCTYPE html>
<html lang="en" >
<head>
  <meta charset="UTF-8">
  <title>CodePen - OTP Email Template</title>
  

</head>
<body>
<!-- partial:index.partial.html -->
<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
  <div style="margin:50px auto;width:70%;padding:20px 0">
    <div style="border-bottom:1px solid #eee">
      <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Conant Connect</a>
    </div>
    <p style="font-size:1.1em">Hi,</p>
    <p>Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 5 minutes</p>
    <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
    <p style="font-size:0.9em;">Regards,<br />Conant Connect Team</p>
    <hr style="border:none;border-top:1px solid #eee" />
    <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
      <p>Conant Connect</p>
    </div>
  </div>
</div>
<!-- partial -->
  
</body>
</html>`,
    };
    transporter.sendMail(mail_configs, function (error, info) {
      if (error) {
        console.log(error);
        return reject({ message: `An error has occured` });
      }
      return resolve({ message: "Email sent succesfuly" });
    });
  });
}

app.post("/send_recovery_email", (req, res) => {
  User.findOne({ email: req.body.recipient_email })
  .then((user)=>{
    if(user==null){
      res.status(500).send({
        message: error.message
      });
    }else{
      sendEmail(req.body)
      .then((response) => res.send(response.message))
      .catch((error) => res.status(500).send(error.message));
    }
  })
  .catch((error)=>{
    res.status(500).send({
      message: error.message
    });
  })
  
});

// reset password endpoint
app.post("/resetPassword", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      User.updateOne({ email: request.body.email }, { "$set":{"password": hashedPassword}})
        // return success if the new user is added to the database successfully
        
        .then((user) => {

          User.findOne({ email: request.body.email }) 
          .then((user) => {
            if(user.user_type=="student"){
              response.status(201).send({
                email: user.email,
                first: user.first,
                last: user.last,
                type: user.user_type,
                _id: user._id,
                grade:user.grade
              });
            }else{
              response.status(201).send({
                email: user.email,
                first: user.first,
                last: user.last,
                type: user.user_type,
                _id: user._id
              });
            }
        })
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: error.message
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

// register endpoint
app.post("/registerstudent", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      const user = new User({
        email: request.body.email,
        first: request.body.first,
        last: request.body.last,
        password: hashedPassword,
        grade: request.body.grade,
        user_type: request.body.type,
        complete: request.body.complete,
        bio: "",
        interest: []
      });

      // save the new user
      user.save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            email: request.body.email,
            first: request.body.first,
            last: request.body.last,
            type: request.body.user_type,
            _id: result._id,
            grade: result.grade,
            bio: result.bio,
            complete: request.body.complete,
            interest: result.interest
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: error.message
          });
        });
});

})


// register endpoint
app.post("/registermentor", (request, response) => {
  // hash the password
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      // create a new user instance and collect the data
      const user = new User({
        email: request.body.email,
        first: request.body.first,
        last: request.body.last,
        password: hashedPassword,
        user_type: request.body.type,
        complete: request.body.complete,
        college: "",
        major: "",
        bio: "",
        interest: []
      });

      // save the new user
      user.save()
        // return success if the new user is added to the database successfully
        .then((result) => {
          response.status(201).send({
            email: request.body.email,
            first: request.body.first,
            last: request.body.last,
            type: request.body.type,
            _id: result._id,
            complete: request.body.complete,
            college: result.college,
            major: result.major,
            bio: result.bio,
            interest: result.interest
          });
        })
        // catch error if the new user wasn't added successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: error.message
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

          if(user.user_type=="mentor"){
            //   return success response for mentor
            response.status(200).send({
              email: user.email,
              first: user.first,
              last: user.last,
              _id: user._id,
              type: user.user_type,
              complete: user.complete,
              college: user.college,
              major: user.major,
              bio: user.bio,
              interest: user.interest,
              token,
            });
          }else{
            //   return success response for student
            response.status(200).send({
              email: user.email,
              first: user.first,
              last: user.last,
              _id: user._id,
              grade: user.grade,
              type: user.user_type,
              complete: user.complete,
              interest: user.interest,
              token,
            });
          }
          
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


// edit mentor endpoint
app.post("/editmentor", (request, response) => {
      // create a new user instance and collect the data
    User.updateOne({ email: request.body.email }, { "$set":{"first": request.body.first, "last":request.body.last, "college":request.body.college, "major":request.body.major, "bio":request.body.bio, "complete":request.body.complete, "interest": request.body.interest}}, {runValidators:true,new:true}) 
    .then((result) => {
    User.findOne({ email: request.body.email })
      .then((user) =>{
        // return success if the new user is edited to the database successfully
          response.status(201).send({
            email: request.body.email,
            first: request.body.first,
            last: request.body.last,
            type: user.user_type,
            _id: user._id,
            complete: request.body.complete,
            college: request.body.college,
            major: request.body.major,
            bio: request.body.bio,
            interest: request.body.interest,
          });
        })
      })
        // catch error if the new user wasn't edited successfully to the database
        .catch((error) => {
          response.status(500).send({
            message: error.message
          });
        });
});

// edit student endpoint
app.post("/editstudent", (request, response) => {
  // create a new user instance and collect the data
  User.updateOne({ email: request.body.email }, { "$set":{"first": request.body.first, "last":request.body.last, "grade":request.body.grade, "bio":request.body.bio, "complete":request.body.complete, "interest": request.body.interest}}, {runValidators:true,new:true}) 

    // return success if the new user is edited to the database successfully
    .then((result) => {

      User.findOne({ email: request.body.email })
      .then((user) =>{
        console.log(user)
        response.status(201).send({
          email: request.body.email,
          first: request.body.first,
          last: request.body.last,
          type: user.user_type,
          _id: user._id,
          complete: request.body.complete,
          grade: request.body.grade,
          bio: request.body.bio,
          interest: request.body.interest,
        });
      })
      
    })
    // catch error if the new user wasn't added edited to the database
    .catch((error) => {
      response.status(500).send({
        message: error.message
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
