// Gamification Slice для управления геймификацией
import { StateCreator } from 'zustand'
import { 
  Quest, 
  UserQuest, 
  QuestStatus, 
  Badge, 
  UserBadge,
  QuestProgress
} from '@/types'
import { publish } from '../eventBus'
import { createEvent } from '../events'
import { xpConfig, profileLevels, baseBadges, baseQuests } from '@/config/gamification'

// Состояние геймификации
export interface GamificationState {
  // XP и уровни
  currentXp: number
  currentLevel: number
  nextLevelXp: number
  xpToNextLevel: number
  
  // Квесты
  availableQuests: Quest[]
  activeQuests: UserQuest[]
  completedQuests: UserQuest[]
  questProgress: Map<string, QuestProgress[]>
  
  // Бейджи
  availableBadges: Badge[]
  earnedBadges: UserBadge[]
  recentBadges: UserBadge[]
  
  // Статистика
  stats: {
    totalXpEarned: number
    questsCompleted: number
    badgesEarned: number
    currentStreak: number
    longestStreak: number
    achievementRate: number
  }
  
  // Состояние загрузки
  isLoading: boolean
  error: string | null
}

// Действия геймификации
export interface GamificationActions {
  // Инициализация
  loadGamificationData: (userId: string) => Promise<void>
  
  // Управление XP
  addXp: (amount: number, reason: string, source?: string) => Promise<void>
  
  // Управление квестами
  loadQuests: () => Promise<void>
  acceptQuest: (questId: string) => Promise<void>
  completeQuest: (questId: string) => Promise<void>
  updateQuestProgress: (questId: string, requirementId: string, newValue: number) => Promise<void>
  
  // Управление бейджами
  checkBadgeEligibility: () => Promise<void>
  awardBadge: (badgeId: string, criteria: string) => Promise<void>
  
  // Утилиты
  recalculateLevel: () => void
  clearError: () => void
  refreshGamification: () => Promise<void>
  
  // Получение рекомендаций
  getRecommendedQuests: (limit?: number) => Quest[]
  getAvailableBadges: () => Badge[]
}

// Полный тип слайса
export type GamificationSlice = GamificationState & GamificationActions

// Начальное состояние
const initialState: GamificationState = {
  currentXp: 0,
  currentLevel: 1,
  nextLevelXp: profileLevels[1]?.xpRequired || 100,
  xpToNextLevel: profileLevels[1]?.xpRequired || 100,
  
  availableQuests: [],
  activeQuests: [],
  completedQuests: [],
  questProgress: new Map(),
  
  availableBadges: [],
  earnedBadges: [],
  recentBadges: [],
  
  stats: {
    totalXpEarned: 0,
    questsCompleted: 0,
    badgesEarned: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievementRate: 0
  },
  
  isLoading: false,
  error: null
}

