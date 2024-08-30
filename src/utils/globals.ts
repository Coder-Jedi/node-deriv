import { getModelInstance } from '../db/index.js';
import DBManager from '../db/dbManager.js';
import * as db from '../db/index.js';
import BaseModel from '../db/models/BaseModel.js';

class Globals {
    private static instance: Globals;
    private config: any;
    public dbManager: DBManager;
    public redis: any;
    public logger: any;

    private constructor() {
        // Private constructor ensures the class cannot be instantiated outside of getInstance method
    }

    static getInstance(): Globals {
        if (!Globals.instance) {
            Globals.instance = new Globals();
        }
        return Globals.instance;
    }

    async initializeDatabase(): Promise<void> {
        const dbConfig = this.config.get('db');
        this.dbManager = await db.initialize(dbConfig);
    }

    async prepareGlobalConstants() {
        // this.redis = await redisConnection();
        this.logger = "logger";
    }

    async init (config): Promise<void> {
        this.config = config;
        await this.prepareGlobalConstants();
        await this.initializeDatabase();
    }

    public getModelInstance(modelName: string) : BaseModel {
        return getModelInstance(modelName);
    }
}

export default Globals.getInstance();
