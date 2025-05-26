import { Request, Response } from 'express';

// Endpoint de ping para verificar conectividade
export const ping = async (req: Request, res: Response) => {
  try {
    // Verificação básica de saúde do servidor
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'Server is running',
      environment: process.env.NODE_ENV || 'development'
    };

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(healthCheck);
  } catch (error) {
    console.error('Erro no ping:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Server error',
      timestamp: new Date().toISOString()
    });
  }
};