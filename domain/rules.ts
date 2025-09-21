// Реактивные правила PathFinder - каскадная логика обновлений
import { subscribe, publish } from './eventBus'
import { createEvent, type EventPayload } from './events'
import { useStore } from './state/store'
import { xpConfig, completenessThresholds, baseBadges } from '@/config/gamification'
import { skillWeights } from '@/config/skills'

// === ИНИЦИАЛИЗАЦИЯ ПРАВИЛ ===

export const initializeDomainRules = () => {
  console.log('🔧 Инициализация доменных правил...')
  
  // Регистрируем все обработчики событий
  setupProfileRules()
  setupSkillRules()
  setupLearningRules()
  setupGamificationRules()
  setupTaxonomyRules()
  setupHRRules()
  setupChatRules()
  setupSystemRules()
  
  console.log('✅ Доменные правила инициализированы')
}

// === ПРАВИЛА ПРОФИЛЯ ===

const setupProfileRules = () => {
  // Обновление полноты профиля при любых изменениях
  subscribe('PROFILE_UPDATED', async (event) => {
    const store = useStore.getState()
    
    try {
      // Пересчитываем полноту профиля
      store.recalculateCompleteness()
      
      // Проверяем достижение порогов
      const completeness = store.profile?.completeness.overall || 0
      const threshold = store.completenessThreshold
      
      if (completeness >= threshold) {
        // Начисляем XP за достижение порога
        await store.addXp(
          xpConfig.profileCompletion,
          `Профиль заполнен на ${completeness}%`,
          'profile_completion'
        )
        
        // TODO: Проверяем готовность к ротации
        // if (!store.profile?.readinessForRotation && completeness >= completenessThresholds.excellent) {
        //   await store.updateProfile(event.data.userId, {
        //     readinessForRotation: true
        //   })
        // }
      }
      
      // TODO: Генерируем новые рекомендации ролей
      // await store.generateRoleRecommendations(event.data.userId)
      
    } catch (error) {
      console.error('Ошибка обработки обновления профиля:', error)
    }
  })
}

// === ПРАВИЛА НАВЫКОВ ===

const setupSkillRules = () => {
  // Обработка добавления навыка
  subscribe('SKILL_ADDED', async (event) => {
    const { userId, skill, source } = event.data
    const store = useStore.getState()
    
    try {
      // Начисляем XP за добавление навыка
      let xpAmount = xpConfig.skillUpdate
      
      // Бонус за основные навыки
      const skillInfo = store.skills.find(s => s.id === skill.skillId)
      if (skillInfo?.isCore) {
        xpAmount *= xpConfig.multipliers.criticalSkill
      }
      
      await store.addXp(
        xpAmount,
        `Добавлен навык: ${skillInfo?.name || skill.skillId}`,
        'skill_update'
      )
      
      // Обновляем полноту профиля
      store.recalculateCompleteness()
      
      // Проверяем бейджи за навыки
      await checkSkillBadges(userId)
      
      // Триггерим пересчет матчинга
      await triggerMatchRecalculation('profile_updated', userId)
      
      // Обновляем прогресс активных квестов
      await updateQuestProgressForSkill(userId, skill.skillId, skill.level)
      
    } catch (error) {
      console.error('Ошибка обработки добавления навыка:', error)
    }
  })
  
  // Обработка изменения уровня навыка
  subscribe('SKILL_LEVEL_CHANGED', async (event) => {
    const { userId, skillId, previousLevel, newLevel, source } = event.data
    const store = useStore.getState()
    
    try {
      // Начисляем XP за повышение уровня
      const levelDiff = getLevelDifference(previousLevel, newLevel)
      if (levelDiff > 0) {
        const xpAmount = xpConfig.skillUpdate * levelDiff
        const skillInfo = store.skills.find(s => s.id === skillId)
        
        await store.addXp(
          xpAmount,
          `Повышен уровень навыка: ${skillInfo?.name || skillId} до ${newLevel}`,
          'skill_update'
        )
      }
      
      // Обновляем полноту профиля
      store.recalculateCompleteness()
      
      // Проверяем бейджи
      await checkSkillBadges(userId)
      
      // Обновляем прогресс квестов
      await updateQuestProgressForSkill(userId, skillId, newLevel)
      
      // Триггерим пересчет матчинга
      await triggerMatchRecalculation('profile_updated', userId)
      
    } catch (error) {
      console.error('Ошибка обработки изменения уровня навыка:', error)
    }
  })
  
  // Обработка подтверждения навыка
  subscribe('SKILL_ENDORSED', async (event) => {
    const { userId, skillId, endorserId, endorserName } = event.data
    const store = useStore.getState()
    
    try {
      // Начисляем XP получателю
      await store.addXp(
        xpConfig.endorsementReceived,
        `Навык подтвержден пользователем ${endorserName}`,
        'endorsement'
      )
      
      // Начисляем XP тому, кто подтвердил (если это другой пользователь)
      if (endorserId !== userId) {
        // Здесь нужна логика начисления XP другому пользователю
        // Пока просто логируем
        console.log(`Пользователь ${endorserId} получает XP за подтверждение навыка`)
      }
      
      // Проверяем бейдж за популярность
      await checkEndorsementBadges(userId)
      
    } catch (error) {
      console.error('Ошибка обработки подтверждения навыка:', error)
    }
  })
}

