import { Router } from 'express';
import { getDataJobsList, handleDataJobStart } from '../services/data.service.js';

const router = Router();

router.get('/data/jobs', (req, res) => {
    getDataJobsList(req, res);
});

router.post('/data/jobs/start', (req, res) => {
    handleDataJobStart(req, res);
});

router.post('/data/jobs/stop', (req, res) => {
    res.send('List of Anchors');
});

router.get('/data', (req, res) => {
    res.send('List of Anchors');
});

router.get('/data/:id', (req, res) => {
    res.send('List of Anchors');
});

export default router;
