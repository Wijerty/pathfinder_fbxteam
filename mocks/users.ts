// Mock данные пользователей для демонстрации
import { User, Profile, UserSkill, Experience, Education, ProfilePreferences, ProfileCompleteness } from '@/types'
import { allMockSkills } from './skills'

// Генератор случайных данных
const departments = ['Engineering', 'Product', 'Design', 'Data', 'DevOps', 'HR', 'Marketing']
const positions = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Senior Developer',
  'Product Manager', 'UX Designer', 'UI Designer', 'Data Scientist', 'ML Engineer',
  'DevOps Engineer', 'QA Engineer', 'Business Analyst', 'Project Manager',
  'HR Manager', 'Marketing Manager', 'Sales Manager'
]

// Функция для генерации детальных навыков пользователя с уровнями 1-5
function generateUserSkills(userId: string, count: number = 5): UserSkill[] {
  const shuffled = [...allMockSkills].sort(() => 0.5 - Math.random())
  const selectedSkills = shuffled.slice(0, count)
  
  return selectedSkills.map(skill => {
    // Генерируем уровень от 1 до 5
    const numericLevel = Math.floor(Math.random() * 5) + 1
    const levelMapping = {
      1: 'beginner',
      2: 'beginner', 
      3: 'intermediate',
      4: 'advanced',
      5: 'expert'
    }
    
    return {
      skillId: skill.id,
      level: levelMapping[numericLevel as keyof typeof levelMapping] as any,
      numericLevel, // Добавляем числовой уровень для удобства
      yearsOfExperience: Math.max(1, Math.floor(numericLevel * 2 + Math.random() * 3)),
      lastUsed: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      endorsements: Math.floor(Math.random() * (numericLevel * 3)),
      selfAssessed: Math.random() > 0.2,
      verifiedBy: numericLevel >= 4 ? [`user-${Math.floor(Math.random() * 15) + 1}`] : [],
      addedAt: new Date(2024, Math.floor(Math.random() * 8), Math.floor(Math.random() * 28) + 1),
      updatedAt: new Date(2024, 8, Math.floor(Math.random() * 20) + 1),
      proficiencyScore: numericLevel * 20 // Процентная оценка (20%, 40%, 60%, 80%, 100%)
    }
  })
}

// Функция для генерации опыта работы
function generateExperience(userId: string): Experience[] {
  const companies = ['Яндекс', 'Сбер', 'VK', 'Ozon', 'Wildberries', 'Тинькофф', 'МТС', 'Авито']
  const count = Math.floor(Math.random() * 3) + 1
  
  return Array.from({ length: count }, (_, i) => ({
    id: `exp-${userId}-${i + 1}`,
    title: positions[Math.floor(Math.random() * positions.length)],
    company: companies[Math.floor(Math.random() * companies.length)],
    description: 'Разработка и поддержка ключевых продуктов компании, участие в архитектурных решениях',
    startDate: new Date(2020 + i, Math.floor(Math.random() * 12), 1),
    endDate: i === 0 ? undefined : new Date(2022 + i, Math.floor(Math.random() * 12), 28),
    skills: allMockSkills.slice(0, 3).map(s => s.id),
    achievements: [
      'Увеличил производительность системы на 40%',
      'Внедрил новые технологии в команде',
      'Запустил успешный проект с нуля'
    ],
    isInternal: i === 0 // Текущая позиция - внутренняя
  }))
}

// Функция для генерации образования
function generateEducation(userId: string): Education[] {
  const universities = ['МГУ', 'МФТИ', 'ВШЭ', 'ИТМО', 'СПбГУ', 'МГТУ им. Баумана']
  const degrees = ['Бакалавр', 'Магистр', 'Специалист']
  const fields = ['Информатика', 'Математика', 'Физика', 'Экономика', 'Менеджмент']
  
  return [{
    id: `edu-${userId}-1`,
    institution: universities[Math.floor(Math.random() * universities.length)],
    degree: degrees[Math.floor(Math.random() * degrees.length)],
    fieldOfStudy: fields[Math.floor(Math.random() * fields.length)],
    startDate: new Date(2015, 8, 1),
    endDate: new Date(2019, 5, 30),
    gpa: 3.5 + Math.random() * 1.5,
    achievements: ['Красный диплом', 'Участник олимпиад']
  }]
}

