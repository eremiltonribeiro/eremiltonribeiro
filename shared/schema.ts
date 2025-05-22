import { pgTable, text, integer, serial, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage para Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// Tabela de usuários melhorada com Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  plate: text("plate").notNull().unique(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  name: true,
  plate: true,
  model: true,
  year: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Drivers table
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  license: text("license").notNull(),
  phone: text("phone").notNull(),
});

export const insertDriverSchema = createInsertSchema(drivers).pick({
  name: true,
  license: true,
  phone: true,
});

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Fuel stations table
export const fuelStations = pgTable("fuel_stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
});

export const insertFuelStationSchema = createInsertSchema(fuelStations).pick({
  name: true,
  address: true,
});

export type InsertFuelStation = z.infer<typeof insertFuelStationSchema>;
export type FuelStation = typeof fuelStations.$inferSelect;

// Fuel types table
export const fuelTypes = pgTable("fuel_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertFuelTypeSchema = createInsertSchema(fuelTypes).pick({
  name: true,
});

export type InsertFuelType = z.infer<typeof insertFuelTypeSchema>;
export type FuelType = typeof fuelTypes.$inferSelect;

// Maintenance types table
export const maintenanceTypes = pgTable("maintenance_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertMaintenanceTypeSchema = createInsertSchema(maintenanceTypes).pick({
  name: true,
});

export type InsertMaintenanceType = z.infer<typeof insertMaintenanceTypeSchema>;
export type MaintenanceType = typeof maintenanceTypes.$inferSelect;

// Registration types enum
export const RegistrationType = {
  FUEL: "fuel",
  MAINTENANCE: "maintenance",
  TRIP: "trip",
} as const;

export type RegistrationType = (typeof RegistrationType)[keyof typeof RegistrationType];

// Vehicle registrations table
export const vehicleRegistrations = pgTable("vehicle_registrations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "fuel", "maintenance", "trip"
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  initialKm: integer("initial_km").notNull(),
  finalKm: integer("final_km"),
  
  // Fuel fields
  fuelStationId: integer("fuel_station_id"),
  fuelTypeId: integer("fuel_type_id"),
  liters: integer("liters"),
  fuelCost: integer("fuel_cost"), // in cents
  fullTank: boolean("full_tank"),
  arla: boolean("arla"),
  
  // Maintenance fields
  maintenanceTypeId: integer("maintenance_type_id"),
  maintenanceCost: integer("maintenance_cost"), // in cents

  // Trip fields
  destination: text("destination"),
  reason: text("reason"),
  
  // Common fields
  observations: text("observations"),
  photoUrl: text("photo_url"),
});

export const insertRegistrationSchema = createInsertSchema(vehicleRegistrations).omit({
  id: true
});

// Extended schema with validation
export const extendedRegistrationSchema = insertRegistrationSchema.extend({
  type: z.enum(["fuel", "maintenance", "trip"]),
  
  // Common required fields
  vehicleId: z.number().min(1, "Veículo é obrigatório"),
  driverId: z.number().min(1, "Motorista é obrigatório"),
  date: z.date({ required_error: "Data é obrigatória" }),
  initialKm: z.number().min(0, "KM inicial é obrigatório"),

  // Conditional validation based on type
  finalKm: z.number().optional().nullable(),
  fuelStationId: z.number().optional().nullable(),
  fuelTypeId: z.number().optional().nullable(),
  liters: z.number().optional().nullable(),
  fuelCost: z.number().optional().nullable(),
  fullTank: z.boolean().optional().nullable(),
  arla: z.boolean().optional().nullable(),
  maintenanceTypeId: z.number().optional().nullable(),
  maintenanceCost: z.number().optional().nullable(),
  destination: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type VehicleRegistration = typeof vehicleRegistrations.$inferSelect;

// Actual form schemas with conditional validation
export const fuelRegistrationSchema = extendedRegistrationSchema.refine(
  (data) => data.type === "fuel" ? 
    data.fuelStationId && data.fuelTypeId && data.liters && data.fuelCost : 
    true,
  {
    message: "Posto, tipo de combustível, litros e valor são obrigatórios para abastecimento",
    path: ["type"],
  }
);

export const maintenanceRegistrationSchema = extendedRegistrationSchema.refine(
  (data) => data.type === "maintenance" ? 
    data.maintenanceTypeId && data.maintenanceCost : 
    true,
  {
    message: "Tipo de manutenção e valor são obrigatórios para manutenção",
    path: ["type"],
  }
);

export const tripRegistrationSchema = extendedRegistrationSchema.refine(
  (data) => data.type === "trip" ? 
    data.destination && data.finalKm : 
    true,
  {
    message: "Destino e KM final são obrigatórios para viagem",
    path: ["type"],
  }
);

// ========= Checklist de Veículos =========
// Tabela para modelos de checklist
export const checklistTemplates = pgTable("checklist_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplates).pick({
  name: true,
  description: true,
  isDefault: true,
});

export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;

// Tabela para itens de checklist
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isRequired: boolean("is_required").default(true),
  category: text("category"),
  order: integer("order").default(0),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  templateId: true,
  name: true,
  description: true,
  isRequired: true,
  category: true,
  order: true,
});

export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type ChecklistItem = typeof checklistItems.$inferSelect;

// Tabela para checklists realizados
export const vehicleChecklists = pgTable("vehicle_checklists", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id").notNull(),
  templateId: integer("template_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  observations: text("observations"),
  odometer: integer("odometer").notNull(),
  status: text("status").notNull(), // 'pending', 'complete', 'failed'
  photoUrl: text("photo_url"),
});

export const insertVehicleChecklistSchema = createInsertSchema(vehicleChecklists).omit({
  id: true
});

export type InsertVehicleChecklist = z.infer<typeof insertVehicleChecklistSchema>;
export type VehicleChecklist = typeof vehicleChecklists.$inferSelect;

// Tabela para resultados dos itens de checklist
export const checklistResults = pgTable("checklist_results", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").notNull(),
  itemId: integer("item_id").notNull(),
  status: text("status").notNull(), // 'ok', 'issue', 'not_applicable'
  observation: text("observation"),
  photoUrl: text("photo_url"),
});

export const insertChecklistResultSchema = createInsertSchema(checklistResults).omit({
  id: true
});

export type InsertChecklistResult = z.infer<typeof insertChecklistResultSchema>;
export type ChecklistResult = typeof checklistResults.$inferSelect;
