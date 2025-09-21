// Mock данные вакансий для демонстрации
import { Vacancy } from '@/types'

export const mockVacancies: Vacancy[] = [
  {
    id: 'vacancy-1',
    title: 'Senior Full Stack Developer',
    description: `Мы ищем опытного Full Stack разработчика для работы над ключевыми продуктами компании.
    
В команде вы будете:
- Разрабатывать современные веб-приложения
- Участвовать в архитектурных решениях
- Менторить junior разработчиков
- Внедрять лучшие практики разработки

Наш стек: React, TypeScript, Node.js, PostgreSQL, Docker, AWS`,
    department: 'Engineering',
    roleId: 'role-7', // Senior Frontend Developer из конфига
    requiredSkills: [
      { skillId: 'skill-1', level: 'advanced', weight: 0.9, isCritical: true }, // JavaScript
      { skillId: 'skill-3', level: 'advanced', weight: 0.9, isCritical: true }, // React
      { skillId: 'skill-2', level: 'intermediate', weight: 0.7, isCritical: true }, // Python/Node.js
      { skillId: 'skill-7', level: 'intermediate', weight: 0.6, isCritical: false }, // SQL
      { skillId: 'skill-5', level: 'intermediate', weight: 0.5, isCritical: false }  // Docker
    ],
    preferredSkills: [
      { skillId: 'skill-15', level: 'intermediate', weight: 0.4, isCritical: false }, // AWS
      { skillId: 'skill-16', level: 'beginner', weight: 0.3, isCritical: false },     // TypeScript
      { skillId: 'skill-8', level: 'intermediate', weight: 0.5, isCritical: false }   // Project Management
    ],
    requirements: [
      'Опыт full-stack разработки от 4 лет',
      'Глубокие знания JavaScript и современных фреймворков',
      'Опыт работы с REST API и базами данных',
      'Понимание принципов DevOps и CI/CD',
      'Опыт работы в Agile командах',
      'Английский язык на уровне чтения технической документации'
    ],
    responsibilities: [
      'Разработка фронтенд и бэкенд частей веб-приложений',
      'Проектирование и реализация REST API',
      'Оптимизация производительности приложений',
      'Code review и менторинг команды',
      'Участие в планировании архитектуры',
      'Внедрение новых технологий и практик'
    ],
    benefits: [
      'Гибкий график работы',
      'Возможность удаленной работы',
      'ДМС для сотрудника и семьи',
      'Компенсация обучения и конференций',
      'Современное оборудование',
      'Корпоративные мероприятия'
    ],
    salaryRange: {
      min: 250000,
      max: 400000,
      currency: 'RUB'
    },
    location: 'Москва',
    workType: 'hybrid',
    experienceYears: {
      min: 4,
      max: 8
    },
    status: 'active',
    hiringManagerId: 'user-15', // CTO
    hrContactId: 'user-11',     // HR
    postedAt: new Date(2024, 8, 1),
    expiresAt: new Date(2024, 10, 1),
    createdAt: new Date(2024, 8, 1),
    updatedAt: new Date(2024, 8, 15)
  },
  
  {
    id: 'vacancy-2',
    title: 'Product Manager - ИИ Продукты',
    description: `Ищем Product Manager для развития ИИ-продуктов и платформ машинного обучения.
    
Что предстоит делать:
- Развивать стратегию ИИ-продуктов
- Работать с data science командой
- Анализировать пользователей и метрики
- Координировать запуск новых фич
- Взаимодействовать с техническими командами

Идеальный кандидат имеет опыт в продуктах с ML компонентами.`,
    department: 'Product',
    roleId: 'role-4', // Product Manager
    requiredSkills: [
      { skillId: 'skill-9', level: 'advanced', weight: 0.9, isCritical: true },  // Product Management
      { skillId: 'skill-6', level: 'intermediate', weight: 0.8, isCritical: true }, // Data Analysis
      { skillId: 'skill-11', level: 'advanced', weight: 0.8, isCritical: true }, // Communication
      { skillId: 'skill-8', level: 'intermediate', weight: 0.6, isCritical: false } // Project Management
    ],
    preferredSkills: [
      { skillId: 'skill-4', level: 'beginner', weight: 0.5, isCritical: false },   // Machine Learning
      { skillId: 'skill-7', level: 'beginner', weight: 0.4, isCritical: false },   // SQL
      { skillId: 'skill-20', level: 'intermediate', weight: 0.5, isCritical: false } // User Research
    ],
    requirements: [
      'Опыт в product management от 3 лет',
      'Понимание принципов машинного обучения',
      'Опыт работы с data-driven продуктами',
      'Сильные аналитические навыки',
      'Опыт A/B тестирования',
      'Английский язык на уровне переговоров'
    ],
    responsibilities: [
      'Определение roadmap ИИ-продуктов',
      'Анализ пользователей и их потребностей',
      'Работа с метриками и KPI',
      'Координация между командами',
      'Планирование и приоритизация фич',
      'Презентация результатов стейкхолдерам'
    ],
    benefits: [
      'Работа с cutting-edge технологиями',
      'Международная команда',
      'Участие в конференциях',
      'Обучение и развитие',
      'Гибкий график',
      'Премии за результат'
    ],
    salaryRange: {
      min: 200000,
      max: 350000,
      currency: 'RUB'
    },
    location: 'Санкт-Петербург',
    workType: 'hybrid',
    experienceYears: {
      min: 3,
      max: 7
    },
    status: 'active',
    hiringManagerId: 'user-13', // Head of Product
    hrContactId: 'user-11',
    postedAt: new Date(2024, 7, 15),
    expiresAt: new Date(2024, 9, 15),
    createdAt: new Date(2024, 7, 15),
    updatedAt: new Date(2024, 8, 10)
  },
  
  {
    id: 'vacancy-3',
    title: 'Lead Data Scientist',
    description: `Приглашаем Lead Data Scientist для руководства командой и развития ML платформы.
    
Ключевые задачи:
- Техническое лидерство ML команды
- Разработка архитектуры ML систем
- Исследование и внедрение новых алгоритмов
- Менторинг data scientists
- Взаимодействие с продуктовыми командами

Мы предлагаем работу с большими объемами данных и современным ML стеком.`,
    department: 'Data',
    roleId: 'role-3', // Data Scientist (но как senior/lead)
    requiredSkills: [
      { skillId: 'skill-4', level: 'expert', weight: 0.95, isCritical: true },    // Machine Learning
      { skillId: 'skill-2', level: 'expert', weight: 0.9, isCritical: true },     // Python
      { skillId: 'skill-6', level: 'advanced', weight: 0.8, isCritical: true },   // Data Analysis
      { skillId: 'skill-10', level: 'advanced', weight: 0.7, isCritical: true },  // Leadership
      { skillId: 'skill-7', level: 'advanced', weight: 0.6, isCritical: false }   // SQL
    ],
    preferredSkills: [
      { skillId: 'skill-18', level: 'advanced', weight: 0.6, isCritical: false }, // TensorFlow
      { skillId: 'skill-5', level: 'intermediate', weight: 0.4, isCritical: false }, // Docker
      { skillId: 'skill-15', level: 'intermediate', weight: 0.5, isCritical: false }  // AWS
    ],
    requirements: [
      'Опыт в data science от 5 лет',
      'Опыт руководства командой от 2 лет',
      'Глубокие знания ML алгоритмов',
      'Опыт productionizing ML моделей',
      'Понимание MLOps практик',
      'Публикации или участие в конференциях (плюс)'
    ],
    responsibilities: [
      'Руководство командой data scientists',
      'Архитектура ML решений',
      'Исследование и разработка алгоритмов',
      'Код-ревью и менторинг',
      'Планирование и оценка задач',
      'Взаимодействие с business stakeholders'
    ],
    benefits: [
      'Возможность влиять на продукт',
      'Работа с большими данными',
      'Современная инфраструктура',
      'Бюджет на эксперименты',
      'Участие в исследованиях',
      'Топ зарплата на рынке'
    ],
    salaryRange: {
      min: 300000,
      max: 500000,
      currency: 'RUB'
    },
    location: 'Москва',
    workType: 'office',
    experienceYears: {
      min: 5,
      max: 12
    },
    status: 'active',
    hiringManagerId: 'user-14', // Head of Data Science
    hrContactId: 'user-11',
    postedAt: new Date(2024, 8, 10),
    expiresAt: new Date(2024, 11, 10),
    createdAt: new Date(2024, 8, 10),
    updatedAt: new Date(2024, 8, 18)
  },
  
  // Дополнительная вакансия в статусе draft для демо админки
  {
    id: 'vacancy-4',
    title: 'Junior UX Designer',
    description: `Ищем талантливого junior UX дизайнера в нашу креативную команду.
    
Что будешь делать:
- Создавать wireframes и прототипы
- Проводить пользовательские интервью
- Работать над дизайн-системой
- Участвовать в юзабилити тестированиях
- Сотрудничать с разработчиками

Это отличная возможность начать карьеру в UX под руководством опытных дизайнеров.`,
    department: 'Design',
    roleId: 'role-6', // UX/UI Designer
    requiredSkills: [
      { skillId: 'skill-12', level: 'intermediate', weight: 0.9, isCritical: true }, // UX/UI Design
      { skillId: 'skill-17', level: 'intermediate', weight: 0.8, isCritical: true }, // Figma
      { skillId: 'skill-20', level: 'beginner', weight: 0.6, isCritical: false }     // User Research
    ],
    preferredSkills: [
      { skillId: 'skill-11', level: 'intermediate', weight: 0.5, isCritical: false }, // Communication
      { skillId: 'skill-19', level: 'beginner', weight: 0.3, isCritical: false }      // HTML/CSS
    ],
    requirements: [
      'Портфолио с UX/UI проектами',
      'Базовые знания дизайн-процессов',
      'Понимание user-centered design',
      'Знание Figma или аналогов',
      'Желание учиться и развиваться'
    ],
    responsibilities: [
      'Создание пользовательских интерфейсов',
      'Проведение исследований пользователей',
      'Прототипирование решений',
      'Участие в design review',
      'Поддержка дизайн-системы'
    ],
    benefits: [
      'Менторство опытных дизайнеров',
      'Работа над реальными продуктами',
      'Обучение и курсы',
      'Современные инструменты',
      'Творческая атмосфера'
    ],
    salaryRange: {
      min: 80000,
      max: 140000,
      currency: 'RUB'
    },
    location: 'Москва',
    workType: 'hybrid',
    experienceYears: {
      min: 0,
      max: 2
    },
    status: 'draft',
    hiringManagerId: 'user-13', // Head of Product (курирует дизайн)
    hrContactId: 'user-11',
    postedAt: new Date(2024, 8, 20),
    createdAt: new Date(2024, 8, 20),
    updatedAt: new Date(2024, 8, 20)
  }
]

// Функции для работы с вакансиями
export function getVacancyById(id: string): Vacancy | undefined {
  return mockVacancies.find(vacancy => vacancy.id === id)
}

export function getActiveVacancies(): Vacancy[] {
  return mockVacancies.filter(vacancy => vacancy.status === 'active')
}

export function getVacanciesByDepartment(department: string): Vacancy[] {
  return mockVacancies.filter(vacancy => vacancy.department === department)
}

export function searchVacancies(query: string): Vacancy[] {
  const lowercaseQuery = query.toLowerCase()
  return mockVacancies.filter(vacancy =>
    vacancy.title.toLowerCase().includes(lowercaseQuery) ||
    vacancy.description.toLowerCase().includes(lowercaseQuery) ||
    vacancy.department.toLowerCase().includes(lowercaseQuery)
  )
}
