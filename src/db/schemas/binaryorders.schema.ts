import { Schema, Connection, Model } from 'mongoose';
import { IBinaryOrderDoc } from '../../algo_pilot/constants/interfaces.js';

// Define the function to load the schema
function loadSchema(db: Connection): Model<any> {
    const binaryordersSchema = new Schema<IBinaryOrderDoc>({
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
        strategy: {
            type: String,
            required: true,
            index: true // Indexing for faster queries on strategy
        },
        broker: {
            type: String,
            required: true
        },
        orderId: {
            type: String,
            required: true
        },
        binaryOrder: {
            type: Object,
            required: true
        }
    }, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } // Automatically manage createdAt and updatedAt
    });

    return db.model('binaryorders', binaryordersSchema, 'binaryorders');
}

export default loadSchema;
