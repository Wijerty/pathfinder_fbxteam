'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Clock, 
  Award, 
  Star, 
  Play, 
  CheckCircle2,
  Search,
  Filter,
  Users,
  TrendingUp,
  Calendar,
  Target,
  Code,
  Video,
  FileText,
  HelpCircle,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CourseViewer from './CourseViewer'

interface CourseLesson {
  id: string
  type: 'video' | 'text' | 'quiz' | 'code'
  title: string
  description?: string
  content: any
  order: number
  isRequired: boolean
  estimatedTime?: number
  isCompleted?: boolean
}

interface QuestCourse {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number
  passingScore: number
  tags: string[]
  lessons: CourseLesson[]
  rewards: {
    points: number
    badges?: string[]
    certificates?: boolean
  }
  instructor?: {
    name: string
    avatar?: string
    bio?: string
  }
  rating?: {
    average: number
    count: number
  }
  enrolledCount?: number
  isEnrolled?: boolean
  progress?: number
  lastAccessed?: Date
  createdAt: Date
  updatedAt: Date
}

interface CourseListProps {
  onCourseSelect?: (course: QuestCourse) => void
  className?: string
}

// Моковые данные курсов
const mockCourses: QuestCourse[] = [
  {
    id: 'course-python-basics',
    title: 'Основы Python для начинающих',
    description: 'Изучите основы программирования на Python с нуля. Курс включает видео-уроки, практические задания и тесты.',
    category: 'Программирование',
    difficulty: 'beginner',
    estimatedDuration: 8,
    passingScore: 70,
    tags: ['Python', 'Программирование', 'Основы'],
    lessons: [
      {
        id: 'lesson-1',
        type: 'video',
        title: 'Введение в Python',
        description: 'Знакомство с языком программирования Python',
        content: {
          videoUrl: 'https://example.com/video1.mp4',
          duration: 900,
          subtitles: true,
          allowSkip: false
        },
        order: 1,
        isRequired: true,
        estimatedTime: 15
      },
      {
        id: 'lesson-2',
        type: 'text',
        title: 'Переменные и типы данных',
        description: 'Изучаем основные типы данных в Python',
        content: {
          content: '# Переменные в Python\n\nВ Python переменные создаются автоматически при присваивании значения...',
          readingTime: 10,
          allowDownload: true
        },
        order: 2,
        isRequired: true,
        estimatedTime: 10
      },
      {
        id: 'lesson-3',
        type: 'code',
        title: 'Первая программа',
        description: 'Напишите свою первую программу на Python',
        content: {
          initialCode: '# Напишите программу, которая выводит "Hello, World!"\nprint("")',
          solution: 'print("Hello, World!")',
          testCases: [
            { input: '', expectedOutput: 'Hello, World!' }
          ],
          hints: ['Используйте функцию print()', 'Не забудьте кавычки'],
          allowSolutionView: true
        },
        order: 3,
        isRequired: true,
        estimatedTime: 20
      },
      {
        id: 'lesson-4',
        type: 'quiz',
        title: 'Проверка знаний',
        description: 'Тест по основам Python',
        content: {
          questions: [
            {
              id: 'q1',
              type: 'single_choice',
              question: 'Какая функция используется для вывода текста в Python?',
              options: ['print()', 'echo()', 'write()', 'output()'],
              correctAnswer: 0,
              explanation: 'Функция print() используется для вывода текста в консоль'
            }
          ],
          passingScore: 70,
          allowRetry: true,
          showCorrectAnswers: true
        },
        order: 4,
        isRequired: true,
        estimatedTime: 15
      }
    ],
    rewards: {
      points: 100,
      badges: ['python-beginner'],
      certificates: true
    },
    instructor: {
      name: 'Анна Петрова',
      avatar: '/avatars/instructor1.jpg',
      bio: 'Senior Python Developer с 8-летним опытом'
    },
    rating: {
      average: 4.8,
      count: 156
    },
    enrolledCount: 1240,
    isEnrolled: false,
    progress: 0,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'course-js-advanced',
    title: 'Продвинутый JavaScript',
    description: 'Глубокое изучение JavaScript: асинхронность, замыкания, прототипы и современные возможности ES6+.',
    category: 'Программирование',
    difficulty: 'advanced',
    estimatedDuration: 12,
    passingScore: 80,
    tags: ['JavaScript', 'ES6+', 'Асинхронность'],
    lessons: [
      {
        id: 'lesson-js-1',
        type: 'video',
        title: 'Замыкания и область видимости',
        content: { videoUrl: 'https://example.com/js1.mp4', duration: 1200, subtitles: true, allowSkip: false },
        order: 1,
        isRequired: true,
        estimatedTime: 20
      },
      {
        id: 'lesson-js-2',
        type: 'code',
        title: 'Работа с Promise',
        content: {
          initialCode: '// Создайте Promise, который разрешается через 2 секунды\nconst myPromise = ',
          solution: 'const myPromise = new Promise(resolve => setTimeout(() => resolve("Done!"), 2000))',
          testCases: [{ input: '', expectedOutput: 'Done!' }],
          hints: ['Используйте конструктор Promise', 'Не забудьте setTimeout'],
          allowSolutionView: true
        },
        order: 2,
        isRequired: true,
        estimatedTime: 30
      }
    ],
    rewards: {
      points: 200,
      badges: ['js-expert'],
      certificates: true
    },
    instructor: {
      name: 'Михаил Иванов',
      bio: 'Frontend Architect, автор популярных JS библиотек'
    },
    rating: {
      average: 4.9,
      count: 89
    },
    enrolledCount: 567,
    isEnrolled: true,
    progress: 45,
    lastAccessed: new Date('2024-01-18'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'course-data-analysis',
    title: 'Анализ данных с Python',
    description: 'Изучите pandas, numpy, matplotlib для анализа и визуализации данных.',
    category: 'Аналитика',
    difficulty: 'intermediate',
    estimatedDuration: 15,
    passingScore: 75,
    tags: ['Python', 'Pandas', 'Анализ данных', 'Визуализация'],
    lessons: [
      {
        id: 'lesson-da-1',
        type: 'text',
        title: 'Введение в анализ данных',
        content: { content: 'Анализ данных - это процесс...', readingTime: 15, allowDownload: true },
        order: 1,
        isRequired: true,
        estimatedTime: 15
      },
      {
        id: 'lesson-da-2',
        type: 'code',
        title: 'Работа с DataFrame',
        content: {
          initialCode: 'import pandas as pd\n\n# Создайте DataFrame из словаря\ndata = {"name": ["Alice", "Bob"], "age": [25, 30]}\ndf = ',
          solution: 'df = pd.DataFrame(data)',
          testCases: [{ input: '', expectedOutput: 'DataFrame created' }],
          hints: ['Используйте pd.DataFrame()'],
          allowSolutionView: true
        },
        order: 2,
        isRequired: true,
        estimatedTime: 25
      }
    ],
    rewards: {
      points: 150,
      badges: ['data-analyst'],
      certificates: true
    },
    instructor: {
      name: 'Елена Сидорова',
      bio: 'Data Scientist, специалист по машинному обучению'
    },
    rating: {
      average: 4.7,
      count: 203
    },
    enrolledCount: 892,
    isEnrolled: false,
    progress: 0,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19')
  }
]

export function CourseList({ onCourseSelect, className = '' }: CourseListProps) {
  const [courses, setCourses] = useState<QuestCourse[]>(mockCourses)
  const [filteredCourses, setFilteredCourses] = useState<QuestCourse[]>(mockCourses)
  const [selectedCourse, setSelectedCourse] = useState<QuestCourse | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedTab, setSelectedTab] = useState<'all' | 'enrolled' | 'completed'>('all')
  const [isLoading, setIsLoading] = useState(false)

  const categories = ['all', ...Array.from(new Set(courses.map(c => c.category)))]
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced']

  useEffect(() => {
    filterCourses()
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedTab, courses])

  const filterCourses = () => {
    let filtered = courses

    // Фильтр по вкладкам
    if (selectedTab === 'enrolled') {
      filtered = filtered.filter(c => c.isEnrolled)
    } else if (selectedTab === 'completed') {
      filtered = filtered.filter(c => c.isEnrolled && c.progress === 100)
    }

    // Поиск
    if (searchQuery) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Фильтр по категории
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    // Фильтр по сложности
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty === selectedDifficulty)
    }

    setFilteredCourses(filtered)
  }

  const handleCourseClick = (course: QuestCourse) => {
    setSelectedCourse(course)
    onCourseSelect?.(course)
  }

  const handleEnrollCourse = async (courseId: string) => {
    setIsLoading(true)
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, isEnrolled: true, progress: 0 }
          : course
      ))
    } catch (error) {
      console.error('Ошибка записи на курс:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCourseComplete = (courseId: string, score: number) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, progress: 100 }
        : course
    ))
    setSelectedCourse(null)
  }

  const handleLessonComplete = (lessonId: string, courseId: string) => {
    setCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        const completedLessons = course.lessons.filter(l => l.isCompleted).length + 1
        const progress = Math.round((completedLessons / course.lessons.length) * 100)
        return {
          ...course,
          progress,
          lessons: course.lessons.map(lesson => 
            lesson.id === lessonId ? { ...lesson, isCompleted: true } : lesson
          )
        }
      }
      return course
    }))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Начинающий'
      case 'intermediate': return 'Средний'
      case 'advanced': return 'Продвинутый'
      default: return difficulty
    }
  }

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      case 'quiz': return <HelpCircle className="h-4 w-4" />
      case 'code': return <Code className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const renderCourseCard = (course: QuestCourse) => (
    <Card 
      key={course.id} 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => handleCourseClick(course)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 line-clamp-2">{course.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {course.description}
            </p>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getDifficultyColor(course.difficulty)}>
                {getDifficultyText(course.difficulty)}
              </Badge>
              <Badge variant="outline">{course.category}</Badge>
              {course.isEnrolled && (
                <Badge className="bg-blue-100 text-blue-700">
                  Записан
                </Badge>
              )}
            </div>
          </div>
          
          {course.isEnrolled && course.progress !== undefined && (
            <div className="ml-4 text-right">
              <div className="text-2xl font-bold text-blue-600">
                {course.progress}%
              </div>
              <div className="text-xs text-muted-foreground">завершено</div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {course.isEnrolled && course.progress !== undefined && (
          <div className="mb-4">
            <Progress value={course.progress} className="h-2" />
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.estimatedDuration}ч
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.lessons.length} уроков
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              {course.rewards.points} XP
            </div>
          </div>
          
          {course.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{course.rating.average}</span>
              <span className="text-xs">({course.rating.count})</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {course.instructor && (
              <div className="text-sm">
                <span className="text-muted-foreground">Преподаватель: </span>
                <span className="font-medium">{course.instructor.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {course.isEnrolled ? (
              <Button size="sm" className="flex items-center gap-2">
                {course.progress === 100 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Завершен
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Продолжить
                  </>
                )}
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEnrollCourse(course.id)
                }}
                disabled={isLoading}
              >
                Записаться
              </Button>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {/* Типы уроков */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">Типы уроков:</span>
          {Array.from(new Set(course.lessons.map(l => l.type))).map(type => (
            <div key={type} className="flex items-center gap-1 text-xs text-muted-foreground">
              {getLessonTypeIcon(type)}
              <span className="capitalize">
                {type === 'video' ? 'Видео' :
                 type === 'text' ? 'Текст' :
                 type === 'quiz' ? 'Тест' : 'Код'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (selectedCourse) {
    return (
      <CourseViewer
        course={selectedCourse}
        onComplete={handleCourseComplete}
        onLessonComplete={handleLessonComplete}
        onExit={() => setSelectedCourse(null)}
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Курсы</h1>
          <p className="text-muted-foreground">
            Изучайте новые навыки с интерактивными курсами
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0)} записей</span>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'Все курсы', count: courses.length },
          { key: 'enrolled', label: 'Мои курсы', count: courses.filter(c => c.isEnrolled).length },
          { key: 'completed', label: 'Завершенные', count: courses.filter(c => c.isEnrolled && c.progress === 100).length }
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={selectedTab === tab.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab(tab.key as any)}
            className="flex items-center gap-2"
          >
            {tab.label} ({tab.count})
          </Button>
        ))}
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск курсов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Все категории' : category}
              </option>
            ))}
          </select>
          
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'all' ? 'Все уровни' : getDifficultyText(difficulty)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Список курсов */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Курсы не найдены</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory !== 'all' || selectedDifficulty !== 'all'
              ? 'Попробуйте изменить параметры поиска'
              : 'Скоро здесь появятся новые курсы'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCourses.map(renderCourseCard)}
        </div>
      )}
    </div>
  )
}

export default CourseList