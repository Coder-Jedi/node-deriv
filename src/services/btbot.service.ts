import { ChildProcess, fork } from 'child_process';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConfigurationJson } from '../utils/helpers/btbot-configuration.js';
import { checkBotConfig, VALID_OPTIONS } from '../algo_pilot/constants/constants.js';
import * as db from '../db/index.js';
import { ILiveTraderInput, IRunningLog } from '../algo_pilot/constants/interfaces.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const jobServers = new Map<string, ChildProcess>();

let orderUpdateJobServer : ChildProcess | null = null;

export const handleGetBotConfiguration = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const configuration = createConfigurationJson(VALID_OPTIONS);
            res.status(200).json({ configuration: configuration, success: true });
            return resolve();
        } catch (error) {
            res.status(500).json({ message: 'Configuration not found', error: error });
            return reject(error);
        }
    });
}

// function to add a new document to binarybots collection in mongodb. It will first check if the necessary fields are provided
export const handleCreateBot = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const bot = req.body;
            if (bot.broker && bot.strategy && bot.symbol && bot.timeframe && bot.botName) {
                // validate the bot configuration parameters and return the error message if the parameters are invalid
                const validateBotConfig = checkBotConfig(bot);
                if (validateBotConfig) {
                    res.status(400).json({ message: validateBotConfig, success: false });
                    return resolve();
                }

                const binarybots = db.getModelInstance("binarybots");
                const response = await binarybots.create(bot);

                // return the newly created bot document
                res.status(201).json({ data: response, success: true });
                return resolve();
            } else {
                res.status(400).json({ message: 'Bot not created, missing parameters', success: false });
                return resolve();
            }
        } catch (error) {
            // send error response
            res.status(500).json({ message: 'Bot not created', error: error, success: false });
            return reject(error);
        }
    });
}

// function to get all the documents from binarybots collection in mongodb
// It will fetch all the documents and check if the botId is present in the running jobs. If it is present, then the status of the bot will be ACTIVE
export const handleGetBotList = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const runningJobs = Array.from(jobServers.keys());
            const binarybots = db.getModelInstance("binarybots");
            const data: any[] = await binarybots.find({});

            const plainData = data.map(bot => {
                const plainBot = bot.toObject();
                if (runningJobs.includes(bot.botId)) {
                    plainBot.status = 'ACTIVE';
                } else {
                    plainBot.status = 'INACTIVE';
                }
                return plainBot;
            });

            res.status(200).json({ data: plainData, success: true });
            return resolve();
        } catch (error) {
            res.status(500).json({ message: 'Bot list not found', error: error, success: false });
            return reject(error);
        }
    });
}

// function to start the livetrader for a bot by starting a new child process for the botId provided
// if the bot is found in the binarybots collection, then it will also update the runningLogs array with the start message
export const handleStartBot = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (req.body.botId) {
                const botId = req.body.botId;
                const binarybots = db.getModelInstance("binarybots");
                const bot = await binarybots.findOne({ botId: botId });

                if (bot) {
                    // push the new runningLog entry to document and update it in db
                    const data = Object.assign({actionType: "manual"} ,req?.body?.data);
                    const runningLogEntry: IRunningLog = {
                        type: 'START',
                        timestamp: Date.now(),
                        message: req?.body?.message || "Live trader startup initiated",
                        data: data
                    };
                    (bot as any)?.runningLogs?.push(runningLogEntry);
                    await bot.save();

                    const liveTraderInput: ILiveTraderInput = createLiveTraderInputObject(bot);
                    startLiveTrader(liveTraderInput);
                    res.status(201).json({ message: 'Live trader startup initiated. This does not mean the Live trader started successfully. Check the status of the bot to know if it is running', success: true });
                    return resolve();
                } else {
                    res.status(400).json({ message: 'Bot not found', success: false });
                    return resolve();
                }
            } else {
                res.status(400).json({ message: 'BotId not provided', success: false });
                return resolve();
            }
        } catch (error) {
            res.status(500).json({ message: 'Live trader startup failed', error: error });
            return reject(error);
        }
    });
}

