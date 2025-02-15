import UserModel from '../../data-layer/models/user-model.js';
import { generators } from 'openid-client';
import { v4 as uuidv4 } from 'uuid';

export default class FacebookStrategy {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.authUrl = 'https://www.facebook.com/v20.0/dialog/oauth';
    this.tokenUrl = 'https://graph.facebook.com/v20.0/oauth/access_token';
    this.userInfoUrl = 'https://graph.facebook.com/me';
  }

  async generateAuthUrl(origin) {
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = Buffer.from(
      JSON.stringify({ codeVerifier, origin }),
    ).toString('base64');
    const url = `${this.authUrl}?client_id=${this.clientId}&scope=email,public_profile&response_type=code&redirect_uri=${encodeURIComponent(this.redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;
    return { url, state };
  }

  async handleCallback(code, codeVerifier) {
    const authLink = uuidv4();
    try {
      const tokenResponse = await fetch(
        `${this.tokenUrl}?client_id=${this.clientId}&client_secret=${this.clientSecret}&redirect_uri=${this.redirectUri}&code=${code}&code_verifier=${codeVerifier}`,
      );
      const tokenData = await tokenResponse.json();
      if (tokenData.error) {
        throw new Error(tokenData.error.message);
      }
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(
          `Ошибка при получении токена доступа: ${errorData.error || 'Неизвестная ошибка'}`,
        );
      }
      const { access_token } = tokenData;
      const userInfoResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`,
      );
      const userInfo = await userInfoResponse.json();
      if (userInfo.error) {
        throw new Error(userInfo.error.message);
      }
      let user = await UserModel.getUsersByConditions({
        facebook_id: userInfo.id,
      });
      if (user) {
        user = await UserModel.createOrUpdateUser({
          id: user[0].id,
          email: user[0].email,
          activationlink: authLink,
        });
      } else {
        user = await UserModel.createOrUpdateUser({
          email: userInfo.email || '',
          role: 'user',
          name: userInfo.first_name || userInfo.name.split(' ')[0],
          surname: userInfo.last_name || userInfo.name.split(' ')[1],
          picture: userInfo.picture.data.url,
          activationlink: authLink,
          isactivated: true,
          social_login: true,
          facebook_id: userInfo.id,
        });
      }
      return user[0];
    } catch (error) {
      console.error('Error in Facebook callback:', error);
      throw error;
    }
  }
}
