import DBManager from "./dbManager.js";
import AnchorModel from "./models/AnchorModel.js";
import BaseModel from "./models/BaseModel.js";

const models :{
    [key: string]: ()=>BaseModel
} = {};


export const initialize = (dbConfig: any): Promise<DBManager> => {
    const dbMgr = new DBManager(dbConfig);

    return dbMgr.init()
        .then(() => {
            initiateModels(dbMgr);
            return dbMgr;
        });
};

const initiateModels = (dbMgr: DBManager) => {
    models['anchors'] = () => {return new AnchorModel(dbMgr)};
}

export const getModelInstance = (modelName: string): BaseModel => {
    if (!models[modelName]) {
        throw new Error(`Model ${modelName} not found`);
    }
    return models[modelName]();
}