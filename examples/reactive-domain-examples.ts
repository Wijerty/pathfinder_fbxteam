// Примеры использования реактивного домена PathFinder

import { 
  useProfile, 
  useGamification, 
  useUI, 
  publish, 
  createEvent,
  subscribe 
} from '@/domain'

// === ПРИМЕР 1: Добавление навыка с реактивными обновлениями ===

export const addSkillExample = async () => {
  // Получаем необходимые функции из store
  const { addSkill } = useProfile()
  const { showToast } = useUI()

  try {
    // Добавляем навык - это автоматически:
    // 1. Обновит полноту профиля
    // 2. Начислит XP
    // 3. Проверит бейджи
    // 4. Пересчитает матчинг для HR
    // 5. Обновит рекомендации ролей
    await addSkill({
      skillId: 'javascript',
      level: 'intermediate',
      yearsOfExperience: 2,
      endorsements: 0,
      selfAssessed: true,
      verifiedBy: []
    })

    // Уведомление показывается автоматически через domain rules
    console.log('Навык добавлен! Все связанные обновления произошли автоматически.')

  } catch (error) {
    showToast('error', 'Ошибка', 'Не удалось добавить навык')
  }
}

// === ПРИМЕР 2: Запись на курс и автоматическое создание квеста ===

export const enrollInCourseExample = async () => {
  const userId = 'user-123'
  
  // Публикуем событие записи на курс
  await publish(createEvent(
    'COURSE_ENROLLED',
    {
      userId,
      courseId: 'python-advanced',
      courseName: 'Advanced Python Development',
      targetSkills: ['python', 'django', 'api-development'],
      estimatedDuration: 480, // 8 часов
      source: 'manual'
    },
    userId
  ))

  // Реактивные правила автоматически:
  // 1. Создадут квест "Завершить курс Advanced Python"
  // 2. Автоматически примут квест для пользователя
  // 3. Покажут уведомление
  // 4. Обновят план обучения

  console.log('Курс добавлен! Квест создан автоматически.')
}

// === ПРИМЕР 3: Завершение квеста с каскадными наградами ===

export const completeQuestExample = async () => {
  const { completeQuest } = useGamification()

  try {
    // Завершаем квест - это автоматически:
    // 1. Начислит XP согласно сложности
    // 2. Выдаст награды (бейджи, буст навыков)
    // 3. Проверит новые доступные квесты
    // 4. Обновит статистику пользователя
    // 5. Возможно повысит уровень
    await completeQuest('quest-python-mastery')

    console.log('Квест завершен! Награды начислены автоматически.')

  } catch (error) {
    console.error('Ошибка завершения квеста:', error)
  }
}

// === ПРИМЕР 4: Изменение настроек админом влияет на всех пользователей ===

export const updateThresholdExample = async () => {
  const { updateCompletenessThreshold } = useTaxonomy()

  try {
    // Админ изменяет порог полноты профиля с 70% на 80%
    // Это автоматически:
    // 1. Пересчитает полноту для всех пользователей
    // 2. Обновит статус готовности к ротации
    // 3. Пересчитает матчинг для всех вакансий
    // 4. Уведомит затронутых пользователей
    await updateCompletenessThreshold(80)

    console.log('Порог обновлен! Все профили пересчитаны автоматически.')

  } catch (error) {
    console.error('Ошибка обновления порога:', error)
  }
}

// === ПРИМЕР 5: Подписка на события для кастомной логики ===

export const subscribeToEventsExample = () => {
  // Подписываемся на события получения XP для показа анимации
  const unsubscribe = subscribe('XP_GAINED', (event) => {
    const { amount, reason } = event.data
    
    // Показываем кастомную анимацию получения XP
    showXpAnimation(amount, reason)
    
    // Воспроизводим звук
    playXpSound()
    
    console.log(`Получено ${amount} XP за: ${reason}`)
  })

  // Подписываемся на повышение уровня для особой анимации
  subscribe('LEVEL_UP', (event) => {
    const { newLevel, rewards } = event.data
    
    // Показываем анимацию повышения уровня
    showLevelUpAnimation(newLevel, rewards)
    
    // Воспроизводим фанфары
    playLevelUpSound()
    
    console.log(`Поздравляем с ${newLevel} уровнем!`)
  })

  // Возвращаем функцию отписки для очистки
  return unsubscribe
}

