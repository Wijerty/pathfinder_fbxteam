// API для работы с геймификацией пользователя
import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'
import { publish } from '@/domain/eventBus'
import { createEvent } from '@/domain/events'

// Получение данных геймификации пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    
    // Получаем XP и уровень пользователя
    const user = await dataService.getById('users', userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Получаем активные квесты
    const activeQuests = await dataService.getUserActiveQuests(userId)
    
    // Получаем завершенные квесты
    const completedQuests = await dataService.findWhere('userQuests', (quest: any) => 
      quest.userId === userId && quest.status === 'completed'
    )
    
    // Получаем заработанные бейджи
    const earnedBadges = await dataService.findWhere('userBadges', (badge: any) => 
      badge.userId === userId
    )

    // Вычисляем общий XP из завершенных квестов (упрощенно для демо)
    const totalXp = completedQuests.reduce((sum, quest) => sum + (quest.xpReward || 50), 0)
    
    // Получаем статистику
    const stats = {
      totalXpEarned: totalXp,
      questsCompleted: completedQuests.length,
      badgesEarned: earnedBadges.length,
      currentStreak: 0, // TODO: реализовать вычисление стрика
      longestStreak: 0, // TODO: реализовать вычисление стрика
      achievementRate: completedQuests.length > 0 ? (completedQuests.length / (activeQuests.length + completedQuests.length)) * 100 : 0
    }

    const gamificationData = {
      currentXp: totalXp,
      activeQuests,
      completedQuests,
      earnedBadges,
      stats
    }

    return NextResponse.json(gamificationData)
  } catch (error) {
    console.error('Ошибка получения данных геймификации:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Обновление XP пользователя
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const { action, amount, reason, source } = await request.json()
    
    if (action !== 'add_xp') {
      return NextResponse.json(
        { error: 'Неподдерживаемое действие' },
        { status: 400 }
      )
    }

    const user = await dataService.getById('users', userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Для демо упрощаем - вычисляем XP заново каждый раз
    // В реальной системе эти данные хранились бы отдельно
    const previousXp = 0 // TODO: вычислить из существующих квестов
    const newXp = previousXp + amount
    const totalXp = newXp

    // В демо версии мы не обновляем User объект, так как XP не хранится в нем
    // Вместо этого мы можем сохранить это в отдельной таблице или вычислять динамически

    // Публикуем событие получения XP
    await publish(createEvent(
      'XP_GAINED',
      {
        userId,
        amount,
        reason: reason || 'XP начислен',
        source: source || 'manual',
        previousXp,
        newXp
      },
      userId
    ))

    return NextResponse.json({
      previousXp,
      newXp,
      amount,
      totalXp
    })
  } catch (error) {
    console.error('Ошибка обновления XP:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
