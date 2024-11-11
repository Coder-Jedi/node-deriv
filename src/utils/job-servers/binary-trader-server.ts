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
const liveTraders = new Map<string, LiveTrader>();

const init = async () => {
    const dbConfig = configs.get('db');
    await db.initializeSpecificModels(dbConfig, ['binaryorders']);

}

init().then(() => {
    process.on('message', async (msg: IMessage) => {
        if (msg.type === 'start' && msg?.data?.symbol && msg?.data?.timeframe && msg?.data?.broker && msg?.data?.strategy) {
            // key is combination of broker, strategy, symbol and timeframe
            const key = `${msg?.data?.broker}_${msg?.data?.strategy}_${msg?.data?.symbol}_${msg?.data?.timeframe}`;
            if (liveTraders.has(key)) {
                console.log(`Already trading for ${msg?.data?.broker}, ${msg?.data?.strategy}, ${msg?.data?.symbol}, ${msg?.data?.timeframe}`);
                return;
            }
            const liveTrader = new LiveTrader({broker: msg?.data?.broker, strategy: msg?.data?.strategy, symbol: msg?.data?.symbol, timeframe: msg?.data?.timeframe});
            liveTraders.set(key, liveTrader);
            liveTrader.start();

        }
        else if (msg.type === 'stop' && msg?.data?.symbol && msg?.data?.timeframe && msg?.data?.broker && msg?.data?.strategy) {
            const key = `${msg?.data?.broker}_${msg?.data?.strategy}_${msg?.data?.symbol}_${msg?.data?.timeframe}`;
            if (liveTraders.has(key)) {
                // liveTraders.get(key)?.stop();
                liveTraders.delete(key);
            }
        }
        else if (msg.type === 'status' && process.send) {
            process.send({ type: 'status', subscriptions: Array.from(liveTraders.keys()) });
        }
    });
});

// a function to add the orderLog of each live trader to the mongodb in the binaryorders collection at regular intervals
// this function will be called at time of initialization of the job server
const startOrderLogUpdate = async () => {
    const interval = 30000; // 30 seconds
    setInterval(async () => {
        const orderLogs: any[] = [];
        for (let [key, liveTrader] of liveTraders) {
            orderLogs.push(...liveTrader.getOrderLogs());
            liveTrader.clearOrderLogs();
        }
        const binaryorders = await db.getModelInstance("binaryorders");
        // if new orderId is same as existing orderId, update the order, else create a new order
        for (let orderLog of orderLogs) {
            await binaryorders.findOneAndUpdate({orderId: orderLog.orderId}, orderLog, {upsert: true});
        }
    }, interval);
} 