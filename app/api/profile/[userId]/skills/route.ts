// API для работы с навыками профиля
import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'
import { publish } from '@/domain/eventBus'
import { createEvent } from '@/domain/events'

// Получение навыков пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    
    const profile = await dataService.getProfileByUserId(userId)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile.skills || [])
  } catch (error) {
    console.error('Ошибка получения навыков:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Добавление навыка к профилю
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const skillData = await request.json()
    
    const profile = await dataService.getProfileByUserId(userId)
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Проверяем, не существует ли уже такой навык
    const existingSkill = profile.skills.find((s: any) => s.skillId === skillData.skillId)
    if (existingSkill) {
      return NextResponse.json(
        { error: 'Навык уже добавлен в профиль' },
        { status: 409 }
      )
    }

    // Создаем новый навык
    const newSkill = {
      skillId: skillData.skillId,
      level: skillData.level || 'beginner',
      yearsOfExperience: skillData.yearsOfExperience || 0,
      lastUsed: skillData.lastUsed ? new Date(skillData.lastUsed).toISOString() : null,
      endorsements: 0,
      selfAssessed: skillData.selfAssessed !== false,
      verifiedBy: skillData.verifiedBy || [],
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Обновляем профиль
    const updatedSkills = [...profile.skills, newSkill]
    const updatedProfile = await dataService.update('profiles', profile.id, {
      skills: updatedSkills,
      updatedAt: new Date().toISOString()
    } as any)

    // Публикуем событие добавления навыка
    await publish(createEvent(
      'SKILL_ADDED',
      {
        userId,
        skill: newSkill,
        source: 'manual'
      },
      userId
    ))

    return NextResponse.json(newSkill, { status: 201 })
  } catch (error) {
    console.error('Ошибка добавления навыка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
