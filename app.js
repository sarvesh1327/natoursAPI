const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utilities/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');

const app = express();
/// 1.)Middlewares
// console.log(process.env.NODE_ENV);
//Global Middlewares
///Securing HTTP routes using Multiple headers
app.use(helmet());
///using Morgan just for DEVs
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
///Limit requests from the same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' })); ///body-parser for incoming json

///data sanatisation against NOSQL query injection
app.use(mongoSanitize());
//data sanatisation against XSS
app.use(xss());
/// removing the HTTP parameters pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratinsQuantitiy',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(express.static(`${__dirname}/public`)); //static html

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

///routes as middleware
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

///routing using express
///get
// app.get('/', (req, res) => {
//   res.status(200).send('Hello from the other side....');
// });
// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the other side....', app: 'natours' });
// });

// /////post
// app.post('/', (req, res) => {
//   res.send('You can sent to this endpoint');
// });

// console.log(tours);
