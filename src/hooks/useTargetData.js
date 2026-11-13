import { useEffect, useState } from 'react'
import { mockTargets } from '../data/mockTargets.js'

// Replace this with the deployed .NET Web API base URL when the service is available.
const API_BASE_URL = ''

export function useTargetData() {
  const [targets, setTargets] = useState(mockTargets)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!API_BASE_URL) return undefined

    const controller = new AbortController()
    const loadTargets = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_BASE_URL}/api/targets`, { signal: controller.signal })
        if (!response.ok) throw new Error(`Target request failed (${response.status})`)
        const data = await response.json()
        if (!Array.isArray(data)) throw new Error('Target service returned an invalid response')
        setTargets(data)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setTargets(mockTargets)
          setError('Live catalog unavailable. Displaying the local target catalog.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadTargets()
    return () => controller.abort()
  }, [])

  return { targets, loading, error }
}
