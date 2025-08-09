# Guia de Implementação PWA - LA Music Week

## 1. Visão Geral

Este documento fornece instruções completas para transformar o aplicativo LA Music Week em um Progressive Web App (PWA) totalmente funcional, com foco em responsividade móvel, instalação amigável e compatibilidade multiplataforma.

## 2. Configuração do Manifest.json

### 2.1 Criação do Arquivo Manifest

Crie o arquivo `public/manifest.json` com a seguinte configuração:

```json
{
  "name": "LA Music Week",
  "short_name": "LA Music",
  "description": "Plataforma oficial para inscrições e informações sobre a LA Music Week",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#16213e",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "pt-BR",
  "categories": ["music", "education", "entertainment"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Página inicial no mobile"
    },
    {
      "src": "/screenshots/desktop-home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Página inicial no desktop"
    }
  ]
}
```

### 2.2 Geração de Ícones

Utilize a logo `logos/Logo Kids e LA.png` para gerar os ícones nos seguintes tamanhos:

- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px
- 384x384px
- 512x512px

**Ferramentas recomendadas:**
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Adobe Photoshop ou GIMP para edição manual

**Comando para gerar ícones automaticamente:**
```bash
npx pwa-asset-generator logos/"Logo Kids e LA.png" public/icons --manifest public/manifest.json
```

## 3. Configuração do Service Worker

### 3.1 Instalação do Vite PWA Plugin

```bash
npm install vite-plugin-pwa workbox-window -D
```

### 3.2 Configuração do Vite

Atualize o arquivo `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'
import { traeSoloBadge } from 'vite-plugin-trae-solo-badge'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    traeSoloBadge(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'LA Music Week',
        short_name: 'LA Music',
        description: 'Plataforma oficial para inscrições e informações sobre a LA Music Week',
        theme_color: '#16213e',
        background_color: '#1a1a2e',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}?${Date.now()}`
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})
```

### 3.3 Configuração do Service Worker no App

Crie o arquivo `src/hooks/usePWA.ts`:

```typescript
import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    }
  })

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detectar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)
    setIsInstalled(standalone)

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao instalar o app:', error)
      return false
    }
  }

  const updateApp = () => {
    updateServiceWorker(true)
  }

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    needRefresh,
    installApp,
    updateApp,
    closeRefreshPrompt: () => setNeedRefresh(false)
  }
}
```

## 4. Componente de Instalação PWA

### 4.1 Componente InstallPrompt

Crie o arquivo `src/components/InstallPrompt.tsx`:

```tsx
import React, { useState } from 'react'
import { usePWA } from '../hooks/usePWA'
import { X, Download, Smartphone, Share } from 'lucide-react'

