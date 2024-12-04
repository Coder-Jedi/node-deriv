import DBManager from '../dbManager.js';
import BaseModel from './BaseModel.js';


class BinarybotsModel extends BaseModel {

    constructor(dbMgr: DBManager, options: {} = {}) {
        super(dbMgr, options);
        this.modelName = 'binarybots';
    }

}

export default BinarybotsModel;
