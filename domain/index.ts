// Главный файл инициализации домена PathFinder
import { initializeStore, setupStoreSubscriptions } from './state/store'
import { initializeDomainRules } from './rules'
import { initializeDatabase } from '@/lib/dataService'

// Флаг инициализации
let isInitialized = false

/**
 * Инициализация всего домена PathFinder
 * Должна вызываться один раз при запуске приложения
 */
export const initializePathFinderDomain = async () => {
  if (isInitialized) {
    console.warn('🔄 Домен PathFinder уже инициализирован')
    return
  }

  console.log('🚀 Инициализация домена PathFinder...')

  try {
    // 1. Инициализация базы данных
    console.log('📊 Инициализация базы данных...')
    await initializeDatabase()

    // 2. Инициализация store и состояния
    console.log('🗄️ Инициализация store...')
    await initializeStore()

    // 3. Настройка подписок на изменения в store
    console.log('🔗 Настройка подписок store...')
    setupStoreSubscriptions()

    // 4. Инициализация реактивных правил
    console.log('⚡ Инициализация реактивных правил...')
    initializeDomainRules()

    // 5. Настройка глобальных обработчиков
    setupGlobalHandlers()

    isInitialized = true
    console.log('✅ Домен PathFinder успешно инициализирован!')

    // Отправляем событие готовности домена
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pathfinder:domain:ready'))
    }

  } catch (error) {
    console.error('❌ Ошибка инициализации домена PathFinder:', error)
    throw error
  }
}

/**
 * Проверка готовности домена
 */
export const isDomainReady = (): boolean => {
  return isInitialized
}

/**
 * Настройка глобальных обработчиков ошибок и событий
 */
const setupGlobalHandlers = () => {
  // Обработчик необработанных ошибок
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('Необработанная ошибка:', event.error)
      
      // Здесь можно отправлять ошибки в систему мониторинга
      // reportError(event.error)
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Необработанное отклонение Promise:', event.reason)
      
      // Здесь можно отправлять ошибки в систему мониторинга
      // reportError(event.reason)
    })

    // Обработчик изменения соединения с интернетом
    window.addEventListener('online', () => {
      console.log('🌐 Соединение с интернетом восстановлено')
      // Здесь можно синхронизировать данные
    })

    window.addEventListener('offline', () => {
      console.log('📡 Соединение с интернетом потеряно')
      // Здесь можно переключиться в оффлайн режим
    })
  }
}

/**
 * Очистка домена (для тестов и горячей перезагрузки)
 */
export const cleanupDomain = () => {
  isInitialized = false
  console.log('🧹 Домен PathFinder очищен')
}

// Экспорт основных модулей домена
export { useStore, initializeStore } from './state/store'
export { publish, subscribe, eventBus } from './eventBus'
export * from './events'

// Экспорт селекторов
export {
  useAuth,
  useProfile,
  useGamification,
  useHR,
  useTaxonomy,
  useChat,
  useUI,
  useDashboardData,
  useSkillsData,
  useMatchingData
} from './state/store'

// Экспорт основных типов
export type { PathFinderStore } from './state/store'
export type { DomainEvent, EventPayload } from './events'

// Утилиты для отладки
export const debugDomain = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      isInitialized,
      store: isInitialized ? require('./state/store').useStore.getState() : null,
      eventBus: require('./eventBus').eventBus,
      metrics: isInitialized ? require('./eventBus').eventBus.getMetrics() : null
    }
  }
  return null
}
