// this class is used to test the derivative strategy
// it will extend the BaseStrategy class
// it will have the function to subscribe to the new candle/tick data observable of the main feed: it will call the next function of the strategy class

import { BaseStrategy } from "../strategy/base-strategy.js";
import { IBuyContractInput, INewCandleObsData, ISymbolAndTF } from "../constants/interfaces.js";
import { BaseStore } from "../store/base-store.js";
import { EMA, RSI } from "technicalindicators";
import { DerivBroker } from "../broker/deriv-broker.js";


export class TestDerivStrategy extends BaseStrategy {
    t1FeedKey: string;     // key for the main feed
    t2FeedKey: string;    // key for the supporting feed 1
    t3FeedKey: string;    // key for the supporting feed 2

    emas_t1Feed : {[key: number]: {period: number, value: number[], snapshotKey: string}} = 
    {
        1: {period: 5, value: [], snapshotKey: "ema_1_t1Feed_5"},
        2: {period: 13, value: [], snapshotKey: "ema_2_t1Feed_13"},
        3: {period: 21, value: [], snapshotKey: "ema_3_t1Feed_21"},
    };
    rsi_t1Feed : {[key: number]: {period: number, value: number[], snapshotKey: string}} = {
        1: {period: 14, value: [], snapshotKey: "rsi_1_t1Feed_14"},
    };

    constructor( store: BaseStore, symbol: ISymbolAndTF ) {
        super(store, symbol);
        this.t1FeedKey = symbol.symbol + "_" + symbol.timeframeInSeconds;
        this.t2FeedKey = symbol.supportingSymbolAndTF[0].symbol + "_" + symbol.supportingSymbolAndTF[0].timeframeInSeconds;
        this.t3FeedKey = symbol.supportingSymbolAndTF[1].symbol + "_" + symbol.supportingSymbolAndTF[1].timeframeInSeconds;
    }

    next(data: INewCandleObsData) {
        console.log("next function called");
        // console the latest candle data of all the feeds with timestamp, and texts for other datas
        for(let key in this._feeds){
            const feed = this._feeds[key];
            const latestBar = feed.timeSeries.getLatestBar();
            console.log("symbol: ", feed.symbol, " timeframeInSeconds: ", feed.timeframeInSeconds, "count: ", feed.timeSeries.getBarsCount(), " latestBar: ", new Date(latestBar?.timestamp || "").toString(), " open: ", " close: ", latestBar?.close);
        }

        // calculate
        const closes_t1Feed = this._feeds[this.t1FeedKey].timeSeries.getCloses().slice();
        let snapshot = {};
        // timestamp of the latest candle of the main feed
        snapshot["timestamp"] = this._feeds[this.t1FeedKey].timeSeries.getLatestBar()?.timestamp;
        snapshot["t1Feed_key"] = this.t1FeedKey;
        snapshot["t2Feed_key"] = this.t2FeedKey;
        snapshot["t3Feed_key"] = this.t3FeedKey;
        snapshot["t1Feed_close"] = closes_t1Feed[closes_t1Feed.length - 1];
        
        // emas
        this.emas_t1Feed[1].value = EMA.calculate({period: this.emas_t1Feed[1].period, values: closes_t1Feed});
        snapshot[this.emas_t1Feed[1].snapshotKey] = this.emas_t1Feed[1].value[this.emas_t1Feed[1].value.length - 1];

        this.emas_t1Feed[2].value = EMA.calculate({period: this.emas_t1Feed[2].period, values: closes_t1Feed});
        snapshot[this.emas_t1Feed[2].snapshotKey] = this.emas_t1Feed[2].value[this.emas_t1Feed[2].value.length - 1];

        this.emas_t1Feed[3].value = EMA.calculate({period: this.emas_t1Feed[3].period, values: closes_t1Feed});
        snapshot[this.emas_t1Feed[3].snapshotKey] = this.emas_t1Feed[3].value[this.emas_t1Feed[3].value.length - 1];

        // rsi
        this.rsi_t1Feed[1].value = RSI.calculate({period: this.rsi_t1Feed[1].period, values: closes_t1Feed});
        snapshot[this.rsi_t1Feed[1].snapshotKey] = this.rsi_t1Feed[1].value[this.rsi_t1Feed[1].value.length - 1];

        // let signal = "";
        // // check if ema1 and ema2 > ema3 and rsi < 30
        // if(this.emas_t1Feed[1].value.length > 0 && this.emas_t1Feed[2].value.length > 0 && this.emas_t1Feed[3].value.length > 0 && this.rsi_t1Feed[1].value.length > 0){
        //     if(this.emas_t1Feed[1].value[this.emas_t1Feed[1].value.length - 1] > this.emas_t1Feed[2].value[this.emas_t1Feed[2].value.length - 1] && this.emas_t1Feed[2].value[this.emas_t1Feed[2].value.length - 1] > this.emas_t1Feed[3].value[this.emas_t1Feed[3].value.length - 1] && this.rsi_t1Feed[1].value[this.rsi_t1Feed[1].value.length - 1] < 30){
        //         signal = "BUY";
        //     }
        //     else if(this.emas_t1Feed[1].value[this.emas_t1Feed[1].value.length - 1] < this.emas_t1Feed[2].value[this.emas_t1Feed[2].value.length - 1] && this.emas_t1Feed[2].value[this.emas_t1Feed[2].value.length - 1] < this.emas_t1Feed[3].value[this.emas_t1Feed[3].value.length - 1] && this.rsi_t1Feed[1].value[this.rsi_t1Feed[1].value.length - 1] > 70){
        //         signal = "SELL";
        //     }
        // }

        // if(signal){
        //     console.log("signal: ", signal);
        // }

        if(data.data.length === 1 || true){
            const contractInput : IBuyContractInput = {
                symbol: this._symbol.symbol,
                amount: 1,
                basis: "stake",
                contract_type: "CALLE",
                duration: 2,
                duration_unit: "m"
            };
            (this._store.broker as DerivBroker).buyContract(contractInput, snapshot).subscribe({next: (data) => {
                // console.log("buy response: ", data);
            },
            error: (err) => {
                console.log("error: ", err);
            }
        });
        }

    }

}