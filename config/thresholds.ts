// Пороговые значения и настройки PathFinder

export const thresholds = {
  // Полнота профиля
  profileCompleteness: {
    // Глобальный порог (можно настраивать через админку)
    default: Number(process.env.DEFAULT_PROFILE_COMPLETION_THRESHOLD) || 70,
    
    // Минимальные пороги для различных действий
    forJobMatching: 60,        // Минимум для участия в подборе
    forRecommendations: 50,    // Минимум для получения рекомендаций
    forMentoring: 80,          // Минимум для менторства
    forLeadership: 85,         // Минимум для лидерских ролей
    
    // Пороги качества
    excellent: 90,
    good: 75,
    acceptable: 60,
    incomplete: 40
  },

  // Система матчинга кандидатов
  candidateMatching: {
    // Минимальный score для показа кандидата (0-100)
    minScore: 30,
    
    // Пороги готовности
    readinessLevels: {
      ready: 80,           // Готов к переходу
      developing: 60,      // Развивается в направлении
      notReady: 40,        // Не готов
      overqualified: 95    // Превышает требования
    },
    
    // Веса для различных факторов матчинга
    weights: {
      skillsMatch: 0.4,      // Совпадение навыков
      experience: 0.25,      // Релевантный опыт
      readiness: 0.2,        // Готовность к ротации
      cultural: 0.1,         // Культурное соответствие
      growth: 0.05          // Потенциал роста
    },
    
    // Критичные навыки (обязательные)
    criticalSkillWeight: 2.0,
    
    // Штрафы
    penalties: {
      missingCriticalSkill: -20,
      lowProfileCompleteness: -10,
      inactiveProfile: -15
    }
  },

  // Геймификация
  gamification: {
    // XP лимиты за день
    maxDailyXP: {
      skillUpdates: Number(process.env.DEFAULT_XP_PER_SKILL_UPDATE) * 10 || 100,
      endorsements: 50,
      quests: 200,
      learning: 150,
      total: 500
    },
    
    // Лимиты активности (анти-спам)
    activityLimits: {
      skillUpdatesPerDay: Number(process.env.MAX_SKILL_UPDATES_PER_DAY) || 10,
      endorsementsGivenPerDay: 5,
      questSubmissionsPerHour: 3,
      chatMessagesPerHour: Number(process.env.MAX_CHAT_MESSAGES_PER_HOUR) || 100
    },
    
    // Множители XP
    multipliers: {
      weekendBonus: 1.2,
      streakBonus: {
        3: 1.1,   // 3 дня подряд
        7: 1.25,  // неделя
        14: 1.5,  // 2 недели
        30: 2.0   // месяц
      },
      criticalSkillBonus: 1.5,
      rareBadgeBonus: 3.0
    }
  },

  // Навыки и экспертиза
  skills: {
    // Минимальный опыт для уровней (в месяцах)
    experienceRequirements: {
      beginner: 0,
      intermediate: 6,
      advanced: 24,
      expert: 60
    },
    
    // Минимальное количество endorsements для подтверждения уровня
    endorsementRequirements: {
      intermediate: 1,
      advanced: 3,
      expert: 5
    },
    
    // Актуальность навыка (когда последний раз использовался)
    freshnessThresholds: {
      fresh: 6,      // До 6 месяцев
      stale: 24,     // До 2 лет
      outdated: 48   // Больше 4 лет
    }
  },

  // Рекомендации ИИ
  aiRecommendations: {
    // Минимальная уверенность для показа рекомендации (0-1)
    minConfidence: 0.6,
    
    // Максимальное количество рекомендаций одновременно
    maxActiveRecommendations: {
      roles: 5,
      skills: 10,
      learning: 8,
      quests: 3
    },
    
    // Время жизни рекомендаций (в днях)
    recommendationTTL: {
      role: 30,
      skill: 14,
      learning: 21,
      quest: 7
    },
    
    // Приоритеты
    priorityWeights: {
      critical: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4
    }
  },

  // Поиск и фильтрация (HR)
  search: {
    // Минимальная длина поискового запроса
    minQueryLength: 2,
    
    // Максимальное количество результатов
    maxResults: 100,
    
    // Релевантность результатов
    relevanceThreshold: 0.3,
    
    // Весовые коэффициенты для поиска
    searchWeights: {
      skills: 0.4,
      experience: 0.3,
      education: 0.2,
      goals: 0.1
    }
  },

  // Производительность и лимиты
  performance: {
    // Размеры страниц для пагинации
    pageSize: {
      employees: 20,
      vacancies: 10,
      recommendations: 15,
      auditLogs: 50
    },
    
    // Таймауты для внешних сервисов (в мс)
    apiTimeouts: {
      llm: 30000,
      stt: 10000,
      tts: 15000,
      hris: 5000,
      lms: 5000
    },
    
    // Кэширование
    cacheTTL: {
      skillsData: 24 * 60 * 60 * 1000,      // 24 часа
      rolesData: 12 * 60 * 60 * 1000,       // 12 часов
      userProfiles: 30 * 60 * 1000,         // 30 минут
      recommendations: 60 * 60 * 1000,      // 1 час
      searchResults: 5 * 60 * 1000          // 5 минут
    }
  },

  // Безопасность и валидация
  security: {
    // Лимиты для предотвращения злоупотреблений
    rateLimits: {
      apiCallsPerMinute: 100,
      uploadsPerHour: 10,
      loginAttemptsPerHour: 5
    },
    
    // Валидация данных
    validation: {
      maxSkillsPerUser: 50,
      maxExperienceEntries: 20,
      maxEducationEntries: 10,
      maxCertifications: 30,
      maxBioLength: 1000,
      maxGoalsLength: 500
    },
    
    // Аудит
    auditRetention: {
      criticalActions: 365,  // дней
      regularActions: 90,    // дней
      systemActions: 30      // дней
    }
  },

  // Уведомления
  notifications: {
    // Максимальное количество активных уведомлений
    maxActive: 10,
    
    // Время жизни уведомлений (в часах)
    ttl: {
      critical: 72,
      normal: 24,
      info: 12
    },
    
    // Частота digest уведомлений
    digestFrequency: {
      daily: '09:00',
      weekly: 'monday-09:00'
    }
  }
}

