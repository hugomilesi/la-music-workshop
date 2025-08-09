const CACHE_NAME = 'la-music-week-v2';
const STATIC_CACHE_NAME = 'la-music-week-static-v2';
const DYNAMIC_CACHE_NAME = 'la-music-week-dynamic-v2';

// Assets para cache estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/assets/Logo Kids e LA.png',
  '/assets/lamusic.png',
  '/assets/lamusic_kids.png',
  // Adicionar outros assets estáticos conforme necessário
];

// URLs da API para cache dinâmico
const API_URLS = [
  '/api/',
  'https://xfqgcfeoswlkcgdtikco.supabase.co/rest/v1/'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache estático aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Assets estáticos em cache');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Erro ao cachear assets estáticos:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Remover caches antigos
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Ativado');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estratégia Cache First para assets estáticos
  if (STATIC_ASSETS.some(asset => request.url.includes(asset)) || 
      request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script') {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // Verificar se a resposta é válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clonar a resposta
              const responseToCache = response.clone();
              
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Fallback para offline
              if (request.destination === 'document') {
                return caches.match('/index.html');
              }
            });
        })
    );
    return;
  }
  
  // Estratégia Network First para APIs
  if (API_URLS.some(apiUrl => request.url.includes(apiUrl))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Verificar se a resposta é válida
          if (!response || response.status !== 200) {
            throw new Error('Resposta inválida da rede');
          }
          
          // Clonar a resposta para cache
          const responseToCache = response.clone();
          
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // Fallback para cache se offline
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Resposta offline padrão para APIs
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'Você está offline. Alguns dados podem estar desatualizados.' 
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'application/json'
                  })
                }
              );
            });
        })
    );
    return;
  }
  
  // Estratégia padrão: Network First com fallback para cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Verificar se a resposta é válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clonar a resposta
        const responseToCache = response.clone();
        
        caches.open(DYNAMIC_CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Fallback para cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Fallback final para página offline
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Evento de sincronização:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Implementar lógica de sincronização aqui
      console.log('Service Worker: Executando sincronização em background')
    );
  }
});

// Notificações push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Notificação push recebida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do LA Music Week',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('LA Music Week', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Clique em notificação:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Atualização do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});