import { Symbols_E } from "../helpers/enum.js";
import { DerivStore } from "../store/deriv-store.js";


export class DerivBroker {

    store : DerivStore;

    constructor(store: DerivStore) {
        this.store = store;
    }

    getLiveCandles(symbol: keyof typeof Symbols_E, history_count: number = 0) {
        const candles_history_payload = {
            "ticks_history": Symbols_E[symbol],
            "adjust_start_time": 1,
            "count": history_count,
            "end": "latest",
            "start": 1,
            "style": "candles"
        }

    }


}