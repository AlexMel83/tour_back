import socialLoginService from '../../service-layer/services/social-login-service.js';
import validateMiddleware from '../../middlewares/validate-middleware.js';
import authMiddleware from '../../middlewares/auth-middleware.js';
import userController from '../controllers/user-controller.js';
import { body, param } from 'express-validator';

const { CLIENT_URL } = process.env;

const phoneRegex = /^380\d{9}$/;
const validateUser = [
  body('id')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('Поле "id" має формат number'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .isAscii()
    .withMessage('Поле "email" має формат email@email.ua'),
  body('password')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ min: 4, max: 32 }),
  body('name')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Поле "name" має бути рядком'),
  body('surname')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Поле "surname" має бути рядком'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(phoneRegex)
    .withMessage('Поле "phone" має формат 380123456789'),
  body('role')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Поле "role" має бути рядком'),
];

export default function (app) {
  app.post(
    '/registration',
    validateUser,
    validateMiddleware,
    userController.registration,
  );

  app.post('/login', validateUser, validateMiddleware, userController.login);

  app.post('/logout', userController.logout);
  app.post(
    '/activate/',
    body('activationlink')
      .notEmpty()
      .isUUID()
      .withMessage('Поле "activationlink" має бути UUID'),
    validateMiddleware,
    userController.activate,
  );
  app.get('/refresh', userController.refresh);
  app.get('/users', authMiddleware, validateMiddleware, userController.getUser);

  app.put(
    '/users',
    authMiddleware,
    validateUser,
    validateMiddleware,
    userController.updateUser,
  );

  app.delete(
    '/users/:user_id',
    authMiddleware,
    param('user_id').exists().isNumeric(),
    validateMiddleware,
    userController.deleteUser,
  );

  app.get('/social-login/:provider', async (req, res, next) => {
    try {
      const provider = req.params.provider;
      const origin = req.get('origin') || req.get('referer') || CLIENT_URL;
      const { url, codeVerifier } = await socialLoginService.generateAuthUrl(
        provider,
        origin,
      );
      req.session.codeVerifier = codeVerifier;
      req.session.origin = origin;
      console.log(
        'SocLogin: Code verifier, origin, url:',
        codeVerifier,
        origin,
        url,
      ); //1-soclogin
      console.log('Before saving session:', req.session);
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return next(err);
        }
        console.log('Session after save:', req.session);
        res.json({ url });
      });
    } catch (e) {
      next(e);
    }
  });

  app.get('/social-login/:provider/callback', async (req, res) => {
    const provider = req.params.provider;
    const code = req.query.code;
    const state = req.query.state;
    if (!code || !state) {
      return res.status(400).json({ error: 'Invalid code or state' });
    }
    await socialLoginService.handleCallback(provider, code, state, res);
  });

  app.post('/auth-user/:link', async (req, res, next) => {
    const authLink = req.params.link;
    await socialLoginService.getAuthUser(authLink, res, next);
  });
}
