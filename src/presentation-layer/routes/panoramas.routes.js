import validateMiddleware from '../../middlewares/validate-middleware.js';
// import authMiddleware from '../../middlewares/auth-middleware.js';
import panoramasController from '../controllers/panoramas-controller.js';
import { query } from 'express-validator';

const validateQueryPanorama = [
  query('id')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('id is number'),
  query('user_id')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('user_id is number'),
  query('title')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('title is string'),
  query('description')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('description is string'),
];

export default function (app) {
  app.get(
    '/panoramas',
    validateQueryPanorama,
    validateMiddleware,
    panoramasController.getPanoramas,
  );
}
