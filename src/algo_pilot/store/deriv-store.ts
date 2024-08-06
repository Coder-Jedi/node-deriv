
import DerivAPI from '@deriv/deriv-api/dist/DerivAPI.js';
import WebSocket from 'ws';
import { DerivBroker } from '../broker/deriv-broker.js';

export class DerivStore {

    private appId : string;
    private api : DerivAPI;
    basicApi: any;
    private _broker: DerivBroker;

    constructor(appId:string) {
        this.appId = appId;
        // app_id 1089 is for testing, create your own app_id and use it here.
        // go to api.deriv.com to register your own app.
        const connection = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
        this.api         = new DerivAPI({ connection });
        this.basicApi = this.api.basic;

        this._broker = new DerivBroker(this);
    }

    get broker() {
        return this._broker;
    }

    
}