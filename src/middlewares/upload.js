import ApiError from '../middlewares/exceptions/api-errors.js';
import { dirname, resolve, join } from 'path';
import utc from 'dayjs/plugin/utc.js';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dayjs from 'dayjs';
import fs from 'fs';

dayjs.extend(utc);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_PATH = resolve(__dirname, '..', '..', '..');
const allowedFileTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/x-icon',
];
const uploadFolder = 'uploads';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const { entity, id } = req.body;
    let uploadDir = null;
    if (!entity || !id) {
      uploadDir = join(BASE_PATH, uploadFolder);
    } else {
      uploadDir = join(BASE_PATH, uploadFolder, `${entity}-${id}`);
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const { entity, id } = req.body;
    const fileName = file.originalname;
    let uploadDir = null;
    if (!entity || !id) {
      uploadDir = join(BASE_PATH, uploadFolder);
    } else {
      uploadDir = join(BASE_PATH, uploadFolder, `${entity}-${id}`);
    }
    const filePath = join(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      const relativePath = path.relative(BASE_PATH, filePath);
      req.fileExists = true;
      req.existingFilePath = relativePath.replace(/\\/g, '/');
      cb(null, fileName);
    } else {
      cb(null, fileName);
    }
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.BadRequest('Wrong image type'));
  }
};

const limits = {
  fileSize: 1024 * 1024 * 5,
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

export const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(ApiError.BadRequest(err.message));
    } else if (err) {
      return next(ApiError.BadRequest(err.message));
    }
    if (!req.file && !req.fileExists) {
      return next(ApiError.BadRequest('No file uploaded'));
    }
    const { entity, id } = req.body;
    let uploadDir = null;
    if (!id || !entity) {
      uploadDir = '/uploads/';
    } else {
      uploadDir = `/uploads/${entity}-${id}/`;
    }
    let filePath, fileUrl;
    if (req.fileExists) {
      filePath = req.existingFilePath;
    } else {
      filePath = uploadDir + req.file.filename;
    }
    filePath = filePath.replace(/^\//, '');
    fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
    res.locals.uploadedFile = {
      url: fileUrl,
      path: filePath,
      filename: req.file ? req.file.filename : path.basename(filePath),
      mimetype: req.file ? req.file.mimetype : null,
      size: req.file ? req.file.size : null,
      message: req.fileExists
        ? 'File already exists'
        : 'File uploaded successfully',
    };
    next();
  });
};
