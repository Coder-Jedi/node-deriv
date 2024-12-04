import DBManager from '../dbManager.js';
import BaseModel from './BaseModel.js';


class BinaryordersModel extends BaseModel {

    constructor(dbMgr: DBManager, options: {} = {}) {
        super(dbMgr, options);
        this.modelName = 'binaryorders';
    }

}

export default BinaryordersModel;
