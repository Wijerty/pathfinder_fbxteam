'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileCompleteness as ProfileCompletenessType } from '@/types'
import { CheckCircle2, AlertCircle, TrendingUp, Target, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProfile, useUI } from '@/domain/state/store'

interface ProfileCompletenessProps {
  onSectionClick?: (section: string) => void
  showDetails?: boolean
  className?: string
}

export function ProfileCompleteness({ 
  onSectionClick,
  showDetails = true,
  className = ''
}: ProfileCompletenessProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { profile } = useProfile()
  const { showToast } = useUI()
  
  // Получаем данные полноты профиля из store
  const completeness = profile?.completeness
  
  // Если нет данных профиля, показываем загрузку
  if (!completeness) {
    return (
      <Card className={cn("profile-progress", className)}>
        <CardHeader>
          <CardTitle>Полнота профиля</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Загрузка данных профиля...
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= completeness.threshold) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  const getStatusText = (percentage: number) => {
    if (percentage >= 90) return 'Отлично'
    if (percentage >= 70) return 'Хорошо'
    if (percentage >= 50) return 'Удовлетворительно'
    return 'Требует внимания'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const sectionLabels = {
    basicInfo: 'Основная информация',
    skills: 'Навыки',
    experience: 'Опыт работы',
    education: 'Образование',
    goals: 'Карьерные цели',
    preferences: 'Предпочтения'
  }

  const sectionIcons = {
    basicInfo: '👤',
    skills: '🛠️',
    experience: '💼',
    education: '🎓',
    goals: '🎯',
    preferences: '⚙️'
  }

  // Обработчик клика по разделу
  const handleSectionClick = async (section: string) => {
    if (onSectionClick) {
      onSectionClick(section)
    } else {
      // Показываем подсказку для улучшения раздела
      const sectionName = sectionLabels[section as keyof typeof sectionLabels]
      const percentage = completeness.sections[section as keyof typeof completeness.sections]
      
      if (percentage < 80) {
        showToast(
          'info',
          `Улучшите раздел "${sectionName}"`,
          `Текущий прогресс: ${percentage}%. Заполните дополнительную информацию для повышения рейтинга.`,
          {
            duration: 5000,
            actions: [{
              label: 'Перейти к редактированию',
              action: () => {
                // Здесь можно добавить навигацию к форме редактирования
                console.log(`Переход к редактированию раздела: ${section}`)
              }
            }]
          }
        )
      } else {
        showToast('success', 'Отличная работа!', `Раздел "${sectionName}" хорошо заполнен (${percentage}%)`)
      }
    }
  }

  // Функция для пересчета полноты профиля
  const handleRecalculate = async () => {
    try {
      // TODO: реализовать пересчет полноты профиля в store
      showToast('info', 'Информация', 'Полнота профиля обновляется автоматически')
    } catch (error) {
      showToast('error', 'Ошибка', 'Не удалось пересчитать полноту профиля')
    }
  }

  return (
    <Card className={cn("profile-progress", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Полнота профиля
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRecalculate}
              className="h-8 px-2 text-xs"
              title="Пересчитать полноту профиля"
            >
              🔄
            </Button>
            {getStatusIcon(completeness.overall)}
            <span className={cn("text-sm font-medium", getStatusColor(completeness.overall))}>
              {getStatusText(completeness.overall)}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {completeness.overall}%
            </span>
            <Badge 
              variant={completeness.overall >= completeness.threshold ? "default" : "outline"}
              className={completeness.overall >= completeness.threshold ? "bg-green-100 text-green-800" : ""}
            >
              Цель: {completeness.threshold}%
            </Badge>
          </div>
          
          <div className="relative">
            <Progress 
              value={completeness.overall} 
              className="h-3" 
            />
            <div 
              className="absolute top-0 h-3 w-0.5 bg-gray-400 opacity-60"
              style={{ left: `${completeness.threshold}%` }}
            />
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          {/* Секции профиля */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                Разделы профиля
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {isExpanded && (
              <div className="space-y-2">
                {Object.entries(completeness.sections).map(([section, percentage]) => (
                  <div 
                    key={section}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg transition-colors",
                      onSectionClick && "cursor-pointer hover:bg-muted"
                    )}
                    onClick={() => handleSectionClick(section)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {sectionIcons[section as keyof typeof sectionIcons]}
                      </span>
                      <span className="text-sm">
                        {sectionLabels[section as keyof typeof sectionLabels]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <span className={cn(
                        "text-sm font-medium w-8 text-right",
                        getStatusColor(percentage)
                      )}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Что нужно заполнить */}
          {completeness.missingFields.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Что нужно заполнить
              </h4>
              <div className="space-y-1">
                {completeness.missingFields.map((field, index) => (
                  <div 
                    key={index}
                    className="text-sm text-red-600 bg-red-50 p-2 rounded border-l-4 border-red-200"
                  >
                    {field}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Рекомендации */}
          {completeness.recommendations.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Рекомендации
              </h4>
              <div className="space-y-1">
                {completeness.recommendations.slice(0, 3).map((recommendation, index) => (
                  <div 
                    key={index}
                    className="text-sm text-blue-600 bg-blue-50 p-2 rounded border-l-4 border-blue-200"
                  >
                    {recommendation}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Прогресс к цели */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">До цели</span>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-lg font-bold">
              {Math.max(0, completeness.threshold - completeness.overall)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {completeness.overall >= completeness.threshold 
                ? 'Цель достигнута! 🎉' 
                : `Осталось ${Math.max(0, completeness.threshold - completeness.overall)}% до цели`
              }
            </div>
          </div>

          {/* Время последнего обновления */}
          <div className="text-xs text-muted-foreground text-center mt-4">
            Обновлено: {completeness.lastCalculatedAt.toLocaleString('ru-RU')}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Компактная версия для дашборда
interface ProfileCompletenessCompactProps {
  onClick?: () => void
  className?: string
}

export function ProfileCompletenessCompact({ 
  onClick,
  className = ''
}: ProfileCompletenessCompactProps) {
  const { profile } = useProfile()
  const completeness = profile?.completeness
  
  if (!completeness) {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-muted rounded-lg", className)}>
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      </div>
    )
  }
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-blue-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= completeness.threshold) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 bg-muted rounded-lg transition-colors",
        onClick && "cursor-pointer hover:bg-muted/80",
        className
      )}
      onClick={onClick}
    >
      {getStatusIcon(completeness.overall)}
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Полнота профиля</span>
          <span className={cn("text-sm font-bold", getStatusColor(completeness.overall))}>
            {completeness.overall}%
          </span>
        </div>
        <Progress value={completeness.overall} className="h-2" />
      </div>

      {completeness.missingFields.length > 0 && (
        <Badge variant="outline" className="text-xs">
          {completeness.missingFields.length} задач
        </Badge>
      )}
    </div>
  )
}

// Индикатор для навигации
interface ProfileCompletenessIndicatorProps {
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

export function ProfileCompletenessIndicator({ 
  size = 'md',
  showPercentage = true,
  className = ''
}: ProfileCompletenessIndicatorProps) {
  const { profile } = useProfile()
  const completeness = profile?.completeness
  
  if (!completeness) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("rounded-full border-2 flex items-center justify-center", 
          size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10')}>
          ?
        </div>
      </div>
    )
  }
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 border-green-600'
    if (percentage >= 70) return 'text-blue-600 border-blue-600'
    if (percentage >= 50) return 'text-yellow-600 border-yellow-600'
    return 'text-red-600 border-red-600'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "rounded-full border-2 flex items-center justify-center font-bold",
          sizeClasses[size],
          textSizes[size],
          getStatusColor(completeness.overall)
        )}
      >
        {showPercentage ? `${completeness.overall}%` : (
          completeness.overall >= completeness.threshold ? '✓' : '!'
        )}
      </div>
      
      {size !== 'sm' && (
        <div className="text-xs text-muted-foreground">
          {completeness.overall >= completeness.threshold 
            ? 'Профиль заполнен' 
            : `До цели: ${completeness.threshold - completeness.overall}%`
          }
        </div>
      )}
    </div>
  )
}
