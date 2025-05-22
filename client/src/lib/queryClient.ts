import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { syncManager } from '../services/syncManager';
import { offlineStorage } from '../services/offlineStorage';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Função para fazer requisições à API com suporte para offline
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const method = options.method || 'GET';
  let body = null;
  let files = null;

  // Extrai o body da requisição
  if (options.body) {
    if (options.body instanceof FormData) {
      // Se for FormData, extrai os arquivos e converte o resto para objeto
      const formData = options.body as FormData;
      const filesArray: File[] = [];
      let jsonData = {};

      // Extrai dados do FormData
      formData.forEach((value, key) => {
        if (value instanceof File) {
          filesArray.push(value);
        } else if (key === 'data' && typeof value === 'string') {
          try {
            jsonData = JSON.parse(value);
          } catch (e) {
            console.error('Erro ao parsear JSON dos dados:', e);
          }
        }
      });

      body = jsonData;
      files = filesArray.length > 0 ? filesArray : null;
    } else if (typeof options.body === 'string') {
      // Se for string, assume que é JSON
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = options.body;
      }
    } else {
      // Outros tipos
      body = options.body;
    }
  }

  // Intercepta a requisição com o syncManager
  return syncManager.interceptRequest(url, method, body, files);
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getAuthQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Cria o cliente de consulta com opções padrão
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 300000, // 5 minutos
      retry: 1, // Tenta uma vez, depois falha
      // Aumenta o tempo de inatividade para salvar recursos
      gcTime: 3600000, // 1 hora
    },
  },
})

// Função auxiliar para criar uma função de consulta com suporte offline
export function getQueryFn(url: string) {
  return async () => {
    try {
      // Verificar se estamos online
      if (navigator.onLine && syncManager.getOnlineStatus()) {
        // Tentar buscar do servidor
        try {
          const res = await fetch(url, {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          if (!res.ok) {
            throw new Error(`Erro HTTP: ${res.status}`);
          }

          const data = await res.json();

          // Armazenar os dados localmente para acesso offline
          const cacheKey = url.replace(/^\/api\//, ''); // Remove '/api/' do início
          console.log(`Salvando dados da API para offline: ${cacheKey}`, data);
          await offlineStorage.saveOfflineData(cacheKey, data);

          return data;
        } catch (error) {
          console.error(`Erro ao buscar dados online de ${url}:`, error);

          // Se falhou online, tentar os dados em cache
          return await getOfflineData(url);
        }
      } else {
        // Estamos offline, usar dados em cache
        console.log(`Usando dados offline para ${url}`);
        return await getOfflineData(url);
      }
    } catch (error) {
      console.error(`Erro completo na busca de dados para ${url}:`, error);
      throw error;
    }
  }
}

// Função para obter dados offline
async function getOfflineData(url: string): Promise<any> {
  // Extrair o tipo de entidade da URL (ex: /api/vehicles -> vehicles)
  const cacheKey = url.replace(/^\/api\//, ''); // Remove '/api/' do início

  try {
    // Buscar dados do cache offline
    const cachedData = await offlineStorage.getOfflineDataByType(cacheKey);

    if (cachedData && cachedData.length > 0) {
      console.log(`Dados offline encontrados para ${cacheKey}`, cachedData);
      return cachedData;
    }

    // Se não houver dados em cache, retorna um array vazio
    console.log(`Nenhum dado offline encontrado para ${cacheKey}`);
    return [];
  } catch (error) {
    console.error(`Erro ao buscar dados offline para ${cacheKey}:`, error);
    return [];
  }
}