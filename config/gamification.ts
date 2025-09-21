// Конфигурация геймификации PathFinder
import { Badge, Quest, QuestRequirement, QuestReward, BadgeCriteria } from '@/types'

// XP система
export const xpConfig = {
  // Базовые награды
  skillUpdate: 10,
  questCompletion: 50,
  profileCompletion: 100,
  endorsementReceived: 15,
  endorsementGiven: 5,
  learningCompleted: 25,
  mentorshipSession: 30,
  
  // Множители
  multipliers: {
    consecutiveDays: 1.5,
    weekendActivity: 1.2,
    criticalSkill: 2.0,
    rareAchievement: 3.0
  },
  
  // Лимиты против спама
  dailyLimits: {
    skillUpdates: 10,
    endorsements: 5,
    questSubmissions: 3
  }
}

// Уровни профиля
export const profileLevels = [
  { level: 1, xpRequired: 0, title: 'Новичок', color: '#9CA3AF' },
  { level: 2, xpRequired: 100, title: 'Исследователь', color: '#10B981' },
  { level: 3, xpRequired: 300, title: 'Энтузиаст', color: '#3B82F6' },
  { level: 4, xpRequired: 600, title: 'Специалист', color: '#8B5CF6' },
  { level: 5, xpRequired: 1000, title: 'Эксперт', color: '#EF4444' },
  { level: 6, xpRequired: 1500, title: 'Мастер', color: '#F59E0B' },
  { level: 7, xpRequired: 2200, title: 'Наставник', color: '#EC4899' },
  { level: 8, xpRequired: 3000, title: 'Легенда', color: '#F97316' }
]

// Пороги полноты профиля
export const completenessThresholds = {
  minimal: 30,    // Минимум для участия
  good: 60,       // Хороший профиль
  excellent: 80,  // Отличный профиль
  perfect: 95     // Идеальный профиль
}

// Базовые бейджи
export const baseBadges: Omit<Badge, 'id' | 'createdAt'>[] = [
  // Skill badges
  {
    name: 'Полиглот',
    description: 'Владеет 5+ языками программирования',
    type: 'skill',
    icon: '🗣️',
    rarity: 'rare',
    criteria: {
      type: 'skill_level',
      conditions: {
        skillCount: 5,
        category: 'programming',
        minLevel: 'intermediate'
      }
    },
    xpReward: 200,
    isActive: true
  },
  {
    name: 'Аналитик',
    description: 'Мастер анализа данных',
    type: 'skill',
    icon: '📊',
    rarity: 'uncommon',
    criteria: {
      type: 'skill_level',
      conditions: {
        skillId: 'data-analysis',
        minLevel: 'advanced'
      }
    },
    xpReward: 100,
    isActive: true
  },
  {
    name: 'Лидер',
    description: 'Развитые лидерские качества',
    type: 'skill',
    icon: '👑',
    rarity: 'rare',
    criteria: {
      type: 'skill_level',
      conditions: {
        competencyArea: 'leadership',
        skillCount: 3,
        minLevel: 'intermediate'
      }
    },
    xpReward: 150,
    isActive: true
  },
  
  // Achievement badges
  {
    name: 'Первые шаги',
    description: 'Первый навык добавлен в профиль',
    type: 'achievement',
    icon: '🌱',
    rarity: 'common',
    criteria: {
      type: 'profile_completion',
      conditions: {
        section: 'skills',
        minCount: 1
      }
    },
    xpReward: 25,
    isActive: true
  },
  {
    name: 'Коллекционер',
    description: 'Добавил 10+ навыков',
    type: 'achievement',
    icon: '📚',
    rarity: 'uncommon',
    criteria: {
      type: 'profile_completion',
      conditions: {
        section: 'skills',
        minCount: 10
      }
    },
    xpReward: 75,
    isActive: true
  },
  {
    name: 'Популярный',
    description: 'Получил 10+ endorsements',
    type: 'achievement',
    icon: '⭐',
    rarity: 'uncommon',
    criteria: {
      type: 'endorsement_count',
      conditions: {
        minCount: 10
      }
    },
    xpReward: 100,
    isActive: true
  },
  
  // Milestone badges
  {
    name: 'Профиль готов',
    description: 'Завершил заполнение профиля на 80%',
    type: 'milestone',
    icon: '✅',
    rarity: 'uncommon',
    criteria: {
      type: 'profile_completion',
      conditions: {
        overall: 80
      }
    },
    xpReward: 200,
    isActive: true
  },
  {
    name: 'Мастер квестов',
    description: 'Выполнил 5 квестов',
    type: 'milestone',
    icon: '🏆',
    rarity: 'rare',
    criteria: {
      type: 'quest_completion',
      conditions: {
        minCount: 5
      }
    },
    xpReward: 250,
    isActive: true
  },
  
  // Special badges
  {
    name: 'Первопроходец',
    description: 'Один из первых пользователей системы',
    type: 'special',
    icon: '🚀',
    rarity: 'legendary',
    criteria: {
      type: 'custom',
      conditions: {
        userIndex: 100 // Первые 100 пользователей
      }
    },
    xpReward: 500,
    isActive: true
  },
  {
    name: 'Наставник',
    description: 'Помог коллегам в развитии',
    type: 'special',
    icon: '🧠',
    rarity: 'epic',
    criteria: {
      type: 'custom',
      conditions: {
        mentorshipHours: 20
      }
    },
    xpReward: 300,
    isActive: true
  },
  
  // Leaderboard badges
  {
    name: 'Топ-10',
    description: 'Попал в топ-10 рейтинга',
    type: 'achievement',
    icon: '🏆',
    rarity: 'rare',
    criteria: {
      type: 'custom',
      conditions: {
        leaderboardRank: 10
      }
    },
    xpReward: 200,
    isActive: true
  },
  {
    name: 'Топ-3',
    description: 'Попал в топ-3 рейтинга',
    type: 'achievement',
    icon: '🥉',
    rarity: 'epic',
    criteria: {
      type: 'custom',
      conditions: {
        leaderboardRank: 3
      }
    },
    xpReward: 400,
    isActive: true
  },
  {
    name: 'Чемпион',
    description: 'Занял 1-е место в рейтинге',
    type: 'achievement',
    icon: '👑',
    rarity: 'legendary',
    criteria: {
      type: 'custom',
      conditions: {
        leaderboardRank: 1
      }
    },
    xpReward: 1000,
    isActive: true
  },
  {
    name: 'Восходящая звезда',
    description: 'Поднялся на 5+ позиций в рейтинге',
    type: 'achievement',
    icon: '⭐',
    rarity: 'uncommon',
    criteria: {
      type: 'custom',
      conditions: {
        rankImprovement: 5
      }
    },
    xpReward: 150,
    isActive: true
  }
]

