const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const productsRouter = require("./routes/product");
const usersRouter = require("./routes/user");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const config = require("./config/key");

app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(express.json());

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
app.use("/uploads", express.static("uploads"));

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
