import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertFuelTypeSchema } from '@shared/schema';
import { z } from "zod";

export const getFuelTypes = async (req: Request, res: Response) => {
    try {
        const types = await storage.getFuelTypes();
        res.json(types);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createFuelType = async (req: Request, res: Response) => {
    try {
        const typeData = { name: req.body.name };
        insertFuelTypeSchema.parse(typeData);
        const fuelType = await storage.createFuelType(typeData);
        res.status(201).json(fuelType);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors.map(e => e.message) });
        }
        console.error("Error creating fuel type:", error);
        res.status(500).json({ message: error.message });
    }
};

export const updateFuelType = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        // TODO: Adicionar validação Zod para os dados de atualização se necessário
        const type = await storage.updateFuelType(id, req.body);
        if (!type) return res.status(404).json({ message: "Tipo de combustível não encontrado" });
        res.json(type);
    } catch (error: any) {
        console.error("Error updating fuel type:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteFuelType = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteFuelType(id);
        if (!deleted) return res.status(404).json({ message: "Tipo de combustível não encontrado" });
        res.json({ message: "Tipo de combustível excluído com sucesso" });
    } catch (error: any) {
        console.error("Error deleting fuel type:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getFuelTypeById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const type = await storage.getFuelType(id);
        if (!type) {
            return res.status(404).json({ message: "Tipo de combustível não encontrado" });
        }
        res.json(type);
    } catch (error: any) {
        console.error("Error getting fuel type by ID:", error);
        res.status(500).json({ message: error.message });
    }
};
