// Mock данные навыков для демонстрации
import { Skill } from '@/types'
import { baseSkills } from '@/config/skills'

// Генерируем ID и временные метки для базовых навыков
export const mockSkills: Skill[] = baseSkills.map((skill, index) => ({
  ...skill,
  id: `skill-${index + 1}`,
  createdAt: new Date(2024, 0, 1 + index),
  updatedAt: new Date(2024, 8, 15 + (index % 30))
}))

// Дополнительные навыки для более полной демонстрации
const additionalSkills: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'TypeScript',
    description: 'Типизированный JavaScript для больших приложений',
    category: 'programming',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['javascript', 'react', 'nodejs'],
    learningResources: [],
    owner: 'frontend-lead',
    version: 1
  },
  {
    name: 'PostgreSQL',
    description: 'Объектно-реляционная система управления базами данных',
    category: 'databases',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['sql', 'database-design'],
    learningResources: [],
    owner: 'data-lead',
    version: 1
  },
  {
    name: 'Kubernetes',
    description: 'Оркестрация контейнеров и управление кластерами',
    category: 'devops',
    competencyArea: 'technical',
    isCore: false,
    relatedSkills: ['docker', 'aws', 'ci-cd'],
    learningResources: [],
    owner: 'devops-lead',
    version: 1
  },
  {
    name: 'Figma',
    description: 'Инструмент для UI/UX дизайна и прототипирования',
    category: 'design',
    competencyArea: 'creative',
    isCore: true,
    relatedSkills: ['ux-ui-design', 'prototyping'],
    learningResources: [],
    owner: 'design-lead',
    version: 1
  },
  {
    name: 'Agile/Scrum',
    description: 'Гибкие методологии управления проектами',
    category: 'project-management',
    competencyArea: 'leadership',
    isCore: true,
    relatedSkills: ['project-management', 'leadership'],
    learningResources: [],
    owner: 'pm-lead',
    version: 1
  },
  {
    name: 'Tableau',
    description: 'Платформа для визуализации и анализа данных',
    category: 'data-analysis',
    competencyArea: 'analytical',
    isCore: false,
    relatedSkills: ['data-analysis', 'sql'],
    learningResources: [],
    owner: 'analytics-lead',
    version: 1
  },
  {
    name: 'TensorFlow',
    description: 'Фреймворк для машинного обучения и глубокого обучения',
    category: 'ai-ml',
    competencyArea: 'technical',
    isCore: false,
    relatedSkills: ['machine-learning', 'python'],
    learningResources: [],
    owner: 'ml-lead',
    version: 1
  },
  {
    name: 'Git',
    description: 'Распределенная система контроля версий',
    category: 'devops',
    competencyArea: 'technical',
    isCore: true,
    relatedSkills: ['ci-cd', 'collaboration'],
    learningResources: [],
    owner: 'tech-lead',
    version: 1
  },
  {
    name: 'User Research',
    description: 'Исследование пользователей и их потребностей',
    category: 'research',
    competencyArea: 'analytical',
    isCore: false,
    relatedSkills: ['ux-ui-design', 'product-management'],
    learningResources: [],
    owner: 'product-lead',
    version: 1
  },
  {
    name: 'Team Building',
    description: 'Построение эффективных команд',
    category: 'leadership',
    competencyArea: 'leadership',
    isCore: false,
    relatedSkills: ['leadership', 'communication'],
    learningResources: [],
    owner: 'hr-lead',
    version: 1
  }
]

// Добавляем дополнительные навыки к основному списку
export const allMockSkills: Skill[] = [
  ...mockSkills,
  ...additionalSkills.map((skill, index) => ({
    ...skill,
    id: `skill-${mockSkills.length + index + 1}`,
    createdAt: new Date(2024, 1, 1 + index),
    updatedAt: new Date(2024, 8, 20 + (index % 25))
  }))
]

// Функция для поиска навыка по имени
export function findSkillByName(name: string): Skill | undefined {
  return allMockSkills.find(skill => 
    skill.name.toLowerCase() === name.toLowerCase()
  )
}

// Функция для получения навыков по категории
export function getSkillsByCategory(category: string): Skill[] {
  return allMockSkills.filter(skill => skill.category === category)
}

// Функция для получения ключевых навыков
export function getCoreSkills(): Skill[] {
  return allMockSkills.filter(skill => skill.isCore)
}