// function to stop the livetrader for a bot by sending a message to the child process to stop the bot
export const handleStopBot = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (req.body.botId) {
                const botId = req.body.botId;
                const key = `${botId}`;
                if (jobServers.has(key)) {
                    jobServers.get(key)?.send({ type: 'stop' });
                    res.status(200).json({ message: 'Live trader stopped', success: true });
                } else {
                    res.status(400).json({ message: 'Bot not found in running bots.', success: false });
                }

                // add the STOP entry in runningLogs for bot in db as well
                // here stopping the server first is given more priority
                const binarybots = db.getModelInstance("binarybots");
                const bot = await binarybots.findOne({ botId: botId });
                if (bot) {
                    // push the new runningLog entry to document and update it in db
                    const data = Object.assign({actionType: "manual"} ,req?.body?.data);
                    const runningLogEntry: IRunningLog = {
                        type: 'STOP',
                        timestamp: Date.now(),
                        message: req?.body?.message || 'Live trader stopped',
                        data: data
                    };
                    (bot as any)?.runningLogs?.push(runningLogEntry);
                    await bot.save();
                }
                return resolve();
            } else {
                res.status(400).json({ message: 'BotId not provided', success: false });
                return resolve();
            }
        } catch (error) {
            res.status(500).json({ message: 'Live trader stop failed', error: error });
            return reject(error);
        }
    });
}

// function to get the list of currently running jobs. The bots present in jobservers map are the currently running jobs
// fetch the list of bots from the binarybots collection and filter the bots that are currently running
export const handleGetRunningJobs = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const runningJobs = Array.from(jobServers.keys());
            const binarybots = db.getModelInstance("binarybots");
            const bots: any[] = await binarybots.find({});
            const runningBots: any[] = [];

            for (let bot of bots) {
                const plainBot = bot.toObject();
                if (runningJobs.includes(bot.botId)) {
                    plainBot.status = 'ACTIVE';
                    runningBots.push(plainBot);
                }
            }

            res.status(200).json({ data: runningBots, success: true });
            return resolve();
        } catch (error) {
            res.status(500).json({ message: 'Running jobs not found', error: error, success: false });
            return reject(error);
        }
    });
}

// function to return the bot details for a botId
// it will handle if the botId is not passed in the request
// fetch the bot details from the binarybots collection, also fetch the orders placed by the bot from the binaryorders collection
// it will also check if the botId is present in the running jobs. If it is present, then the status of the bot will be ACTIVE
export const handleGetBotDetails = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (req.query.botId) {
                const botId = req.query.botId as string;

                const binarybots = db.getModelInstance("binarybots");
                const bot: any = await binarybots.findOne({ botId: botId });

                const binaryorders = db.getModelInstance("binaryorders");
                const orders = await binaryorders.find({ botId: botId });

                if (bot) {
                    const plainBot = bot.toObject();
                    const runningJobs = Array.from(jobServers.keys());
                    if (runningJobs.includes(botId)) {
                        plainBot.status = 'ACTIVE';
                    } else {
                        plainBot.status = 'INACTIVE';
                    }

                    res.status(200).json({ data: { bot: plainBot, orders: orders }, success: true });
                    return resolve();
                } else {
                    res.status(400).json({ message: 'Bot not found', success: false });
                    return resolve();
                }
            } else {
                res.status(400).json({ message: 'BotId not provided', success: false });
                return resolve();
            }
        } catch (error) {
            res.status(500).json({ message: 'Bot details not found', error: error, success: false });
            return reject(error);
        }
    });
}

// function to get the list of orders
// if the botId is passed in the query, then it will return the orders placed by the bot, else it will return all the orders
// if the status query is passed and it is valid, i.e, PENDING, COMPLETED, FAILED, then it will return the orders with that status
export const handleGetOrders = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const query: any = {};
            if (req.query.botId) {
                query.botId = req.query.botId;
            }
            if (req.query.status && ['PENDING', 'COMPLETED', 'FAILED'].includes(req.query.status as string)) {
                query['binaryOrder.status'] = req.query.status;
            }

            const binaryorders = db.getModelInstance("binaryorders");
            const orders = await binaryorders.find(query);

            res.status(200).json({ data: orders, success: true });
            return resolve();
        } catch (error) {
            res.status(500).json({ message: 'Orders not found', error: error, success: false });
            return reject(error);
        }
    });
}

