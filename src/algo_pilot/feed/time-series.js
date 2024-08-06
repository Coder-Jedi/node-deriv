
import { EventEmitter } from 'events'; // Node.js built-in EventEmitter
import { AppEvents_E } from '../helpers/enum';

class TimeSeries {
    constructor(symbol, timeframe) {
        this.symbol = symbol;
        this.timeframe = timeframe;
        this.compressedBars = [];
        this.currentBar = null;
        this.currentTimeframeStart = null;
        this.skipInitialCandles = true;
    }

    addBar(bar, isLive = false) {
        if (this.skipInitialCandles) {
            if (bar.timestamp.getTime() % (this.timeframe.value * 1000) !== 0) {
                return;
            } else {
                this.skipInitialCandles = false;
                this.currentTimeframeStart = bar.timestamp;
                this.currentBar = bar;
                this._addCompressedBar(isLive);
            }
        } else {
            if ((bar.timestamp - this.currentTimeframeStart) / 1000 >= this.timeframe.value) {
                this.currentBar = bar;
                this.currentBar.timestamp = new Date(this.currentTimeframeStart.getTime() + this.timeframe.value * 1000);
                this.currentTimeframeStart = bar.timestamp;
                this._addCompressedBar(isLive);
            } else {
                this.currentBar.open = Math.min(this.currentBar.open, bar.open);
                this.currentBar.high = Math.max(this.currentBar.high, bar.high);
                this.currentBar.low = Math.min(this.currentBar.low, bar.low);
                this.currentBar.close = bar.close;
                this.currentBar.volume += bar.volume;
            }
        }
    }

    _addCompressedBar(isLive) {
        if (this.currentBar !== null) {
            this.compressedBars.unshift(this.currentBar);
            this.emitter.emit(AppEvents_E.NEW_TICK, { symbol: this.symbol, bar: this.currentBar, isLive: isLive });
            this.eventSubject.next({ symbol: this.symbol, bar: this.currentBar, isLive: isLive });
            if (this.compressedBars.length > 200) { // maintain only the last 400 ticks to save memory
                this.compressedBars.pop();
            }
        }
    }

    getLatestBar() {
        return this.compressedBars[0] || null;
    }

    getBars(n = null) {
        return n ? this.compressedBars.slice(0, n) : this.compressedBars.slice();
    }
}

export { TimeSeries };
