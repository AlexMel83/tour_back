import uploadsRouteInit from './uploads.routes.js';
import authRouteInit from './auth.routes.js';
import memoriesRouteInit from './memories.routes.js';
import panoramasRouteInit from './panoramas.routes.js';
import geoQueriesRouteInit from './geo-queries.routes.js';

const routeInit = (app, express) => {
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  authRouteInit(app);
  memoriesRouteInit(app);
  panoramasRouteInit(app);
  uploadsRouteInit(app);
  geoQueriesRouteInit(app);
};

export default routeInit;
