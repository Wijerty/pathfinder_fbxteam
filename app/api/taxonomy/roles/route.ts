// API для получения ролей из таксономии
import { NextRequest, NextResponse } from 'next/server'
import { baseRoles } from '@/config/roles'
import { dataService } from '@/lib/dataService'

// Получение всех ролей
export async function GET(request: NextRequest) {
  try {
    // Получаем роли из конфигурации и добавляем ID
    const roles = baseRoles.map((role, index) => ({
      id: `role-${index + 1}`,
      ...role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Ошибка получения ролей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Создание новой роли
export async function POST(request: NextRequest) {
  try {
    const roleData = await request.json()
    
    // Валидация обязательных полей
    if (!roleData.title || !roleData.description || !roleData.department) {
      return NextResponse.json(
        { error: 'Обязательные поля: title, description, department' },
        { status: 400 }
      )
    }

    const newRole = {
      id: `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: roleData.title,
      description: roleData.description,
      department: roleData.department,
      level: roleData.level || 'middle',
      requiredSkills: roleData.requiredSkills || [],
      preferredSkills: roleData.preferredSkills || [],
      responsibilities: roleData.responsibilities || [],
      qualifications: roleData.qualifications || [],
      salaryRange: roleData.salaryRange,
      isActive: roleData.isActive !== false,
      owner: roleData.owner || 'system',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // В реальном приложении здесь была бы запись в БД
    // const createdRole = await dataService.create('roles', newRole)
    
    return NextResponse.json(newRole, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания роли:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}