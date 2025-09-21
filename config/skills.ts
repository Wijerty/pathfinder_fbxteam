// Конфигурация навыков PathFinder
import { Skill, CompetencyArea } from '@/types'

export const skillCategories = {
  // Технические навыки
  'programming': 'Программирование',
  'data-science': 'Наука о данных',
  'devops': 'DevOps и инфраструктура',
  'security': 'Информационная безопасность',
  'mobile': 'Мобильная разработка',
  'web': 'Веб-разработка',
  'ai-ml': 'ИИ и машинное обучение',
  'databases': 'Базы данных',
  'cloud': 'Облачные технологии',
  
  // Бизнес навыки
  'project-management': 'Управление проектами',
  'product-management': 'Продакт-менеджмент',
  'business-analysis': 'Бизнес-анализ',
  'finance': 'Финансы',
  'marketing': 'Маркетинг',
  'sales': 'Продажи',
  'consulting': 'Консалтинг',
  
  // Soft skills
  'leadership': 'Лидерство',
  'communication': 'Коммуникации',
  'teamwork': 'Командная работа',
  'problem-solving': 'Решение проблем',
  'creativity': 'Креативность',
  'time-management': 'Управление временем',
  'mentoring': 'Наставничество',
  
  // Аналитические навыки
  'data-analysis': 'Анализ данных',
  'research': 'Исследования',
  'strategic-thinking': 'Стратегическое мышление',
  'process-optimization': 'Оптимизация процессов'
} as const

export const competencyAreaMap: Record<string, CompetencyArea> = {
  'programming': 'technical',
  'data-science': 'analytical',
  'devops': 'technical',
  'security': 'technical',
  'mobile': 'technical',
  'web': 'technical',
  'ai-ml': 'technical',
  'databases': 'technical',
  'cloud': 'technical',
  'project-management': 'leadership',
  'product-management': 'business',
  'business-analysis': 'analytical',
  'finance': 'business',
  'marketing': 'creative',
  'sales': 'communication',
  'consulting': 'business',
  'leadership': 'leadership',
  'communication': 'communication',
  'teamwork': 'communication',
  'problem-solving': 'analytical',
  'creativity': 'creative',
  'time-management': 'leadership',
  'mentoring': 'leadership',
  'data-analysis': 'analytical',
  'research': 'analytical',
  'strategic-thinking': 'analytical',
  'process-optimization': 'analytical'
}