// Функция для расчета полноты профиля
function calculateCompleteness(profile: Partial<Profile>): ProfileCompleteness {
  const sections = {
    basicInfo: 85, // Заполнено базовое инфо
    skills: Math.min(100, (profile.skills?.length || 0) * 20),
    experience: Math.min(100, (profile.experiences?.length || 0) * 50),
    education: Math.min(100, (profile.education?.length || 0) * 100),
    goals: Math.random() > 0.5 ? 80 : 40,
    preferences: 90
  }
  
  const overall = Math.round(
    Object.values(sections).reduce((sum, val) => sum + val, 0) / Object.keys(sections).length
  )
  
  const missingFields = []
  if (sections.skills < 60) missingFields.push('Добавьте больше навыков')
  if (sections.goals < 60) missingFields.push('Укажите карьерные цели')
  if (overall < 70) missingFields.push('Заполните дополнительную информацию')
  
  return {
    overall,
    sections,
    missingFields,
    recommendations: [
      'Добавьте описание ваших достижений',
      'Укажите предпочитаемые области развития',
      'Обновите информацию о текущих проектах'
    ],
    threshold: 70,
    lastCalculatedAt: new Date()
  }
}

// Mock пользователи - расширенный массив для HR системы
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'alex.petrov@company.com',
    firstName: 'Александр',
    lastName: 'Петров',
    displayName: 'Александр Петров',
    avatar: '/avatars/alex.jpg',
    role: 'employee',
    department: 'Engineering',
    position: 'Senior Frontend Developer',
    managerId: 'user-15',
    hireDate: new Date(2022, 2, 15),
    lastLoginAt: new Date(2024, 8, 20, 14, 30),
    isActive: true,
    profile: {} as Profile, // Заполним ниже
    createdAt: new Date(2022, 2, 15),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-2',
    email: 'maria.ivanova@company.com',
    firstName: 'Мария',
    lastName: 'Иванова',
    displayName: 'Мария Иванова',
    avatar: '/avatars/maria.jpg',
    role: 'employee',
    department: 'Product',
    position: 'Product Manager',
    managerId: 'user-15',
    hireDate: new Date(2021, 10, 8),
    lastLoginAt: new Date(2024, 8, 20, 16, 45),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2021, 10, 8),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-3',
    email: 'dmitry.kozlov@company.com',
    firstName: 'Дмитрий',
    lastName: 'Козлов',
    displayName: 'Дмитрий Козлов',
    avatar: '/avatars/dmitry.jpg',
    role: 'employee',
    department: 'Data',
    position: 'Data Scientist',
    managerId: 'user-14',
    hireDate: new Date(2023, 0, 20),
    lastLoginAt: new Date(2024, 8, 20, 11, 15),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2023, 0, 20),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-4',
    email: 'elena.smirnova@company.com',
    firstName: 'Елена',
    lastName: 'Смирнова',
    displayName: 'Елена Смирнова',
    avatar: '/avatars/elena.jpg',
    role: 'employee',
    department: 'Design',
    position: 'UX/UI Designer',
    managerId: 'user-13',
    hireDate: new Date(2022, 6, 3),
    lastLoginAt: new Date(2024, 8, 19, 18, 20),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2022, 6, 3),
    updatedAt: new Date(2024, 8, 19)
  },
  {
    id: 'user-5',
    email: 'viktor.popov@company.com',
    firstName: 'Виктор',
    lastName: 'Попов',
    displayName: 'Виктор Попов',
    avatar: '/avatars/viktor.jpg',
    role: 'employee',
    department: 'Engineering',
    position: 'Backend Developer',
    managerId: 'user-15',
    hireDate: new Date(2022, 11, 12),
    lastLoginAt: new Date(2024, 8, 20, 9, 30),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2022, 11, 12),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-6',
    email: 'anna.volkov@company.com',
    firstName: 'Анна',
    lastName: 'Волкова',
    displayName: 'Анна Волкова',
    avatar: '/avatars/anna.jpg',
    role: 'employee',
    department: 'DevOps',
    position: 'DevOps Engineer',
    managerId: 'user-12',
    hireDate: new Date(2023, 3, 5),
    lastLoginAt: new Date(2024, 8, 20, 13, 45),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2023, 3, 5),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-7',
    email: 'sergey.novikov@company.com',
    firstName: 'Сергей',
    lastName: 'Новиков',
    displayName: 'Сергей Новиков',
    avatar: '/avatars/sergey.jpg',
    role: 'employee',
    department: 'Engineering',
    position: 'Full Stack Developer',
    managerId: 'user-15',
    hireDate: new Date(2021, 8, 15),
    lastLoginAt: new Date(2024, 8, 20, 15, 10),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2021, 8, 15),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-8',
    email: 'olga.fedorova@company.com',
    firstName: 'Ольга',
    lastName: 'Федорова',
    displayName: 'Ольга Федорова',
    avatar: '/avatars/olga.jpg',
    role: 'employee',
    department: 'Data',
    position: 'ML Engineer',
    managerId: 'user-14',
    hireDate: new Date(2022, 4, 8),
    lastLoginAt: new Date(2024, 8, 19, 17, 25),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2022, 4, 8),
    updatedAt: new Date(2024, 8, 19)
  },
  {
    id: 'user-9',
    email: 'mikhail.lebedev@company.com',
    firstName: 'Михаил',
    lastName: 'Лебедев',
    displayName: 'Михаил Лебедев',
    avatar: '/avatars/mikhail.jpg',
    role: 'employee',
    department: 'Product',
    position: 'Business Analyst',
    managerId: 'user-13',
    hireDate: new Date(2023, 1, 14),
    lastLoginAt: new Date(2024, 8, 20, 12, 40),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2023, 1, 14),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-10',
    email: 'tatiana.morozova@company.com',
    firstName: 'Татьяна',
    lastName: 'Морозова',
    displayName: 'Татьяна Морозова',
    avatar: '/avatars/tatiana.jpg',
    role: 'employee',
    department: 'Engineering',
    position: 'QA Engineer',
    managerId: 'user-15',
    hireDate: new Date(2023, 5, 20),
    lastLoginAt: new Date(2024, 8, 20, 10, 15),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2023, 5, 20),
    updatedAt: new Date(2024, 8, 20)
  },
  // HR представители
  {
    id: 'user-11',
    email: 'nina.hr@company.com',
    firstName: 'Нина',
    lastName: 'Коваленко',
    displayName: 'Нина Коваленко',
    avatar: '/avatars/nina.jpg',
    role: 'hr',
    department: 'HR',
    position: 'HR Business Partner',
    hireDate: new Date(2020, 3, 10),
    lastLoginAt: new Date(2024, 8, 20, 8, 45),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2020, 3, 10),
    updatedAt: new Date(2024, 8, 20)
  },
  // Менеджеры и лиды
  {
    id: 'user-12',
    email: 'roman.devops@company.com',
    firstName: 'Роман',
    lastName: 'Соколов',
    displayName: 'Роман Соколов',
    avatar: '/avatars/roman.jpg',
    role: 'employee',
    department: 'DevOps',
    position: 'DevOps Team Lead',
    hireDate: new Date(2019, 8, 5),
    lastLoginAt: new Date(2024, 8, 20, 14, 0),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2019, 8, 5),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-13',
    email: 'irina.product@company.com',
    firstName: 'Ирина',
    lastName: 'Белова',
    displayName: 'Ирина Белова',
    avatar: '/avatars/irina.jpg',
    role: 'employee',
    department: 'Product',
    position: 'Head of Product',
    hireDate: new Date(2019, 1, 20),
    lastLoginAt: new Date(2024, 8, 20, 16, 30),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2019, 1, 20),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-14',
    email: 'pavel.data@company.com',
    firstName: 'Павел',
    lastName: 'Орлов',
    displayName: 'Павел Орлов',
    avatar: '/avatars/pavel.jpg',
    role: 'employee',
    department: 'Data',
    position: 'Head of Data Science',
    hireDate: new Date(2018, 10, 15),
    lastLoginAt: new Date(2024, 8, 20, 11, 45),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2018, 10, 15),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-15',
    email: 'alex.cto@company.com',
    firstName: 'Алексей',
    lastName: 'Григорьев',
    displayName: 'Алексей Григорьев',
    avatar: '/avatars/cto.jpg',
    role: 'admin',
    department: 'Engineering',
    position: 'CTO',
    hireDate: new Date(2018, 0, 8),
    lastLoginAt: new Date(2024, 8, 20, 17, 0),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2018, 0, 8),
    updatedAt: new Date(2024, 8, 20)
  },
  // Дополнительные сотрудники для расширенного HR массива
  {
    id: 'user-16',
    email: 'katarina.dev@company.com',
    firstName: 'Екатерина',
    lastName: 'Васильева',
    displayName: 'Екатерина Васильева',
    avatar: '/avatars/katarina.jpg',
    role: 'employee',
    department: 'Engineering',
    position: 'Junior Frontend Developer',
    managerId: 'user-1',
    hireDate: new Date(2024, 1, 10),
    lastLoginAt: new Date(2024, 8, 20, 12, 15),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2024, 1, 10),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-17',
    email: 'maxim.backend@company.com',
    firstName: 'Максим',
    lastName: 'Кузнецов',
    displayName: 'Максим Кузнецов',
    avatar: '/avatars/maxim.jpg',
    role: 'employee',
    department: 'Engineering',
    position: 'Senior Backend Developer',
    managerId: 'user-15',
    hireDate: new Date(2021, 5, 22),
    lastLoginAt: new Date(2024, 8, 20, 16, 40),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2021, 5, 22),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-18',
    email: 'julia.designer@company.com',
    firstName: 'Юлия',
    lastName: 'Романова',
    displayName: 'Юлия Романова',
    avatar: '/avatars/julia.jpg',
    role: 'employee',
    department: 'Design',
    position: 'Senior UI Designer',
    managerId: 'user-13',
    hireDate: new Date(2020, 9, 14),
    lastLoginAt: new Date(2024, 8, 19, 19, 30),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2020, 9, 14),
    updatedAt: new Date(2024, 8, 19)
  },
  {
    id: 'user-19',
    email: 'andrey.analyst@company.com',
    firstName: 'Андрей',
    lastName: 'Зайцев',
    displayName: 'Андрей Зайцев',
    avatar: '/avatars/andrey.jpg',
    role: 'employee',
    department: 'Data',
    position: 'Senior Data Analyst',
    managerId: 'user-14',
    hireDate: new Date(2022, 7, 1),
    lastLoginAt: new Date(2024, 8, 20, 14, 20),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2022, 7, 1),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-20',
    email: 'svetlana.pm@company.com',
    firstName: 'Светлана',
    lastName: 'Николаева',
    displayName: 'Светлана Николаева',
    avatar: '/avatars/svetlana.jpg',
    role: 'employee',
    department: 'Product',
    position: 'Senior Product Manager',
    managerId: 'user-13',
    hireDate: new Date(2020, 11, 5),
    lastLoginAt: new Date(2024, 8, 20, 15, 50),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2020, 11, 5),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-21',
    email: 'denis.devops@company.com',
    firstName: 'Денис',
    lastName: 'Михайлов',
    displayName: 'Денис Михайлов',
    avatar: '/avatars/denis.jpg',
    role: 'employee',
    department: 'DevOps',
    position: 'Senior DevOps Engineer',
    managerId: 'user-12',
    hireDate: new Date(2021, 3, 18),
    lastLoginAt: new Date(2024, 8, 20, 11, 25),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2021, 3, 18),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-22',
    email: 'natalia.qa@company.com',
    firstName: 'Наталья',
    lastName: 'Степанова',
    displayName: 'Наталья Степанова',
    avatar: '/avatars/natalia.jpg',
    role: 'employee',
    department: 'Engineering',
    position: 'Senior QA Engineer',
    managerId: 'user-15',
    hireDate: new Date(2022, 0, 25),
    lastLoginAt: new Date(2024, 8, 20, 13, 10),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2022, 0, 25),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-23',
    email: 'igor.ml@company.com',
    firstName: 'Игорь',
    lastName: 'Павлов',
    displayName: 'Игорь Павлов',
    avatar: '/avatars/igor.jpg',
    role: 'employee',
    department: 'Data',
    position: 'Senior ML Engineer',
    managerId: 'user-14',
    hireDate: new Date(2021, 9, 12),
    lastLoginAt: new Date(2024, 8, 20, 17, 15),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2021, 9, 12),
    updatedAt: new Date(2024, 8, 20)
  },
  {
    id: 'user-24',
    email: 'marina.ux@company.com',
    firstName: 'Марина',
    lastName: 'Алексеева',
    displayName: 'Марина Алексеева',
    avatar: '/avatars/marina.jpg',
    role: 'employee',
    department: 'Design',
    position: 'Lead UX Researcher',
    managerId: 'user-13',
    hireDate: new Date(2019, 6, 8),
    lastLoginAt: new Date(2024, 8, 19, 20, 45),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2019, 6, 8),
    updatedAt: new Date(2024, 8, 19)
  },
  {
    id: 'user-25',
    email: 'vladimir.arch@company.com',
    firstName: 'Владимир',
    lastName: 'Семенов',
    displayName: 'Владимир Семенов',
    avatar: '/avatars/vladimir.jpg',
    role: 'employee',
    department: 'Engineering',
    position: 'Solution Architect',
    managerId: 'user-15',
    hireDate: new Date(2019, 2, 20),
    lastLoginAt: new Date(2024, 8, 20, 18, 0),
    isActive: true,
    profile: {} as Profile,
    createdAt: new Date(2019, 2, 20),
    updatedAt: new Date(2024, 8, 20)
  }
]

