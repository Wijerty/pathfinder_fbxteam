// API для получения рекомендаций ролей для пользователя
import { NextRequest, NextResponse } from 'next/server'
import { getServices } from '@/services'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязателен' },
        { status: 400 }
      )
    }

    const services = getServices()
    
    // Получаем профиль пользователя
    const profile = await services.profile.getProfile(userId)
    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      )
    }

    // Получаем рекомендации ролей через LLM
    const recommendations = await services.llm.recommendRoles(profile)
    
    // Возвращаем только ID ролей для совместимости с taxonomySlice
    const roleIds = recommendations
      .filter(rec => rec.type === 'role')
      .map(rec => rec.targetId || rec.title.toLowerCase().replace(/\s+/g, '-'))
    
    return NextResponse.json(roleIds)
    
  } catch (error) {
    console.error('Ошибка получения рекомендаций ролей:', error)
    
    // Если это ошибка "Not implemented for Scibox yet", возвращаем пустой массив
    if (error instanceof Error && error.message.includes('Not implemented for Scibox yet')) {
      return NextResponse.json([])
    }
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}