const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA()
  const [showPrompt, setShowPrompt] = useState(true)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  if (isInstalled || !showPrompt) return null

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    const success = await installApp()
    if (success) {
      setShowPrompt(false)
    }
  }

  const IOSInstructions = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Instalar LA Music Week</h3>
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <div className="flex items-center space-x-2">
              <Share size={16} className="text-blue-600" />
              <span className="text-sm">Toque no ícone de compartilhar</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">2</span>
            </div>
            <div className="flex items-center space-x-2">
              <Smartphone size={16} className="text-blue-600" />
              <span className="text-sm">Selecione "Adicionar à Tela de Início"</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">3</span>
            </div>
            <span className="text-sm">Toque em "Adicionar" para confirmar</span>
          </div>
        </div>
        
        <button
          onClick={() => setShowIOSInstructions(false)}
          className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  )

  return (
    <>
      {showIOSInstructions && <IOSInstructions />}
      
      {(isInstallable || isIOS) && (
        <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg z-40 md:left-auto md:right-4 md:max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Download size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Instalar App</h4>
                <p className="text-xs opacity-90">Acesso rápido e offline</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleInstall}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InstallPrompt
```

### 4.2 Componente UpdatePrompt

Crie o arquivo `src/components/UpdatePrompt.tsx`:

```tsx
import React from 'react'
import { usePWA } from '../hooks/usePWA'
import { RefreshCw, X } from 'lucide-react'

const UpdatePrompt: React.FC = () => {
  const { needRefresh, updateApp, closeRefreshPrompt } = usePWA()

  if (!needRefresh) return null

  return (
    <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <RefreshCw size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Atualização Disponível</h4>
            <p className="text-xs opacity-90">Nova versão do app</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={updateApp}
            className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Atualizar
          </button>
          <button
            onClick={closeRefreshPrompt}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdatePrompt
```

## 5. Responsividade Móvel

### 5.1 Configuração do Tailwind CSS

Atualize o arquivo `tailwind.config.js` para incluir breakpoints móveis:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    },
  },
  plugins: [],
}
```

### 5.2 CSS Global para PWA

Atualize o arquivo `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* PWA Styles */
@layer base {
  html {
    /* Previne zoom em inputs no iOS */
    -webkit-text-size-adjust: 100%;
    /* Suporte para safe areas */
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }

  body {
    /* Previne scroll bounce no iOS */
    overscroll-behavior: none;
    /* Melhora a performance de scroll */
    -webkit-overflow-scrolling: touch;
  }

  /* Previne zoom em inputs */
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="tel"],
  input[type="url"],
  input[type="search"],
  textarea,
  select {
    font-size: 16px;
  }

  /* Melhora a aparência de botões no iOS */
  button {
    -webkit-appearance: none;
    appearance: none;
  }

  /* Remove highlight azul no toque (Android) */
  * {
    -webkit-tap-highlight-color: transparent;
  }
}

/* Componentes PWA */
@layer components {
  .pwa-container {
    @apply min-h-screen bg-gray-50;
  }

  .pwa-header {
    @apply sticky top-0 z-40 bg-white shadow-sm;
    padding-top: env(safe-area-inset-top);
  }

  .pwa-content {
    @apply flex-1 overflow-auto;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .pwa-button {
    @apply min-h-[44px] px-4 py-2 rounded-lg font-medium transition-colors;
    /* Tamanho mínimo recomendado para toque */
  }

  .pwa-input {
    @apply min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg;
    /* Previne zoom no iOS */
    font-size: 16px;
  }
}

/* Utilities PWA */
@layer utilities {
  .touch-manipulation {
    touch-action: manipulation;
  }

  .safe-area-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .safe-area-left {
    padding-left: env(safe-area-inset-left);
  }

  .safe-area-right {
    padding-right: env(safe-area-inset-right);
  }

  .safe-area-inset {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}

/* Media Queries para PWA */
@media (display-mode: standalone) {
  /* Estilos específicos quando o app está instalado */
  .pwa-only {
    display: block;
  }
  
  .browser-only {
    display: none;
  }
}

@media not (display-mode: standalone) {
  /* Estilos específicos quando o app está no browser */
  .pwa-only {
    display: none;
  }
  
  .browser-only {
    display: block;
  }
}

/* Animações otimizadas para mobile */
@media (prefers-reduced-motion: no-preference) {
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## 6. Atualização do HTML Principal

### 6.1 Configuração do index.html

Atualize o arquivo `index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#16213e" />
    <meta name="background-color" content="#1a1a2e" />
    <meta name="description" content="Plataforma oficial para inscrições e informações sobre a LA Music Week" />
    <meta name="keywords" content="música, educação, workshops, LA Music Week" />
    
    <!-- iOS Meta Tags -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="LA Music Week" />
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
    
    <!-- Android Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="LA Music Week" />
    
    <!-- Windows Meta Tags -->
    <meta name="msapplication-TileColor" content="#16213e" />
    <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" href="/icons/icon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="/icons/icon-16x16.png" sizes="16x16" />
    
    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Preload Critical Resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    
    <title>LA Music Week</title>
    
    <!-- Prevent FOUC -->
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #1a1a2e;
      }
      
      #root {
        min-height: 100vh;
        min-height: 100dvh;
      }
      
      /* Loading spinner */
      .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #1a1a2e;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #16213e;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <!-- Loading fallback -->
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
    </div>
    
    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
              console.log('SW registration failed: ', registrationError);
            });
        });
      }
    </script>
    
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 7. Integração no App Principal

### 7.1 Atualização do App.tsx

Atualize o arquivo `src/app.tsx` para incluir os componentes PWA:

```tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

// Componentes PWA
import InstallPrompt from './components/InstallPrompt'
import UpdatePrompt from './components/UpdatePrompt'

// Páginas existentes
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/admin/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="pwa-container">
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requireAdmin>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              {/* Outras rotas */}
            </Routes>
          </div>
        </Router>
        
        {/* Componentes PWA */}
        <InstallPrompt />
        <UpdatePrompt />
        
        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </div>
  )
}

export default App
```

## 8. Otimizações de Performance

### 8.1 Lazy Loading de Componentes

Crie o arquivo `src/utils/lazyLoad.ts`:

```typescript
import { lazy, ComponentType } from 'react'

// Função para lazy loading com retry
export const lazyLoad = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3
): T => {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (retriesLeft: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error)
            } else {
              setTimeout(() => attemptImport(retriesLeft - 1), 1000)
            }
          })
      }
      attemptImport(retries)
    })
  })
}

// Componente de loading
export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)
```

### 8.2 Otimização de Imagens

Crie o arquivo `src/components/OptimizedImage.tsx`:

```tsx
import React, { useState, useCallback } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  sizes?: string
  loading?: 'lazy' | 'eager'
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
  sizes,
  loading = 'lazy'
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Erro ao carregar imagem</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
      )}
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}

export default OptimizedImage
```

## 9. Configurações Específicas por Plataforma

### 9.1 Configuração para iOS Safari

Crie o arquivo `src/utils/iosConfig.ts`:

