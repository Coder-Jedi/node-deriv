import Bluebird from 'bluebird';
import debug from 'debug';
import { Model, Document, QueryOptions } from 'mongoose';
import DBManager from '../dbManager.js';


// Define an interface for query options
interface FindQueryOptions extends QueryOptions {
    limit?: number;
    skip?: number;
    sort?: any;
}

class BaseModel {
    private dbMgr: DBManager;
    private options: {};
    private debug: debug.Debugger;
    protected modelName: string = ""; // Add the modelName property

    constructor(dbMgr: DBManager, options: {} = {}) {
        this.dbMgr = dbMgr;
        this.options = options;
        this.debug = debug('model:' + this.constructor.name);
    }

    private getModel(name: string): Bluebird<Model<Document>> {
        return Bluebird.resolve(this.dbMgr.getModel(name));
    }

    public find(query: any, projections?: any, qOpts?: QueryOptions): Bluebird<Document[]> {
        return this.getModel(this.modelName)
            .then((model) => model.find(query, projections, qOpts).exec());
    }

    public findOne(query: any, projections?: any, qOpts?: QueryOptions): Bluebird<Document | null> {
        return this.getModel(this.modelName)
            .then((model) => model.findOne(query, projections, qOpts).exec());
    }

    public create(rec: any, opts?: any): Bluebird<any> {
        const data = Array.isArray(rec) ? rec : [rec];
        opts = opts || {};
        return this.getModel(this.modelName)
            .then((model) => model.create(data, opts));
    }

    public save(rec: any): Bluebird<any> {
        return this.getModel(this.modelName)
            .then((model) => {
                const record = new model(rec);
                return record.save();
            });
    }

    public update(matchCnd: any, updateArgs: any, opts?: any): Bluebird<any> {
        opts = opts || {};
        if (!updateArgs) {
            return Bluebird.reject(new Error('updateArgs missing'));
        }

        return this.getModel(this.modelName)
            .then((model) => {
                // Add modified date to document if it exists in the dbschema
                if (model.schema.paths['mOn']) {
                    if (updateArgs.$set) {
                        updateArgs.$set.mOn = new Date();
                    } else {
                        updateArgs.$set = { mOn: new Date() };
                    }
                }
                return model.updateMany(matchCnd, updateArgs, opts).exec();
            })
            .catch(err => Bluebird.reject(err));
    }

    public findOpts(query: any, qOpts: FindQueryOptions, op: { limit: number; skip: number }, sortBy?: any): Bluebird<Document[]> {
        return this.getModel(this.modelName)
            .then((model) => model.find(query, qOpts).limit(op.limit).skip(op.skip).sort(sortBy).exec());
    }

    public count(matchCnd: any): Bluebird<number> {
        return this.getModel(this.modelName)
            .then((model) => model.countDocuments(matchCnd).exec())
            .catch(err => Bluebird.reject(err));
    }

    public findOneAndUpdate(query: any, update: any, opts?: any): Bluebird<any> {
        opts = opts || { new: true };
        return this.getModel(this.modelName)
            .then((model) => model.findOneAndUpdate(query, update, opts).exec())
            .catch(err => Bluebird.reject(err));
    }

    
}

export default BaseModel;
