import { useState, useCallback } from 'react'

export function useLoadingState(initialStates = {}) {
  const [loading, setLoading] = useState({
    tasks: false,
    ai: false,
    analytics: false,
    export: false,
    import: false,
    ...initialStates,
  })

  const setLoadingState = useCallback((key, isLoading) => {
    setLoading((prev) => ({
      ...prev,
      [key]: isLoading,
    }))
  }, [])

  const withLoading = useCallback(
    async (key, asyncFunction) => {
      setLoadingState(key, true)
      try {
        const result = await asyncFunction()
        return result
      } finally {
        setLoadingState(key, false)
      }
    },
    [setLoadingState]
  )

  const isAnyLoading = Object.values(loading).some(Boolean)

  return {
    loading,
    setLoadingState,
    withLoading,
    isAnyLoading,
  }
}

export default useLoadingState
