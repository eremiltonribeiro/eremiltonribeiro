// Removing duplicated methods and attributes and resolving the dirname issue.
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
  private toastHandler: ((options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success'; duration?: number }) => void) | null = null;

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

    let isConnected = false;
    const maxRetries = 2;

    for (let retry = 0; retry < maxRetries && !isConnected; retry++) {
      try {
        const controller = new AbortController();
        const timeout = 3000 + (retry * 1000); // Aumenta timeout a cada tentativa
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch('/api/ping', { 
          method: 'GET',
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Ping bem-sucedido (tentativa ${retry + 1}):`, data);
          isConnected = true;
          this.updateOnlineStatus(true);
        } else {
          console.log(`Ping falhou com status ${response.status} (tentativa ${retry + 1})`);
          if (retry === maxRetries - 1) {
            this.updateOnlineStatus(false);
          }
        }
      } catch (error) {
        console.log(`Erro ao verificar conexão (tentativa ${retry + 1}):`, error.name, error.message);
        if (retry === maxRetries - 1) {
          this.updateOnlineStatus(false);
        } else {
          // Pequena pausa antes da próxima tentativa
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Reagendar verificação (aumenta intervalo se houve falha)
    const nextCheckInterval = isConnected ? 90000 : 60000; // 1.5min se ok, 1min se falhou
    setTimeout(() => this.checkRealOnlineStatus(), nextCheckInterval);
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

  // Inicia o gerenciador de sincronização
  public setToastHandler(handler: (options: { title: string; description?: string; variant?: 'default' | 'destructive' | 'success'; duration?: number }) => void) {
    this.toastHandler = handler;
  }

  // Método para atualizar a UI com status offline/online
  private updateOfflineUI(online: boolean, syncStatus?: { state: 'syncing' | 'completed' | 'error_retry' | 'error_critical', message?: string, count?: number }) {
    // Atualiza a interface para mostrar status
    const offlineIndicator = document.getElementById('offline-indicator');

    if (!offlineIndicator) {
      // Cria o indicador se não existir
      const indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      // Estilos básicos, podem ser melhorados com Tailwind/ShadCN via classes
      indicator.style.position = 'fixed';
      indicator.style.bottom = '10px';
      indicator.style.right = '10px';
      indicator.style.padding = '8px 16px';
      indicator.style.borderRadius = '4px';
      indicator.style.zIndex = '9999';
      indicator.style.fontWeight = 'bold';
      indicator.style.transition = 'all 0.3s ease';
      indicator.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      document.body.appendChild(indicator);
    }

    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      if (!online) {
        indicator.textContent = 'Offline. Alterações salvas localmente.';
        indicator.style.backgroundColor = '#ef4444'; // Tailwind red-500
        indicator.style.color = 'white';
        indicator.style.display = 'block';
      } else {
        if (syncStatus) {
          switch (syncStatus.state) {
            case 'syncing':
              indicator.textContent = syncStatus.message || `Sincronizando ${syncStatus.count || ''} operações...`;
              indicator.style.backgroundColor = '#f59e0b'; // Tailwind amber-500
              indicator.style.color = 'white';
              indicator.style.display = 'block';
              break;
            case 'completed':
              indicator.textContent = syncStatus.message || 'Sincronização concluída!';
              indicator.style.backgroundColor = '#22c55e'; // Tailwind green-500
              indicator.style.color = 'white';
              indicator.style.display = 'block';
              setTimeout(() => {
                // Esconde após um tempo ou se não houver mais operações
                this.getPendingOperationsCount().then(count => {
                  if (count === 0) {
                    indicator.style.opacity = '0';
                    setTimeout(() => {
                      indicator.style.display = 'none';
                      indicator.style.opacity = '1';
                    }, 300);
                  } else {
                     // Se ainda há operações, volta para o estado de "syncing" ou "pendente"
                    this.updateOfflineUI(true, { state: 'syncing', count });
                  }
                });
              }, 2000); // Mostra por 2 segundos
              break;
            case 'error_retry':
              indicator.textContent = syncStatus.message || 'Falha na sincronização. Tentando novamente...';
              indicator.style.backgroundColor = '#f59e0b'; // Tailwind amber-500
              indicator.style.color = 'white';
              indicator.style.display = 'block';
              break;
            case 'error_critical':
              indicator.textContent = syncStatus.message || 'Falha crítica na sincronização.';
              indicator.style.backgroundColor = '#ef4444'; // Tailwind red-500
              indicator.style.color = 'white';
              indicator.style.display = 'block';
              break;
          }
        } else {
           // Online e sem status de sincronização específico (ex: tudo sincronizado)
          this.getPendingOperationsCount().then(count => {
            if (count > 0) {
               this.updateOfflineUI(true, { state: 'syncing', count });
            } else {
                // Fade out e depois esconde o indicador se não houver operações
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
      const initialPendingOps = await this.getPendingOperations();

      if (initialPendingOps.length === 0) {
        console.log('Nenhuma operação pendente para sincronizar');
        this.updateOfflineUI(true, { state: 'completed', message: 'Nenhuma operação pendente.' });
        return;
      }

      console.log(`Iniciando sincronização de ${initialPendingOps.length} operações pendentes...`);
      if (this.toastHandler) {
        this.toastHandler({ title: "Sincronização iniciada...", description: `${initialPendingOps.length} operações pendentes.`, variant: 'default' });
      }
      this.updateOfflineUI(true, { state: 'syncing', count: initialPendingOps.length });

      const sortedOperations = initialPendingOps.sort((a, b) => a.timestamp - b.timestamp);
      let successfulOpsCount = 0;
      let failedOpsWillRetryCount = 0;
      let failedOpsCriticalCount = 0;

      const batchSize = 5;
      for (let i = 0; i < sortedOperations.length; i += batchSize) {
        const batch = sortedOperations.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(op => this.processSingleOperation(op)));
        results.forEach(result => {
          if (result.success) successfulOpsCount++;
          else if (result.willRetry) failedOpsWillRetryCount++;
          else failedOpsCriticalCount++;
        });
      }

      this.pendingOperationsCache = null; // Invalidar cache
      const remainingOps = await this.getPendingOperationsCount();

      if (failedOpsCriticalCount > 0) {
        const message = `Falha crítica ao sincronizar ${failedOpsCriticalCount} operações.`;
        if (this.toastHandler) this.toastHandler({ title: "Erro de Sincronização", description: message, variant: 'destructive' });
        this.updateOfflineUI(true, { state: 'error_critical', message });
      } else if (failedOpsWillRetryCount > 0) {
        const message = `${failedOpsWillRetryCount} operações falharam e serão tentadas novamente. ${successfulOpsCount} operações sincronizadas.`;
        if (this.toastHandler) this.toastHandler({ title: "Sincronização Parcial", description: message, variant: 'default' });
        this.updateOfflineUI(true, { state: 'error_retry', message, count: remainingOps });
      } else if (successfulOpsCount > 0 && initialPendingOps.length === successfulOpsCount) {
        const message = `Todas as ${successfulOpsCount} operações foram sincronizadas com sucesso.`;
        if (this.toastHandler) this.toastHandler({ title: "Sincronização Concluída", description: message, variant: 'success' });
        this.updateOfflineUI(true, { state: 'completed', message });
      } else if (remainingOps > 0) {
         // Caso alguma operação tenha sido adicionada durante a sincronização
        this.updateOfflineUI(true, { state: 'syncing', count: remainingOps, message: `${successfulOpsCount} operações sincronizadas. Verificando novas...` });
        this.syncPendingOperations(); // Chama novamente para processar o que restou ou foi adicionado
        return; // Evita o finally block de setar isSyncing para false prematuramente
      } else {
        this.updateOfflineUI(true, { state: 'completed', message: 'Nenhuma operação pendente.' });
      }

      console.log(`Sincronização concluída. Sucesso: ${successfulOpsCount}, Falha (tentará novamente): ${failedOpsWillRetryCount}, Falha (crítica): ${failedOpsCriticalCount}`);

    } catch (error) {
      console.error('Erro durante sincronização:', error);
      if (this.toastHandler) this.toastHandler({ title: "Erro Inesperado na Sincronização", description: error.message, variant: 'destructive' });
       this.updateOfflineUI(true, { state: 'error_critical', message: 'Erro inesperado durante a sincronização.' });
    } finally {
      this.isSyncing = false;
    }
  }

  // Processa uma única operação pendente
  private async processSingleOperation(op: PendingOperation): Promise<{ success: boolean; willRetry: boolean; criticalError: boolean }> {
    try {
      console.log(`Sincronizando operação: ${op.id} - ${op.method} ${op.url}`);
      await offlineStorage.updateOperationStatus(op.id, 'processing'); // Mudado de 'syncing' para 'processing'

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
      const responseData = await response.json();

      if (op.method === 'POST') {
        // Reconciliação de ID para operações de criação
        // O ID temporário foi gerado em interceptRequest como `temp_${op.id}`
        // e atribuído a op.payload.id (ou tempBody.id que se tornou op.payload.id)
        // A resposta do servidor (responseData) contém o ID permanente.
        const temporaryId = `temp_${op.id}`; // Assumindo que este é o ID temporário salvo
        console.log(`Reconciliando POST: tempId=${temporaryId}, serverData=`, responseData);
        await offlineStorage.updateRecordIdAndData(op.entity, temporaryId, responseData);
      } else if (op.method === 'PUT') {
        // LWW para operações de atualização
        // responseData contém o estado mais recente do servidor
        console.log(`Reconciliando PUT: entity=${op.entity}, serverData=`, responseData);
        await offlineStorage.saveOfflineDataItem(op.entity, responseData);
        // Atualizar o cache para refletir a mudança
        // O refreshCacheForType foi adicionado em offlineStorage, mas saveOfflineDataItem não o chama.
        // Precisamos garantir que o cache seja atualizado. saveOfflineData o faz.
        // Vamos chamar explicitamente refreshCacheForType ou garantir que saveOfflineDataItem o faça.
        // Por agora, vamos assumir que saveOfflineDataItem lida com o cache ou o atualizamos explicitamente.
        const cachedData = await offlineStorage.getOfflineDataByType(op.entity); // Força a atualização do cache se getOfflineDataByType o fizer
        const itemIndex = cachedData.findIndex(item => item.id === responseData.id);
        if (itemIndex > -1) {
          cachedData[itemIndex] = responseData;
        } else {
          cachedData.push(responseData); // Adiciona se não encontrado (embora para PUT devesse existir)
        }
        // Re-salvar para atualizar o cache via saveOfflineData
        await offlineStorage.saveOfflineData(op.entity, cachedData);
      }
      // Para DELETE, o item já foi removido localmente em interceptRequest.
      // A sincronização apenas confirma a operação no servidor.

      await offlineStorage.updateOperationStatus(op.id, 'completed');

      // Após um tempo, remove a operação completada para não acumular
      setTimeout(() => {
        offlineStorage.removePendingOperation(op.id).then(() => {
          this.pendingOperationsCache = null; // Invalidar cache
          this.checkPendingOperations(); // Verificar se há mais operações e atualizar UI
        });
      }, 5000);

      return { success: true, willRetry: false, criticalError: false };
    } catch (error) {
      console.error(`Erro ao sincronizar operação ${op.id}:`, error.message);
      const newRetryCount = op.retryCount + 1;

      if (newRetryCount >= this.maxRetries) {
        const errorMsg = `Falha após ${this.maxRetries} tentativas: ${error.message}`;
        await offlineStorage.updateOperationStatus(op.id, 'error', errorMsg);
        if (this.toastHandler) { // Adicionado toast para falha crítica de uma operação
            this.toastHandler({ title: `Erro ao sincronizar ${op.entity}`, description: `Operação ${op.type} falhou criticamente.`, variant: 'destructive' });
        }
        return { success: false, willRetry: false, criticalError: true };
      } else {
        const errorMsg = `Tentativa ${newRetryCount}/${this.maxRetries} falhou: ${error.message}`;
        await offlineStorage.updateOperationRetry(op.id, newRetryCount, errorMsg);
        return { success: false, willRetry: true, criticalError: false };
      }
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