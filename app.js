const express = require("express");
const morgan = require("morgan");

const userRouter = require("./routes/userRoutes");

const app = express();

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serving static files
app.use(express.static(`${__dirname}/public`));
app.use(express.json());

// 3) ROUTES
app.use('/api/v1/users', userRouter);

module.exports = app;
