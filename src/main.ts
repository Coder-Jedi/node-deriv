import { ILiveTraderInput } from "./algo_pilot/constants/interfaces.js";
import { LiveTrader } from "./algo_pilot/genesis/live-trader.js";

import { ChildProcess, fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';


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
    strategy: "test_deriv",
    symbol: "R_10",
    timeframe: "M1",
    params: {
        appId: 51523,
       authToken: "8tb79coZRZZEbmi"
    }
};


const liveTrader = new LiveTrader(liveTraderOptions);

// run the liveTrader.start() async function using await in a process
async function startLiveTrader(){

    await liveTrader.start();
}

startLiveTrader();
