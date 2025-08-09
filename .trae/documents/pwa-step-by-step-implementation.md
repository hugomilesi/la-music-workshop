# Implementação Passo a Passo - PWA LA Music Week

## Passo 1: Instalação de Dependências

### 1.1 Instalar Dependências PWA

```bash
# Instalar dependências PWA
npm install vite-plugin-pwa workbox-window -D

# Instalar dependências para geração de ícones (opcional)
npm install sharp pwa-asset-generator -D
```

### 1.2 Verificar package.json

Adicione os seguintes scripts ao `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:pwa": "tsc && vite build --mode production",
    "preview": "vite preview",
    "preview:pwa": "vite preview --host",
    "generate-icons": "node scripts/generate-icons.js",
    "test:pwa": "npx lighthouse http://localhost:4173 --view --only-categories=pwa",
    "analyze": "npx vite-bundle-analyzer"
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.17.0",
    "workbox-window": "^7.0.0",
    "sharp": "^0.32.0",
    "pwa-asset-generator": "^6.3.0"
  }
}
```

## Passo 2: Configuração do Vite

### 2.1 Atualizar vite.config.ts

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
        orientation: 'portrait-primary',
        categories: ['music', 'education', 'entertainment'],
        lang: 'pt-BR',
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
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
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          router: ['react-router-dom']
        }
      }
    }
  }
})
```

## Passo 3: Geração de Ícones PWA

### 3.1 Criar Script de Geração de Ícones

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

console.log('🚀 Iniciando geração de ícones PWA...')
console.log(`📁 Arquivo de entrada: ${inputFile}`)
console.log(`📁 Diretório de saída: ${outputDir}`)

// Verificar se o arquivo de entrada existe
if (!fs.existsSync(inputFile)) {
  console.error('❌ Arquivo de logo não encontrado:', inputFile)
  process.exit(1)
}

// Gerar ícones
const promises = sizes.map(size => {
  const outputFile = path.join(outputDir, `icon-${size}x${size}.png`)
  
  return sharp(inputFile)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 26, g: 26, b: 46, alpha: 1 } // Cor de fundo do tema
    })
    .png({
      quality: 90,
      compressionLevel: 9
    })
    .toFile(outputFile)
    .then(() => {
      console.log(`✅ Ícone ${size}x${size} gerado com sucesso`)
    })
    .catch(err => {
      console.error(`❌ Erro ao gerar ícone ${size}x${size}:`, err)
    })
})

// Gerar favicon adicional
const faviconPromise = sharp(inputFile)
  .resize(32, 32)
  .png()
  .toFile(path.join(outputDir, 'favicon-32x32.png'))
  .then(() => {
    console.log('✅ Favicon 32x32 gerado com sucesso')
  })
  .catch(err => {
    console.error('❌ Erro ao gerar favicon:', err)
  })

// Aguardar todas as operações
Promise.all([...promises, faviconPromise])
  .then(() => {
    console.log('🎉 Todos os ícones PWA foram gerados com sucesso!')
    console.log(`📊 Total de ícones gerados: ${sizes.length + 1}`)
  })
  .catch(err => {
    console.error('❌ Erro durante a geração de ícones:', err)
    process.exit(1)
  })
```

### 3.2 Executar Geração de Ícones

```bash
# Gerar ícones PWA
npm run generate-icons
```

## Passo 4: Criar Hook PWA

### 4.1 Criar src/hooks/usePWA.ts

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
  const [installSource, setInstallSource] = useState<string>('')

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registrado:', r)
    },
    onRegisterError(error) {
      console.error('❌ Erro no registro do Service Worker:', error)
    },
    onOfflineReady() {
      console.log('📱 App pronto para uso offline')
    }
  })

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detectar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true
    setIsStandalone(standalone)
    setIsInstalled(standalone)

    // Detectar fonte de instalação
    const urlParams = new URLSearchParams(window.location.search)
    const source = urlParams.get('utm_source') || 'direct'
    setInstallSource(source)

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📱 Prompt de instalação disponível')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      console.log('🎉 App instalado com sucesso')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      
      // Analytics de instalação
      if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: installSource
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [installSource])

  const installApp = async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ Prompt de instalação não disponível')
      return false
    }

    try {
      console.log('📱 Iniciando instalação do app')
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log('📊 Resultado da instalação:', outcome)
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('❌ Erro ao instalar o app:', error)
      return false
    }
  }

  const updateApp = () => {
    console.log('🔄 Atualizando app')
    updateServiceWorker(true)
  }

  const trackPWAUsage = () => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_usage', {
        event_category: 'PWA',
        event_label: isStandalone ? 'Standalone Mode' : 'Browser Mode'
      })
    }
  }

  // Executar tracking de uso
  useEffect(() => {
    trackPWAUsage()
  }, [isStandalone])

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    needRefresh,
    installApp,
    updateApp,
    closeRefreshPrompt: () => setNeedRefresh(false),
    trackPWAUsage
  }
}
```

## Passo 5: Componente de Instalação

### 5.1 Criar src/components/InstallPrompt.tsx

```tsx
import React, { useState, useEffect } from 'react'
import { usePWA } from '../hooks/usePWA'
import { X, Download, Smartphone, Share, Plus } from 'lucide-react'

