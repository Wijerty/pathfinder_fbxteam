// Пример использования унифицированного массива данных сотрудников для HR системы
// Этот файл демонстрирует, как использовать созданные функции в обеих вкладках

import { 
  getUnifiedHREmployeeData, 
  getHREmployeesByDepartment,
  getHREmployeesBySkill,
  searchHREmployees,
  HREmployeeData 
} from '../mocks/users'

// === ПРИМЕР 1: Получение всех сотрудников для вкладки "Поиск сотрудников" ===
function getAllEmployeesForSearch(): HREmployeeData[] {
  const employees = getUnifiedHREmployeeData()
  
  console.log(`Всего активных сотрудников: ${employees.length}`)
  console.log('Первые 3 сотрудника:')
  
  employees.slice(0, 3).forEach(emp => {
    console.log(`
${emp.fullName} (${emp.position})`)
    console.log(`Отдел: ${emp.department}`)
    console.log(`Уровень: ${emp.level}`)
    console.log(`Навыки (${emp.skillsStats.totalSkills}):`, 
      emp.skills.slice(0, 5).map(s => `${s.skillName} (${s.numericLevel}/5)`).join(', ')
    )
    console.log(`Средний уровень навыков: ${emp.skillsStats.averageLevel.toFixed(1)}/5`)
    console.log(`Экспертных навыков: ${emp.skillsStats.expertSkills}`)
    console.log(`Готовность к ротации: ${emp.readinessForRotation ? 'Да' : 'Нет'}`)
  })
  
  return employees
}

// === ПРИМЕР 2: Поиск по навыкам для вкладки "One-click подбор" ===
function findEmployeesForOneClickSelection() {
  console.log('\n=== ONE-CLICK ПОДБОР ===\n')
  
  // Поиск React разработчиков с уровнем 4+
  const reactDevelopers = getHREmployeesBySkill('React', 4)
  console.log(`React разработчики (уровень 4+): ${reactDevelopers.length}`)
  reactDevelopers.forEach(emp => {
    const reactSkill = emp.skills.find(s => s.skillName.includes('React'))
    console.log(`- ${emp.fullName}: React ${reactSkill?.numericLevel}/5 (${reactSkill?.yearsOfExperience} лет опыта)`)
  })
  
  // Поиск Python специалистов
  const pythonExperts = getHREmployeesBySkill('Python', 3)
  console.log(`\nPython специалисты (уровень 3+): ${pythonExperts.length}`)
  pythonExperts.forEach(emp => {
    const pythonSkill = emp.skills.find(s => s.skillName.includes('Python'))
    console.log(`- ${emp.fullName}: Python ${pythonSkill?.numericLevel}/5 (${emp.position})`)
  })
  
  // Поиск по отделам
  const engineeringTeam = getHREmployeesByDepartment('Engineering')
  console.log(`\nКоманда Engineering: ${engineeringTeam.length} человек`)
  
  return { reactDevelopers, pythonExperts, engineeringTeam }
}

// === ПРИМЕР 3: Расширенный поиск и фильтрация ===
function advancedEmployeeSearch() {
  console.log('\n=== РАСШИРЕННЫЙ ПОИСК ===\n')
  
  const allEmployees = getUnifiedHREmployeeData()
  
  // Поиск senior специалистов готовых к ротации
  const seniorReadyForRotation = allEmployees.filter(emp => 
    emp.level === 'senior' && emp.readinessForRotation
  )
  console.log(`Senior специалисты готовые к ротации: ${seniorReadyForRotation.length}`)
  
  // Поиск по ключевым словам
  const searchResults = searchHREmployees('Frontend')
  console.log(`\nПоиск "Frontend": ${searchResults.length} результатов`)
  
  // Анализ навыков по отделам
  const departmentStats = ['Engineering', 'Data', 'Product', 'Design'].map(dept => {
    const deptEmployees = getHREmployeesByDepartment(dept)
    const avgSkillLevel = deptEmployees.reduce((sum, emp) => sum + emp.skillsStats.averageLevel, 0) / deptEmployees.length
    const totalExperts = deptEmployees.reduce((sum, emp) => sum + emp.skillsStats.expertSkills, 0)
    
    return {
      department: dept,
      employeeCount: deptEmployees.length,
      avgSkillLevel: avgSkillLevel.toFixed(1),
      totalExpertSkills: totalExperts
    }
  })
  
  console.log('\nСтатистика по отделам:')
  departmentStats.forEach(stat => {
    console.log(`${stat.department}: ${stat.employeeCount} сотр., средний уровень ${stat.avgSkillLevel}/5, экспертных навыков: ${stat.totalExpertSkills}`)
  })
  
  return { seniorReadyForRotation, searchResults, departmentStats }
}

// === ПРИМЕР 4: Детальная информация о навыках ===
function analyzeSkillsDistribution() {
  console.log('\n=== АНАЛИЗ НАВЫКОВ ===\n')
  
  const allEmployees = getUnifiedHREmployeeData()
  
  // Собираем статистику по всем навыкам
  const skillsMap = new Map<string, { count: number, levels: number[], avgLevel: number }>()
  
  allEmployees.forEach(emp => {
    emp.skills.forEach(skill => {
      if (!skillsMap.has(skill.skillName)) {
        skillsMap.set(skill.skillName, { count: 0, levels: [], avgLevel: 0 })
      }
      const skillStat = skillsMap.get(skill.skillName)!
      skillStat.count++
      skillStat.levels.push(skill.numericLevel)
    })
  })
  
  // Вычисляем средние уровни
  skillsMap.forEach((stat, skillName) => {
    stat.avgLevel = stat.levels.reduce((sum, level) => sum + level, 0) / stat.levels.length
  })
  
  // Топ-10 самых популярных навыков
  const topSkills = Array.from(skillsMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
  
  console.log('Топ-10 навыков в компании:')
  topSkills.forEach(([skillName, stat], index) => {
    console.log(`${index + 1}. ${skillName}: ${stat.count} сотрудников, средний уровень ${stat.avgLevel.toFixed(1)}/5`)
  })
  
  return { skillsMap, topSkills }
}

// === ГЛАВНАЯ ФУНКЦИЯ ДЕМОНСТРАЦИИ ===
export function demonstrateHRDataUsage() {
  console.log('🎯 ДЕМОНСТРАЦИЯ УНИФИЦИРОВАННОГО МАССИВА ДАННЫХ HR СИСТЕМЫ')
  console.log('=' .repeat(60))
  
  try {
    // Запускаем все примеры
    const allEmployees = getAllEmployeesForSearch()
    const oneClickResults = findEmployeesForOneClickSelection()
    const advancedResults = advancedEmployeeSearch()
    const skillsAnalysis = analyzeSkillsDistribution()
    
    console.log('\n✅ Все функции работают корректно!')
    console.log(`📊 Общая статистика:`)
    console.log(`   - Всего сотрудников: ${allEmployees.length}`)
    console.log(`   - React разработчиков: ${oneClickResults.reactDevelopers.length}`)
    console.log(`   - Python специалистов: ${oneClickResults.pythonExperts.length}`)
    console.log(`   - Уникальных навыков: ${skillsAnalysis.skillsMap.size}`)
    
    return {
      success: true,
      totalEmployees: allEmployees.length,
      skillsCount: skillsAnalysis.skillsMap.size,
      departmentStats: advancedResults.departmentStats
    }
    
  } catch (error) {
    console.error('❌ Ошибка при демонстрации:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Запуск демонстрации (раскомментируйте для тестирования)
// demonstrateHRDataUsage()