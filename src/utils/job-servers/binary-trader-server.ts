// this is the job server for binary trader
// it will receive messages from the main server to start/stop live trading for a symbol and timeframe
// it will create a new instance of live trader for the given symbol and timeframe, and start live trading
// it wil also stop the live trading for the given symbol and timeframe based on the message received from the main server
// it will also send the status of the live traders to the main server
// it will maintain a map of active live traders
// it will get the mongodb instance for the binaryorders collection : it will provide the instance to the live trader

import { LiveTrader } from "../../algo_pilot/genesis/live-trader.js";
import configs from "../../configs/index.js";
import * as db from '../../db/index.js';
import { IMessage } from "../constants/interfaces.js";


// Map to track active live traders
let liveTrader: LiveTrader;

const init = async () => {
    const dbConfig = configs.get('db');
    await db.initializeSpecificModels(dbConfig, ['binaryorders']);

    await startOrderLogUpdate();

}

try {
    init().then(() => {
        process.on('message', async (msg: IMessage) => {
            try {
                if (msg.type === 'start' && msg?.data) {
                    // initialize and start the live trader
                    liveTrader = new LiveTrader(msg.data);
                    liveTrader.start();
                } else if (msg.type === 'stop') {
                    // push the order logs to the db
                    await logOrdersToDb();

                    // exit the process
                    process.exit(0);
                }
            } catch (error) {
                console.error('Error handling message:', error);
                if(process?.send){
                    process?.send({ type: 'error', msg: (error as any)?.message || 'Unknown error' });
                }
                process.exit(1); // Exit with a non-zero code to indicate failure
            }
        });
    }).catch((error) => {
        console.error('Failed to initialize:', error);
        if(process?.send){
            process?.send({ type: 'error', msg: "Failed to initialize: " + ((error as any)?.message || 'Unknown error') });
        }
        process.exit(1); // Exit with a non-zero code to indicate failure
    });
} catch (error) {
    console.error('Unexpected error:', error);
    if(process?.send){
        process?.send({ type: 'error', msg: "Unexpected error: " + ((error as any)?.message || 'Unknown error') });
    }
    process.exit(1); // Exit with a non-zero code to indicate failure
}

// a function to add the orderLog of each live trader to the mongodb in the binaryorders collection at regular intervals
// this function will be called at time of initialization of the job server
const startOrderLogUpdate = async () => {
    const interval = 30000; // 30 seconds
    setInterval(async () => {
        await logOrdersToDb();
    }, interval);
} 

// function to log orders
const logOrdersToDb = async () => {
    if(!liveTrader) {
        return;
    }
    const orderLogs: any[] = [];
    orderLogs.push(...liveTrader.getOrderLogs());
    liveTrader.clearOrderLogs();

    const binaryorders = db.getModelInstance("binaryorders");
    // if new orderId is same as existing orderId, update the order, else create a new order
    for (let orderLog of orderLogs) {
        await binaryorders.findOneAndUpdate({orderId: orderLog.orderId}, orderLog, {upsert: true});
    }

}