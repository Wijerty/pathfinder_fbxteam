// API для работы с квестами
import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'
import { publish } from '@/domain/eventBus'
import { createEvent } from '@/domain/events'

// Получение всех доступных квестов
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const status = url.searchParams.get('status')
    
    if (userId) {
      // Получаем квесты конкретного пользователя
      let userQuests = await dataService.findWhere('userQuests', (quest: any) => 
        quest.userId === userId
      )
      
      if (status) {
        userQuests = userQuests.filter((quest: any) => quest.status === status)
      }
      
      return NextResponse.json(userQuests)
    } else {
      // Получаем все доступные квесты
      const quests = await dataService.getAll('quests')
      const activeQuests = quests.filter((quest: any) => quest.isActive)
      
      return NextResponse.json(activeQuests)
    }
  } catch (error) {
    console.error('Ошибка получения квестов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создание нового квеста
export async function POST(request: NextRequest) {
  try {
    const questData = await request.json()
    
    const newQuest = {
      id: `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: questData.title,
      description: questData.description,
      type: questData.type || 'achievement',
      targetSkillId: questData.targetSkillId,
      requirements: questData.requirements || [],
      rewards: questData.rewards || [],
      timeLimit: questData.timeLimit,
      difficulty: questData.difficulty || 'medium',
      isRepeatable: questData.isRepeatable || false,
      isActive: questData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const createdQuest = await dataService.create('quests', newQuest)
    
    return NextResponse.json(createdQuest, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания квеста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
