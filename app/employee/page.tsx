'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChatDock,
  ProfileCompleteness,
  ProfileCompletenessCompact,
  QuestBoard,
  QuestBoardCompact,
  BadgeBar,
  BadgeBarCompact,
  RoleRecommendations,
  Leaderboard
} from '@/components'
import CourseList from '@/components/course/CourseList'
import { User, AIRecommendation } from '@/types'
import { serviceHelpers } from '@/services'
import { useStore } from '@/domain/state/store'
import { 
  TrendingUp, 
  Target, 
  Award, 
  BookOpen, 
  Users,
  BarChart3,
  Calendar,
  Bell,
  Settings,
  Trophy
} from 'lucide-react'

export default function EmployeePage() {
  const user = useStore(state => state.user)
  const isAuthenticated = useStore(state => state.isAuthenticated)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'profile' | 'quests' | 'courses' | 'achievements' | 'leaderboard'>('overview')

  useEffect(() => {
    // Проверяем авторизацию перед загрузкой данных
    if (!isAuthenticated || !user) {
      // Редирект на страницу входа если не авторизован
      setIsLoading(false)
      window.location.href = '/auth'
      return
    }
    
    loadUserData()
  }, [user, isAuthenticated])

  const loadUserData = async () => {
    try {
      // Дополнительная проверка для безопасности
      if (!user) {
        console.error('Пользователь не найден')
        window.location.href = '/auth'
        return
      }
      
      // Загружаем дашборд данные
      const dashboard = await serviceHelpers.getUserDashboard(user.id)
      setDashboardData(dashboard)
      setRecommendations(dashboard.recommendations || [])
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      
      // Более подробное сообщение об ошибке
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      
      // Если ошибка связана с авторизацией, перенаправляем на страницу входа
      if (errorMessage.includes('авторизац') || errorMessage.includes('401') || errorMessage.includes('403')) {
        console.log('Ошибка авторизации, перенаправление на страницу входа')
        window.location.href = '/auth'
        return
      }
      
      // Показать пользователю что что-то пошло не так
      alert(`Ошибка загрузки профиля: ${errorMessage}. Попробуйте обновить страницу.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestStart = async (questId: string) => {
    if (!user) return
    
    try {
      // Обновляем XP за начало квеста
      await serviceHelpers.awardActionXP(user.id, 'quest_started', 15)
      // Перезагружаем данные
      await loadUserData()
    } catch (error) {
      console.error('Ошибка запуска квеста:', error)
    }
  }

  const handleRecommendationClick = (recommendation: AIRecommendation) => {
    console.log('Выбрана рекомендация:', recommendation)
    // Здесь можно открыть модальное окно с подробностями
  }

  const handleAddToQuest = async (skillId: string) => {
    if (!user) return
    
    console.log('Добавление в план развития:', skillId)
    // Здесь можно создать персональный квест на основе навыка
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!user || !dashboardData) {
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
      label: 'Полнота профиля',
      value: `${dashboardData.profile?.completeness.overall || 0}%`,
      icon: <Target className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Уровень',
      value: dashboardData.gameData?.level || 1,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'XP',
      value: dashboardData.gameData?.xp || 0,
      icon: <Award className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      label: 'Активные квесты',
      value: dashboardData.gameData?.activeQuests?.length || 0,
      icon: <BookOpen className="h-4 w-4" />,
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
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                PF
              </div>
              <div>
                <h1 className="text-xl font-semibold">Добро пожаловать, {user.firstName}!</h1>
                <p className="text-sm text-gray-600">{user.position} • {user.department}</p>
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
            { key: 'profile', label: 'Профиль', icon: <Users className="h-4 w-4" /> },
            { key: 'quests', label: 'Квесты', icon: <Target className="h-4 w-4" /> },
            { key: 'courses', label: 'Курсы', icon: <BookOpen className="h-4 w-4" /> },
            { key: 'achievements', label: 'Достижения', icon: <Award className="h-4 w-4" /> },
            { key: 'leaderboard', label: 'Рейтинг', icon: <Trophy className="h-4 w-4" /> }
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

            {/* Основной контент */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Левая колонка */}
              <div className="lg:col-span-2 space-y-6">
                {/* Рекомендации ИИ */}
                <RoleRecommendations
                  recommendations={recommendations}
                  onRecommendationClick={handleRecommendationClick}
                  onAddToQuest={handleAddToQuest}
                />

                {/* Квесты компактно */}
                <QuestBoardCompact
                  userQuests={dashboardData.gameData?.activeQuests || []}
                  onClick={() => setSelectedView('quests')}
                />
              </div>

              {/* Правая колонка */}
              <div className="space-y-6">
                {/* Полнота профиля */}
                <ProfileCompletenessCompact
                  onClick={() => setSelectedView('profile')}
                />

                {/* Достижения */}
                <BadgeBarCompact
                  userBadges={dashboardData.gameData?.badges || []}
                  allBadges={[]} // Заглушка
                  userXP={dashboardData.gameData?.xp || 0}
                  userLevel={dashboardData.gameData?.level || 1}
                  onClick={() => setSelectedView('achievements')}
                />

                {/* Недавняя активность */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Недавняя активность</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-medium">Обновлён навык JavaScript</div>
                        <div className="text-gray-500">2 часа назад</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-medium">Получен бейдж "Аналитик"</div>
                        <div className="text-gray-500">1 день назад</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="text-sm">
                        <div className="font-medium">Завершён квест</div>
                        <div className="text-gray-500">3 дня назад</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {selectedView === 'profile' && (
          <div className="max-w-4xl">
            <ProfileCompleteness
              showDetails={true}
            />
          </div>
        )}

        {selectedView === 'quests' && (
          <div className="max-w-4xl">
            <QuestBoard
              onQuestStart={handleQuestStart}
            />
          </div>
        )}

        {selectedView === 'achievements' && (
          <div className="max-w-4xl">
            <BadgeBar
              userBadges={dashboardData.gameData?.badges || []}
              allBadges={[]} // Заглушка
              userXP={dashboardData.gameData?.xp || 0}
              userLevel={dashboardData.gameData?.level || 1}
            />
          </div>
        )}

        {selectedView === 'courses' && (
          <div className="max-w-4xl">
            <CourseList />
          </div>
        )}

        {selectedView === 'leaderboard' && (
          <div className="max-w-4xl">
            <Leaderboard
              currentUserId={user.id}
              showCompact={false}
            />
          </div>
        )}
      </div>

      {/* Чат-док с ИИ */}
      <ChatDock
        userId={user.id}
        userRole={user.role}
        context="employee"
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  )
}