// Специализированная функция для генерации навыков по ролям
function generateRoleSpecificSkills(userId: string, position: string, department: string): UserSkill[] {
  const roleSkillsMap: Record<string, string[]> = {
    'Frontend Developer': ['JavaScript', 'React', 'TypeScript', 'CSS', 'HTML', 'Git'],
    'Backend Developer': ['Node.js', 'Python', 'PostgreSQL', 'API Design', 'Git', 'Docker'],
    'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Git', 'Docker'],
    'Data Scientist': ['Python', 'Machine Learning', 'SQL', 'Statistics', 'TensorFlow', 'Tableau'],
    'ML Engineer': ['Python', 'TensorFlow', 'Machine Learning', 'Docker', 'Kubernetes', 'Git'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Git', 'Linux'],
    'Product Manager': ['Agile/Scrum', 'Product Strategy', 'Analytics', 'User Research', 'Communication'],
    'UX/UI Designer': ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Adobe Creative Suite'],
    'QA Engineer': ['Test Automation', 'Manual Testing', 'Git', 'Bug Tracking', 'API Testing'],
    'Business Analyst': ['Data Analysis', 'SQL', 'Business Intelligence', 'Requirements Analysis', 'Agile/Scrum'],
    'Solution Architect': ['System Design', 'Cloud Architecture', 'Microservices', 'API Design', 'Leadership']
  }
  
  // Получаем базовые навыки для роли
  const baseSkills = roleSkillsMap[position] || ['Communication', 'Problem Solving', 'Teamwork']
  
  // Добавляем дополнительные навыки из общего пула
  const additionalSkillsCount = Math.floor(Math.random() * 4) + 2
  const shuffledAllSkills = [...allMockSkills].sort(() => 0.5 - Math.random())
  const additionalSkills = shuffledAllSkills
    .filter(skill => !baseSkills.includes(skill.name))
    .slice(0, additionalSkillsCount)
    .map(skill => skill.name)
  
  const allSkillNames = [...baseSkills, ...additionalSkills]
  
  return allSkillNames.map((skillName, index) => {
    const skill = allMockSkills.find(s => s.name === skillName) || allMockSkills[0]
    const isCore = baseSkills.includes(skillName)
    
    // Основные навыки имеют более высокий уровень
    const baseLevel = isCore ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 5) + 1
    const numericLevel = Math.min(5, baseLevel)
    
    const levelMapping = {
      1: 'beginner',
      2: 'beginner', 
      3: 'intermediate',
      4: 'advanced',
      5: 'expert'
    }
    
    return {
      skillId: skill.id,
      level: levelMapping[numericLevel as keyof typeof levelMapping] as any,
      numericLevel,
      yearsOfExperience: Math.max(1, Math.floor(numericLevel * 1.5 + Math.random() * 2)),
      lastUsed: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      endorsements: Math.floor(Math.random() * (numericLevel * 4)),
      selfAssessed: Math.random() > 0.15,
      verifiedBy: numericLevel >= 4 ? [`user-${Math.floor(Math.random() * 15) + 1}`] : [],
      addedAt: new Date(2024, Math.floor(Math.random() * 8), Math.floor(Math.random() * 28) + 1),
      updatedAt: new Date(2024, 8, Math.floor(Math.random() * 20) + 1),
      proficiencyScore: numericLevel * 20
    }
  })
}

