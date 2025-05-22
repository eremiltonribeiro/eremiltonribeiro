# Documentação do Sistema de Gestão de Frotas

## Visão Geral

O Sistema de Gestão de Frotas é uma aplicação web completa para controle operacional e financeiro de veículos leves, desenvolvida com Node.js/Express (back-end) e React (front-end). O sistema permite gerenciar abastecimentos, manutenções, viagens, motoristas, checklists e gerar relatórios detalhados, funcionando tanto online quanto offline.

## Características Principais

- **Funcionamento Offline-First**: Todas as operações podem ser realizadas sem conexão com a internet, com sincronização automática quando a conexão é restabelecida
- **Interface Responsiva**: Design adaptável para dispositivos móveis e desktop
- **Armazenamento Local**: Utiliza IndexedDB para persistência de dados no navegador
- **Sincronização Eficiente**: Sistema robusto de sincronização com processamento em lote
- **Relatórios Detalhados**: Exportação de dados em formatos CSV e PDF
- **Instalável como PWA**: Pode ser instalado como aplicativo no dispositivo

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, TailwindCSS, ShadCN UI
- **Backend**: Node.js, Express
- **Armazenamento**: IndexedDB (cliente), JSON (servidor)
- **Gerenciamento de Estado**: React Query
- **Sincronização**: Service Workers, API Fetch
- **Hospedagem**: Compatível com Replit

## Estrutura do Projeto

```
VehicleTracker/
├── client/                 # Código do frontend
│   ├── public/             # Arquivos públicos
│   └── src/                # Código fonte React
│       ├── components/     # Componentes reutilizáveis
│       ├── hooks/          # Hooks personalizados
│       ├── lib/            # Bibliotecas e utilitários
│       ├── pages/          # Páginas da aplicação
│       ├── services/       # Serviços (offline, sincronização)
│       └── styles/         # Estilos CSS
├── server/                 # Código do backend
│   ├── controllers/        # Controladores das rotas
│   ├── data/               # Armazenamento de dados JSON
│   ├── middleware/         # Middlewares Express
│   └── routes.ts           # Definição de rotas da API
└── shared/                 # Código compartilhado
    └── schema.ts           # Definições de tipos/interfaces
```

## Instalação e Execução

### Requisitos

- Node.js 16.x ou superior
- NPM 7.x ou superior

### Instalação Local

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd VehicleTracker
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse a aplicação em `http://localhost:5000`

### Implantação no Replit

1. Importe o arquivo ZIP no Replit
2. O Replit detectará automaticamente o projeto Node.js
3. Clique em "Run" para iniciar a aplicação
4. A aplicação estará disponível na URL fornecida pelo Replit

## Funcionalidades

### Gestão de Veículos

- Cadastro completo de veículos com informações detalhadas
- Histórico de operações por veículo
- Controle de status e disponibilidade

### Gestão de Motoristas

- Cadastro de motoristas com CNH e informações de contato
- Associação de motoristas a viagens e operações
- Histórico de atividades por motorista

### Registros de Operações

- Abastecimentos com controle de combustível e valor
- Manutenções preventivas e corretivas
- Viagens com controle de quilometragem e finalidade
- Checklists de inspeção veicular

### Relatórios e Análises

- Relatórios de consumo de combustível
- Relatórios de custos por veículo/período
- Exportação de dados em CSV e PDF
- Dashboard com indicadores de desempenho

### Configurações

- Personalização de tipos de combustível
- Configuração de tipos de manutenção
- Gerenciamento de usuários e permissões
- Configurações gerais do sistema

## Funcionamento Offline

O sistema utiliza uma abordagem offline-first, permitindo:

1. **Navegação Completa**: Todas as páginas são acessíveis sem conexão
2. **Operações Locais**: Todas as operações (criar, editar, excluir) funcionam offline
3. **Sincronização Automática**: Dados são sincronizados automaticamente quando a conexão é restabelecida
4. **Feedback Visual**: Indicadores claros do status de conexão e sincronização
5. **Sincronização Manual**: Opção para forçar sincronização quando necessário

### Como Funciona

- Quando online, os dados são enviados diretamente para o servidor e também armazenados localmente
- Quando offline, os dados são armazenados no IndexedDB do navegador
- Ao restabelecer a conexão, as operações pendentes são sincronizadas automaticamente
- O sistema gerencia conflitos e falhas durante a sincronização

## Gerenciamento de Usuários

O sistema suporta diferentes perfis de usuário:

- **Administrador**: Acesso completo a todas as funcionalidades
- **Gerente**: Acesso a registros, relatórios e configurações básicas
- **Usuário**: Acesso limitado a registros e consultas

## Manutenção e Suporte

### Backup de Dados

- O sistema armazena dados no servidor em arquivos JSON
- Recomenda-se fazer backup regular desses arquivos
- Os dados offline são armazenados no navegador do usuário

### Limpeza de Dados

- O sistema realiza limpeza automática de dados antigos no armazenamento local
- Dados de sincronização completados são removidos após um período
- O tamanho do banco de dados local é monitorado para evitar problemas de armazenamento

### Solução de Problemas

- **Problemas de Sincronização**: Use o botão "Forçar sincronização" no indicador de status
- **Dados Inconsistentes**: Limpe o cache do navegador e recarregue a aplicação
- **Erros de Aplicação**: Verifique o console do navegador para mensagens de erro detalhadas

## Melhorias Implementadas

- Modernização da interface com tema visual consistente
- Otimização de performance para grandes volumes de dados
- Melhorias no sistema de sincronização offline
- Feedback visual aprimorado para todas as operações
- Suporte a acessibilidade em todos os componentes
- Documentação detalhada de código e funcionalidades

## Próximos Passos Sugeridos

- Implementação de autenticação mais robusta (OAuth, JWT)
- Integração com APIs externas (postos de combustível, serviços de manutenção)
- Aplicativo móvel nativo para melhor experiência em dispositivos móveis
- Módulo de geolocalização para rastreamento de veículos
- Dashboards avançados com visualizações gráficas
- Notificações push para alertas e lembretes

## Licença

Este software é proprietário e seu uso está sujeito aos termos acordados com o desenvolvedor.
