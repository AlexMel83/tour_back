import knex from '../../../config/knex.config.js';

const panoramasTable = 'panoramas';
const panoramasFields = [
  'panoramas.id',
  'panoramas.user_id',
  'panoramas.title',
  'panoramas.description',
  'panoramas.address',
  'panoramas.shooting_date',
  'panoramas.latitude_fact',
  'panoramas.longitude_fact',
  'panoramas.latitude',
  'panoramas.longitude',
  'panoramas.view_mode',
  'panoramas.yaw',
  'panoramas.heading',
  'panoramas.tilt',
  'panoramas.pano_id',
  'panoramas.thumbnail_url',
  'panoramas.image_width',
  'panoramas.image_height',
  'panoramas.created_at',
  'panoramas.updated_at',
];

const conditionHandlers = {
  id: (panoramasQuery, value) => panoramasQuery.where('panoramas.id', value),
  user_id: (panoramasQuery, value) =>
    panoramasQuery.where('panoramas.user_id', value),
  title: (panoramasQuery, value) =>
    panoramasQuery.where('panoramas.title', 'ilike', `%${value}%`),
  description: (panoramasQuery, value) =>
    panoramasQuery.where('panoramas.description', 'ilike', `%${value}%`),
  sort_field: (panoramasQuery, value, sort) => {
    if (value) {
      panoramasQuery.orderBy(value, sort === 'down' ? 'desc' : 'asc');
    }
  },
};

export default {
  async getPanoramasByCondition(condition = {}, trx = knex) {
    let sort;
    if ('sortDirection' in condition) {
      sort = condition.sortDirection;
      delete condition.sortDirection;
    }
    try {
      const panoramasQuery = trx(panoramasTable).select(panoramasFields);

      for (const [key, value] of Object.entries(condition)) {
        const handler = conditionHandlers[key];
        if (handler) {
          handler(panoramasQuery, value, sort);
        } else {
          panoramasQuery.where(key, value);
        }
      }

      const result = await panoramasQuery;
      if (!result.length) {
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error fetching panoramas by condition:', error.message);
      throw error;
    }
  },
};
