import { Schema,  Connection } from 'mongoose';

// Define the interface for the anchor schema
interface IAnchor {
    name: string;
    imageUrl: string;
    updatedBy: string;
    isDeleted?: boolean;
    type?: 'celeb' | 'expert' | 'admin';
}

// Define the function to load the schema
function loadSchema( db: Connection ): void {
    const anchorsSchema = new Schema<IAnchor>({
        name: {
            type: String,
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        updatedBy: {
            type: String,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            enum: ['celeb', 'expert', 'admin'],
            default: 'celeb',
        },
    }, {
        timestamps: true,
    });

    db.model('anchors', anchorsSchema, 'anchors');
}

export default loadSchema;
