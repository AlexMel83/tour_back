import userService from '../../service-layer/services/user-service.js';
import ApiError from '../../middlewares/exceptions/api-errors.js';
import userModel from '../../data-layer/models/user-model.js';
import { rFcookieOptions } from '../../../config/config.js';
import knex from './../../../config/knex.config.js';
import tokenService from './../../service-layer/services/token-service.js';

const queryMappings = {
  id: 'id',
  email: 'email',
  name: 'name',
  surname: 'surname',
  phone: 'phone',
  role: 'role',
  activationlink: 'activationlink',
  facebook_id: 'facebook_id',
  google_id: 'google_id',
};

class UserController {
  async login(req, res, next) {
    const trx = await knex.transaction();
    try {
      const { email, password } = req.body;
      const userData = await userService.login(email, password, trx, res);
      await trx.commit();
      return res.json(userData);
    } catch (error) {
      await trx.rollback();
      if (error.code === 'ECONNREFUSED') {
        return next(ApiError.IntServError('Connection refused'));
      }
      if (error.status === 400) {
        return next(ApiError.BadRequest(error.message));
      } else if (error.status === 404) {
        return next(ApiError.NotFound(error.message));
      } else {
        return next(ApiError.IntServError(error.message));
      }
    }
  }

  async registration(req, res, next) {
    let trx;
    try {
      trx = await knex.transaction();
      const { email, password, role } = req.body;
      const userData = await userService.registration(
        email,
        password,
        role,
        trx,
      );
      await trx.commit();
      return res.json(userData);
    } catch (error) {
      await trx.rollback();
      console.error(error);
      if (error.status === 400) {
        return next(ApiError.BadRequest(error));
      } else if (error.code === 'ESOCKET') {
        return next(ApiError.IntServError('mail-server error'));
      } else if (error.status === 409) {
        return next(error);
      } else {
        return next(ApiError.IntServError(error));
      }
    }
  }

  async activate(req, res, next) {
    const trx = await knex.transaction();
    try {
      const activationlink = req.body.activationlink;
      const user = await userService.activate(activationlink, trx);
      const tokens = tokenService.generateTokens({ ...user[0] });
      await tokenService.saveToken(
        user[0].id,
        tokens.refreshToken,
        tokens.expRfToken,
        trx,
        res,
      );
      delete tokens.refreshToken;
      delete tokens.expRfToken;
      const userData = {
        user: user[0],
        tokens,
      };
      await trx.commit();
      return res.json(userData);
    } catch (error) {
      await trx.rollback();
      if (error.status === 400) {
        return next(ApiError.BadRequest(error));
      } else if (error.status === 404) {
        return next(ApiError.NotFound(error));
      } else {
        console.error(error);
        return next(ApiError.IntServError(error));
      }
    }
  }

  async logout(req, res) {
    const trx = await knex.transaction();
    try {
      let { refreshToken } = req.cookies;
      const token = await userService.logout(refreshToken, trx);
      res.clearCookie('refreshToken');
      await trx.commit();
      if (token === null) {
        return res.json(ApiError.BadRequest('User has already logged out'));
      } else if (token === 1) {
        return res.json('User logout completed successfully');
      }
      return res.json(token);
    } catch (error) {
      await trx.rollback();
      console.error(error);
      if (error.status === 400) {
        return res.json(ApiError.BadRequest(error));
      } else {
        return res.json(ApiError.IntServError(error));
      }
    }
  }

