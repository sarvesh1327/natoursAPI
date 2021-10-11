const express = require('express');
const morgan = require('morgan');

const AppError = require('./utilities/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');

const app = express();
/// 1.)Middlewares
// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json()); ///body-parser for incoming json
app.use(express.static(`${__dirname}/public`)); //static html

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
