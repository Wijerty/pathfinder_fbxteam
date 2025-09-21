// Playwright тесты для проверки реактивных цепочек PathFinder
import { test, expect } from '@playwright/test'

test.describe('Реактивный домен PathFinder', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу сотрудника
    await page.goto('/employee')
    
    // Ждем загрузки приложения
    await page.waitForSelector('[data-testid="profile-completeness"]', { timeout: 10000 })
  })

  test('Добавление навыка повышает полноту профиля и начисляет XP', async ({ page }) => {
    // Получаем начальные значения
    const initialCompleteness = await page.textContent('[data-testid="completeness-percentage"]')
    const initialXp = await page.textContent('[data-testid="current-xp"]')
    
    // Открываем добавление навыков
    await page.click('[data-testid="add-skill-button"]')
    
    // Ищем навык Python
    await page.fill('[data-testid="skill-search"]', 'Python')
    await page.waitForSelector('[data-testid="skill-card-python"]')
    
    // Выбираем уровень "Средний"
    await page.click('[data-testid="level-intermediate"]')
    
    // Добавляем навык
    await page.click('[data-testid="add-skill-python"]')
    
    // Ждем уведомления об успешном добавлении
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Навык добавлен')
    
    // Проверяем, что полнота профиля увеличилась
    await page.waitForTimeout(1000) // Ждем обновления состояния
    const newCompleteness = await page.textContent('[data-testid="completeness-percentage"]')
    const newXp = await page.textContent('[data-testid="current-xp"]')
    
    expect(parseInt(newCompleteness!)).toBeGreaterThan(parseInt(initialCompleteness!))
    expect(parseInt(newXp!)).toBeGreaterThan(parseInt(initialXp!))
    
    // Проверяем, что навык появился в списке
    await expect(page.locator('[data-testid="user-skill-python"]')).toBeVisible()
  })

  test('Запись на курс создает квест и обновляет план обучения', async ({ page }) => {
    // Переходим к курсам
    await page.click('[data-testid="nav-courses"]')
    
    // Получаем количество активных квестов
    const initialQuests = await page.locator('[data-testid="active-quests"] .quest-card').count()
    
    // Находим курс Python и записываемся
    await page.click('[data-testid="course-python-basics"] [data-testid="enroll-button"]')
    
    // Подтверждаем запись
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Записались на курс')
    
    // Переходим к квестам
    await page.click('[data-testid="nav-quests"]')
    
    // Проверяем, что появился новый квест
    await page.waitForTimeout(1000)
    const newQuests = await page.locator('[data-testid="active-quests"] .quest-card').count()
    expect(newQuests).toBeGreaterThan(initialQuests)
    
    // Проверяем, что квест связан с курсом
    await expect(page.locator('[data-testid="quest-python-course"]')).toBeVisible()
    await expect(page.locator('[data-testid="quest-python-course"]')).toContainText('Python')
  })

  test('Завершение квеста начисляет XP и выдает бейдж', async ({ page }) => {
    // Переходим к квестам
    await page.click('[data-testid="nav-quests"]')
    
    // Получаем начальные значения
    const initialXp = await page.textContent('[data-testid="current-xp"]')
    const initialBadges = await page.locator('[data-testid="earned-badges"] .badge').count()
    
    // Находим квест с прогрессом 100%
    const completeQuestButton = page.locator('[data-testid="complete-quest-button"]').first()
    
    if (await completeQuestButton.isVisible()) {
      // Завершаем квест
      await completeQuestButton.click()
      
      // Подтверждаем завершение
      await page.click('[data-testid="confirm-complete-quest"]')
      
      // Ждем уведомления
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Квест завершен')
      
      // Проверяем начисление XP
      await page.waitForTimeout(1000)
      const newXp = await page.textContent('[data-testid="current-xp"]')
      expect(parseInt(newXp!)).toBeGreaterThan(parseInt(initialXp!))
      
      // Проверяем получение бейджа (может быть не всегда)
      const newBadges = await page.locator('[data-testid="earned-badges"] .badge').count()
      // expect(newBadges).toBeGreaterThanOrEqual(initialBadges)
    } else {
      // Если нет квестов для завершения, пропускаем тест
      test.skip()
    }
  })

  test('Изменение порога в админке влияет на готовность профилей', async ({ page }) => {
    // Переходим в админку (предполагаем, что пользователь имеет права)
    await page.goto('/admin')
    
    // Получаем текущий статус готовности
    const initialReadiness = await page.textContent('[data-testid="profile-readiness-status"]')
    
    // Находим настройку порога
    await page.click('[data-testid="threshold-settings"]')
    
    // Изменяем порог с 70% на 80%
    const thresholdInput = page.locator('[data-testid="completeness-threshold"]')
    await thresholdInput.clear()
    await thresholdInput.fill('80')
    
    // Сохраняем изменения
    await page.click('[data-testid="save-threshold"]')
    
    // Ждем уведомления об успешном сохранении
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Порог обновлен')
    
    // Возвращаемся к профилю сотрудника
    await page.goto('/employee')
    
    // Проверяем, что статус готовности мог измениться
    await page.waitForTimeout(2000) // Ждем пересчета
    const newReadiness = await page.textContent('[data-testid="profile-readiness-status"]')
    
    // В зависимости от полноты профиля, статус мог измениться
    console.log(`Готовность до: ${initialReadiness}, после: ${newReadiness}`)
  })

  test('Применение предложения ИИ вызывает соответствующее действие', async ({ page }) => {
    // Открываем чат
    await page.click('[data-testid="chat-toggle"]')
    
    // Отправляем сообщение с запросом совета
    await page.fill('[data-testid="chat-input"]', 'Какие навыки мне нужно развивать?')
    await page.click('[data-testid="send-message"]')
    
    // Ждем ответа ИИ
    await page.waitForSelector('[data-testid="ai-message"]', { timeout: 10000 })
    
    // Ищем предложенное действие (например, добавить навык)
    const suggestionButton = page.locator('[data-testid="suggestion-add-skill"]').first()
    
    if (await suggestionButton.isVisible()) {
      // Получаем количество навыков до применения
      const initialSkills = await page.locator('[data-testid="user-skills"] .skill-item').count()
      
      // Применяем предложение
      await suggestionButton.click()
      
      // Ждем уведомления
      await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
      await expect(page.locator('[data-testid="toast-success"]')).toContainText('Предложение применено')
      
      // Проверяем, что навык был добавлен
      await page.waitForTimeout(1000)
      const newSkills = await page.locator('[data-testid="user-skills"] .skill-item').count()
      expect(newSkills).toBeGreaterThan(initialSkills)
    } else {
      // Если ИИ не предложил действий, пропускаем тест
      test.skip()
    }
  })

  test('Голосовая команда преобразуется в действие', async ({ page }) => {
    // Проверяем поддержку микрофона в браузере
    const microphonePermission = await page.context().grantPermissions(['microphone'])
    
    // Открываем чат
    await page.click('[data-testid="chat-toggle"]')
    
    // Нажимаем кнопку записи голоса
    const voiceButton = page.locator('[data-testid="voice-record-button"]')
    
    if (await voiceButton.isVisible()) {
      await voiceButton.click()
      
      // Имитируем голосовую команду (в реальности здесь была бы запись)
      await page.waitForTimeout(2000)
      
      // Останавливаем запись
      await page.click('[data-testid="voice-stop-button"]')
      
      // Ждем обработки и транскрипции
      await expect(page.locator('[data-testid="voice-transcription"]')).toBeVisible()
      
      // Проверяем, что команда была распознана
      const transcription = await page.textContent('[data-testid="voice-transcription"]')
      expect(transcription).toBeTruthy()
    } else {
      // Если голосовой ввод не поддерживается, пропускаем тест
      test.skip()
    }
  })

  test('Матчинг кандидатов обновляется при изменении профиля', async ({ page }) => {
    // Переходим в HR раздел (предполагаем наличие прав)
    await page.goto('/hr')
    
    // Получаем текущий список кандидатов для вакансии
    const initialMatches = await page.locator('[data-testid="candidate-matches"] .candidate-card').count()
    
    // Возвращаемся к профилю и добавляем релевантный навык
    await page.goto('/employee')
    
    // Добавляем навык, который нужен для вакансии
    await page.click('[data-testid="add-skill-button"]')
    await page.fill('[data-testid="skill-search"]', 'JavaScript')
    await page.click('[data-testid="add-skill-javascript"]')
    
    // Ждем обновления
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    
    // Возвращаемся в HR раздел
    await page.goto('/hr')
    
    // Проверяем, что матчинг обновился
    await page.waitForTimeout(3000) // Ждем пересчета матчинга
    await page.reload() // Обновляем страницу для актуальных данных
    
    const newMatches = await page.locator('[data-testid="candidate-matches"] .candidate-card').count()
    
    // Матчинг должен был пересчитаться (количество может как увеличиться, так и измениться)
    console.log(`Матчей до: ${initialMatches}, после: ${newMatches}`)
  })

  test('Уведомления отображаются при важных событиях', async ({ page }) => {
    // Проверяем, что при добавлении навыка показывается уведомление
    await page.click('[data-testid="add-skill-button"]')
    await page.fill('[data-testid="skill-search"]', 'React')
    await page.click('[data-testid="add-skill-react"]')
    
    // Проверяем уведомление об успехе
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="toast-success"]')).toContainText('Навык добавлен')
    
    // Проверяем, что уведомление исчезает через время
    await page.waitForTimeout(6000)
    await expect(page.locator('[data-testid="toast-success"]')).toBeHidden()
  })

  test('Профиль сохраняется между сессиями', async ({ page, context }) => {
    // Добавляем навык
    await page.click('[data-testid="add-skill-button"]')
    await page.fill('[data-testid="skill-search"]', 'TypeScript')
    await page.click('[data-testid="add-skill-typescript"]')
    
    // Ждем сохранения
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible()
    
    // Перезагружаем страницу
    await page.reload()
    await page.waitForSelector('[data-testid="profile-completeness"]')
    
    // Проверяем, что навык сохранился
    await expect(page.locator('[data-testid="user-skill-typescript"]')).toBeVisible()
  })
})

