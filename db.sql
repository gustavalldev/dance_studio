-- PostgreSQL
-- База данных для ИС автоматизации деятельности танцевальной школы

DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS group_students CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS schedule CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(30) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_role
        CHECK (role IN ('admin', 'teacher', 'student'))
);

CREATE TABLE students (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    phone               VARCHAR(20),
    birth_date          DATE,
    registration_date   DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_students_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE teachers (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE,
    specialization  VARCHAR(100),
    hire_date       DATE,

    CONSTRAINT fk_teachers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE groups (
    id              BIGSERIAL PRIMARY KEY,
    group_name      VARCHAR(100) NOT NULL,
    teacher_id      BIGINT NOT NULL,
    level           VARCHAR(50),
    age_category    VARCHAR(50),

    CONSTRAINT fk_groups_teacher
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE group_students (
    student_id       BIGINT NOT NULL,
    group_id         BIGINT NOT NULL,
    enrolled_at      DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT pk_group_students
        PRIMARY KEY (student_id, group_id),

    CONSTRAINT fk_group_students_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_group_students_group
        FOREIGN KEY (group_id) REFERENCES groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE schedule (
    id              BIGSERIAL PRIMARY KEY,
    group_id        BIGINT NOT NULL,
    lesson_date     DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    room            VARCHAR(50) NOT NULL,

    CONSTRAINT fk_schedule_group
        FOREIGN KEY (group_id) REFERENCES groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_schedule_time
        CHECK (end_time > start_time)
);

CREATE TABLE subscriptions (
    id              BIGSERIAL PRIMARY KEY,
    student_id      BIGINT NOT NULL,
    lessons_total   INTEGER NOT NULL,
    lessons_left    INTEGER NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          VARCHAR(30) NOT NULL,

    CONSTRAINT fk_subscriptions_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_subscriptions_lessons_total
        CHECK (lessons_total > 0),

    CONSTRAINT chk_subscriptions_lessons_left
        CHECK (lessons_left >= 0 AND lessons_left <= lessons_total),

    CONSTRAINT chk_subscriptions_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_subscriptions_status
        CHECK (status IN ('active', 'completed', 'suspended'))
);

CREATE TABLE attendance (
    id                  BIGSERIAL PRIMARY KEY,
    student_id          BIGINT NOT NULL,
    schedule_id         BIGINT NOT NULL,
    subscription_id     BIGINT,
    attendance_status   BOOLEAN NOT NULL DEFAULT FALSE,
    marked_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attendance_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_attendance_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedule(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_attendance_subscription
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT uq_attendance_student_schedule
        UNIQUE (student_id, schedule_id)
);

-- Индексы для ускорения выборок
CREATE INDEX idx_students_user_id
    ON students(user_id);

CREATE INDEX idx_teachers_user_id
    ON teachers(user_id);

CREATE INDEX idx_groups_teacher_id
    ON groups(teacher_id);

CREATE INDEX idx_group_students_group_id
    ON group_students(group_id);

CREATE INDEX idx_group_students_student_id
    ON group_students(student_id);

CREATE INDEX idx_schedule_group_id
    ON schedule(group_id);

CREATE INDEX idx_schedule_lesson_date
    ON schedule(lesson_date);

CREATE INDEX idx_subscriptions_student_id
    ON subscriptions(student_id);

CREATE INDEX idx_subscriptions_student_status
    ON subscriptions(student_id, status);

CREATE INDEX idx_attendance_student_id
    ON attendance(student_id);

CREATE INDEX idx_attendance_schedule_id
    ON attendance(schedule_id);

CREATE INDEX idx_attendance_subscription_id
    ON attendance(subscription_id);
