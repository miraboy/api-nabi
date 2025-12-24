const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const requestLogger = require("./middlewares/logger.middleware");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const routes = require("./routes");
require("./utils/db");
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
if (process.env.NODE_ENV !== "test") {
  app.use(requestLogger);
}

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/", routes);

// Error handlers (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
