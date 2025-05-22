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

  // ---------------- VEÍCULOS ----------------
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/vehicles", upload.single('image'), async (req, res) => {
    try {
      const vehicleData = req.body;
      if (vehicleData.year) vehicleData.year = parseInt(vehicleData.year);
      insertVehicleSchema.parse(vehicleData);
      if (req.file) vehicleData.imageUrl = `/uploads/${req.file.filename}`;
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors.map(e => e.message) });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.updateVehicle(id, req.body);
      if (!vehicle) return res.status(404).json({ message: "Veículo não encontrado" });
      res.json(vehicle);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVehicle(id);
      if (!deleted) return res.status(404).json({ message: "Veículo não encontrado" });
      res.json({ message: "Veículo excluído com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // ---------------- MOTORISTAS ----------------
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/drivers", upload.single('image'), async (req, res) => {
    try {
      const driverData = req.body;
      insertDriverSchema.parse(driverData);
      if (req.file) driverData.imageUrl = `/uploads/${req.file.filename}`;
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors.map(e => e.message) });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const driver = await storage.updateDriver(id, req.body);
      if (!driver) return res.status(404).json({ message: "Motorista não encontrado" });
      res.json(driver);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDriver(id);
      if (!deleted) return res.status(404).json({ message: "Motorista não encontrado" });
      res.json({ message: "Motorista excluído com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // ---------------- POSTOS DE COMBUSTÍVEL ----------------
  app.get("/api/fuel-stations", async (req, res) => {
    try {
      const stations = await storage.getFuelStations();
      res.json(stations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/fuel-stations", async (req, res) => {
    try {
      const stationData = req.body;
      insertFuelStationSchema.parse(stationData);
      const station = await storage.createFuelStation(stationData);
      res.status(201).json(station);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors.map(e => e.message) });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/fuel-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const station = await storage.updateFuelStation(id, req.body);
      if (!station) return res.status(404).json({ message: "Posto não encontrado" });
      res.json(station);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/fuel-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFuelStation(id);
      if (!deleted) return res.status(404).json({ message: "Posto não encontrado" });
      res.json({ message: "Posto excluído com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // ---------------- TIPOS DE COMBUSTÍVEL ----------------
  app.get("/api/fuel-types", async (req, res) => {
    try {
      const types = await storage.getFuelTypes();
      res.json(types);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/fuel-types", async (req, res) => {
    try {
      const typeData = { name: req.body.name };
      insertFuelTypeSchema.parse(typeData);
      const fuelType = await storage.createFuelType(typeData);
      res.status(201).json(fuelType);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors.map(e => e.message) });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/fuel-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const type = await storage.updateFuelType(id, req.body);
      if (!type) return res.status(404).json({ message: "Tipo de combustível não encontrado" });
      res.json(type);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/fuel-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFuelType(id);
      if (!deleted) return res.status(404).json({ message: "Tipo de combustível não encontrado" });
      res.json({ message: "Tipo de combustível excluído com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });


  // ---------------- TIPOS DE MANUTENÇÃO ----------------
  app.get("/api/maintenance-types", async (req, res) => {
    try {
      const types = await storage.getMaintenanceTypes();
      res.json(types);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/maintenance-types", async (req, res) => {
    try {
      const typeData = req.body;
      insertMaintenanceTypeSchema.parse(typeData);
      const maintenanceType = await storage.createMaintenanceType(typeData);
      res.status(201).json(maintenanceType);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors.map(e => e.message) });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/maintenance-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const type = await storage.updateMaintenanceType(id, req.body);
      if (!type) return res.status(404).json({ message: "Tipo de manutenção não encontrado" });
      res.json(type);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/maintenance-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMaintenanceType(id);
      if (!deleted) return res.status(404).json({ message: "Tipo de manutenção não encontrado" });
      res.json({ message: "Tipo de manutenção excluído com sucesso" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  // Get registrations with optional filters
  app.get("/api/registrations", async (req, res) => {
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

      // Get additional data for each registration
      const registrationsWithDetails = await Promise.all(
        registrations.map(async (reg) => {
          const vehicle = await storage.getVehicle(reg.vehicleId);
          const driver = await storage.getDriver(reg.driverId);

          let fuelStation, fuelType, maintenanceType;

          if (reg.fuelStationId) {
            fuelStation = await storage.getFuelStation(reg.fuelStationId);
          }

          if (reg.fuelTypeId) {
            fuelType = await storage.getFuelType(reg.fuelTypeId);
          }

          if (reg.maintenanceTypeId) {
            maintenanceType = await storage.getMaintenanceType(reg.maintenanceTypeId);
          }

          return {
            ...reg,
            vehicle,
            driver,
            fuelStation,
            fuelType,
            maintenanceType,
          };
        })
      );

      res.json(registrationsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get single registration
  app.get("/api/registrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getRegistration(id);

      if (!registration) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }

      const vehicle = await storage.getVehicle(registration.vehicleId);
      const driver = await storage.getDriver(registration.driverId);

      let fuelStation, fuelType, maintenanceType;

      if (registration.fuelStationId) {
        fuelStation = await storage.getFuelStation(registration.fuelStationId);
      }

      if (registration.fuelTypeId) {
        fuelType = await storage.getFuelType(registration.fuelTypeId);
      }

      if (registration.maintenanceTypeId) {
        maintenanceType = await storage.getMaintenanceType(registration.maintenanceTypeId);
      }

      res.json({
        ...registration,
        vehicle,
        driver,
        fuelStation,
        fuelType,
        maintenanceType,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create new registration with file upload
  app.post("/api/registrations", upload.single("photo"), async (req, res) => {
    try {
      const registrationData = JSON.parse(req.body.data);

      // Convert string dates to Date objects
      if (registrationData.date) {
        registrationData.date = new Date(registrationData.date);
      }

      let schema;
      switch (registrationData.type) {
        case "fuel":
          schema = fuelRegistrationSchema;
          break;
        case "maintenance":
          schema = maintenanceRegistrationSchema;
          break;
        case "trip":
          schema = tripRegistrationSchema;
          break;
        default:
          schema = extendedRegistrationSchema;
      }

      // If a file was uploaded, add the URL to the registration data
      if (req.file) {
        registrationData.photoUrl = `/uploads/${req.file.filename}`;
      }

      // Validate data
      schema.parse(registrationData);

      // Create registration
      const registration = await storage.createRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Rotas para checklists
  // Obter templates de checklist
  app.get("/api/checklist-templates", async (req, res) => {
    try {
      const templates = await storage.getChecklistTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Obter um template específico com seus itens
  app.get("/api/checklist-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getChecklistTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Template não encontrado" });
      }

      const items = await storage.getChecklistItems(id);
      res.json({ ...template, items });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Obter itens de um template específico
  app.get("/api/checklist-templates/:id/items", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getChecklistTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Template não encontrado" });
      }

      const items = await storage.getChecklistItems(id);
      console.log(`Itens retornados para o template ${id}:`, items);
      res.json(items);
    } catch (error: any) {
      console.error(`Erro ao buscar itens para o template ${req.params.id}:`, error);
      res.status(500).json({ message: error.message });
    }
  });

  // Criar novo template de checklist
  app.post("/api/checklist-templates", async (req, res) => {
    try {
      const templateData = req.body;
      const template = await storage.createChecklistTemplate(templateData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Adicionar item ao template
  app.post("/api/checklist-items", async (req, res) => {
    try {
      const itemData = req.body;
      const item = await storage.createChecklistItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Obter checklists realizados
  app.get("/api/checklists", async (req, res) => {
    try {
      const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;
      const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const checklists = await storage.getVehicleChecklists({
        vehicleId,
        driverId,
        startDate,
        endDate,
      });

      // Enriquecer com detalhes do veículo e motorista
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
      res.status(500).json({ message: error.message });
    }
  });

  // Obter um checklist específico com seus resultados
  // Obter dados para edição de um checklist específico
app.get("/api/checklists/edit/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    console.log(`Obtendo dados para edição do checklist ${id}`);
    const checklist = await storage.getVehicleChecklist(id);

    if (!checklist) {
      return res.status(404).json({ message: "Checklist não encontrado" });
    }

    const vehicle = await storage.getVehicle(checklist.vehicleId);
    const driver = await storage.getDriver(checklist.driverId);
    const template = await storage.getChecklistTemplate(checklist.templateId);
    const items = await storage.getChecklistItems(checklist.templateId);
    const results = await storage.getChecklistResults(id);

    // Processar URLs de fotos, se existirem
    const processedResults = results.map(result => {
      if (result.photoUrl) {
        if (!result.photoUrl.startsWith('data:') && 
            !result.photoUrl.startsWith('/') &&
            !result.photoUrl.startsWith('http')) {
          result.photoUrl = '/' + result.photoUrl;
        }
      }
      return result;
    });

    res.json({
      ...checklist,
      vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, plate: vehicle.plate } : null,
      driver: driver ? { id: driver.id, name: driver.name } : null,
      template: template ? { id: template.id, name: template.name } : null,
      items,
      results: processedResults,
    });
  } catch (error: any) {
    console.error("Erro ao obter dados para edição de checklist:", error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checklist = await storage.getVehicleChecklist(id);

      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }

      const vehicle = await storage.getVehicle(checklist.vehicleId);
      const driver = await storage.getDriver(checklist.driverId);
      const template = await storage.getChecklistTemplate(checklist.templateId);
      const items = await storage.getChecklistItems(checklist.templateId);
      const results = await storage.getChecklistResults(id);

      res.json({
        ...checklist,
        vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, plate: vehicle.plate } : null,
        driver: driver ? { id: driver.id, name: driver.name } : null,
        template: template ? { id: template.id, name: template.name } : null,
        items,
        results,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Atualizar registro existente
  app.put("/api/registrations/:id", upload.single("photo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Atualizando registro ${id}. Corpo da requisição:`, req.body);
      
      let registrationData;
      try {
        registrationData = typeof req.body.data === 'string' 
          ? JSON.parse(req.body.data) 
          : req.body;
      } catch (error) {
        console.error("Erro ao analisar dados do registro:", error);
        return res.status(400).json({ message: "Formato de dados inválido" });
      }

      // Se houver upload de foto
      if (req.file) {
        registrationData.photoUrl = `/uploads/${req.file.filename}`;
        console.log("Nova foto adicionada:", registrationData.photoUrl);
      }

      // Verificar se o registro existe
      const existingRegistration = await storage.getRegistration(id);
      if (!existingRegistration) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }

      // Converter datas se necessário
      if (registrationData.date && typeof registrationData.date === 'string') {
        registrationData.date = new Date(registrationData.date);
      }
      
      console.log("Dados que serão atualizados:", registrationData);

      try {
        // Atualizar o registro
        const registration = await storage.updateRegistration(id, registrationData);
        console.log("Registro atualizado com sucesso:", registration);
        res.status(200).json({ 
          message: "Registro atualizado com sucesso", 
          registration 
        });
      } catch (updateError: any) {
        console.error("Erro específico ao atualizar registro:", updateError);
        return res.status(500).json({ 
          message: "Erro ao atualizar registro: " + updateError.message,
          success: false
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Erro ao atualizar registro:", error);
      res.status(500).json({ 
        message: "Erro ao atualizar registro: " + error.message,
        success: false
      });
    }
  });

  // Excluir um checklist específico
  app.delete("/api/checklists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checklist = await storage.getVehicleChecklist(id);

      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }

      // Excluir os resultados relacionados ao checklist
      await storage.deleteChecklistResults(id);

      // Excluir o checklist
      await storage.deleteVehicleChecklist(id);

      res.json({ message: "Checklist excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir checklist:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Atualizar um checklist existente
  app.put("/api/checklists/:id", upload.single("photo"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const checklist = await storage.getVehicleChecklist(id);

      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }

      // Extrair dados do corpo da requisição, considerando formData
      const checklistData = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body;

      console.log(`Atualizando checklist ${id} com os dados:`, checklistData);

      // Se houver upload de foto para o checklist principal
      if (req.file) {
        checklistData.photoUrl = `/uploads/${req.file.filename}`;
      }

      // Atualizar status baseado nos resultados
      const hasIssues = checklistData.results && checklistData.results.some((r: any) => r.status === 'issue');
      checklistData.status = hasIssues ? 'failed' : 'complete';

      // Remover resultados antigos
      await storage.deleteChecklistResults(id);

      // Atualizar o checklist principal
      const updatedChecklist = await storage.updateVehicleChecklist(id, {
        vehicleId: checklistData.vehicleId,
        driverId: checklistData.driverId,
        templateId: checklistData.templateId,
        odometer: checklistData.odometer,
        observations: checklistData.observations || null,
        status: checklistData.status,
        photoUrl: checklistData.photoUrl || null
      });

      // Salvar os novos resultados
      if (checklistData.results && checklistData.results.length > 0) {
        await Promise.all(checklistData.results.map((result: any) => {
          return storage.createChecklistResult({
            checklistId: id,
            itemId: result.itemId,
            status: result.status,
            observation: result.observation || null,
            photoUrl: result.photoUrl || null,
          });
        }));
      }

      res.json({ 
        ...updatedChecklist,
        message: "Checklist atualizado com sucesso"
      });
    } catch (error: any) {
      console.error("Erro ao atualizar checklist:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Criar novo checklist
  app.post("/api/checklists", upload.single("photo"), async (req, res) => {
    try {
      const checklistData = typeof req.body.data === 'string' 
        ? JSON.parse(req.body.data) 
        : req.body;

      // Se houver upload de foto para o checklist principal
      if (req.file) {
        checklistData.photoUrl = `/uploads/${req.file.filename}`;
      }

      // Garantir que a data seja um objeto Date
      if (checklistData.date && typeof checklistData.date === 'string') {
        checklistData.date = new Date(checklistData.date);
      }

      // Extrair resultados para salvar separadamente
      const results = checklistData.results || [];
      delete checklistData.results;

      // Definir status com base nos resultados
      const hasIssues = results.some((r: any) => r.status === 'issue');
      checklistData.status = hasIssues ? 'failed' : 'complete';

      // Criar o checklist
      const checklist = await storage.createVehicleChecklist(checklistData);

      // Salvar os resultados de cada item
      if (results.length > 0) {
        await Promise.all(results.map((result: any) => {
          return storage.createChecklistResult({
            checklistId: checklist.id,
            itemId: result.itemId,
            status: result.status,
            observation: result.observation || null,
            photoUrl: result.photoUrl || null,
          });
        }));
      }
      
      // Retornar resposta de sucesso com o checklist criado
      res.status(201).json({ 
        message: "Checklist criado com sucesso", 
        checklist 
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Erro de validação", 
          errors: error.errors.map(e => e.message) 
        });
      }
      console.error("Erro ao criar checklist:", error);
      res.status(500).json({ message: "Erro ao criar checklist" });
    }
  });

  // Excluir um registro
  app.delete("/api/registrations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Solicitação para excluir registro ${id}`);
      
      const registration = await storage.getRegistration(id);
      
      if (!registration) {
        console.error(`Registro ${id} não encontrado`);
        return res.status(404).json({ 
          message: "Registro não encontrado", 
          success: false 
        });
      }
      
      console.log(`Excluindo registro ${id}`);
      try {
        const deleted = await storage.deleteRegistration(id);
        
        if (!deleted) {
          throw new Error(`Falha ao excluir registro ${id}`);
        }
        
        // Se o registro tiver uma foto no sistema de arquivos, poderia excluir aqui também
        if (registration.photoUrl && 
            !registration.photoUrl.startsWith('data:') && 
            registration.photoUrl.includes('/uploads/')) {
          // Verificar caminho da foto e remover
          console.log(`O registro possui uma foto: ${registration.photoUrl}`);
          // Consideração para implementar exclusão de arquivos no futuro
          // const filePath = path.join(process.cwd(), 'dist/public', registration.photoUrl);
          // if (fs.existsSync(filePath)) {
          //   fs.unlinkSync(filePath);
          //   console.log(`Arquivo excluído: ${filePath}`);
          // }
        }
        
        console.log(`Registro ${id} excluído com sucesso`);
        res.status(200).json({ 
          message: "Registro excluído com sucesso",
          success: true,
          id: id
        });
      } catch (deleteError: any) {
        console.error(`Erro específico ao excluir registro ${id}:`, deleteError);
        return res.status(500).json({
          message: "Erro ao excluir registro: " + deleteError.message,
          success: false
        });
      }
    } catch (error: any) {
      console.error(`Erro ao excluir registro ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Erro ao excluir registro: " + (error.message || "Erro desconhecido"),
        success: false
      });
    }
  });

  // Obter os resultados de um checklist específico
  app.get("/api/checklists/:id/results", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Obtendo resultados do checklist ${id}`);
      const results = await storage.getChecklistResults(id);
      console.log(`Encontrados ${results.length} resultados para o checklist ${id}`);

      // Processa as URLs das fotos para garantir que estejam acessíveis
      const processedResults = results.map(result => {
        if (result.photoUrl) {
          // Certifica-se de que as URLs começam com / se não forem data URLs ou URLs externas
          if (!result.photoUrl.startsWith('data:') && 
              !result.photoUrl.startsWith('/') &&
              !result.photoUrl.startsWith('http')) {
            result.photoUrl = '/' + result.photoUrl;
          }
          console.log("URL da foto processada:", result.photoUrl);
        }
        return result;
      });

      res.json(processedResults);
    } catch (error: any) {
      console.error("Erro ao obter resultados do checklist:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}