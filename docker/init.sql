-- Инициализация базы данных PostgreSQL для PathFinder
-- Этот файл выполняется при первом запуске контейнера

-- Создание пользователя приложения (если не существует)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pathfinder_app') THEN
        CREATE ROLE pathfinder_app WITH LOGIN PASSWORD 'app-password';
    END IF;
END
$$;

-- Создание схемы для приложения
CREATE SCHEMA IF NOT EXISTS pathfinder AUTHORIZATION pathfinder;

-- Предоставление прав
GRANT USAGE ON SCHEMA pathfinder TO pathfinder_app;
GRANT CREATE ON SCHEMA pathfinder TO pathfinder_app;

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS pathfinder.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    avatar TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'hr', 'admin')),
    department VARCHAR(100) NOT NULL,
    position VARCHAR(200) NOT NULL,
    manager_id UUID REFERENCES pathfinder.users(id),
    hire_date DATE NOT NULL,
    last_login_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица навыков
CREATE TABLE IF NOT EXISTS pathfinder.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    competency_area VARCHAR(50) NOT NULL,
    is_core BOOLEAN DEFAULT false,
    related_skills JSON DEFAULT '[]',
    owner VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ролей
CREATE TABLE IF NOT EXISTS pathfinder.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(100) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('junior', 'middle', 'senior', 'lead', 'principal')),
    required_skills JSON DEFAULT '[]',
    preferred_skills JSON DEFAULT '[]',
    responsibilities JSON DEFAULT '[]',
    qualifications JSON DEFAULT '[]',
    salary_range JSON,
    is_active BOOLEAN DEFAULT true,
    owner VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS pathfinder.profiles (
    user_id UUID PRIMARY KEY REFERENCES pathfinder.users(id),
    bio TEXT,
    skills JSON DEFAULT '[]',
    experiences JSON DEFAULT '[]',
    education JSON DEFAULT '[]',
    certifications JSON DEFAULT '[]',
    preferences JSON DEFAULT '{}',
    completeness JSON DEFAULT '{}',
    readiness_for_rotation BOOLEAN DEFAULT false,
    career_goals JSON DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица вакансий
CREATE TABLE IF NOT EXISTS pathfinder.vacancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(100) NOT NULL,
    role_id UUID REFERENCES pathfinder.roles(id),
    required_skills JSON DEFAULT '[]',
    preferred_skills JSON DEFAULT '[]',
    requirements JSON DEFAULT '[]',
    responsibilities JSON DEFAULT '[]',
    benefits JSON DEFAULT '[]',
    salary_range JSON,
    location VARCHAR(200) NOT NULL,
    work_type VARCHAR(20) NOT NULL CHECK (work_type IN ('remote', 'office', 'hybrid')),
    experience_years JSON NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'closed', 'on_hold')),
    hiring_manager_id UUID REFERENCES pathfinder.users(id),
    hr_contact_id UUID REFERENCES pathfinder.users(id),
    posted_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица геймификации - пользовательские данные
CREATE TABLE IF NOT EXISTS pathfinder.user_gamification (
    user_id UUID PRIMARY KEY REFERENCES pathfinder.users(id),
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges JSON DEFAULT '[]',
    quests JSON DEFAULT '[]',
    streak_days INTEGER DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица аудита
CREATE TABLE IF NOT EXISTS pathfinder.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES pathfinder.users(id),
    action VARCHAR(200) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(200) NOT NULL,
    changes JSON,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_email ON pathfinder.users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON pathfinder.users(department);
CREATE INDEX IF NOT EXISTS idx_users_role ON pathfinder.users(role);
CREATE INDEX IF NOT EXISTS idx_skills_name ON pathfinder.skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON pathfinder.skills(category);
CREATE INDEX IF NOT EXISTS idx_roles_department ON pathfinder.roles(department);
CREATE INDEX IF NOT EXISTS idx_roles_level ON pathfinder.roles(level);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON pathfinder.vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_department ON pathfinder.vacancies(department);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON pathfinder.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON pathfinder.audit_logs(timestamp);

-- Полнотекстовый поиск
CREATE INDEX IF NOT EXISTS idx_skills_name_trgm ON pathfinder.skills USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_roles_title_trgm ON pathfinder.roles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON pathfinder.users USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION pathfinder.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON pathfinder.users FOR EACH ROW EXECUTE FUNCTION pathfinder.update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON pathfinder.skills FOR EACH ROW EXECUTE FUNCTION pathfinder.update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON pathfinder.roles FOR EACH ROW EXECUTE FUNCTION pathfinder.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON pathfinder.profiles FOR EACH ROW EXECUTE FUNCTION pathfinder.update_updated_at_column();
CREATE TRIGGER update_vacancies_updated_at BEFORE UPDATE ON pathfinder.vacancies FOR EACH ROW EXECUTE FUNCTION pathfinder.update_updated_at_column();
CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE ON pathfinder.user_gamification FOR EACH ROW EXECUTE FUNCTION pathfinder.update_updated_at_column();

-- Предоставление прав приложению
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pathfinder TO pathfinder_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pathfinder TO pathfinder_app;

-- Комментарии к таблицам
COMMENT ON TABLE pathfinder.users IS 'Пользователи системы PathFinder';
COMMENT ON TABLE pathfinder.skills IS 'Справочник навыков';
COMMENT ON TABLE pathfinder.roles IS 'Справочник ролей/позиций';
COMMENT ON TABLE pathfinder.profiles IS 'Профили пользователей с навыками и опытом';
COMMENT ON TABLE pathfinder.vacancies IS 'Вакансии для внутреннего рекрутинга';
COMMENT ON TABLE pathfinder.user_gamification IS 'Данные геймификации пользователей';
COMMENT ON TABLE pathfinder.audit_logs IS 'Журнал аудита действий пользователей';

-- Вставка начальных данных (admin пользователь)
INSERT INTO pathfinder.users (id, email, first_name, last_name, display_name, role, department, position, hire_date) 
VALUES (
    uuid_generate_v4(),
    'admin@pathfinder.local',
    'Admin',
    'User',
    'Администратор системы',
    'admin',
    'IT',
    'System Administrator',
    CURRENT_DATE
) ON CONFLICT (email) DO NOTHING;
