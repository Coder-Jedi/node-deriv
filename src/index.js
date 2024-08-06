// const WebSocket = require('ws');
// const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');
import DerivAPI from '@deriv/deriv-api/dist/DerivAPI.js';
import { from } from 'rxjs';
import WebSocket from 'ws';

// app_id 1089 is for testing, create your own app_id and use it here.
// go to api.deriv.com to register your own app.
const connection = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
const api        = new DerivAPI({ connection });
const basic = api.basic;

let pingObs = from(basic.ping());
pingObs.subscribe({next:(res)=>{console.log(res)}})

// const ticksLatestObs = from(basic.subscribe({ticks:'R_100'}));
// let subscription = ticksLatestObs.subscribe({next: (res)=> {console.log(res)}})

const ticks_history_payload = {
    "ticks_history": "R_100",
    "adjust_start_time": 1,
    "count": 5000,
    "end": "latest",
    "start": 1,
    "style": "ticks"
  }
const ticksHistoryObs = from(basic.subscribe({...ticks_history_payload, subscribe: 1}))
ticksHistoryObs.subscribe({next: (res)=> {
    if(res?.msg_type === 'history'){
        let count = 0;
        for(let i = 0; i < res.history.prices.length; i++){
            let d = new Date(res.history.times[i]*1000);
            if(d.getSeconds()===0){
                count++;
                let str = `type: history   time: ${d}   price: ${res.history.prices[i]}`;
                console.log(str)
            }
        }
        console.log("history count: ", count);
    }
    if(res?.msg_type === 'tick'){
        let d = new Date(res.tick.epoch*1000);
        if(d.getSeconds()===0){
            let str = `type: latest    time: ${d}   price: ${res.tick.quote}`;
            console.log(str)
        }
    }
    
}})