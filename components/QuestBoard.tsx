'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useGamification, useUI } from '@/domain/state/store'
import { Quest, UserQuest, QuestStatus } from '@/types'
import { getGamificationService } from '@/services'
import { 
  Trophy, 
  Clock, 
  Star, 
  Target, 
  CheckCircle2, 
  Play, 
  Calendar,
  Zap,
  Gift,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestBoardProps {
  onQuestStart?: (questId: string) => void
  onQuestProgress?: (questId: string) => void
  className?: string
}

export function QuestBoard({ 
  onQuestStart,
  onQuestProgress,
  className = ''
}: QuestBoardProps) {
  const [selectedTab, setSelectedTab] = useState<'active' | 'available' | 'completed'>('active')
  
  const { 
    activeQuests, 
    acceptQuest, 
    completeQuest
  } = useGamification()
  
  const { showToast } = useUI()

  // TODO: получать эти данные из store после реализации
  const completedQuests: any[] = []
  const availableQuests: any[] = []
  const recommendedQuests = availableQuests.slice(0, 3)

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800',
      expert: 'bg-purple-100 text-purple-800'
    }
    return colors[difficulty as keyof typeof colors] || colors.easy
  }

  const getQuestTypeIcon = (type: string) => {
    const icons = {
      skill_development: <TrendingUp className="h-4 w-4" />,
      profile_completion: <Target className="h-4 w-4" />,
      learning: <Star className="h-4 w-4" />,
      social: <Trophy className="h-4 w-4" />,
      achievement: <Gift className="h-4 w-4" />
    }
    return icons[type as keyof typeof icons] || <Target className="h-4 w-4" />
  }

  const calculateQuestProgress = (userQuest: UserQuest) => {
    const totalRequirements = userQuest.progress.length
    const completedRequirements = userQuest.progress.filter(p => p.isCompleted).length
    return totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0
  }

  const formatTimeLeft = (expiresAt?: Date) => {
    if (!expiresAt) return null
    
    const now = new Date()
    const timeLeft = expiresAt.getTime() - now.getTime()
    
    if (timeLeft <= 0) return 'Истекло'
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}д ${hours}ч`
    if (hours > 0) return `${hours}ч`
    return 'Менее часа'
  }

  const handleStartQuest = async (questId: string) => {
    try {
      await acceptQuest(questId)
      onQuestStart?.(questId)
      showToast('success', 'Квест принят!', 'Квест добавлен в ваш список активных заданий')
    } catch (error) {
      console.error('Ошибка принятия квеста:', error)
      showToast('error', 'Ошибка', 'Не удалось принять квест')
    }
  }

  const handleQuestClick = (questId: string) => {
    onQuestProgress?.(questId)
  }

  const handleCompleteQuest = async (questId: string) => {
    try {
      // Показываем подтверждение перед завершением
      const quest = activeQuests.find(q => q.questId === questId)
      if (!quest) return

      if (confirm('Завершить квест? Вы уверены, что выполнили все требования этого квеста?')) {
        try {
          await completeQuest(questId)
          onQuestProgress?.(questId)
          showToast('success', 'Квест завершен! 🎉', 'Поздравляем с выполнением квеста!')
        } catch (error) {
          showToast('error', 'Ошибка', 'Не удалось завершить квест')
        }
      }
    } catch (error) {
      console.error('Ошибка завершения квеста:', error)
    }
  }

  const renderActiveQuest = (userQuest: UserQuest) => {
    const quest = availableQuests.find(q => q.id === userQuest.questId)
    if (!quest) return null

    const progress = calculateQuestProgress(userQuest)
    const timeLeft = formatTimeLeft(userQuest.expiresAt)

    return (
      <Card 
        key={userQuest.questId}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleQuestClick(userQuest.questId)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {getQuestTypeIcon(quest.type)}
              </div>
              <div>
                <CardTitle className="text-base">{quest.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {quest.description}
                </p>
              </div>
            </div>
            <Badge className={getDifficultyColor(quest.difficulty)}>
              {quest.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Прогресс */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Прогресс</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Требования */}
            <div className="space-y-1">
              {userQuest.progress.map((req, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {req.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-muted rounded-full" />
                    )}
                    <span className={req.isCompleted ? 'line-through text-muted-foreground' : ''}>
                      {quest.requirements[index]?.type === 'skill_level' && 'Повысить навык'}
                      {quest.requirements[index]?.type === 'complete_course' && 'Завершить курс'}
                      {quest.requirements[index]?.type === 'get_endorsement' && 'Получить endorsement'}
                      {quest.requirements[index]?.type === 'update_profile' && 'Обновить профиль'}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {req.currentValue}/{req.requiredValue}
                  </span>
                </div>
              ))}
            </div>

            {/* Время и награды */}
            <div className="flex items-center justify-between pt-2 border-t">
              {timeLeft && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{timeLeft}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {quest.rewards.map((reward: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {reward.type === 'xp' && `+${reward.value} XP`}
                    {reward.type === 'badge' && '🏆 Бейдж'}
                    {reward.type === 'skill_boost' && '⚡ Буст'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Кнопка завершения если все требования выполнены */}
            {progress === 100 && (
              <div className="pt-3 border-t">
                <Button 
                  onClick={() => handleCompleteQuest(userQuest.questId)}
                  className="w-full"
                  size="sm"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Завершить квест
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAvailableQuest = (quest: Quest) => {
    return (
      <Card key={quest.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {getQuestTypeIcon(quest.type)}
              </div>
              <div>
                <CardTitle className="text-base">{quest.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {quest.description}
                </p>
              </div>
            </div>
            <Badge className={getDifficultyColor(quest.difficulty)}>
              {quest.difficulty}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Требования */}
            <div className="space-y-1">
              <span className="text-sm font-medium">Требования:</span>
              {quest.requirements.map((req, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {req.type === 'skill_level' && `Достичь уровня ${req.requiredValue} в навыке`}
                  • {req.type === 'complete_course' && 'Завершить обучающий курс'}
                  • {req.type === 'get_endorsement' && `Получить ${req.requiredValue} endorsements`}
                  • {req.type === 'update_profile' && 'Обновить разделы профиля'}
                </div>
              ))}
            </div>

            {/* Награды и действия */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                {quest.rewards.map((reward: any, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {reward.type === 'xp' && `+${reward.value} XP`}
                    {reward.type === 'badge' && '🏆 Бейдж'}
                    {reward.type === 'skill_boost' && '⚡ Буст'}
                  </Badge>
                ))}
              </div>
              <Button 
                size="sm" 
                onClick={() => handleStartQuest(quest.id)}
                className="flex items-center gap-1"
              >
                <Play className="h-3 w-3" />
                Начать
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCompletedQuest = (userQuest: UserQuest) => {
    const quest = availableQuests.find(q => q.id === userQuest.questId)
    if (!quest) return null

    return (
      <Card key={userQuest.questId} className="opacity-80">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">{quest.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Завершено {userQuest.completedAt?.toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              Завершено
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Получено:
            </span>
            <div className="flex items-center gap-2">
              {quest.rewards.map((reward: any, index: number) => (
                <Badge key={index} variant="outline" className="text-xs bg-green-50">
                  {reward.type === 'xp' && `+${reward.value} XP`}
                  {reward.type === 'badge' && '🏆 Бейдж'}
                  {reward.type === 'skill_boost' && '⚡ Буст'}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Квесты
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeQuests.length > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600">
                {activeQuests.length} активных
              </Badge>
            )}
            {availableQuests.length > 0 && (
              <Badge variant="outline">
                {availableQuests.length} доступных
              </Badge>
            )}
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={selectedTab === 'active' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('active')}
            className="flex-1"
          >
            Активные ({activeQuests.length})
          </Button>
          <Button
            variant={selectedTab === 'available' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('available')}
            className="flex-1"
          >
            Доступные ({availableQuests.length})
          </Button>
          <Button
            variant={selectedTab === 'completed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('completed')}
            className="flex-1"
          >
            Завершённые ({completedQuests.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {selectedTab === 'active' && (
            <>
              {activeQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Нет активных квестов</p>
                  <p className="text-sm">Выберите квест из доступных для начала</p>
                </div>
              ) : (
                activeQuests.map(renderActiveQuest)
              )}
            </>
          )}

          {selectedTab === 'available' && (
            <>
              {availableQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Нет доступных квестов</p>
                  <p className="text-sm">Новые квесты появятся позже</p>
                </div>
              ) : (
                availableQuests.map(renderAvailableQuest)
              )}
            </>
          )}

          {selectedTab === 'completed' && (
            <>
              {completedQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Нет завершённых квестов</p>
                  <p className="text-sm">Завершите квесты для получения наград</p>
                </div>
              ) : (
                completedQuests.map(renderCompletedQuest)
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Компактная версия для дашборда
interface QuestBoardCompactProps {
  userQuests: UserQuest[]
  onClick?: () => void
  className?: string
}

export function QuestBoardCompact({ 
  userQuests, 
  onClick,
  className = ''
}: QuestBoardCompactProps) {
  const activeQuests = userQuests.filter(q => q.status === 'active')
  const recentCompleted = userQuests
    .filter(q => q.status === 'completed')
    .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
    .slice(0, 2)

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
          <Trophy className="h-4 w-4" />
          <span className="font-medium">Квесты</span>
        </div>
        {activeQuests.length > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-600">
            {activeQuests.length} активных
          </Badge>
        )}
      </div>

      {activeQuests.length === 0 && recentCompleted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Нет активных квестов
        </p>
      ) : (
        <div className="space-y-2">
          {activeQuests.slice(0, 2).map((quest, index) => (
            <div key={quest.questId} className="text-sm">
              <div className="flex items-center justify-between">
                <span>Квест #{index + 1}</span>
                <span className="text-muted-foreground">В процессе</span>
              </div>
            </div>
          ))}
          
          {recentCompleted.map((quest, index) => (
            <div key={quest.questId} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-600">Квест завершён</span>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
