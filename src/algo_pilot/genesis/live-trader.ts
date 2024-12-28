// this class is the main class that will be used to create a live trading bot
// it will take in the following parameters
// 1. broker: the broker to use, 2. strategy: the strategy to use, 3. symbol: the symbol to trade, 4. timeframe: the timeframe to trade on
// it will check if the mandatory fields are provided and throw an error if not
// it will also check if the broker, strategy, symbol and timeframe are valid

import { DerivStore } from "../store/deriv-store.js";
import { BaseStrategy } from "../strategy/base-strategy.js";
import { BaseStore } from "../store/base-store.js";
import { BaseFeed } from "../feed/base-feed.js";
import { ILiveTraderInput, ISymbolAndTF } from "../constants/interfaces.js";
import { TestDerivStrategy } from "../strategy/test-deriv-strategy.js";
import { DerivFeed } from "../feed/deriv-feed.js";
import { OrderLog } from "../helpers/order-log.js";
import { VALID_OPTIONS } from "../constants/constants.js";

//define valid options: it will have valid stores, strategies and symbols, timeframes
// it will also have classes associated with the stores and strategies
// the values are nested. i.e. the store has associated strategies and the strategy has associated symbols/timeframe pairs ex of pair: {symbol: "EURUSD", timeframe: "M1", timeframeInSeconds: 60, supportingSymbolAndTF: [{symbol: "EURUSD", timeframe: "M5", timeframeInSeconds: 300}]} 
// supportingSymbolAndTF is an array of symbols and timeframes that are also required for the strategy to work. So the strategy will be provided with the data of these symbols and timeframes as well
const validOptions: any = VALID_OPTIONS;


export class LiveTrader {

    private liveTraderOptions: ILiveTraderInput;
    private store: BaseStore;
    private strategy: BaseStrategy;
    private symbol: ISymbolAndTF;

    private orderLog : OrderLog;

    // an object to store the feeds for the symbols and timeframes that are required by the strategy to work
    // the key will be the symbol and timeframe combined for example for symbol EURUSD and timeframe M1, the key will be EURUSD_60, i.e. the symbol and timeframe in seconds combined with _ in between
    private feeds: {[key: string]: BaseFeed} = {};

    constructor(liveTraderOptions: ILiveTraderInput) {
        this.checkMandatoryFields(liveTraderOptions);
        this.checkValidOptions(liveTraderOptions);
        this.liveTraderOptions = liveTraderOptions;
        this.orderLog = new OrderLog(liveTraderOptions);
    }

    //function to check if the mandatory fields are provided
    checkMandatoryFields(liveTraderOptions: ILiveTraderInput) {
        const fields = [
            {id: "broker", title: "Broker"}, 
            {id: "strategy", title: "Strategy"}, 
            {id: "symbol", title: "Symbol"}, 
            {id: "timeframe", title: "Timeframe"}
        ];
        fields.forEach(field => {
            if(!liveTraderOptions[field.id]) {
                throw new Error(`${field.title} is required`);
            }
        });
    }

    //function to check if the options are valid
    checkValidOptions(liveTraderOptions: ILiveTraderInput) {
        if(!validOptions.stores[liveTraderOptions.broker]) {
            throw new Error(`Broker ${liveTraderOptions.broker} is not valid`);
        }
        if(!validOptions.stores[liveTraderOptions.broker].strategies[liveTraderOptions.strategy]) {
            throw new Error(`Strategy ${liveTraderOptions.strategy} is not valid`);
        }
        if(!validOptions.stores[liveTraderOptions.broker].strategies[liveTraderOptions.strategy].symbols.find(symbol => symbol.symbol === liveTraderOptions.symbol && symbol.timeframe === liveTraderOptions.timeframe)) {
            throw new Error(`Symbol ${liveTraderOptions.symbol} with timeframe ${liveTraderOptions.timeframe} is not valid`);
        }
    }

    //function to initialize the store, stategy, feed and start live trading for given symbol and timeframe
    async start() {
        const storeName = this.liveTraderOptions.broker;
        const strategyName = this.liveTraderOptions.strategy;
        
        this.store = new validOptions.stores[this.liveTraderOptions.broker].class(this.orderLog,this.liveTraderOptions.params);
        await this.store.connect();

        //initialize the feeds
        this.symbol = validOptions.stores[storeName].strategies[strategyName].symbols.find(symbol => symbol.symbol === this.liveTraderOptions.symbol && symbol.timeframe === this.liveTraderOptions.timeframe);
            //main feed
        const keyForMainFeed = `${this.symbol.symbol}_${this.symbol.timeframeInSeconds}`;
        this.feeds[keyForMainFeed] = new validOptions.stores[storeName].strategies[strategyName].feedClass(this.store, this.symbol.symbol, this.symbol.timeframeInSeconds);
            //supporting feeds
        this.symbol.supportingSymbolAndTF.forEach(symbolAndTF => {
            this.feeds[`${symbolAndTF.symbol}_${symbolAndTF.timeframeInSeconds}`] = new validOptions.stores[storeName].strategies[strategyName].feedClass(this.store, symbolAndTF.symbol, symbolAndTF.timeframeInSeconds);
        });

        // initialize the strategy with the feeds
        this.strategy = new validOptions.stores[storeName].strategies[strategyName].class(this.store, this.symbol);
        this.strategy.setFeeds(this.feeds);

        // start all the feeds in the feeds object
        // the feeds will start subscribing to the broker and will emit the new candle/tick. The strategy will subscribe to the new candle/tick observable of the feed
        // subscribe to the main feed at last so that the higher timeframes are available when the main feed is subscribed, subscribe to other feeds first
        for(let key in this.feeds){
            if(key !== keyForMainFeed) {
                this.feeds[key].startFeed();
            }
        }
        this.feeds[keyForMainFeed].startFeed();

        

    }

    getOrderLogs(){
        return this.orderLog.getOrders();
    }
    clearOrderLogs(){
        this.orderLog.clearOrders();
    }

    // function to console the order logs every 30 seconds
    printOrderLogs() {
        setInterval(() => {
            console.log("orders:",this.orderLog.getOrders());
        }, 30000);
    }

}