// Базовые навыки для демо
export const baseSkills: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Технические навыки
  {
    name: 'JavaScript',
    description: 'Язык программирования для веб-разработки',
    category: 'programming',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['typescript', 'react', 'nodejs'],
    learningResources: [],
    owner: 'tech-lead',
    version: 1
  },
  {
    name: 'Python',
    description: 'Язык программирования для бэкенда и анализа данных',
    category: 'programming',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['django', 'flask', 'pandas', 'machine-learning'],
    learningResources: [],
    owner: 'tech-lead',
    version: 1
  },
  {
    name: 'React',
    description: 'Библиотека для создания пользовательских интерфейсов',
    category: 'web',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['javascript', 'typescript', 'redux', 'nextjs'],
    learningResources: [],
    owner: 'frontend-lead',
    version: 1
  },
  {
    name: 'Machine Learning',
    description: 'Машинное обучение и алгоритмы ИИ',
    category: 'ai-ml',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['python', 'tensorflow', 'pytorch', 'data-analysis'],
    learningResources: [],
    owner: 'ml-lead',
    version: 1
  },
  {
    name: 'Docker',
    description: 'Контейнеризация приложений',
    category: 'devops',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['kubernetes', 'ci-cd', 'aws'],
    learningResources: [],
    owner: 'devops-lead',
    version: 1
  },
  
  // Аналитические навыки
  {
    name: 'Data Analysis',
    description: 'Анализ данных и извлечение инсайтов',
    category: 'data-analysis',
    competencyArea: 'analytical',
    isCore: true,
    relatedSkills: ['sql', 'python', 'tableau', 'excel'],
    learningResources: [],
    owner: 'analytics-lead',
    version: 1
  },
  {
    name: 'SQL',
    description: 'Язык запросов к базам данных',
    category: 'databases',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['postgresql', 'mysql', 'data-analysis'],
    learningResources: [],
    owner: 'data-lead',
    version: 1
  },
  
  // Бизнес навыки
  {
    name: 'Project Management',
    description: 'Управление проектами и командами',
    category: 'project-management',
    competencyArea: 'leadership',
    isCore: true,
    relatedSkills: ['agile', 'scrum', 'leadership', 'communication'],
    learningResources: [],
    owner: 'pm-lead',
    version: 1
  },
  {
    name: 'Product Management',
    description: 'Управление продуктом и стратегией',
    category: 'product-management',
    competencyArea: 'business',
    isCore: true,
    relatedSkills: ['user-research', 'analytics', 'strategy', 'design-thinking'],
    learningResources: [],
    owner: 'product-lead',
    version: 1
  },
  
  // Soft skills
  {
    name: 'Leadership',
    description: 'Лидерские качества и управление людьми',
    category: 'leadership',
    competencyArea: 'leadership',
    isCore: true,
    relatedSkills: ['communication', 'mentoring', 'delegation', 'motivation'],
    learningResources: [],
    owner: 'hr-lead',
    version: 1
  },
  {
    name: 'Communication',
    description: 'Эффективная коммуникация и презентации',
    category: 'communication',
    competencyArea: 'communication',
    isCore: true,
    relatedSkills: ['presentation', 'writing', 'active-listening', 'negotiation'],
    learningResources: [],
    owner: 'hr-lead',
    version: 1
  },
  {
    name: 'UX/UI Design',
    description: 'Дизайн пользовательского опыта и интерфейсов',
    category: 'design',
    competencyArea: 'creative',
    isCore: true,
    relatedSkills: ['figma', 'user-research', 'prototyping', 'design-systems'],
    learningResources: [],
    owner: 'design-lead',
    version: 1
  },
  
  // Дополнительные технические навыки
  {
    name: 'Node.js',
    description: 'Серверная разработка на JavaScript',
    category: 'programming',
    competencyArea: 'technical',
    isCore: false,
    relatedSkills: ['javascript', 'express', 'mongodb', 'api-development'],
    learningResources: [],
    owner: 'backend-lead',
    version: 1
  },
  {
    name: 'AWS',
    description: 'Облачная платформа Amazon Web Services',
    category: 'cloud',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['docker', 'kubernetes', 'serverless', 'devops'],
    learningResources: [],
    owner: 'cloud-lead',
    version: 1
  },
  {
    name: 'Agile/Scrum',
    description: 'Гибкие методологии разработки',
    category: 'project-management',
    competencyArea: 'leadership',
    isCore: true,
    relatedSkills: ['project-management', 'kanban', 'lean'],
    learningResources: [],
    owner: 'agile-coach',
    version: 1
  }
]

// Веса навыков для матчинга
export const skillWeights = {
  // Технические навыки имеют высокий вес
  'technical': 0.4,
  // Лидерские навыки важны для senior позиций
  'leadership': 0.25,
  // Аналитические навыки ценятся
  'analytical': 0.2,
  // Коммуникативные навыки
  'communication': 0.1,
  // Креативные навыки
  'creative': 0.05
}

// Минимальные уровни для ролей
export const roleSkillRequirements = {
  'junior': {
    minSkills: 3,
    requiredLevels: ['beginner', 'intermediate']
  },
  'middle': {
    minSkills: 5,
    requiredLevels: ['intermediate', 'advanced']
  },
  'senior': {
    minSkills: 7,
    requiredLevels: ['advanced', 'expert'],
    requiredLeadership: 1
  },
  'lead': {
    minSkills: 8,
    requiredLevels: ['advanced', 'expert'],
    requiredLeadership: 2
  },
  'principal': {
    minSkills: 10,
    requiredLevels: ['expert'],
    requiredLeadership: 3
  }
}
