'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Edit3, 
  Video, 
  FileText, 
  HelpCircle, 
  Code2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Settings,
  Users,
  Calendar,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

interface CourseLesson {
  id: string
  type: 'video' | 'text' | 'quiz' | 'code'
  title: string
  description?: string
  content: any // Специфичный контент для каждого типа урока
  order: number
  isRequired: boolean
  estimatedTime?: number // в минутах
}

interface QuestCourse {
  id?: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number // в часах
  maxAttempts?: number
  passingScore: number // процент
  isPublished: boolean
  tags: string[]
  lessons: CourseLesson[]
  rewards: {
    points: number
    badges?: string[]
    certificates?: boolean
  }
  prerequisites?: string[] // ID других курсов
  targetAudience?: string[]
  learningObjectives?: string[]
}

interface QuestCourseCreatorProps {
  initialCourse?: QuestCourse
  onSave?: (course: QuestCourse) => void
  onCancel?: () => void
  className?: string
}

const LESSON_TYPES = [
  { value: 'video', label: 'Видео урок', icon: Video, color: 'bg-red-100 text-red-700' },
  { value: 'text', label: 'Текстовый урок', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  { value: 'quiz', label: 'Тестирование', icon: HelpCircle, color: 'bg-green-100 text-green-700' },
  { value: 'code', label: 'Программирование', icon: Code2, color: 'bg-purple-100 text-purple-700' }
]

const CATEGORIES = [
  'Программирование',
  'Дизайн',
  'Маркетинг',
  'Менеджмент',
  'Аналитика',
  'HR',
  'Финансы',
  'Продажи',
  'Другое'
]

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Начинающий', color: 'bg-green-100 text-green-700' },
  { value: 'intermediate', label: 'Средний', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'advanced', label: 'Продвинутый', color: 'bg-red-100 text-red-700' }
]

