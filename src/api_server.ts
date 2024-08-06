import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import globals from './services/globals.js';
import logger from './middlewares/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

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

const swaggerSpec = swaggerJSDoc(options);

//middlewares
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', async (req, res) => {
  let inst = await globals.getModelInstance('anchors')
  let anchor = await inst.find({name: 'test'});
  if(anchor && anchor.length > 0){
    console.log(anchor[0]);
    res.send(anchor[0]);
  }
  else{
    res.send('No anchor found');
  }
});

app.post('/anchors', async (req, res) => {
  try{
    if(!req.body.name || !req.body.imageUrl || !req.body.updatedBy){
      res.status(400).send('Bad Request');
      return;
    }
    let inst = globals.getModelInstance('anchors');
    let anchor = await inst.create(req.body);
    logger.info('Anchor created', {service : 'api_server', api: 'POST /anchors', anchor});
    res.send(anchor);
  }
  catch(err: any){
    logger.error(err?._message || err, {service: 'api_server', api: 'POST /anchors'});
    res.status(500).send(err);
  }
});

export const start = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

