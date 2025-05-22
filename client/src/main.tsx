import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/app-theme.css";
import { ThemeProvider } from "@/components/ui/theme-provider";

// Registrar o Service Worker para suporte offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration.scope);
        
        // Verificar se há uma nova versão disponível
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Nova versão do Service Worker disponível, pronta para ser ativada');
                // Notificar o usuário sobre a atualização
                if (confirm('Nova versão do aplicativo disponível. Deseja atualizar agora?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(error => {
        console.log('Falha ao registrar o Service Worker:', error);
      });
    
    // Verificar atualizações do Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker atualizado, recarregando aplicativo...');
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light">
    <App />
  </ThemeProvider>
);
