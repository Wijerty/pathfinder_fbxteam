// Центральная точка для всех mock данных
export * from './skills'
export * from './users'
export * from './vacancies'

// Импорты для инициализации
import { mockUsers } from './users'
import { allMockSkills } from './skills'
import { mockVacancies } from './vacancies'

// Экспорт всех данных для удобства
export const mockData = {
  users: mockUsers,
  skills: allMockSkills,
  vacancies: mockVacancies
}

// Функция для инициализации mock данных
export function initializeMockData() {
  // В реальном приложении здесь была бы инициализация базы данных
  // или загрузка данных из внешних источников
  console.log('Инициализация mock данных:')
  console.log(`- Пользователи: ${mockUsers.length}`)
  console.log(`- Навыки: ${allMockSkills.length}`)
  console.log(`- Вакансии: ${mockVacancies.length}`)
  
  return mockData
}

// Валидация связей между данными
export function validateMockData() {
  const errors: string[] = []
  
  // Проверяем, что все навыки в профилях пользователей существуют
  mockUsers.forEach(user => {
    user.profile.skills.forEach(userSkill => {
      const skillExists = allMockSkills.some(skill => skill.id === userSkill.skillId)
      if (!skillExists) {
        errors.push(`Пользователь ${user.displayName} имеет несуществующий навык ${userSkill.skillId}`)
      }
    })
  })
  
  // Проверяем, что все навыки в вакансиях существуют
  mockVacancies.forEach(vacancy => {
    [...vacancy.requiredSkills, ...vacancy.preferredSkills].forEach(reqSkill => {
      const skillExists = allMockSkills.some(skill => skill.id === reqSkill.skillId)
      if (!skillExists) {
        errors.push(`Вакансия ${vacancy.title} требует несуществующий навык ${reqSkill.skillId}`)
      }
    })
    
    // Проверяем, что hiring manager и HR contact существуют
    const hmExists = mockUsers.some(user => user.id === vacancy.hiringManagerId)
    const hrExists = mockUsers.some(user => user.id === vacancy.hrContactId)
    
    if (!hmExists) {
      errors.push(`Вакансия ${vacancy.title} имеет несуществующего hiring manager ${vacancy.hiringManagerId}`)
    }
    if (!hrExists) {
      errors.push(`Вакансия ${vacancy.title} имеет несуществующий HR contact ${vacancy.hrContactId}`)
    }
  })
  
  // Проверяем иерархию менеджеров
  mockUsers.forEach(user => {
    if (user.managerId) {
      const managerExists = mockUsers.some(manager => manager.id === user.managerId)
      if (!managerExists) {
        errors.push(`Пользователь ${user.displayName} имеет несуществующего менеджера ${user.managerId}`)
      }
    }
  })
  
  if (errors.length > 0) {
    console.warn('Найдены ошибки в mock данных:', errors)
  } else {
    console.log('Валидация mock данных прошла успешно')
  }
  
  return errors
}

// Статистика по mock данным
export function getMockDataStats() {
  const usersByRole = mockUsers.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const usersByDepartment = mockUsers.reduce((acc, user) => {
    acc[user.department] = (acc[user.department] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const skillsByCategory = allMockSkills.reduce((acc, skill) => {
    acc[skill.category] = (acc[skill.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const vacanciesByStatus = mockVacancies.reduce((acc, vacancy) => {
    acc[vacancy.status] = (acc[vacancy.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const avgProfileCompleteness = mockUsers.reduce((sum, user) => 
    sum + user.profile.completeness.overall, 0) / mockUsers.length
  
  return {
    users: {
      total: mockUsers.length,
      byRole: usersByRole,
      byDepartment: usersByDepartment,
      avgProfileCompleteness: Math.round(avgProfileCompleteness)
    },
    skills: {
      total: allMockSkills.length,
      byCategory: skillsByCategory,
      coreSkills: allMockSkills.filter(s => s.isCore).length
    },
    vacancies: {
      total: mockVacancies.length,
      byStatus: vacanciesByStatus,
      active: mockVacancies.filter(v => v.status === 'active').length
    }
  }
}
