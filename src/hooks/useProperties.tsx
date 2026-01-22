import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Property } from '../types/database'

interface UsePropertiesOptions {
  limit?: number
  featured?: boolean
  province?: string
  city?: string
  orderBy?: 'ranking_position' | 'overall_score' | 'created_at'
}

export function useProperties(options: UsePropertiesOptions = {}) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from('properties')
          .select('*')
          .eq('is_active', true)

        if (options.featured) {
          query = query.eq('is_featured', true)
        }

        if (options.province) {
          query = query.eq('province', options.province)
        }

        if (options.city) {
          query = query.eq('city', options.city)
        }

        const orderColumn = options.orderBy || 'ranking_position'
        query = query.order(orderColumn, { ascending: orderColumn === 'ranking_position' })

        if (options.limit) {
          query = query.limit(options.limit)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError
        setProperties(data || [])
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching properties:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [options.limit, options.featured, options.province, options.city, options.orderBy])

  return { properties, loading, error }
}

export function useProperty(slugOrId: string) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true)

        // Try to find by slug first, then by ID
        let { data, error: fetchError } = await supabase
          .from('properties')
          .select('*')
          .eq('slug', slugOrId)
          .single()

        if (fetchError || !data) {
          const result = await supabase
            .from('properties')
            .select('*')
            .eq('id', slugOrId)
            .single()

          data = result.data
          fetchError = result.error
        }

        if (fetchError) throw fetchError
        setProperty(data)
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching property:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slugOrId) {
      fetchProperty()
    }
  }, [slugOrId])

  return { property, loading, error }
}
