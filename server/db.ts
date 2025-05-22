import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuração para WebSockets com Neon Database
neonConfig.webSocketConstructor = ws;

// Verificar se a variável de ambiente está disponível
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL deve ser configurada. Verifique as variáveis de ambiente.",
  );
}

// Criação do pool de conexões
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Exportação da instância do Drizzle ORM
export const db = drizzle(pool, { schema });