// Заполняем профили пользователей
mockUsers.forEach(user => {
  const skills = generateRoleSpecificSkills(user.id, user.position, user.department)
  const experiences = generateExperience(user.id)
  const education = generateEducation(user.id)
  
  const preferences: ProfilePreferences = {
    isProfilePublic: true,
    allowInternalRecruiting: Math.random() > 0.2,
    careerInterests: ['leadership', 'technical-growth', 'mentoring'].slice(0, Math.floor(Math.random() * 3) + 1),
    workLocationPreference: ['remote', 'office', 'hybrid'][Math.floor(Math.random() * 3)] as any,
    travelWillingness: Math.floor(Math.random() * 101),
    mentorshipInterest: ['mentee', 'mentor', 'both', 'none'][Math.floor(Math.random() * 4)] as any,
    communicationPreferences: {
      email: true,
      inApp: true,
      voiceAssistant: Math.random() > 0.3
    }
  }
  
  const profile: Profile = {
    userId: user.id,
    bio: `Опытный ${user.position.toLowerCase()} с ${Math.floor(Math.random() * 8) + 2} годами опыта в индустрии.`,
    skills,
    experiences,
    education,
    certifications: [],
    preferences,
    completeness: {} as ProfileCompleteness, // Заполним ниже
    readinessForRotation: Math.random() > 0.6,
    careerGoals: [
      'Развитие в техническом лидерстве',
      'Изучение новых технологий',
      'Менторинг младших коллег'
    ].slice(0, Math.floor(Math.random() * 3) + 1),
    updatedAt: new Date(2024, 8, Math.floor(Math.random() * 20) + 1)
  }
  
  profile.completeness = calculateCompleteness(profile)
  user.profile = profile
})

