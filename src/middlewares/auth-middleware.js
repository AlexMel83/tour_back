import tokenService from '../service-layer/services/token-service.js';
import ApiError from '../middlewares/exceptions/api-errors.js';

export default async function (req, res, next) {
  try {
    const authorizationHeader = req.get('authorization').split(' ');
    if (authorizationHeader[0] !== 'Bearer' && !authorizationHeader[1]) {
      next(ApiError.UnauthorizedError('Token not found'));
    }
    const accessToken = authorizationHeader[1];
    const userData = await tokenService.validateAccessToken(accessToken, next);
    if (!userData) {
      next(ApiError.AccessDeniedForRole('Token not valid'));
    }
    req.user = userData;
    next();
  } catch (error) {
    next(ApiError.UnauthorizedError(error.detail));
  }
}
