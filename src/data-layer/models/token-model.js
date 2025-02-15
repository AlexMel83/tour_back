const tokensTable = 'tokens';
const tokenFields = [
  'id',
  'user_id',
  'refreshtoken',
  'exp_token',
  'updated_at',
  'created_at',
];

export default {
  async getUserToken(user_id, trx) {
    try {
      const tokenData = await trx(tokensTable)
        .select(tokenFields)
        .where({ user_id })
        .first();
      return tokenData;
    } catch (error) {
      console.error('Помилка отримання токена:', error);
      throw error;
    }
  },

  async saveToken(user_id, refreshtoken, exp_token, trx) {
    try {
      const tokenData = await trx(tokensTable)
        .insert({
          user_id,
          refreshtoken,
          exp_token,
        })
        .onConflict('user_id')
        .merge({
          refreshtoken,
          exp_token,
          updated_at: trx.fn.now(),
        })
        .returning(tokenFields);
      if (!tokenData.length) {
        throw new Error('Помилка збереження токена');
      } else return [tokenData];
    } catch (error) {
      console.error('Помилка збереження токена:', error);
      throw error;
    }
  },

  async deleteOneToken(refreshtoken, trx) {
    if (!refreshtoken) {
      throw new Error('No refresh token provided for deletion');
    }
    try {
      const rowsDeleted = await trx(tokensTable).where({ refreshtoken }).del();
      return rowsDeleted;
    } catch (error) {
      console.error('Помилка видалення токена:', error);
      throw error;
    }
  },

  async findOneToken(refreshtoken, trx) {
    try {
      const data = await trx(tokensTable)
        .select(tokenFields)
        .where({ refreshtoken })
        .first();
      return data || null;
    } catch (error) {
      console.error('Помилка пошуку токена:', error);
      throw error;
    }
  },
};
