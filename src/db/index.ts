import DBManager from "./dbManager.js";
import AnchorModel from "./models/AnchorModel.js";
import BaseModel from "./models/BaseModel.js";
import CandlestickModel from "./models/CandlestickModel.js";

const models :{
    [key: string]: ()=>BaseModel
} = {};

const modelMapping = {
    'anchors': AnchorModel,
    'candlesticks': CandlestickModel
};


export const initialize = (dbConfig: any): Promise<DBManager> => {
    const dbMgr = new DBManager(dbConfig);

    return dbMgr.init()
        .then(() => {
            initiateModels(dbMgr);
            return dbMgr;
        });
};

export const initializeSpecificModels = (dbConfig: any, modelNames: string[]): Promise<DBManager> => {
    const dbMgr = new DBManager(dbConfig);

    return dbMgr.init()
        .then(() => {
            initiateModels(dbMgr, modelNames);
            return dbMgr;
        });
}

const initiateModels = (dbMgr: DBManager, modelNames?: string[]) => {
    if (modelNames) {
        for (const modelName of modelNames) {
            if (!modelMapping[modelName]) {
                throw new Error(`Model ${modelName} not found`);
            }
            models[modelName] = () => {return new modelMapping[modelName](dbMgr)};
        }
    }
    else{
        for (const modelName in modelMapping) {
            models[modelName] = () => {return new modelMapping[modelName](dbMgr)};
        }
    }
}

export const getModelInstance = (modelName: string): BaseModel => {
    if (!models[modelName]) {
        throw new Error(`Model ${modelName} not found`);
    }
    return models[modelName]();
}