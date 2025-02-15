import knex from './../../../config/knex.config.js';

const usersTable = 'users';
const userFields = [
  'users.id',
  'users.email',
  'users.name',
  'users.surname',
  'users.phone',
  'users.role',
  'users.activationlink',
  'users.isactivated',
  'users.social_login',
  'users.facebook_id',
  'users.google_id',
  'users.picture',
  'users.created_at',
  'users.updated_at',
];

const conditionHandlers = {
  id: (usersQuery, value) => usersQuery.where('users.id', value),
  email: (usersQuery, value) => usersQuery.where('users.email', value),
  facebook_id: (usersQuery, value) =>
    usersQuery.where('users.facebook_id', value),
  google_id: (usersQuery, value) => usersQuery.where('users.google_id', value),
  name: (usersQuery, value) =>
    usersQuery.where('users.name', 'ilike', `%${value}%`),
  surname: (usersQuery, value) =>
    usersQuery.where('users.surname', 'ilike', `%${value}%`),
  sort_field: (usersQuery, value, sort) => {
    if (sort === 'down') {
      usersQuery.orderBy(value, 'desc');
    } else {
      usersQuery.orderBy(value, 'asc');
    }
  },
};

export default {
  async getUsersByConditions(condition = {}, trx = knex) {
    let sort;
    if ('sortDirection' in condition) {
      sort = condition.sortDirection;
      delete condition.sortDirection;
    }
    if ('password' in condition) {
      userFields.push('users.password');
      delete condition.password;
    }
    try {
      const usersQuery = trx(usersTable).select(userFields);
      for (const [key, value] of Object.entries(condition)) {
        const handler = conditionHandlers[key];
        if (handler) {
          handler(usersQuery, value, sort);
        } else {
          usersQuery.where(key, value);
        }
      }
      const result = await usersQuery;
      if (!result.length) {
        return null;
      }
      return result;
    } catch (error) {
      console.error('Error fetching memories by condition:', error.message);
      throw error;
    }
  },

  async createOrUpdateUser(userData, trx = knex) {
    const existingUser = await trx('users')
      .where('email', userData.email)
      .first();
    let result = null;
    try {
      if (existingUser) {
        result = await trx('users')
          .where('id', existingUser.id)
          .update(userData)
          .returning('*');
      } else {
        result = await trx('users')
          .insert(userData)
          .onConflict('id')
          .merge(userData)
          .returning(userFields);
      }
      if (!result.length) {
        return null;
      }
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async activateUser(email, trx) {
    const result = await trx(usersTable)
      .where({ email })
      .update({ isactivated: true })
      .returning(userFields);
    if (!result.length) {
      return null;
    }
    return [result];
  },

  async deleteUser(userId, trx = knex) {
    try {
      await trx(usersTable).where({ id: userId }).del();
      return { id: userId };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
