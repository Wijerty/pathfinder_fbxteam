'use client'

import { useEffect } from 'react'
import { initializeStore } from '@/domain/state/store'
import { initializeDomainRules } from '@/domain/rules'

export function StoreInitializer() {
  useEffect(() => {
    const init = async () => {
      try {
        // Инициализируем store и правила доменного слоя
        await initializeStore()
        initializeDomainRules()
        console.log('✅ PathFinder initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize PathFinder:', error)
      }
    }

    init()
  }, [])

  return null // Этот компонент ничего не рендерит
}
