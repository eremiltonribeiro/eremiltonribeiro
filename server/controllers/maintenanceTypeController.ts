import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertMaintenanceTypeSchema } from '@shared/schema';
import { z } from "zod";

export const getMaintenanceTypes = async (req: Request, res: Response) => {
    try {
        const types = await storage.getMaintenanceTypes();
        res.json(types);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createMaintenanceType = async (req: Request, res: Response) => {
    try {
        const typeData = req.body;
        insertMaintenanceTypeSchema.parse(typeData);
        const maintenanceType = await storage.createMaintenanceType(typeData);
        res.status(201).json(maintenanceType);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors.map(e => e.message) });
        }
        console.error("Error creating maintenance type:", error);
        res.status(500).json({ message: error.message });
    }
};

export const updateMaintenanceType = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        // TODO: Adicionar validação Zod para os dados de atualização se necessário
        const type = await storage.updateMaintenanceType(id, req.body);
        if (!type) return res.status(404).json({ message: "Tipo de manutenção não encontrado" });
        res.json(type);
    } catch (error: any) {
        console.error("Error updating maintenance type:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteMaintenanceType = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteMaintenanceType(id);
        if (!deleted) return res.status(404).json({ message: "Tipo de manutenção não encontrado" });
        res.json({ message: "Tipo de manutenção excluído com sucesso" });
    } catch (error: any) {
        console.error("Error deleting maintenance type:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getMaintenanceTypeById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const type = await storage.getMaintenanceType(id);
        if (!type) {
            return res.status(404).json({ message: "Tipo de manutenção não encontrado" });
        }
        res.json(type);
    } catch (error: any) {
        console.error("Error getting maintenance type by ID:", error);
        res.status(500).json({ message: error.message });
    }
};
