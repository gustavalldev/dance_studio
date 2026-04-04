const { Sequelize } = require("sequelize");
const { db } = require("./config");

const sequelize = new Sequelize(db.name, db.user, db.password, {
  host: db.host,
  port: db.port,
  dialect: "postgres",
  logging: false,
});

async function checkDatabaseConnection() {
  await sequelize.authenticate();
}

async function ensureAppSchema() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS group_students (
      student_id BIGINT NOT NULL,
      group_id BIGINT NOT NULL,
      enrolled_at DATE NOT NULL DEFAULT CURRENT_DATE,
      CONSTRAINT pk_group_students PRIMARY KEY (student_id, group_id),
      CONSTRAINT fk_group_students_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      CONSTRAINT fk_group_students_group
        FOREIGN KEY (group_id) REFERENCES groups(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `);

  await sequelize.query(`
    ALTER TABLE attendance
    ADD COLUMN IF NOT EXISTS subscription_id BIGINT
  `);

  await sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_attendance_subscription'
      ) THEN
        ALTER TABLE attendance
        ADD CONSTRAINT fk_attendance_subscription
          FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_group_students_group_id
      ON group_students(group_id)
  `);

  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_group_students_student_id
      ON group_students(student_id)
  `);

  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_student_status
      ON subscriptions(student_id, status)
  `);

  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_attendance_subscription_id
      ON attendance(subscription_id)
  `);
}

module.exports = {
  sequelize,
  checkDatabaseConnection,
  ensureAppSchema,
};
