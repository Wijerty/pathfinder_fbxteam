'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { User, UserBadge } from '@/types'
import { profileLevels } from '@/config/gamification'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  TrendingUp,
  Users,
  Star,
  Zap,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  user: User
  xp: number
  level: number
  badgeCount: number
  questsCompleted: number
  rank: number
  rankChange?: number // Изменение позиции (+1, -1, 0)
}

interface LeaderboardProps {
  currentUserId?: string
  timeframe?: 'week' | 'month' | 'all'
  onTimeframeChange?: (timeframe: 'week' | 'month' | 'all') => void
  className?: string
  showCompact?: boolean
}

export function Leaderboard({ 
  currentUserId,
  timeframe = 'all',
  onTimeframeChange,
  className = '',
  showCompact = false
}: LeaderboardProps) {
  const [showAll, setShowAll] = useState(false)
  const { entries, isLoading, error, refreshLeaderboard } = useLeaderboard({ timeframe, includeCurrentUser: true })
  
  const displayedEntries = showAll ? entries : entries?.slice(0, 10) || []
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>
    }
  }
  
  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) {
      return <Minus className="h-3 w-3 text-gray-400" />
    }
    if (change > 0) {
      return <ChevronUp className="h-3 w-3 text-green-500" />
    }
    return <ChevronDown className="h-3 w-3 text-red-500" />
  }
  
  const getLevelInfo = (level: number) => {
    return profileLevels.find(l => l.level === level)
  }
  
  const formatXP = (xp: number) => {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`
    }
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}k`
    }
    return xp.toString()
  }
  
  const getTimeframeLabel = (tf: string) => {
    const labels = {
      week: 'Неделя',
      month: 'Месяц', 
      all: 'Все время'
    }
    return labels[tf as keyof typeof labels] || 'Все время'
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Рейтинг пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p>Загрузка рейтинга...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Рейтинг пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Ошибка загрузки рейтинга: {error}</p>
            <Button onClick={refreshLeaderboard} className="mt-2" variant="outline">
              Попробовать снова
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Рейтинг пользователей
          </CardTitle>
          
          {onTimeframeChange && (
            <div className="flex gap-1">
              {(['week', 'month', 'all'] as const).map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimeframeChange(tf)}
                >
                  {getTimeframeLabel(tf)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {displayedEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Пока нет данных для рейтинга</p>
          </div>
        ) : (
          <>
            {displayedEntries.map((entry, index) => {
              const isCurrentUser = entry.user.id === currentUserId
              const levelInfo = getLevelInfo(entry.level)
              
              return (
                <div
                  key={entry.user.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    isCurrentUser 
                      ? "bg-blue-50 border-blue-200" 
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100",
                    entry.rank <= 3 && "ring-2 ring-yellow-200"
                  )}
                >
                  {/* Ранг */}
                  <div className="flex items-center gap-2 min-w-[60px]">
                    {getRankIcon(entry.rank)}
                    {getRankChangeIcon(entry.rankChange)}
                  </div>
                  
                  {/* Аватар и имя */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {entry.user.firstName[0]}{entry.user.lastName[0]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={cn(
                          "font-medium truncate",
                          isCurrentUser && "text-blue-700"
                        )}>
                          {entry.user.displayName}
                        </h4>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">
                            Вы
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{entry.user.department}</span>
                        {levelInfo && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {levelInfo.title}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Статистика */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">
                        {formatXP(entry.xp)}
                      </div>
                      <div className="text-gray-500">XP</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {entry.questsCompleted}
                      </div>
                      <div className="text-gray-500">Квестов</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">
                        {entry.badgeCount}
                      </div>
                      <div className="text-gray-500">Бейджей</div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {entries.length > 10 && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? 'Показать меньше' : `Показать еще ${entries.length - 10}`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Компактная версия для отображения в других местах
interface LeaderboardCompactProps {
  currentUserId?: string
  limit?: number
  onClick?: () => void
  className?: string
  timeframe?: 'week' | 'month' | 'all'
}

export function LeaderboardCompact({ 
  currentUserId,
  limit = 5,
  onClick,
  className = '',
  timeframe = 'all'
}: LeaderboardCompactProps) {
  const { entries, isLoading, error } = useLeaderboard({ timeframe, limit, includeCurrentUser: true })
  const topEntries = entries?.slice(0, limit) || []
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />
      default:
        return <span className="text-xs font-bold text-gray-500">#{rank}</span>
    }
  }
  
  const formatXP = (xp: number) => {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}k`
    }
    return xp.toString()
  }

  if (isLoading) {
    return (
      <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", className)} onClick={onClick}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Топ рейтинга
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm">Загрузка...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", className)} onClick={onClick}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Топ рейтинга
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500">
            <p className="text-sm">Ошибка загрузки</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", className)} onClick={onClick}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Топ игроков
          </div>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {topEntries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            Нет данных
          </p>
        ) : (
          topEntries.map((entry) => {
            const isCurrentUser = entry.user.id === currentUserId
            
            return (
              <div
                key={entry.user.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded transition-colors",
                  isCurrentUser ? "bg-blue-50" : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2 min-w-[40px]">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                  {entry.user.firstName[0]}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium truncate",
                    isCurrentUser && "text-blue-700"
                  )}>
                    {entry.user.displayName}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {formatXP(entry.xp)} XP
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}