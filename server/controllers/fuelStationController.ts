import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertFuelStationSchema } from '@shared/schema';
import { z } from "zod";

export const getFuelStations = async (req: Request, res: Response) => {
    try {
        const stations = await storage.getFuelStations();
        res.json(stations);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createFuelStation = async (req: Request, res: Response) => {
    try {
        const stationData = req.body;
        insertFuelStationSchema.parse(stationData);
        const station = await storage.createFuelStation(stationData);
        res.status(201).json(station);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors.map(e => e.message) });
        }
        console.error("Error creating fuel station:", error);
        res.status(500).json({ message: error.message });
    }
};

export const updateFuelStation = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        // TODO: Adicionar validação Zod para os dados de atualização se necessário
        const station = await storage.updateFuelStation(id, req.body);
        if (!station) return res.status(404).json({ message: "Posto não encontrado" });
        res.json(station);
    } catch (error: any) {
        console.error("Error updating fuel station:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteFuelStation = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteFuelStation(id);
        if (!deleted) return res.status(404).json({ message: "Posto não encontrado" });
        res.json({ message: "Posto excluído com sucesso" });
    } catch (error: any) {
        console.error("Error deleting fuel station:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getFuelStationById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const station = await storage.getFuelStation(id);
        if (!station) {
            return res.status(404).json({ message: "Posto não encontrado" });
        }
        res.json(station);
    } catch (error: any) {
        console.error("Error getting fuel station by ID:", error);
        res.status(500).json({ message: error.message });
    }
};
