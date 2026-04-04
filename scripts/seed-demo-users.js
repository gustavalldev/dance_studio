const { sequelize, checkDatabaseConnection, ensureAppSchema } = require("../src/db");
const { hashPassword } = require("../src/passwords");

const demoUsers = [
  {
    fullName: "Администратор DanceStudio",
    email: "admin@dancestudio.local",
    password: "Admin123!",
    role: "admin",
  },
  {
    fullName: "Преподаватель DanceStudio",
    email: "teacher@dancestudio.local",
    password: "Teacher123!",
    role: "teacher",
  },
  {
    fullName: "Ученик DanceStudio",
    email: "student@dancestudio.local",
    password: "Student123!",
    role: "student",
  },
];

async function seed() {
  await checkDatabaseConnection();
  await ensureAppSchema();

  const profiles = {};

  for (const user of demoUsers) {
    const [savedUsers] = await sequelize.query(
      `
        INSERT INTO users (full_name, email, password_hash, role)
        VALUES (:fullName, :email, :passwordHash, :role)
        ON CONFLICT (email)
        DO UPDATE SET
          full_name = EXCLUDED.full_name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role
        RETURNING id
      `,
      {
        replacements: {
          fullName: user.fullName,
          email: user.email,
          passwordHash: hashPassword(user.password),
          role: user.role,
        },
      }
    );

    const userId = savedUsers[0].id;

    if (user.role === "teacher") {
      const [savedTeachers] = await sequelize.query(
        `
          INSERT INTO teachers (user_id, specialization, hire_date)
          VALUES (:userId, 'Хореография', CURRENT_DATE)
          ON CONFLICT (user_id)
          DO UPDATE SET specialization = EXCLUDED.specialization
          RETURNING id
        `,
        {
          replacements: { userId },
        }
      );

      profiles.teacherId = savedTeachers[0].id;
    }

    if (user.role === "student") {
      const [savedStudents] = await sequelize.query(
        `
          INSERT INTO students (user_id, phone, registration_date)
          VALUES (:userId, '+7 900 000-00-00', CURRENT_DATE)
          ON CONFLICT (user_id)
          DO UPDATE SET phone = EXCLUDED.phone
          RETURNING id
        `,
        {
          replacements: { userId },
        }
      );

      profiles.studentId = savedStudents[0].id;
    }
  }

  const [existingGroups] = await sequelize.query(
    `
      SELECT id
      FROM groups
      WHERE group_name = 'Demo Group'
        AND teacher_id = :teacherId
      LIMIT 1
    `,
    {
      replacements: { teacherId: profiles.teacherId },
    }
  );

  let groupId = existingGroups[0]?.id;

  if (!groupId) {
    const [createdGroups] = await sequelize.query(
      `
        INSERT INTO groups (group_name, teacher_id, level, age_category)
        VALUES ('Demo Group', :teacherId, 'Базовый', '12+')
        RETURNING id
      `,
      {
        replacements: { teacherId: profiles.teacherId },
      }
    );

    groupId = createdGroups[0].id;
  }

  await sequelize.query(
    `
      INSERT INTO group_students (student_id, group_id)
      VALUES (:studentId, :groupId)
      ON CONFLICT (student_id, group_id) DO NOTHING
    `,
    {
      replacements: {
        studentId: profiles.studentId,
        groupId,
      },
    }
  );

  const [activeSubscriptions] = await sequelize.query(
    `
      SELECT id
      FROM subscriptions
      WHERE student_id = :studentId
        AND status = 'active'
      LIMIT 1
    `,
    {
      replacements: { studentId: profiles.studentId },
    }
  );

  if (!activeSubscriptions[0]) {
    await sequelize.query(
      `
        INSERT INTO subscriptions (
          student_id,
          lessons_total,
          lessons_left,
          start_date,
          end_date,
          status
        )
        VALUES (
          :studentId,
          8,
          8,
          CURRENT_DATE - 7,
          CURRENT_DATE + 30,
          'active'
        )
      `,
      {
        replacements: { studentId: profiles.studentId },
      }
    );
  }

  const [demoLessons] = await sequelize.query(
    `
      SELECT id
      FROM schedule
      WHERE group_id = :groupId
        AND lesson_date = CURRENT_DATE
        AND start_time = '18:00'
        AND end_time = '19:30'
      LIMIT 1
    `,
    {
      replacements: { groupId },
    }
  );

  if (!demoLessons[0]) {
    await sequelize.query(
      `
        INSERT INTO schedule (group_id, lesson_date, start_time, end_time, room)
        VALUES (:groupId, CURRENT_DATE, '18:00', '19:30', 'Зал 1')
      `,
      {
        replacements: { groupId },
      }
    );
  }

  console.log("Demo users are ready:");
  for (const user of demoUsers) {
    console.log(`${user.role}: ${user.email} / ${user.password}`);
  }
  console.log("Teacher demo data: Demo Group, active subscription, today's lesson at 18:00.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
