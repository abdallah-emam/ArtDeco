const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const userRouter = require('./routes/userRoutes');
const contractorRouter = require('./routes/contractorRoutes');
const applicationRouter = require('./routes/applicationRoutes');

const app = express();

// Enable All CORS Requests
app.use(cors());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serving static files
app.use(express.static(`${__dirname}/public`));
app.use(express.json());

// 3) ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/contractors', contractorRouter);
app.use('/api/v1/application', applicationRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
