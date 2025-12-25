const morgan = require('morgan');
const logger = require('../utils/logger');

// Format personnalisé pour les logs
morgan.token('body', (req) => {
  // Ne pas logger les mots de passe
  if (req.body && req.body.password) {
    const sanitized = { ...req.body };
    sanitized.password = '[HIDDEN]';
    return JSON.stringify(sanitized);
  }
  return JSON.stringify(req.body);
});

// Configuration Morgan pour les logs de requêtes
const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms :body',
  {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      }
    }
  }
);

module.exports = requestLogger;