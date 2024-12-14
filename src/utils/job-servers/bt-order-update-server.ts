// this is the job server for updating the latest status of the orders to the mongodb which are in PENDING status
// in the init() function we are initializing the db and starting the order log update
// in the startOrderLogUpdate() : at regular intervals of 60 seconds:
// we'll get the PENDING orders from the db and call the statement api of deriv to get the transactions of the user account
// we'll check if the orderId is present in the transactions and the action_type is sell, then we'll update the status of the order to COMPLETED and update the actualPayout

import { LiveTrader } from "../../algo_pilot/genesis/live-trader.js";
import configs from "../../configs/index.js";
import * as db from '../../db/index.js';
import DerivAPI from '@deriv/deriv-api/dist/DerivAPI.js';
import WebSocket from 'ws';
import { getTimeoutPromise } from "../helpers/helper-functions.js";
import logger from "../../middlewares/logger.js";


// Map to track active live traders
let liveTrader: LiveTrader;

const init = async () => {
    const dbConfig = configs.get('db');
    await db.initializeSpecificModels(dbConfig, ['binaryorders']);

}

try {
    init().then(() => {
        logger.info('DB initialized', { service: 'bt-order-update-job-server' });
        startOrderLogUpdate();
    })
} 
catch (error) {
    console.error('Unexpected error:', error);
    if(process?.send){
        process?.send({ type: 'error', msg: "Unexpected error: " + ((error as any)?.message || 'Unknown error') });
    }
    process.exit(1); // Exit with a non-zero code to indicate failure
}

// a function to add the orderLog of each live trader to the mongodb in the binaryorders collection at regular intervals
// this function will be called at time of initialization of the job server
const startOrderLogUpdate = async () => {
    await updateOrdersInDb();

    const interval = 60000; // 60 seconds
    setInterval(async () => {
        await updateOrdersInDb();
    }, interval);
} 

// function to log orders
const updateOrdersInDb = async () => {
    // get the appId and authToken from the env variables
    const derivConfig = configs.get('deriv');
    const appId = derivConfig?.appId;
    const authToken = derivConfig?.authToken;

    // get the order logs from the db which are in PENDING status
    const binaryorders = db.getModelInstance("binaryorders");
    const pendingOrders = await binaryorders.find({ 'binaryOrder.status': 'PENDING' });

    console.log('Pending orders:', pendingOrders.length);

    let transactions: any[] = [];

    // get the transactions of the user account
    const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
    const api = new DerivAPI({ connection });
    const basicApi = api.basic;

    // authorize if authToken is provided
    if(authToken){
        const authorize = getTimeoutPromise(()=> basicApi.authorize({authorize: authToken, add_to_login_history: 1}), 4000);
        await authorize()
        .then((res:any)=>{
            console.log('Authorized');
        })
        .catch((err:any)=>{
            throw new Error(err);
        });
    }else{
        throw new Error('No authToken provided');
    }

    console.log('Getting transactions');
    // get the transactions of the user account
    const statement = getTimeoutPromise(()=> basicApi.send({
        "statement": 1,
        "description": 1,
        "limit": 999,
    }), 4000);

    await statement().then((res:any) => {
        if(res?.statement?.transactions){
            transactions = res.statement.transactions || [];
        }
    })
    .catch((err:any) => {
        throw new Error(err);
    });

    console.log('Transactions received:', transactions.length);

    // check if the orderId is present in the transactions and the action_type is sell
    // then update the status of the order to COMPLETED and update the actualPayout
    // example of transaction object:
    // {
    //     "action_type": "sell",
    //     "amount": 0,
    //     "app_id": 2,
    //     "balance_after": 9905.4,
    //     "contract_id": 265218820108,
    //     "longcode": "Win payout if Volatility 10 Index is higher than or equal to entry spot at 2 minutes after contract start time.",
    //     "payout": 1.95,
    //     "purchase_time": 1733316575,
    //     "reference_id": 528734954468,
    //     "shortcode": "CALLE_R_10_1.95_1733316575_1733316695_S0P_0",
    //     "transaction_id": 528735325988,
    //     "transaction_time": 1733316696
    // },
    for (let order of pendingOrders) {
        let plainOrder = order.toObject();
        const transaction = transactions.find((transaction) => String(transaction.contract_id) === String(plainOrder?.orderId) && transaction.action_type === 'sell');
        if(transaction){
            plainOrder.binaryOrder.status = 'COMPLETED';
            plainOrder.binaryOrder.actualPayout = transaction.sell_price;
            // update plainOrder.result : 'WIN' | 'LOSS' | 'TIE' | null;
            if(transaction.amount === 0){
                plainOrder.binaryOrder.result = 'LOSS';
            }else if(transaction.amount > 0 && transaction.amount < transaction.payout){
                plainOrder.binaryOrder.result = 'TIE';
            }else if(transaction.amount >= transaction.payout){
                plainOrder.binaryOrder.result = 'WIN';
            }

            await binaryorders.update({ orderId: plainOrder.orderId }, plainOrder);
        }
    }
    




}