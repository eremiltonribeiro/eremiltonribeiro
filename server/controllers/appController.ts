import { Request, Response } from 'express';

// Endpoint de ping para verificar conectividade
export const ping = async (req: Request, res: Response) => {
  try {
    // Verificação básica de saúde do servidor
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      message: 'Servidor ativo e operacional',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Connection', 'keep-alive');

    res.json(healthCheck);
  } catch (error) {
    console.error('❌ Erro no endpoint de ping:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};