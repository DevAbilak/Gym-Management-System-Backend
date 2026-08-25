const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const requestId = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || uuidv4();
  req.id = reqId;

  req.log = logger.child({ reqId: req.id });

  res.setHeader('X-Request-Id', reqId);

  // log request start
  req._startTime = Date.now();

  // log request on finish
  res.on('finish', () => {
    const duration = Date.now() - req._startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    req.log[logLevel](
      {
        reqId: req.id,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      },
      `${req.method} ${req.url} -> ${res.statusCode}`,
    );
  });

  next();
};

module.exports = { requestId };
