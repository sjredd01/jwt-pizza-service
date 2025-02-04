const express = require("express");
const { createAuthRouter, setAuthUser } = require("./routes/authRouter.js");
const { createOrderRouter } = require("./routes/orderRouter.js");
const { createFranchiseRouter } = require("./routes/franchiseRouter.js");
const version = require("./version.json");
const { DB } = require("./database/database.js");

async function createApp(config) {
  const app = express();

  const db = new DB(config);
  await db.initialized;

  app.use(express.json());
  app.use((req, res, next) => setAuthUser(db, req, res, next));
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    next();
  });

  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  const { authRouter } = createAuthRouter(db);
  const { orderRouter } = createOrderRouter(db, config, authRouter);
  const { franchiseRouter } = createFranchiseRouter(db, authRouter);

  apiRouter.use(
    "/auth",
    (req, res, next) => {
      req.db = db;
      next();
    },
    authRouter
  );

  apiRouter.use(
    "/order",
    (req, res, next) => {
      req.db = db;
      next();
    },
    orderRouter
  );

  apiRouter.use(
    "/franchise",
    (req, res, next) => {
      req.db = db;
      next();
    },
    franchiseRouter
  );

  apiRouter.use("/docs", (req, res) => {
    res.json({
      version: version.version,
      endpoints: [
        ...authRouter.endpoints,
        ...orderRouter.endpoints,
        ...franchiseRouter.endpoints,
      ],
      config: { factory: config.factory.url, db: config.db.connection.host },
    });
  });

  app.get("/", (req, res) => {
    res.json({
      message: "welcome to JWT Pizza",
      version: version.version,
    });
  });

  app.use("*", (req, res) => {
    res.status(404).json({
      message: "unknown endpoint",
    });
  });

  // Default error handler for all exceptions and errors.
  app.use((err, req, res, next) => {
    res
      .status(err.statusCode ?? 500)
      .json({ message: err.message, stack: err.stack });
    next();
  });

  return app;
}

module.exports = createApp;
