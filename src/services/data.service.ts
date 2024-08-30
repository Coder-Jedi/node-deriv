import { ChildProcess, fork } from 'child_process';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const  jobServers = new Map<string, ChildProcess>();

export const handleDataJobStart = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        if(!jobServers.has('dataJobServer')) {
            startDataJobServer();
            jobServers.get('dataJobServer')?.send({ type: 'start', symbol: req.body.symbol, timeframe: req.body.timeframe });
        }else {
            jobServers.get('dataJobServer')?.send({ type: 'start', symbol: req.body.symbol, timeframe: req.body.timeframe });
        }
        res.status(201).json({ message: 'Data job startup initiated' });
        return new Promise((resolve, reject) => {});
    } catch (error) {
        
    }
}

export const getDataJobsList = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        if(jobServers.has('dataJobServer')) {
            const data = await getJobsStatus();
            res.status(201).json({ data: data });
        }
        else{
            res.status(201).json({ data: [] });
        }
        return new Promise((resolve, reject) => {});
    } catch (error) {
        
    }
}

const startDataJobServer = () => {
    // Path to the child process script
    const workerPath = path.join(__dirname, '../utils/data-job-server.js');

    // Fork a new child process
    const dataJobServer = fork(workerPath);

    // Listen to messages from the child process
    dataJobServer.on('message', (msg) => {
        console.log(`Message from DataJobServer:`, msg);
    });

    // Handle child process exit
    dataJobServer.on('exit', (code, signal) => {
        console.log(`DataJobServer exited with code ${code}, signal ${signal}`);
    });

    jobServers.set('dataJobServer', dataJobServer);
}

const getJobsStatus = async () : Promise<any> => {
    return new Promise((resolve, reject) => {
        if(jobServers.has('dataJobServer')) {
            const dataJobServer = jobServers.get('dataJobServer');
            const sub = dataJobServer?.once('message', (msg:any) => {
                if(msg?.type === 'status') {
                    resolve(msg?.subscriptions);
                }
                else {
                    resolve([]);
                }
            });

            // setTimeout(() => {
            //     return resolve([]);
            // }, 1000);

            dataJobServer?.send({ type: 'status' });
        }
        else{
            resolve([]);
        }
    });
}