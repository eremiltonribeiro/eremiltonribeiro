import * as localforage from 'localforage';

// Classe para gerenciar o armazenamento offline usando IndexedDB
class OfflineStorage {
  private dbName = 'granduvale_offline_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  
  // Cache para melhorar performance de leituras frequentes
  private dataCache: Map<string, {data: any[], timestamp: number}> = new Map();
  private cacheTTL = 60000; // 1 minuto de TTL para cache
  
  constructor() {
    this.initDatabase();
  }
  
  // Inicializa o banco de dados
  private async initDatabase(): Promise<void> {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Armazena operações pendentes
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const store = db.createObjectStore('pendingOperations', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
        
        // Armazena dados offline (cache de entidades)
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Armazena imagens/arquivos
        if (!db.objectStoreNames.contains('offlineFiles')) {
          const store = db.createObjectStore('offlineFiles', { keyPath: 'id' });
          store.createIndex('entityId', 'entityId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB inicializado com sucesso');
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Erro ao inicializar IndexedDB:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
  
  // Garante que o banco de dados está inicializado
  private async ensureDbReady(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDatabase();
    }
    
    if (!this.db) {
      throw new Error('Não foi possível inicializar o banco de dados offline');
    }
    
    return this.db;
  }
  
  // Armazena uma operação pendente
  public async savePendingOperation(operation: any): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const request = store.put(operation);
      
      request.onsuccess = () => {
        console.log(`Operação ${operation.id} salva com sucesso para sincronização futura`);
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Erro ao salvar operação pendente:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Atualiza o status de uma operação
  public async updateOperationStatus(id: string, status: string, errorMessage?: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.status = status;
          if (errorMessage) {
            operation.errorMessage = errorMessage;
          }
          
          const updateRequest = store.put(operation);
          
          updateRequest.onsuccess = () => {
            resolve();
          };
          
          updateRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error);
          };
        } else {
          reject(new Error(`Operação ${id} não encontrada`));
        }
      };
      
      getRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Atualiza o contador de tentativas de uma operação
  public async updateOperationRetry(id: string, retryCount: number, errorMessage?: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.retryCount = retryCount;
          operation.status = 'pending'; // Reseta para pendente para tentar novamente
          if (errorMessage) {
            operation.errorMessage = errorMessage;
          }
          
          const updateRequest = store.put(operation);
          
          updateRequest.onsuccess = () => {
            resolve();
          };
          
          updateRequest.onerror = (event) => {
            reject((event.target as IDBRequest).error);
          };
        } else {
          reject(new Error(`Operação ${id} não encontrada`));
        }
      };
      
      getRequest.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Remove uma operação pendente
  public async removePendingOperation(id: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Obtém todas as operações pendentes
  public async getPendingOperations(): Promise<any[]> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readonly');
      const store = transaction.objectStore('pendingOperations');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Armazena dados offline (cache)
  public async saveOfflineData(type: string, data: any): Promise<void> {
    const db = await this.ensureDbReady();
    
    // Se data for um array, salvar cada item individualmente
    if (Array.isArray(data)) {
      console.log(`Salvando array de dados tipo ${type} (${data.length} itens)`);
      
      // Primeiro, remover dados antigos deste tipo
      await this.clearDataByType(type);
      
      // Otimização: usar transação única para todo o lote
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        
        // Processar em lotes para evitar sobrecarga de memória
        const batchSize = 50;
        let processed = 0;
        
        const processNextBatch = () => {
          const batch = data.slice(processed, processed + batchSize);
          if (batch.length === 0) {
            // Atualizar o cache após salvar
            this.dataCache.set(type, {
              data: [...data],
              timestamp: Date.now()
            });
            return;
          }
          
          batch.forEach(item => {
            // Garantir que temos um ID único
            if (!item.id) {
              item.id = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            }
            
            // Formatar ID para garantir compatibilidade com IndexedDB
            const recordId = `${type}_${item.id}`;
            
            // Criar uma cópia do objeto com os metadados adicionais
            const record = {
              ...item,
              _id: recordId,  // ID para indexedDB
              id: item.id,    // Mantém o ID original
              type,           // Tipo para indexação
              timestamp: Date.now() // Quando foi armazenado
            };
            
            store.put(record);
          });
          
          processed += batch.length;
          
          if (processed < data.length) {
            // Processar próximo lote
            setTimeout(processNextBatch, 0);
          }
        };
        
        // Iniciar processamento
        processNextBatch();
        
        transaction.oncomplete = () => {
          resolve();
        };
        
        transaction.onerror = (event) => {
          reject((event.target as IDBTransaction).error);
        };
      });
    }
    
    // Caso contrário, salvar como item único
    await this.saveOfflineDataItem(type, data);
    
    // Atualizar o cache após salvar
    const cachedData = this.dataCache.get(type);
    if (cachedData) {
      // Atualizar item existente ou adicionar novo
      const existingIndex = cachedData.data.findIndex(item => item.id === data.id);
      if (existingIndex >= 0) {
        cachedData.data[existingIndex] = data;
      } else {
        cachedData.data.push(data);
      }
      cachedData.timestamp = Date.now();
    }
  }
  
  // Salva um único item de dados
  private async saveOfflineDataItem(type: string, data: any): Promise<void> {
    const db = await this.ensureDbReady();
    
    // Garante que temos um ID único
    if (!data.id) {
      data.id = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Formatar ID para garantir compatibilidade com IndexedDB
    // IndexedDB aceita chaves numéricas ou strings, mas não ambos no mesmo store
    const recordId = `${type}_${data.id}`;
    
    // Criar uma cópia do objeto com os metadados adicionais
    const record = {
      ...data,
      _id: recordId,  // ID para indexedDB
      id: data.id,    // Mantém o ID original
      type,           // Tipo para indexação
      timestamp: Date.now() // Quando foi armazenado
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      const request = store.put(record);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        console.error(`Erro ao salvar dados offline tipo ${type}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Remove todos os dados de um determinado tipo
  public async clearDataByType(type: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    // Limpar o cache para este tipo
    this.dataCache.delete(type);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const index = store.index('type');
      
      // Otimização: usar IDBKeyRange para selecionar todos os registros do tipo
      const range = IDBKeyRange.only(type);
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        reject((event.target as IDBTransaction).error);
      };
    });
  }
  
  // Obtém dados offline por tipo
  public async getOfflineDataByType(type: string): Promise<any[]> {
    // Verificar se temos dados em cache e se ainda são válidos
    const cachedData = this.dataCache.get(type);
    if (cachedData && (Date.now() - cachedData.timestamp) < this.cacheTTL) {
      return [...cachedData.data]; // Retornar cópia para evitar mutações
    }
    
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const index = store.index('type');
      
      const request = index.getAll(type);
      
      request.onsuccess = () => {
        const results = request.result || [];
        
        // Remover os campos internos antes de retornar
        const cleanResults = results.map(item => {
          // Criar uma cópia sem os campos de metadados
          const { _id, type, timestamp, ...cleanItem } = item;
          return cleanItem;
        });
        
        // Atualizar o cache
        this.dataCache.set(type, {
          data: [...cleanResults],
          timestamp: Date.now()
        });
        
        resolve(cleanResults);
      };
      
      request.onerror = (event) => {
        console.error(`Erro ao buscar dados offline tipo ${type}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Métodos auxiliares específicos para entidades comuns
  public async saveRegistrations(data: any[]): Promise<void> {
    return this.saveOfflineData('registrations', data);
  }
  
  public async getRegistrations(): Promise<any[]> {
    return this.getOfflineDataByType('registrations');
  }
  
  public async saveVehicles(data: any[]): Promise<void> {
    return this.saveOfflineData('vehicles', data);
  }
  
  public async getVehicles(): Promise<any[]> {
    return this.getOfflineDataByType('vehicles');
  }
  
  public async saveDrivers(data: any[]): Promise<void> {
    return this.saveOfflineData('drivers', data);
  }
  
  public async getDrivers(): Promise<any[]> {
    return this.getOfflineDataByType('drivers');
  }
  
  public async saveFuelStations(data: any[]): Promise<void> {
    return this.saveOfflineData('fuel-stations', data);
  }
  
  public async getFuelStations(): Promise<any[]> {
    return this.getOfflineDataByType('fuel-stations');
  }
  
  public async saveFuelTypes(data: any[]): Promise<void> {
    return this.saveOfflineData('fuel-types', data);
  }
  
  public async getFuelTypes(): Promise<any[]> {
    return this.getOfflineDataByType('fuel-types');
  }
  
  public async saveMaintenanceTypes(data: any[]): Promise<void> {
    return this.saveOfflineData('maintenance-types', data);
  }
  
  public async getMaintenanceTypes(): Promise<any[]> {
    return this.getOfflineDataByType('maintenance-types');
  }
  
  // Salva um arquivo offline
  public async saveOfflineFile(entityId: string, file: File): Promise<string> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      // Converte o arquivo para um ArrayBuffer
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || !event.target.result) {
          reject(new Error('Falha ao ler o arquivo'));
          return;
        }
        
        const fileData = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          entityId,
          name: file.name,
          type: file.type,
          size: file.size,
          data: event.target.result,
          timestamp: Date.now()
        };
        
        const transaction = db.transaction(['offlineFiles'], 'readwrite');
        const store = transaction.objectStore('offlineFiles');
        
        const request = store.put(fileData);
        
        request.onsuccess = () => {
          resolve(fileData.id);
        };
        
        request.onerror = (event) => {
          reject((event.target as IDBRequest).error);
        };
      };
      
      reader.onerror = (event) => {
        reject(new Error('Erro ao ler o arquivo: ' + (event.target?.error?.message || 'Erro desconhecido')));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  // Obtém um arquivo offline
  public async getOfflineFile(id: string): Promise<{ data: ArrayBuffer, name: string, type: string }> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineFiles'], 'readonly');
      const store = transaction.objectStore('offlineFiles');
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve({
            data: request.result.data,
            name: request.result.name,
            type: request.result.type
          });
        } else {
          reject(new Error(`Arquivo ${id} não encontrado`));
        }
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Obtém arquivos por entidade
  public async getOfflineFilesByEntity(entityId: string): Promise<any[]> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineFiles'], 'readonly');
      const store = transaction.objectStore('offlineFiles');
      const index = store.index('entityId');
      
      const request = index.getAll(entityId);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Remove um arquivo offline
  public async removeOfflineFile(id: string): Promise<void> {
    const db = await this.ensureDbReady();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineFiles'], 'readwrite');
      const store = transaction.objectStore('offlineFiles');
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
  
  // Limpa o cache de dados
  public clearCache(type?: string): void {
    if (type) {
      this.dataCache.delete(type);
    } else {
      this.dataCache.clear();
    }
  }
  
  // Verifica o tamanho do banco de dados
  public async getDatabaseSize(): Promise<number> {
    try {
      // Usar a API de estimativa de uso para obter o tamanho aproximado
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.error('Erro ao estimar tamanho do banco de dados:', error);
      return 0;
    }
  }
  
  // Limpa dados antigos para otimizar espaço
  public async cleanupOldData(olderThanDays: number = 30): Promise<void> {
    const db = await this.ensureDbReady();
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    // Limpar operações antigas completadas
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['pendingOperations'], 'readwrite');
      const store = transaction.objectStore('pendingOperations');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const operation = cursor.value;
          if (operation.status === 'completed') {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        reject((event.target as IDBTransaction).error);
      };
    });
    
    // Limpar arquivos antigos sem referência
    const pendingOps = await this.getPendingOperations();
    const activeEntityIds = new Set(pendingOps.map(op => op.id));
    
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['offlineFiles'], 'readwrite');
      const store = transaction.objectStore('offlineFiles');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const file = cursor.value;
          if (!activeEntityIds.has(file.entityId)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        reject((event.target as IDBTransaction).error);
      };
    });
  }
}

// Exporta uma instância única
export const offlineStorage = new OfflineStorage();
