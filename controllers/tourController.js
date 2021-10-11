const Tour = require('../models/tourmodel');
const APIFeatures = require('../utilities/apiFeatures');
const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingsAverage,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const feature = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const tours = await feature.query;
  // const tours = await Tour.find()
  //   .where('duration')
  //   .equals(5)
  //   .where('difficulty')
  //   .equals('easy');

  res.status(200).json({
    status: 'success',

    result: tours.length,
    data: {
      tours,
    },
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id })

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
///agregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

/*
////handling get requests
app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});
////checking body of request with express
exports.checkBody = (req, res, next) => {
  console.log(req.body);
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'bad request',
    });
  }
  next();
};

/////handling req parameters ///id is the parameter

app.get('/api/v1/tours/:id', (req, res) => {
  //   const parameters = req.params;
  //   console.log(req.params);
  //   if (parameters.id < 0 || parameters.id >= tours.length) {
  //     res.status(404).send(`No tour is found with this id:${parameters.id}`);
  //     return;
  //   }
  //   const outputTour = tours[parameters.id];

  const id = req.params.id * 1; ///converting to number
  const tour = tours.find((el) => el.id === id);
  //   if (id < 0 || id >= tours.length)
  if (!tour) {
    res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
    return;
  }
  res.status(200).json({
    status: 'success',

    data: {
      tour,
    },
  });
});

////optional chaining in req parameters
// app.get('/api/v1/tours/:id/:x/:y?', (req, res) => {
//     console.log(req.params);
//     res.status(200).json({
//       status: 'sucess',
//       // result: tours.length,
//       // data: {
//       //   tours,
//       // },
//     });
//   });

////handling post requests
app.post('/api/v1/tours', (req, res) => {
  //   console.log(req.body);
  /// giving it new id
  const newId = tours[tours.length - 1].id + 1;
  ///merging two objects
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    () => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
  //   res.send('Done');
});

///updating the data ///patch request
app.patch('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1; ///converting to number
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
    return;
  }

  ///work to update data in json then

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<updated tour>',
    },
  });
});

/////Delete request
app.delete('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1; ///converting to number
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
    return;
  }

  ///work to update data in json then
  ///status code for confirming the delete
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
*/
///1A.)filtering
// const queryObj = { ...req.query };
// const exludeField = ['page', 'sort', 'limit', 'fields']; //field which will be taken care of later
// exludeField.forEach((el) => delete queryObj[el]);
// // const tours = await Tour.find(queryObj);
// ///create query
// ///1B.) advance Filtering
// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\bgte|gt|lte|lt\b/g, (match) => `$${match}`);
// let query = Tour.find(JSON.parse(queryStr));
///2.)Sorting
// if (req.query.sort) {
//   const sortBy = req.query.sort.split(',').join(' ');
//   query = query.sort(sortBy);
// } else {
//   query = query.sort('-createdAt');
// }
///3.) limiting fields(projections)
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields);
// } else {
//   query = query.select('-__v');
// }

///4.) pagination
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit);

// if (req.query.page) {
//   const numTour = Tour.countDocuments();
//   if (skip >= numTour) throw new Error('This page does not exist');
// }

///Execute query
