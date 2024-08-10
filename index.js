const express = require("express");
const connectToMongoDB = require("./database/connection");

const app = express();

// const authRouter = require("./routers/auth.route");
const userRouter = require("./routers/users.route");
const photoRoutes = require("./routers/photo.route");
const postRoutes = require("./routers/post.route");
const catagoryRoutes = require("./routers/catagory.route");

require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/addbanao/users", userRouter);
// app.use("/api/addbanao/auth", authRouter);
app.use("/api/addbanao/photos", photoRoutes);
app.use("/api/addbanao/posts", postRoutes);
app.use("/api/addbanao/catagory", catagoryRoutes);


const port = 8001;
  
connectToMongoDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Not connected", error);
  });