// function to start the service worker which will update the PENDING orders in the db to the latest status
// this route can be called before starting any bot to update the orders in the db
export const handleStartPendingOrderUpdate = async (req: express.Request, res: express.Response): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (orderUpdateJobServer) {
                res.status(400).json({ message: 'Order update already running', success: false });
                return resolve();
            }
            // start a new child process for the order update server
            const workerPath = path.join(__dirname, '../utils/job-servers/bt-order-update-server.js');
            orderUpdateJobServer = fork(workerPath);

            orderUpdateJobServer?.stdout?.on('data', (data) => {
                console.log(`Child stdout: ${data}`);
            });
            orderUpdateJobServer?.stderr?.on('data', (data) => {
                console.error(`Child stderr: ${data}`);
            });
            orderUpdateJobServer?.on('message', (msg:any) => {
                if(msg?.type === 'error'){
                    console.error(`Child error: ${msg?.msg}`);
                }
            });
            orderUpdateJobServer?.on('exit', async (code, signal) => {
                console.log(`OrderUpdateServer exited with code ${code}, signal ${signal}`);
                orderUpdateJobServer = null;
            });


            res.status(200).json({ message: 'Order update started', success: true });
            return resolve();
        } catch (error) {
            res.status(500).json({ message: 'Order update failed', error: error, success: false });
            return reject(error);
        }
    });
}

// function to return ILiveTraderInput object from the bot document
// if any parameter is missing, it will throw an error
const createLiveTraderInputObject = (bot: any): ILiveTraderInput => {
    if (bot.broker && bot.strategy && bot.symbol && bot.timeframe && bot.botId) {
        let liveTraderInput: ILiveTraderInput = {
            botId: bot.botId,
            broker: bot.broker,
            strategy: bot.strategy,
            symbol: bot.symbol,
            timeframe: bot.timeframe,
            params: bot.params
        };
        return liveTraderInput;
    } else {
        throw new Error('Bot parameters missing');
    }
}

const initJobServer = (liveTraderInput: ILiveTraderInput) => {
    // Path to the child process script
    const workerPath = path.join(__dirname, '../utils/job-servers/binary-trader-server.js');

    // Fork a new child process
    const jobServer = fork(workerPath);

    const key = `${liveTraderInput.botId}`;

    let errorMsg = '';

    // Forward child process stdout and stderr to parent process
    jobServer.stdout?.on('data', (data) => {
        console.log(`Child stdout: ${data}`);
    });
    jobServer.stderr?.on('data', (data) => {
        console.error(`Child stderr: ${data}`);
    });

    // Listen to messages from the child process
    jobServer.on('message', (msg:any) => {
        console.log(`Message from JobServer:`, msg);
        if(msg?.type === 'error'){
            errorMsg = msg?.msg;
        }
    });

    // Handle child process exit
    jobServer.on('exit', async (code, signal) => {
        console.log(`JobServer exited with code ${code}, signal ${signal}`);
        if (jobServers.has(key)) {
            jobServers.delete(key);
        }

        // add the STOP entry in runningLogs for bot in db as well
        // add the STOP entry here only in case of error/code=1
        if(code===1){
            const binarybots = db.getModelInstance("binarybots");
            const bot = await binarybots.findOne({ botId: liveTraderInput.botId });
            if (bot) {
                // push the new runningLog entry to document and update it in db
                const data = Object.assign({actionType: "error", error: errorMsg} ,liveTraderInput);
                const runningLogEntry: IRunningLog = {
                    type: 'STOP',
                    timestamp: Date.now(),
                    message: 'Live trader stopped',
                    data: data
                };
                (bot as any)?.runningLogs?.push(runningLogEntry);
                await bot.save();
            }
        }
    });

    jobServers.set(key, jobServer);
}

const startLiveTrader = (liveTraderInput: ILiveTraderInput) => {
    initJobServer(liveTraderInput);

    const key = `${liveTraderInput.botId}`;

    jobServers.get(key)?.send({ type: 'start', data: liveTraderInput });
}