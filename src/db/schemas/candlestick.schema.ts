import { Schema, Connection, Model } from 'mongoose';

// Define the interface for the Candlestick schema
export interface ICandlestick {
    symbol: string;
    timeframe: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    timestamp: Date;
}

// Define the function to load the schema
function loadSchema(db: Connection): Model<any> {
    const candlestickSchema = new Schema<ICandlestick>({
        symbol: {
            type: String,
            required: true,
            index: true // Indexing for faster queries on symbol
        },
        timeframe: {
            type: String,
            required: true,
            index: true // Indexing for faster queries on timeframe
        },
        open: {
            type: Number,
        },
        high: {
            type: Number,
        },
        low: {
            type: Number,
        },
        close: {
            type: Number,
        },
        volume: {
            type: Number,
        },
        timestamp: {
            type: Date,
            required: true,
            index: true // Indexing for faster queries on timestamp
        },
    }, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } // Automatically manage createdAt and updatedAt
    });

    return db.model('candlesticks', candlestickSchema, 'candlesticks');
}

export default loadSchema;