export function QuestCourseCreator({
  initialCourse,
  onSave,
  onCancel,
  className = ''
}: QuestCourseCreatorProps) {
  const [course, setCourse] = useState<QuestCourse>(initialCourse || {
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    estimatedDuration: 1,
    passingScore: 70,
    isPublished: false,
    tags: [],
    lessons: [],
    rewards: {
      points: 100,
      certificates: false
    }
  })

  const [activeTab, setActiveTab] = useState<'general' | 'lessons' | 'settings' | 'preview'>('general')
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null)
  const [newTag, setNewTag] = useState('')
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null)

  const addLesson = (type: CourseLesson['type']) => {
    const newLesson: CourseLesson = {
      id: `lesson_${Date.now()}`,
      type,
      title: `Новый ${LESSON_TYPES.find(t => t.value === type)?.label.toLowerCase()}`,
      order: course.lessons.length,
      isRequired: true,
      content: getDefaultContent(type)
    }
    
    setCourse(prev => ({
      ...prev,
      lessons: [...prev.lessons, newLesson]
    }))
    
    setEditingLesson(newLesson)
  }

  const getDefaultContent = (type: CourseLesson['type']) => {
    switch (type) {
      case 'video':
        return {
          videoUrl: '',
          duration: 0,
          subtitles: '',
          allowSkip: false
        }
      case 'text':
        return {
          content: '',
          readingTime: 5,
          allowDownload: true
        }
      case 'quiz':
        return {
          questions: [],
          passingScore: 70,
          allowRetry: true,
          showCorrectAnswers: true
        }
      case 'code':
        return {
          initialCode: '# Напишите ваш код здесь\n',
          testCases: [],
          hints: [],
          allowSolutionView: true
        }
      default:
        return {}
    }
  }

  const updateLesson = (lessonId: string, updates: Partial<CourseLesson>) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, ...updates } : lesson
      )
    }))
  }

  const deleteLesson = (lessonId: string) => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.filter(lesson => lesson.id !== lessonId)
        .map((lesson, index) => ({ ...lesson, order: index }))
    }))
  }

  const duplicateLesson = (lesson: CourseLesson) => {
    const duplicated: CourseLesson = {
      ...lesson,
      id: `lesson_${Date.now()}`,
      title: `${lesson.title} (копия)`,
      order: course.lessons.length
    }
    
    setCourse(prev => ({
      ...prev,
      lessons: [...prev.lessons, duplicated]
    }))
  }

  const reorderLessons = (fromIndex: number, toIndex: number) => {
    const newLessons = [...course.lessons]
    const [movedLesson] = newLessons.splice(fromIndex, 1)
    newLessons.splice(toIndex, 0, movedLesson)
    
    // Обновляем порядок
    const reorderedLessons = newLessons.map((lesson, index) => ({
      ...lesson,
      order: index
    }))
    
    setCourse(prev => ({
      ...prev,
      lessons: reorderedLessons
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !course.tags.includes(newTag.trim())) {
      setCourse(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setCourse(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSave = () => {
    if (!course.title.trim() || !course.description.trim() || course.lessons.length === 0) {
      alert('Пожалуйста, заполните все обязательные поля и добавьте хотя бы один урок')
      return
    }
    
    onSave?.(course)
  }

  const calculateTotalDuration = () => {
    return course.lessons.reduce((total, lesson) => {
      const time = lesson.estimatedTime || 0
      return total + time
    }, 0)
  }

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Название курса *</Label>
            <Input
              id="title"
              value={course.title}
              onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Введите название курса"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Категория *</Label>
            <Select value={course.category} onValueChange={(value) => setCourse(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="difficulty">Уровень сложности</Label>
            <Select value={course.difficulty} onValueChange={(value: any) => setCourse(prev => ({ ...prev, difficulty: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={level.color}>{level.label}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="duration">Примерная продолжительность (часы)</Label>
            <Input
              id="duration"
              type="number"
              min="0.5"
              step="0.5"
              value={course.estimatedDuration}
              onChange={(e) => setCourse(prev => ({ ...prev, estimatedDuration: parseFloat(e.target.value) || 1 }))}
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Описание курса *</Label>
            <Textarea
              id="description"
              value={course.description}
              onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Опишите содержание и цели курса"
              className="mt-1 h-32"
            />
          </div>
          
          <div>
            <Label>Теги</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Добавить тег"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {course.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderLessonsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Уроки курса</h3>
        <div className="flex gap-2">
          {LESSON_TYPES.map(type => {
            const Icon = type.icon
            return (
              <Button
                key={type.value}
                onClick={() => addLesson(type.value as CourseLesson['type'])}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {type.label}
              </Button>
            )
          })}
        </div>
      </div>
      
      {course.lessons.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Нет уроков</p>
            <p className="text-sm">Добавьте первый урок, выбрав тип выше</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {course.lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson, index) => {
              const lessonType = LESSON_TYPES.find(t => t.value === lesson.type)
              const Icon = lessonType?.icon || FileText
              
              return (
                <Card key={lesson.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="cursor-move">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      <div className={cn('p-2 rounded-lg', lessonType?.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.isRequired && (
                            <Badge variant="secondary" className="text-xs">Обязательный</Badge>
                          )}
                          {lesson.estimatedTime && (
                            <Badge variant="outline" className="text-xs">
                              {lesson.estimatedTime} мин
                            </Badge>
                          )}
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setEditingLesson(lesson)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => duplicateLesson(lesson)}
                          variant="ghost"
                          size="sm"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => deleteLesson(lesson.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Настройки прохождения
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="passingScore">Проходной балл (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min="0"
                max="100"
                value={course.passingScore}
                onChange={(e) => setCourse(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="maxAttempts">Максимальное количество попыток</Label>
              <Input
                id="maxAttempts"
                type="number"
                min="1"
                value={course.maxAttempts || ''}
                onChange={(e) => setCourse(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || undefined }))}
                placeholder="Без ограничений"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="isPublished">Опубликовать курс</Label>
              <Switch
                id="isPublished"
                checked={course.isPublished}
                onCheckedChange={(checked) => setCourse(prev => ({ ...prev, isPublished: checked }))}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Награды
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="points">Баллы за прохождение</Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={course.rewards.points}
                onChange={(e) => setCourse(prev => ({
                  ...prev,
                  rewards: { ...prev.rewards, points: parseInt(e.target.value) || 0 }
                }))}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="certificates">Выдавать сертификат</Label>
              <Switch
                id="certificates"
                checked={course.rewards.certificates || false}
                onCheckedChange={(checked) => setCourse(prev => ({
                  ...prev,
                  rewards: { ...prev.rewards, certificates: checked }
                }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderPreviewTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{course.title || 'Название курса'}</CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {course.estimatedDuration} ч
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course.difficulty === 'beginner' ? 'Начинающий' : 
               course.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              {course.rewards.points} баллов
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {course.description || 'Описание курса'}
          </p>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Программа курса ({course.lessons.length} уроков)</h4>
            <div className="space-y-2">
              {course.lessons.map((lesson, index) => {
                const lessonType = LESSON_TYPES.find(t => t.value === lesson.type)
                const Icon = lessonType?.icon || FileText
                
                return (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={cn('p-2 rounded-lg', lessonType?.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium">{lesson.title}</h5>
                      <p className="text-sm text-muted-foreground">{lessonType?.label}</p>
                    </div>
                    {lesson.estimatedTime && (
                      <Badge variant="outline">{lesson.estimatedTime} мин</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {course.tags.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Теги</h4>
              <div className="flex flex-wrap gap-2">
                {course.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {initialCourse ? 'Редактировать курс' : 'Создать новый курс'}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Сохранить
          </Button>
        </div>
      </div>
      
      {/* Табы */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'general', label: 'Общие', icon: Settings },
            { id: 'lessons', label: 'Уроки', icon: FileText },
            { id: 'settings', label: 'Настройки', icon: Settings },
            { id: 'preview', label: 'Предпросмотр', icon: Eye }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
      
      {/* Контент табов */}
      <div className="min-h-[500px]">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'lessons' && renderLessonsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'preview' && renderPreviewTab()}
      </div>
      
      {/* Статистика */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span>Уроков: <strong>{course.lessons.length}</strong></span>
              <span>Общее время: <strong>{calculateTotalDuration()} мин</strong></span>
              <span>Проходной балл: <strong>{course.passingScore}%</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                {course.isPublished ? 'Опубликован' : 'Черновик'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuestCourseCreator