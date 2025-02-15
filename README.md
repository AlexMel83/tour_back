# Інтерактивний туристичний гід Хмельниччини - backend

Цей проєкт створено для популяризації туристичних об'єктів і культурної спадщини Хмельницької області та їх інтеграції з місцевими сервісами та транспортною інфраструктурою.

## Ключові особливості

- Геопросторовий каталог щонайменше 300 туристичних об'єктів
- Інтерактивні 3D-тури для поглибленого ознайомлення із туристичними об'єктами та культурною спадщиною
- Онлайн-мапа з маршрутами громадського транспорту та його моніторингу
- API для інтеграції із іншими туристичними сервісами
- Можливість бронювання послуг креативних індустрій та збору відгуків та пропозицій

## Налаштування

Переконайтесь, що ви встановили всі залежності:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

Запустіть докер з базою даних

```bash
docker compose up -d
```

Запустіть міграції

```bash
npm run db:setup
```

## Запуск сервера розробки

Запустіть сервер за адресою `http://localhost:5050`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Продакшн

Переконайтесь, що ви встановили всі залежності:

```bash
# npm
npm install
# pnpm
pnpm install
# yarn
yarn install
# bun
bun install
```

Запустіть докер

```bash
docker compose up -d
```

Запустіть міграції

```bash
npm run db:setup
```

Якщо контейнер з СУБД Постгіс вже запущений
То створіть базу данних в ньому підключившись до нього, де EXIST_CONTAINER запущений контейнер //ps

```bash
docker exec -it ${EXIST_CONTAINER} psql -U ${POSTGRES_USER} -d postgres
#show exist database
\l
#create database if not exist
CREATE DATABASE tour_db;
#quit from psql
\q
#run migrations
npm run migrate:latest
```

## Деплоймент
