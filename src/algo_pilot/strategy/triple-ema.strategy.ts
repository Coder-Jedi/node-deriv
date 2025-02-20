// this class is used to test the derivative strategy
// it will extend the BaseStrategy class
// it will have the function to subscribe to the new candle/tick data observable of the main feed: it will call the next function of the strategy class

import { BaseStrategy } from "../strategy/base-strategy.js";
import { IBuyContractInput, INewCandleObsData, ISymbolAndTF } from "../constants/interfaces.js";
import { BaseStore } from "../store/base-store.js";
import { EMA } from "technicalindicators";
import { DerivBroker } from "../broker/deriv-broker.js";
import logger from "../../middlewares/logger.js";

export class TripleEmaStrategy extends BaseStrategy {
    t1FeedKey: string;     // key for the main feed
    t2FeedKey: string;    // key for the supporting feed 1
    configurableParams: any;
    private meta = {service: 'triple-ema-strategy'};

    constructor(store: BaseStore, symbol: ISymbolAndTF, configurableParams?: any) {
        super(store, symbol, configurableParams);
        this.t1FeedKey = symbol.symbol + "_" + symbol.timeframe;
        this.t2FeedKey = symbol.supportingSymbolAndTF[0].symbol + "_" + symbol.supportingSymbolAndTF[0].timeframe;
    }

    next(data: INewCandleObsData) {
        const signalSnapshot: any = {
            timestamp: this._feeds[this.t1FeedKey].timeSeries.getLatestBar()?.timestamp,
            t1Feed_key: this.t1FeedKey,
            t2Feed_key: this.t2FeedKey,
            t1Feed_close: this._feeds[this.t1FeedKey].timeSeries.getCloses().slice().pop(),
            t2Feed_close: this._feeds[this.t2FeedKey].timeSeries.getCloses().slice().pop(),
        };
        console.log("next function called");
        // console the latest candle data of all the feeds with timestamp, and texts for other datas
        let logString = '';
        for (let key in this._feeds) {
            const feed = this._feeds[key];
            const latestBar = feed.timeSeries.getLatestBar();
            logString += `symbol: ${feed.symbol} timeframeInSeconds: ${feed.timeframeInSeconds} count: ${feed.timeSeries.getBarsCount()} latestBar: ${new Date(latestBar?.timestamp || "").toString()} open: ${latestBar?.open} close: ${latestBar?.close} low: ${latestBar?.low} high: ${latestBar?.high} `;
        }
        logger.info(logString, this.meta);

        logString = '';

        // data for higher and main timeframes
        const higherTimeframe = this._feeds[this.t2FeedKey].timeSeries.getBars();
        const mainTimeframe = this._feeds[this.t1FeedKey].timeSeries.getBars();

        // get the ema1, ema2 and ema3 values for the main timeframe
        const ema1Period = this.configurableParams?.ema1 || 5;
        const ema2Period = this.configurableParams?.ema2 || 13;
        const ema3Period = this.configurableParams?.ema3 || 21;

        signalSnapshot.ema1Period = ema1Period;
        signalSnapshot.ema2Period = ema2Period;
        signalSnapshot.ema3Period = ema3Period;

        // calculate the ema values for the main timeframe
        const ema1 = EMA.calculate({period: ema1Period, values: mainTimeframe.map(bar => bar.close)});
        const ema2 = EMA.calculate({period: ema2Period, values: mainTimeframe.map(bar => bar.close)});
        const ema3 = EMA.calculate({period: ema3Period, values: mainTimeframe.map(bar => bar.close)});

        // calculate signal for the main timeframe
        // buy signal: ema1 > ema2 > ema3 and close > ema1
        // sell signal: ema1 < ema2 < ema3 and close < ema1
        // try, catch block to handle any error
        try {
            const ema1Latest = ema1.slice().pop();
            const ema2Latest = ema2.slice().pop();
            const ema3Latest = ema3.slice().pop();
            const closeLatest = mainTimeframe?.slice()?.pop()?.close;

            signalSnapshot.ema1Latest = ema1Latest;
            signalSnapshot.ema2Latest = ema2Latest;
            signalSnapshot.ema3Latest = ema3Latest;
            signalSnapshot.closeLatest = closeLatest;

            if(ema1Latest && ema2Latest && ema3Latest && closeLatest) {
                if(ema1Latest > ema2Latest && ema2Latest > ema3Latest && closeLatest > ema1Latest) {
                    signalSnapshot.signal = 'BUY';
                    this.placeOrder('CALL', signalSnapshot);

                    logString = `buy signal: ema1 > ema2 > ema3 and close > ema1`;
                    logString += ` ema1: ${ema1Latest} ema2: ${ema2Latest} ema3: ${ema3Latest} close: ${closeLatest}`;
                    logger.info(logString, this.meta);

                } else if(ema1Latest < ema2Latest && ema2Latest < ema3Latest && closeLatest < ema1Latest) {
                    signalSnapshot.signal = 'SELL';
                    this.placeOrder('PUT', signalSnapshot);

                    logString = `sell signal: ema1 < ema2 < ema3 and close < ema1`;
                    logString += ` ema1: ${ema1Latest} ema2: ${ema2Latest} ema3: ${ema3Latest} close: ${closeLatest}`;
                    logger.info(logString, this.meta);
                    
                }
            }

        } catch (error) {
            logger.error("error in next function: ", Object.assign({}, error, this.meta));
        }

    }

    placeOrder(type: string, signalSnapshot?: any) {
        const contractInput : IBuyContractInput = {
            symbol: this._symbol.symbol,
            amount: 1,
            basis: "stake",
            contract_type: type === 'CALL' ? "CALLE" : "PUT",
            duration: this.configurableParams?.duration || 120,
            duration_unit: "s"
        };
        let logCount = 0;
        (this._store.broker as DerivBroker).buyContract(contractInput, signalSnapshot|| {}).subscribe({ next: (data) => {
                logCount++;
                if(logCount > 1) {
                    return;
                }
                logger.info("buy response: ", Object.assign({}, data, this.meta));
            },
            error: (err) => {
                logger.error("error: ", Object.assign({}, err, this.meta));
            }
        });
    }
}