'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import EmployeeFilter from '@/components/hr/EmployeeFilter'
import AIEmployeeSearch from '@/components/hr/AIEmployeeSearch'
import { QuestCourseCreator } from '@/components/hr/QuestCourseCreator'
import { QuestCourseManager } from '@/components/hr/QuestCourseManager'
import { 
  ChatDock,
  CandidateTable
} from '@/components'
import { User, Vacancy, CandidateMatch } from '@/types'
import { getHRSearchService, getServices } from '@/services'
import { hrAIService } from '@/services/hrAIService'
import { mockVacancies } from '@/mocks'
import { 
  getUnifiedHREmployeeData, 
  getHREmployeeById,
  getHREmployeesBySkill,
  getHREmployeesByDepartment,
  searchHREmployees,
  filterHREmployees,
  HREmployeeFilters
} from '@/mocks/users'
import { useStore } from '@/domain/state/store'
import { 
  Search, 
  Users, 
  Target, 
  BarChart3,
  FileText,
  Settings,
  Bell,
  Download,
  Filter,
  Zap,
  TrendingUp,
  UserCheck,
  Clock,
  BookOpen,
  Plus
} from 'lucide-react'

export default function HRPage() {
  const user = useStore(state => state.user)
  const isAuthenticated = useStore(state => state.isAuthenticated)
  const [selectedView, setSelectedView] = useState<'overview' | 'search' | 'vacancy-check' | 'analytics' | 'ai-search' | 'courses'>('overview')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Vacancy Check состояние
  const [jobDescription, setJobDescription] = useState('')
  const [isMatching, setIsMatching] = useState(false)
  const [matchResults, setMatchResults] = useState<CandidateMatch[]>([])
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null)
  
  // Search состояние
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [filters, setFilters] = useState<HREmployeeFilters>({})
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([])
  
  // Analytics состояние
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  
  // AI Search состояние - теперь управляется компонентом AIEmployeeSearch
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  
  // Courses состояние
  const [showCourseCreator, setShowCourseCreator] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)

  const hrService = getHRSearchService()
  const services = getServices()
  const [hrEmployeeData, setHrEmployeeData] = useState<any[]>([])

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Проверяем авторизацию
        if (!isAuthenticated || !user) {
          // Редирект на страницу входа если не авторизован
          window.location.href = '/auth'
          return
        }
        
        const analytics = await hrService.getTeamAnalytics()
        setAnalyticsData(analytics)
        
        // Загружаем унифицированные HR данные
        const employeeData = getUnifiedHREmployeeData()
        setHrEmployeeData(employeeData)
        setFilteredEmployees(employeeData)
        console.log('Загружены HR данные:', employeeData.length, 'сотрудников')
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && user) {
      initializeData()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  const handleVacancyCheck = async () => {
    if (!jobDescription.trim()) return
    
    setIsMatching(true)
    try {
      // Используем новый ИИ-сервис для анализа и подбора
      const aiSearchResult = await hrAIService.searchEmployees({
        query: jobDescription.trim(),
        maxResults: 10,
        minMatchScore: 30
      })
      
      // Преобразуем результаты ИИ-поиска в формат CandidateMatch
      const candidates: CandidateMatch[] = aiSearchResult.matches.map(match => ({
        userId: match.employee.id,
        vacancyId: 'temp-vacancy',
        score: match.score,
        explanation: match.explanation,
        skillsMatch: match.matchDetails.skillsMatch.matched,
        skillsGap: match.matchDetails.skillsMatch.missing,
        experienceMatch: match.matchDetails.experienceMatch.score,
        user: {
          id: match.employee.id,
          displayName: match.employee.fullName,
          email: match.employee.email || `${match.employee.id}@company.com`,
          role: 'employee',
          department: match.employee.department,
          position: match.employee.position,
          avatar: match.employee.avatar,
          profile: {
            completeness: {
              overall: match.employee.profileCompleteness
            }
          }
        }
      }))
      
      setMatchResults(candidates)
      
      // Создаем временную вакансию для отображения
      const vacancy = {
        id: 'temp-vacancy',
        title: 'Позиция из описания',
        description: jobDescription,
        department: aiSearchResult.requirements.department || 'Engineering',
        requiredSkills: aiSearchResult.requirements.skills.filter(s => s.required).map(s => s.name),
        preferredSkills: aiSearchResult.requirements.skills.filter(s => !s.required).map(s => s.name),
        requirements: [],
        responsibilities: [],
        benefits: [],
        location: 'Москва',
        workType: 'hybrid' as const,
        experienceYears: { 
          min: aiSearchResult.requirements.experience.min || 2, 
          max: aiSearchResult.requirements.experience.max || 5 
        },
        status: 'active' as const,
        hiringManagerId: 'user-15',
        hrContactId: user?.id || 'user-11',
        postedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setSelectedVacancy(vacancy)
      
    } catch (error) {
      console.error('Ошибка ИИ-подбора:', error)
    } finally {
      setIsMatching(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      // Используем новые функции поиска
       const searchResults = searchHREmployees(searchQuery)
       
       // Преобразуем в формат, ожидаемый компонентом
       const combinedResults = {
         users: searchResults.slice(0, 20).map(emp => ({
           id: emp.id,
           displayName: emp.fullName,
           position: emp.position,
           department: emp.department,
           profile: {
             completeness: {
               overall: emp.profileCompleteness
             }
           }
         })),
         total: searchResults.length,
         query: searchQuery
       }
      
      setSearchResults(combinedResults)
      console.log('Результаты поиска:', combinedResults)
    } catch (error) {
      console.error('Ошибка поиска:', error)
    }
  }

  const handleFiltersChange = (newFilters: HREmployeeFilters) => {
    setFilters(newFilters)
    const results = filterHREmployees(newFilters)
    setFilteredEmployees(results)
  }

  // Функция handleAISearch удалена - теперь используется компонент AIEmployeeSearch

  const handleCandidateContact = (userId: string) => {
    console.log('Связаться с кандидатом:', userId)
    // Здесь можно открыть модальное окно или форму контакта
  }

  const handleExplainMatch = (candidate: CandidateMatch) => {
    console.log('Объяснение матчинга:', candidate)
    // Здесь можно показать детальное объяснение
  }

  // Обработчики для управления курсами
  const handleCreateCourse = () => {
    setEditingCourse(null)
    setShowCourseCreator(true)
  }

  const handleEditCourse = (course: any) => {
    setEditingCourse(course)
    setShowCourseCreator(true)
  }

  const handleSaveCourse = (course: any) => {
    console.log('Сохранение курса:', course)
    // Здесь будет логика сохранения курса
    setShowCourseCreator(false)
    setEditingCourse(null)
  }

  const handleCancelCourseEdit = () => {
    setShowCourseCreator(false)
    setEditingCourse(null)
  }

  const handleDeleteCourse = (courseId: string) => {
    console.log('Удаление курса:', courseId)
    // Здесь будет логика удаления курса
  }

  const handleViewCourse = (course: any) => {
    console.log('Просмотр курса:', course)
    // Здесь можно открыть предварительный просмотр курса
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка HR панели...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Ошибка загрузки данных</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Вернуться к авторизации
          </Button>
        </div>
      </div>
    )
  }

  const quickStats = [
    {
      label: 'Активные сотрудники',
      value: analyticsData?.totalEmployees || 15,
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Готовы к ротации',
      value: `${analyticsData?.readyForRotationPct || 32}%`,
      icon: <UserCheck className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'Средняя полнота профиля',
      value: `${analyticsData?.avgProfileCompleteness || 68}%`,
      icon: <Target className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      label: 'Активные вакансии',
      value: mockVacancies.filter(v => v.status === 'active').length,
      icon: <FileText className="h-4 w-4" />,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                HR
              </div>
              <div>
                <h1 className="text-xl font-semibold">HR Панель</h1>
                <p className="text-sm text-gray-600">Поиск, подбор и аналитика талантов</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Навигация */}
        <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm mb-6 w-fit">
          {[
            { key: 'overview', label: 'Обзор', icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'vacancy-check', label: 'One-click подбор', icon: <Zap className="h-4 w-4" /> },
            { key: 'search', label: 'Поиск сотрудников', icon: <Search className="h-4 w-4" /> },
            { key: 'ai-search', label: 'ИИ-поиск', icon: <Target className="h-4 w-4" /> },
            { key: 'courses', label: 'Управление курсами', icon: <BookOpen className="h-4 w-4" /> },
            { key: 'analytics', label: 'Аналитика', icon: <TrendingUp className="h-4 w-4" /> }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={selectedView === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView(tab.key as any)}
              className="flex items-center gap-2"
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>

        {selectedView === 'overview' && (
          <>
            {/* Быстрая статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {quickStats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Основные инструменты */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedView('vacancy-check')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    One-click подбор
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Вставьте описание вакансии и получите топ кандидатов с объяснением совместимости
                  </p>
                  <Button size="sm">Начать подбор</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedView('search')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-500" />
                    Поиск сотрудников
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Расширенный поиск по навыкам, опыту, готовности к ротации
                  </p>
                  <Button size="sm" variant="outline">Открыть поиск</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedView('analytics')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Аналитика команды
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Метрики полноты профилей, скилл-гэпы, тренды развития
                  </p>
                  <Button size="sm" variant="outline">Посмотреть данные</Button>
                </CardContent>
              </Card>
            </div>

            {/* Недавние вакансии */}
            <Card>
              <CardHeader>
                <CardTitle>Активные вакансии</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockVacancies.filter(v => v.status === 'active').map((vacancy) => (
                    <div key={vacancy.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{vacancy.title}</div>
                        <div className="text-sm text-gray-600">{vacancy.department} • {vacancy.location}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{vacancy.workType}</Badge>
                        <Button size="sm" onClick={() => {
                          setSelectedVacancy(vacancy)
                          setSelectedView('vacancy-check')
                        }}>
                          Найти кандидатов
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {selectedView === 'vacancy-check' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  One-click поиск кандидатов
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Описание вакансии (Job Description)
                  </label>
                  <Textarea
                    placeholder="Вставьте или опишите требования к кандидату, необходимые навыки, опыт..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleVacancyCheck}
                    disabled={!jobDescription.trim() || isMatching}
                    className="flex items-center gap-2"
                  >
                    {isMatching ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Target className="h-4 w-4" />
                    )}
                    {isMatching ? 'Анализируем...' : 'Найти кандидатов'}
                  </Button>
                  
                  {matchResults.length > 0 && (
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Экспорт результатов
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {matchResults.length > 0 && (
              <CandidateTable
                candidates={matchResults}
                vacancy={selectedVacancy || undefined}
                onCandidateSelect={(candidate) => console.log('Выбран кандидат:', candidate)}
                onExplainMatch={handleExplainMatch}
                onContactCandidate={handleCandidateContact}
              />
            )}
            
            {/* Отображение унифицированного массива HR данных */}
            {hrEmployeeData.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Доступные сотрудники ({hrEmployeeData.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {hrEmployeeData.slice(0, 10).map((employee, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{employee.displayName}</div>
                            <div className="text-xs text-gray-600">{employee.position} • {employee.department}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {employee.skills?.length || 0} навыков
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {employee.profile?.completeness?.overall || 0}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {selectedView === 'search' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Поиск сотрудников
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EmployeeFilter
                  onFiltersChange={handleFiltersChange}
                  totalEmployees={hrEmployeeData.length}
                  filteredCount={filteredEmployees.length}
                />
                
                {searchResults && (
                  <div className="text-sm text-gray-600">
                    Найдено: {searchResults.total} сотрудников
                  </div>
                )}
              </CardContent>
            </Card>

            {searchResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Результаты поиска</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.users.map((user: User, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-gray-600">{user.position} • {user.department}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {user.profile?.completeness?.overall || 0}% профиль
                          </Badge>
                          <Button size="sm" variant="outline">
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Отображение отфильтрованных сотрудников */}
            {filteredEmployees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Результаты фильтрации ({filteredEmployees.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredEmployees.map((employee, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{employee.displayName}</div>
                            <div className="text-sm text-gray-600">{employee.position} • {employee.department}</div>
                            <div className="text-xs text-gray-500">
                              Навыки: {employee.skills?.map(s => s.skillName).join(', ').substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {employee.skills?.length || 0} навыков
                          </Badge>
                          <Badge variant="outline">
                            {employee.profile?.completeness?.overall || 0}%
                          </Badge>
                          <Button size="sm" variant="outline">
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {selectedView === 'ai-search' && (
          <AIEmployeeSearch 
            onEmployeeSelect={(employee) => {
              setSelectedEmployee(employee)
              console.log('Выбран сотрудник:', employee)
            }}
          />
        )}

        {selectedView === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Топ навыки в команде</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.topSkills?.slice(0, 8).map((skill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (skill.total / analyticsData.totalEmployees) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8">{skill.total}</span>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      Данные загружаются...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Скилл-гэпы</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.skillGaps?.map((gap: any, index: number) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-medium text-red-800">{gap.skill}</div>
                      <div className="text-sm text-red-600">
                        Покрытие: {gap.coverage}% команды
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      Анализ скилл-гэпов...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedView === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Управление курсами</h2>
              <Button onClick={handleCreateCourse} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать курс
              </Button>
            </div>
            
            {showCourseCreator && (
              <QuestCourseCreator
                course={editingCourse}
                onSave={handleSaveCourse}
                onCancel={handleCancelCourseEdit}
              />
            )}
            
            <QuestCourseManager
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onViewCourse={handleViewCourse}
            />
          </div>
        )}
      </div>

      {/* HR чат-док */}
      <ChatDock
        userId={user.id}
        userRole={user.role}
        context="hr"
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  )
}
