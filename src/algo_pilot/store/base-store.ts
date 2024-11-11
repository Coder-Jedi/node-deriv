//BaseStore class to be extended by all stores
// A store is a class that handles the connection to a broker apis
//and provides a broker class (which extends BaseBroker) to interact with the broker

import { BaseBroker } from "../broker/base-broker.js";
import { OrderLog } from "../helpers/order-log.js";

export class BaseStore {
    protected _broker: BaseBroker;
    protected _orderLog: OrderLog;

    constructor(orderLog: OrderLog, params?: any) {
        this._orderLog = orderLog;
        this.createBroker();
    }

    async connect() {
        //throw error if not implemented
        throw new Error("connect method not implemented");
    }

    createBroker() {
        //throw error if not implemented
        throw new Error("createBroker method not implemented");
    }
    
    //function to get the broker class
    get broker() {
        return this._broker;
    }

    //function to get the orderLog
    get orderLog() {
        return this._orderLog;
    }
    
}