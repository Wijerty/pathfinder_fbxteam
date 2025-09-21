'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserRole } from '@/types'
import { demoUsers } from '@/mocks'
import { useStore } from '@/domain/state/store'
import { Users, Shield, Settings, Briefcase } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const login = useStore(state => state.login)

  const roleInfo = {
    employee: {
      icon: <Briefcase className="h-8 w-8" />,
      title: 'Сотрудник',
      description: 'Доступ к личному кабинету, развитию навыков и карьерным рекомендациям',
      features: [
        'Личный профиль и навыки',
        'ИИ-консультант по карьере',
        'Квесты и геймификация',
        'Рекомендации по развитию',
        'Голосовое взаимодействие'
      ],
      color: 'bg-blue-500',
      demoUser: demoUsers.employee
    },
    hr: {
      icon: <Users className="h-8 w-8" />,
      title: 'HR-специалист',
      description: 'Инструменты поиска, подбора кандидатов и анализа команды',
      features: [
        'Поиск и фильтрация сотрудников',
        'One-click подбор кандидатов',
        'Анализ совместимости',
        'HR-аналитика и метрики',
        'ИИ-помощник для рекрутинга'
      ],
      color: 'bg-green-500',
      demoUser: demoUsers.hr
    },
    admin: {
      icon: <Settings className="h-8 w-8" />,
      title: 'Администратор',
      description: 'Управление системой, таксономией и настройками',
      features: [
        'Управление навыками и ролями',
        'Настройка геймификации',
        'Системная аналитика',
        'Feature flags и конфигурация',
        'Аудит и логирование'
      ],
      color: 'bg-purple-500',
      demoUser: demoUsers.admin
    }
  }

  const handleLogin = async (role: UserRole) => {
    try {
      setIsLoading(true)
      setSelectedRole(role)
      
      const demoUser = roleInfo[role].demoUser
      
      if (!demoUser) {
        throw new Error(`Демо-пользователь для роли ${role} не найден`)
      }
      
      // Используем новый authSlice для входа
      await login(demoUser)
      
      // Редирект на соответствующую страницу
      const routes = {
        employee: '/employee',
        hr: '/hr', 
        admin: '/admin'
      }
      
      router.push(routes[role])
    } catch (error) {
      console.error('Ошибка входа:', error)
      alert(`Ошибка входа: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsLoading(false)
      setSelectedRole(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PathFinder
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            ИИ HR-Консультант для корпоративного развития
          </p>
          <p className="text-gray-500">
            Выберите роль для демонстрации функциональности
          </p>
        </div>

        {/* Карточки ролей */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(roleInfo).map(([role, info]) => (
            <Card 
              key={role}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${
                selectedRole === role ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => setSelectedRole(role as UserRole)}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 ${info.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}>
                  {info.icon}
                </div>
                <CardTitle className="text-xl">{info.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-2">{info.description}</p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 mb-4">
                  {info.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-xs text-gray-500 mb-2">Демо-пользователь:</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{info.demoUser.displayName}</div>
                      <div className="text-xs text-gray-500">{info.demoUser.position}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Кнопка входа */}
        {selectedRole && (
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => handleLogin(selectedRole)}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Вход в систему...
                </>
              ) : (
                `Войти как ${roleInfo[selectedRole].title}`
              )}
            </Button>
          </div>
        )}

        {/* Информация о демо */}
        <div className="mt-8 p-4 bg-white/50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-600 text-sm">ℹ</span>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Демо-режим</p>
              <p>
                Это демонстрационная версия PathFinder с mock данными. 
                Все ИИ-функции, голосовые возможности и интеграции работают в симуляционном режиме. 
                В продакшене система интегрируется с Scibox/локальными LLM, STT/TTS сервисами и корпоративными системами.
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">Mock LLM</Badge>
                <Badge variant="outline" className="text-xs">Mock STT/TTS</Badge>
                <Badge variant="outline" className="text-xs">Demo Data</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Особенности системы */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white/30 p-3 rounded border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">🔒 Безопасность</h4>
            <p className="text-gray-600">
              On-prem развертывание, все данные остаются в корпоративном контуре, 
              нет внешних интеграций по умолчанию.
            </p>
          </div>
          <div className="bg-white/30 p-3 rounded border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">🎯 ИИ-интеграция</h4>
            <p className="text-gray-600">
              Глубокая интеграция ИИ в каждый экран, контекстные рекомендации, 
              голосовое взаимодействие, объяснимость решений.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
