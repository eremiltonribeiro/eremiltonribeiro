import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertVehicleSchema } from '@shared/schema';
import { z } from "zod";

export const getVehicles = async (req: Request, res: Response) => {
    try {
        const vehicles = await storage.getVehicles();
        res.json(vehicles);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createVehicle = async (req: Request, res: Response) => {
    try {
        const vehicleData = req.body;
        if (vehicleData.year) vehicleData.year = parseInt(vehicleData.year);
        // Validação Zod deve ocorrer antes de adicionar imageUrl
        const validatedData = insertVehicleSchema.parse(vehicleData);
        
        let imageUrl;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }
        
        const vehicle = await storage.createVehicle({ ...validatedData, imageUrl });
        res.status(201).json(vehicle);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors.map(e => e.message) });
        }
        console.error("Error creating vehicle:", error);
        res.status(500).json({ message: error.message });
    }
};

export const updateVehicle = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        // TODO: Adicionar validação Zod para os dados de atualização se necessário
        const vehicleData = req.body;
        if (req.file) { // Se uma nova imagem for enviada
            vehicleData.imageUrl = `/uploads/${req.file.filename}`;
        }
        const vehicle = await storage.updateVehicle(id, vehicleData);
        if (!vehicle) return res.status(404).json({ message: "Veículo não encontrado" });
        res.json(vehicle);
    } catch (error: any) {
        console.error("Error updating vehicle:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteVehicle = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await storage.deleteVehicle(id);
        if (!deleted) return res.status(404).json({ message: "Veículo não encontrado" });
        res.json({ message: "Veículo excluído com sucesso" });
    } catch (error: any) {
        console.error("Error deleting vehicle:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getVehicleById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const vehicle = await storage.getVehicle(id);
        if (!vehicle) {
            return res.status(404).json({ message: "Veículo não encontrado" });
        }
        res.json(vehicle);
    } catch (error: any) {
        console.error("Error getting vehicle by ID:", error);
        res.status(500).json({ message: error.message });
    }
};
