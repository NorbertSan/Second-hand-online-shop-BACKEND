const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const productsRouter = require("./routes/product");
const usersRouter = require("./routes/user");
const commentsRouter = require("./routes/comment");
require("dotenv").config();
const multer = require("multer");

const app = express();
const port = process.env.PORT || 5000;
const config = require("./config/key");

app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const uri = process.env.ATLAS_URI;
const connect = mongoose
  .connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

// ROUTES
app.use("/user", usersRouter);
app.use("/product", productsRouter);
app.use("/comment", commentsRouter);
app.use("/uploads", express.static("uploads"));
// UPLOAD IMAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".jpg" || ext !== ".png") {
      return cb(res.status(400).end("only jpg, png are allowed"), false);
    }
    cb(null, true);
  },
});
const upload = multer({ storage }).single("file");

app.post("/uploadImage", async (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ success: false, err });
    }
    return res.json({
      success: true,
      image: res.req.file.path,
      fileName: res.req.file.filename,
    });
  });
});

// // Serve static assets if in production
// if (process.env.NODE_ENV === "production") {
//   // Set static folder
//   app.use(express.static("client/build"));

//   // index.html for all page routes
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "../client", "build", "index.html"));
//   });
// }

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