const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false)

  // Mostrar prompt após um delay para não ser intrusivo
  useEffect(() => {
    if ((isInstallable || isIOS) && !isInstalled && !hasBeenDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // Mostrar após 3 segundos

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isIOS, isInstalled, hasBeenDismissed])

  // Verificar se já foi dispensado anteriormente
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedDate = new Date(dismissed)
      const now = new Date()
      const daysDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 3600 * 24)
      
      // Mostrar novamente após 7 dias
      if (daysDiff < 7) {
        setHasBeenDismissed(true)
      }
    }
  }, [])

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

  const handleDismiss = () => {
    setShowPrompt(false)
    setHasBeenDismissed(true)
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString())
  }

  const IOSInstructions = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Instalar LA Music Week</h3>
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Share size={18} className="text-blue-600" />
                <span className="font-medium text-gray-900">Toque no ícone de compartilhar</span>
              </div>
              <p className="text-sm text-gray-600">Na barra inferior do Safari</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Plus size={18} className="text-blue-600" />
                <span className="font-medium text-gray-900">"Adicionar à Tela de Início"</span>
              </div>
              <p className="text-sm text-gray-600">Role para baixo e encontre esta opção</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Smartphone size={18} className="text-blue-600" />
                <span className="font-medium text-gray-900">Confirme a instalação</span>
              </div>
              <p className="text-sm text-gray-600">Toque em "Adicionar" no canto superior direito</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> Após instalar, você poderá acessar o app diretamente da sua tela inicial!
          </p>
        </div>
        
        <button
          onClick={() => setShowIOSInstructions(false)}
          className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Entendi
        </button>
      </div>
    </div>
  )

  if (isInstalled || !showPrompt) return null

  return (
    <>
      {showIOSInstructions && <IOSInstructions />}
      
      {(isInstallable || isIOS) && (
        <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl shadow-2xl z-40 md:left-auto md:right-4 md:max-w-sm animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Download size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Instalar App</h4>
                <p className="text-sm opacity-90">Acesso rápido e funciona offline</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleInstall}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors touch-manipulation"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="text-white hover:text-gray-200 transition-colors p-2 touch-manipulation"
              >
                <X size={20} />
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

### 5.2 Criar src/components/UpdatePrompt.tsx

```tsx
import React from 'react'
import { usePWA } from '../hooks/usePWA'
import { RefreshCw, X, Zap } from 'lucide-react'

const UpdatePrompt: React.FC = () => {
  const { needRefresh, updateApp, closeRefreshPrompt } = usePWA()

  if (!needRefresh) return null

  return (
    <div className="fixed top-4 left-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl shadow-2xl z-50 md:left-auto md:right-4 md:max-w-sm animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-lg">Nova Versão!</h4>
            <p className="text-sm opacity-90">Melhorias e correções disponíveis</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={updateApp}
            className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors touch-manipulation flex items-center space-x-1"
          >
            <RefreshCw size={16} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={closeRefreshPrompt}
            className="text-white hover:text-gray-200 transition-colors p-2 touch-manipulation"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdatePrompt
```

## Passo 6: Atualizar CSS para PWA

### 6.1 Atualizar src/index.css

Adicione as seguintes classes PWA ao final do arquivo:

```css
/* PWA Styles - Adicionar ao final do index.css */

/* Suporte para safe areas */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
  --safe-area-inset-right: env(safe-area-inset-right);
}

/* Previne zoom em inputs no iOS */
input[type="text"],
input[type="email"],
input[type="password"],
input[type="tel"],
input[type="url"],
input[type="search"],
input[type="date"],
textarea,
select {
  font-size: 16px !important;
}

/* Melhora a performance de scroll */
body {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: none;
}

/* Remove highlight azul no toque */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Melhora a aparência de botões */
button {
  -webkit-appearance: none;
  appearance: none;
}

/* Classes utilitárias PWA */
.touch-manipulation {
  touch-action: manipulation;
}

.safe-area-top {
  padding-top: var(--safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: var(--safe-area-inset-bottom);
}

.safe-area-left {
  padding-left: var(--safe-area-inset-left);
}

.safe-area-right {
  padding-right: var(--safe-area-inset-right);
}

.safe-area-inset {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
  padding-right: var(--safe-area-inset-right);
}

/* Animações PWA */
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
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

/* Estilos específicos para PWA instalado */
@media (display-mode: standalone) {
  .pwa-only {
    display: block !important;
  }
  
  .browser-only {
    display: none !important;
  }
  
  /* Ajustar para status bar no iOS */
  .pwa-header {
    padding-top: var(--safe-area-inset-top);
  }
}

@media not (display-mode: standalone) {
  .pwa-only {
    display: none !important;
  }
  
  .browser-only {
    display: block !important;
  }
}

/* Otimizações para dispositivos móveis */
@media (max-width: 768px) {
  /* Aumentar área de toque em botões pequenos */
  .mobile-touch {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Melhorar legibilidade em telas pequenas */
  .mobile-text {
    font-size: 16px;
    line-height: 1.5;
  }
  
  /* Espaçamento adequado para toque */
  .mobile-spacing {
    margin: 8px;
    padding: 12px;
  }
}

/* Modo escuro para PWA */
@media (prefers-color-scheme: dark) {
  .pwa-dark {
    background-color: #1a1a2e;
    color: #ffffff;
  }
}

/* Reduzir animações se preferido */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-up {
    animation: none;
  }
}
```

## Passo 7: Atualizar HTML Principal

### 7.1 Atualizar index.html

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
    
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#16213e" />
    <meta name="background-color" content="#1a1a2e" />
    <meta name="description" content="Plataforma oficial para inscrições e informações sobre a LA Music Week. Workshops de música, produção e performance." />
    <meta name="keywords" content="música, educação, workshops, LA Music Week, produção musical, performance" />
    <meta name="author" content="LA Music Week" />
    
    <!-- iOS Meta Tags -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="LA Music Week" />
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
    
    <!-- Android Meta Tags -->
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="LA Music Week" />
    
    <!-- Windows Meta Tags -->
    <meta name="msapplication-TileColor" content="#16213e" />
    <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
    <meta name="msapplication-config" content="/browserconfig.xml" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" href="/icons/icon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="/icons/icon-16x16.png" sizes="16x16" />
    
    <!-- Manifest -->
    <link rel="manifest" href="/manifest.json" />
    
    <!-- Preload Critical Resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://xfqgcfeoswlkcgdtikco.supabase.co" />
    
    <!-- SEO -->
    <meta property="og:title" content="LA Music Week - Workshops de Música" />
    <meta property="og:description" content="Plataforma oficial para inscrições em workshops de música, produção e performance." />
    <meta property="og:image" content="/icons/icon-512x512.png" />
    <meta property="og:url" content="https://la-music-week.vercel.app" />
    <meta property="og:type" content="website" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="LA Music Week" />
    <meta name="twitter:description" content="Workshops de música, produção e performance" />
    <meta name="twitter:image" content="/icons/icon-512x512.png" />
    
    <title>LA Music Week - Workshops de Música</title>
    
    <!-- Prevent FOUC -->
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #1a1a2e;
        color: #ffffff;
      }
      
      #root {
        min-height: 100vh;
        min-height: 100dvh;
      }
      
      /* Loading spinner */
      .loading-spinner {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #1a1a2e;
        color: #ffffff;
      }
      
      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-top: 4px solid #16213e;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }
      
      .loading-text {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.8);
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
        <div class="loading-text">Carregando LA Music Week...</div>
      </div>
    </div>
    
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Passo 8: Integrar PWA no App Principal

