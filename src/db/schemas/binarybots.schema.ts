import { Schema, Connection, Model } from 'mongoose';
import { IBinaryBotDoc } from '../../algo_pilot/constants/interfaces.js';
import { v4 as uuidv4 } from 'uuid';

// Define the function to load the schema
function loadSchema(db: Connection): Model<any> {
    const binarybotsSchema = new Schema<IBinaryBotDoc>({
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
        botId: {
            type: String,
            required: true,
            default: uuidv4, // Assign unique ID at the time of creation,
            index: true // Indexing for faster queries on botId
        },
        botName: {
            type: String,
            required: true
        },
        additionalParams: {
            type: Object,
        },
        configurableParams: {
            type: Object,
        },
        // status: {
        //     type: String,
        //     enum: ['ACTIVE', 'INACTIVE'],
        //     required: true,
        //     default: 'INACTIVE' // Default status is INACTIVE
        // },
        runningLogs: {
            type: [
                {
                    type: {
                        type: String,
                        enum: ['START', 'STOP'],
                        required: true
                    },
                    timestamp: {
                        type: Number,
                        required: true
                    },
                    message: {
                        type: String,
                        required: true
                    },
                    data: {
                        type: Object
                    }
                }
            ],
            default: []
        }
    }, {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } // Automatically manage createdAt and updatedAt
    });

    return db.model('binarybots', binarybotsSchema, 'binarybots');
}

export default loadSchema;