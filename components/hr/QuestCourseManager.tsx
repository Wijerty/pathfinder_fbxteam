'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  MoreHorizontal,
  Users,
  Calendar,
  Award,
  TrendingUp,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'

interface CourseStats {
  totalEnrolled: number
  completed: number
  inProgress: number
  averageScore: number
  averageCompletionTime: number // в часах
  lastActivity: string
}

interface QuestCourse {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number
  passingScore: number
  isPublished: boolean
  tags: string[]
  lessonsCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
  stats: CourseStats
}

interface QuestCourseManagerProps {
  onCreateNew?: () => void
  onEditCourse?: (course: QuestCourse) => void
  onViewCourse?: (course: QuestCourse) => void
  onDeleteCourse?: (courseId: string) => void
  className?: string
}

// Моковые данные для демонстрации
const MOCK_COURSES: QuestCourse[] = [
  {
    id: '1',
    title: 'Основы Python программирования',
    description: 'Изучите основы языка Python с нуля до создания первых программ',
    category: 'Программирование',
    difficulty: 'beginner',
    estimatedDuration: 8,
    passingScore: 70,
    isPublished: true,
    tags: ['Python', 'Программирование', 'Основы'],
    lessonsCount: 12,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    createdBy: 'Анна Петрова',
    stats: {
      totalEnrolled: 45,
      completed: 32,
      inProgress: 13,
      averageScore: 85,
      averageCompletionTime: 6.5,
      lastActivity: '2024-01-25'
    }
  },
  {
    id: '2',
    title: 'Веб-дизайн для начинающих',
    description: 'Основы создания современных веб-интерфейсов',
    category: 'Дизайн',
    difficulty: 'beginner',
    estimatedDuration: 6,
    passingScore: 75,
    isPublished: true,
    tags: ['Дизайн', 'UI/UX', 'Веб'],
    lessonsCount: 8,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    createdBy: 'Михаил Сидоров',
    stats: {
      totalEnrolled: 28,
      completed: 22,
      inProgress: 6,
      averageScore: 78,
      averageCompletionTime: 5.2,
      lastActivity: '2024-01-24'
    }
  },
  {
    id: '3',
    title: 'Продвинутая аналитика данных',
    description: 'Глубокое изучение методов анализа данных и машинного обучения',
    category: 'Аналитика',
    difficulty: 'advanced',
    estimatedDuration: 15,
    passingScore: 80,
    isPublished: false,
    tags: ['Аналитика', 'ML', 'Python', 'Данные'],
    lessonsCount: 20,
    createdAt: '2024-01-22',
    updatedAt: '2024-01-25',
    createdBy: 'Елена Козлова',
    stats: {
      totalEnrolled: 0,
      completed: 0,
      inProgress: 0,
      averageScore: 0,
      averageCompletionTime: 0,
      lastActivity: 'Никогда'
    }
  }
]

const CATEGORIES = [
  'Все категории',
  'Программирование',
  'Дизайн',
  'Маркетинг',
  'Менеджмент',
  'Аналитика',
  'HR',
  'Финансы',
  'Продажи'
]

const DIFFICULTY_LEVELS = [
  { value: 'all', label: 'Все уровни' },
  { value: 'beginner', label: 'Начинающий', color: 'bg-green-100 text-green-700' },
  { value: 'intermediate', label: 'Средний', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'advanced', label: 'Продвинутый', color: 'bg-red-100 text-red-700' }
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'published', label: 'Опубликованные' },
  { value: 'draft', label: 'Черновики' }
]

