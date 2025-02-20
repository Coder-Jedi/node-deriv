
import mongoose from 'mongoose';
import connString from './mongoConnectionString.js';
import Bluebird from 'bluebird';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import { fileURLToPath } from 'url';
import logger from '../middlewares/logger.js';
    
const __dirname = path.dirname(fileURLToPath(import.meta.url));


class DBManager {
    private name: string;
    private meta = {service: 'dbManager'};
    private dbConfig: any;
    private connection: mongoose.Connection | null = null;

    constructor(dbConfig) {
        this.name = dbConfig.name || 'dbmanager';
        this.dbConfig = dbConfig;
        mongoose.set('debug', true);
    }

    private prepareDBURL(): string {
        return connString(this.dbConfig);
    }

    private async loadSchemas(modelNames?: string[]): Promise<void> {
        logger.info('loading schemas start', this.meta);

        const schemasPath = path.resolve(__dirname, './schemas');
        const files = fs.readdirSync(schemasPath);

        for (const file of files) {
                if (file.indexOf('.schema') === -1) {
                    return;
                }
                const modelName = file.split('.schema.ts')[0];
                if (modelNames && !modelNames.includes(modelName)) {
                    continue;
                }

                // Require and invoke the schema file
                const schemaModule = await import(path.resolve(schemasPath, file));
            
                // Invoke the schema function with the connection
                schemaModule.default(this.connection);
                
                logger.debug('Schema loaded: ' + file, this.meta);
            };
            logger.info('loading schemas complete', this.meta);
    }

    public init(modelNames?: string[]): Bluebird<void> {
        return new Bluebird<void>(async (resolve, reject) => {
            logger.info(this.name + ' : initialization in progress', this.meta);
            const dbURL = this.prepareDBURL();
            
            console.log("dbURL---", dbURL);
            logger.info('dbURL---' + dbURL, this.meta);

            const options : mongoose.ConnectOptions = {
                serverSelectionTimeoutMS: 1500,
                socketTimeoutMS: 1500
            }
            this.connection = mongoose.createConnection(dbURL, options);

            this.connection.on('open', async () => {
                logger.info(this.name + ' : mongo connection successful', this.meta);
                
                try {
                    await this.loadSchemas(modelNames);

                    resolve();

                } catch (err) {
                    reject(err); // Reject if there's an error loading schemas
                }

                resolve();
            });
            this.connection.on('error', (err) => {
                logger.error(this.name + ' : mongo connection failed', this.meta);
                reject(err);
            });
        });
    }

    public getModel(modelName: string): mongoose.Model<any> {
        if (!this.connection) {
            throw new Error('Connection not initialized');
        }
        return this.connection.model(modelName);
    }
}

export default DBManager;
