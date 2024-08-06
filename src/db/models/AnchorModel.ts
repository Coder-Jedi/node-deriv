import DBManager from '../dbManager.js';
import BaseModel from './BaseModel.js';


class AnchorModel extends BaseModel {

    constructor(dbMgr: DBManager, options: {} = {}) {
        super(dbMgr, options);
        this.modelName = 'anchors';
    }

}

export default AnchorModel;