  async refresh(req, res) {
    const trx = await knex.transaction();
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return res.json(
          ApiError.BadRequest('Користувач не автентифікований. Авторизуйтесь'),
        );
      }
      const userData = await userService.refresh(refreshToken, trx, res);
      res.cookie('refreshToken', userData.refreshToken, rFcookieOptions);
      await trx.commit();
      return res.json(userData);
    } catch (error) {
      if (trx) {
        await trx.rollback();
      }
      console.error('Error:', error);
      if (error.status === 400) {
        return res.json(ApiError.BadRequest(error));
      } else {
        return res.json(ApiError.IntServError(error));
      }
    }
  }

  async getUser(req, res) {
    const user = req.user;
    let conditions = {};
    try {
      const queryParams = req.query;
      for (const key in queryParams) {
        const mappedKey = queryMappings[key];
        if (mappedKey) {
          conditions[mappedKey] = queryParams[key];
        }
      }
      let response;
      if (req?.query?.id) {
        response = await userModel.getUsersByConditions({ id: req.query.id });
        if (user.id === response[0].id) {
          return res.json(response);
        } else {
          return res.send(ApiError.AccessDeniedForRole('User not owner'));
        }
      } else if (req.user.role === 'admin') {
        response = await userModel.getUsersByConditions(conditions);
        if (!response) {
          return res.json(ApiError.NotFound('Memories not found'));
        }
        return res.json(response);
      } else {
        return res.json(ApiError.BadRequest('parametr not found'));
      }
    } catch (error) {
      console.error(error);
      if (error.status === 400) {
        return res.json(ApiError.BadRequest(error));
      } else if (error.status === 404) {
        return res.json(ApiError.NotFound(`id: ${req.query.id} was not found`));
      } else {
        return res.json(ApiError.IntServError(error));
      }
    }
  }

  async updateUser(req, res) {
    const fields = req.body;
    const userData = req.user;
    let userDataBase = null;
    userDataBase = await userModel.getUsersByConditions({
      id: userData.id,
    });
    if (!userDataBase.length) {
      return res.json(
        ApiError.NotFound(`user with id: ${userData.id} was not found`),
      );
    }
    if (fields.email && userDataBase[0].role === admin) {
      userDataBase = await userModel.getUsersByConditions({
        email: fields.email,
      });
    }
    let updatedUser = {};
    if (fields?.password) {
      fields.password = await userService.hashPassword(fields.password);
    }
    const payload = {
      id: userDataBase[0].id,
      email: userData.email,
      password: fields?.password ?? userDataBase[0].password,
      name: fields?.name ?? userDataBase[0].name,
      surname: fields?.surname ?? userDataBase[0].surname,
      phone: fields?.phone ?? userDataBase[0].phone,
      role: fields?.role ?? userDataBase[0].role,
      activationlink: fields?.activationlink ?? userDataBase[0].activationlink,
      isactivated: fields?.isactivated ?? userDataBase[0].isactivated,
      social_login: fields?.social_login ?? userDataBase[0].social_login,
      facebook_id: fields?.facebook_id ?? userDataBase[0].facebook_id,
      google_id: fields?.google_id ?? userDataBase[0].google_id,
      picture: fields?.picture ?? userDataBase[0].picture,
      updated_at: new Date().toISOString(),
    };
    const trx = await knex.transaction();
    try {
      if (userData.role === 'admin') {
        updatedUser = await userModel.createOrUpdateUser(payload, trx);
        return res.status(200).json(updatedUser);
      } else if (userData.id === userDataBase[0].id) {
        payload.role = userDataBase[0].role;
        payload.activationlink = userDataBase[0].activationlink;
        payload.isactivated = userDataBase[0].isactivated;
        updatedUser = await userModel.createOrUpdateUser(payload);
        await trx.commit();
        return res.status(200).json(updatedUser);
      } else {
        await trx.rollback();
        return res.json(ApiError.AccessDeniedForRole('User not owner'));
      }
    } catch (error) {
      await trx.rollback();
      console.error(error);
      if (error.status === 400) {
        return res.json(ApiError.BadRequest(error));
      } else {
        return res.json(ApiError.IntServError(error));
      }
    }
  }

  async deleteUser(req, res) {
    const user_id = req.params.user_id;

    const userDataBase = await userModel.getUsersByConditions({ user_id });
    if (!userDataBase) {
      return res.json(
        ApiError.NotFound(`user with email: ${user_id} was not found`),
      );
    }

    let response;
    try {
      const role = req.user.role;
      if (role === 'admin') {
        response = await userModel.deleteUser(user_id);
        return res.status(200).json(response);
      } else {
        return res.json(ApiError.AccessDeniedForRole('User not owner'));
      }
    } catch (error) {
      console.error(error);
      if (error.status === 400) {
        return res.json(ApiError.BadRequest(error));
      } else {
        return res.json(ApiError.IntServError(error));
      }
    }
  }
}

export default new UserController();