// Функции для работы с порогами
export function getProfileCompletenessThreshold(): number {
  return thresholds.profileCompleteness.default
}

export function setProfileCompletenessThreshold(value: number): void {
  if (value < 0 || value > 100) {
    throw new Error('Threshold must be between 0 and 100')
  }
  thresholds.profileCompleteness.default = value
}

export function getCandidateMatchingThresholds() {
  return thresholds.candidateMatching
}

export function isProfileCompleteForAction(completeness: number, action: string): boolean {
  const actionThresholds = {
    'job_matching': thresholds.profileCompleteness.forJobMatching,
    'recommendations': thresholds.profileCompleteness.forRecommendations,
    'mentoring': thresholds.profileCompleteness.forMentoring,
    'leadership': thresholds.profileCompleteness.forLeadership
  }
  
  const threshold = actionThresholds[action as keyof typeof actionThresholds] || thresholds.profileCompleteness.default
  return completeness >= threshold
}

export function getSkillFreshnessLevel(lastUsed?: Date): 'fresh' | 'stale' | 'outdated' {
  if (!lastUsed) return 'outdated'
  
  const monthsAgo = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24 * 30)
  
  if (monthsAgo <= thresholds.skills.freshnessThresholds.fresh) return 'fresh'
  if (monthsAgo <= thresholds.skills.freshnessThresholds.stale) return 'stale'
  return 'outdated'
}

export function getReadinessLevel(score: number): 'ready' | 'developing' | 'not_ready' | 'overqualified' {
  const levels = thresholds.candidateMatching.readinessLevels
  
  if (score >= levels.overqualified) return 'overqualified'
  if (score >= levels.ready) return 'ready'
  if (score >= levels.developing) return 'developing'
  return 'not_ready'
}
