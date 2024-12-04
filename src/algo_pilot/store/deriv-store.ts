
import DerivAPI from '@deriv/deriv-api/dist/DerivAPI.js';
import WebSocket from 'ws';
import { DerivBroker } from '../broker/deriv-broker.js';
import { BaseStore } from './base-store.js';
import { OrderLog } from '../helpers/order-log.js';
import { getTimeoutPromise } from '../../utils/helpers/helper-functions.js';
import { from } from 'rxjs';

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
        console.log("Connecting to Deriv API");
        // connect to the broker. Then check if the connection is successful by this.basicApi.ping()
        // if unsuccessful, try to reconnect after 3 seconds. Do this 3 times before throwing an error.
        let retries = 0;
        let connected = false;
        while(retries < 3 && !connected){
            if(retries > 0){
                console.log(`Retrying connection to Deriv API. Attempt ${retries+1}`);
            }
            try {
                await this.connectLogic();
                connected = true;
            } catch (error:any) {
                console.error('Error connecting to Deriv API:', error?.message);
                retries++;
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        if(!connected){
            throw new Error('Failed to connect to Deriv API. Possible issues: No internet connection, Deriv API server is down, or invalid appId');
        }
    }

    async connectLogic() {

        const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);
        this.api         = new DerivAPI({ connection });
        this.basicApi = this.api.basic;
        
        // check connection with ping
        // pass the ping function to getTimeoutPromise as an arrow function to bind the context - IMPORTANT
        const ping = getTimeoutPromise(()=>this.basicApi.ping(), 4000);
        await ping()
        .then((res:any)=>{
            console.log('Connected to Deriv API, ping successful');
        })
        .catch((err:any)=>{
            throw new Error(err);
        });


        // authorize if authToken is provided
        if(this.authToken){
            const authorize = getTimeoutPromise(()=> this.basicApi.authorize({authorize: this.authToken, add_to_login_history: 1}), 4000);
            await authorize()
            .then((res:any)=>{
                this.authInfo = res;
                console.log('Authorized');
            })
            .catch((err:any)=>{
                throw new Error(err);
            });
        }else{
            console.log('No authToken provided');
        }
    }

    createBroker() {
        this._broker = new DerivBroker(this);
    }

    
}