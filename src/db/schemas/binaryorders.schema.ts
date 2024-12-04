import { Schema, Connection, Model } from 'mongoose';
import { IBinaryOrderDoc } from '../../algo_pilot/constants/interfaces.js';

// Define the function to load the schema
function loadSchema(db: Connection): Model<any> {
    const binaryordersSchema = new Schema<IBinaryOrderDoc>({
        botId: {
            type: String,
            required: true,
            index: true // Indexing for faster queries on symbol
        },
        symbol: {
            type: String,
            required: true,
        },
        timeframe: {
            type: String,
            required: true,
        },
        strategy: {
            type: String,
            required: true,
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
