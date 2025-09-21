'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChatDock } from '@/components'
import { User, Skill, Role } from '@/types'
import { getTaxonomyService, getServices } from '@/services'
import { getFeatureFlags } from '@/config/features'
import { allMockSkills } from '@/mocks/skills'
import { baseRoles } from '@/config/roles'
import { useStore } from '@/domain/state/store'
import { 
  Settings, 
  Database, 
  Users, 
  BarChart3,
  Shield,
  Bell,
  Download,
  Plus,
  Edit,
  Trash,
  ToggleLeft,
  FileText,
  Activity,
  Zap,
  Target,
  Award,
  Brain
} from 'lucide-react'

export default function AdminPage() {
  const user = useStore(state => state.user)
  const isAuthenticated = useStore(state => state.isAuthenticated)
  const [selectedView, setSelectedView] = useState<'overview' | 'taxonomy' | 'features' | 'analytics' | 'audit'>('overview')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Taxonomy состояние
  const [skills, setSkills] = useState<Skill[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  // Feature flags состояние
  const [featureFlags, setFeatureFlags] = useState(getFeatureFlags())
  
  // Analytics состояние
  const [systemStats, setSystemStats] = useState<any>(null)

  const taxonomyService = getTaxonomyService()

  useEffect(() => {
    loadUserData()
    loadTaxonomyData()
    loadSystemStats()
  }, [user, isAuthenticated])

  const loadUserData = async () => {
    try {
      // Проверяем авторизацию
      if (!isAuthenticated || !user) {
        // Редирект на страницу входа если не авторизован
        window.location.href = '/auth'
        return
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTaxonomyData = async () => {
    try {
      const [skillsData, rolesData] = await Promise.all([
        taxonomyService.getAllSkills(),
        taxonomyService.getAllRoles()
      ])
      
      setSkills(skillsData)
      setRoles(rolesData)
    } catch (error) {
      console.error('Ошибка загрузки таксономии:', error)
    }
  }

  const loadSystemStats = () => {
    // Mock системной статистики
    setSystemStats({
      totalUsers: 15,
      activeUsers: 12,
      totalSkills: allMockSkills.length,
      totalRoles: baseRoles.length,
      avgProfileCompleteness: 68,
      systemUptime: '99.9%',
      apiCalls: 1234,
      storageUsed: '2.3 GB'
    })
  }

  const handleFeatureToggle = (feature: string) => {
    setFeatureFlags(prev => ({
      ...prev,
      [feature]: !prev[feature as keyof typeof prev]
    }))
    console.log(`Переключен флаг: ${feature}`)
  }

  const handleExportTaxonomy = async () => {
    try {
      const taxonomyData = await taxonomyService.exportTaxonomy()
      console.log('Экспорт таксономии:', taxonomyData)
      // В реальном приложении здесь был бы скачивание файла
    } catch (error) {
      console.error('Ошибка экспорта:', error)
    }
  }

  const handleSkillEdit = (skill: Skill) => {
    setSelectedSkill(skill)
    console.log('Редактирование навыка:', skill)
  }

  const handleRoleEdit = (role: Role) => {
    setSelectedRole(role)
    console.log('Редактирование роли:', role)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка админ панели...</p>
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
      label: 'Активные пользователи',
      value: systemStats?.activeUsers || 12,
      icon: <Users className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Навыки в системе',
      value: systemStats?.totalSkills || 15,
      icon: <Target className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'Роли в системе',
      value: systemStats?.totalRoles || 8,
      icon: <Award className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      label: 'Время работы',
      value: systemStats?.systemUptime || '99.9%',
      icon: <Activity className="h-4 w-4" />,
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
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Админ панель</h1>
                <p className="text-sm text-gray-600">Управление системой PathFinder</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-600">
                Система работает
              </Badge>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
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
            { key: 'taxonomy', label: 'Таксономия', icon: <Database className="h-4 w-4" /> },
            { key: 'features', label: 'Feature Flags', icon: <ToggleLeft className="h-4 w-4" /> },
            { key: 'analytics', label: 'Аналитика', icon: <Activity className="h-4 w-4" /> },
            { key: 'audit', label: 'Аудит', icon: <Shield className="h-4 w-4" /> }
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

            {/* Системная информация */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    ИИ сервисы
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LLM провайдер</span>
                    <Badge variant={featureFlags.enableSciboxLLM ? 'default' : 'outline'}>
                      {featureFlags.enableSciboxLLM ? 'Scibox' : 'Mock'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">STT сервис</span>
                    <Badge variant={featureFlags.enableLocalSTT ? 'default' : 'outline'}>
                      {featureFlags.enableLocalSTT ? 'Local' : 'Mock'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">TTS сервис</span>
                    <Badge variant={featureFlags.enableLocalTTS ? 'default' : 'outline'}>
                      {featureFlags.enableLocalTTS ? 'Local' : 'Mock'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Состояние данных
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Использование хранилища</span>
                    <span className="text-sm font-medium">{systemStats?.storageUsed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API вызовы (сегодня)</span>
                    <span className="text-sm font-medium">{systemStats?.apiCalls}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Средняя полнота профилей</span>
                    <span className="text-sm font-medium">{systemStats?.avgProfileCompleteness}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Быстрые действия */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col" onClick={() => setSelectedView('taxonomy')}>
                    <Database className="h-6 w-6 mb-2" />
                    <span className="text-sm">Управление таксономией</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => setSelectedView('features')}>
                    <ToggleLeft className="h-6 w-6 mb-2" />
                    <span className="text-sm">Feature flags</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={handleExportTaxonomy}>
                    <Download className="h-6 w-6 mb-2" />
                    <span className="text-sm">Экспорт данных</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => setSelectedView('audit')}>
                    <Shield className="h-6 w-6 mb-2" />
                    <span className="text-sm">Логи аудита</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {selectedView === 'taxonomy' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Управление таксономией</h2>
              <div className="flex gap-2">
                <Button onClick={handleExportTaxonomy}>
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Импорт
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Навыки */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Навыки ({skills.length})</CardTitle>
                    <Button size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Добавить
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {skills.slice(0, 20).map((skill) => (
                      <div key={skill.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium text-sm">{skill.name}</div>
                          <div className="text-xs text-gray-500">{skill.category}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {skill.isCore && <Badge variant="outline" className="text-xs">Core</Badge>}
                          <Button size="sm" variant="ghost" onClick={() => handleSkillEdit(skill)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {skills.length > 20 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        И ещё {skills.length - 20} навыков...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Роли */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Роли ({roles.length})</CardTitle>
                    <Button size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Добавить
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {roles.map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium text-sm">{role.title}</div>
                          <div className="text-xs text-gray-500">{role.department} • {role.level}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={role.isActive ? 'default' : 'outline'} className="text-xs">
                            {role.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleRoleEdit(role)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedView === 'features' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Feature Flags</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ИИ провайдеры</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'enableSciboxLLM', label: 'Scibox LLM', description: 'Использовать Scibox для LLM запросов' },
                    { key: 'enableLocalSTT', label: 'Локальный STT', description: 'Локальный сервис распознавания речи' },
                    { key: 'enableLocalTTS', label: 'Локальный TTS', description: 'Локальный сервис синтеза речи' }
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{feature.label}</div>
                        <div className="text-sm text-gray-600">{feature.description}</div>
                      </div>
                      <Button
                        variant={featureFlags[feature.key as keyof typeof featureFlags] ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFeatureToggle(feature.key)}
                      >
                        {featureFlags[feature.key as keyof typeof featureFlags] ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Интеграции</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'enableHRISImport', label: 'HRIS интеграция', description: 'Импорт данных из HRIS' },
                    { key: 'enableLMSImport', label: 'LMS интеграция', description: 'Импорт курсов из LMS' },
                    { key: 'enableATSImport', label: 'ATS интеграция', description: 'Интеграция с ATS системой' }
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{feature.label}</div>
                        <div className="text-sm text-gray-600">{feature.description}</div>
                      </div>
                      <Button
                        variant={featureFlags[feature.key as keyof typeof featureFlags] ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFeatureToggle(feature.key)}
                      >
                        {featureFlags[feature.key as keyof typeof featureFlags] ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedView === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Системная аналитика</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Активность пользователей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{systemStats?.activeUsers}</div>
                  <div className="text-sm text-gray-600">из {systemStats?.totalUsers} пользователей</div>
                  <div className="mt-2 text-xs text-green-600">+2 за неделю</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API нагрузка</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{systemStats?.apiCalls}</div>
                  <div className="text-sm text-gray-600">запросов сегодня</div>
                  <div className="mt-2 text-xs text-green-600">В пределах нормы</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Хранилище</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{systemStats?.storageUsed}</div>
                  <div className="text-sm text-gray-600">из 10 GB</div>
                  <div className="mt-2 text-xs text-gray-600">23% использовано</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Качество данных</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Средняя полнота профилей</span>
                      <span className="font-medium">{systemStats?.avgProfileCompleteness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${systemStats?.avgProfileCompleteness}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Профили &gt;70%</div>
                      <div className="font-medium">8 пользователей</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Неактивные &gt;30 дней</div>
                      <div className="font-medium">3 пользователя</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedView === 'audit' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Журнал аудита</h2>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Последние события</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-3 w-3 mr-1" />
                    Экспорт
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'Вход в систему', user: 'admin', time: '10 минут назад', level: 'info' },
                    { action: 'Обновлен навык JavaScript', user: 'user-1', time: '1 час назад', level: 'info' },
                    { action: 'Создана новая роль', user: 'admin', time: '2 часа назад', level: 'warning' },
                    { action: 'Экспорт таксономии', user: 'admin', time: '1 день назад', level: 'info' },
                    { action: 'Изменены feature flags', user: 'admin', time: '2 дня назад', level: 'warning' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          event.level === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-sm">{event.action}</div>
                          <div className="text-xs text-gray-600">Пользователь: {event.user}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{event.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Admin чат-док */}
      <ChatDock
        userId={user.id}
        userRole={user.role}
        context="admin"
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  )
}
