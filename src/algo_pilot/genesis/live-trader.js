import { DerivStore } from './store/DerivStore.js';
import { DerivBroker } from './broker/DerivBroker.js';
import { DerivData } from './feed/DerivData.js';
import { BaseStrategy } from './strategies/BaseStrategy.js';

class LiveTrader {
    constructor(store) {
        this.store = store;
        this.feeds = [];
        this.strategy = null;
        this.broker = null;
    }

    setBroker(broker) {
        this.broker = broker;
    }

    getBroker() {
        return this.broker;
    }

    addData(feed) {
        if (!this.feeds.includes(feed)) {
            this.feeds.push(feed);
        }
    }

    addStrategy(strategy) {
        this.strategy = strategy;
    }

    async runLiveTrading() {
        if (this.broker === null) {
            console.log("ERROR: No Broker Added");
            return;
        }
        if (this.strategy === null) {
            console.log("ERROR: No Strategy Added");
            return;
        }
        if (this.feeds.length === 0) {
            console.log("ERROR: No Feed Added");
            return;
        }

        // Add feeds to the strategy
        for (const feed of this.feeds) {
            this.strategy.addDatas(feed.data);
        }

        for (const feed of this.feeds) {
            await feed.startFeed();
        }
    }
}

export { LiveTrader };
