// this class is used to test the derivative strategy
// it will extend the BaseStrategy class
// it will have the function to subscribe to the new candle/tick data observable of the main feed: it will call the next function of the strategy class

import { BaseStrategy } from "../strategy/base-strategy.js";
import { IBuyContractInput, INewCandleObsData, ISymbolAndTF } from "../constants/interfaces.js";
import { BaseStore } from "../store/base-store.js";
import { Stochastic, RSI, MACD, ADX } from "technicalindicators";
import { DerivBroker } from "../broker/deriv-broker.js";
import logger from "../../middlewares/logger.js";

export class ReversalMeanReversionStrategy extends BaseStrategy {
    t1FeedKey: string;     // key for the main feed
    t2FeedKey: string;    // key for the supporting feed 1
    t3FeedKey: string;    // key for the supporting feed 2
    private meta = {service: 'reversal-mean-reversion-strategy'};

    constructor(store: BaseStore, symbol: ISymbolAndTF) {
        super(store, symbol);
        this.t1FeedKey = symbol.symbol + "_" + symbol.timeframeInSeconds;
        this.t2FeedKey = symbol.supportingSymbolAndTF[0].symbol + "_" + symbol.supportingSymbolAndTF[0].timeframeInSeconds;
        this.t3FeedKey = symbol.supportingSymbolAndTF[1].symbol + "_" + symbol.supportingSymbolAndTF[1].timeframeInSeconds;
    }

    next(data: INewCandleObsData) {
        const signalSnapshot = {
            timestamp: this._feeds[this.t1FeedKey].timeSeries.getLatestBar()?.timestamp,
            t1Feed_key: this.t1FeedKey,
            t2Feed_key: this.t2FeedKey,
            t3Feed_key: this.t3FeedKey,
            t1Feed_close: this._feeds[this.t1FeedKey].timeSeries.getCloses().slice().pop(),
            t2Feed_close: this._feeds[this.t2FeedKey].timeSeries.getCloses().slice().pop(),
            t3Feed_close: this._feeds[this.t3FeedKey].timeSeries.getCloses().slice().pop(),
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

        // data for higher and main timeframes
        const higherTimeframe = this._feeds[this.t2FeedKey].timeSeries.getBars();
        const mainTimeframe = this._feeds[this.t1FeedKey].timeSeries.getBars();

        // Calculate Stochastic and RSI on higher timeframe
        const stochasticInput: any = {
            high: higherTimeframe.map(c => c.high),
            low: higherTimeframe.map(c => c.low),
            close: higherTimeframe.map(c => c.close),
            period: 14,
            signalPeriod: 3,
        };
        const stochastic = Stochastic.calculate(stochasticInput);
        const rsi = RSI.calculate({ period: 14, values: higherTimeframe.map(c => c.close) });

        let overbought = false;
        let oversold = false;

        logString = '';

        try {
            if (stochastic.length === 0 || rsi.length === 0) {
                throw new Error('Stochastic or RSI data is empty');
            }

            const latestStochastic = stochastic[stochastic.length - 1];
            const latestRsi = rsi[rsi.length - 1];

            if (!latestStochastic || !latestStochastic.k || !latestRsi) {
                throw new Error('Invalid Stochastic or RSI data');
            }

            signalSnapshot['t2Feed_stochastic'] = latestStochastic.k;
            signalSnapshot['t2Feed_rsi'] = latestRsi;

            // Detect overbought/oversold conditions
            overbought = latestStochastic.k > 80 && latestRsi > 70;
            oversold = latestStochastic.k < 20 && latestRsi < 30;

            signalSnapshot['t2Feed_overbought'] = overbought;
            signalSnapshot['t2Feed_oversold'] = oversold;
        } catch (error) {
            logger.error('Error in calculating Stochastic or RSI:', Object.assign({}, error, this.meta));
        }

        logString += `t2Feed_stochastic: ${signalSnapshot['t2Feed_stochastic']} t2Feed_rsi: ${signalSnapshot['t2Feed_rsi']} t2Feed_overbought: ${signalSnapshot['t2Feed_overbought']} t2Feed_oversold: ${signalSnapshot['t2Feed_oversold']}`;

        // Calculate MACD and ADX on main timeframe
        const macdInput: any = {
            values: mainTimeframe.map(c => c.close),
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
        };
        const macd = MACD.calculate(macdInput);
        const adx = ADX.calculate({
            high: mainTimeframe.map(c => c.high),
            low: mainTimeframe.map(c => c.low),
            close: mainTimeframe.map(c => c.close),
            period: 14,
        });

        // Confirm reversal momentum and ADX strength
        try {
            if (macd.length === 0 || adx.length === 0) {
                throw new Error('MACD or ADX data is empty');
            }
            const macdLast = macd[macd.length - 1];
            const adxLast = adx[adx.length - 1];

            if (!macdLast || !macdLast.MACD || !macdLast.signal || !adxLast) {
                throw new Error('MACD or ADX data is empty');
            }

            const macdReversal = macdLast.MACD > macdLast.signal;
            const strongTrend = adxLast.adx > 25;

            signalSnapshot['t1Feed_macd'] = macdLast.MACD;
            signalSnapshot['t1Feed_macd_signal'] = macdLast.signal;
            signalSnapshot['t1Feed_adx'] = adxLast.adx;
            signalSnapshot['t1Feed_macd_reversal'] = macdReversal;
            signalSnapshot['t1Feed_strong_trend'] = strongTrend;


            if (oversold && macdReversal && strongTrend) {
                logger.info('CALL signal detected', this.meta);
                signalSnapshot['signal'] = 'CALL';
                this.placeOrder('CALL', signalSnapshot);
            } else if (overbought && !macdReversal && strongTrend) {
                logger.info('PUT signal detected', this.meta);
                signalSnapshot['signal'] = 'PUT';
                this.placeOrder('PUT', signalSnapshot);
            }
        } catch (error) {
            logger.error('Error in confirming reversal momentum and ADX strength:', Object.assign({}, error, this.meta));
        }
        logString += ` t1Feed_macd: ${signalSnapshot['t1Feed_macd']} t1Feed_macd_signal: ${signalSnapshot['t1Feed_macd_signal']} t1Feed_adx: ${signalSnapshot['t1Feed_adx']} t1Feed_macd_reversal: ${signalSnapshot['t1Feed_macd_reversal']} t1Feed_strong_trend: ${signalSnapshot['t1Feed_strong_trend']}`;
        logString += ` signal: ${signalSnapshot['signal']}`;
        logger.info(logString, this.meta);

        this.placeOrder('CALL', signalSnapshot);
    }

    placeOrder(type: string, signalSnapshot?: any) {
        const contractInput : IBuyContractInput = {
            symbol: this._symbol.symbol,
            amount: 1,
            basis: "stake",
            contract_type: type === 'CALL' ? "CALLE" : "PUT",
            duration: 2,
            duration_unit: "m"
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