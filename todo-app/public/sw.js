const CACHE_NAME = 'study-planner-v3'
const STATIC_CACHE = 'study-planner-static-v3'
const DYNAMIC_CACHE = 'study-planner-dynamic-v3'

// Check if we're in development mode
const isDev =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'

// Files to cache immediately (only in production)
const STATIC_FILES = ['/', '/index.html', '/manifest.json']

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')

  // In development, skip caching and activate immediately
  if (isDev) {
    console.log('Service Worker: Development mode - skipping cache')
    return self.skipWaiting()
  }

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // In development, delete ALL caches
            if (
              isDev ||
              (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
            ) {
              console.log('Service Worker: Deleting cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external API calls
  if (url.origin !== location.origin) {
    return
  }

  // In development, ALWAYS go to network (no caching)
  if (isDev) {
    return
  }

  // Skip caching for Vite/development files
  if (
    url.pathname.includes('node_modules') ||
    url.pathname.includes('.vite') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('@react-refresh') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts')
  ) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Service Worker: Serving from cache', request.url)
        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Don't cache if not a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse
          }

          // Clone the response
          const responseToCache = networkResponse.clone()

          // Cache dynamic content
          caches.open(DYNAMIC_CACHE).then((cache) => {
            console.log('Service Worker: Caching dynamic content', request.url)
            cache.put(request, responseToCache)
          })

          return networkResponse
        })
        .catch((error) => {
          console.log('Service Worker: Network request failed', error)

          // Return offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/index.html')
          }

          // Return a generic offline response for other requests
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          })
        })
    })
  )
})

// Background sync for offline task creation
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)

  if (event.tag === 'background-sync-tasks') {
    event.waitUntil(syncTasks())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')

  const options = {
    body: event.data
      ? event.data.text()
      : 'New notification from Study Planner',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  }

  event.waitUntil(self.registration.showNotification('Study Planner', options))
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action)

  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'))
  }
})

// Helper function to sync tasks when back online
async function syncTasks() {
  try {
    // Get pending tasks from IndexedDB or localStorage
    const pendingTasks = await getPendingTasks()

    if (pendingTasks.length > 0) {
      console.log('Service Worker: Syncing pending tasks', pendingTasks.length)

      // Here you would sync with your backend API
      // For now, we'll just log the tasks
      pendingTasks.forEach((task) => {
        console.log('Service Worker: Syncing task', task)
      })

      // Clear pending tasks after successful sync
      await clearPendingTasks()
    }
  } catch (error) {
    console.error('Service Worker: Error syncing tasks', error)
  }
}

// Helper functions for offline task management
async function getPendingTasks() {
  // In a real app, you'd get these from IndexedDB
  return []
}

async function clearPendingTasks() {
  // In a real app, you'd clear IndexedDB
  console.log('Service Worker: Pending tasks cleared')
}
