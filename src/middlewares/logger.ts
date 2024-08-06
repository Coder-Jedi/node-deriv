import { createLogger, format, transports } from 'winston';

// Configure the Winston logger.
const logger = createLogger({
  level: 'debug', // or use config.get('logLevel') if defined in convict schema
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }), // to log stack traces
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'user-service' }, // optional metadata
  transports: [
    // Console transport
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // File transport
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// If in development environment, enable debugging logs
if (process.env.NODE_ENV !== 'production') {
  // logger.add(new transports.Console({
  //   format: format.combine(
  //     format.colorize(),
  //     format.printf(info => '')
  //   )
  // }));
}

export default logger;
