import fs from 'fs';
import path from 'path';
import convict from 'convict';
import cjson from 'cjson';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
    
const __dirname = dirname(fileURLToPath(import.meta.url));

function noop() { }

function pathLoader(relativePath) {
    return path.join(__dirname, '..', relativePath);
}

convict.addFormat('path', noop, pathLoader);

class Config {
    static instance : any = null;
    conf : any = null;

    private constructor() {
        // constructor is private to prevent instantiation
    }

    private setupConfig() {
        const schemas = cjson.load(path.join(__dirname, 'config'));
        this.conf = convict(schemas);

        const envConfig = "env/env." + this.conf.get('app.env') + ".json";

        if (fs.existsSync(envConfig)) {
            this.conf.loadFile(envConfig);
            console.info('app: config loaded from %s', envConfig);
        } else {
            console.info('app: no config file found at %s', envConfig);
        }

        this.conf.validate({ allowed: 'warn' });

        // binding methods
        this.conf._instance.get = this.conf.get.bind(this.conf);

        Config.instance = this.conf._instance;
    }

    static getInstance() {
        if (!Config.instance) {
            new Config().setupConfig();
        }
        return Config.instance;
    }
}

export default Config.getInstance();
