// import { Timeframes_E, Symbols_E, AppEvents_E } from '../helpers/enum.js';
// import { TimeSeries } from './time-series.js';
// import { createBar } from './bar.js';
// import { eventEmitterService, EventData, EventEmitterService } from '../services/event-emmitter-service.js';
// import { Observable } from 'rxjs';

// export class DerivData {

//     symbol = Symbols_E.DEFAULT;
//     timeframe = Timeframes_E.DEFAULT;
//     historical_count = 100;
//     broker: any;
//     private _data: TimeSeries;
//     LiveBars = false;
//     emitter: EventEmitterService;

//     constructor(broker, timeframe, symbol, args = {}) {
//         this.symbol = symbol;
//         this.timeframe = timeframe;
//         this.historical_count = args['historical_count'] || 100;
//         this.LiveBars = args['LiveBars'] || false;
//         this.broker = broker;
//         this._data = new TimeSeries(this.symbol, this.timeframe);
//         this.emitter = eventEmitterService;

//         this.handleEvents();
//     }

//     handleEvents() {
//         this.emitter.on(AppEvents_E.NEW_TICK, this.handleNewTick);
//     }

//     handleNewTick(eventData: EventData) {
//         console.log('New Tick:', eventData.data);
//     }

//     startFeed() {
//         console.log('feed started');
//         this.addHistoricalCandles();
//         // for (const bar of this._data.getBars()) {
//         //     console.log(bar);
//         // }
//         // await this.getLiveFeed();
//     }

//     addHistoricalCandles() {
//         console.log('addHistoricalCandles called');
//         const klines = await this._store._broker.getHistoricalData(this.symbol, this.timeframe, this.historical_count);
//         console.log('kline length', klines.length);
//         for (const kline of klines) {
//             this._data.addBar(createBar(kline.timestamp, kline.open, kline.high, kline.low, kline.close, kline.volume), false);
//         }
//     }

//     async getLiveFeed() {
//         console.log('startLiveFeed called');
//         const obs = await this._store._broker.getLiveTicksSubscription(this.symbol);
//         obs.subscribe(x => this.handleLiveTicksSubscription(x));
//     }

//     handleLiveTicksSubscription(res) {
//         if (res && res.tick) {
//             const obj = res.tick;
//             const temp = {
//                 timestamp: obj.epoch || 0,
//                 open: obj.open || 0,
//                 high: obj.high || 0,
//                 low: obj.low || 0,
//                 close: obj.quote || 0,
//                 volume: obj.volume || 0
//             };
//             this._data.addBar(createBar(temp.timestamp, temp.open, temp.high, temp.low, temp.close, temp.volume), true);
//         }
//     }
// }

// export { DerivData };
