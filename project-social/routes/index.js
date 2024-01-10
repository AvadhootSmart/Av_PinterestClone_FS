var express = require("express");
var router = express.Router();
const userModel = require("./users");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
const postModel = require("./post");

passport.use(new localStrategy(userModel.authenticate()));

/* GET Routes */
router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/register", function (req, res, next) {
  res.render("registration");
});

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const User = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("profile", { User });
});

router.get("/edit", (req, res) => {
  res.render("edit");
});

router.get("/createPost", (req, res) => {
  res.render("createPost");
});

router.get("/post/:id", isLoggedIn, async (req, res) => {
  const User = await userModel.findOne({ username: req.session.passport.user });
  const postId = req.params.id;
  const post = await postModel.findById(postId).populate("user");
  const postData = post;
  res.render("postPage", { User, postData });
});

router.get("/feed", isLoggedIn, async (req, res) => {
  const User = await userModel.findOne({ username: req.session.passport.user });
  const posts = await postModel.find().populate("user");

  res.render("feed", { User, posts });
});

//POST Routes:

router.post("/register", function (req, res, next) {
  var userdata = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  });

  userModel.register(userdata, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/feed",
    failureRedirect: "/",
  })
);

router.post(
  "/fileupload",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    const User = await userModel.findOne({
      username: req.session.passport.user,
    });
    User.profileImage = req.file.filename;
    await User.save();
    res.redirect("/profile");
  }
);

router.post("/edit", isLoggedIn, async (req, res) => {
  const EditedUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  EditedUser.username = req.body.username;
  EditedUser.name = req.body.name;
  await EditedUser.save();
  res.redirect("/profile");
});

router.post(
  "/createPost",
  isLoggedIn,
  upload.single("postImage"),
  async function (req, res) {
    const User = await userModel.findOne({
      username: req.session.passport.user,
    });
    const post = await postModel.create({
      user: User._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    });

    User.posts.push(post._id);
    await User.save();
    res.redirect("/feed");
  }
);

//Middlewares

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

module.exports = router;
