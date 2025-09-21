'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus, Search, TrendingUp, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProfile, useTaxonomy, useUI, useSkillsData } from '@/domain/state/store'
import { SkillLevel } from '@/types'

interface SkillAdderProps {
  className?: string
}

export function SkillAdder({ className = '' }: SkillAdderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('beginner')
  const [isAdding, setIsAdding] = useState(false)

  const { addSkill, isLoading } = useProfile()
  const { skills } = useTaxonomy()
  const { showToast } = useUI()
  const { availableSkills, userSkills } = useSkillsData()

  // Фильтруем навыки по поисковому запросу
  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Топ рекомендованных навыков (основные + популярные)
  const recommendedSkills = availableSkills
    .filter(skill => skill.isCore)
    .slice(0, 6)

  const levelLabels = {
    beginner: 'Начинающий',
    intermediate: 'Средний',
    advanced: 'Продвинутый',
    expert: 'Эксперт'
  }

  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-blue-100 text-blue-800',
    advanced: 'bg-purple-100 text-purple-800',
    expert: 'bg-orange-100 text-orange-800'
  }

  const handleAddSkill = async (skillId: string) => {
    try {
      setIsAdding(true)
      
      await addSkill({
        skillId,
        level: selectedLevel,
        yearsOfExperience: 0,
        endorsements: 0,
        selfAssessed: true,
        verifiedBy: []
      })

      const skillInfo = skills.find(s => s.id === skillId)
      showToast(
        'success',
        'Навык добавлен! 🎉',
        `Навык "${skillInfo?.name}" добавлен с уровнем ${levelLabels[selectedLevel]}`
      )

      // Очищаем поиск
      setSearchQuery('')
    } catch (error) {
      console.error('Ошибка добавления навыка:', error)
      showToast('error', 'Ошибка', 'Не удалось добавить навык')
    } finally {
      setIsAdding(false)
    }
  }

  const getSkillCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'programming': '💻',
      'data-science': '📊',
      'devops': '⚙️',
      'security': '🔒',
      'mobile': '📱',
      'web': '🌐',
      'ai-ml': '🤖',
      'databases': '🗄️',
      'cloud': '☁️',
      'leadership': '👑',
      'communication': '💬',
      'design': '🎨'
    }
    return icons[category] || '🛠️'
  }

  const renderSkillCard = (skill: any) => (
    <Card key={skill.id} className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {getSkillCategoryIcon(skill.category)}
            </div>
            <div>
              <h4 className="font-medium group-hover:text-blue-600 transition-colors">
                {skill.name}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {skill.description}
              </p>
            </div>
          </div>
          {skill.isCore && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Award className="h-3 w-3 mr-1" />
              Core
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {skill.category}
          </Badge>
          <Button
            size="sm"
            onClick={() => handleAddSkill(skill.id)}
            disabled={isAdding || isLoading}
            className="group-hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Заголовок и статистика */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Добавить навыки
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              У вас: {userSkills.length} навыков
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Поиск навыков */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Найти навык (например, React, Python, Leadership...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Выбор уровня */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ваш уровень:</label>
            <div className="flex gap-2">
              {Object.entries(levelLabels).map(([level, label]) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLevel(level as SkillLevel)}
                  className={selectedLevel === level ? '' : 'hover:bg-muted'}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Рекомендованные навыки */}
      {!searchQuery && recommendedSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Рекомендованные навыки
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ключевые навыки для развития в вашей области
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedSkills.map(renderSkillCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Результаты поиска */}
      {searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Результаты поиска
              {filteredSkills.length > 0 && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({filteredSkills.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {filteredSkills.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium mb-2">Навыков не найдено</h3>
                <p className="text-muted-foreground mb-4">
                  Попробуйте изменить поисковый запрос или обратитесь к администратору для добавления нового навыка.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Показать рекомендованные
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.slice(0, 12).map(renderSkillCard)}
              </div>
            )}
            
            {filteredSkills.length > 12 && (
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Показано 12 из {filteredSkills.length} навыков. Уточните поиск для лучших результатов.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Пустое состояние если нет навыков */}
      {!searchQuery && recommendedSkills.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium mb-2">Добавьте свои навыки</h3>
            <p className="text-muted-foreground mb-4">
              Расскажите о своих компетенциях, чтобы получать релевантные рекомендации по развитию карьеры.
            </p>
            <Button onClick={() => setSearchQuery('python')}>
              Начать с поиска
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
