const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const clothesRouter = require("./routes/cloth");
const usersRouter = require("./routes/user");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
});

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB databese connection established successfully");
});

app.use("/cloth", clothesRouter);
app.use("/user", usersRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
