import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
    extendedRegistrationSchema, 
    fuelRegistrationSchema, 
    maintenanceRegistrationSchema, 
    tripRegistrationSchema 
} from '@shared/schema';
import { z } from "zod";

export const getRegistrations = async (req: Request, res: Response) => {
    try {
        const type = req.query.type as string | undefined;
        const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        const registrations = await storage.getRegistrations({
            type,
            vehicleId,
            startDate,
            endDate,
        });

        const registrationsWithDetails = await Promise.all(
            registrations.map(async (reg) => {
                const vehicle = await storage.getVehicle(reg.vehicleId);
                const driver = await storage.getDriver(reg.driverId);
                let fuelStation, fuelType, maintenanceType;
                if (reg.fuelStationId) fuelStation = await storage.getFuelStation(reg.fuelStationId);
                if (reg.fuelTypeId) fuelType = await storage.getFuelType(reg.fuelTypeId);
                if (reg.maintenanceTypeId) maintenanceType = await storage.getMaintenanceType(reg.maintenanceTypeId);
                return { ...reg, vehicle, driver, fuelStation, fuelType, maintenanceType };
            })
        );
        res.json(registrationsWithDetails);
    } catch (error: any) {
        console.error("Error getting registrations:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getRegistrationById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const registration = await storage.getRegistration(id);
        if (!registration) {
            return res.status(404).json({ message: "Registro não encontrado" });
        }

        const vehicle = await storage.getVehicle(registration.vehicleId);
        const driver = await storage.getDriver(registration.driverId);
        let fuelStation, fuelType, maintenanceType;
        if (registration.fuelStationId) fuelStation = await storage.getFuelStation(registration.fuelStationId);
        if (registration.fuelTypeId) fuelType = await storage.getFuelType(registration.fuelTypeId);
        if (registration.maintenanceTypeId) maintenanceType = await storage.getMaintenanceType(registration.maintenanceTypeId);

        res.json({ ...registration, vehicle, driver, fuelStation, fuelType, maintenanceType });
    } catch (error: any) {
        console.error("Error getting registration by ID:", error);
        res.status(500).json({ message: error.message });
    }
};

export const createRegistration = async (req: Request, res: Response) => {
    try {
        const registrationData = JSON.parse(req.body.data);
        if (registrationData.date) registrationData.date = new Date(registrationData.date);

        let schema;
        switch (registrationData.type) {
            case "fuel": schema = fuelRegistrationSchema; break;
            case "maintenance": schema = maintenanceRegistrationSchema; break;
            case "trip": schema = tripRegistrationSchema; break;
            default: schema = extendedRegistrationSchema;
        }

        if (req.file) registrationData.photoUrl = `/uploads/${req.file.filename}`;
        
        schema.parse(registrationData);
        const registration = await storage.createRegistration(registrationData);
        res.status(201).json(registration);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error creating registration:", error);
        res.status(500).json({ message: error.message });
    }
};

export const updateRegistration = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        let registrationData = typeof req.body.data === 'string' 
            ? JSON.parse(req.body.data) 
            : req.body;

        if (req.file) registrationData.photoUrl = `/uploads/${req.file.filename}`;
        
        const existingRegistration = await storage.getRegistration(id);
        if (!existingRegistration) return res.status(404).json({ message: "Registro não encontrado" });

        if (registrationData.date && typeof registrationData.date === 'string') {
            registrationData.date = new Date(registrationData.date);
        }
        
        // TODO: Consider schema validation for update as well, might need a partial schema
        const registration = await storage.updateRegistration(id, registrationData);
        res.status(200).json({ message: "Registro atualizado com sucesso", registration });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error updating registration:", error);
        res.status(500).json({ message: "Erro ao atualizar registro: " + error.message, success: false });
    }
};

export const deleteRegistration = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const registration = await storage.getRegistration(id);
        if (!registration) {
            return res.status(404).json({ message: "Registro não encontrado", success: false });
        }
        
        const deleted = await storage.deleteRegistration(id);
        if (!deleted) throw new Error(`Falha ao excluir registro ${id}`);

        // TODO: Consider deleting file from /uploads if registration.photoUrl exists
        
        res.status(200).json({ message: "Registro excluído com sucesso", success: true, id: id });
    } catch (error: any) {
        console.error(`Erro ao excluir registro ${req.params.id}:`, error);
        res.status(500).json({ message: "Erro ao excluir registro: " + (error.message || "Erro desconhecido"), success: false });
    }
};
