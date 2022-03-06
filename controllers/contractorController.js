const multer = require('multer');
const sharp = require('sharp');
const Contractor = require('../models/contractorModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

//dest dir to upload into
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadContractorImages = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'gallery', maxCount: 100 },
]);

exports.resizeUserImages = catchAsync(async (req, res, next) => {
  if (!req.files) return next();

  // 1) photo
  if (req.files.photo) {
    const folderName = `img/contractors/contractor-cover-${
      req.contractor.id
    }-${Date.now()}`;

    req.body.photo = `${req.protocol}://localhost:8000/${folderName}.jpeg`;
    await sharp(req.files.photo[0].buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`puplic/${folderName}.jpeg`);
  }

  // 2) Images
  if (req.files.gallery) {
    req.body.gallery = [];
    const folderName = `img/contractors/contractor-gallery-${
      req.contractor.id
    }-${Date.now()}`;
    await Promise.all(
      req.files.gallery.map(async (file, i) => {
        const filename = `${req.protocol}://localhost:8000/${folderName}-${
          i + 1
        }.jpeg`;

        await sharp(file.buffer)
          .resize(500, 500)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`puplic/${folderName}-${i + 1}.jpeg`);

        req.body.gallery.push(filename);
      })
    );
  }

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllContractors = factory.getAll(Contractor);

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'phone',
    'address',
    'aboutMe'
  );
  if (req.files) {
    filteredBody.gallery = req.body.gallery;
    filteredBody.photo = req.body.photo;
  }

  // 3) Update user document
  const updatedContractor = await Contractor.findByIdAndUpdate(
    req.contractor.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedContractor,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await Contractor.findByIdAndUpdate(req.contractor.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.contractor.id;

  next();
};

exports.getContractor = factory.getOne(Contractor);
exports.updateContractor = factory.updateOne(Contractor);
exports.deleteContractor = factory.deleteOne(Contractor);

// exports.getContractor = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!',
//   });
// };
// exports.createContractor = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!',
//   });
// };
// exports.updateContractor = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!',
//   });
// };
// exports.deleteContactor = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined!',
//   });
// };
