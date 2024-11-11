// class to represent the time series data of candle/ticks bar object : the interface for Bar is available in the constants/interfaces.ts file
// the TimeSeries class has a compressedBars Map which will have the compressed bars for the given timeframe. timeframe is in seconds
// Compressed Bars imply that the data is compressed to a provided timeframe if the data is of a lower timeframe
// class has a getLatestBar() function which will return the latest bar in the compressedBars Map
// class has a getBars(n) function which will return the last n bars from the compressedBars Map
// class has a addBar(bar) function which will add a bar to the compressedBars Map
// class has a isUpdateLatestCandle boolean - if true: the latest bar will be updated with the new bar data(except timestamp) if the timestamp of the new bar is greater than the timestamp of the latest bar and less than the timestamp of the latest bar + timeframe
// if false: the new bar will be added but the latest value if available will not be updated for that bar
// bar.timestamp is in epoch format which is in milliseconds

import { Bar } from '../constants/interfaces.js';

export class TimeSeries {
    private _symbol: string;
    private _timeframeInSeconds: number;
    private _compressedBars: Map<number, Bar>;
    private _isUpdateLatestCandle: boolean;
    private _firstBarTimestamp: number = 0;

    constructor(symbol: string, timeframe: number, isUpdateLatestCandle: boolean = false) {
        this._symbol = symbol;
        this._timeframeInSeconds = timeframe;
        this._compressedBars = new Map<number, Bar>();
        this._isUpdateLatestCandle = isUpdateLatestCandle;
    }

    getLatestBar(): Bar | null {
        if (this._compressedBars.size > 0) {
            const latestTimestamp = Math.max(...this._compressedBars.keys());
            return this._compressedBars.get(latestTimestamp) || null;
        }
        return null;
    }

    getBars(n?: number): Bar[] {
        // latest bar at the end : since the technical indicators require the ascending order of bars
        const sortedTimestamps = Array.from(this._compressedBars.keys()).sort((a, b) => a - b);
        if (n) {
            return sortedTimestamps.slice(0, n).map(timestamp => this._compressedBars.get(timestamp)!);
        }
        return sortedTimestamps.map(timestamp => this._compressedBars.get(timestamp)!);
    }

    getCloses(n?: number): number[] {
        return this.getBars(n).map(bar => bar.close);
    }

    addBar(bar: Bar) {
        const timestamp = bar.timestamp;
        if (this._isUpdateLatestCandle) {
            const latestBar = this.getLatestBar();
            if (latestBar && timestamp > latestBar.timestamp && timestamp < latestBar.timestamp + this._timeframeInSeconds * 1000) {
                latestBar.close = bar.close;
                latestBar.high = latestBar.high && bar.high ? Math.max(latestBar.high, bar.high) : bar.high;
                latestBar.low = latestBar.low && bar.low ? Math.min(latestBar.low, bar.low) : bar.low;
                latestBar.volume = latestBar.volume && bar.volume ? latestBar.volume + bar.volume : bar.volume;
                return;
            }
        }
        // if no bar is present, then add the new bar
        if (this._compressedBars.size === 0) {
            this._compressedBars.set(timestamp, bar);
            this._firstBarTimestamp = timestamp;
            return;
        }

        // if previously bar is present at the same timestamp as the new bar, then update the previous bar with the new bar data
        if(this._compressedBars.has(timestamp)){
            this._compressedBars.set(timestamp, bar);
            return;
        }

        // default case: add the new bar
        // if atleast one bar is present, then add the new bar only if the difference between the timestamp of the first bar and the timestamp of the new bar is the multiple of timeframeInSeconds
        // check for multiple of timeframeInSeconds
        if ((timestamp - this._firstBarTimestamp) % (this._timeframeInSeconds * 1000) === 0) {
            this._compressedBars.set(timestamp, bar);
        }

    }

    getBarsCount(): number {
        return this._compressedBars.size;
    }

    getSymbol(): string {
        return this._symbol;
    }

    getTimeframeInSeconds(): number {
        return this._timeframeInSeconds;
    }

    // function to fill missing bars in the time series data
    fillMissingData() {
        const sortedTimestamps = Array.from(this._compressedBars.keys()).sort((a, b) => a - b);
        const firstTimestamp = sortedTimestamps[0];
        const lastTimestamp = sortedTimestamps[sortedTimestamps.length - 1];
        const missingBars : Bar[] = [];
        for (let i = firstTimestamp; i < lastTimestamp; i += this._timeframeInSeconds * 1000) {
            if (!this._compressedBars.has(i)) {
                const bar = this._compressedBars.get(i - this._timeframeInSeconds * 1000);
                if (bar) {
                    missingBars.push({
                        timestamp: i,
                        open: bar.close,
                        high: bar.close,
                        low: bar.close,
                        close: bar.close,
                        volume: 0
                    });
                }
            }
        }
        for (const bar of missingBars) {
            this.addBar(bar);
        }
    }
}