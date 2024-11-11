
// Base strategy class
// This class will be extended by the strategy classes
// Whenever a new candle or tick is received, the next function of the strategy class will be called from the LiveTrader class
// The strategy class will have the BaseStore instance which will have the BaseBroker instance

import { INewCandleObsData, ISymbolAndTF } from "../constants/interfaces.js";
import { BaseFeed } from "../feed/base-feed.js";
import { BaseStore } from "../store/base-store.js";

// So the strategy class can make computations based on new candles/ticks and place orders using the broker
export class BaseStrategy {

    protected _store: BaseStore;
    protected _feeds: {[key: string]: BaseFeed} = {};
    protected _symbol: ISymbolAndTF;

    // get store instance at the time of strategy creation
    constructor( store: BaseStore, symbol: ISymbolAndTF ) {
        this._store = store;
        this._symbol = symbol;
    }

    // function to set the feeds for the strategy and subscribe to the main feed
    setFeeds(feeds: {[key: string]: BaseFeed}) {
        this._feeds = feeds;
        this.subscribeToMainFeed();
    }

    //function to subsribe to the new candle/tick data observable of the main feed
    subscribeToMainFeed() {
        const keyForMainFeed = this._symbol.symbol + "_" + this._symbol.timeframeInSeconds;
        this._feeds[keyForMainFeed].newCandleObs$.subscribe(data => {
            // handle the case when main feed emits new candle/tick data, but supporting feeds are yet to receive the data of the same timestamp
            // the main feed is of lower timeframe than the supporting feeds, so the main feed data can be used to add the bars in the supporting feeds if they have not received the data yet
            // if the timestamp of latest bar of the main feed is greater than the timestamp of latest bar of the supporting feed, then add the bar in the supporting feed
            // the timeseries class has a function to add the bar which will add the bar only if timestamp is multiple of timeframeInSeconds
            if(Object.keys(this._feeds).length > 1) {
                for(let key in this._feeds){
                    if(key === keyForMainFeed) continue;
                    const feed = this._feeds[key];
                    const latestBar = feed.timeSeries.getLatestBar();
                    const mainFeedLatestBar = this._feeds[keyForMainFeed].timeSeries.getLatestBar();
                    if(latestBar && mainFeedLatestBar && mainFeedLatestBar.timestamp > latestBar.timestamp){
                        feed.timeSeries.addBar(mainFeedLatestBar);
                    }
                }
            }

            // call the next function of the strategy class
            this.next(data);
        });
    }

    // function to be called when a new candle/tick data is received
    // the candle/tick data can be accessed from the feeds maintained in the strategy, so passing the data is not required
    next(data: INewCandleObsData) {
        // throw error if not implemented
        throw new Error("next method not implemented");
    }

}