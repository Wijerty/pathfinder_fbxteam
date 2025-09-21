// Event Bus для PathFinder - реактивная система событий
import { EventPayload, DomainEvent } from './events'

// Тип обработчика событий
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: EventPayload<T>) => void | Promise<void>

// Интерфейс для подписки
export interface EventSubscription {
  unsubscribe: () => void
}

// Настройки event bus
interface EventBusConfig {
  maxListeners: number
  enableLogging: boolean
  enableMetrics: boolean
  errorHandler?: (error: Error, event: EventPayload) => void
}

// Метрики event bus
interface EventMetrics {
  totalEvents: number
  eventsByType: Record<string, number>
  errors: number
  averageHandlingTime: number
  lastEventAt?: number
}

// Основной класс Event Bus
class EventBusImpl {
  private listeners = new Map<string, Set<EventHandler>>()
  private wildcardListeners = new Set<EventHandler>()
  private config: EventBusConfig
  private metrics: EventMetrics
  private eventHistory: EventPayload[] = []
  private readonly MAX_HISTORY = 1000

  constructor(config?: Partial<EventBusConfig>) {
    this.config = {
      maxListeners: 100,
      enableLogging: process.env.NODE_ENV === 'development',
      enableMetrics: true,
      ...config
    }

    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      errors: 0,
      averageHandlingTime: 0
    }

    // Логируем инициализацию
    if (this.config.enableLogging) {
      console.log('🚌 PathFinder Event Bus initialized')
    }
  }

  // Публикация события
  async publish<T extends DomainEvent>(event: EventPayload<T>): Promise<void> {
    const startTime = performance.now()

    try {
      // Обновляем метрики
      this.updateMetrics(event)

      // Добавляем в историю
      this.addToHistory(event)

      // Логируем событие
      if (this.config.enableLogging) {
        console.log(`📢 Event published: ${event.type}`, {
          userId: event.userId,
          timestamp: new Date(event.timestamp).toISOString(),
          data: event.data
        })
      }

      // Получаем обработчики для конкретного типа события
      const typeListeners = this.listeners.get(event.type) || new Set()
      
      // Объединяем с wildcard обработчиками
      const allListeners = [...Array.from(typeListeners), ...Array.from(this.wildcardListeners)]

      // Выполняем обработчики параллельно
      const promises = allListeners.map(async (handler) => {
        try {
          await handler(event)
        } catch (error) {
          this.handleError(error as Error, event, handler)
        }
      })

      await Promise.all(promises)

      // Обновляем метрики времени выполнения
      const executionTime = performance.now() - startTime
      this.updateExecutionMetrics(executionTime)

    } catch (error) {
      this.handleError(error as Error, event)
      throw error
    }
  }

  // Подписка на конкретный тип события
  subscribe<T extends DomainEvent>(
    eventType: T,
    handler: EventHandler<T>
  ): EventSubscription {
    return this.addListener(eventType, handler as EventHandler)
  }

  // Подписка на несколько типов событий
  subscribeToMany(
    eventTypes: DomainEvent[],
    handler: EventHandler
  ): EventSubscription {
    const subscriptions = eventTypes.map(type => this.subscribe(type, handler))
    
    return {
      unsubscribe: () => {
        subscriptions.forEach(sub => sub.unsubscribe())
      }
    }
  }

  // Подписка на все события (wildcard)
  subscribeToAll(handler: EventHandler): EventSubscription {
    this.wildcardListeners.add(handler)

    if (this.config.enableLogging) {
      console.log('🌟 Wildcard listener added')
    }

    return {
      unsubscribe: () => {
        this.wildcardListeners.delete(handler)
        if (this.config.enableLogging) {
          console.log('🌟 Wildcard listener removed')
        }
      }
    }
  }

  // Подписка с фильтром
  subscribeWithFilter<T extends DomainEvent>(
    eventType: T,
    filter: (event: EventPayload<T>) => boolean,
    handler: EventHandler<T>
  ): EventSubscription {
    const wrappedHandler: EventHandler<T> = (event) => {
      if (filter(event)) {
        return handler(event)
      }
    }

    return this.subscribe(eventType, wrappedHandler)
  }

  // Подписка на события конкретного пользователя
  subscribeForUser(
    userId: string,
    eventTypes: DomainEvent[] | '*',
    handler: EventHandler
  ): EventSubscription {
    const filter = (event: EventPayload) => event.userId === userId

    if (eventTypes === '*') {
      const wrappedHandler: EventHandler = (event) => {
        if (filter(event)) {
          return handler(event)
        }
      }
      return this.subscribeToAll(wrappedHandler)
    } else {
      const subscriptions = eventTypes.map(type => 
        this.subscribeWithFilter(type, filter, handler)
      )
      
      return {
        unsubscribe: () => {
          subscriptions.forEach(sub => sub.unsubscribe())
        }
      }
    }
  }

  // Подписка только на следующее событие (одноразовая)
  once<T extends DomainEvent>(
    eventType: T,
    handler: EventHandler<T>
  ): EventSubscription {
    let subscription: EventSubscription

    const onceHandler: EventHandler<T> = async (event) => {
      subscription.unsubscribe()
      return handler(event)
    }

    subscription = this.subscribe(eventType, onceHandler)
    return subscription
  }

  // Ожидание события (Promise-based)
  waitFor<T extends DomainEvent>(
    eventType: T,
    timeout?: number,
    filter?: (event: EventPayload<T>) => boolean
  ): Promise<EventPayload<T>> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined

      if (timeout) {
        timeoutId = setTimeout(() => {
          subscription.unsubscribe()
          reject(new Error(`Event ${eventType} timeout after ${timeout}ms`))
        }, timeout)
      }

      const handler: EventHandler<T> = (event) => {
        if (!filter || filter(event)) {
          if (timeoutId) clearTimeout(timeoutId)
          subscription.unsubscribe()
          resolve(event)
        }
      }

      const subscription = this.subscribe(eventType, handler)
    })
  }

  // Получение метрик
  getMetrics(): EventMetrics {
    return { ...this.metrics }
  }

  // Получение истории событий
  getHistory(limit?: number): EventPayload[] {
    const history = [...this.eventHistory].reverse()
    return limit ? history.slice(0, limit) : history
  }

  // Получение истории по типу события
  getHistoryByType(eventType: DomainEvent, limit?: number): EventPayload[] {
    const filtered = this.eventHistory.filter(e => e.type === eventType).reverse()
    return limit ? filtered.slice(0, limit) : filtered
  }

  // Получение истории по пользователю
  getHistoryByUser(userId: string, limit?: number): EventPayload[] {
    const filtered = this.eventHistory.filter(e => e.userId === userId).reverse()
    return limit ? filtered.slice(0, limit) : filtered
  }

  // Очистка всех подписок
  clear(): void {
    this.listeners.clear()
    this.wildcardListeners.clear()
    if (this.config.enableLogging) {
      console.log('🧹 Event Bus cleared')
    }
  }

  // Получение информации о подписчиках
  getListenerInfo(): Record<string, number> {
    const info: Record<string, number> = {}
    
    this.listeners.forEach((listeners, eventType) => {
      info[eventType] = listeners.size
    })
    
    info['*'] = this.wildcardListeners.size
    
    return info
  }

  // Приватные методы

  private addListener(eventType: string, handler: EventHandler): EventSubscription {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    const typeListeners = this.listeners.get(eventType)!
    
    if (typeListeners.size >= this.config.maxListeners) {
      throw new Error(`Maximum listeners (${this.config.maxListeners}) exceeded for event type: ${eventType}`)
    }

    typeListeners.add(handler)

    if (this.config.enableLogging) {
      console.log(`➕ Listener added for: ${eventType} (total: ${typeListeners.size})`)
    }

    return {
      unsubscribe: () => {
        typeListeners.delete(handler)
        if (typeListeners.size === 0) {
          this.listeners.delete(eventType)
        }
        if (this.config.enableLogging) {
          console.log(`➖ Listener removed for: ${eventType}`)
        }
      }
    }
  }

  private updateMetrics(event: EventPayload): void {
    if (!this.config.enableMetrics) return

    this.metrics.totalEvents++
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] || 0) + 1
    this.metrics.lastEventAt = event.timestamp
  }

  private updateExecutionMetrics(executionTime: number): void {
    if (!this.config.enableMetrics) return

    // Простое скользящее среднее
    const alpha = 0.1
    this.metrics.averageHandlingTime = 
      this.metrics.averageHandlingTime * (1 - alpha) + executionTime * alpha
  }

  private addToHistory(event: EventPayload): void {
    this.eventHistory.push(event)
    
    // Ограничиваем размер истории
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory = this.eventHistory.slice(-this.MAX_HISTORY)
    }
  }

  private handleError(error: Error, event: EventPayload, handler?: EventHandler): void {
    this.metrics.errors++

    if (this.config.errorHandler) {
      try {
        this.config.errorHandler(error, event)
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError)
      }
    }

    console.error(`❌ Error handling event ${event.type}:`, {
      error: error.message,
      stack: error.stack,
      event: {
        type: event.type,
        userId: event.userId,
        timestamp: new Date(event.timestamp).toISOString()
      },
      handler: handler?.name || 'anonymous'
    })
  }
}

