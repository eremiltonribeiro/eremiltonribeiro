import { Request, Response } from 'express';
import { storage } from '../storage';
// import { insertChecklistTemplateSchema, insertChecklistItemSchema, insertVehicleChecklistSchema, insertChecklistResultSchema } from '@shared/schema'; // Adicionar schemas Zod se necessário
import { z } from "zod";

// --- Checklist Template Methods ---
export const getChecklistTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await storage.getChecklistTemplates();
        res.json(templates);
    } catch (error: any) {
        console.error("Error getting checklist templates:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getChecklistTemplateById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const template = await storage.getChecklistTemplate(id);
        if (!template) return res.status(404).json({ message: "Template não encontrado" });
        const items = await storage.getChecklistItems(id);
        res.json({ ...template, items });
    } catch (error: any) {
        console.error("Error getting checklist template by ID:", error);
        res.status(500).json({ message: error.message });
    }
};

export const createChecklistTemplate = async (req: Request, res: Response) => {
    try {
        const templateData = req.body;
        // TODO: Add Zod validation: insertChecklistTemplateSchema.parse(templateData);
        const template = await storage.createChecklistTemplate(templateData);
        res.status(201).json(template);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error creating checklist template:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- Checklist Item Methods ---
export const getChecklistItemsForTemplate = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id); // Template ID
        const template = await storage.getChecklistTemplate(id);
        if (!template) return res.status(404).json({ message: "Template não encontrado para obter itens" });
        const items = await storage.getChecklistItems(id);
        res.json(items);
    } catch (error: any) {
        console.error(`Erro ao buscar itens para o template ${req.params.id}:`, error);
        res.status(500).json({ message: error.message });
    }
};

export const createChecklistItem = async (req: Request, res: Response) => {
    try {
        const itemData = req.body;
        // TODO: Add Zod validation: insertChecklistItemSchema.parse(itemData);
        const item = await storage.createChecklistItem(itemData);
        res.status(201).json(item);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error creating checklist item:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- Vehicle Checklist Methods ---
export const getVehicleChecklists = async (req: Request, res: Response) => {
    try {
        const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
        const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        const checklists = await storage.getVehicleChecklists({ vehicleId, driverId, startDate, endDate });
        const enrichedChecklists = await Promise.all(
            checklists.map(async (checklist) => {
                const vehicle = await storage.getVehicle(checklist.vehicleId);
                const driver = await storage.getDriver(checklist.driverId);
                const template = await storage.getChecklistTemplate(checklist.templateId);
                return {
                    ...checklist,
                    vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, plate: vehicle.plate } : null,
                    driver: driver ? { id: driver.id, name: driver.name } : null,
                    template: template ? { id: template.id, name: template.name } : null,
                };
            })
        );
        res.json(enrichedChecklists);
    } catch (error: any) {
        console.error("Error getting vehicle checklists:", error);
        res.status(500).json({ message: error.message });
    }
};

const enrichChecklistDetails = async (checklist: any) => {
    if (!checklist) return null;
    const vehicle = await storage.getVehicle(checklist.vehicleId);
    const driver = await storage.getDriver(checklist.driverId);
    const template = await storage.getChecklistTemplate(checklist.templateId);
    const items = await storage.getChecklistItems(checklist.templateId);
    let results = await storage.getChecklistResults(checklist.id);

    results = results.map(result => {
        if (result.photoUrl && !result.photoUrl.startsWith('data:') && !result.photoUrl.startsWith('/') && !result.photoUrl.startsWith('http')) {
            result.photoUrl = '/' + result.photoUrl;
        }
        return result;
    });

    return {
        ...checklist,
        vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, plate: vehicle.plate } : null,
        driver: driver ? { id: driver.id, name: driver.name } : null,
        template: template ? { id: template.id, name: template.name } : null,
        items,
        results,
    };
};

export const getVehicleChecklistById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const checklist = await storage.getVehicleChecklist(id);
        if (!checklist) return res.status(404).json({ message: "Checklist não encontrado" });
        const detailedChecklist = await enrichChecklistDetails(checklist);
        res.json(detailedChecklist);
    } catch (error: any) {
        console.error("Error getting vehicle checklist by ID:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getVehicleChecklistForEdit = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const checklist = await storage.getVehicleChecklist(id);
        if (!checklist) return res.status(404).json({ message: "Checklist não encontrado para edição" });
        const detailedChecklist = await enrichChecklistDetails(checklist);
        res.json(detailedChecklist);
    } catch (error: any) {
        console.error("Erro ao obter dados para edição de checklist:", error);
        res.status(500).json({ message: error.message });
    }
};

