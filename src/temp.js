// Import DerivAPIBasic from the Deriv API package
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic.js';
import WebSocket from 'ws';
import DerivAPI from '@deriv/deriv-api/dist/DerivAPI.js';

// Set the app ID for API authentication. Use 1089 for testing or replace it with your app's ID.
const app_id = 1089;

// Create a WebSocket connection to the Deriv server using the app_id for authentication
const connection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

// Initialize the API using the WebSocket connection
const api = new DerivAPI({ connection });
debugger
await api.basic.ping().then((response) => {
    console.log(response);
});