// Singleton instance
let eventBusInstance: EventBusImpl | null = null

// Функция для получения instance
export function getEventBus(): EventBusImpl {
  if (!eventBusInstance) {
    eventBusInstance = new EventBusImpl({
      enableLogging: process.env.NODE_ENV === 'development',
      enableMetrics: true,
      errorHandler: (error, event) => {
        // Здесь можно отправлять ошибки в сервис мониторинга
        console.error('EventBus error:', error, 'Event:', event.type)
      }
    })
  }
  return eventBusInstance
}

// Экспортируем удобные методы
export const eventBus = getEventBus()
export const publish = eventBus.publish.bind(eventBus)
export const subscribe = eventBus.subscribe.bind(eventBus)
export const subscribeToMany = eventBus.subscribeToMany.bind(eventBus)
export const subscribeToAll = eventBus.subscribeToAll.bind(eventBus)
export const subscribeWithFilter = eventBus.subscribeWithFilter.bind(eventBus)
export const subscribeForUser = eventBus.subscribeForUser.bind(eventBus)
export const once = eventBus.once.bind(eventBus)
export const waitFor = eventBus.waitFor.bind(eventBus)

// Утилиты для тестирования
export function createTestEventBus(): EventBusImpl {
  return new EventBusImpl({
    enableLogging: false,
    enableMetrics: false
  })
}

export function clearEventBus(): void {
  eventBus.clear()
}

// Типы уже экспортированы выше
