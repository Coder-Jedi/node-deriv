import * as db from '../db/index.js';
import configs from '../configs/index.js';
import DerivAPI from '@deriv/deriv-api/dist/DerivAPI.js';
import { from, Subscription } from 'rxjs';
import WebSocket from 'ws';
import { ICandlestick } from '../db/schemas/candlestick.schema.js';

interface IMessage {
    type: 'start' | 'stop' | 'status';
    symbol?: string;
    timeframe?: string;
}

// Map to track active subscriptions
const subscriptions = new Map<string, Subscription>();
let basic : any = null;

const setupProvider = () => {
    const connection = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
    const api        = new DerivAPI({ connection });
    basic = api.basic;
}

const init = async () => {
    const dbConfig = configs.get('db');
    await db.initializeSpecificModels(dbConfig, ['candlesticks']);

    setupProvider();
}

init().then(() => {
    process.on('message', async (msg: IMessage) => {
        if (msg.type === 'start' && msg.symbol && msg.timeframe) {
            const key = `${msg.symbol}_${msg.timeframe}`;
            console.log(`Starting data fetch job for ${msg.symbol}, ${msg.timeframe}`);
            startFetchingData(msg.symbol, msg.timeframe);
        }
        else if (msg.type === 'stop' && msg.symbol && msg.timeframe) {
            const key = `${msg.symbol}_${msg.timeframe}`;
            // stopFetchingData(key);
        }
        else if (msg.type === 'status' && process.send) {
            process.send({ type: 'status', subscriptions: Array.from(subscriptions.keys()) });
        }
    });
});

const startFetchingData = async (symbol: string, timeframe: string) => {
    const key = `${symbol}_${timeframe}`;
    if (subscriptions.has(key)) {
        console.log(`Already fetching for ${symbol}, ${timeframe}`);
        return subscriptions.get(key);
    }
    subscriptions.set( key, await getSubscription(symbol, timeframe));
}

const getSubscription = async (symbol: string, timeframe: string) => {
    const inst = await db.getModelInstance("candlesticks");

    const candles_history_payload = {
        "ticks_history": symbol,
        "adjust_start_time": 1,
        "count": 5000,
        "end": "latest",
        "start": 1,
        "style": "candles",
        "granularity": parseInt(timeframe)
      }
    const ticksHistoryObs = from(basic.subscribe({...candles_history_payload, subscribe: 1}))
    return ticksHistoryObs.subscribe({next: async (res:any)=> {
        if(res?.msg_type === 'candles'){
            let candles : ICandlestick[]= [];

            for(let i = 0; i < res.candles.length; i++){
                const candle = res.candles[i];
                const d = new Date(candle.epoch*1000);
                if(d.getSeconds()===0){
                    candles.push({
                        symbol: symbol,
                        timeframe: timeframe,
                        close: candle.close,
                        timestamp: d
                    })
                }
            }
            await inst.create(candles);
        }
        if(res?.msg_type === 'ohlc'){
            const tick = res.ohlc;
            const d = new Date(tick.epoch*1000);
            if(d.getSeconds()===0){
                let str = `type: latest    time: ${d}   open: ${tick.open}   high: ${tick.high}   low: ${tick.low}   close: ${tick.close}`;
                console.log(str)
                const candle : ICandlestick = {
                    symbol: symbol,
                    timeframe: timeframe,
                    close: tick.close,
                    timestamp: d
                };
                await inst.create(candle);
            }
        }
        
    }})
}

const stopFetchingData = async (symbol: string, timeframe: string) => {}