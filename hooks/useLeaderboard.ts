import { useState, useEffect, useMemo } from 'react'
import { User } from '@/types'
import { mockUsers } from '@/mocks/users'
import { useGamification } from '@/domain/state/store'

interface LeaderboardEntry {
  user: User
  xp: number
  level: number
  badgeCount: number
  questsCompleted: number
  rank: number
  rankChange?: number
}

interface UseLeaderboardOptions {
  timeframe?: 'week' | 'month' | 'all'
  limit?: number
  includeCurrentUser?: boolean
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { 
    timeframe = 'all', 
    limit,
    includeCurrentUser = true 
  } = options
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previousRankings, setPreviousRankings] = useState<Record<string, number>>({})
  
  const { currentXp, stats } = useGamification()
  
  // Генерируем mock данные для рейтинга
  const generateLeaderboardData = useMemo(() => {
    return mockUsers.map((user, index) => {
      // Генерируем детерминированные данные на основе ID пользователя
      const seed = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const seededRandom = (offset = 0) => ((seed + offset) * 9301 + 49297) % 233280 / 233280
      
      const baseXp = Math.floor(seededRandom(1) * 5000) + 100
      const questsCompleted = Math.floor(seededRandom(2) * 20) + 1
      const badgeCount = Math.floor(seededRandom(3) * 15) + 1
      
      // Применяем модификаторы в зависимости от timeframe
      let xp = baseXp
      if (timeframe === 'week') {
        xp = Math.floor(baseXp * 0.1) + Math.floor(seededRandom(4) * 200)
      } else if (timeframe === 'month') {
        xp = Math.floor(baseXp * 0.4) + Math.floor(seededRandom(5) * 800)
      }
      
      // Рассчитываем уровень на основе XP
      let level = 1
      let totalXpForLevel = 0
      const xpPerLevel = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000]
      
      for (let i = 1; i < xpPerLevel.length; i++) {
        if (xp >= xpPerLevel[i]) {
          level = i + 1
        } else {
          break
        }
      }
      
      return {
        user,
        xp,
        level,
        badgeCount,
        questsCompleted,
        rank: 0, // Будет установлен после сортировки
        rankChange: previousRankings[user.id] ? 
          previousRankings[user.id] - (index + 1) : undefined
      }
    })
  }, [timeframe, previousRankings])
  
  // Сортируем и присваиваем ранги
  const sortedEntries = useMemo(() => {
    const sorted = [...generateLeaderboardData]
      .sort((a, b) => {
        // Сначала по XP
        if (b.xp !== a.xp) return b.xp - a.xp
        // Затем по количеству завершенных квестов
        if (b.questsCompleted !== a.questsCompleted) return b.questsCompleted - a.questsCompleted
        // Затем по количеству бейджей
        return b.badgeCount - a.badgeCount
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }))
    
    return limit ? sorted.slice(0, limit) : sorted
  }, [generateLeaderboardData, limit])
  
  // Сохраняем текущие ранги для отслеживания изменений
  useEffect(() => {
    const newRankings: Record<string, number> = {}
    sortedEntries.forEach(entry => {
      newRankings[entry.user.id] = entry.rank
    })
    setPreviousRankings(newRankings)
  }, [sortedEntries])
  
  // Находим текущего пользователя в рейтинге
  const currentUserEntry = useMemo(() => {
    // В реальном приложении здесь будет ID текущего пользователя
    const currentUserId = 'current-user' // TODO: получить из auth
    return sortedEntries.find(entry => entry.user.id === currentUserId)
  }, [sortedEntries])
  
  // Получаем топ-3 для отображения подиума
  const topThree = useMemo(() => {
    return sortedEntries.slice(0, 3)
  }, [sortedEntries])
  
  // Функция для обновления данных
  const refreshLeaderboard = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // В реальном приложении здесь будет API вызов
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Данные уже обновляются через useMemo
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки рейтинга')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Функция для получения позиции пользователя
  const getUserRank = (userId: string) => {
    const entry = sortedEntries.find(e => e.user.id === userId)
    return entry?.rank || null
  }
  
  // Функция для получения статистики рейтинга
  const getLeaderboardStats = () => {
    const totalUsers = sortedEntries.length
    const averageXp = totalUsers > 0 
      ? Math.round(sortedEntries.reduce((sum, entry) => sum + entry.xp, 0) / totalUsers)
      : 0
    const averageLevel = totalUsers > 0
      ? Math.round(sortedEntries.reduce((sum, entry) => sum + entry.level, 0) / totalUsers)
      : 0
    
    return {
      totalUsers,
      averageXp,
      averageLevel,
      topXp: sortedEntries[0]?.xp || 0,
      topLevel: Math.max(...sortedEntries.map(e => e.level))
    }
  }
  
  return {
    entries: sortedEntries,
    currentUserEntry,
    topThree,
    isLoading,
    error,
    refreshLeaderboard,
    getUserRank,
    getLeaderboardStats
  }
}

// Хук для получения рейтинга по конкретному критерию
export function useLeaderboardByMetric(metric: 'xp' | 'quests' | 'badges' | 'level') {
  const { entries } = useLeaderboard()
  
  const sortedByMetric = useMemo(() => {
    return [...entries].sort((a, b) => {
      switch (metric) {
        case 'xp':
          return b.xp - a.xp
        case 'quests':
          return b.questsCompleted - a.questsCompleted
        case 'badges':
          return b.badgeCount - a.badgeCount
        case 'level':
          return b.level - a.level
        default:
          return 0
      }
    }).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }))
  }, [entries, metric])
  
  return {
    entries: sortedByMetric,
    metric
  }
}