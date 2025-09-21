// API для работы с конкретным квестом
import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'
import { publish } from '@/domain/eventBus'
import { createEvent } from '@/domain/events'

// Получение информации о квесте
export async function GET(
  request: NextRequest,
  { params }: { params: { questId: string } }
) {
  try {
    const { questId } = params
    
    const quest = await dataService.getById('quests', questId)
    
    if (!quest) {
      return NextResponse.json(
        { error: 'Квест не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(quest)
  } catch (error) {
    console.error('Ошибка получения квеста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Принятие квеста пользователем
export async function POST(
  request: NextRequest,
  { params }: { params: { questId: string } }
) {
  try {
    const { questId } = params
    const { userId, action } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Получаем квест
    const quest = await dataService.getById('quests', questId)
    if (!quest) {
      return NextResponse.json(
        { error: 'Квест не найден' },
        { status: 404 }
      )
    }

    if (action === 'accept') {
      // Проверяем, не принят ли уже квест
      const existingUserQuest = await dataService.findWhere('userQuests', (uq: any) =>
        uq.userId === userId && uq.questId === questId
      )

      if (existingUserQuest.length > 0) {
        return NextResponse.json(
          { error: 'Квест уже принят' },
          { status: 409 }
        )
      }

      // Создаем пользовательский квест
      const userQuest = {
        id: `user-quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        questId,
        status: 'active',
        progress: (quest as any).requirements.map((req: any) => ({
          requirementId: req.type,
          currentValue: 0,
          requiredValue: req.requiredValue,
          isCompleted: false,
          updatedAt: new Date().toISOString()
        })),
        startedAt: new Date().toISOString(),
        expiresAt: (quest as any).timeLimit ?
          new Date(Date.now() + (quest as any).timeLimit * 24 * 60 * 60 * 1000).toISOString() :
          null
      }

      const createdUserQuest = await dataService.create('userQuests', userQuest)

      // Публикуем событие принятия квеста
      await publish(createEvent(
        'QUEST_ACCEPTED',
        {
          userId,
          questId,
          quest,
          acceptedAt: new Date()
        },
        userId
      ))

      return NextResponse.json(createdUserQuest, { status: 201 })
    }

    if (action === 'complete') {
      // Находим пользовательский квест
      const userQuests = await dataService.findWhere('userQuests', (uq: any) =>
        uq.userId === userId && uq.questId === questId && uq.status === 'active'
      )

      if (userQuests.length === 0) {
        return NextResponse.json(
          { error: 'Активный квест не найден' },
          { status: 404 }
        )
      }

      const userQuest = userQuests[0]

      // Проверяем, что все требования выполнены
      const allCompleted = userQuest.progress.every((p: any) => p.isCompleted)
      if (!allCompleted) {
        return NextResponse.json(
          { error: 'Не все требования квеста выполнены' },
          { status: 400 }
        )
      }

      // Обновляем статус квеста
      const completedUserQuest = await dataService.update('userQuests', userQuest.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      } as any)

      // Публикуем событие завершения квеста
      await publish(createEvent(
        'QUEST_COMPLETED',
        {
          userId,
          questId,
          quest,
          completedAt: new Date(),
          rewards: (quest as any).rewards || []
        },
        userId
      ))

      return NextResponse.json(completedUserQuest)
    }

    return NextResponse.json(
      { error: 'Неподдерживаемое действие' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Ошибка обработки квеста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Обновление прогресса квеста
export async function PATCH(
  request: NextRequest,
  { params }: { params: { questId: string } }
) {
  try {
    const { questId } = params
    const { userId, requirementId, newValue } = await request.json()
    
    if (!userId || !requirementId || newValue === undefined) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      )
    }

    // Находим активный пользовательский квест
    const userQuests = await dataService.findWhere('userQuests', (uq: any) =>
      uq.userId === userId && uq.questId === questId && uq.status === 'active'
    )

    if (userQuests.length === 0) {
      return NextResponse.json(
        { error: 'Активный квест не найден' },
        { status: 404 }
      )
    }

    const userQuest = userQuests[0]

    // Находим прогресс для обновления
    const progressIndex = userQuest.progress.findIndex((p: any) => p.requirementId === requirementId)
    if (progressIndex === -1) {
      return NextResponse.json(
        { error: 'Требование не найдено' },
        { status: 404 }
      )
    }

    const previousValue = userQuest.progress[progressIndex].currentValue
    
    // Обновляем прогресс
    userQuest.progress[progressIndex] = {
      ...userQuest.progress[progressIndex],
      currentValue: newValue,
      isCompleted: newValue >= userQuest.progress[progressIndex].requiredValue,
      updatedAt: new Date().toISOString()
    }

    const updatedUserQuest = await dataService.update('userQuests', userQuest.id, {
      progress: userQuest.progress
    } as any)

    // Публикуем событие обновления прогресса
    await publish(createEvent(
      'QUEST_PROGRESS_UPDATED',
      {
        userId,
        questId,
        requirementId,
        previousValue,
        currentValue: newValue,
        requiredValue: userQuest.progress[progressIndex].requiredValue,
        isCompleted: userQuest.progress[progressIndex].isCompleted
      },
      userId
    ))

    return NextResponse.json(updatedUserQuest)
  } catch (error) {
    console.error('Ошибка обновления прогресса квеста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
