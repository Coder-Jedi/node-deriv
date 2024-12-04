// this file will contain all the routes related to the btbot
// A bot can be created by providing broker, strategy, symbol, timeframe and additional parameters required for the broker
// A new document will be created in the mongodb in the binarybots collection. The binarybots document can be created, deleted and fetched

import { Router } from 'express';
import { handleGetBotConfiguration, handleCreateBot, handleGetBotList, handleStartBot, handleGetRunningJobs, handleStopBot, handleGetBotDetails } from '../services/btbot.service.js';

const router = Router();

// route to get the valid configurations for the bot
router.get('/btbot/configuration', async (req, res) => {
    await handleGetBotConfiguration(req, res);
});

// route to create a new bot
router.post('/btbot/create', async (req, res) => {
    await handleCreateBot(req, res);
});

// route to get all the bots
// if query parameter is passed for status active, then the list of running bots will be returned
router.get('/btbot/list', async (req, res) => {
    const { status } = req.query;

    if(status === 'active') {
        // return the list of active bots
        await handleGetRunningJobs(req, res);
        return;
    }

    await handleGetBotList(req, res);
});

// route to start live trader for the botId
router.post('/btbot/start', async (req, res) => {
    await handleStartBot(req, res);
});

// route to stop live trader for the botId
router.post('/btbot/stop', async (req, res) => {
    await handleStopBot(req, res);
});

// route to get the detailed view of the bot and the orders placed by the bot
router.get('/btbot/details', async (req, res) => {
    await handleGetBotDetails(req, res);
});

export default router;
