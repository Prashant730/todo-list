import { useState, useEffect } from 'react'

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches
      const isInWebAppiOS = window.navigator.standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    checkInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: Install prompt available')
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA: App installed')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('PWA: Back online')
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log('PWA: Gone offline')
      setIsOnline(false)
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Register service worker only in production
    if ('serviceWorker' in navigator) {
      const isDev =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'

      if (isDev) {
        // In development, unregister any existing service workers to prevent caching issues
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister()
            console.log('PWA: Service Worker unregistered (development mode)')
          })
        })
        // Clear all caches in development
        caches.keys().then((names) => {
          names.forEach((name) => {
            caches.delete(name)
            console.log('PWA: Cache cleared (development mode):', name)
          })
        })
      } else {
        // In production, register the service worker
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA: Service Worker registered', registration)
          })
          .catch((error) => {
            console.error('PWA: Service Worker registration failed', error)
          })
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('PWA: No install prompt available')
      return false
    }

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      console.log('PWA: Install prompt result', outcome)

      if (outcome === 'accepted') {
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }

      return false
    } catch (error) {
      console.error('PWA: Install prompt error', error)
      return false
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('PWA: Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('PWA: Notifications denied')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('PWA: Notification permission error', error)
      return false
    }
  }

  const showNotification = (title, options = {}) => {
    if (Notification.permission !== 'granted') {
      console.log('PWA: Notification permission not granted')
      return
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      ...options,
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker for notifications
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions)
      })
    } else {
      // Fallback to regular notifications
      new Notification(title, defaultOptions)
    }
  }

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    requestNotificationPermission,
    showNotification,
  }
}

export default usePWA
