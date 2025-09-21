# PathFinder - AI HR Консультант

![PathFinder Logo](https://via.placeholder.com/800x200/4F46E5/FFFFFF?text=PathFinder+AI+HR+System)

**PathFinder** — современная корпоративная платформа управления талантами с глубокой интеграцией ИИ, голосовым взаимодействием и on-prem развертыванием.

## 🚀 Особенности

### ⭐ Ключевые возможности
- **🚀 Реактивная архитектура** — каждое действие мгновенно обновляет связанные части системы
- **🤖 Тотальная ИИ-интеграция** — ИИ-консультант на каждом экране с контекстными рекомендациями
- **🎤 Голосовой интерфейс** — STT/TTS с push-to-talk для естественного взаимодействия  
- **🔒 On-prem безопасность** — все данные остаются в корпоративном контуре
- **⚡ One-click подбор** — вставить JD → получить топ-кандидатов с объяснимостью
- **🎮 Геймификация** — XP, бейджи, квесты для мотивации развития
- **📊 HR-аналитика** — метрики команды, скилл-гэпы, тренды развития
- **🔄 Event-driven система** — каскадные обновления через доменные события

### 👥 Роли пользователей
- **Employee** — личный кабинет, развитие навыков, карьерные рекомендации
- **HR** — поиск кандидатов, анализ совместимости, аналитика команды  
- **Admin** — управление таксономией, настройки системы, feature flags

### 🎯 Критерии соответствия
- ✅ **ИИ-консультант** — рекомендации ролей, объяснение матчинга, ChatDock везде
- ✅ **Геймификация** — бейджи, XP, квесты, прогресс-бар, конфигурируемые правила
- ✅ **HR-поиск/матчинг** — фильтры, one-click vacancy check, объяснимость решений
- ✅ **Техреализация** — модульная архитектура, абстракции провайдеров, Docker
- ✅ **Презентация** — демо-сценарий, скриншоты UI, инструкции интеграции

## 🏗 Реактивная архитектура

### 🔄 Доменный слой с событиями

PathFinder построен на принципах **реактивной архитектуры**, где каждое пользовательское действие порождает доменные события, которые автоматически запускают каскадные обновления во всей системе.

#### Основные компоненты:

**📡 Event Bus** (`domain/eventBus.ts`)
- Централизованная шина событий с подписками
- Поддержка фильтрации и wildcard подписок
- Встроенные метрики и отладка

**⚡ Domain Events** (`domain/events.ts`)
- Типизированные события: `SKILL_ADDED`, `QUEST_COMPLETED`, `MATCH_RECALCULATED` и др.
- Полные payload интерфейсы для каждого типа события
- Type guards для безопасной работы с событиями

**🗄️ Zustand Slices** (`domain/state/`)
- `authSlice` — аутентификация и роли
- `profileSlice` — профиль и навыки сотрудника  
- `gamificationSlice` — XP, квесты, бейджи
- `hrSlice` — вакансии и матчинг кандидатов
- `taxonomySlice` — навыки, роли, пороги
- `chatSlice` — ИИ-взаимодействие
- `uiSlice` — состояние интерфейса

**🔧 Reactive Rules** (`domain/rules.ts`)
- Каскадная логика обновлений
- Правила начисления XP и бейджей
- Автоматический пересчет матчинга
- Генерация квестов и рекомендаций

### 🎯 Реактивные цепочки

**Добавление навыка** →
- Пересчет полноты профиля
- Начисление XP  
- Проверка бейджей
- Обновление матчинга вакансий
- Генерация рекомендаций ролей

**Запись на курс** →
- Создание связанного квеста
- Автоматическое принятие квеста
- Обновление плана обучения
- Уведомление о прогрессе

**Завершение квеста** →
- Начисление XP по сложности
- Выдача наград (бейджи, бусты)
- Проверка повышения уровня
- Генерация новых квестов

**Изменение порога (админ)** →
- Пересчет полноты всех профилей
- Обновление готовности к ротации
- Массовый пересчет матчинга
- Уведомления затронутых пользователей

### 💡 Примеры использования

```typescript
import { useProfile, useGamification, publish, createEvent } from '@/domain'

// Добавление навыка с автоматическими обновлениями
const { addSkill } = useProfile()
await addSkill({
  skillId: 'react',
  level: 'intermediate',
  yearsOfExperience: 2
})
// → Автоматически: +XP, проверка бейджей, пересчет матчинга

// Подписка на события для кастомной логики
subscribe('LEVEL_UP', (event) => {
  showCelebrationAnimation(event.data.newLevel)
})

// Публикация события записи на курс
await publish(createEvent('COURSE_ENROLLED', {
  userId: 'user-123',
  courseId: 'python-advanced',
  targetSkills: ['python', 'django']
}))
// → Автоматически: создание квеста, обновление плана
```

Подробные примеры в [`examples/reactive-domain-examples.ts`](examples/reactive-domain-examples.ts)

## 🛠 Технологический стек

### Frontend
- **Next.js 14** (App Router) — современный React фреймворк
- **TypeScript** — строгая типизация  
- **Tailwind CSS** — utility-first стилизация
- **shadcn/ui** — компоненты с accessibility
- **Zustand** — state management

### ИИ и голос
- **LLM абстракция** — Scibox/локальные LLM провайдеры
- **STT/TTS сервисы** — on-prem распознавание и синтез речи
- **Mock режим** — для разработки и демонстрации

### Инфраструктура  
- **Docker** — контейнеризация всех сервисов
- **PostgreSQL** — основная БД (опционально)
- **Redis** — кеширование и сессии
- **Nginx** — reverse proxy для production

## 🚀 Новые возможности архитектуры

### ✅ Готовые реактивные цепочки

- **Добавление навыков** — автоматический пересчет полноты профиля, начисление XP, проверка бейджей
- **Квест-система** — создание и завершение квестов с наградами и прогрессом
- **Курсы и обучение** — связывание курсов с навыками через квесты
- **Административные изменения** — мгновенная реакция на изменения порогов и таксономии
- **HR-матчинг** — автоматический пересчет совместимости при обновлениях профилей

### 🔧 Технические улучшения

- **Unified State Management** — централизованное состояние через Zustand с типизацией
- **Event-Driven Architecture** — реактивная архитектура на основе доменных событий
- **Type-Safe Domain Layer** — полная типизация событий и состояний
- **Optimistic Updates** — мгновенные обновления UI с fallback при ошибках
- **Persistent Demo Storage** — простая персистентность через файловую систему
- **Component Reactivity** — автоматическое обновление компонентов при изменении состояния

### 🎯 UX/UI улучшения

- **Активные элементы** — все видимые кнопки выполняют реальные действия
- **Мгновенная обратная связь** — тосты и уведомления для всех действий
- **Empty States** — дружелюбные заглушки с призывами к действию
- **Progress Indicators** — визуальные индикаторы загрузки для всех асинхронных операций
- **Confirmation Dialogs** — подтверждения для критичных действий

### 📊 Метрики и отладка

- **Event Logging** — подробные логи всех доменных событий в dev режиме
- **State Debugging** — встроенные dev tools для отслеживания состояния
- **Performance Tracking** — метрики времени выполнения правил и обновлений
- **Error Boundaries** — graceful обработка ошибок с пользовательскими уведомлениями

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- Docker и Docker Compose
- Git

### 1. Клонирование и установка
```bash
git clone <repository-url>
cd pathfinder-ai-hr
npm install
```

### 2. Настройка окружения  
```bash
cp .env.example .env.local
# Отредактируйте .env.local при необходимости
```

### 3. Запуск в development режиме
```bash
# Вариант 1: Локальная разработка
npm run dev

# Вариант 2: Docker development  
docker-compose -f docker-compose.dev.yml up
```

### 4. Доступ к приложению
Откройте [http://localhost:3000](http://localhost:3000) в браузере.

> **Исправлено (20.09.2024)**: Устранена ошибка "Ошибка загрузки профиля" на странице `/employee`. Теперь система корректно использует MockLLMClient для демо-режима.

## 🐳 Docker развертывание

### Development
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Production
```bash
# Базовая конфигурация
docker-compose up -d

# С PostgreSQL
docker-compose --profile production up -d

# С mock сервисами для демо
docker-compose --profile mock-services up -d
```

### Проверка здоровья
```bash
curl http://localhost:3000/api/health
```

## 📖 Демо-сценарий

### Вход в систему
1. Откройте [http://localhost:3000](http://localhost:3000)
2. Выберите роль для демонстрации:
   - **Employee** — для сотрудника  
   - **HR** — для HR-специалиста
   - **Admin** — для администратора

### 🧑‍💼 Сценарий "Employee"

1. **Начальный экран**
   - Видите полноту профиля 62%, ChatDock предлагает 3 шага улучшения
   - В разделе "Рекомендации" ИИ показывает подходящие роли с обоснованием

2. **Голосовое взаимодействие**  
   - Нажмите на микрофон в ChatDock
   - Скажите: "Что добить до роли Senior Analyst?"
   - ИИ-ассистент покажет 2 пробела в навыках + предложит конкретный квест

3. **Развитие навыков**
   - Перейдите в раздел "Квесты"  
   - Начните квест "Мастер JavaScript" 
   - Получите XP и отследите прогресс в реальном времени

4. **Геймификация**
   - Перейдите в "Достижения"
   - Просмотрите заработанные бейджи и текущий уровень
   - Увидите прогресс до следующего уровня

### 👥 Сценарий "HR"

1. **One-click подбор кандидатов**
   - Перейдите в раздел "One-click подбор"
   - Вставьте описание вакансии (или используйте пример):
     ```
     Ищем Senior Frontend Developer с опытом React 3+ лет, 
     TypeScript, знанием архитектурных паттернов
     ```
   - Нажмите "Найти кандидатов"

2. **Анализ результатов**
   - Получите топ-3 кандидата с процентом совпадения
   - Кликните "Объяснить" для просмотра детального анализа:
     - Совпадающие навыки (вес вклада)  
     - Недостающие навыки
     - План развития кандидата
     - Оценка времени готовности

3. **HR-аналитика**
   - Перейдите в "Аналитика"
   - Изучите топ-навыки команды и скилл-гэпы
   - Получите инсайты для планирования обучения

4. **ИИ-консультации**
   - Откройте ChatDock (HR-режим)
   - Спросите: "Кто подходит на роль Product Manager и почему?"
   - Получите персонализированные рекомендации с обоснованием

### ⚙️ Сценарий "Admin"

1. **Управление таксономией**
   - Перейдите в "Таксономия"
   - Просмотрите существующие навыки и роли
   - Отредактируйте навык или добавьте новый

2. **Feature Flags**
   - Перейдите в "Feature Flags"
   - Переключите интеграции с внешними провайдерами
   - Увидите, как это влияет на доступные функции

3. **Системная аналитика**
   - Изучите метрики использования системы
   - Просмотрите статус ИИ-сервисов
   - Проанализируйте качество данных

4. **Аудит и логи**
   - Перейдите в "Аудит"  
   - Просмотрите журнал действий пользователей
   - Экспортируйте данные для compliance

## 🔧 Интеграция с реальными провайдерами

### SciBox LLM (OpenAI-совместимый)
```bash
# .env.local - основные настройки
NEXT_PUBLIC_ENABLE_SCIBOX_LLM=true
SCIBOX_BASE_URL=https://llm.t1v.scibox.tech/v1
SCIBOX_API_KEY=your-scibox-api-key-here
SCIBOX_MODEL=Qwen2.5-72B-Instruct-AWQ
SCIBOX_EMBEDDINGS_MODEL=bge-m3
```

### On-prem STT/TTS
```bash
# Голосовые сервисы
NEXT_PUBLIC_ENABLE_LOCAL_STT=true  
NEXT_PUBLIC_ENABLE_LOCAL_TTS=true
LOCAL_STT_API_URL=https://your-stt-service.local
LOCAL_TTS_API_URL=https://your-tts-service.local
```

### Проверка интеграции с cURL

#### Чат без стриминга
```bash
curl -X POST http://localhost:3000/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Привет! Как дела?"}
    ],
    "stream": false
  }'
```

#### Чат со стримингом
```bash
curl -X POST http://localhost:3000/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Расскажи о карьерном развитии"}
    ],
    "stream": true
  }' --no-buffer
```

#### Создание эмбеддингов
```bash
curl -X POST http://localhost:3000/api/llm/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "input": ["навыки программирования", "лидерские качества"]
  }'
```

### Прямая проверка SciBox API
```bash
# Проверка подключения к SciBox напрямую
curl -X POST https://llm.t1v.scibox.tech/v1/chat/completions \
  -H "Authorization: Bearer YOUR_SCIBOX_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen2.5-72B-Instruct-AWQ",
    "messages": [{"role": "user", "content": "Тест подключения"}],
    "stream": false
  }'
```

### Безопасность и PII
```bash
# Включить редактирование персональных данных
ENABLE_PII_REDACTION=true

# Проверить работу PII редактора
curl -X POST http://localhost:3000/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Мой email john@company.com и телефон +7900123456"}
    ]
  }'
# В логах сервера должно быть: "Мой email [СКРЫТО] и телефон [СКРЫТО]"
```

## 🏗 Архитектура системы

### Структура проекта
```
pathfinder-ai-hr/
├── app/                    # Next.js App Router
│   ├── auth/              # Страница аутентификации
│   ├── employee/          # Кабинет сотрудника  
│   ├── hr/                # HR панель
│   ├── admin/             # Админ панель
│   └── api/               # API endpoints
├── components/            # React компоненты
│   ├── ui/                # Базовые UI компоненты
│   ├── ChatDock.tsx       # ИИ-чат интерфейс
│   ├── VoiceToggle.tsx    # Голосовое взаимодействие  
│   ├── ProfileCompleteness.tsx
│   ├── QuestBoard.tsx     # Геймификация
│   ├── BadgeBar.tsx       # Достижения
│   ├── RoleRecommendations.tsx
│   └── CandidateTable.tsx # HR таблица кандидатов
├── services/              # Бизнес-логика и провайдеры
│   ├── llmClient.ts       # LLM абстракция (Scibox/Mock)
│   ├── sttClient.ts       # STT провайдеры
│   ├── ttsClient.ts       # TTS провайдеры  
│   ├── profileService.ts  # Управление профилями
│   ├── gamificationService.ts # XP/бейджи/квесты
│   ├── taxonomyService.ts # Навыки и роли
│   └── hrSearchService.ts # Поиск и матчинг
├── types/                 # TypeScript типы
├── config/                # Конфигурации
│   ├── features.ts        # Feature flags
│   ├── skills.ts          # Справочник навыков
│   ├── roles.ts           # Справочник ролей
│   ├── gamification.ts    # Правила геймификации
│   └── thresholds.ts      # Пороговые значения
├── mocks/                 # Тестовые данные
├── docker/                # Docker конфигурации
└── README.md
```

### Провайдеры и абстракции
```typescript
// Все провайдеры имеют единый интерфейс
interface LLMProvider {
  chat(context: string, messages: ChatMessage[]): Promise<string>
  recommendRoles(profile: Profile): Promise<AIRecommendation[]>  
  matchCandidates(jobDesc: string, candidates: User[]): Promise<CandidateMatch[]>
}

interface STTProvider {
  transcribe(audioData: Blob): Promise<string>
  isAvailable(): boolean
}

interface TTSProvider {
  synthesize(text: string, voice?: string): Promise<Blob>
  getAvailableVoices(): Promise<string[]>
}
```

### Безопасность
- **On-prem развертывание** — никаких внешних сетевых вызовов по умолчанию
- **Feature flags** — все интеграции отключены по умолчанию  
- **RBAC** — разграничение прав доступа по ролям
- **Аудит логирование** — отслеживание всех действий
- **CSP заголовки** — защита от XSS атак

## 📊 Мониторинг и метрики

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Доступные метрики
- Статус ИИ-сервисов (LLM/STT/TTS)
- Время отклика API  
- Использование памяти и CPU
- Качество данных (полнота профилей)
- Активность пользователей

### Логирование
- Структурированные логи в JSON
- Аудит всех действий пользователей
- Метрики производительности
- Ошибки интеграций с внешними сервисами

## 🔄 CI/CD и развертывание

### Docker Registry
```bash
# Сборка образа
docker build -t pathfinder-ai-hr:latest .

# Публикация в registry
docker tag pathfinder-ai-hr:latest your-registry.com/pathfinder:latest
docker push your-registry.com/pathfinder:latest
```

### Kubernetes манифесты
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pathfinder-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pathfinder
  template:
    metadata:
      labels:
        app: pathfinder
    spec:
      containers:
      - name: pathfinder
        image: your-registry.com/pathfinder:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_MOCK_MODE
          value: "false"
```

## 🤝 Интеграции

### HRIS системы
```typescript
// Расширение для интеграции с HR Information Systems
interface HRISProvider {
  syncEmployees(): Promise<User[]>
  syncDepartments(): Promise<Department[]>
  exportProfile(userId: string): Promise<void>
}
```

### LMS платформы  
```typescript
// Интеграция с Learning Management Systems
interface LMSProvider {
  getCourses(): Promise<Course[]>
  enrollUser(userId: string, courseId: string): Promise<void>
  getProgress(userId: string): Promise<LearningProgress[]>
}
```

### ATS системы
```typescript
// Интеграция с Applicant Tracking Systems  
interface ATSProvider {
  createVacancy(vacancy: Vacancy): Promise<string>
  syncApplications(): Promise<Application[]>
  notifyCandidate(candidateId: string, message: string): Promise<void>
}
```

## 📈 Производительность

### Оптимизации
- **Code splitting** — динамическая загрузка компонентов
- **Image optimization** — автоматическое сжатие изображений  
- **API caching** — Redis кеширование для ускорения запросов
- **Database indexing** — оптимизированные индексы для поиска
- **Bundle analysis** — мониторинг размера bundle

### Масштабируемость
- **Horizontal scaling** — поддержка нескольких экземпляров приложения
- **Microservices ready** — модульная архитектура для выделения сервисов
- **Queue system** — фоновая обработка задач (будущая интеграция)
- **CDN support** — кеширование статических ресурсов

## 🧪 Тестирование

### Запуск тестов
```bash
# Unit тесты
npm run test

# E2E тесты  
npm run test:e2e

# Покрытие кода
npm run test:coverage
```

### Типы тестов
- **Unit тесты** — тестирование изолированных функций и компонентов
- **Integration тесты** — тестирование взаимодействия сервисов  
- **E2E тесты** — тестирование пользовательских сценариев
- **API тесты** — тестирование REST endpoints

## 🛣 Roadmap

### Версия 2.0
- [ ] Real-time коллаборация  
- [ ] Мобильное приложение
- [ ] Расширенная аналитика с ML
- [ ] Интеграция с календарями
- [ ] Workflow автоматизация

### Версия 2.5
- [ ] Multi-tenant поддержка
- [ ] Advanced RBAC с custom permissions
- [ ] GraphQL API  
- [ ] Микросервисная архитектура
- [ ] Event sourcing для аудита

## 🆘 Поддержка

### Документация
- [API Reference](./docs/api.md)
- [Integration Guide](./docs/integration.md)  
- [Deployment Guide](./docs/deployment.md)
- [Security Best Practices](./docs/security.md)

### Контакты
- **Email**: support@pathfinder.local
- **Issue Tracker**: GitHub Issues
- **Wiki**: Project Wiki
- **Discussions**: GitHub Discussions

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

---

**PathFinder** — будущее HR-технологий уже здесь! 🚀
