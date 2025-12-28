import { useRef, useCallback } from 'react'

export function useFocusManager() {
  const focusableElements = useRef(new Map())

  const registerElement = useCallback((key, element) => {
    if (element) {
      focusableElements.current.set(key, element)
    } else {
      focusableElements.current.delete(key)
    }
  }, [])

  const focusElement = useCallback((key) => {
    const element = focusableElements.current.get(key)
    if (element && element.focus) {
      element.focus()
    }
  }, [])

  const focusNext = useCallback(
    (currentKey) => {
      const keys = Array.from(focusableElements.current.keys())
      const currentIndex = keys.indexOf(currentKey)
      const nextIndex = (currentIndex + 1) % keys.length
      const nextKey = keys[nextIndex]
      focusElement(nextKey)
    },
    [focusElement]
  )

  const focusPrevious = useCallback(
    (currentKey) => {
      const keys = Array.from(focusableElements.current.keys())
      const currentIndex = keys.indexOf(currentKey)
      const prevIndex = currentIndex === 0 ? keys.length - 1 : currentIndex - 1
      const prevKey = keys[prevIndex]
      focusElement(prevKey)
    },
    [focusElement]
  )

  const handleKeyNavigation = useCallback(
    (event, currentKey) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          focusNext(currentKey)
          break
        case 'ArrowUp':
          event.preventDefault()
          focusPrevious(currentKey)
          break
        case 'Home': {
          event.preventDefault()
          const firstKey = Array.from(focusableElements.current.keys())[0]
          focusElement(firstKey)
          break
        }
        case 'End': {
          event.preventDefault()
          const keys = Array.from(focusableElements.current.keys())
          const lastKey = keys[keys.length - 1]
          focusElement(lastKey)
          break
        }
      }
    },
    [focusNext, focusPrevious, focusElement]
  )

  return {
    registerElement,
    focusElement,
    focusNext,
    focusPrevious,
    handleKeyNavigation,
  }
}

export default useFocusManager
