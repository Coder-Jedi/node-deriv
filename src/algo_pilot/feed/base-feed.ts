// a base class for all feeds
// for a symbol and timeframe combination, a separate feed class will be created
// the feed class will take a BaseStore instance at time of creation. The BaseStore instance will have a BaseBroker instance
// the feed class will have a function startFeed() which will subscribe the candle/ticks data from the broker
// the feed class will maintain TimeSeries class which has a map of Bars. The Bar class will have the open, high, low, close, volume, time, symbol and timeframe
// the feed class will have a Subject which will emit the new candle/tick data whenever it is added in the TimeSeries. The class will have a getter for the observable of the Subject
// the strategy class will subscribe to the observable of the feed class and will get the new candle/tick data and will process it

import { Observable, Subject } from "rxjs";
import { BaseStore } from "../store/base-store.js";
import { TimeSeries } from "./time-series.js";
import { INewCandleObsData } from "../constants/interfaces.js";

export class BaseFeed {

    protected _store: BaseStore;
    protected _symbol: string;
    protected _timeframeInSeconds: number;
    _timeSeries: TimeSeries;
    protected newCandleSubject$: Subject<INewCandleObsData> = new Subject<INewCandleObsData>();

    constructor(store: BaseStore, symbol: string, timeframeInSeconds: number ) {
        this._store = store;
        this._symbol = symbol;
        this._timeframeInSeconds = timeframeInSeconds;
        this._timeSeries = new TimeSeries(this._symbol, this._timeframeInSeconds);
    }

    startFeed() {
        // throw error if not implemented
        throw new Error("startFeed method not implemented");
    }

    get timeSeries() : TimeSeries {
        return this._timeSeries;
    }
    get symbol() : string {
        return this._symbol;
    }
    get timeframeInSeconds() : number {
        return this._timeframeInSeconds;
    }

    // function to emit new candle/tick data to the observable
    get newCandleObs$(): Observable<INewCandleObsData> {
        return this.newCandleSubject$.asObservable();
    }

}