// === ПРИМЕР 6: Применение рекомендации ИИ ===

export const applyChatSuggestionExample = async () => {
  const userId = 'user-123'
  const suggestionId = 'suggestion-add-react'

  // Публикуем событие применения рекомендации ИИ
  await publish(createEvent(
    'CHAT_SUGGESTION_APPLIED',
    {
      userId,
      sessionId: 'chat-session-456',
      messageId: suggestionId,
      suggestionType: 'skill_add',
      suggestionData: {
        skillId: 'react',
        level: 'beginner'
      },
      appliedAt: new Date(),
      resultingEvents: ['SKILL_ADDED']
    },
    userId
  ))

  // Реактивные правила автоматически:
  // 1. Добавят навык React
  // 2. Начислят XP за применение рекомендации
  // 3. Покажут подтверждение в чате
  // 4. Обновят полноту профиля

  console.log('Рекомендация ИИ применена! Навык добавлен автоматически.')
}

// === ПРИМЕР 7: Реактивное обновление матчинга в HR ===

export const hrMatchingExample = () => {
  const { calculateMatches } = useHR()

  // Подписываемся на события изменения профиля
  subscribe('SKILL_ADDED', async (event) => {
    const { userId } = event.data
    
    // Автоматически пересчитываем матчинг для всех вакансий
    // когда пользователь добавляет навык
    console.log(`Пересчитываем матчинг для пользователя ${userId}`)
    
    // Это происходит автоматически через domain rules,
    // но можно добавить кастомную логику
  })

  // Подписываемся на обновления вакансий
  subscribe('VACANCY_EDITED', async (event) => {
    const { vacancyId, requiresRematch } = event.data
    
    if (requiresRematch) {
      console.log(`Пересчитываем матчинг для вакансии ${vacancyId}`)
      await calculateMatches(vacancyId, true)
    }
  })
}

// === ПРИМЕР 8: Кастомная компонентная интеграция ===

export const useReactiveProfile = (userId: string) => {
  const { profile, addSkill, updateSkill } = useProfile()
  const { showToast } = useUI()

  // Производные состояния, которые автоматически обновляются
  const skillsCount = profile?.skills.length || 0
  const completeness = profile?.completeness.overall || 0
  const isReady = profile?.readinessForRotation || false

  // Функция добавления навыка с валидацией
  const addSkillSafely = async (skillData: any) => {
    try {
      if (skillsCount >= 50) {
        showToast('warning', 'Лимит навыков', 'Максимум 50 навыков в профиле')
        return
      }

      await addSkill(skillData)
      
      // Показываем поздравление при достижении вех
      if (skillsCount === 9) { // Стал 10-м навыком
        showToast('success', 'Отличная работа! 🎉', 'У вас уже 10 навыков в профиле!')
      }

    } catch (error) {
      showToast('error', 'Ошибка', 'Не удалось добавить навык')
    }
  }

  return {
    profile,
    skillsCount,
    completeness,
    isReady,
    addSkillSafely,
    updateSkill
  }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

const showXpAnimation = (amount: number, reason: string) => {
  // Реализация анимации получения XP
  console.log(`+${amount} XP анимация за: ${reason}`)
}

const playXpSound = () => {
  // Воспроизведение звука получения XP
  console.log('🔊 XP звук')
}

const showLevelUpAnimation = (level: number, rewards: any[]) => {
  // Реализация анимации повышения уровня
  console.log(`🎉 Уровень ${level} анимация с наградами:`, rewards)
}

const playLevelUpSound = () => {
  // Воспроизведение фанфар повышения уровня
  console.log('🎺 Фанфары уровня')
}

// === ЭКСПОРТ ПРИМЕРОВ ===

export const examples = {
  addSkillExample,
  enrollInCourseExample,
  completeQuestExample,
  updateThresholdExample,
  subscribeToEventsExample,
  applyChatSuggestionExample,
  hrMatchingExample,
  useReactiveProfile
}

export default examples