```typescript
// Configurações específicas para iOS
export const configureIOSPWA = () => {
  // Previne zoom em inputs
  const preventZoom = () => {
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      )
    }
  }

  // Configura status bar
  const configureStatusBar = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      document.documentElement.style.setProperty('--status-bar-height', '44px')
    }
  }

  // Previne scroll bounce
  const preventScrollBounce = () => {
    document.body.style.overscrollBehavior = 'none'
  }

  // Detecta se é iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  if (isIOS) {
    preventZoom()
    configureStatusBar()
    preventScrollBounce()
  }
}
```

### 9.2 Configuração para Android Chrome

Crie o arquivo `src/utils/androidConfig.ts`:

```typescript
// Configurações específicas para Android
export const configureAndroidPWA = () => {
  // Configura theme color dinâmico
  const setThemeColor = (color: string) => {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta')
      themeColorMeta.setAttribute('name', 'theme-color')
      document.head.appendChild(themeColorMeta)
    }
    themeColorMeta.setAttribute('content', color)
  }

  // Configura navigation bar
  const configureNavigationBar = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      setThemeColor('#16213e')
    }
  }

  // Detecta se é Android
  const isAndroid = /Android/.test(navigator.userAgent)
  
  if (isAndroid) {
    configureNavigationBar()
  }
}
```

## 10. Scripts de Build e Deploy

### 10.1 Atualização do package.json

Adicione os seguintes scripts ao `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:pwa": "tsc && vite build --mode production",
    "preview": "vite preview",
    "preview:pwa": "vite preview --host",
    "generate-icons": "npx pwa-asset-generator logos/\"Logo Kids e LA.png\" public/icons --manifest public/manifest.json",
    "test:pwa": "npx lighthouse http://localhost:4173 --view",
    "analyze": "npx vite-bundle-analyzer"
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.17.0",
    "workbox-window": "^7.0.0"
  }
}
```

### 10.2 Script de Geração de Ícones

Crie o arquivo `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]
const inputFile = path.join(__dirname, '../logos/Logo Kids e LA.png')
const outputDir = path.join(__dirname, '../public/icons')

// Criar diretório se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Gerar ícones
sizes.forEach(size => {
  sharp(inputFile)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 26, g: 26, b: 46, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .then(() => {
      console.log(`✅ Ícone ${size}x${size} gerado com sucesso`)
    })
    .catch(err => {
      console.error(`❌ Erro ao gerar ícone ${size}x${size}:`, err)
    })
})

console.log('🚀 Iniciando geração de ícones PWA...')
```

## 11. Testes e Validação

### 11.1 Checklist de Validação PWA

- [ ] Manifest.json válido e acessível
- [ ] Service Worker registrado e funcionando
- [ ] Ícones em todos os tamanhos necessários
- [ ] Responsividade em dispositivos móveis
- [ ] Prompt de instalação funcionando
- [ ] Funcionalidade offline básica
- [ ] Performance otimizada (Lighthouse > 90)
- [ ] Acessibilidade adequada
- [ ] SEO otimizado

### 11.2 Comandos de Teste

```bash
# Testar PWA localmente
npm run build:pwa
npm run preview:pwa

# Executar Lighthouse
npm run test:pwa

# Gerar ícones
npm run generate-icons

# Analisar bundle
npm run analyze
```

### 11.3 URLs de Teste

- **Local**: http://localhost:4173
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **PWA Builder**: https://www.pwabuilder.com/
- **Manifest Validator**: https://manifest-validator.appspot.com/

## 12. Deploy e Configuração de Servidor

### 12.1 Configuração Vercel

Crie/atualize o arquivo `vercel.json`:

```json
{
  "buildCommand": "npm run build:pwa",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 13. Monitoramento e Analytics

### 13.1 Configuração de Analytics PWA

Crie o arquivo `src/utils/analytics.ts`:

```typescript
// Analytics para PWA
export const trackPWAInstall = () => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_install', {
      event_category: 'PWA',
      event_label: 'App Installed'
    })
  }
}

export const trackPWAUsage = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_usage', {
      event_category: 'PWA',
      event_label: isStandalone ? 'Standalone Mode' : 'Browser Mode'
    })
  }
}

export const trackOfflineUsage = () => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'offline_usage', {
      event_category: 'PWA',
      event_label: 'Offline Mode'
    })
  }
}
```

## 14. Conclusão

Este guia fornece uma implementação completa de PWA para o aplicativo LA Music Week, incluindo:

✅ **Manifest.json otimizado** com ícones em múltiplos tamanhos
✅ **Service Worker** com cache inteligente
✅ **Responsividade total** para dispositivos móveis
✅ **Prompt de instalação** amigável para Android e iOS
✅ **Configurações específicas** para Chrome e Safari
✅ **Otimizações de performance** e UX
✅ **Scripts de build e deploy** automatizados
✅ **Testes e validação** completos

### Próximos Passos:

1. Instalar as dependências necessárias
2. Gerar os ícones PWA a partir da logo
3. Implementar os componentes PWA
4. Testar em dispositivos móveis
5. Fazer deploy e validar com Lighthouse
6. Monitorar métricas de instalação e uso

O resultado será um PWA robusto, visualmente atraente e com excelente usabilidade em qualquer dispositivo móvel.