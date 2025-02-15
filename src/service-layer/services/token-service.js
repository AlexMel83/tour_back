import ApiError from '../../middlewares/exceptions/api-errors.js';
import tokenModel from '../../data-layer/models/token-model.js';
import userModel from '../../data-layer/models/user-model.js';
import { rFcookieOptions } from '../../../config/config.js';
import knex from './../../../config/knex.config.js';
import moment from 'moment-timezone';
import jwt from 'jsonwebtoken';

const {
  JWT_AC_SECRET,
  JWT_AC_EXP,
  JWT_RF_SECRET,
  JWT_RF_EXP,
  JWT_RF_MA,
  JWT_AC_MA,
} = process.env;
const allowedRoles = ['user', 'manager', 'admin'];

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, JWT_AC_SECRET, {
      expiresIn: JWT_AC_EXP,
    });
    const refreshToken = jwt.sign(payload, JWT_RF_SECRET, {
      expiresIn: JWT_RF_EXP,
    });

    const accessTokenExpMs = moment.duration(JWT_AC_MA).asMilliseconds();
    const expAcTokenDate = moment().add(accessTokenExpMs, 'milliseconds');
    const refreshTokenExpMs = moment.duration(JWT_RF_MA).asMilliseconds();
    const expRfTokenDate = moment().add(refreshTokenExpMs, 'milliseconds');

    return {
      accessToken,
      refreshToken,
      expRfToken: expRfTokenDate.toISOString(),
      expAcToken: expAcTokenDate.toISOString(),
    };
  }

  async saveToken(userId, refreshToken, expToken, trx = knex, res) {
    try {
      const token = await tokenModel.saveToken(
        userId,
        refreshToken,
        expToken,
        trx,
      );
      res.cookie('refreshToken', refreshToken, rFcookieOptions);
      return token;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async validateAccessToken(token, next) {
    try {
      const userData = jwt.verify(token, process.env.JWT_AC_SECRET);
      const userDataBase = await userModel.getUsersByConditions({
        email: userData.email,
      });
      if (!userDataBase.length) {
        return next(
          ApiError.NotFound(`email: ${userData.email} was not found`),
        );
      }
      if (!userDataBase[0].isactivated) {
        return next(ApiError.AccessDeniedForRole('User not activated'));
      }
      if (!allowedRoles.includes(userDataBase[0].role)) {
        return next(ApiError.AccessDeniedForRole('Wrong role'));
      }
      return userDataBase[0];
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  validateRefreshToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_RF_SECRET);
      return userData;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async removeToken(refreshToken, trx) {
    try {
      const tokenData = await tokenModel.deleteOneToken(refreshToken, trx);
      return tokenData;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async findToken(refreshToken, trx) {
    const tokenData = await tokenModel.findOneToken(refreshToken, trx);
    return tokenData;
  }
}

export default new TokenService();
