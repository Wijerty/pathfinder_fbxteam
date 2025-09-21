// API для работы с навыками в таксономии
import { NextRequest, NextResponse } from 'next/server'
import { dataService } from '@/lib/dataService'
import { publish } from '@/domain/eventBus'
import { createEvent } from '@/domain/events'
import { baseSkills } from '@/config/skills'

// Получение всех навыков
export async function GET(request: NextRequest) {
  try {
    let skills = await dataService.getAll('skills')
    
    // Если навыков нет, инициализируем базовыми
    if (skills.length === 0) {
      const initialSkills = baseSkills.map(skill => ({
        ...skill,
        id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      
      await dataService.createMany('skills', initialSkills)
      skills = initialSkills
    }
    
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const competencyArea = url.searchParams.get('competencyArea')
    const isCore = url.searchParams.get('isCore')
    
    let filteredSkills = skills
    
    if (category) {
      filteredSkills = filteredSkills.filter((skill: any) => skill.category === category)
    }
    
    if (competencyArea) {
      filteredSkills = filteredSkills.filter((skill: any) => skill.competencyArea === competencyArea)
    }
    
    if (isCore !== null) {
      const coreFilter = isCore === 'true'
      filteredSkills = filteredSkills.filter((skill: any) => skill.isCore === coreFilter)
    }

    return NextResponse.json(filteredSkills)
  } catch (error) {
    console.error('Ошибка получения навыков:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создание нового навыка
export async function POST(request: NextRequest) {
  try {
    const skillData = await request.json()
    
    // Валидация обязательных полей
    if (!skillData.name || !skillData.description || !skillData.category || !skillData.competencyArea) {
      return NextResponse.json(
        { error: 'Обязательные поля: name, description, category, competencyArea' },
        { status: 400 }
      )
    }

    const newSkill = {
      id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: skillData.name,
      description: skillData.description,
      category: skillData.category,
      competencyArea: skillData.competencyArea,
      isCore: skillData.isCore || false,
      relatedSkills: skillData.relatedSkills || [],
      learningResources: skillData.learningResources || [],
      owner: skillData.owner || 'system',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const createdSkill = await dataService.create('skills', newSkill)

    // Публикуем событие обновления таксономии
    await publish(createEvent(
      'TAXONOMY_UPDATED',
      {
        adminId: 'system', // TODO: получить из сессии
        entityType: 'skill',
        entityId: createdSkill.id,
        changes: { action: 'created', skill: createdSkill },
        impactedUsers: []
      },
      'system'
    ))

    return NextResponse.json(createdSkill, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания навыка:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
