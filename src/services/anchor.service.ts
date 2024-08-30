import express from 'express';

export const addAnchor = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const anchor = req.body;
        res.status(201).json(anchor);
    } catch (error) {
        res
    }
}