### 8.1 Atualizar src/app.tsx

```tsx
import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

// Componentes PWA
import InstallPrompt from './components/InstallPrompt'
import UpdatePrompt from './components/UpdatePrompt'

// Lazy loading de páginas
const Home = React.lazy(() => import('./pages/Home'))
const Login = React.lazy(() => import('./pages/Login'))
const Register = React.lazy(() => import('./pages/Register'))
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'))
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'))

// Componente de loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
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
              {/* Adicione outras rotas aqui */}
            </Routes>
          </Suspense>
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
              fontSize: '14px',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </AuthProvider>
    </div>
  )
}

export default App
```

## Passo 9: Configurar Deploy

### 9.1 Atualizar vercel.json

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
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    },
    {
      "source": "/icons/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
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
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
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

## Passo 10: Testes e Validação

### 10.1 Comandos de Teste

```bash
# 1. Gerar ícones PWA
npm run generate-icons

# 2. Build para produção
npm run build:pwa

# 3. Preview local
npm run preview:pwa

# 4. Teste PWA com Lighthouse
npm run test:pwa

# 5. Analisar bundle
npm run analyze
```

### 10.2 Checklist de Validação

- [ ] ✅ Ícones PWA gerados em todos os tamanhos
- [ ] ✅ Manifest.json válido e acessível
- [ ] ✅ Service Worker registrado
- [ ] ✅ Prompt de instalação funcionando
- [ ] ✅ Componente de atualização funcionando
- [ ] ✅ Responsividade em dispositivos móveis
- [ ] ✅ Funcionalidade offline básica
- [ ] ✅ Performance Lighthouse > 90
- [ ] ✅ PWA Score Lighthouse > 90
- [ ] ✅ Acessibilidade > 90
- [ ] ✅ SEO > 90

### 10.3 Teste em Dispositivos

**Android Chrome:**
1. Abrir o app no Chrome
2. Verificar se aparece o prompt de instalação
3. Instalar e testar funcionalidade standalone
4. Verificar atualizações automáticas

**iOS Safari:**
1. Abrir o app no Safari
2. Verificar se aparece as instruções de instalação
3. Seguir instruções para adicionar à tela inicial
4. Testar funcionalidade standalone

**Desktop:**
1. Testar no Chrome, Edge, Firefox
2. Verificar prompt de instalação
3. Testar funcionalidade offline
4. Verificar responsividade

## Passo 11: Deploy e Monitoramento

### 11.1 Deploy para Vercel

```bash
# Deploy para produção
vercel --prod

# Ou se já configurado
git push origin main
```

### 11.2 Validação Pós-Deploy

1. **Teste de Manifest:**
   - Acesse: `https://seu-dominio.com/manifest.json`
   - Valide em: https://manifest-validator.appspot.com/

2. **Teste de Service Worker:**
   - Abra DevTools → Application → Service Workers
   - Verifique se está registrado e ativo

3. **Teste de PWA:**
   - Execute Lighthouse no site em produção
   - Verifique score PWA > 90

4. **Teste de Instalação:**
   - Teste em diferentes dispositivos
   - Verifique prompts de instalação
   - Confirme funcionalidade standalone

### 11.3 Monitoramento Contínuo

```javascript
// Adicionar ao Google Analytics (opcional)
gtag('config', 'GA_MEASUREMENT_ID', {
  custom_map: {
    'custom_parameter_1': 'pwa_mode'
  }
})

// Track PWA usage
if (window.matchMedia('(display-mode: standalone)').matches) {
  gtag('event', 'pwa_usage', {
    event_category: 'PWA',
    event_label: 'Standalone Mode'
  })
}
```

## Conclusão

Após seguir todos esses passos, você terá:

✅ **PWA totalmente funcional** com instalação e atualizações automáticas
✅ **Responsividade completa** para todos os dispositivos
✅ **Compatibilidade multiplataforma** (Android, iOS, Desktop)
✅ **Performance otimizada** com cache inteligente
✅ **Experiência offline** básica
✅ **Prompts de instalação** amigáveis
✅ **Monitoramento e analytics** configurados

**Próximos passos recomendados:**
1. Testar em dispositivos reais
2. Coletar feedback dos usuários
3. Monitorar métricas de instalação
4. Implementar funcionalidades offline avançadas
5. Adicionar push notifications (se necessário)

O LA Music Week agora é um PWA completo e profissional! 🎉