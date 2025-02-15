import ApiError from '../../middlewares/exceptions/api-errors.js';
import UserModel from '../../data-layer/models/user-model.js';
import tokenService from './token-service.js';
import mailService from './mail-service.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const { CLIENT_URL } = process.env;

class UserService {
  async login(email, password, trx, res) {
    const user = await UserModel.getUsersByConditions({ email, password });
    if (!user?.length) {
      throw ApiError.NotFound(`Користувач з email: ${email} не знайдений`);
    }
    if (!user[0].isactivated) {
      throw ApiError.BadRequest(`Обліковий запис: ${email} не активовано`);
    }
    const isPassEquals = await bcrypt.compare(password, user[0]?.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest('Невірний пароль');
    }
    delete user[0]?.password;
    const tokens = tokenService.generateTokens({ ...user[0] });
    await tokenService.saveToken(
      user[0]?.id,
      tokens.refreshToken,
      tokens.expRfToken,
      trx,
      res,
    );
    delete tokens.refreshToken;
    delete tokens.expRfToken;
    return { user: user[0], tokens };
  }

  async registration(email, password, role, trx) {
    const candidate = await UserModel.getUsersByConditions({ email }, trx);
    if (candidate?.length) {
      throw ApiError.ConflictRequest(`Обліковий запис ${email} вже існує`);
    }
    if (role != 'user' && role != 'manager' && role != 'admin') {
      throw ApiError.BadRequest(`роль ${role} не дійсна`);
    }
    const activationlink = uuidv4();
    const hashPassword = await this.hashPassword(password);
    const [user] = await UserModel.createOrUpdateUser(
      { email, password: hashPassword, role, activationlink },
      trx,
    );
    delete user?.password;
    await mailService.sendActivationMail(
      email,
      `${CLIENT_URL}/activate/${activationlink}`,
    );
    return {
      user: user,
    };
  }

  async activate(activationlink, trx) {
    const user = await UserModel.getUsersByConditions({
      activationlink,
    });
    if (user?.length && !user[0]?.isactivated) {
      const [activatedUser] = await UserModel.activateUser(user[0]?.email, trx);
      if (!activatedUser) {
        throw ApiError.BadRequest('Помилка активації');
      }
      return activatedUser;
    } else if (user?.length && user[0]?.isactivated) {
      throw ApiError.BadRequest('Користувач вже активований');
    } else {
      throw ApiError.NotFound('Код активації недійсний');
    }
  }

  async logout(refreshToken, trx) {
    const result = await tokenService.removeToken(refreshToken, trx);
    return result;
  }

  async refresh(refreshToken, trx, res) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken, trx);
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }
    const user = await UserModel.getUsersByConditions(
      { email: userData.email },
      trx,
    );
    const tokens = tokenService.generateTokens({ ...user[0] });
    await tokenService.saveToken(
      user[0]?.id,
      tokens.refreshToken,
      tokens.expRfToken,
      trx,
      res,
    );
    delete tokens.refreshToken;
    delete tokens.expRfToken;
    return { tokens, user: user[0] };
  }

  async hashPassword(password) {
    const hashPassword = await bcrypt.hash(password, 3);
    return hashPassword;
  }
}

export default new UserService();
