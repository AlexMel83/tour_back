export const {
  PORT,
  JWT_AC_SALT,
  JWT_AC_EXP,
  JWT_AC_TYPE,
  JWT_RF_SALT,
  JWT_RF_EXP,
  JWT_RF_TYPE,
  JWT_AC_MA,
  JWT_RF_MA,
} = process.env;

export const accessToken = {
  salt: JWT_AC_SALT,
  expired: JWT_AC_EXP,
  type: JWT_AC_TYPE,
};

export const refreshToken = {
  salt: JWT_RF_SALT,
  expired: JWT_RF_EXP,
  type: JWT_RF_TYPE,
};

export const rFcookieOptions = {
  maxAge: JWT_RF_MA,
  httpOnly: true,
  sameSite: 'None',
  secure: true,
};

export const aCcookieOptions = {
  maxAge: JWT_AC_MA,
  httpOnly: true,
  sameSite: 'None',
  secure: true,
};
