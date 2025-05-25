import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import multer from "multer";
import { z } from "zod";
import {
  extendedRegistrationSchema,
  fuelRegistrationSchema,
  maintenanceRegistrationSchema, 
  tripRegistrationSchema,
  insertVehicleSchema,
  insertDriverSchema,
  insertFuelStationSchema,
  insertFuelTypeSchema,
  insertMaintenanceTypeSchema
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import * as vehicleController from "./controllers/vehicleController";
import * as driverController from "./controllers/driverController";
import * as fuelStationController from "./controllers/fuelStationController";
import * as fuelTypeController from "./controllers/fuelTypeController";
import * as maintenanceTypeController from "./controllers/maintenanceTypeController";
import * as registrationController from "./controllers/registrationController";
import * as checklistController from "./controllers/checklistController";
import * as appController from "./controllers/appController";

// Setup upload directory
const uploadsDir = path.join(process.cwd(), "dist/public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens são permitidas"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(express.json());
  await setupAuth(app);

  // ---------------- PING ----------------
  app.get("/api/ping", appController.ping);

  // ---------------- VEÍCULOS ----------------
  app.get("/api/vehicles", vehicleController.getVehicles);
  app.post("/api/vehicles", upload.single('image'), vehicleController.createVehicle);
  app.get("/api/vehicles/:id", vehicleController.getVehicleById); // Nova rota
  app.put("/api/vehicles/:id", upload.single('image'), vehicleController.updateVehicle); // Adicionado upload aqui também
  app.delete("/api/vehicles/:id", vehicleController.deleteVehicle);


  // ---------------- MOTORISTAS ----------------
  app.get("/api/drivers", driverController.getDrivers);
  app.post("/api/drivers", upload.single('image'), driverController.createDriver);
  app.get("/api/drivers/:id", driverController.getDriverById); // Nova rota
  app.put("/api/drivers/:id", upload.single('image'), driverController.updateDriver); // Adicionado upload aqui também
  app.delete("/api/drivers/:id", driverController.deleteDriver);


  // ---------------- POSTOS DE COMBUSTÍVEL ----------------
  app.get("/api/fuel-stations", fuelStationController.getFuelStations);
  app.post("/api/fuel-stations", fuelStationController.createFuelStation);
  app.get("/api/fuel-stations/:id", fuelStationController.getFuelStationById); // Nova rota
  app.put("/api/fuel-stations/:id", fuelStationController.updateFuelStation);
  app.delete("/api/fuel-stations/:id", fuelStationController.deleteFuelStation);


  // ---------------- TIPOS DE COMBUSTÍVEL ----------------
  app.get("/api/fuel-types", fuelTypeController.getFuelTypes);
  app.post("/api/fuel-types", fuelTypeController.createFuelType);
  app.get("/api/fuel-types/:id", fuelTypeController.getFuelTypeById); // Nova rota
  app.put("/api/fuel-types/:id", fuelTypeController.updateFuelType);
  app.delete("/api/fuel-types/:id", fuelTypeController.deleteFuelType);


  // ---------------- TIPOS DE MANUTENÇÃO ----------------
  app.get("/api/maintenance-types", maintenanceTypeController.getMaintenanceTypes);
  app.post("/api/maintenance-types", maintenanceTypeController.createMaintenanceType);
  app.get("/api/maintenance-types/:id", maintenanceTypeController.getMaintenanceTypeById); // Nova rota
  app.put("/api/maintenance-types/:id", maintenanceTypeController.updateMaintenanceType);
  app.delete("/api/maintenance-types/:id", maintenanceTypeController.deleteMaintenanceType);

  // ---------------- REGISTROS (Registrations) ----------------
  app.get("/api/registrations", registrationController.getRegistrations);
  app.post("/api/registrations", upload.single("photo"), registrationController.createRegistration);
  app.get("/api/registrations/:id", registrationController.getRegistrationById);
  // A rota PUT para /api/registrations/:id já existe mais abaixo e será atualizada lá.
  // A rota DELETE para /api/registrations/:id já existe mais abaixo e será atualizada lá.
  
  // ---------------- CHECKLISTS (Templates, Items, VehicleChecklists, Results) ----------------
  // Checklist Template Routes
  app.get("/api/checklist-templates", checklistController.getChecklistTemplates);
  app.post("/api/checklist-templates", checklistController.createChecklistTemplate);
  app.get("/api/checklist-templates/:id", checklistController.getChecklistTemplateById);
  app.get("/api/checklist-templates/:id/items", checklistController.getChecklistItemsForTemplate);

  // Checklist Item Routes
  app.post("/api/checklist-items", checklistController.createChecklistItem);

  // Vehicle Checklist Routes
  app.get("/api/checklists", checklistController.getVehicleChecklists);
  app.post("/api/checklists", upload.single("photo"), checklistController.createVehicleChecklist);
  app.get("/api/checklists/edit/:id", checklistController.getVehicleChecklistForEdit); // Specific route for edit data
  app.get("/api/checklists/:id", checklistController.getVehicleChecklistById);
  app.put("/api/checklists/:id", upload.single("photo"), checklistController.updateVehicleChecklist);
  app.delete("/api/checklists/:id", checklistController.deleteVehicleChecklist);
  
  // Checklist Result Routes
  app.get("/api/checklists/:id/results", checklistController.getChecklistResults);

  // Atualizar registro existente
  app.put("/api/registrations/:id", upload.single("photo"), async (req, res) => { // This is for Registrations, not Checklists
    try {
      const id = parseInt(req.params.id);
      // Esta rota será movida para registrationController
      registrationController.updateRegistration(req, res);
    } catch (error: any) {
      // O tratamento de erro já está no controller, mas por segurança:
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Erro ao atualizar registro (rota principal):", error);
      res.status(500).json({ 
        message: "Erro ao atualizar registro: " + error.message,
        success: false
      });
    }
  });

  // Excluir um checklist específico
  // MOVIDO PARA CIMA E RENOMEADO PARA checklistController.deleteVehicleChecklist

  // Atualizar um checklist existente
  // MOVIDO PARA CIMA E RENOMEADO PARA checklistController.updateVehicleChecklist

  // Criar novo checklist
  // MOVIDO PARA CIMA E RENOMEADO PARA checklistController.createVehicleChecklist

  // Excluir um registro
  app.delete("/api/registrations/:id", registrationController.deleteRegistration); // Esta rota permanece para 'registrations'

  // Obter os resultados de um checklist específico
  // MOVIDO PARA CIMA E RENOMEADO PARA checklistController.getChecklistResults

  const httpServer = createServer(app);
  return httpServer;
}