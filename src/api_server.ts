import express from 'express';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import logger from './middlewares/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import configs from './configs/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = configs.get('app').port || 3000;

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Trading Bot API',
    version: '1.0.0',
    description: 'API Documentation for the Trading Bot API',
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.ts'],
};


const loadRoutes = async () => {
  try {
    const files = fs.readdirSync(path.join(__dirname, 'routes'));

    files.forEach(async (file) => {
      if (file.includes('.route')) {
        const route = await import(`./routes/${file}`);
        app.use('/', route.default);
      }
    });
  } catch (err) {
    logger.error('Failed to load route files:', err);
  }
};

const setupServer = async (app: Express) => {
  //swagger setup
  const swaggerSpec = swaggerJSDoc(options);

  //middlewares
  app.use(express.json());
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  //routes
  await loadRoutes();
};

export const start = async () => {
  await setupServer(app);

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