// Специальные пользователи для демо
export const demoUsers = {
  employee: mockUsers.find(u => u.id === 'user-1')!,
  hr: mockUsers.find(u => u.role === 'hr')!,
  admin: mockUsers.find(u => u.role === 'admin')!
}

// Функции для работы с mock данными
export function getUserById(id: string): User | undefined {
  return mockUsers.find(user => user.id === id)
}

export function getUsersByDepartment(department: string): User[] {
  return mockUsers.filter(user => user.department === department)
}

export function getUsersByRole(role: string): User[] {
  return mockUsers.filter(user => user.role === role)
}

export function searchUsers(query: string): User[] {
  const lowercaseQuery = query.toLowerCase()
  return mockUsers.filter(user =>
    user.firstName.toLowerCase().includes(lowercaseQuery) ||
    user.lastName.toLowerCase().includes(lowercaseQuery) ||
    user.position.toLowerCase().includes(lowercaseQuery) ||
    user.department.toLowerCase().includes(lowercaseQuery)
  )
}

// === УНИФИЦИРОВАННЫЙ МАССИВ ДЛЯ HR СИСТЕМЫ ===

// Интерфейс для унифицированных данных сотрудника в HR системе
export interface HREmployeeData {
  // Основная информация
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  
  // Рабочая информация
  position: string
  department: string
  level: string // junior, middle, senior, lead, principal
  managerId?: string
  managerName?: string
  hireDate: Date
  yearsInCompany: number
  
  // Навыки с детальными уровнями
  skills: {
    skillId: string
    skillName: string
    category: string
    level: SkillLevel
    numericLevel: number // 1-5
    proficiencyScore: number // 0-100%
    yearsOfExperience: number
    isCore: boolean // Ключевой навык для роли
    lastUsed?: Date
    endorsements: number
    verified: boolean
  }[]
  
  // Статистика навыков
  skillsStats: {
    totalSkills: number
    averageLevel: number
    expertSkills: number
    coreSkillsCount: number
    recentlyUsedSkills: number
  }
  
  // Опыт и образование
  totalExperience: number
  currentRole: {
    title: string
    startDate: Date
    duration: number // в месяцах
  }
  education: {
    degree: string
    institution: string
    fieldOfStudy: string
  }[]
  
  // HR метрики
  readinessForRotation: boolean
  careerGoals: string[]
  profileCompleteness: number
  lastActive: Date
  isActive: boolean
  
  // Предпочтения
  workLocationPreference: string
  mentorshipInterest: string
  availableForInternalRecruiting: boolean
}

// Функция для преобразования User в HREmployeeData
function transformToHRData(user: User): HREmployeeData {
  const currentYear = new Date().getFullYear()
  const hireYear = user.hireDate.getFullYear()
  const yearsInCompany = currentYear - hireYear
  
  // Определяем уровень на основе позиции
  const getLevel = (position: string): string => {
    if (position.includes('Junior')) return 'junior'
    if (position.includes('Senior') || position.includes('Lead')) return 'senior'
    if (position.includes('Principal') || position.includes('Architect')) return 'principal'
    if (position.includes('Head') || position.includes('CTO')) return 'lead'
    return 'middle'
  }
  
  // Преобразуем навыки
  const transformedSkills = user.profile.skills.map(userSkill => {
    const skill = allMockSkills.find(s => s.id === userSkill.skillId) || allMockSkills[0]
    return {
      skillId: userSkill.skillId,
      skillName: skill.name,
      category: skill.category,
      level: userSkill.level,
      numericLevel: userSkill.numericLevel || 3,
      proficiencyScore: userSkill.proficiencyScore || 60,
      yearsOfExperience: userSkill.yearsOfExperience,
      isCore: skill.isCore,
      lastUsed: userSkill.lastUsed,
      endorsements: userSkill.endorsements,
      verified: (userSkill.verifiedBy?.length || 0) > 0
    }
  })
  
  // Вычисляем статистику навыков
  const skillsStats = {
    totalSkills: transformedSkills.length,
    averageLevel: transformedSkills.reduce((sum, skill) => sum + skill.numericLevel, 0) / transformedSkills.length,
    expertSkills: transformedSkills.filter(skill => skill.level === 'expert').length,
    coreSkillsCount: transformedSkills.filter(skill => skill.isCore).length,
    recentlyUsedSkills: transformedSkills.filter(skill => {
      if (!skill.lastUsed) return false
      const monthsAgo = (Date.now() - skill.lastUsed.getTime()) / (1000 * 60 * 60 * 24 * 30)
      return monthsAgo <= 6
    }).length
  }
  
  // Получаем информацию о менеджере
  const manager = user.managerId ? mockUsers.find(u => u.id === user.managerId) : undefined
  
  // Текущая роль
  const currentExperience = user.profile.experiences.find(exp => !exp.endDate)
  const currentRole = {
    title: user.position,
    startDate: currentExperience?.startDate || user.hireDate,
    duration: currentExperience ? 
      Math.floor((Date.now() - currentExperience.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) :
      Math.floor((Date.now() - user.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  }
  
  return {
    id: user.id,
    fullName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
    
    position: user.position,
    department: user.department,
    level: getLevel(user.position),
    managerId: user.managerId,
    managerName: manager ? manager.displayName : undefined,
    hireDate: user.hireDate,
    yearsInCompany,
    
    skills: transformedSkills,
    skillsStats,
    
    totalExperience: user.profile.experiences.reduce((total, exp) => {
      const start = exp.startDate.getTime()
      const end = exp.endDate ? exp.endDate.getTime() : Date.now()
      return total + Math.floor((end - start) / (1000 * 60 * 60 * 24 * 365))
    }, 0),
    
    currentRole,
    
    education: user.profile.education.map(edu => ({
      degree: edu.degree,
      institution: edu.institution,
      fieldOfStudy: edu.fieldOfStudy
    })),
    
    readinessForRotation: user.profile.readinessForRotation,
    careerGoals: user.profile.careerGoals,
    profileCompleteness: user.profile.completeness.overall,
    lastActive: user.lastLoginAt || user.updatedAt,
    isActive: user.isActive,
    
    workLocationPreference: user.profile.preferences.workLocationPreference,
    mentorshipInterest: user.profile.preferences.mentorshipInterest,
    availableForInternalRecruiting: user.profile.preferences.allowInternalRecruiting
  }
}

// ГЛАВНАЯ ЭКСПОРТНАЯ ФУНКЦИЯ - Унифицированный массив данных для HR системы
export function getUnifiedHREmployeeData(): HREmployeeData[] {
  return mockUsers
    .filter(user => user.isActive && user.role === 'employee') // Только активные сотрудники
    .map(transformToHRData)
    .sort((a, b) => a.fullName.localeCompare(b.fullName)) // Сортировка по имени
}

// Дополнительные функции для работы с HR данными
export function getHREmployeeById(id: string): HREmployeeData | undefined {
  const user = mockUsers.find(u => u.id === id)
  return user ? transformToHRData(user) : undefined
}

export function getHREmployeesByDepartment(department: string): HREmployeeData[] {
  return getUnifiedHREmployeeData().filter(emp => emp.department === department)
}

export function getHREmployeesBySkill(skillName: string, minLevel: number = 1): HREmployeeData[] {
  return getUnifiedHREmployeeData().filter(emp => 
    emp.skills.some(skill => 
      skill.skillName.toLowerCase().includes(skillName.toLowerCase()) && 
      skill.numericLevel >= minLevel
    )
  )
}

export interface HREmployeeFilters {
  query?: string
  department?: string
  position?: string
  skills?: string[]
  level?: string
  minExperience?: number
  maxExperience?: number
  isActive?: boolean
  availableForRotation?: boolean
}

export function searchHREmployees(query: string): HREmployeeData[] {
  const lowercaseQuery = query.toLowerCase()
  return getUnifiedHREmployeeData().filter(emp =>
    emp.fullName.toLowerCase().includes(lowercaseQuery) ||
    emp.position.toLowerCase().includes(lowercaseQuery) ||
    emp.department.toLowerCase().includes(lowercaseQuery) ||
    emp.skills.some(skill => skill.skillName.toLowerCase().includes(lowercaseQuery))
  )
}

export function filterHREmployees(filters: HREmployeeFilters): HREmployeeData[] {
  let employees = getUnifiedHREmployeeData()

  // Фильтр по общему поиску
  if (filters.query && filters.query.trim()) {
    const lowercaseQuery = filters.query.toLowerCase().trim()
    employees = employees.filter(emp =>
      emp.fullName.toLowerCase().includes(lowercaseQuery) ||
      emp.position.toLowerCase().includes(lowercaseQuery) ||
      emp.department.toLowerCase().includes(lowercaseQuery) ||
      emp.skills.some(skill => skill.skillName.toLowerCase().includes(lowercaseQuery))
    )
  }

  // Фильтр по отделу
  if (filters.department && filters.department !== 'all') {
    employees = employees.filter(emp => emp.department === filters.department)
  }

  // Фильтр по должности
  if (filters.position && filters.position !== 'all') {
    employees = employees.filter(emp => emp.position === filters.position)
  }

  // Фильтр по навыкам
  if (filters.skills && filters.skills.length > 0) {
    employees = employees.filter(emp =>
      filters.skills!.every(skillName =>
        emp.skills.some(skill =>
          skill.skillName.toLowerCase().includes(skillName.toLowerCase())
        )
      )
    )
  }

  // Фильтр по уровню
  if (filters.level && filters.level !== 'all') {
    employees = employees.filter(emp => emp.level === filters.level)
  }

  // Фильтр по опыту (минимум)
  if (filters.minExperience !== undefined && filters.minExperience > 0) {
    employees = employees.filter(emp => emp.totalExperience >= filters.minExperience!)
  }

  // Фильтр по опыту (максимум)
  if (filters.maxExperience !== undefined && filters.maxExperience > 0) {
    employees = employees.filter(emp => emp.totalExperience <= filters.maxExperience!)
  }

  // Фильтр по активности
  if (filters.isActive !== undefined) {
    employees = employees.filter(emp => emp.isActive === filters.isActive)
  }

  // Фильтр по готовности к ротации
  if (filters.availableForRotation !== undefined) {
    employees = employees.filter(emp => emp.readinessForRotation === filters.availableForRotation)
  }

  return employees
}

// Получить уникальные отделы для фильтра
export function getUniqueDepartments(): string[] {
  const departments = getUnifiedHREmployeeData().map(emp => emp.department)
  return [...new Set(departments)].sort()
}

// Получить уникальные должности для фильтра
export function getUniquePositions(): string[] {
  const positions = getUnifiedHREmployeeData().map(emp => emp.position)
  return [...new Set(positions)].sort()
}

// Получить уникальные уровни для фильтра
export function getUniqueLevels(): string[] {
  const levels = getUnifiedHREmployeeData().map(emp => emp.level)
  return [...new Set(levels)].sort()
}

// Получить популярные навыки для автокомплита
export function getPopularSkills(limit: number = 20): string[] {
  const skillCounts = new Map<string, number>()
  
  getUnifiedHREmployeeData().forEach(emp => {
    emp.skills.forEach(skill => {
      const count = skillCounts.get(skill.skillName) || 0
      skillCounts.set(skill.skillName, count + 1)
    })
  })
  
  return Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skillName]) => skillName)
}
