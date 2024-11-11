// function createBar() to create an object representing the candle/tick data

export const createBar = (timestamp: number, open: number, high: number, low: number, close: number, volume: number) => {
    return {
        timestamp,
        open,
        high,
        low,
        close,
        volume
    };
}