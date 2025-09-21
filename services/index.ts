// Центральная точка экспорта всех сервисов PathFinder

// LLM и ИИ сервисы
export * from './llmClient'

// Голосовые сервисы
export * from './sttClient'
export * from './ttsClient'

// Бизнес-логика
export * from './profileService'
export * from './gamificationService' 
export * from './taxonomyService'
export * from './hrSearchService'

// Абстракции и интерфейсы
export type {
  LLMClient
} from './llmClient'

export type {
  STTClient
} from './sttClient'

export type {
  TTSClient,
  TTSOptions
} from './ttsClient'

// Инициализация всех сервисов
import { getLLMClient } from './llmClient'
import { getSTTClient } from './sttClient'
import { getTTSClient } from './ttsClient'
import { getProfileService } from './profileService'
import { getGamificationService } from './gamificationService'
import { getTaxonomyService } from './taxonomyService'
import { getHRSearchService } from './hrSearchService'

// Интерфейс для централизованного доступа к сервисам
export interface ServiceContainer {
  llm: ReturnType<typeof getLLMClient>
  stt: ReturnType<typeof getSTTClient>
  tts: ReturnType<typeof getTTSClient>
  profile: ReturnType<typeof getProfileService>
  gamification: ReturnType<typeof getGamificationService>
  taxonomy: ReturnType<typeof getTaxonomyService>
  hrSearch: ReturnType<typeof getHRSearchService>
}

// Ленивая инициализация контейнера сервисов
let serviceContainer: ServiceContainer | null = null

export function getServices(): ServiceContainer {
  if (!serviceContainer) {
    serviceContainer = {
      llm: getLLMClient(),
      stt: getSTTClient(),
      tts: getTTSClient(),
      profile: getProfileService(),
      gamification: getGamificationService(),
      taxonomy: getTaxonomyService(),
      hrSearch: getHRSearchService()
    }
    
    console.log('Сервисы PathFinder инициализированы')
  }
  
  return serviceContainer
}

// Функция проверки доступности сервисов
export async function checkServicesHealth(): Promise<{
  llm: boolean
  stt: boolean  
  tts: boolean
  overall: boolean
}> {
  const services = getServices()
  
  const health = {
    llm: services.llm.isAvailable(),
    stt: services.stt.isAvailable(),
    tts: services.tts.isAvailable(),
    overall: false
  }
  
  health.overall = health.llm && health.stt && health.tts
  
  return health
}

// Функция инициализации для тестов
export function resetServices(): void {
  serviceContainer = null
}

// Хелперы для часто используемых операций
export class ServiceHelpers {
  private services: ServiceContainer
  
  constructor() {
    this.services = getServices()
  }
  
  // Быстрый поиск пользователей
  async quickUserSearch(query: string, limit: number = 10) {
    return this.services.hrSearch.searchEmployees(query, {}, limit)
  }
  
  // Быстрая проверка совместимости с ролью
  async quickRoleMatch(userId: string, roleId: string) {
    const users = await this.quickUserSearch('', 1) // Получаем структуру
    // Здесь была бы логика быстрого матчинга
    return {
      compatibility: Math.floor(Math.random() * 100),
      topGaps: ['Leadership', 'Advanced JavaScript'],
      readiness: 'developing' as const
    }
  }
  
  // Быстрое получение рекомендаций
  async quickRecommendations(userId: string) {
    const profile = await this.services.profile.getProfile(userId)
    if (!profile) return []
    
    try {
      // Добавляем таймаут для предотвращения зависания
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const recommendationsPromise = this.services.llm.recommendRoles(profile)
      
      return await Promise.race([recommendationsPromise, timeoutPromise]) as any
    } catch (error) {
      console.warn('Не удалось получить рекомендации ролей:', error)
      return [] // Возвращаем пустой массив при ошибке
    }
  }
  
  // Проверка и начисление XP за действие
  async awardActionXP(userId: string, action: string, amount: number = 10) {
    try {
      return await this.services.gamification.awardXP(userId, amount, action)
    } catch (error) {
      console.warn(`Не удалось начислить XP за ${action}:`, error)
      return 0
    }
  }
  
  // Голосовое взаимодействие с ИИ
  async voiceChat(audioBlob: Blob, userId: string, context: string = 'employee') {
    try {
      // Распознаем речь
      const transcription = await this.services.stt.transcribe(audioBlob)
      
      if (!transcription.trim()) {
        throw new Error('Не удалось распознать речь')
      }
      
      // Отправляем в чат с ИИ
      const response = await this.services.llm.chat(context, [{
        id: 'voice-input',
        role: 'user',
        content: transcription,
        metadata: { voiceInput: true },
        timestamp: new Date()
      }])
      
      return {
        transcription,
        response,
        success: true
      }
    } catch (error) {
      console.error('Ошибка голосового чата:', error)
      return {
        transcription: '',
        response: 'Извините, произошла ошибка при обработке голосового сообщения.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Автоматическая проверка и выдача бейджей
  async checkAndAwardBadges(userId: string) {
    try {
      const earnedBadges = await this.services.gamification.checkBadgeCriteria(userId)
      
      // Начисляем XP за каждый новый бейдж (уже делается в сервисе, но логируем)
      if (earnedBadges.length > 0) {
        console.log(`Пользователь ${userId} получил новые бейджи:`, 
          earnedBadges.map(b => b.name).join(', '))
      }
      
      return earnedBadges
    } catch (error) {
      console.warn('Ошибка проверки бейджей:', error)
      return []
    }
  }
  
  // Получение полной сводки пользователя
  async getUserDashboard(userId: string) {
    try {
      const [profile, gameData, recommendations] = await Promise.all([
        this.services.profile.getProfile(userId),
        this.services.gamification.getUserGameData(userId),
        this.quickRecommendations(userId)
      ])
      
      const profileStats = profile ? await this.services.profile.getProfileStats(userId) : null
      
      return {
        profile,
        profileStats,
        gameData,
        recommendations: recommendations.slice(0, 5), // Топ 5 рекомендаций
        availableQuests: this.services.gamification.getAvailableQuests(userId).slice(0, 3)
      }
    } catch (error) {
      console.error('Ошибка получения дашборда:', error)
      throw error
    }
  }
}

// Экспорт глобального экземпляра хелперов
export const serviceHelpers = new ServiceHelpers()

// События сервисов для интеграции с UI
export type ServiceEvent = 
  | { type: 'xp_awarded'; userId: string; amount: number; reason: string }
  | { type: 'badge_earned'; userId: string; badgeId: string; badgeName: string }
  | { type: 'level_up'; userId: string; newLevel: number }
  | { type: 'quest_completed'; userId: string; questId: string; questTitle: string }
  | { type: 'skill_added'; userId: string; skillId: string; skillName: string }
  | { type: 'profile_updated'; userId: string; completeness: number }

// Простой event emitter для уведомлений
class ServiceEventEmitter {
  private listeners: Map<string, Function[]> = new Map()
  
  on(event: ServiceEvent['type'], callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }
  
  off(event: ServiceEvent['type'], callback: Function) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }
  
  emit(eventData: ServiceEvent) {
    const eventListeners = this.listeners.get(eventData.type)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(eventData)
        } catch (error) {
          console.error('Ошибка в обработчике события:', error)
        }
      })
    }
  }
}

export const serviceEvents = new ServiceEventEmitter()

// Интеграция событий с сервисами (в реальном приложении было бы через hooks)
export function setupServiceEventHandlers() {
  // Здесь можно добавить логику автоматического срабатывания событий
  // при изменениях в сервисах
  
  console.log('Service event handlers инициализированы')
}