// === ПРАВИЛА ОБУЧЕНИЯ ===

const setupLearningRules = () => {
  // Обработка записи на курс
  subscribe('COURSE_ENROLLED', async (event) => {
    const { userId, courseId, courseName, targetSkills, source } = event.data
    const store = useStore.getState()
    
    try {
      // Создаем или обновляем связанный квест
      const questTitle = `Завершить курс: ${courseName}`
      const questDescription = `Пройдите курс "${courseName}" для развития навыков: ${targetSkills.join(', ')}`
      
      // Ищем существующий квест или создаем новый
      const existingQuest = store.availableQuests.find(q => 
        q.title.includes(courseName) || q.description.includes(courseId)
      )
      
      if (!existingQuest) {
        // Создаем новый квест
        const questData = {
          title: questTitle,
          description: questDescription,
          type: 'learning' as const,
          targetSkillId: targetSkills[0], // Основной навык
          requirements: [
            {
              type: 'complete_course' as const,
              target: courseId,
              currentValue: 0,
              requiredValue: 1
            }
          ],
          rewards: [
            { type: 'xp' as const, value: xpConfig.learningCompleted },
            ...(targetSkills.map((skillId: string) => ({
              type: 'skill_boost' as const,
              value: skillId
            })))
          ],
          difficulty: 'medium' as const,
          isRepeatable: false,
          isActive: true
        }
        
        // Автоматически принимаем квест
        const questId = `quest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        await store.acceptQuest(questId)
      }
      
      // Показываем уведомление
      store.showToast(
        'success',
        'Курс добавлен',
        `Вы записались на курс "${courseName}". Квест создан автоматически.`
      )
      
    } catch (error) {
      console.error('Ошибка обработки записи на курс:', error)
    }
  })
  
  // Обработка завершения курса
  subscribe('COURSE_COMPLETED', async (event) => {
    const { userId, courseId, courseName, skillGains } = event.data
    const store = useStore.getState()
    
    try {
      // Начисляем XP за завершение курса
      await store.addXp(
        xpConfig.learningCompleted,
        `Завершен курс: ${courseName}`,
        'learning'
      )
      
      // Обновляем навыки согласно skillGains
      for (const skillGain of skillGains) {
        const { skillId, previousLevel, newLevel } = skillGain
        
        if (previousLevel) {
          // Обновляем существующий навык
          await store.updateSkill(skillId, { level: newLevel })
        } else {
          // Добавляем новый навык
          await store.addSkill({
            skillId,
            level: newLevel,
            yearsOfExperience: 0,
            endorsements: 0,
            selfAssessed: false,
            verifiedBy: [`course:${courseId}`] // Указываем, что навык получен из курса
          })
        }
      }
      
      // Завершаем связанные квесты
      const relatedQuests = store.activeQuests.filter(quest => 
        quest.progress.some(p => p.requirementId === 'complete_course' && p.currentValue === 0)
      )
      
      for (const quest of relatedQuests) {
        await store.updateQuestProgress(quest.questId, 'complete_course', 1)
      }
      
      // Показываем поздравление
      store.showToast(
        'success',
        'Курс завершен! 🎉',
        `Поздравляем с завершением курса "${courseName}". Навыки обновлены!`
      )
      
    } catch (error) {
      console.error('Ошибка обработки завершения курса:', error)
    }
  })
}

// === ПРАВИЛА ГЕЙМИФИКАЦИИ ===

const setupGamificationRules = () => {
  // Обработка получения XP
  subscribe('XP_GAINED', async (event) => {
    const { userId, amount, reason, source, newXp } = event.data
    const store = useStore.getState()
    
    try {
      // Проверяем повышение уровня
      const previousLevel = store.currentLevel
      store.recalculateLevel()
      const newLevel = store.currentLevel
      
      if (newLevel > previousLevel) {
        // Публикуем событие повышения уровня
        await publish(createEvent(
          'LEVEL_UP',
          {
            userId,
            previousLevel,
            newLevel,
            previousXp: newXp - amount,
            newXp,
            rewards: getLevelRewards(newLevel)
          },
          userId
        ))
      }
      
      // Обновляем статистику
      // Здесь можно добавить обновление streak'ов и других метрик
      
    } catch (error) {
      console.error('Ошибка обработки получения XP:', error)
    }
  })
  
  // Обработка повышения уровня
  subscribe('LEVEL_UP', async (event) => {
    const { userId, newLevel, rewards } = event.data
    const store = useStore.getState()
    
    try {
      // Выдаем награды за новый уровень
      if (rewards && rewards.length > 0) {
        for (const reward of rewards) {
          if (reward.type === 'badge') {
            await store.awardBadge(reward.value, `Достижение ${newLevel} уровня`)
          }
        }
      }
      
      // Показываем анимацию повышения уровня
      store.showToast(
        'success',
        `Новый уровень! 🚀`,
        `Поздравляем с достижением ${newLevel} уровня!`,
        {
          duration: 8000,
          autoClose: true
        }
      )
      
      // Проверяем разблокировку новых функций
      checkUnlockedFeatures(newLevel)
      
    } catch (error) {
      console.error('Ошибка обработки повышения уровня:', error)
    }
  })
  
  // Обработка завершения квеста
  subscribe('QUEST_COMPLETED', async (event) => {
    const { userId, questId, quest, rewards } = event.data
    const store = useStore.getState()
    
    try {
      // Начисляем дополнительный XP за завершение квеста
      const bonusXp = Math.floor(xpConfig.questCompletion * getDifficultyMultiplier(quest.difficulty))
      
      await store.addXp(
        bonusXp,
        `Квест завершен: ${quest.title}`,
        'quest_completion'
      )
      
      // Обновляем статистику квестов
      const stats = store.stats
      store.updateFormState('quest_stats', {
        questsCompleted: stats.questsCompleted + 1
      })
      
      // Проверяем бейджи за квесты
      await checkQuestBadges(userId)
      
      // Генерируем новые квесты на основе прогресса
      await generateNewQuests(userId)
      
    } catch (error) {
      console.error('Ошибка обработки завершения квеста:', error)
    }
  })
  
  // Обработка получения бейджа
  subscribe('BADGE_AWARDED', async (event) => {
    const { userId, badge, criteria, xpReward } = event.data
    const store = useStore.getState()
    
    try {
      // Показываем уведомление о новом бейдже
      store.showNotification({
        type: 'success',
        title: 'Новый бейдж получен! 🏆',
        message: `Вы получили бейдж "${badge.name}": ${badge.description}`,
        actions: [
          {
            label: 'Посмотреть',
            action: () => {
              // Переход к странице достижений
              store.setCurrentPage('/achievements')
            }
          }
        ]
      })
      
      // Проверяем комбо-бейджи (бейджи за получение других бейджей)
      await checkComboBadges(userId)
      
    } catch (error) {
      console.error('Ошибка обработки получения бейджа:', error)
    }
  })
}

// === ПРАВИЛА ТАКСОНОМИИ ===

const setupTaxonomyRules = () => {
  // Обработка изменения порога полноты профиля
  subscribe('THRESHOLD_CHANGED', async (event) => {
    const { thresholdType, previousValue, newValue, affectedUsers } = event.data
    const store = useStore.getState()
    
    if (thresholdType === 'profile_completeness') {
      try {
        // Обновляем порог в store
        store.completenessThreshold = newValue
        
        // Пересчитываем полноту для всех затронутых пользователей
        for (const userId of affectedUsers) {
          // Здесь нужна логика пересчета для других пользователей
          // Пока пересчитываем только текущего пользователя
          if (userId === store.user?.id) {
            store.recalculateCompleteness()
          }
        }
        
        // Показываем уведомление
        store.showToast(
          'info',
          'Порог обновлен',
          `Порог полноты профиля изменен с ${previousValue}% на ${newValue}%`
        )
        
        // Триггерим пересчет матчинга для всех пользователей
        await triggerMatchRecalculation('threshold_changed')
        
      } catch (error) {
        console.error('Ошибка обработки изменения порога:', error)
      }
    }
  })
  
  // Обработка обновления таксономии
  subscribe('TAXONOMY_UPDATED', async (event) => {
    const { entityType, entityId, changes, impactedUsers } = event.data
    const store = useStore.getState()
    
    try {
      if (entityType === 'skill') {
        // Обновляем данные навыка в store
        await store.loadTaxonomy()
        
        // Показываем уведомление затронутым пользователям
        if (impactedUsers.includes(store.user?.id)) {
          store.showToast(
            'info',
            'Навык обновлен',
            `Навык был обновлен администратором. Ваш профиль может потребовать пересмотра.`
          )
        }
      }
      
      if (entityType === 'role') {
        // Обновляем роли
        await store.loadTaxonomy()
        
        // Обновляем рекомендации ролей для всех пользователей
        await store.generateRoleRecommendations(store.user?.id || '')
      }
      
    } catch (error) {
      console.error('Ошибка обработки обновления таксономии:', error)
    }
  })
}

// === ПРАВИЛА HR ===

const setupHRRules = () => {
  // Обработка добавления вакансии
  subscribe('VACANCY_ADDED', async (event) => {
    const { vacancyId, vacancy, autoMatch } = event.data
    const store = useStore.getState()
    
    try {
      if (autoMatch) {
        // Автоматически рассчитываем матчинг
        await store.calculateMatches(vacancyId)
        
        // Уведомляем о новой вакансии
        store.showToast(
          'success',
          'Вакансия создана',
          `Вакансия "${vacancy.title}" создана и матчинг рассчитан автоматически`
        )
      }
      
    } catch (error) {
      console.error('Ошибка обработки добавления вакансии:', error)
    }
  })
  
  // Обработка пересчета матчинга
  subscribe('MATCH_RECALCULATED', async (event) => {
    const { vacancyId, trigger, newMatches, changedMatches } = event.data
    const store = useStore.getState()
    
    try {
      // Обновляем аналитику
      store.generateMatchingInsights()
      
      // Отправляем уведомления HR о значительных изменениях
      if (changedMatches && changedMatches.length > 0) {
        const significantChanges = changedMatches.filter((change: any) => 
          Math.abs(change.scoreChange) >= 10 // Изменение на 10+ баллов
        )
        
        if (significantChanges.length > 0) {
          store.showNotification({
            type: 'info',
            title: 'Матчинг обновлен',
            message: `${significantChanges.length} кандидатов значительно изменили свой рейтинг`,
            actions: [
              {
                label: 'Посмотреть',
                action: () => store.setCurrentPage('/hr')
              }
            ]
          })
        }
      }
      
    } catch (error) {
      console.error('Ошибка обработки пересчета матчинга:', error)
    }
  })
}

// === ПРАВИЛА ЧАТА ===

const setupChatRules = () => {
  // Обработка применения предложения ИИ
  subscribe('CHAT_SUGGESTION_APPLIED', async (event) => {
    const { userId, suggestionType, suggestionData, resultingEvents } = event.data
    const store = useStore.getState()
    
    try {
      // Выполняем действие в зависимости от типа
      switch (suggestionType) {
        case 'skill_add':
          await store.addSkill({
            skillId: suggestionData.skillId,
            level: suggestionData.level || 'beginner',
            yearsOfExperience: 0,
            endorsements: 0,
            selfAssessed: true
          })
          break
          
        case 'course_enroll':
          await publish(createEvent(
            'COURSE_ENROLLED',
            {
              userId,
              courseId: suggestionData.courseId,
              courseName: suggestionData.courseName,
              targetSkills: suggestionData.targetSkills || [],
              source: 'ai_suggestion'
            },
            userId
          ))
          break
          
        case 'quest_accept':
          await store.acceptQuest(suggestionData.questId)
          break
          
        case 'profile_update':
          // TODO: await store.updateProfile(userId, suggestionData.updates)
          break
      }
      
      // Начисляем XP за применение предложения ИИ
      await store.addXp(
        xpConfig.skillUpdate,
        'Применено предложение ИИ-ассистента',
        'ai_suggestion'
      )
      
      // Показываем подтверждение
      store.showToast(
        'success',
        'Предложение применено',
        'Действие выполнено успешно!'
      )
      
    } catch (error) {
      console.error('Ошибка применения предложения ИИ:', error)
    }
  })
  
  // Обработка распознавания голосовой команды
  subscribe('VOICE_COMMAND_PARSED', async (event) => {
    const { userId, audioText, parsedIntent, commandResult } = event.data
    const store = useStore.getState()
    
    if (commandResult === 'success') {
      // Начисляем бонус XP за использование голосовых команд
      await store.addXp(
        5, // Небольшой бонус
        'Использование голосовых команд',
        'voice_interaction'
      )
    }
  })
}

// === СИСТЕМНЫЕ ПРАВИЛА ===

const setupSystemRules = () => {
  // Обработка входа пользователя
  subscribe('USER_LOGGED_IN', async (event) => {
    const { userId } = event.data
    const store = useStore.getState()
    
    try {
      // Загружаем данные пользователя
      await Promise.all([
        store.loadProfile(userId),
        store.loadGamificationData(userId),
        store.loadSessions()
      ])
      
      // Проверяем ежедневные награды
      await checkDailyRewards(userId)
      
      // Создаем приветственную сессию чата если нужно
      if (store.sessions.length === 0) {
        await store.createSession('general')
      }
      
    } catch (error) {
      console.error('Ошибка обработки входа пользователя:', error)
    }
  })
  
  // Обработка ошибок
  subscribe('ERROR_OCCURRED', async (event) => {
    const { error, severity, userId } = event.data
    const store = useStore.getState()
    
    if (severity === 'high' || severity === 'critical') {
      store.showToast(
        'error',
        'Произошла ошибка',
        error.message || 'Неизвестная ошибка'
      )
    }
    
    // В production здесь можно отправлять ошибки в сервис мониторинга
  })
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Проверка бейджей за навыки
const checkSkillBadges = async (userId: string) => {
  const store = useStore.getState()
  
  try {
    // Проверяем бейджи основанные на навыках
    await store.checkBadgeEligibility()
    
  } catch (error) {
    console.error('Ошибка проверки бейджей за навыки:', error)
  }
}

// Проверка бейджей за подтверждения
const checkEndorsementBadges = async (userId: string) => {
  const store = useStore.getState()
  
  try {
    const totalEndorsements = store.profile?.skills.reduce((sum, skill) => sum + skill.endorsements, 0) || 0
    
    // Популярный (10+ подтверждений)
    if (totalEndorsements >= 10) {
      await store.awardBadge('popular', `${totalEndorsements} подтверждений получено`)
    }
    
  } catch (error) {
    console.error('Ошибка проверки бейджей за подтверждения:', error)
  }
}

// Проверка бейджей за квесты
const checkQuestBadges = async (userId: string) => {
  const store = useStore.getState()
  
  try {
    const completedQuests = store.stats.questsCompleted
    
    // Мастер квестов (5 квестов)
    if (completedQuests >= 5) {
      await store.awardBadge('quest-master', `${completedQuests} квестов завершено`)
    }
    
  } catch (error) {
    console.error('Ошибка проверки бейджей за квесты:', error)
  }
}

// Проверка комбо-бейджей
const checkComboBadges = async (userId: string) => {
  const store = useStore.getState()
  
  try {
    const badgeCount = store.earnedBadges.length
    
    // Коллекционер бейджей
    if (badgeCount >= 5) {
      await store.awardBadge('badge-collector', `${badgeCount} бейджей собрано`)
    }
    
  } catch (error) {
    console.error('Ошибка проверки комбо-бейджей:', error)
  }
}

// Обновление прогресса квестов при изменении навыков
const updateQuestProgressForSkill = async (userId: string, skillId: string, level: string) => {
  const store = useStore.getState()
  
  try {
    // Ищем активные квесты, связанные с этим навыком
    const relatedQuests = store.activeQuests.filter(quest => 
      quest.questId.includes(skillId) || 
      quest.progress.some(p => p.requirementId === 'skill_level' && p.currentValue === 0)
    )
    
    for (const quest of relatedQuests) {
      const levelValue = getLevelValue(level)
      await store.updateQuestProgress(quest.questId, 'skill_level', levelValue)
    }
    
  } catch (error) {
    console.error('Ошибка обновления прогресса квестов:', error)
  }
}

// Триггер пересчета матчинга
const triggerMatchRecalculation = async (trigger: string, userId?: string) => {
  const store = useStore.getState()
  
  try {
    if (store.user?.role === 'hr' || store.user?.role === 'admin') {
      // Пересчитываем матчинг для всех активных вакансий
      await store.calculateAllMatches()
    }
    
  } catch (error) {
    console.error('Ошибка триггера пересчета матчинга:', error)
  }
}

// Генерация новых квестов
const generateNewQuests = async (userId: string) => {
  const store = useStore.getState()
  
  try {
    // Загружаем новые квесты на основе профиля пользователя
    await store.loadQuests()
    
  } catch (error) {
    console.error('Ошибка генерации новых квестов:', error)
  }
}

// Проверка ежедневных наград
const checkDailyRewards = async (userId: string) => {
  const store = useStore.getState()
  
  try {
    // Проверяем streak входов
    const lastLogin = store.user?.lastLoginAt
    const today = new Date()
    
    if (lastLogin) {
      const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        // Продолжается streak
        // Здесь можно начислить бонусный XP
        await store.addXp(
          xpConfig.skillUpdate,
          'Ежедневный вход',
          'daily_login'
        )
      }
    }
    
  } catch (error) {
    console.error('Ошибка проверки ежедневных наград:', error)
  }
}

// Проверка разблокированных функций
const checkUnlockedFeatures = (level: number) => {
  const store = useStore.getState()
  
  // Разблокировка функций по уровням
  const unlockedFeatures = []
  
  if (level >= 3) {
    unlockedFeatures.push('Продвинутая аналитика профиля')
  }
  
  if (level >= 5) {
    unlockedFeatures.push('Создание собственных квестов')
  }
  
  if (level >= 7) {
    unlockedFeatures.push('Наставничество новых сотрудников')
  }
  
  if (unlockedFeatures.length > 0) {
    store.showNotification({
      type: 'success',
      title: 'Новые функции разблокированы! 🔓',
      message: `Доступны: ${unlockedFeatures.join(', ')}`,
      duration: 10000
    })
  }
}

// Утилиты для работы с уровнями навыков
const getLevelValue = (level: string): number => {
  const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
  return levels[level as keyof typeof levels] || 1
}

const getLevelDifference = (oldLevel: string, newLevel: string): number => {
  return getLevelValue(newLevel) - getLevelValue(oldLevel)
}

// Получение множителя сложности
const getDifficultyMultiplier = (difficulty: string): number => {
  const multipliers = { easy: 1, medium: 1.5, hard: 2, expert: 3 }
  return multipliers[difficulty as keyof typeof multipliers] || 1
}

// Получение наград за уровень
const getLevelRewards = (level: number) => {
  const rewards = []
  
  // Каждый 3-й уровень - бейдж
  if (level % 3 === 0) {
    rewards.push({ type: 'badge', value: `level-${level}` })
  }
  
  return rewards
}
