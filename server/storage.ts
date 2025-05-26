import {
  User,
  UpsertUser,
  users,
  Vehicle,
  InsertVehicle,
  Driver,
  InsertDriver,
  FuelStation,
  InsertFuelStation,
  FuelType,
  InsertFuelType,
  MaintenanceType,
  InsertMaintenanceType,
  VehicleRegistration,
  InsertRegistration,
  ChecklistTemplate,
  InsertChecklistTemplate,
  ChecklistItem,
  InsertChecklistItem,
  VehicleChecklist,
  InsertVehicleChecklist,
  ChecklistResult,
  InsertChecklistResult
} from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(import.meta.dirname, "data");

// Extend the storage interface with CRUD methods
export interface IStorage {
  // Métodos de usuário para Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Vehicle methods
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, data: any): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<boolean>;

  // Driver methods
  getDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, data: any): Promise<Driver>;
  deleteDriver(id: number): Promise<boolean>;

  // Fuel station methods
  getFuelStations(): Promise<FuelStation[]>;
  getFuelStation(id: number): Promise<FuelStation | undefined>;
  createFuelStation(fuelStation: InsertFuelStation): Promise<FuelStation>;
  updateFuelStation(id: number, data: any): Promise<FuelStation>;
  deleteFuelStation(id: number): Promise<boolean>;

  // Fuel type methods
  getFuelTypes(): Promise<FuelType[]>;
  getFuelType(id: number): Promise<FuelType | undefined>;
  createFuelType(fuelType: InsertFuelType): Promise<FuelType>;
  updateFuelType(id: number, data: any): Promise<FuelType>;
  deleteFuelType(id: number): Promise<boolean>;

  // Maintenance type methods
  getMaintenanceTypes(): Promise<MaintenanceType[]>;
  getMaintenanceType(id: number): Promise<MaintenanceType | undefined>;
  createMaintenanceType(maintenanceType: InsertMaintenanceType): Promise<MaintenanceType>;
  updateMaintenanceType(id: number, data: any): Promise<MaintenanceType>;
  deleteMaintenanceType(id: number): Promise<boolean>;

  // Vehicle registration methods
  getRegistrations(filters?: {
    type?: string;
    vehicleId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleRegistration[]>;
  getRegistration(id: number): Promise<VehicleRegistration | undefined>;
  createRegistration(
    registration: InsertRegistration
  ): Promise<VehicleRegistration>;
  updateRegistration(id: number, data: any): Promise<VehicleRegistration>;
  deleteRegistration(id: number): Promise<boolean>;

  // Checklist template methods
  getChecklistTemplates(): Promise<ChecklistTemplate[]>;
  getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined>;
  createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate>;

  // Checklist item methods
  getChecklistItems(templateId: number): Promise<ChecklistItem[]>;
  getChecklistItem(id: number): Promise<ChecklistItem | undefined>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;

  // Vehicle checklist methods
  getVehicleChecklists(filters?: {
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleChecklist[]>;
  getVehicleChecklist(id: number): Promise<VehicleChecklist | undefined>;
  createVehicleChecklist(checklist: InsertVehicleChecklist): Promise<VehicleChecklist>;
  updateVehicleChecklist(id: number, data: any): Promise<VehicleChecklist>;
  deleteVehicleChecklist(id: number): Promise<boolean>;

  // Checklist result methods
  getChecklistResults(checklistId: number): Promise<ChecklistResult[]>;
  getChecklistResult(id: number): Promise<ChecklistResult | undefined>;
  createChecklistResult(result: InsertChecklistResult): Promise<ChecklistResult>;
  deleteChecklistResults(checklistId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private drivers: Map<number, Driver>;
  private fuelStations: Map<number, FuelStation>;
  private fuelTypes: Map<number, FuelType>;
  private maintenanceTypes: Map<number, MaintenanceType>;
  private registrations: Map<number, VehicleRegistration>;
  private checklistTemplates: Map<number, ChecklistTemplate>;
  private checklistItems: Map<number, ChecklistItem>;
  private vehicleChecklists: Map<number, VehicleChecklist>;
  private checklistResults: Map<number, ChecklistResult>;

  private userCurrentId: number;
  private vehicleCurrentId: number;
  private driverCurrentId: number;
  private fuelStationCurrentId: number;
  private fuelTypeCurrentId: number;
  private maintenanceTypeCurrentId: number;
  private registrationCurrentId: number;
  private checklistTemplateCurrentId: number;
  private checklistItemCurrentId: number;
  private vehicleChecklistCurrentId: number;
  private checklistResultCurrentId: number;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.drivers = new Map();
    this.fuelStations = new Map();
    this.fuelTypes = new Map();
    this.maintenanceTypes = new Map();
    this.registrations = new Map();
    this.checklistTemplates = new Map();
    this.checklistItems = new Map();
    this.vehicleChecklists = new Map();
    this.checklistResults = new Map();

    this.userCurrentId = 1;
    this.vehicleCurrentId = 1;
    this.driverCurrentId = 1;
    this.fuelStationCurrentId = 1;
    this.fuelTypeCurrentId = 1;
    this.maintenanceTypeCurrentId = 1;
    this.registrationCurrentId = 1;
    this.checklistTemplateCurrentId = 1;
    this.checklistItemCurrentId = 1;
    this.vehicleChecklistCurrentId = 1;
    this.checklistResultCurrentId = 1;

    this._ensureDataDir();
    this._loadAllData();
  }

  private _ensureDataDir(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (error) {
      console.error("Error creating data directory:", error);
    }
  }

  private _getFilePath(entityName: string): string {
    return path.join(DATA_DIR, `${entityName}.json`);
  }

  private _loadData<T extends { id: any }>(entityName: string, entityMap: Map<any, T>): number {
    const filePath = this._getFilePath(entityName);
    let maxId = 0;
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const dataArray = JSON.parse(fileContent) as T[];
        entityMap.clear(); // Clear existing in-memory data
        for (const item of dataArray) {
          entityMap.set(item.id, item);
          const numericId = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
          if (numericId > maxId) {
            maxId = numericId;
          }
        }
      }
    } catch (error) {
      console.error(`Error loading data for ${entityName}:`, error);
    }
    return maxId;
  }

  private _saveData<T>(entityName: string, dataMap: Map<any, T>): void {
    const filePath = this._getFilePath(entityName);
    try {
      const dataArray = Array.from(dataMap.values());
      fs.writeFileSync(filePath, JSON.stringify(dataArray, null, 2), "utf-8");
    } catch (error) {
      console.error(`Error saving data for ${entityName}:`, error);
    }
  }

  private _loadAllData(): void {
    let maxId = 0;
    maxId = this._loadData("users", this.users);
    this.userCurrentId = isNaN(maxId) ? 1 : maxId + 1;

    maxId = this._loadData("vehicles", this.vehicles);
    this.vehicleCurrentId = maxId + 1;

    maxId = this._loadData("drivers", this.drivers);
    this.driverCurrentId = maxId + 1;

    maxId = this._loadData("fuelStations", this.fuelStations);
    this.fuelStationCurrentId = maxId + 1;

    maxId = this._loadData("fuelTypes", this.fuelTypes);
    this.fuelTypeCurrentId = maxId + 1;

    maxId = this._loadData("maintenanceTypes", this.maintenanceTypes);
    this.maintenanceTypeCurrentId = maxId + 1;

    maxId = this._loadData("registrations", this.registrations);
    this.registrationCurrentId = maxId + 1;

    maxId = this._loadData("checklistTemplates", this.checklistTemplates);
    this.checklistTemplateCurrentId = maxId + 1;

    maxId = this._loadData("checklistItems", this.checklistItems);
    this.checklistItemCurrentId = maxId + 1;

    maxId = this._loadData("vehicleChecklists", this.vehicleChecklists);
    this.vehicleChecklistCurrentId = maxId + 1;

    maxId = this._loadData("checklistResults", this.checklistResults);
    this.checklistResultCurrentId = maxId + 1;
  }

  // --- User methods ---
  async getUser(id: number): Promise<User | undefined>;
  async getUser(id: string): Promise<User | undefined>;
  async getUser(id: number | string): Promise<User | undefined> {
    if (typeof id === 'number') {
      return this.users.get(id);
    }
    
    // Para string ID (Replit Auth)
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      return this.users.get(numericId);
    }
    
    return Array.from(this.users.values()).find(user => user.id.toString() === id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    this._saveData("users", this.users);
    return user;
  }

  // --- Vehicle methods ---
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleCurrentId++;
    const vehicle: Vehicle = { ...insertVehicle, id };
    this.vehicles.set(id, vehicle);
    this._saveData("vehicles", this.vehicles);
    return vehicle;
  }
  async updateVehicle(id: number, data: any): Promise<Vehicle> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) throw new Error(`Veículo com ID ${id} não encontrado`);
    const updatedVehicle: Vehicle = { ...existingVehicle, ...data, id };
    this.vehicles.set(id, updatedVehicle);
    this._saveData("vehicles", this.vehicles);
    return updatedVehicle;
  }
  async deleteVehicle(id: number): Promise<boolean> {
    const exists = this.vehicles.has(id);
    if (!exists) throw new Error(`Veículo com ID ${id} não encontrado`);
    const deleted = this.vehicles.delete(id);
    if (deleted) {
      this._saveData("vehicles", this.vehicles);
    }
    return deleted;
  }

  // --- Driver methods ---
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }
  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }
  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.driverCurrentId++;
    const driver: Driver = { ...insertDriver, id };
    this.drivers.set(id, driver);
    this._saveData("drivers", this.drivers);
    return driver;
  }
  async updateDriver(id: number, data: any): Promise<Driver> {
    const existingDriver = this.drivers.get(id);
    if (!existingDriver) throw new Error(`Motorista com ID ${id} não encontrado`);
    const updatedDriver: Driver = { ...existingDriver, ...data, id };
    this.drivers.set(id, updatedDriver);
    this._saveData("drivers", this.drivers);
    return updatedDriver;
  }
  async deleteDriver(id: number): Promise<boolean> {
    const exists = this.drivers.has(id);
    if (!exists) throw new Error(`Motorista com ID ${id} não encontrado`);
    const deleted = this.drivers.delete(id);
    if (deleted) {
      this._saveData("drivers", this.drivers);
    }
    return deleted;
  }

  // --- Fuel station methods ---
  async getFuelStations(): Promise<FuelStation[]> {
    return Array.from(this.fuelStations.values());
  }
  async getFuelStation(id: number): Promise<FuelStation | undefined> {
    return this.fuelStations.get(id);
  }
  async createFuelStation(insertFuelStation: InsertFuelStation): Promise<FuelStation> {
    const id = this.fuelStationCurrentId++;
    const fuelStation: FuelStation = { ...insertFuelStation, id };
    this.fuelStations.set(id, fuelStation);
    this._saveData("fuelStations", this.fuelStations);
    return fuelStation;
  }
  async updateFuelStation(id: number, data: any): Promise<FuelStation> {
    const existing = this.fuelStations.get(id);
    if (!existing) throw new Error(`Posto com ID ${id} não encontrado`);
    const updated: FuelStation = { ...existing, ...data, id };
    this.fuelStations.set(id, updated);
    this._saveData("fuelStations", this.fuelStations);
    return updated;
  }
  async deleteFuelStation(id: number): Promise<boolean> {
    const exists = this.fuelStations.has(id);
    if (!exists) throw new Error(`Posto com ID ${id} não encontrado`);
    const deleted = this.fuelStations.delete(id);
    if (deleted) {
      this._saveData("fuelStations", this.fuelStations);
    }
    return deleted;
  }

  // --- Fuel type methods ---
  async getFuelTypes(): Promise<FuelType[]> {
    return Array.from(this.fuelTypes.values());
  }
  async getFuelType(id: number): Promise<FuelType | undefined> {
    return this.fuelTypes.get(id);
  }
  async createFuelType(insertFuelType: InsertFuelType): Promise<FuelType> {
    const id = this.fuelTypeCurrentId++;
    const fuelType: FuelType = { ...insertFuelType, id };
    this.fuelTypes.set(id, fuelType);
    this._saveData("fuelTypes", this.fuelTypes);
    return fuelType;
  }
  async updateFuelType(id: number, data: any): Promise<FuelType> {
    const existing = this.fuelTypes.get(id);
    if (!existing) throw new Error(`Tipo de combustível com ID ${id} não encontrado`);
    const updated: FuelType = { ...existing, ...data, id };
    this.fuelTypes.set(id, updated);
    this._saveData("fuelTypes", this.fuelTypes);
    return updated;
  }
  async deleteFuelType(id: number): Promise<boolean> {
    const exists = this.fuelTypes.has(id);
    if (!exists) throw new Error(`Tipo de combustível com ID ${id} não encontrado`);
    const deleted = this.fuelTypes.delete(id);
    if (deleted) {
      this._saveData("fuelTypes", this.fuelTypes);
    }
    return deleted;
  }

  // --- Maintenance type methods ---
  async getMaintenanceTypes(): Promise<MaintenanceType[]> {
    return Array.from(this.maintenanceTypes.values());
  }
  async getMaintenanceType(id: number): Promise<MaintenanceType | undefined> {
    return this.maintenanceTypes.get(id);
  }
  async createMaintenanceType(insertMaintenanceType: InsertMaintenanceType): Promise<MaintenanceType> {
    const id = this.maintenanceTypeCurrentId++;
    const maintenanceType: MaintenanceType = { ...insertMaintenanceType, id };
    this.maintenanceTypes.set(id, maintenanceType);
    this._saveData("maintenanceTypes", this.maintenanceTypes);
    return maintenanceType;
  }
  async updateMaintenanceType(id: number, data: any): Promise<MaintenanceType> {
    const existing = this.maintenanceTypes.get(id);
    if (!existing) throw new Error(`Tipo de manutenção com ID ${id} não encontrado`);
    const updated: MaintenanceType = { ...existing, ...data, id };
    this.maintenanceTypes.set(id, updated);
    this._saveData("maintenanceTypes", this.maintenanceTypes);
    return updated;
  }
  async deleteMaintenanceType(id: number): Promise<boolean> {
    const exists = this.maintenanceTypes.has(id);
    if (!exists) throw new Error(`Tipo de manutenção com ID ${id} não encontrado`);
    const deleted = this.maintenanceTypes.delete(id);
    if (deleted) {
      this._saveData("maintenanceTypes", this.maintenanceTypes);
    }
    return deleted;
  }

  // --- Vehicle registration methods ---
  async updateRegistration(id: number, data: any): Promise<VehicleRegistration> {
    const existingRegistration = this.registrations.get(id);
    if (!existingRegistration) throw new Error(`Registro com ID ${id} não encontrado`);
    const updatedRegistration: VehicleRegistration = { ...existingRegistration, ...data, id };
    this.registrations.set(id, updatedRegistration);
    this._saveData("registrations", this.registrations);
    return updatedRegistration;
  }
  async getRegistrations(filters?: {
    type?: string;
    vehicleId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleRegistration[]> {
    let registrations = Array.from(this.registrations.values());
    if (filters) {
      if (filters.type) registrations = registrations.filter((reg) => reg.type === filters.type);
      if (filters.vehicleId) registrations = registrations.filter((reg) => reg.vehicleId === filters.vehicleId);
      if (filters.startDate) registrations = registrations.filter((reg) => new Date(reg.date) >= filters.startDate!);
      if (filters.endDate) registrations = registrations.filter((reg) => new Date(reg.date) <= filters.endDate!);
    }
    return registrations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async getRegistration(id: number): Promise<VehicleRegistration | undefined> {
    return this.registrations.get(id);
  }
  async createRegistration(insertRegistration: InsertRegistration): Promise<VehicleRegistration> {
    const id = this.registrationCurrentId++;
    const registration: VehicleRegistration = { ...insertRegistration, id };
    this.registrations.set(id, registration);
    this._saveData("registrations", this.registrations);
    return registration;
  }
  async deleteRegistration(id: number): Promise<boolean> {
    const exists = this.registrations.has(id);
    if (!exists) throw new Error(`Registro com ID ${id} não encontrado`);
    const deleted = this.registrations.delete(id);
    if (deleted) {
      this._saveData("registrations", this.registrations);
    }
    return deleted;
  }

  // --- Checklist template methods ---
  async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
    return Array.from(this.checklistTemplates.values());
  }
  async getChecklistTemplate(id: number): Promise<ChecklistTemplate | undefined> {
    return this.checklistTemplates.get(id);
  }
  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    const id = this.checklistTemplateCurrentId++;
    const checklistTemplate: ChecklistTemplate = { ...template, id };
    this.checklistTemplates.set(id, checklistTemplate);
    this._saveData("checklistTemplates", this.checklistTemplates);
    // Note: Checklist items are part of a template, typically managed when template is managed
    // or through dedicated item methods if items can be added/removed from an existing template.
    // For now, assuming items are created with the template and not modified independently here.
    // If items can be modified, _saveData("checklistItems", this.checklistItems) might be needed in item methods.
    return checklistTemplate;
  }

  // --- Checklist item methods ---
  async getChecklistItems(templateId: number): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values())
      .filter(item => item.templateId === templateId)
      .sort((a, b) => a.order - b.order);
  }
  async getChecklistItem(id: number): Promise<ChecklistItem | undefined> {
    return this.checklistItems.get(id);
  }
  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const id = this.checklistItemCurrentId++;
    const checklistItem: ChecklistItem = { ...item, id };
    this.checklistItems.set(id, checklistItem);
    this._saveData("checklistItems", this.checklistItems);
    // Also save the parent template as items are part of it conceptually.
    // This might be redundant if templates are saved upon item addition through another flow.
    // Consider if checklistItems should be saved only when the template is saved.
    // For now, saving both for explicitness.
    if (this.checklistTemplates.has(item.templateId)) {
        this._saveData("checklistTemplates", this.checklistTemplates);
    }
    return checklistItem;
  }

  // --- Vehicle checklist methods ---
  async getVehicleChecklists(filters?: {
    vehicleId?: number;
    driverId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VehicleChecklist[]> {
    let checklists = Array.from(this.vehicleChecklists.values());
    if (filters) {
      if (filters.vehicleId) checklists = checklists.filter(c => c.vehicleId === filters.vehicleId);
      if (filters.driverId) checklists = checklists.filter(c => c.driverId === filters.driverId);
      if (filters.startDate) checklists = checklists.filter(c => new Date(c.date) >= filters.startDate!);
      if (filters.endDate) checklists = checklists.filter(c => new Date(c.date) <= filters.endDate!);
    }
    return checklists.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async getVehicleChecklist(id: number): Promise<VehicleChecklist | undefined> {
    return this.vehicleChecklists.get(id);
  }
  async createVehicleChecklist(checklist: InsertVehicleChecklist): Promise<VehicleChecklist> {
    const id = this.vehicleChecklistCurrentId++;
    if (!checklist.date) checklist.date = new Date();
    const vehicleChecklist: VehicleChecklist = { ...checklist, id };
    this.vehicleChecklists.set(id, vehicleChecklist);
    this._saveData("vehicleChecklists", this.vehicleChecklists);
    return vehicleChecklist;
  }
  async updateVehicleChecklist(id: number, data: any): Promise<VehicleChecklist> {
    const existingChecklist = this.vehicleChecklists.get(id);
    if (!existingChecklist) throw new Error(`Checklist with id ${id} not found`);
    const updatedChecklist: VehicleChecklist = { ...existingChecklist, ...data, id };
    this.vehicleChecklists.set(id, updatedChecklist);
    this._saveData("vehicleChecklists", this.vehicleChecklists);
    return updatedChecklist;
  }
  async deleteVehicleChecklist(id: number): Promise<boolean> {
    const deleted = this.vehicleChecklists.delete(id);
    if (deleted) {
      this._saveData("vehicleChecklists", this.vehicleChecklists);
      // Also delete associated checklist results
      const resultsToDelete = Array.from(this.checklistResults.values()).filter(
        (result) => result.checklistId === id
      );
      for (const result of resultsToDelete) {
        this.checklistResults.delete(result.id);
      }
      this._saveData("checklistResults", this.checklistResults);
    }
    return deleted;
  }

  // --- Checklist result methods ---
  async getChecklistResults(checklistId: number): Promise<ChecklistResult[]> {
    return Array.from(this.checklistResults.values()).filter(result => result.checklistId === checklistId);
  }
  async getChecklistResult(id: number): Promise<ChecklistResult | undefined> {
    return this.checklistResults.get(id);
  }
  async createChecklistResult(result: InsertChecklistResult): Promise<ChecklistResult> {
    const id = this.checklistResultCurrentId++;
    const checklistResult: ChecklistResult = { ...result, id };
    this.checklistResults.set(id, checklistResult);
    this._saveData("checklistResults", this.checklistResults);
    return checklistResult;
  }
  async deleteChecklistResults(checklistId: number): Promise<boolean> {
    const resultsToDelete = Array.from(this.checklistResults.values()).filter(
      (result) => result.checklistId === checklistId
    );
    let changed = false;
    for (const result of resultsToDelete) {
      if (this.checklistResults.delete(result.id)) {
        changed = true;
      }
    }
    if (changed) {
      this._saveData("checklistResults", this.checklistResults);
    }
    return changed;
  }

  // --- Replit Auth ---

  async upsertUser(userData: UpsertUser): Promise<User> {
    // The User ID from Replit might be a string or number. Our internal map uses numbers.
    // We need to decide how to map Replit User IDs (which can be strings like "repl_user_123")
    // to our internal numeric IDs, or if we should change our internal ID to string for users.
    // For now, let's assume userData.id from UpsertUser *is* the numeric ID or a string version of it.
    
    const incomingIdIsNumeric = typeof userData.id === 'number';
    const incomingIdIsStringNumeric = typeof userData.id === 'string' && /^\d+$/.test(userData.id);

    let numericIdToUse: number;

    if (incomingIdIsNumeric) {
      numericIdToUse = userData.id as number;
    } else if (incomingIdIsStringNumeric) {
      numericIdToUse = parseInt(userData.id as string, 10);
    } else {
      // If userData.id is a non-numeric string (e.g. a Replit username or specific ID)
      // We need a strategy. For now, we'll try to find an existing user by this string ID
      // or create a new one using the auto-incrementing numeric ID.
      // This part is tricky because the schema uses `id: number` but Replit might send `id: string`.
      // Let's assume for this implementation, if `userData.id` is a non-numeric string,
      // it refers to a Replit-specific ID field that isn't the primary key in our `users` map.
      // We'll search by username or a dedicated `replitId` field if it existed.
      // Since it doesn't, we will proceed as if creating a new user or matching by existing numeric id.

      // This simplified logic assumes UpsertUser's ID field directly maps to our numeric User ID.
      // This might not be correct for all Replit Auth flows.
      const existingUserByNonNumericId = Array.from(this.users.values()).find(u => u.id.toString() === userData.id);
      if (existingUserByNonNumericId) {
        numericIdToUse = existingUserByNonNumericId.id;
      } else {
        // If no existing user by this string ID, and it's not numeric, create a new user.
        // This means the string ID from Replit isn't being used as the primary key directly.
        numericIdToUse = this.userCurrentId;
      }
    }
    
    const existingUser = this.users.get(numericIdToUse);

    if (existingUser) {
      const updatedUser: User = { 
        ...existingUser, 
        ...userData, 
        id: numericIdToUse, // Ensure ID remains numeric
        username: userData.username || existingUser.username, // Keep existing username if not provided
        // email: userData.email || existingUser.email, // Keep existing email if not provided
        updatedAt: new Date() 
      };
      this.users.set(numericIdToUse, updatedUser);
      this._saveData("users", this.users);
      return updatedUser;
    } else {
      // If numericIdToUse was from this.userCurrentId, increment it.
      if (numericIdToUse === this.userCurrentId) {
         this.userCurrentId++;
      } else if (numericIdToUse >= this.userCurrentId) {
        // If a specific numeric ID was provided (e.g. "123") that's higher than current, update currentId
        this.userCurrentId = numericIdToUse + 1;
      }

      const newUser: User = {
        id: numericIdToUse, // Use the determined numeric ID
        username: userData.username || `user${numericIdToUse}`, // Default username if not provided
        // email: userData.email || "", // Default email if not provided
        // name: userData.name || "", // Default name if not provided
        // avatarUrl: userData.avatarUrl || "", // Default avatar if not provided
        createdAt: new Date(),
        updatedAt: new Date(),
        // Ensure all required fields from User are present, possibly from UpsertUser or defaults
        ...(userData as Omit<UpsertUser, 'id'> & { id?: any }) // Spread other userData fields
      };
      this.users.set(numericIdToUse, newUser);
      this._saveData("users", this.users);
      return newUser;
    }
  }
  async getUserById(id: string): Promise<User | null> {
    // This method seems to be a duplicate or alternative to `getUser(id: string)`.
    // It also mentions localStorage which is not available in Node.js backend.
    // We should rely on the main `getUser` method that uses the in-memory `this.users` Map.
    try {
      const user = await this.getUser(id); // Use the class's main getUser method
      return user || null;
    } catch (error) {
      console.error('Erro ao buscar usuário by ID:', error);
      return null;
    }
  }
}

export const storage = new MemStorage();
