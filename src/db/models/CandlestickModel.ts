import DBManager from '../dbManager.js';
import BaseModel from './BaseModel.js';


class CandlestickModel extends BaseModel {

    constructor(dbMgr: DBManager, options: {} = {}) {
        super(dbMgr, options);
        this.modelName = 'candlesticks';
    }

}

export default CandlestickModel;
