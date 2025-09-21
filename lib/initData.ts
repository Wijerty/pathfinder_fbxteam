// Инициализация данных для демонстрации PathFinder
import { mockUsers } from '@/mocks/users'
import { baseSkills } from '@/config/skills'
import { baseQuests, baseBadges } from '@/config/gamification'
import { dataService } from './dataService'

export async function initializeMockData() {
  try {
    console.log('🚀 Инициализация демо-данных PathFinder...')

    // Получаем текущую базу данных
    const db = await dataService.readDatabase()

    // Проверяем, есть ли уже данные
    if (db.users.length > 0) {
      console.log('✅ Демо-данные уже инициализированы')
      return
    }

    // Добавляем пользователей
    for (const user of mockUsers) {
      await dataService.create('users', {
        ...user,
        hireDate: user.hireDate.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      })

      // Создаем отдельную запись профиля для совместимости
      await dataService.create('profiles', {
        id: `profile-${user.id}`,
        userId: user.id,
        ...user.profile,
        updatedAt: user.profile.updatedAt.toISOString(),
        skills: user.profile.skills.map(skill => ({
          ...skill,
          addedAt: skill.addedAt.toISOString(),
          updatedAt: skill.updatedAt.toISOString(),
          lastUsed: skill.lastUsed?.toISOString()
        })),
        experiences: user.profile.experiences.map(exp => ({
          ...exp,
          startDate: exp.startDate.toISOString(),
          endDate: exp.endDate?.toISOString()
        })),
        education: user.profile.education.map(edu => ({
          ...edu,
          startDate: edu.startDate.toISOString(),
          endDate: edu.endDate?.toISOString()
        })),
        certifications: user.profile.certifications.map(cert => ({
          ...cert,
          issueDate: cert.issueDate.toISOString(),
          expirationDate: cert.expirationDate?.toISOString()
        })),
        completeness: {
          ...user.profile.completeness,
          lastCalculatedAt: user.profile.completeness.lastCalculatedAt.toISOString()
        }
      })
    }

    // Добавляем базовые навыки
    for (const skill of baseSkills) {
      await dataService.create('skills', {
        ...skill,
        id: skill.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    // Добавляем базовые квесты
    for (const quest of baseQuests) {
      await dataService.create('quests', {
        ...quest,
        id: quest.title.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    // Добавляем базовые бейджи
    for (const badge of baseBadges) {
      await dataService.create('badges', {
        ...badge,
        id: badge.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString()
      })
    }

    console.log('✅ Демо-данные успешно инициализированы!')
    console.log(`👥 Пользователей: ${mockUsers.length}`)
    console.log(`🎯 Навыков: ${baseSkills.length}`)
    console.log(`📋 Квестов: ${baseQuests.length}`)
    console.log(`🏆 Бейджей: ${baseBadges.length}`)

  } catch (error) {
    console.error('❌ Ошибка инициализации демо-данных:', error)
    throw error
  }
}

// Функция для быстрого получения пользователя для демонстрации
export async function getDemoUser(role: 'employee' | 'hr' | 'admin' = 'employee') {
  const users = await dataService.getAll('users')
  
  const roleMap = {
    employee: 'employee',
    hr: 'hr', 
    admin: 'admin'
  }
  
  return users.find((user: any) => user.role === roleMap[role]) || users[0]
}

// Функция для сброса и повторной инициализации
export async function resetDemoData() {
  console.log('🔄 Сброс демо-данных...')
  await dataService.reset()
  await initializeMockData()
}
