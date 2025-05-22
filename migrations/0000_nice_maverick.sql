CREATE TABLE "drivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"license" text NOT NULL,
	"phone" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuel_stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text
);
--> statement-breakpoint
CREATE TABLE "fuel_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicle_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"vehicle_id" integer NOT NULL,
	"driver_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"initial_km" integer NOT NULL,
	"final_km" integer,
	"fuel_station_id" integer,
	"fuel_type_id" integer,
	"liters" integer,
	"fuel_cost" integer,
	"full_tank" boolean,
	"arla" boolean,
	"maintenance_type_id" integer,
	"maintenance_cost" integer,
	"destination" text,
	"reason" text,
	"observations" text,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plate" text NOT NULL,
	"model" text NOT NULL,
	"year" integer NOT NULL,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
