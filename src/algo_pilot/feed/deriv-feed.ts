// deriv feed class that extends the base feed class
// it will implement the feed class methods to get the data from the deriv broker

import { DerivBroker } from "../broker/deriv-broker.js";
import { Bar } from "../constants/interfaces.js";
import { BaseFeed } from "./base-feed.js";

export class DerivFeed extends BaseFeed {

    startFeed() {
        const broker = this._store.broker as DerivBroker;
        broker.getLiveCandles(this._symbol, this._timeframeInSeconds, 500).subscribe(data => {
            if(!data.data.length) return;

            for(let i = 0; i < data.data.length; i++){
                const bar = data.data[i] as Bar;
                this._timeSeries.addBar(bar);
            }
            this.newCandleSubject$.next(data);
        });
    }

}