// Создание gamification slice
export const createGamificationSlice: StateCreator<GamificationSlice> = (set, get) => ({
  ...initialState,

  // === ИНИЦИАЛИЗАЦИЯ ===

  loadGamificationData: async (userId: string) => {
    try {
      set({ isLoading: true, error: null })

      // Загружаем данные пользователя
      const response = await fetch(`/api/gamification/${userId}`)
      if (!response.ok) throw new Error('Не удалось загрузить данные геймификации')
      
      const data = await response.json()
      
      // Устанавливаем состояние
      set({
        currentXp: data.currentXp || 0,
        activeQuests: data.activeQuests || [],
        completedQuests: data.completedQuests || [],
        earnedBadges: data.earnedBadges || [],
        stats: data.stats || initialState.stats,
        isLoading: false
      })

      // Загружаем доступные квесты и бейджи
      await get().loadQuests()
      
      // Пересчитываем уровень
      get().recalculateLevel()
      
      // TODO: Обновляем прогресс квестов
      // get().updateQuestProgressFromProfile()

      // TODO: Проверяем доступность новых бейджей
      // await get().checkBadgeEligibility()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки геймификации'
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  // === УПРАВЛЕНИЕ XP ===

  addXp: async (amount: number, reason: string, source: string = 'manual') => {
    try {
      const { currentXp, currentLevel } = get()
      
      // Применяем множители
      let finalAmount = amount
      
      // TODO: Проверяем дневные лимиты
      // if (source === 'skill_update' && get().isDailyLimitReached('skillUpdates')) {
      //   console.warn('Достигнут дневной лимит XP за навыки')
      //   return
      // }
      
      const previousXp = currentXp
      const newXp = currentXp + finalAmount
      const previousLevel = currentLevel

      set({ 
        currentXp: newXp,
        stats: {
          ...get().stats,
          totalXpEarned: get().stats.totalXpEarned + finalAmount
        }
      })

      // Пересчитываем уровень
      get().recalculateLevel()

      // Публикуем событие XP
      await publish(createEvent(
        'XP_GAINED',
        {
          userId: 'current-user', // TODO: получить из auth
          amount: finalAmount,
          reason,
          source,
          previousXp,
          newXp
        },
        'current-user' // TODO: получить из auth
      ))

      // Проверяем повышение уровня
      const newLevel = get().currentLevel
      if (newLevel > previousLevel) {
        await publish(createEvent(
          'LEVEL_UP',
          {
            userId: 'current-user', // TODO: получить из auth
            previousLevel,
            newLevel,
            previousXp,
            newXp
          },
          'current-user' // TODO: получить из auth
        ))
      }

      // Проверяем новые бейджи
      await get().checkBadgeEligibility()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка начисления XP'
      set({ error: errorMessage })
      throw error
    }
  },

  // === УПРАВЛЕНИЕ КВЕСТАМИ ===

  loadQuests: async () => {
    try {
      // Загружаем базовые квесты
      const availableQuests = baseQuests.map(quest => ({
        ...quest,
        id: `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      // TODO: Фильтруем квесты на основе профиля пользователя
      const filteredQuests = availableQuests // .filter(quest => get().isQuestAvailable(quest))

      set({ availableQuests: filteredQuests })

    } catch (error) {
      console.error('Ошибка загрузки квестов:', error)
    }
  },

  acceptQuest: async (questId: string) => {
    try {
      const { availableQuests, activeQuests } = get()
      
      const quest = availableQuests.find(q => q.id === questId)
      if (!quest) throw new Error('Квест не найден')

      // Проверяем лимиты
      if (activeQuests.length >= 5) {
        throw new Error('Максимум 5 активных квестов')
      }

      const userQuest: UserQuest = {
        userId: 'current-user', // TODO: получить из auth
        questId,
        status: 'active',
        progress: quest.requirements.map(req => ({
          requirementId: req.type,
          currentValue: 0,
          requiredValue: req.requiredValue,
          isCompleted: false,
          updatedAt: new Date()
        })),
        startedAt: new Date()
      }

      // Устанавливаем срок истечения если есть
      if (quest.timeLimit) {
        userQuest.expiresAt = new Date(Date.now() + quest.timeLimit * 24 * 60 * 60 * 1000)
      }

      set({
        activeQuests: [...activeQuests, userQuest],
        availableQuests: availableQuests.filter(q => q.id !== questId)
      })

      // Публикуем событие
      await publish(createEvent(
        'QUEST_ACCEPTED',
        {
          userId: 'current-user', // TODO: получить из auth
          questId,
          quest,
          acceptedAt: new Date()
        },
        'current-user' // TODO: получить из auth
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка принятия квеста'
      set({ error: errorMessage })
      throw error
    }
  },

  completeQuest: async (questId: string) => {
    try {
      const { activeQuests, availableQuests } = get()
      
      const userQuestIndex = activeQuests.findIndex(q => q.questId === questId)
      if (userQuestIndex === -1) throw new Error('Активный квест не найден')

      const userQuest = activeQuests[userQuestIndex]
      const quest = availableQuests.find(q => q.id === questId) ||      
                   baseQuests.find(q => (q as any).id === questId)

      if (!quest) throw new Error('Квест не найден')

      // Проверяем, что все требования выполнены
      const allCompleted = userQuest.progress.every(p => p.isCompleted)
      if (!allCompleted) {
        throw new Error('Не все требования квеста выполнены')
      }

      // Перемещаем в завершенные
      const completedQuest: UserQuest = {
        ...userQuest,
        status: 'completed',
        completedAt: new Date()
      }

      const updatedActiveQuests = [...activeQuests]
      updatedActiveQuests.splice(userQuestIndex, 1)

      set({
        activeQuests: updatedActiveQuests,
        completedQuests: [...get().completedQuests, completedQuest],
        stats: {
          ...get().stats,
          questsCompleted: get().stats.questsCompleted + 1
        }
      })

      // Выдаем награды
      const rewards = quest.rewards || []
      for (const reward of rewards) {
        if (reward.type === 'xp') {
          await get().addXp(Number(reward.value), `Квест: ${quest.title}`, 'quest_completion')
        } else if (reward.type === 'badge') {
          await get().awardBadge(String(reward.value), `Завершение квеста: ${quest.title}`)
        }
      }

      // Публикуем событие
      await publish(createEvent(
        'QUEST_COMPLETED',
        {
          userId: 'current-user', // TODO: получить из auth
          questId,
          quest,
          completedAt: new Date(),
          rewards
        },
        'current-user' // TODO: получить из auth
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка завершения квеста'
      set({ error: errorMessage })
      throw error
    }
  },

  updateQuestProgress: async (questId: string, requirementId: string, newValue: number) => {
    try {
      const { activeQuests } = get()
      
      const questIndex = activeQuests.findIndex(q => q.questId === questId)
      if (questIndex === -1) return

      const userQuest = activeQuests[questIndex]
      const progressIndex = userQuest.progress.findIndex(p => p.requirementId === requirementId)
      if (progressIndex === -1) return

      const progress = userQuest.progress[progressIndex]
      const previousValue = progress.currentValue

      // Обновляем прогресс
      const updatedProgress = {
        ...progress,
        currentValue: newValue,
        isCompleted: newValue >= progress.requiredValue,
        updatedAt: new Date()
      }

      const updatedUserQuest = {
        ...userQuest,
        progress: [
          ...userQuest.progress.slice(0, progressIndex),
          updatedProgress,
          ...userQuest.progress.slice(progressIndex + 1)
        ]
      }

      const updatedActiveQuests = [
        ...activeQuests.slice(0, questIndex),
        updatedUserQuest,
        ...activeQuests.slice(questIndex + 1)
      ]

      set({ activeQuests: updatedActiveQuests })

      // Публикуем событие если есть изменения
      if (newValue !== previousValue) {
        await publish(createEvent(
          'QUEST_PROGRESS_UPDATED',
          {
            userId: 'current-user', // TODO: получить из auth
            questId,
            requirementId,
            previousValue,
            currentValue: newValue,
            requiredValue: progress.requiredValue,
            isCompleted: updatedProgress.isCompleted
          },
          'current-user' // TODO: получить из auth
        ))
      }

      // Проверяем автоматическое завершение квеста
      const allCompleted = updatedUserQuest.progress.every(p => p.isCompleted)
      if (allCompleted) {
        await get().completeQuest(questId)
      }

    } catch (error) {
      console.error('Ошибка обновления прогресса квеста:', error)
    }
  },

  // === УПРАВЛЕНИЕ БЕЙДЖАМИ ===

  checkBadgeEligibility: async () => {
    try {
      const { earnedBadges } = get()
      const earnedBadgeIds = new Set(earnedBadges.map(b => b.badgeId))

      // Проверяем каждый доступный бейдж
      for (const badge of baseBadges) {
        if (earnedBadgeIds.has(badge.name)) continue

        // TODO: реализовать проверку критериев бейджа
        // const isEligible = get().checkBadgeCriteria(badge)
        // if (isEligible) {
        //   await get().awardBadge(badge.name, `Критерии выполнены: ${badge.description}`)
        // }
      }

    } catch (error) {
      console.error('Ошибка проверки бейджей:', error)
    }
  },

  awardBadge: async (badgeId: string, criteria: string) => {
    try {
      const { earnedBadges } = get()
      
      // Проверяем, что бейдж еще не получен
      if (earnedBadges.some(b => b.badgeId === badgeId)) {
        return
      }

      const badge = baseBadges.find(b => b.name === badgeId)
      if (!badge) throw new Error('Бейдж не найден')

      const userBadge: UserBadge = {
        userId: 'current-user', // TODO: получить из auth
        badgeId,
        earnedAt: new Date()
      }

      set({
        earnedBadges: [...earnedBadges, userBadge],
        recentBadges: [userBadge, ...get().recentBadges.slice(0, 4)],
        stats: {
          ...get().stats,
          badgesEarned: get().stats.badgesEarned + 1
        }
      })

      // Начисляем XP за бейдж
      await get().addXp(badge.xpReward, `Получен бейдж: ${badge.name}`, 'badge_earned')

      // Публикуем событие
      await publish(createEvent(
        'BADGE_AWARDED',
        {
          userId: 'current-user', // TODO: получить из auth
          badge,
          awardedAt: new Date(),
          criteria,
          xpReward: badge.xpReward
        },
        'current-user' // TODO: получить из auth
      ))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка получения бейджа'
      set({ error: errorMessage })
      throw error
    }
  },

  // === УТИЛИТЫ ===

  recalculateLevel: () => {
    const { currentXp } = get()
    
    let level = 1
    let nextLevelXp = profileLevels[1]?.xpRequired || 100
    
    for (let i = profileLevels.length - 1; i >= 0; i--) {
      if (currentXp >= profileLevels[i].xpRequired) {
        level = profileLevels[i].level
        nextLevelXp = profileLevels[i + 1]?.xpRequired || currentXp
        break
      }
    }

    const xpToNextLevel = Math.max(0, nextLevelXp - currentXp)

    set({
      currentLevel: level,
      nextLevelXp,
      xpToNextLevel
    })
  },

  clearError: () => {
    set({ error: null })
  },

  refreshGamification: async () => {
    const userId = 'current-user' // TODO: получить из auth
    if (userId) {
      await get().loadGamificationData(userId)
    }
  },

  getRecommendedQuests: (limit: number = 3) => {
    const { availableQuests } = get()
    
    // Сортируем квесты по приоритету и сложности
    return availableQuests
      .filter(quest => quest.isActive)
      .sort((a, b) => {
        const difficultyScore = { 'easy': 1, 'medium': 2, 'hard': 3, 'expert': 4 }
        return difficultyScore[a.difficulty] - difficultyScore[b.difficulty]
      })
      .slice(0, limit)
  },

  getAvailableBadges: () => {
    const { earnedBadges } = get()
    const earnedBadgeIds = new Set(earnedBadges.map(b => b.badgeId))
    
    return baseBadges.filter(badge => 
      badge.isActive && !earnedBadgeIds.has(badge.name)
    ) as Badge[]
  },

  // Приватные методы
  getCurrentUserId: () => {
    // Получаем из auth slice или где-то еще
    return 'current-user-id' // Заглушка
  },

  isQuestAvailable: (quest: Quest) => {
    // Проверяем доступность квеста на основе профиля
    // Здесь можно добавить логику проверки предварительных условий
    return quest.isActive
  },

  isDailyLimitReached: (limitType: string) => {
    // Проверяем дневные лимиты
    // Здесь нужна логика отслеживания дневной активности
    return false
  },

  checkBadgeCriteria: (badge: any) => {
    // Проверяем критерии получения бейджа
    // Здесь нужна связь с профилем и другими данными
    return false
  },

  updateQuestProgressFromProfile: () => {
    // Обновляем прогресс квестов на основе изменений в профиле
    // Это вызывается при загрузке или изменении профиля
  }
})

// === СЕЛЕКТОРЫ ===

export const gamificationSelectors = {
  // Основные селекторы
  getCurrentXp: (state: GamificationSlice) => state.currentXp,
  getCurrentLevel: (state: GamificationSlice) => state.currentLevel,
  getXpToNextLevel: (state: GamificationSlice) => state.xpToNextLevel,
  getProgressToNextLevel: (state: GamificationSlice) => {
    const currentLevelXp = profileLevels.find(l => l.level === state.currentLevel)?.xpRequired || 0
    const totalXpForLevel = state.nextLevelXp - currentLevelXp
    const earnedXpForLevel = state.currentXp - currentLevelXp
    return totalXpForLevel > 0 ? (earnedXpForLevel / totalXpForLevel) * 100 : 0
  },
  
  // Квесты
  getActiveQuests: (state: GamificationSlice) => state.activeQuests,
  getCompletedQuests: (state: GamificationSlice) => state.completedQuests,
  getAvailableQuests: (state: GamificationSlice) => state.availableQuests,
  getQuestById: (questId: string) => (state: GamificationSlice) => 
    state.activeQuests.find(q => q.questId === questId) ||
    state.completedQuests.find(q => q.questId === questId),
  
  // Бейджи
  getEarnedBadges: (state: GamificationSlice) => state.earnedBadges,
  getRecentBadges: (state: GamificationSlice) => state.recentBadges,
  getBadgeCount: (state: GamificationSlice) => state.earnedBadges.length,
  
  // Статистика
  getStats: (state: GamificationSlice) => state.stats,
  getTotalXpEarned: (state: GamificationSlice) => state.stats.totalXpEarned,
  getQuestsCompletedCount: (state: GamificationSlice) => state.stats.questsCompleted,
  
  // Достижения
  getAchievementRate: (state: GamificationSlice) => state.stats.achievementRate,
  getCurrentStreak: (state: GamificationSlice) => state.stats.currentStreak,
  
  // Состояние
  isLoading: (state: GamificationSlice) => state.isLoading,
  getError: (state: GamificationSlice) => state.error,
  
  // Производные данные
  getLevelInfo: (state: GamificationSlice) => {
    const currentLevelData = profileLevels.find(l => l.level === state.currentLevel)
    const nextLevelData = profileLevels.find(l => l.level === state.currentLevel + 1)
    
    return {
      current: currentLevelData,
      next: nextLevelData,
      progress: gamificationSelectors.getProgressToNextLevel(state)
    }
  },
  
  getQuestsByStatus: (status: QuestStatus) => (state: GamificationSlice) => {
    switch (status) {
      case 'active':
        return state.activeQuests
      case 'completed':
        return state.completedQuests
      case 'available':
        return state.availableQuests.map(quest => ({
          ...quest,
          status: 'available' as QuestStatus
        }))
      default:
        return []
    }
  }
}
