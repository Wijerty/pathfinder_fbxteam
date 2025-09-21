'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AIRecommendation, SkillLevel } from '@/types'
import { baseRoles } from '@/config/roles'
import { allMockSkills } from '@/mocks'
import { TextToSpeech } from './VoiceToggle'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Star, 
  ChevronRight,
  Brain,
  Lightbulb,
  MapPin,
  Zap,
  Users,
  BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoleRecommendationsProps {
  recommendations: AIRecommendation[]
  onRecommendationClick?: (recommendation: AIRecommendation) => void
  onAddToQuest?: (skillId: string) => void
  className?: string
}

export function RoleRecommendations({ 
  recommendations, 
  onRecommendationClick,
  onAddToQuest,
  className = ''
}: RoleRecommendationsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const roleRecommendations = recommendations.filter(r => r.type === 'role')
  const skillRecommendations = recommendations.filter(r => r.type === 'skill')
  const learningRecommendations = recommendations.filter(r => r.type === 'learning')

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-100'
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getPriorityIcon = (priority: string) => {
    const icons = {
      critical: <Zap className="h-4 w-4 text-red-600" />,
      high: <TrendingUp className="h-4 w-4 text-orange-600" />,
      medium: <Target className="h-4 w-4 text-blue-600" />,
      low: <Clock className="h-4 w-4 text-gray-600" />
    }
    return icons[priority as keyof typeof icons] || icons.medium
  }

  const getRecommendationIcon = (type: string) => {
    const icons = {
      role: <Users className="h-5 w-5" />,
      skill: <Star className="h-5 w-5" />,
      learning: <BookOpen className="h-5 w-5" />,
      career_path: <MapPin className="h-5 w-5" />
    }
    return icons[type as keyof typeof icons] || <Lightbulb className="h-5 w-5" />
  }

  const getRoleInfo = (roleId: string) => {
    return baseRoles.find(role => 
      role.title.toLowerCase().includes(roleId.toLowerCase()) ||
      roleId.toLowerCase().includes(role.title.toLowerCase())
    )
  }

  const getSkillInfo = (skillId: string) => {
    return allMockSkills.find(skill => 
      skill.id === skillId || 
      skill.name.toLowerCase().includes(skillId.toLowerCase()) ||
      skillId.toLowerCase().includes(skill.name.toLowerCase())
    )
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const renderRoleRecommendation = (rec: AIRecommendation) => {
    const roleInfo = getRoleInfo(rec.targetId)
    const isExpanded = expandedId === rec.id

    return (
      <Card 
        key={rec.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => toggleExpanded(rec.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {getRecommendationIcon(rec.type)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{rec.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {rec.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityIcon(rec.priority)}
              <Badge className={getConfidenceColor(rec.confidence)}>
                {formatConfidence(rec.confidence)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Краткая информация о роли */}
            {roleInfo && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Отдел:</span>
                <Badge variant="outline">{roleInfo.department}</Badge>
              </div>
            )}

            {/* Обоснование */}
            {rec.reasoning.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Почему эта роль подходит:</h5>
                <ul className="space-y-1">
                  {rec.reasoning.slice(0, isExpanded ? undefined : 2).map((reason, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                {!isExpanded && rec.reasoning.length > 2 && (
                  <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-blue-600">
                    Показать ещё {rec.reasoning.length - 2} причин
                  </Button>
                )}
              </div>
            )}

            {/* Расширенная информация */}
            {isExpanded && roleInfo && (
              <div className="space-y-3 border-t pt-3">
                <div>
                  <h5 className="text-sm font-medium mb-2">Ключевые обязанности:</h5>
                  <ul className="space-y-1">
                    {roleInfo.responsibilities.slice(0, 3).map((resp, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {resp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-2">Требуемые навыки:</h5>
                  <div className="flex flex-wrap gap-1">
                    {roleInfo.requiredSkills.slice(0, 5).map((skill, index) => {
                      const skillInfo = allMockSkills.find(s => s.id === skill.skillId)
                      return (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skillInfo?.name || skill.skillId}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {roleInfo.salaryRange && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Зарплатная вилка:</span>
                    <span className="font-medium">
                      {roleInfo.salaryRange.min.toLocaleString()} - {roleInfo.salaryRange.max.toLocaleString()} ₽
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRecommendationClick?.(rec)
                }}
              >
                Подробнее
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
              
              <TextToSpeech
                text={`Рекомендация: ${rec.title}. ${rec.description}. ${rec.reasoning.join('. ')}`}
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderSkillRecommendation = (rec: AIRecommendation) => {
    const skillInfo = getSkillInfo(rec.targetId)
    const skillsMatch = rec.metadata?.skillsMatch || 0

    return (
      <Card key={rec.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                {getRecommendationIcon(rec.type)}
              </div>
              <div>
                <CardTitle className="text-base">{rec.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {rec.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityIcon(rec.priority)}
              <Badge className={getConfidenceColor(rec.confidence)}>
                {formatConfidence(rec.confidence)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {skillInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Категория:</span>
                  <Badge variant="outline">{skillInfo.category}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Важность:</span>
                  <div className="flex items-center gap-2">
                    <Progress value={skillsMatch} className="w-16 h-2" />
                    <span className="text-xs">{skillsMatch}%</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h5 className="text-sm font-medium mb-2">Преимущества развития:</h5>
              <ul className="space-y-1">
                {rec.reasoning.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddToQuest?.(rec.targetId)}
              >
                Добавить в план
                <Target className="h-3 w-3 ml-1" />
              </Button>
              
              <TextToSpeech
                text={`Рекомендация по навыку: ${rec.title}. ${rec.description}`}
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderLearningRecommendation = (rec: AIRecommendation) => {
    return (
      <Card key={rec.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                {getRecommendationIcon(rec.type)}
              </div>
              <div>
                <CardTitle className="text-base">{rec.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {rec.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getPriorityIcon(rec.priority)}
              <Badge className={getConfidenceColor(rec.confidence)}>
                {formatConfidence(rec.confidence)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-medium mb-2">Рекомендуемые действия:</h5>
              <ul className="space-y-1">
                {rec.reasoning.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRecommendationClick?.(rec)}
              >
                Начать обучение
                <BookOpen className="h-3 w-3 ml-1" />
              </Button>
              
              <TextToSpeech
                text={`Рекомендация по обучению: ${rec.title}. ${rec.description}`}
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">Нет активных рекомендаций</p>
          <p className="text-sm text-muted-foreground">
            Обновите профиль для получения персональных советов
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          ИИ Рекомендации
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Роли */}
          {roleRecommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Подходящие роли ({roleRecommendations.length})
              </h4>
              <div className="space-y-3">
                {roleRecommendations.map(renderRoleRecommendation)}
              </div>
            </div>
          )}

          {/* Навыки */}
          {skillRecommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Навыки для развития ({skillRecommendations.length})
              </h4>
              <div className="space-y-3">
                {skillRecommendations.map(renderSkillRecommendation)}
              </div>
            </div>
          )}

          {/* Обучение */}
          {learningRecommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Обучение и курсы ({learningRecommendations.length})
              </h4>
              <div className="space-y-3">
                {learningRecommendations.map(renderLearningRecommendation)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
