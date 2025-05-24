import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertDriverSchema } from '@shared/schema';
import { z } from "zod";

export const getDrivers = async (req: Request, res: Response) => {
    try {
        const drivers = await storage.getDrivers();
        res.json(drivers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createDriver = async (req: Request, res: Response) => {
    try {
        const driverData = req.body;
        // Validação Zod deve ocorrer antes de adicionar imageUrl
        const validatedData = insertDriverSchema.parse(driverData);
        
        let imageUrl;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        
        const driver = await storage.createDriver({ ...validatedData, imageUrl });
        res.status(201).json(driver);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors.map(e => e.message) });
        }
        console.error("Error creating driver:", error);
        res.status(500).json({ message: error.message });
    }
};

export const updateDriver = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const driverData = req.body;
        if (req.file) { // Se uma nova imagem for enviada
            driverData.imageUrl = `/uploads/${req.file.filename}`;
        }
        // TODO: Adicionar validação Zod para os dados de atualização se necessário
        const driver = await storage.updateDriver(id, driverData);
        if (!driver) return res.status(404).json({ message: "Motorista não encontrado" });
        res.json(driver);
    } catch (error: any) {
        console.error("Error updating driver:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteDriver = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteDriver(id);
        if (!deleted) return res.status(404).json({ message: "Motorista não encontrado" });
        res.json({ message: "Motorista excluído com sucesso" });
    } catch (error: any) {
        console.error("Error deleting driver:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getDriverById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const driver = await storage.getDriver(id);
        if (!driver) {
            return res.status(404).json({ message: "Motorista não encontrado" });
        }
        res.json(driver);
    } catch (error: any) {
        console.error("Error getting driver by ID:", error);
        res.status(500).json({ message: error.message });
    }
};
