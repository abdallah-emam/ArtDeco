const express = require('express');

const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const userRouter = require('./routes/userRoutes');
const contractorRouter = require('./routes/contractorRoutes');
const jobRouter = require('./routes/jobRoutes');
const contractRouter = require('./routes/contractRoutes');
const jobHistoryRouter = require('./routes/jobHistoryRoutes');

const app = express();
// 1) Global middilware
// Enable All CORS Requests
app.use(cors());

// SET security HTTP header
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    // ...
  })
);

// Serving static files
// app.use(express.static(`${__dirname}/public`));
//static files
app.use(express.static('puplic'));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Boddy Parser, reading date from body to req.body
app.use(express.json()); // express.json({limit : '10kb'})

// Data sanitize aginst noSQL Query injection
app.use(mongoSanitize()); //look at req.body, req.Str and req.parms and filter out all od the $ and dot

// Data sanitize aginst XSS
app.use(xss()); // cean up any user input from malicouis HTML code

// 3) ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/contractors', contractorRouter);
app.use('/api/v1/job', jobRouter);
app.use('/api/v1/contract', contractRouter);
app.use('/api/v1/jobHistory', jobHistoryRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
