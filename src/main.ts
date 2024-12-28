import { ILiveTraderInput } from "./algo_pilot/constants/interfaces.js";
import { LiveTrader } from "./algo_pilot/genesis/live-trader.js";

import { ChildProcess, fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { DerivStore } from "./algo_pilot/store/deriv-store.js";
import { OrderLog } from "./algo_pilot/helpers/order-log.js";
import fs from 'fs';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const  jobServers = new Map<string, ChildProcess>();


const startDataJobServer = (liveTraderInput: ILiveTraderInput) => {
    // Path to the child process script
    const workerPath = path.join(__dirname, './utils/job-servers/binary-trader-server.js');

    // Fork a new child process
    const jobServer = fork(workerPath);

    const key = `${liveTraderInput.botId}`;

    // Forward child process stdout and stderr to parent process
    jobServer.stdout?.on('data', (data) => {
        console.log(`Child stdout: ${data}`);
    });
    jobServer.stderr?.on('data', (data) => {
        console.error(`Child stderr: ${data}`);
    });

    // Listen to messages from the child process
    jobServer.on('message', (msg) => {
        console.log(`Message from JobServer:`, msg);
    });

    // Handle child process exit
    jobServer.on('exit', (code, signal) => {
        console.log(`JobServer exited with code ${code}, signal ${signal}`);
        // console log the keys of the jobServers map
        console.log(jobServers.keys());
        if(jobServers.has(key)) {
            jobServers.delete(key);
        }
    });

    jobServers.set(key, jobServer);
}

// const startLiveTrader = (liveTraderInput: ILiveTraderInput) => {
//     startDataJobServer(liveTraderInput);

//     const key = `${liveTraderInput.botId}`;
//     const jserver = jobServers.get(key);
//     console.log(jserver);
//     jobServers.get(key)?.send({ type: 'start', data: liveTraderInput });
    
// }



const liveTraderOptions : ILiveTraderInput = {
    botId: "test_bot",
    broker: "deriv",
    strategy: "reversal_mean_reversion",
    symbol: "R_10",
    timeframe: "M1",
    params: {
        appId: 51523,
       authToken: "8tb79coZRZZEbmi"
    }
};


const liveTrader = new LiveTrader(liveTraderOptions);

// run the liveTrader.start() async function using await in a process
// async function startLiveTrader(){
//     try{
//         const orderLog = new OrderLog(liveTraderOptions);
//         const store = new DerivStore(orderLog, liveTraderOptions.params);
//         await store.connect();

//         const payload = {
//             "statement": 1,
//             "description": 1,
//             "limit": 999,
//         }
//         // debugger
//         store.basicApi.send(payload).then((res:any) => {
//             console.log(res);
//             // write the res to a file: temp/deriv-statement.json
//             fs.writeFileSync('temp/deriv-statement.json', JSON.stringify(res));
//         })
//         .catch((err:any) => {
//             console.log(err);
//         });
//     }
//     catch(err){
//         console.error(err);
//     }

//     // await liveTrader.start();
// }

// startLiveTrader();

function startLiveTraderDirect(liveTraderOptions){
    const liveTrader = new LiveTrader(liveTraderOptions);
    liveTrader.start();
}

startLiveTraderDirect(liveTraderOptions);
