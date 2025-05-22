import { offlineStorage } from './offlineStorage';

// Tipos para as operações pendentes
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  url: string;
  method: string;
  payload: any;
  files?: File[];
  status: 'pending' | 'syncing' | 'processing' | 'error' | 'completed';
  retryCount: number;
  error?: string;
  errorMessage?: string;
  timestamp: number;
}

// Classe para gerenciar sincronização
class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private maxRetries: number = 3;
  private syncInterval: number = 30000; // 30 segundos
  private intervalId: number | null = null;
  private mutationObserver: MutationObserver | null = null;
  private syncListeners: Array<(hasPendingOperations: boolean) => void> = [];
  private onlineStatusListeners: Array<(isOnline: boolean) => void> = [];
  
  // Cache para operações pendentes para evitar consultas frequentes ao IndexedDB
  private pendingOperationsCache: PendingOperation[] | null = null;
  private pendingOperationsCacheTimestamp: number = 0;
  private pendingOperationsCacheMaxAge: number = 10000; // 10 segundos

  constructor() {
    // Inicializa os event listeners para status de conexão
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);

    // Verificação mais robusta do status online além do navigator.onLine
    this.checkRealOnlineStatus();
  }

  // Verifica se a conexão está realmente ativa fazendo um ping ao servidor
  private async checkRealOnlineStatus() {
    if (!navigator.onLine) {
      this.updateOnlineStatus(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.updateOnlineStatus(response.ok);
    } catch (error) {
      console.log('Erro ao verificar conexão:', error);
      this.updateOnlineStatus(false);
    }

    // Reagendar verificação
    setTimeout(() => this.checkRealOnlineStatus(), 60000); // A cada minuto
  }

  // Atualiza o status online e notifica listeners
  private updateOnlineStatus(status: boolean) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      console.log(`Status de conexão alterado: ${status ? 'Online' : 'Offline'}`);

      // Notifica listeners
      this.onlineStatusListeners.forEach(listener => listener(status));

      // Se ficou online, tenta sincronizar
      if (status) {
        this.syncPendingOperations();
      }

      // Atualiza visual para o usuário
      this.updateOfflineUI(status);
    }
  }

  // Método para atualizar a UI com status offline/online
  private updateOfflineUI(online: boolean) {
    // Atualiza a interface para mostrar status
    const offlineIndicator = document.getElementById('offline-indicator');

    if (!offlineIndicator) {
      // Cria o indicador se não existir
      const indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.style.position = 'fixed';
      indicator.style.bottom = '10px';
      indicator.style.right = '10px';
      indicator.style.padding = '8px 16px';
      indicator.style.borderRadius = '4px';
      indicator.style.zIndex = '9999';
      indicator.style.fontWeight = 'bold';
      indicator.style.transition = 'all 0.3s ease';
      document.body.appendChild(indicator);
    }

    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      if (!online) {
        indicator.textContent = 'Você está offline. Suas alterações serão salvas localmente.';
        indicator.style.backgroundColor = '#f8d7da';
        indicator.style.color = '#721c24';
        indicator.style.display = 'block';
      } else {
        // Verifica se há operações pendentes
        this.getPendingOperationsCount().then(count => {
          if (count > 0) {
            indicator.textContent = `Sincronizando ${count} operações...`;
            indicator.style.backgroundColor = '#fff3cd';
            indicator.style.color = '#856404';
            indicator.style.display = 'block';
          } else {
            // Fade out e depois esconde
            indicator.style.opacity = '0';
            setTimeout(() => {
              indicator.style.display = 'none';
              indicator.style.opacity = '1';
            }, 300);
          }
        });
      }
    }
  }

  // Handler para eventos online/offline
  private handleOnlineStatus = () => {
    console.log(`Evento de navegador: ${navigator.onLine ? 'Online' : 'Offline'}`);
    if (navigator.onLine) {
      // Verificação adicional da conexão real
      this.checkRealOnlineStatus();
    } else {
      this.updateOnlineStatus(false);
    }
  }

  // Inicia o gerenciador de sincronização
  public start() {
    console.log('SyncManager iniciado');

    // Se estiver online, sincroniza imediatamente
    if (this.isOnline) {
      this.syncPendingOperations();
    }

    // Cachear a página atual para uso offline
    this.cacheCurrentPage();

    // Configura a sincronização periódica
    if (this.intervalId === null) {
      this.intervalId = window.setInterval(() => {
        this.checkPendingOperations();
      }, this.syncInterval);
    }

    // Adiciona listener para mudanças de rota para cachear novas páginas
    window.addEventListener('popstate', () => this.cacheCurrentPage());

    // Para frameworks SPA como React com routing, podemos usar um MutationObserver
    // para detectar mudanças no DOM que indicam mudança de página
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    this.mutationObserver = new MutationObserver((mutations) => {
      // Otimização: verificar se as mutações são relevantes para mudança de página
      const significantChanges = mutations.some(mutation => 
        mutation.addedNodes.length > 0 && 
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE && 
          (node as Element).tagName === 'DIV' && 
          (node as Element).classList.contains('page-container')
        )
      );
      
      if (significantChanges) {
        this.cacheCurrentPage();
      }
    });

    // Observa mudanças no corpo da página, mas com configuração mais específica
    this.mutationObserver.observe(document.body, { 
      childList: true, 
      subtree: false // Reduzido para melhorar performance
    });
  }

  // Função para cachear a página atual
  private cacheCurrentPage() {
    if (this.isOnline && navigator.serviceWorker.controller) {
      // Envia mensagem para o service worker cachear esta página
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PAGE',
        url: window.location.pathname
      });

      console.log(`Solicitando cache da página: ${window.location.pathname}`);
    }
  }

  // Para o gerenciador de sincronização
  public stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Desconectar o MutationObserver para evitar vazamentos de memória
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  // Verifica se há operações pendentes e tenta sincronizar se estiver online
  public async checkPendingOperations() {
    const pendingOps = await this.getPendingOperations();

    if (pendingOps.length > 0) {
      console.log(`Existem ${pendingOps.length} operações pendentes de sincronização`);

      // Notifica os listeners
      this.syncListeners.forEach(listener => listener(true));

      // Se estiver online, tenta sincronizar
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingOperations();
      }
    } else {
      // Notifica que não há operações pendentes
      this.syncListeners.forEach(listener => listener(false));
    }
  }

  // Obtém operações pendentes com cache para melhorar performance
  private async getPendingOperations(): Promise<PendingOperation[]> {
    const now = Date.now();
    
    // Se o cache for válido, use-o
    if (this.pendingOperationsCache && 
        (now - this.pendingOperationsCacheTimestamp) < this.pendingOperationsCacheMaxAge) {
      return this.pendingOperationsCache;
    }
    
    // Caso contrário, busque do IndexedDB e atualize o cache
    const operations = await offlineStorage.getPendingOperations();
    this.pendingOperationsCache = operations;
    this.pendingOperationsCacheTimestamp = now;
    
    return operations;
  }

  // Intercepta requisições para lidar com modo offline
  public async interceptRequest(url: string, method: string, body: any, files?: File[]): Promise<any> {
    // Se estiver offline, salva a operação para sincronização posterior
    if (!this.isOnline) {
      console.log(`Interceptando requisição offline: ${method} ${url}`);

      // Gera um ID único
      const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Extrai a entidade da URL (ex: /api/registrations -> registrations)
      const entity = url.replace(/^\/api\//, '').split('/')[0];

      // Cria o objeto de operação pendente
      const pendingOp: PendingOperation = {
        id,
        type: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
        entity,
        url,
        method,
        payload: body,
        files: files || [],
        status: 'pending',
        retryCount: 0,
        timestamp: Date.now()
      };

      // Salva a operação pendente
      await offlineStorage.savePendingOperation(pendingOp);
      
      // Invalidar o cache de operações pendentes
      this.pendingOperationsCache = null;

      // Se for uma operação de criação, também salvar os dados localmente
      // para que apareçam na interface mesmo offline
      if (method === 'POST' || method === 'PUT') {
        // Para criação, adicionamos uma fake ID temporária
        const tempBody = { ...body };
        if (method === 'POST') {
          tempBody.id = `temp_${id}`;
          tempBody.offlinePending = true;
        }

        // Salva os dados localmente para acesso offline
        const currentData = await offlineStorage.getOfflineDataByType(entity) || [];

        if (method === 'POST') {
          // Adiciona o novo item
          await offlineStorage.saveOfflineData(entity, [...currentData, tempBody]);
        } else if (method === 'PUT') {
          // Atualiza o item existente
          const updatedData = currentData.map((item: any) => 
            item.id === body.id ? {...item, ...body, offlinePending: true} : item
          );
          await offlineStorage.saveOfflineData(entity, updatedData);
        }
      } else if (method === 'DELETE') {
        // Para exclusão, remove do cache local também
        const itemId = url.split('/').pop();
        const currentData = await offlineStorage.getOfflineDataByType(entity) || [];
        // Usa comparação não estrita (!=) para lidar com IDs de string e número
        const filteredData = currentData.filter((item: any) => 
          item.id != itemId // Comparação não estrita para lidar com diferenças de tipo
        );
        await offlineStorage.saveOfflineData(entity, filteredData);
      }

      // Se for upload de arquivo, salvar o arquivo no storage
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          await offlineStorage.saveOfflineFile(id, file);
        }
      }

      // Notifica que há operações pendentes
      this.syncListeners.forEach(listener => listener(true));

      // Retorna uma resposta simulada
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          id: body.id || `temp_${id}`, 
          message: 'Operação salva para sincronização posterior',
          offlinePending: true,
          isOfflineMock: true
        })
      };
    }

    // Se estiver online, faz a requisição normalmente
    try {
      // Preparar FormData se houver arquivos
      let requestOptions: RequestInit = {
        method,
        headers: {}
      };

      if (files && files.length > 0) {
        // Há arquivos, enviar como FormData
        const formData = new FormData();

        // Adicionar o payload como um campo data
        formData.append('data', JSON.stringify(body));

        // Adicionar os arquivos
        files.forEach((file, index) => {
          formData.append('photo', file);
        });

        requestOptions.body = formData;
      } else if (body) {
        // Sem arquivos, enviar como JSON
        requestOptions.headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };
        requestOptions.body = JSON.stringify(body);
      }

      // Fazer a requisição
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Erro na requisição:', error);

      // Mesmo estando online, salvamos a operação para tentativa posterior
      // se a requisição falhar
      if (method !== 'GET') {
        await this.addPendingOperation(url, method, body, files);
      }

      throw error;
    }
  }

  // Adiciona uma operação à fila de pendências
  private async addPendingOperation(url: string, method: string, body?: any, files?: File[]): Promise<string> {
    // Gera um ID único
    const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Extrai a entidade da URL (ex: /api/registrations -> registrations)
    const entity = url.replace(/^\/api\//, '').split('/')[0];

    // Garantir que files sempre seja uma matriz de tipo File ou undefined
    const validatedFiles = files && Array.isArray(files) 
      ? files.filter(file => file instanceof File) 
      : undefined;

    const operation: PendingOperation = {
      id,
      type: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
      entity,
      url,
      method,
      payload: body,
      timestamp: Date.now(),
      files: validatedFiles,
      retryCount: 0,
      status: 'pending'
    };

    await offlineStorage.savePendingOperation(operation);
    
    // Invalidar o cache de operações pendentes
    this.pendingOperationsCache = null;

    // Atualiza o contador visual
    this.updateOfflineUI(this.isOnline);

    return operation.id;
  }

  // Obtém o número de operações pendentes
  private async getPendingOperationsCount(): Promise<number> {
    const operations = await this.getPendingOperations();
    return operations.length;
  }

  // Sincroniza operações pendentes
  public async syncPendingOperations() {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    try {
      this.isSyncing = true;
      console.log('Iniciando sincronização de operações pendentes...');

      // Obtém todas as operações pendentes
      const pendingOps = await this.getPendingOperations();

      if (pendingOps.length === 0) {
        console.log('Nenhuma operação pendente para sincronizar');
        this.isSyncing = false;
        this.updateOfflineUI(true);
        return;
      }

      console.log(`Encontradas ${pendingOps.length} operações pendentes`);
      this.updateOfflineUI(true);

      // Processa as operações em ordem de timestamp (mais antigas primeiro)
      const sortedOperations = pendingOps.sort((a, b) => a.timestamp - b.timestamp);
      let successCount = 0;
      
      // Processa em lotes para melhor performance
      const batchSize = 5;
      for (let i = 0; i < sortedOperations.length; i += batchSize) {
        const batch = sortedOperations.slice(i, i + batchSize);
        await Promise.all(batch.map(op => this.processSingleOperation(op)));
      }

      // Invalidar o cache de operações pendentes após sincronização
      this.pendingOperationsCache = null;
      
      // Atualiza o contador visual
      this.updateOfflineUI(true);
      
      console.log('Sincronização concluída');
    } catch (error) {
      console.error('Erro durante sincronização:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  // Processa uma única operação pendente
  private async processSingleOperation(op: PendingOperation): Promise<boolean> {
    try {
      console.log(`Sincronizando operação: ${op.id} - ${op.method} ${op.url}`);

      // Atualiza status para sincronizando
      await offlineStorage.updateOperationStatus(op.id, 'syncing');

      // Prepara os dados para envio
      let requestOptions: RequestInit = {
        method: op.method,
        headers: {}
      };

      // Se houver arquivos, prepara um FormData
      if (op.files && op.files.length > 0) {
        const formData = new FormData();

        // Adiciona os dados como campo 'data'
        formData.append('data', JSON.stringify(op.payload));

        // Recupera e adiciona os arquivos
        for (let i = 0; i < op.files.length; i++) {
          try {
            const fileData = await offlineStorage.getOfflineFile(op.id);
            if (fileData) {
              const file = new File([fileData.data], fileData.name, { type: fileData.type });
              formData.append('photo', file);
            }
          } catch (fileError) {
            console.error(`Erro ao recuperar arquivo para operação ${op.id}:`, fileError);
          }
        }

        requestOptions.body = formData;
      } else {
        // Sem arquivos, usa JSON normal
        requestOptions.headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };
        requestOptions.body = JSON.stringify(op.payload);
      }

      // Faz a requisição
      const response = await fetch(op.url, requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na sincronização: ${response.status} ${response.statusText}`);
      }

      // Se chegou aqui, operação concluída com sucesso
      await offlineStorage.updateOperationStatus(op.id, 'completed');
      
      // Após um tempo, remove a operação completada para não acumular
      setTimeout(() => {
        offlineStorage.removePendingOperation(op.id);
        // Invalidar o cache de operações pendentes
        this.pendingOperationsCache = null;
      }, 5000);

      return true;
    } catch (error) {
      console.error(`Erro ao sincronizar operação ${op.id}:`, error);
      
      // Incrementa contador de tentativas
      const newRetryCount = op.retryCount + 1;
      
      if (newRetryCount >= this.maxRetries) {
        // Excedeu o número máximo de tentativas
        await offlineStorage.updateOperationStatus(
          op.id, 
          'error', 
          `Falha após ${this.maxRetries} tentativas: ${error.message}`
        );
      } else {
        // Atualiza contador de tentativas para tentar novamente depois
        await offlineStorage.updateOperationRetry(
          op.id, 
          newRetryCount, 
          `Tentativa ${newRetryCount}/${this.maxRetries} falhou: ${error.message}`
        );
      }
      
      return false;
    }
  }

  // Adiciona um listener para mudanças no status de sincronização
  public addSyncListener(listener: (hasPendingOperations: boolean) => void) {
    this.syncListeners.push(listener);
  }

  // Remove um listener de sincronização
  public removeSyncListener(listener: (hasPendingOperations: boolean) => void) {
    const index = this.syncListeners.indexOf(listener);
    if (index !== -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  // Adiciona um listener para mudanças no status online
  public addOnlineStatusListener(listener: (isOnline: boolean) => void) {
    this.onlineStatusListeners.push(listener);
    // Notifica imediatamente com o status atual
    listener(this.isOnline);
  }

  // Remove um listener de status online
  public removeOnlineStatusListener(listener: (isOnline: boolean) => void) {
    const index = this.onlineStatusListeners.indexOf(listener);
    if (index !== -1) {
      this.onlineStatusListeners.splice(index, 1);
    }
  }

  // Retorna o status online atual
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Exporta uma instância única
export const syncManager = new SyncManager();
