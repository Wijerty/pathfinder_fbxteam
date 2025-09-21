// API для работы с профилями пользователей
import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'
import { initializeMockData, getDemoUser } from '@/lib/initData'
import { publish } from '@/domain/eventBus'
import { createEvent } from '@/domain/events'

// Получение профиля пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Инициализируем данные если их нет
    await initializeMockData()

    // Для демо: если передан 'demo', возвращаем демо-пользователя
    if (userId === 'demo') {
      const demoUser = await getDemoUser('employee')
      if (demoUser) {
        return NextResponse.json(demoUser.profile)
      }
    }

    let profile = await dataService.getProfileByUserId(userId)
    
    // Если профиль не найден, пытаемся найти пользователя и взять его профиль
    if (!profile) {
      const user = await dataService.getById('users', userId)
      if (user && user.profile) {
        profile = user.profile
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Ошибка получения профиля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Обновление профиля пользователя
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const updates = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Получаем существующий профиль
    const existingProfile = await dataService.getProfileByUserId(userId)
    
    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Обновляем профиль
    const updatedProfile = await dataService.update('profiles', existingProfile.id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })

    // Публикуем событие обновления профиля
    await publish(createEvent(
      'PROFILE_UPDATED',
      {
        userId,
        changes: updates,
        previousVersion: existingProfile
      },
      userId
    ))

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Ошибка обновления профиля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создание нового профиля
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const profileData = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, не существует ли уже профиль
    const existingProfile = await dataService.getProfileByUserId(userId)
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Профиль уже существует' },
        { status: 409 }
      )
    }

    // Создаем новый профиль
    const newProfile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      bio: '',
      skills: [],
      experiences: [],
      education: [],
      certifications: [],
      preferences: {
        isProfilePublic: true,
        allowInternalRecruiting: true,
        careerInterests: [],
        workLocationPreference: 'any' as const,
        travelWillingness: 0,
        mentorshipInterest: 'none' as const,
        communicationPreferences: {
          email: true,
          inApp: true,
          voiceAssistant: false
        }
      },
      completeness: {
        overall: 0,
        sections: {
          basicInfo: 0,
          skills: 0,
          experience: 0,
          education: 0,
          goals: 0,
          preferences: 0
        },
        missingFields: [],
        recommendations: [],
        threshold: 70,
        lastCalculatedAt: new Date().toISOString()
      },
      readinessForRotation: false,
      careerGoals: [],
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const createdProfile = await dataService.create('profiles', newProfile)

    // Публикуем событие создания профиля
    await publish(createEvent(
      'PROFILE_UPDATED',
      {
        userId,
        changes: newProfile,
        previousVersion: null
      },
      userId
    ))

    return NextResponse.json(createdProfile, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания профиля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