export const createVehicleChecklist = async (req: Request, res: Response) => {
    try {
        const checklistData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
        if (req.file) checklistData.photoUrl = `/uploads/${req.file.filename}`;
        if (checklistData.date && typeof checklistData.date === 'string') checklistData.date = new Date(checklistData.date);

        const resultsToCreate = checklistData.results || [];
        delete checklistData.results;

        const hasIssues = resultsToCreate.some((r: any) => r.status === 'issue');
        checklistData.status = hasIssues ? 'failed' : 'complete';
        
        // TODO: Add Zod validation: insertVehicleChecklistSchema.parse(checklistData);
        const checklist = await storage.createVehicleChecklist(checklistData);

        if (resultsToCreate.length > 0) {
            await Promise.all(resultsToCreate.map((result: any) => {
                // TODO: Add Zod validation: insertChecklistResultSchema.parse(result);
                return storage.createChecklistResult({
                    checklistId: checklist.id,
                    itemId: result.itemId,
                    status: result.status,
                    observation: result.observation || null,
                    photoUrl: result.photoUrl || null, // Assume photoUrl is handled by client or another upload mechanism for individual items
                });
            }));
        }
        res.status(201).json({ message: "Checklist criado com sucesso", checklist });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Erro de validação", errors: error.errors.map(e => e.message) });
        }
        console.error("Erro ao criar checklist:", error);
        res.status(500).json({ message: "Erro ao criar checklist" });
    }
};

export const updateVehicleChecklist = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const existingChecklist = await storage.getVehicleChecklist(id);
        if (!existingChecklist) return res.status(404).json({ message: "Checklist não encontrado" });

        const checklistData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;
        if (req.file) checklistData.photoUrl = `/uploads/${req.file.filename}`; // For main checklist photo

        const resultsToUpdate = checklistData.results || [];
        
        const hasIssues = resultsToUpdate.some((r: any) => r.status === 'issue');
        const newStatus = hasIssues ? 'failed' : 'complete';

        // TODO: Add Zod validation for checklistData (partial schema?)
        const updatedChecklist = await storage.updateVehicleChecklist(id, {
            vehicleId: checklistData.vehicleId,
            driverId: checklistData.driverId,
            templateId: checklistData.templateId,
            odometer: checklistData.odometer,
            observations: checklistData.observations || null,
            status: newStatus,
            photoUrl: checklistData.photoUrl || existingChecklist.photoUrl, // Keep old photo if not updated
            date: checklistData.date ? (typeof checklistData.date === 'string' ? new Date(checklistData.date) : checklistData.date) : existingChecklist.date,
        });

        await storage.deleteChecklistResults(id); // Clear old results
        if (resultsToUpdate.length > 0) {
            await Promise.all(resultsToUpdate.map((result: any) => {
                 // TODO: Add Zod validation: insertChecklistResultSchema.parse(result);
                return storage.createChecklistResult({
                    checklistId: id,
                    itemId: result.itemId,
                    status: result.status,
                    observation: result.observation || null,
                    photoUrl: result.photoUrl || null, // Assume photoUrl handled per item
                });
            }));
        }
        res.json({ ...updatedChecklist, message: "Checklist atualizado com sucesso" });
    } catch (error: any) {
        if (error instanceof z.ZodError) { // Assuming Zod errors might come from potential validation
            return res.status(400).json({ message: "Erro de validação", errors: error.errors.map(e => e.message) });
        }
        console.error("Erro ao atualizar checklist:", error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteVehicleChecklist = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const checklist = await storage.getVehicleChecklist(id);
        if (!checklist) return res.status(404).json({ message: "Checklist não encontrado" });

        await storage.deleteChecklistResults(id); // Delete associated results
        await storage.deleteVehicleChecklist(id); // Delete the checklist itself
        res.json({ message: "Checklist excluído com sucesso" });
    } catch (error: any) {
        console.error("Erro ao excluir checklist:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- Checklist Result Methods ---
export const getChecklistResults = async (req: Request, res: Response) => {
    try {
        const checklistId = parseInt(req.params.id); // Assuming :id here refers to checklistId
        const results = await storage.getChecklistResults(checklistId);
        
        const processedResults = results.map(result => {
            if (result.photoUrl && !result.photoUrl.startsWith('data:') && !result.photoUrl.startsWith('/') && !result.photoUrl.startsWith('http')) {
                result.photoUrl = '/' + result.photoUrl;
            }
            return result;
        });
        res.json(processedResults);
    } catch (error: any) {
        console.error("Erro ao obter resultados do checklist:", error);
        res.status(500).json({ message: error.message });
    }
};
