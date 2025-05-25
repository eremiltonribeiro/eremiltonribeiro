import { Request, Response } from 'express';

export const ping = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
};