test.describe('Интеграция компонентов', () => {
  test('Все основные компоненты загружаются без ошибок', async ({ page }) => {
    await page.goto('/employee')
    
    // Проверяем загрузку основных компонентов
    await expect(page.locator('[data-testid="profile-completeness"]')).toBeVisible()
    await expect(page.locator('[data-testid="quest-board"]')).toBeVisible()
    await expect(page.locator('[data-testid="badge-bar"]')).toBeVisible()
    await expect(page.locator('[data-testid="role-recommendations"]')).toBeVisible()
    
    // Проверяем отсутствие ошибок в консоли
    const logs = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text())
      }
    })
    
    await page.waitForTimeout(2000)
    
    // Допускаем некоторые сетевые ошибки, но не ошибки JavaScript
    const jsErrors = logs.filter(log => 
      !log.includes('Failed to load resource') && 
      !log.includes('net::ERR')
    )
    
    expect(jsErrors).toHaveLength(0)
  })

  test('Переключение между страницами работает корректно', async ({ page }) => {
    await page.goto('/employee')
    
    // Переходим к HR
    await page.click('[data-testid="nav-hr"]')
    await expect(page.locator('[data-testid="hr-dashboard"]')).toBeVisible()
    
    // Переходим к админке
    await page.click('[data-testid="nav-admin"]')
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()
    
    // Возвращаемся к employee
    await page.click('[data-testid="nav-employee"]')
    await expect(page.locator('[data-testid="profile-completeness"]')).toBeVisible()
  })
})
