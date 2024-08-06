const createBar = (timestamp, open, high, low, close, volume) => {
    const bar = {
        timestamp: new Date(timestamp * 1000), // Convert timestamp from seconds to milliseconds
        open,
        high,
        low,
        close,
        volume
    };

    bar.toString = () => {
        return `Bar(${bar.timestamp}, ${bar.open}, ${bar.high}, ${bar.low}, ${bar.close}, ${bar.volume})`;
    };

    return bar;
};

export { createBar };
