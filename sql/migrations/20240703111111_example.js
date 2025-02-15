/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis;');
  const trx = await knex.transaction();
  try {
    await trx.schema.createTable('session', (table) => {
      table.string('sid').primary().notNullable();
      table.json('sess').notNullable();
      table.timestamp('expire').notNullable();
    });
    await trx.schema.createTable('users', (table) => {
      table.increments('id').primary().notNullable();
      table.string('email', 100).nullable().unique().index();
      table.string('password', 100).nullable();
      table.string('role', 50).defaultTo('user').notNullable();
      table.string('name', 50).nullable();
      table.string('surname', 50).nullable();
      table.string('phone', 50).nullable();
      table.boolean('social_login').defaultTo(false).nullable();
      table.string('facebook_id').unique().nullable();
      table.string('google_id').unique().nullable();
      table.text('picture').nullable();
      table.string('activationlink', 255).nullable().index();
      table.boolean('isactivated').defaultTo(false).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    });
    await trx.schema.createTable('tokens', (table) => {
      table.increments('id').primary().notNullable().unique();
      table.integer('user_id').notNullable().unique().index();
      table.text('refreshtoken').notNullable().index();
      table.timestamp('exp_token').notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    });

    await trx.schema.createTable('panoramas', (table) => {
      table.increments('id').primary().notNullable();
      table.integer('user_id').notNullable();
      table.string('title', 100).nullable();
      table.text('description').nullable();
      table.string('address').nullable();
      table.timestamp('shooting_date').defaultTo(knex.fn.now()).notNullable();
      table.decimal('latitude_fact', 9, 7);
      table.decimal('longitude_fact', 9, 7);
      table.decimal('latitude', 9, 7).notNullable();
      table.decimal('longitude', 9, 7).notNullable();
      table.string('view_mode', 10);
      table.decimal('yaw', 5, 2);
      table.decimal('heading', 6, 2);
      table.decimal('tilt', 5, 2);
      table.string('pano_id', 50);
      table.text('thumbnail_url');
      table.integer('image_width');
      table.integer('image_height');
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
    });

    await trx.commit();
  } catch (error) {
    console.error(error);
    await trx.rollback();
    throw Error('Failed migration');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
  const trx = await knex.transaction();
  try {

    await trx.schema.dropTableIfExists('panoramas');
    await trx.schema.dropTableIfExists('tokens');
    await trx.schema.dropTableIfExists('users');
    await trx.schema.dropTableIfExists('session');
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw new Error(`Migration rollback failed: ${error.message}`);
  }
};
