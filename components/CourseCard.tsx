'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  Play, 
  CheckCircle2,
  Award,
  TrendingUp,
  ExternalLink,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUI } from '@/domain/state/store'
import { publish } from '@/domain/eventBus'
import { createEvent } from '@/domain/events'

interface Course {
  id: string
  title: string
  description: string
  provider: string
  duration?: number // в минутах
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  targetSkills: string[]
  rating?: number
  studentsCount?: number
  cost?: {
    amount: number
    currency: string
  }
  isInternal: boolean
  thumbnailUrl?: string
  instructorName?: string
  categories: string[]
  completionRate?: number
}

interface CourseCardProps {
  course: Course
  isEnrolled?: boolean
  isCompleted?: boolean
  progress?: number
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export function CourseCard({ 
  course, 
  isEnrolled = false, 
  isCompleted = false,
  progress = 0,
  className = '',
  size = 'medium'
}: CourseCardProps) {
  const [isEnrolling, setIsEnrolling] = useState(false)
  const { showToast } = useUI()

  const difficultyLabels = {
    beginner: 'Начинающий',
    intermediate: 'Средний', 
    advanced: 'Продвинутый',
    expert: 'Эксперт'
  }

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-blue-100 text-blue-800',
    advanced: 'bg-purple-100 text-purple-800',
    expert: 'bg-orange-100 text-orange-800'
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Продолжительность не указана'
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours === 0) return `${remainingMinutes} мин`
    if (remainingMinutes === 0) return `${hours} ч`
    return `${hours} ч ${remainingMinutes} мин`
  }

  const formatPrice = (cost?: { amount: number; currency: string }) => {
    if (!cost || cost.amount === 0) return 'Бесплатно'
    
    const formatter = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: cost.currency || 'RUB'
    })
    
    return formatter.format(cost.amount)
  }

  const handleEnrollCourse = async () => {
    try {
      setIsEnrolling(true)

      // Показываем подтверждение для платных курсов
      if (course.cost && course.cost.amount > 0) {
        if (confirm(`Записаться на курс? Стоимость курса: ${formatPrice(course.cost)}. Вы уверены, что хотите записаться?`)) {
          await enrollInCourse()
        }
      } else {
        await enrollInCourse()
      }
    } catch (error) {
      console.error('Ошибка записи на курс:', error)
      showToast('error', 'Ошибка', 'Не удалось записаться на курс')
    } finally {
      setIsEnrolling(false)
    }
  }

  const enrollInCourse = async () => {
    // Получаем ID текущего пользователя (в реальном приложении из auth state)
    const userId = 'current-user-id' // TODO: получить из useAuth()

    // Публикуем событие записи на курс
    await publish(createEvent(
      'COURSE_ENROLLED',
      {
        userId,
        courseId: course.id,
        courseName: course.title,
        targetSkills: course.targetSkills,
        estimatedDuration: course.duration,
        source: 'manual'
      },
      userId
    ))

    showToast(
      'success',
      'Записались на курс! 🎉',
      `Вы успешно записались на курс "${course.title}"`
    )
  }

  const handleMarkComplete = async () => {
    if (confirm('Отметить курс как завершённый? Это действие создаст соответствующий квест и обновит ваши навыки.')) {
      try {
        const userId = 'current-user-id' // TODO: получить из useAuth()

        // Публикуем событие завершения курса
        await publish(createEvent(
          'COURSE_COMPLETED',
          {
            userId,
            courseId: course.id,
            courseName: course.title,
            completedAt: new Date(),
            skillGains: course.targetSkills.map(skillId => ({
              skillId,
              newLevel: 'intermediate' // В реальности это должно рассчитываться
            }))
          },
          userId
        ))

        showToast(
          'success', 
          'Курс завершен! 🏆',
          'Ваши навыки обновлены, начислен XP!'
        )
      } catch (error) {
        showToast('error', 'Ошибка', 'Не удалось отметить курс как завершённый')
      }
    }
  }

  const handleOpenCourse = () => {
    // В реальном приложении здесь будет переход к курсу
    showToast('info', 'Переход к курсу', 'Открытие платформы обучения...')
  }

  const cardSizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-lg'
  }

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-200 overflow-hidden group",
      cardSizeClasses[size],
      className
    )}>
      {/* Заголовок курса */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {course.description}
            </p>
            
            {/* Провайдер и инструктор */}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={course.isInternal ? 'default' : 'outline'} className="text-xs">
                {course.isInternal ? 'Внутренний' : course.provider}
              </Badge>
              {course.instructorName && (
                <span className="text-xs text-muted-foreground">
                  {course.instructorName}
                </span>
              )}
            </div>
          </div>

          <Badge className={difficultyColors[course.difficulty]}>
            {difficultyLabels[course.difficulty]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Прогресс для записанных курсов */}
        {isEnrolled && !isCompleted && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Прогресс:</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Статус завершения */}
        {isCompleted && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Курс завершен</span>
          </div>
        )}

        {/* Метрики курса */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDuration(course.duration)}</span>
          </div>
          
          {course.rating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{course.rating.toFixed(1)}</span>
            </div>
          )}
          
          {course.studentsCount && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{course.studentsCount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatPrice(course.cost)}</span>
          </div>
        </div>

        {/* Целевые навыки */}
        {course.targetSkills.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Развиваемые навыки:
            </div>
            <div className="flex flex-wrap gap-1">
              {course.targetSkills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {course.targetSkills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{course.targetSkills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Действия */}
        <div className="flex gap-2 pt-2">
          {!isEnrolled && !isCompleted && (
            <Button 
              onClick={handleEnrollCourse}
              disabled={isEnrolling}
              className="flex-1"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {isEnrolling ? 'Записываем...' : 'Записаться'}
            </Button>
          )}

          {isEnrolled && !isCompleted && (
            <>
              <Button 
                onClick={handleOpenCourse}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Продолжить
              </Button>
              
              {progress > 80 && (
                <Button 
                  onClick={handleMarkComplete}
                  variant="outline"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Завершить
                </Button>
              )}
            </>
          )}

          {isCompleted && (
            <Button 
              onClick={handleOpenCourse}
              variant="outline"
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Повторить
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Компактная версия для списков
export function CourseCardCompact({ course, isEnrolled, className }: {
  course: Course
  isEnrolled?: boolean
  className?: string
}) {
  const { showToast } = useUI()

  const handleQuickEnroll = async () => {
    try {
      const userId = 'current-user-id'
      
      await publish(createEvent(
        'COURSE_ENROLLED',
        {
          userId,
          courseId: course.id,
          courseName: course.title,
          targetSkills: course.targetSkills,
          source: 'quick_enroll'
        },
        userId
      ))

      showToast('success', 'Записались!', `Курс "${course.title}" добавлен в план обучения`)
    } catch (error) {
      showToast('error', 'Ошибка', 'Не удалось записаться на курс')
    }
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors",
      className
    )}>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium line-clamp-1">{course.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {course.provider}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDuration(course.duration)}
          </span>
        </div>
      </div>
      
      {!isEnrolled && (
        <Button size="sm" onClick={handleQuickEnroll}>
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Утилиты
const formatDuration = (minutes?: number) => {
  if (!minutes) return 'Не указано'
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 0) return `${remainingMinutes}м`
  if (remainingMinutes === 0) return `${hours}ч`
  return `${hours}ч ${remainingMinutes}м`
}