export function QuestCourseManager({
  onCreateNew,
  onEditCourse,
  onViewCourse,
  onDeleteCourse,
  className = ''
}: QuestCourseManagerProps) {
  const [courses, setCourses] = useState<QuestCourse[]>(MOCK_COURSES)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Все категории')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'title' | 'created' | 'updated' | 'enrolled'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'Все категории' || course.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'published' && course.isPublished) ||
                         (selectedStatus === 'draft' && !course.isPublished)
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'title':
        aValue = a.title
        bValue = b.title
        break
      case 'created':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      case 'updated':
        aValue = new Date(a.updatedAt)
        bValue = new Date(b.updatedAt)
        break
      case 'enrolled':
        aValue = a.stats.totalEnrolled
        bValue = b.stats.totalEnrolled
        break
      default:
        return 0
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const duplicateCourse = (course: QuestCourse) => {
    const duplicated: QuestCourse = {
      ...course,
      id: `${course.id}_copy_${Date.now()}`,
      title: `${course.title} (копия)`,
      isPublished: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      stats: {
        totalEnrolled: 0,
        completed: 0,
        inProgress: 0,
        averageScore: 0,
        averageCompletionTime: 0,
        lastActivity: 'Никогда'
      }
    }
    
    setCourses(prev => [duplicated, ...prev])
  }

  const togglePublishStatus = (courseId: string) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, isPublished: !course.isPublished, updatedAt: new Date().toISOString().split('T')[0] }
        : course
    ))
  }

  const getDifficultyBadge = (difficulty: string) => {
    const level = DIFFICULTY_LEVELS.find(l => l.value === difficulty)
    return level ? (
      <Badge className={level.color}>{level.label}</Badge>
    ) : null
  }

  const getCompletionRate = (stats: CourseStats) => {
    if (stats.totalEnrolled === 0) return 0
    return Math.round((stats.completed / stats.totalEnrolled) * 100)
  }

  const renderCourseCard = (course: QuestCourse) => (
    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">{course.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {course.description}
            </p>
            <div className="flex items-center gap-2 mb-2">
              {getDifficultyBadge(course.difficulty)}
              <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                {course.isPublished ? 'Опубликован' : 'Черновик'}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewCourse?.(course)}>
                <Eye className="h-4 w-4 mr-2" />
                Просмотр
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditCourse?.(course)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateCourse(course)}>
                <Copy className="h-4 w-4 mr-2" />
                Дублировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePublishStatus(course.id)}>
                {course.isPublished ? (
                  <><XCircle className="h-4 w-4 mr-2" />Снять с публикации</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Опубликовать</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteCourse?.(course.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{course.stats.totalEnrolled} записались</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{course.lessonsCount} уроков</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{course.estimatedDuration}ч</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>{course.stats.averageScore}% ср. балл</span>
            </div>
          </div>
          
          {/* Прогресс завершения */}
          {course.stats.totalEnrolled > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Завершили курс</span>
                <span>{getCompletionRate(course.stats)}%</span>
              </div>
              <Progress value={getCompletionRate(course.stats)} className="h-2" />
            </div>
          )}
          
          {/* Теги */}
          <div className="flex flex-wrap gap-1">
            {course.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
            {course.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{course.tags.length - 3}</Badge>
            )}
          </div>
          
          {/* Метаинформация */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <div>Создан: {course.createdAt} • {course.createdBy}</div>
            <div>Обновлен: {course.updatedAt}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderCourseRow = (course: QuestCourse) => (
    <Card key={course.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold">{course.title}</h3>
              {getDifficultyBadge(course.difficulty)}
              <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                {course.isPublished ? 'Опубликован' : 'Черновик'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{course.lessonsCount} уроков</span>
              <span>{course.estimatedDuration}ч</span>
              <span>{course.stats.totalEnrolled} записались</span>
              <span>Обновлен: {course.updatedAt}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => onViewCourse?.(course)} variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button onClick={() => onEditCourse?.(course)} variant="ghost" size="sm">
              <Edit3 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => duplicateCourse(course)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Дублировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => togglePublishStatus(course.id)}>
                  {course.isPublished ? (
                    <><XCircle className="h-4 w-4 mr-2" />Снять с публикации</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4 mr-2" />Опубликовать</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDeleteCourse?.(course.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Заголовок и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление курсами</h2>
          <p className="text-muted-foreground">Создавайте и управляйте обучающими курсами</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Экспорт
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Импорт
          </Button>
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать курс
          </Button>
        </div>
      </div>
      
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Всего курсов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{courses.filter(c => c.isPublished).length}</p>
                <p className="text-sm text-muted-foreground">Опубликованных</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {courses.reduce((sum, c) => sum + c.stats.totalEnrolled, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Записались</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(courses.reduce((sum, c) => sum + c.stats.averageScore, 0) / courses.length) || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Средний балл</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск курсов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">По обновлению</SelectItem>
                  <SelectItem value="created">По созданию</SelectItem>
                  <SelectItem value="title">По названию</SelectItem>
                  <SelectItem value="enrolled">По популярности</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Список курсов */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Найдено курсов: {sortedCourses.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Сетка
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              Список
            </Button>
          </div>
        </div>
        
        {sortedCourses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Курсы не найдены</h3>
              <p className="text-muted-foreground mb-4">
                Попробуйте изменить параметры поиска или создайте новый курс
              </p>
              <Button onClick={onCreateNew}>
                Создать первый курс
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-3'
          )}>
            {sortedCourses.map(course => 
              viewMode === 'grid' ? renderCourseCard(course) : renderCourseRow(course)
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestCourseManager