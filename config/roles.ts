// Конфигурация ролей PathFinder
import { Role, RequiredSkill } from '@/types'

// Базовые роли для демо
export const baseRoles: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Frontend Developer',
    description: 'Разработка пользовательских интерфейсов и клиентской части приложений',
    department: 'Engineering',
    level: 'middle',
    requiredSkills: [
      { skillId: 'javascript', level: 'advanced', weight: 0.9, isCritical: true },
      { skillId: 'react', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'css', level: 'intermediate', weight: 0.7, isCritical: true },
      { skillId: 'typescript', level: 'intermediate', weight: 0.6, isCritical: false }
    ],
    preferredSkills: [
      { skillId: 'nextjs', level: 'intermediate', weight: 0.5, isCritical: false },
      { skillId: 'ux-ui-design', level: 'beginner', weight: 0.4, isCritical: false },
      { skillId: 'testing', level: 'intermediate', weight: 0.5, isCritical: false }
    ],
    responsibilities: [
      'Разработка современных веб-интерфейсов',
      'Оптимизация производительности фронтенда',
      'Интеграция с REST API и GraphQL',
      'Написание автотестов',
      'Code review и менторинг junior разработчиков'
    ],
    qualifications: [
      'Опыт работы с React от 2 лет',
      'Знание современного JavaScript (ES6+)',
      'Понимание принципов UX/UI',
      'Опыт работы с системами контроля версий (Git)'
    ],
    salaryRange: {
      min: 150000,
      max: 250000,
      currency: 'RUB'
    },
    isActive: true,
    owner: 'frontend-lead',
    version: 1
  },
  
  {
    title: 'Backend Developer',
    description: 'Разработка серверной части приложений и API',
    department: 'Engineering',
    level: 'middle',
    requiredSkills: [
      { skillId: 'python', level: 'advanced', weight: 0.9, isCritical: true },
      { skillId: 'sql', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'api-development', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'docker', level: 'intermediate', weight: 0.6, isCritical: false }
    ],
    preferredSkills: [
      { skillId: 'aws', level: 'intermediate', weight: 0.5, isCritical: false },
      { skillId: 'redis', level: 'beginner', weight: 0.3, isCritical: false },
      { skillId: 'microservices', level: 'intermediate', weight: 0.6, isCritical: false }
    ],
    responsibilities: [
      'Разработка и поддержка REST API',
      'Проектирование архитектуры бэкенда',
      'Оптимизация работы с базами данных',
      'Интеграция с внешними сервисами',
      'Мониторинг и отладка production систем'
    ],
    qualifications: [
      'Опыт разработки на Python от 2 лет',
      'Знание реляционных баз данных',
      'Понимание принципов REST API',
      'Опыт работы с облачными платформами'
    ],
    salaryRange: {
      min: 160000,
      max: 260000,
      currency: 'RUB'
    },
    isActive: true,
    owner: 'backend-lead',
    version: 1
  },
  
  {
    title: 'Data Scientist',
    description: 'Анализ данных, машинное обучение и создание предиктивных моделей',
    department: 'Data',
    level: 'middle',
    requiredSkills: [
      { skillId: 'python', level: 'advanced', weight: 0.9, isCritical: true },
      { skillId: 'machine-learning', level: 'advanced', weight: 0.9, isCritical: true },
      { skillId: 'data-analysis', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'sql', level: 'intermediate', weight: 0.7, isCritical: true }
    ],
    preferredSkills: [
      { skillId: 'deep-learning', level: 'intermediate', weight: 0.6, isCritical: false },
      { skillId: 'spark', level: 'beginner', weight: 0.4, isCritical: false },
      { skillId: 'mlops', level: 'intermediate', weight: 0.5, isCritical: false }
    ],
    responsibilities: [
      'Разработка ML моделей и алгоритмов',
      'Анализ больших объемов данных',
      'A/B тестирование и статистический анализ',
      'Создание дашбордов и отчетов',
      'Консультирование бизнеса по данным'
    ],
    qualifications: [
      'Опыт работы с ML библиотеками (scikit-learn, pandas)',
      'Знание статистики и математики',
      'Опыт работы с большими данными',
      'Понимание бизнес-процессов'
    ],
    salaryRange: {
      min: 180000,
      max: 300000,
      currency: 'RUB'
    },
    isActive: true,
    owner: 'data-lead',
    version: 1
  },
  
  {
    title: 'Product Manager',
    description: 'Управление продуктом, стратегия и roadmap развития',
    department: 'Product',
    level: 'middle',
    requiredSkills: [
      { skillId: 'product-management', level: 'advanced', weight: 0.9, isCritical: true },
      { skillId: 'data-analysis', level: 'intermediate', weight: 0.7, isCritical: true },
      { skillId: 'communication', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'project-management', level: 'intermediate', weight: 0.6, isCritical: false }
    ],
    preferredSkills: [
      { skillId: 'user-research', level: 'intermediate', weight: 0.5, isCritical: false },
      { skillId: 'design-thinking', level: 'intermediate', weight: 0.4, isCritical: false },
      { skillId: 'sql', level: 'beginner', weight: 0.3, isCritical: false }
    ],
    responsibilities: [
      'Определение стратегии и roadmap продукта',
      'Работа с клиентами и исследование пользователей',
      'Анализ метрик и KPI продукта',
      'Координация между командами разработки',
      'Приоритизация фич и backlog management'
    ],
    qualifications: [
      'Опыт в product management от 2 лет',
      'Понимание Agile/Scrum методологий',
      'Опыт работы с аналитикой',
      'Сильные коммуникативные навыки'
    ],
    salaryRange: {
      min: 200000,
      max: 350000,
      currency: 'RUB'
    },
    isActive: true,
    owner: 'product-lead',
    version: 1
  },
  
  {
    title: 'DevOps Engineer',
    description: 'Автоматизация инфраструктуры и процессов разработки',
    department: 'Engineering',
    level: 'middle',
    requiredSkills: [
      { skillId: 'docker', level: 'advanced', weight: 0.9, isCritical: true },
      { skillId: 'aws', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'ci-cd', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'linux', level: 'advanced', weight: 0.7, isCritical: true }
    ],
    preferredSkills: [
      { skillId: 'kubernetes', level: 'intermediate', weight: 0.6, isCritical: false },
      { skillId: 'terraform', level: 'intermediate', weight: 0.5, isCritical: false },
      { skillId: 'monitoring', level: 'intermediate', weight: 0.5, isCritical: false }
    ],
    responsibilities: [
      'Настройка и поддержка CI/CD пайплайнов',
      'Управление облачной инфраструктурой',
      'Автоматизация процессов деплоя',
      'Мониторинг и alerting систем',
      'Обеспечение безопасности инфраструктуры'
    ],
    qualifications: [
      'Опыт работы с облачными платформами',
      'Знание containerization технологий',
      'Понимание сетевых протоколов',
      'Опыт автоматизации процессов'
    ],
    salaryRange: {
      min: 170000,
      max: 280000,
      currency: 'RUB'
    },
    isActive: true,
    owner: 'devops-lead',
    version: 1
  },
  
  {
    title: 'UX/UI Designer',
    description: 'Дизайн пользовательского опыта и интерфейсов',
    department: 'Design',
    level: 'middle',
    requiredSkills: [
      { skillId: 'ux-ui-design', level: 'advanced', weight: 0.9, isCritical: true },
      { skillId: 'figma', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'user-research', level: 'intermediate', weight: 0.7, isCritical: true },
      { skillId: 'prototyping', level: 'intermediate', weight: 0.6, isCritical: false }
    ],
    preferredSkills: [
      { skillId: 'design-systems', level: 'intermediate', weight: 0.5, isCritical: false },
      { skillId: 'accessibility', level: 'intermediate', weight: 0.4, isCritical: false },
      { skillId: 'html-css', level: 'beginner', weight: 0.3, isCritical: false }
    ],
    responsibilities: [
      'Создание wireframes и прототипов',
      'Проведение пользовательских исследований',
      'Разработка дизайн-системы',
      'Создание интерактивных прототипов',
      'Тестирование юзабилити'
    ],
    qualifications: [
      'Опыт в UX/UI дизайне от 2 лет',
      'Портфолио с реализованными проектами',
      'Знание принципов user-centered design',
      'Опыт работы в Agile командах'
    ],
    salaryRange: {
      min: 140000,
      max: 240000,
      currency: 'RUB'
    },
    isActive: true,
    owner: 'design-lead',
    version: 1
  },
  
  {
    title: 'Senior Frontend Developer',
    description: 'Ведущий фронтенд разработчик с архитектурными компетенциями',
    department: 'Engineering',
    level: 'senior',
    requiredSkills: [
      { skillId: 'javascript', level: 'expert', weight: 0.9, isCritical: true },
      { skillId: 'react', level: 'expert', weight: 0.9, isCritical: true },
      { skillId: 'typescript', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'leadership', level: 'intermediate', weight: 0.7, isCritical: true }
    ],
    preferredSkills: [
      { skillId: 'architecture', level: 'advanced', weight: 0.6, isCritical: false },
      { skillId: 'mentoring', level: 'intermediate', weight: 0.5, isCritical: false },
      { skillId: 'performance-optimization', level: 'advanced', weight: 0.6, isCritical: false }
    ],
    responsibilities: [
      'Архитектурные решения для фронтенда',
      'Менторинг junior и middle разработчиков',
      'Technical leadership в команде',
      'Code review и стандарты кода',
      'Планирование технического развития'
    ],
    qualifications: [
      'Опыт frontend разработки от 5 лет',
      'Опыт технического лидерства',
      'Глубокое понимание веб-технологий',
      'Опыт менторинга и обучения'
    ],
    salaryRange: {
      min: 250000,
      max: 400000,
      currency: 'RUB'
    },
    isActive: true,
    owner: 'engineering-director',
    version: 1
  },
  
  {
    title: 'Engineering Manager',
    description: 'Руководитель команды разработки',
    department: 'Engineering',
    level: 'lead',
    requiredSkills: [
      { skillId: 'leadership', level: 'advanced', weight: 0.9, isCritical: true },
      { skillId: 'project-management', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'communication', level: 'advanced', weight: 0.8, isCritical: true },
      { skillId: 'technical-background', level: 'advanced', weight: 0.7, isCritical: true }
    ],
    preferredSkills: [
      { skillId: 'agile-scrum', level: 'advanced', weight: 0.6, isCritical: false },
      { skillId: 'hiring', level: 'intermediate', weight: 0.5, isCritical: false },
      { skillId: 'strategic-thinking', level: 'intermediate', weight: 0.5, isCritical: false }
    ],
    responsibilities: [
      'Управление командой разработки',
      'Планирование и координация проектов',
      'Найм и развитие сотрудников',
      'Взаимодействие с другими отделами',
      'Техническая стратегия и roadmap'
    ],
    qualifications: [
      'Опыт управления командами от 3 лет',
      'Технический background в разработке',
      'Опыт найма и развития сотрудников',
      'Сильные лидерские качества'
    ],
    salaryRange: {
      min: 300000,
      max: 500000,
      currency: 'RUB'
    },
    isActive: true,
    owner: 'engineering-director',
    version: 1
  }
]

// Карьерные пути между ролями
export const careerPaths = {
  'frontend-developer': {
    next: ['senior-frontend-developer'],
    alternative: ['fullstack-developer', 'tech-lead'],
    timeline: '2-3 года'
  },
  'backend-developer': {
    next: ['senior-backend-developer'],
    alternative: ['fullstack-developer', 'solutions-architect'],
    timeline: '2-3 года'
  },
  'data-scientist': {
    next: ['senior-data-scientist'],
    alternative: ['ml-engineer', 'data-engineering'],
    timeline: '2-3 года'
  },
  'product-manager': {
    next: ['senior-product-manager'],
    alternative: ['product-owner', 'business-analyst'],
    timeline: '2-3 года'
  },
  'ux-ui-designer': {
    next: ['senior-ux-designer'],
    alternative: ['product-designer', 'design-lead'],
    timeline: '2-3 года'
  },
  'senior-frontend-developer': {
    next: ['tech-lead', 'engineering-manager'],
    alternative: ['solutions-architect', 'principal-engineer'],
    timeline: '2-4 года'
  }
}

// Матрица переходов между отделами
export const departmentTransitions = {
  'Engineering': ['Product', 'Data'],
  'Product': ['Engineering', 'Business'],
  'Design': ['Product', 'Marketing'],
  'Data': ['Engineering', 'Business', 'Product']
}
