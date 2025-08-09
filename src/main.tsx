import { createRoot } from "react-dom/client";
import App from "./app";
import "./index.css";
import './styles/responsive.css'
import { registerSW } from 'virtual:pwa-register'

createRoot(document.getElementById("root")!).render(
  <App />
);

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível. Recarregar para atualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App pronto para uso offline');
  },
});
