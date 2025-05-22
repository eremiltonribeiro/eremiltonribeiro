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

    // Add initial data
    this.initializeData();
  }

  private initializeData() {
    // ... (Seu código original de inserção de dados iniciais)
  }

  // --- User methods ---
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
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
    return vehicle;
  }
  async updateVehicle(id: number, data: any): Promise<Vehicle> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) throw new Error(`Veículo com ID ${id} não encontrado`);
    const updatedVehicle: Vehicle = { ...existingVehicle, ...data, id };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }
  async deleteVehicle(id: number): Promise<boolean> {
    const exists = this.vehicles.has(id);
    if (!exists) throw new Error(`Veículo com ID ${id} não encontrado`);
    return this.vehicles.delete(id);
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
    return driver;
  }
  async updateDriver(id: number, data: any): Promise<Driver> {
    const existingDriver = this.drivers.get(id);
    if (!existingDriver) throw new Error(`Motorista com ID ${id} não encontrado`);
    const updatedDriver: Driver = { ...existingDriver, ...data, id };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }
  async deleteDriver(id: number): Promise<boolean> {
    const exists = this.drivers.has(id);
    if (!exists) throw new Error(`Motorista com ID ${id} não encontrado`);
    return this.drivers.delete(id);
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
    return fuelStation;
  }
  async updateFuelStation(id: number, data: any): Promise<FuelStation> {
    const existing = this.fuelStations.get(id);
    if (!existing) throw new Error(`Posto com ID ${id} não encontrado`);
    const updated: FuelStation = { ...existing, ...data, id };
    this.fuelStations.set(id, updated);
    return updated;
  }
  async deleteFuelStation(id: number): Promise<boolean> {
    const exists = this.fuelStations.has(id);
    if (!exists) throw new Error(`Posto com ID ${id} não encontrado`);
    return this.fuelStations.delete(id);
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
    return fuelType;
  }
  async updateFuelType(id: number, data: any): Promise<FuelType> {
    const existing = this.fuelTypes.get(id);
    if (!existing) throw new Error(`Tipo de combustível com ID ${id} não encontrado`);
    const updated: FuelType = { ...existing, ...data, id };
    this.fuelTypes.set(id, updated);
    return updated;
  }
  async deleteFuelType(id: number): Promise<boolean> {
    const exists = this.fuelTypes.has(id);
    if (!exists) throw new Error(`Tipo de combustível com ID ${id} não encontrado`);
    return this.fuelTypes.delete(id);
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
    return maintenanceType;
  }
  async updateMaintenanceType(id: number, data: any): Promise<MaintenanceType> {
    const existing = this.maintenanceTypes.get(id);
    if (!existing) throw new Error(`Tipo de manutenção com ID ${id} não encontrado`);
    const updated: MaintenanceType = { ...existing, ...data, id };
    this.maintenanceTypes.set(id, updated);
    return updated;
  }
  async deleteMaintenanceType(id: number): Promise<boolean> {
    const exists = this.maintenanceTypes.has(id);
    if (!exists) throw new Error(`Tipo de manutenção com ID ${id} não encontrado`);
    return this.maintenanceTypes.delete(id);
  }

  // --- Vehicle registration methods ---
  async updateRegistration(id: number, data: any): Promise<VehicleRegistration> {
    const existingRegistration = this.registrations.get(id);
    if (!existingRegistration) throw new Error(`Registro com ID ${id} não encontrado`);
    const updatedRegistration: VehicleRegistration = { ...existingRegistration, ...data, id };
    this.registrations.set(id, updatedRegistration);
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
    return registration;
  }
  async deleteRegistration(id: number): Promise<boolean> {
    const exists = this.registrations.has(id);
    if (!exists) throw new Error(`Registro com ID ${id} não encontrado`);
    return this.registrations.delete(id);
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
    return vehicleChecklist;
  }
  async updateVehicleChecklist(id: number, data: any): Promise<VehicleChecklist> {
    const existingChecklist = this.vehicleChecklists.get(id);
    if (!existingChecklist) throw new Error(`Checklist with id ${id} not found`);
    const updatedChecklist: VehicleChecklist = { ...existingChecklist, ...data, id };
    this.vehicleChecklists.set(id, updatedChecklist);
    return updatedChecklist;
  }
  async deleteVehicleChecklist(id: number): Promise<boolean> {
    return this.vehicleChecklists.delete(id);
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
    return checklistResult;
  }
  async deleteChecklistResults(checklistId: number): Promise<boolean> {
    const resultsToDelete = Array.from(this.checklistResults.values()).filter(
      (result) => result.checklistId === checklistId
    );
    for (const result of resultsToDelete) {
      this.checklistResults.delete(result.id);
    }
    return true;
  }

  // --- Replit Auth ---
  async getUser(id: string): Promise<User | undefined> {
    const numId = parseInt(id);
    return this.users.get(numId);
  }
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = Array.from(this.users.values()).find(user => user.id === userData.id);
    if (existingUser) {
      const updatedUser = { ...existingUser, ...userData, updatedAt: new Date() };
      this.users.set(parseInt(updatedUser.id), updatedUser);
      return updatedUser;
    } else {
      const newUserId = userData.id || this.userCurrentId.toString();
      const newUser: User = {
        ...userData,
        id: newUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(parseInt(newUserId), newUser);
      this.userCurrentId = Math.max(this.userCurrentId, parseInt(newUserId) + 1);
      return newUser;
    }
  }
  async getUserById(id: string): Promise<User | null> {
    try {
      const userId = id;
      // Tentar buscar do localStorage primeiro (padrão do seu exemplo)
      // No NodeJS isso não existe, mas ok, mantém a compatibilidade do código
      const userFromStorage = typeof localStorage !== "undefined" ? localStorage.getItem(`user_${userId}`) : null;
      if (userFromStorage) {
        return JSON.parse(userFromStorage);
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }
}

export const storage = new MemStorage();