// Базовые квесты
export const baseQuests: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Новичковые квесты
  {
    title: 'Знакомство с системой',
    description: 'Заполни основную информацию в профиле',
    type: 'profile_completion',
    requirements: [
      {
        type: 'update_profile',
        target: 'basicInfo',
        currentValue: 0,
        requiredValue: 1
      }
    ],
    rewards: [
      { type: 'xp', value: 50 },
      { type: 'badge', value: 'first-steps' }
    ],
    difficulty: 'easy',
    isRepeatable: false,
    isActive: true
  },
  {
    title: 'Первый навык',
    description: 'Добавь свой первый навык в профиль',
    type: 'skill_development',
    requirements: [
      {
        type: 'skill_level',
        target: 'any',
        currentValue: 0,
        requiredValue: 1
      }
    ],
    rewards: [
      { type: 'xp', value: 25 },
      { type: 'badge', value: 'first-skill' }
    ],
    difficulty: 'easy',
    isRepeatable: false,
    isActive: true
  },
  
  // Навыковые квесты
  {
    title: 'Мастер JavaScript',
    description: 'Повысь уровень JavaScript до Advanced',
    type: 'skill_development',
    targetSkillId: 'javascript',
    requirements: [
      {
        type: 'skill_level',
        target: 'javascript',
        currentValue: 0,
        requiredValue: 3 // advanced level
      }
    ],
    rewards: [
      { type: 'xp', value: 100 },
      { type: 'skill_boost', value: 'javascript' }
    ],
    difficulty: 'medium',
    isRepeatable: false,
    isActive: true
  },
  {
    title: 'Data Science Explorer',
    description: 'Изучи основы анализа данных',
    type: 'learning',
    targetSkillId: 'data-analysis',
    requirements: [
      {
        type: 'complete_course',
        target: 'data-analysis-basics',
        currentValue: 0,
        requiredValue: 1
      },
      {
        type: 'skill_level',
        target: 'data-analysis',
        currentValue: 0,
        requiredValue: 2 // intermediate
      }
    ],
    rewards: [
      { type: 'xp', value: 150 },
      { type: 'badge', value: 'analyst' }
    ],
    difficulty: 'medium',
    isRepeatable: false,
    isActive: true
  },
  
  // Социальные квесты
  {
    title: 'Команда мечты',
    description: 'Получи endorsement от 3 коллег',
    type: 'social',
    requirements: [
      {
        type: 'get_endorsement',
        target: 'any',
        currentValue: 0,
        requiredValue: 3
      }
    ],
    rewards: [
      { type: 'xp', value: 75 },
      { type: 'badge', value: 'team-player' }
    ],
    difficulty: 'medium',
    isRepeatable: false,
    isActive: true
  },
  
  // Weekly challenges
  {
    title: 'Недельный вызов: Обучение',
    description: 'Потрать 2 часа на изучение новых навыков',
    type: 'learning',
    requirements: [
      {
        type: 'custom',
        target: 'learning_time',
        currentValue: 0,
        requiredValue: 120 // minutes
      }
    ],
    rewards: [
      { type: 'xp', value: 100 }
    ],
    timeLimit: 7, // 7 days
    difficulty: 'easy',
    isRepeatable: true,
    isActive: true
  },
  {
    title: 'Недельный вызов: Профиль',
    description: 'Обнови или добавь информацию в профиль',
    type: 'profile_completion',
    requirements: [
      {
        type: 'update_profile',
        target: 'any',
        currentValue: 0,
        requiredValue: 3
      }
    ],
    rewards: [
      { type: 'xp', value: 80 }
    ],
    timeLimit: 7,
    difficulty: 'easy',
    isRepeatable: true,
    isActive: true
  },
  
  // Продвинутые квесты
  {
    title: 'Лидер команды',
    description: 'Развей лидерские навыки до уровня Expert',
    type: 'skill_development',
    targetSkillId: 'leadership',
    requirements: [
      {
        type: 'skill_level',
        target: 'leadership',
        currentValue: 0,
        requiredValue: 4 // expert
      },
      {
        type: 'custom',
        target: 'mentorship_hours',
        currentValue: 0,
        requiredValue: 10
      }
    ],
    rewards: [
      { type: 'xp', value: 300 },
      { type: 'badge', value: 'leader' },
      { type: 'unlock_feature', value: 'advanced_analytics' }
    ],
    difficulty: 'hard',
    isRepeatable: false,
    isActive: true
  },
  
  // Leaderboard quests
  {
    title: 'Войти в рейтинг',
    description: 'Попади в топ-50 общего рейтинга',
    type: 'achievement',
    requirements: [
      {
        type: 'custom',
        target: 'leaderboard_rank',
        currentValue: 0,
        requiredValue: 50
      }
    ],
    rewards: [
      { type: 'xp', value: 100 },
      { type: 'badge', value: 'leaderboard-entry' }
    ],
    difficulty: 'medium',
    isRepeatable: false,
    isActive: true
  },
  {
    title: 'Соревновательный дух',
    description: 'Обгони 10 пользователей в рейтинге за неделю',
    type: 'achievement',
    requirements: [
      {
        type: 'custom',
        target: 'rank_improvement',
        currentValue: 0,
        requiredValue: 10
      }
    ],
    rewards: [
      { type: 'xp', value: 200 },
      { type: 'badge', value: 'competitive-spirit' }
    ],
    timeLimit: 7,
    difficulty: 'hard',
    isRepeatable: true,
    isActive: true
  },
  {
    title: 'Мастер всех дел',
    description: 'Попади в топ-10 по всем категориям: XP, квесты и бейджи',
    type: 'achievement',
    requirements: [
      {
        type: 'custom',
        target: 'xp_rank',
        currentValue: 0,
        requiredValue: 10
      },
      {
        type: 'custom',
        target: 'quest_rank',
        currentValue: 0,
        requiredValue: 10
      },
      {
        type: 'custom',
        target: 'badge_rank',
        currentValue: 0,
        requiredValue: 10
      }
    ],
    rewards: [
      { type: 'xp', value: 500 },
      { type: 'badge', value: 'master-of-all' }
    ],
    difficulty: 'expert',
    isRepeatable: false,
    isActive: true
  }
]

// Конфигурация для расчета прогресса
export const progressConfig = {
  // Веса секций профиля для общего процента
  sectionWeights: {
    basicInfo: 0.15,
    skills: 0.30,
    experience: 0.25,
    education: 0.15,
    goals: 0.10,
    preferences: 0.05
  },
  
  // Минимальные требования для секций
  minimumRequirements: {
    basicInfo: ['firstName', 'lastName', 'position', 'department'],
    skills: 3,
    experience: 1,
    education: 1,
    goals: 2,
    preferences: ['careerInterests']
  }
}

// Настройки уведомлений о достижениях
export const achievementNotifications = {
  badgeEarned: {
    title: 'Новый бейдж!',
    showDuration: 5000,
    sound: true
  },
  questCompleted: {
    title: 'Квест выполнен!',
    showDuration: 3000,
    sound: true
  },
  levelUp: {
    title: 'Новый уровень!',
    showDuration: 6000,
    sound: true,
    animation: 'celebration'
  },
  xpGained: {
    showDuration: 2000,
    sound: false,
    animation: 'bounce'
  }
}
