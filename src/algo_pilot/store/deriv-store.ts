
import DerivAPI from '@deriv/deriv-api/dist/DerivAPI.js';
import WebSocket from 'ws';
import { DerivBroker } from '../broker/deriv-broker.js';
import { BaseStore } from './base-store.js';
import { OrderLog } from '../helpers/order-log.js';

export class DerivStore extends BaseStore {

    private appId : string = '1089';
    private authToken : string = '';
    private authInfo : any;

    private api : DerivAPI;
    basicApi: any;

    constructor(orderLog: OrderLog, params?: any) {
        super(orderLog, params);

        if(params){
            this.appId = params?.appId || this.appId;
            this.authToken = params?.authToken || this.authToken;
        }
    }

    async connect() {
        // app_id 1089 is for testing, create your own app_id and use it here.
        // go to api.deriv.com to register your own app.
        const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);
        this.api         = new DerivAPI({ connection });
        this.basicApi = this.api.basic;
        
        // authorize if authToken is provided
        if(this.authToken){
            await this.basicApi.authorize({authorize: this.authToken, add_to_login_history: 1})
            .then((res:any)=>{
                this.authInfo = res;
                console.log('Authorized');
            })
            .catch((err:any)=>{
                throw new Error(err);
            });
        }
    }

    createBroker() {
        this._broker = new DerivBroker(this);
    }

    
}