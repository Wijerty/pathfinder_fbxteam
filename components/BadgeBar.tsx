'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { UserBadge, Badge as BadgeType } from '@/types'
import { profileLevels } from '@/config/gamification'
import { 
  Award, 
  Star, 
  TrendingUp, 
  Zap, 
  Crown,
  ChevronRight,
  Trophy,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BadgeBarProps {
  userBadges: UserBadge[]
  allBadges: BadgeType[]
  userXP: number
  userLevel: number
  className?: string
  onBadgeClick?: (badge: BadgeType) => void
}

export function BadgeBar({ 
  userBadges, 
  allBadges, 
  userXP, 
  userLevel,
  className = '',
  onBadgeClick
}: BadgeBarProps) {
  const [showAll, setShowAll] = useState(false)

  const currentLevelInfo = profileLevels.find(l => l.level === userLevel)
  const nextLevelInfo = profileLevels.find(l => l.level === userLevel + 1)
  
  const xpToNextLevel = nextLevelInfo ? nextLevelInfo.xpRequired - userXP : 0
  const xpProgress = currentLevelInfo && nextLevelInfo 
    ? ((userXP - currentLevelInfo.xpRequired) / (nextLevelInfo.xpRequired - currentLevelInfo.xpRequired)) * 100
    : 100

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      uncommon: 'border-green-300 bg-green-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityTextColor = (rarity: string) => {
    const colors = {
      common: 'text-gray-700',
      uncommon: 'text-green-700',
      rare: 'text-blue-700',
      epic: 'text-purple-700',
      legendary: 'text-yellow-700'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getBadgeTypeIcon = (type: string) => {
    const icons = {
      skill: <Star className="h-3 w-3" />,
      achievement: <Trophy className="h-3 w-3" />,
      milestone: <Target className="h-3 w-3" />,
      special: <Crown className="h-3 w-3" />
    }
    return icons[type as keyof typeof icons] || <Award className="h-3 w-3" />
  }

  const earnedBadgeIds = userBadges.map(ub => ub.badgeId)
  const earnedBadges = allBadges.filter(badge => earnedBadgeIds.includes(badge.id))
  const displayedBadges = showAll ? earnedBadges : earnedBadges.slice(0, 6)

  const formatXP = (xp: number) => {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}k`
    }
    return xp.toString()
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Достижения
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-600">
              {earnedBadges.length} бейджей
            </Badge>
          </div>
        </div>

        {/* Уровень и XP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: currentLevelInfo?.color }}
              >
                {userLevel}
              </div>
              <div>
                <div className="font-semibold">
                  {currentLevelInfo?.title || 'Начинающий'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatXP(userXP)} XP
                </div>
              </div>
            </div>
            
            {nextLevelInfo && (
              <div className="text-right">
                <div className="text-sm font-medium">
                  До {nextLevelInfo.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatXP(xpToNextLevel)} XP
                </div>
              </div>
            )}
          </div>

          {nextLevelInfo && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  Прогресс до следующего уровня
                </span>
                <span className="text-xs font-medium">
                  {Math.round(xpProgress)}%
                </span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Заработанные бейджи */}
          {earnedBadges.length > 0 ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {displayedBadges.map((badge) => {
                  const userBadge = userBadges.find(ub => ub.badgeId === badge.id)
                  return (
                    <div
                      key={badge.id}
                      className={cn(
                        "relative p-3 rounded-lg border-2 transition-all cursor-pointer hover:scale-105",
                        getRarityColor(badge.rarity),
                        "group"
                      )}
                      onClick={() => onBadgeClick?.(badge)}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <div className={cn(
                          "text-xs font-medium truncate",
                          getRarityTextColor(badge.rarity)
                        )}>
                          {badge.name}
                        </div>
                        
                        {userBadge?.level && userBadge.level > 1 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {userBadge.level}
                          </div>
                        )}
                        
                        <div className="absolute -top-1 -left-1">
                          {getBadgeTypeIcon(badge.type)}
                        </div>
                      </div>

                      {/* Tooltip на ховер */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        {badge.description}
                        <br />
                        <span className="text-yellow-300">+{badge.xpReward} XP</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {earnedBadges.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full"
                >
                  {showAll ? 'Скрыть' : `Показать ещё ${earnedBadges.length - 6}`}
                  <ChevronRight className={cn(
                    "h-4 w-4 ml-1 transition-transform",
                    showAll && "rotate-90"
                  )} />
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Пока нет бейджей</p>
              <p className="text-sm">Выполняйте квесты и развивайте навыки</p>
            </div>
          )}

          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {earnedBadges.filter(b => b.rarity === 'rare' || b.rarity === 'epic' || b.rarity === 'legendary').length}
              </div>
              <div className="text-xs text-muted-foreground">
                Редких бейджей
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {earnedBadges.reduce((sum, badge) => sum + badge.xpReward, 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                XP от бейджей
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Компактная версия для дашборда
interface BadgeBarCompactProps {
  userBadges: UserBadge[]
  allBadges: BadgeType[]
  userXP: number
  userLevel: number
  onClick?: () => void
  className?: string
}

export function BadgeBarCompact({ 
  userBadges, 
  allBadges, 
  userXP, 
  userLevel,
  onClick,
  className = ''
}: BadgeBarCompactProps) {
  const currentLevelInfo = profileLevels.find(l => l.level === userLevel)
  const earnedBadgeIds = userBadges.map(ub => ub.badgeId)
  const earnedBadges = allBadges.filter(badge => earnedBadgeIds.includes(badge.id))
  const recentBadges = earnedBadges.slice(-3)

  const formatXP = (xp: number) => {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}k`
    }
    return xp.toString()
  }

  return (
    <div 
      className={cn(
        "p-4 bg-muted rounded-lg transition-colors",
        onClick && "cursor-pointer hover:bg-muted/80",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          <span className="font-medium">Достижения</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: currentLevelInfo?.color }}
          >
            {userLevel}
          </div>
          <span className="text-sm text-muted-foreground">
            {formatXP(userXP)} XP
          </span>
        </div>
      </div>

      {earnedBadges.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Нет бейджей
        </p>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {recentBadges.map((badge) => (
              <div
                key={badge.id}
                className="w-8 h-8 rounded border-2 border-yellow-300 bg-yellow-50 flex items-center justify-center text-sm"
                title={badge.name}
              >
                {badge.icon}
              </div>
            ))}
            {earnedBadges.length > 3 && (
              <div className="w-8 h-8 rounded border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-muted-foreground">
                +{earnedBadges.length - 3}
              </div>
            )}
          </div>
          
          <Badge variant="outline" className="text-xs">
            {earnedBadges.length} бейджей
          </Badge>
        </div>
      )}
    </div>
  )
}

// Индикатор нового бейджа
interface BadgeEarnedNotificationProps {
  badge: BadgeType
  onClose?: () => void
  className?: string
}

export function BadgeEarnedNotification({ 
  badge, 
  onClose,
  className = ''
}: BadgeEarnedNotificationProps) {
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-gray-300 bg-gray-50',
      uncommon: 'border-green-300 bg-green-50',
      rare: 'border-blue-300 bg-blue-50',
      epic: 'border-purple-300 bg-purple-50',
      legendary: 'border-yellow-300 bg-yellow-50'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-lg border-2 shadow-lg animate-in slide-in-from-right-full",
      getRarityColor(badge.rarity),
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="text-3xl">{badge.icon}</div>
        <div>
          <div className="font-bold text-lg">Новый бейдж!</div>
          <div className="font-medium">{badge.name}</div>
          <div className="text-sm text-muted-foreground">{badge.description}</div>
          <div className="text-sm font-medium text-green-600">
            +{badge.xpReward} XP
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>
    </div>
  )
}
