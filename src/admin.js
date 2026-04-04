const { QueryTypes } = require("sequelize");
const { sequelize } = require("./db");
const { getCurrentUser } = require("./auth");
const { hashPassword } = require("./passwords");

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeNullable(value) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function normalizeIdArray(values) {
  const source = Array.isArray(values) ? values : values ? [values] : [];
  return [...new Set(source.map((value) => normalizeString(value)).filter(Boolean))];
}

function mapDatabaseError(error) {
  if (error.httpStatus) {
    return {
      status: error.httpStatus,
      message: error.message,
    };
  }

  const code = error.original?.code || error.parent?.code || error.code;

  if (code === "23505") {
    return {
      status: 409,
      message: "Запись с такими уникальными данными уже существует.",
    };
  }

  if (code === "23503") {
    return {
      status: 409,
      message: "Операция заблокирована связанными данными.",
    };
  }

  if (code === "23514" || code === "23502") {
    return {
      status: 400,
      message: "Данные не прошли проверку ограничений базы данных.",
    };
  }

  return {
    status: 500,
    message: "Не удалось выполнить операцию с данными.",
  };
}

function withAdminAccess(handler) {
  return async (req, res) => {
    const user = getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Требуется авторизация.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "Доступ разрешен только администратору.",
      });
    }

    try {
      return await handler(req, res, user);
    } catch (error) {
      console.error(error);
      const mapped = mapDatabaseError(error);
      return res.status(mapped.status).json({
        ok: false,
        error: mapped.message,
      });
    }
  };
}

function httpError(status, message) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

async function syncGroupStudents(groupId, studentIds, transaction) {
  const normalizedIds = normalizeIdArray(studentIds);

  await sequelize.query(
    `
      DELETE FROM group_students
      WHERE group_id = :groupId
    `,
    {
      replacements: { groupId },
      transaction,
    }
  );

  for (const studentId of normalizedIds) {
    await sequelize.query(
      `
        INSERT INTO group_students (student_id, group_id)
        VALUES (:studentId, :groupId)
        ON CONFLICT (student_id, group_id) DO NOTHING
      `,
      {
        replacements: {
          studentId,
          groupId,
        },
        transaction,
      }
    );
  }
}

async function loadStudents(transaction) {
  return sequelize.query(
    `
      SELECT
        s.id,
        s.user_id AS "userId",
        u.full_name AS "fullName",
        u.email,
        s.phone,
        s.birth_date AS "birthDate",
        s.registration_date AS "registrationDate"
      FROM students s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.id DESC
    `,
    {
      transaction,
      type: QueryTypes.SELECT,
    }
  );
}

async function loadTeachers(transaction) {
  return sequelize.query(
    `
      SELECT
        t.id,
        t.user_id AS "userId",
        u.full_name AS "fullName",
        u.email,
        t.specialization,
        t.hire_date AS "hireDate"
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      ORDER BY t.id DESC
    `,
    {
      transaction,
      type: QueryTypes.SELECT,
    }
  );
}

async function loadGroups(transaction) {
  return sequelize.query(
    `
      SELECT
        g.id,
        g.group_name AS "groupName",
        g.teacher_id AS "teacherId",
        u.full_name AS "teacherName",
        g.level,
        g.age_category AS "ageCategory",
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', s.id::text,
              'fullName', su.full_name
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) AS students,
        COALESCE(
          ARRAY_AGG(DISTINCT s.id::text) FILTER (WHERE s.id IS NOT NULL),
          ARRAY[]::text[]
        ) AS "studentIds"
      FROM groups g
      JOIN teachers t ON t.id = g.teacher_id
      JOIN users u ON u.id = t.user_id
      LEFT JOIN group_students gs ON gs.group_id = g.id
      LEFT JOIN students s ON s.id = gs.student_id
      LEFT JOIN users su ON su.id = s.user_id
      GROUP BY
        g.id,
        g.group_name,
        g.teacher_id,
        u.full_name,
        g.level,
        g.age_category
      ORDER BY g.id DESC
    `,
    {
      transaction,
      type: QueryTypes.SELECT,
    }
  );
}

async function loadSchedule(transaction) {
  return sequelize.query(
    `
      SELECT
        s.id,
        s.group_id AS "groupId",
        g.group_name AS "groupName",
        s.lesson_date AS "lessonDate",
        TO_CHAR(s.start_time, 'HH24:MI') AS "startTime",
        TO_CHAR(s.end_time, 'HH24:MI') AS "endTime",
        s.room
      FROM schedule s
      JOIN groups g ON g.id = s.group_id
      ORDER BY s.lesson_date DESC, s.start_time DESC, s.id DESC
    `,
    {
      transaction,
      type: QueryTypes.SELECT,
    }
  );
}

async function loadSubscriptions(transaction) {
  return sequelize.query(
    `
      SELECT
        sub.id,
        sub.student_id AS "studentId",
        u.full_name AS "studentName",
        sub.lessons_total AS "lessonsTotal",
        sub.lessons_left AS "lessonsLeft",
        sub.start_date AS "startDate",
        sub.end_date AS "endDate",
        sub.status
      FROM subscriptions sub
      JOIN students s ON s.id = sub.student_id
      JOIN users u ON u.id = s.user_id
      ORDER BY sub.id DESC
    `,
    {
      transaction,
      type: QueryTypes.SELECT,
    }
  );
}

async function loadAdminData(transaction) {
  const [students, teachers, groups, schedule, subscriptions] = await Promise.all([
    loadStudents(transaction),
    loadTeachers(transaction),
    loadGroups(transaction),
    loadSchedule(transaction),
    loadSubscriptions(transaction),
  ]);

  return {
    students,
    teachers,
    groups,
    schedule,
    subscriptions,
  };
}

async function loadAttendanceReport(transaction) {
  return sequelize.query(
    `
      SELECT
        att.id,
        sch.lesson_date AS "lessonDate",
        TO_CHAR(sch.start_time, 'HH24:MI') AS "startTime",
        TO_CHAR(sch.end_time, 'HH24:MI') AS "endTime",
        sch.room,
        g.group_name AS "groupName",
        tu.full_name AS "teacherName",
        su.full_name AS "studentName",
        att.attendance_status AS "attendanceStatus",
        att.marked_at AS "markedAt",
        sub.lessons_total AS "lessonsTotal",
        sub.lessons_left AS "lessonsLeft"
      FROM attendance att
      JOIN schedule sch ON sch.id = att.schedule_id
      JOIN groups g ON g.id = sch.group_id
      JOIN teachers t ON t.id = g.teacher_id
      JOIN users tu ON tu.id = t.user_id
      JOIN students st ON st.id = att.student_id
      JOIN users su ON su.id = st.user_id
      LEFT JOIN subscriptions sub ON sub.id = att.subscription_id
      ORDER BY sch.lesson_date DESC, sch.start_time DESC, att.marked_at DESC, att.id DESC
    `,
    {
      transaction,
      type: QueryTypes.SELECT,
    }
  );
}

async function loadSubscriptionReport(transaction) {
  return sequelize.query(
    `
      SELECT
        sub.id,
        sub.student_id AS "studentId",
        u.full_name AS "studentName",
        COALESCE(
          STRING_AGG(DISTINCT g.group_name, ', ') FILTER (WHERE g.id IS NOT NULL),
          '—'
        ) AS "groupNames",
        sub.lessons_total AS "lessonsTotal",
        sub.lessons_left AS "lessonsLeft",
        sub.start_date AS "startDate",
        sub.end_date AS "endDate",
        sub.status,
        CAST(sub.end_date - CURRENT_DATE AS INTEGER) AS "daysRemaining"
      FROM subscriptions sub
      JOIN students s ON s.id = sub.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN group_students gs ON gs.student_id = s.id
      LEFT JOIN groups g ON g.id = gs.group_id
      GROUP BY
        sub.id,
        sub.student_id,
        u.full_name,
        sub.lessons_total,
        sub.lessons_left,
        sub.start_date,
        sub.end_date,
        sub.status
      ORDER BY sub.end_date ASC, sub.id DESC
    `,
    {
      transaction,
      type: QueryTypes.SELECT,
    }
  );
}

async function loadScheduleReport(transaction) {
  return sequelize.query(
    `
      SELECT
        sch.id,
        sch.lesson_date AS "lessonDate",
        TO_CHAR(sch.start_time, 'HH24:MI') AS "startTime",
        TO_CHAR(sch.end_time, 'HH24:MI') AS "endTime",
        sch.room,
        g.group_name AS "groupName",
        tu.full_name AS "teacherName",
        COUNT(DISTINCT gs.student_id)::int AS "studentCount",
        COUNT(DISTINCT att.id)::int AS "markedCount",
        COUNT(DISTINCT CASE WHEN att.attendance_status = TRUE THEN att.id END)::int AS "presentCount",
        COUNT(DISTINCT CASE WHEN att.attendance_status = FALSE THEN att.id END)::int AS "absentCount",
        GREATEST(
          COUNT(DISTINCT gs.student_id)::int - COUNT(DISTINCT att.id)::int,
          0
        ) AS "unmarkedCount"
      FROM schedule sch
      JOIN groups g ON g.id = sch.group_id
      JOIN teachers t ON t.id = g.teacher_id
      JOIN users tu ON tu.id = t.user_id
      LEFT JOIN group_students gs ON gs.group_id = g.id
      LEFT JOIN attendance att
        ON att.schedule_id = sch.id
       AND att.student_id = gs.student_id
      GROUP BY
        sch.id,
        sch.lesson_date,
        sch.start_time,
        sch.end_time,
        sch.room,
        g.group_name,
        tu.full_name
      ORDER BY sch.lesson_date DESC, sch.start_time DESC, sch.id DESC
    `,
    {
      transaction,
      type: QueryTypes.SELECT,
    }
  );
}

async function loadAdminReports(transaction) {
  const [attendance, subscriptions, schedule] = await Promise.all([
    loadAttendanceReport(transaction),
    loadSubscriptionReport(transaction),
    loadScheduleReport(transaction),
  ]);

  return {
    attendance,
    subscriptions,
    schedule,
  };
}

async function findStudent(id, transaction) {
  const students = await sequelize.query(
    `
      SELECT id, user_id AS "userId"
      FROM students
      WHERE id = :id
      LIMIT 1
    `,
    {
      replacements: { id },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return students[0] || null;
}

async function findTeacher(id, transaction) {
  const teachers = await sequelize.query(
    `
      SELECT id, user_id AS "userId"
      FROM teachers
      WHERE id = :id
      LIMIT 1
    `,
    {
      replacements: { id },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return teachers[0] || null;
}

async function findGroup(id, transaction) {
  const groups = await sequelize.query(
    `
      SELECT id
      FROM groups
      WHERE id = :id
      LIMIT 1
    `,
    {
      replacements: { id },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return groups[0] || null;
}

async function findScheduleItem(id, transaction) {
  const items = await sequelize.query(
    `
      SELECT id
      FROM schedule
      WHERE id = :id
      LIMIT 1
    `,
    {
      replacements: { id },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return items[0] || null;
}

async function findSubscription(id, transaction) {
  const items = await sequelize.query(
    `
      SELECT id
      FROM subscriptions
      WHERE id = :id
      LIMIT 1
    `,
    {
      replacements: { id },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return items[0] || null;
}

function attachAdminRoutes(app) {
  app.get(
    "/api/admin/bootstrap",
    withAdminAccess(async (_req, res) => {
      const data = await loadAdminData();
      return res.json({
        ok: true,
        ...data,
      });
    })
  );

  app.get(
    "/api/admin/reports",
    withAdminAccess(async (_req, res) => {
      const reports = await loadAdminReports();
      return res.json({
        ok: true,
        ...reports,
      });
    })
  );

  app.post(
    "/api/admin/students",
    withAdminAccess(async (req, res) => {
      const fullName = normalizeString(req.body.fullName);
      const email = normalizeString(req.body.email).toLowerCase();
      const password = normalizeString(req.body.password);

      if (!fullName || !email || !password) {
        throw httpError(400, "Для создания ученика нужны ФИО, email и пароль.");
      }

      await sequelize.transaction(async (transaction) => {
        const [createdUsers] = await sequelize.query(
          `
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES (:fullName, :email, :passwordHash, 'student')
            RETURNING id
          `,
          {
            replacements: {
              fullName,
              email,
              passwordHash: hashPassword(password),
            },
            transaction,
          }
        );

        await sequelize.query(
          `
            INSERT INTO students (user_id, phone, birth_date, registration_date)
            VALUES (:userId, :phone, :birthDate, COALESCE(:registrationDate, CURRENT_DATE))
          `,
          {
            replacements: {
              userId: createdUsers[0].id,
              phone: normalizeNullable(req.body.phone),
              birthDate: normalizeNullable(req.body.birthDate),
              registrationDate: normalizeNullable(req.body.registrationDate),
            },
            transaction,
          }
        );
      });

      return res.status(201).json({ ok: true });
    })
  );

  app.put(
    "/api/admin/students/:id",
    withAdminAccess(async (req, res) => {
      const id = req.params.id;
      const fullName = normalizeString(req.body.fullName);
      const email = normalizeString(req.body.email).toLowerCase();
      const password = normalizeString(req.body.password);

      if (!fullName || !email) {
        throw httpError(400, "Для обновления ученика нужны ФИО и email.");
      }

      const updated = await sequelize.transaction(async (transaction) => {
        const student = await findStudent(id, transaction);

        if (!student) {
          return false;
        }

        const replacements = {
          userId: student.userId,
          fullName,
          email,
          passwordHash: password ? hashPassword(password) : null,
          id,
          phone: normalizeNullable(req.body.phone),
          birthDate: normalizeNullable(req.body.birthDate),
          registrationDate: normalizeNullable(req.body.registrationDate),
        };

        await sequelize.query(
          `
            UPDATE users
            SET
              full_name = :fullName,
              email = :email,
              password_hash = COALESCE(:passwordHash, password_hash)
            WHERE id = :userId
          `,
          {
            replacements,
            transaction,
          }
        );

        await sequelize.query(
          `
            UPDATE students
            SET
              phone = :phone,
              birth_date = :birthDate,
              registration_date = COALESCE(:registrationDate, registration_date)
            WHERE id = :id
          `,
          {
            replacements,
            transaction,
          }
        );

        return true;
      });

      if (!updated) {
        throw httpError(404, "Ученик не найден.");
      }

      return res.json({ ok: true });
    })
  );

  app.delete(
    "/api/admin/students/:id",
    withAdminAccess(async (req, res) => {
      const deleted = await sequelize.transaction(async (transaction) => {
        const student = await findStudent(req.params.id, transaction);

        if (!student) {
          return false;
        }

        await sequelize.query(
          `
            DELETE FROM users
            WHERE id = :userId AND role = 'student'
          `,
          {
            replacements: { userId: student.userId },
            transaction,
          }
        );

        return true;
      });

      if (!deleted) {
        throw httpError(404, "Ученик не найден.");
      }

      return res.json({ ok: true });
    })
  );

  app.post(
    "/api/admin/teachers",
    withAdminAccess(async (req, res) => {
      const fullName = normalizeString(req.body.fullName);
      const email = normalizeString(req.body.email).toLowerCase();
      const password = normalizeString(req.body.password);

      if (!fullName || !email || !password) {
        throw httpError(400, "Для создания преподавателя нужны ФИО, email и пароль.");
      }

      await sequelize.transaction(async (transaction) => {
        const [createdUsers] = await sequelize.query(
          `
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES (:fullName, :email, :passwordHash, 'teacher')
            RETURNING id
          `,
          {
            replacements: {
              fullName,
              email,
              passwordHash: hashPassword(password),
            },
            transaction,
          }
        );

        await sequelize.query(
          `
            INSERT INTO teachers (user_id, specialization, hire_date)
            VALUES (:userId, :specialization, :hireDate)
          `,
          {
            replacements: {
              userId: createdUsers[0].id,
              specialization: normalizeNullable(req.body.specialization),
              hireDate: normalizeNullable(req.body.hireDate),
            },
            transaction,
          }
        );
      });

      return res.status(201).json({ ok: true });
    })
  );

  app.put(
    "/api/admin/teachers/:id",
    withAdminAccess(async (req, res) => {
      const id = req.params.id;
      const fullName = normalizeString(req.body.fullName);
      const email = normalizeString(req.body.email).toLowerCase();
      const password = normalizeString(req.body.password);

      if (!fullName || !email) {
        throw httpError(400, "Для обновления преподавателя нужны ФИО и email.");
      }

      const updated = await sequelize.transaction(async (transaction) => {
        const teacher = await findTeacher(id, transaction);

        if (!teacher) {
          return false;
        }

        const replacements = {
          userId: teacher.userId,
          fullName,
          email,
          passwordHash: password ? hashPassword(password) : null,
          id,
          specialization: normalizeNullable(req.body.specialization),
          hireDate: normalizeNullable(req.body.hireDate),
        };

        await sequelize.query(
          `
            UPDATE users
            SET
              full_name = :fullName,
              email = :email,
              password_hash = COALESCE(:passwordHash, password_hash)
            WHERE id = :userId
          `,
          {
            replacements,
            transaction,
          }
        );

        await sequelize.query(
          `
            UPDATE teachers
            SET
              specialization = :specialization,
              hire_date = :hireDate
            WHERE id = :id
          `,
          {
            replacements,
            transaction,
          }
        );

        return true;
      });

      if (!updated) {
        throw httpError(404, "Преподаватель не найден.");
      }

      return res.json({ ok: true });
    })
  );

  app.delete(
    "/api/admin/teachers/:id",
    withAdminAccess(async (req, res) => {
      const deleted = await sequelize.transaction(async (transaction) => {
        const teacher = await findTeacher(req.params.id, transaction);

        if (!teacher) {
          return false;
        }

        await sequelize.query(
          `
            DELETE FROM users
            WHERE id = :userId AND role = 'teacher'
          `,
          {
            replacements: { userId: teacher.userId },
            transaction,
          }
        );

        return true;
      });

      if (!deleted) {
        throw httpError(404, "Преподаватель не найден.");
      }

      return res.json({ ok: true });
    })
  );

  app.post(
    "/api/admin/groups",
    withAdminAccess(async (req, res) => {
      const groupName = normalizeString(req.body.groupName);
      const teacherId = normalizeString(req.body.teacherId);

      if (!groupName || !teacherId) {
        throw httpError(400, "Для группы нужны название и преподаватель.");
      }

      await sequelize.transaction(async (transaction) => {
        const [createdGroups] = await sequelize.query(
          `
            INSERT INTO groups (group_name, teacher_id, level, age_category)
            VALUES (:groupName, :teacherId, :level, :ageCategory)
            RETURNING id
          `,
          {
            replacements: {
              groupName,
              teacherId,
              level: normalizeNullable(req.body.level),
              ageCategory: normalizeNullable(req.body.ageCategory),
            },
            transaction,
          }
        );

        await syncGroupStudents(createdGroups[0].id, req.body.studentIds, transaction);
      });

      return res.status(201).json({ ok: true });
    })
  );

  app.put(
    "/api/admin/groups/:id",
    withAdminAccess(async (req, res) => {
      const id = req.params.id;
      const groupName = normalizeString(req.body.groupName);
      const teacherId = normalizeString(req.body.teacherId);

      if (!groupName || !teacherId) {
        throw httpError(400, "Для обновления группы нужны название и преподаватель.");
      }

      const updated = await sequelize.transaction(async (transaction) => {
        const group = await findGroup(id, transaction);

        if (!group) {
          return false;
        }

        await sequelize.query(
          `
            UPDATE groups
            SET
              group_name = :groupName,
              teacher_id = :teacherId,
              level = :level,
              age_category = :ageCategory
            WHERE id = :id
          `,
          {
            replacements: {
              id,
              groupName,
              teacherId,
              level: normalizeNullable(req.body.level),
              ageCategory: normalizeNullable(req.body.ageCategory),
            },
            transaction,
          }
        );

        await syncGroupStudents(id, req.body.studentIds, transaction);
        return true;
      });

      if (!updated) {
        throw httpError(404, "Группа не найдена.");
      }

      return res.json({ ok: true });
    })
  );

  app.delete(
    "/api/admin/groups/:id",
    withAdminAccess(async (req, res) => {
      const group = await findGroup(req.params.id);

      if (!group) {
        throw httpError(404, "Группа не найдена.");
      }

      await sequelize.query(
        `
          DELETE FROM groups
          WHERE id = :id
        `,
        {
          replacements: { id: req.params.id },
        }
      );

      return res.json({ ok: true });
    })
  );

  app.post(
    "/api/admin/schedule",
    withAdminAccess(async (req, res) => {
      const groupId = normalizeString(req.body.groupId);
      const lessonDate = normalizeString(req.body.lessonDate);
      const startTime = normalizeString(req.body.startTime);
      const endTime = normalizeString(req.body.endTime);
      const room = normalizeString(req.body.room);

      if (!groupId || !lessonDate || !startTime || !endTime || !room) {
        throw httpError(400, "Для занятия нужны группа, дата, время начала, время окончания и зал.");
      }

      await sequelize.query(
        `
          INSERT INTO schedule (group_id, lesson_date, start_time, end_time, room)
          VALUES (:groupId, :lessonDate, :startTime, :endTime, :room)
        `,
        {
          replacements: {
            groupId,
            lessonDate,
            startTime,
            endTime,
            room,
          },
        }
      );

      return res.status(201).json({ ok: true });
    })
  );

  app.put(
    "/api/admin/schedule/:id",
    withAdminAccess(async (req, res) => {
      const id = req.params.id;
      const groupId = normalizeString(req.body.groupId);
      const lessonDate = normalizeString(req.body.lessonDate);
      const startTime = normalizeString(req.body.startTime);
      const endTime = normalizeString(req.body.endTime);
      const room = normalizeString(req.body.room);

      if (!groupId || !lessonDate || !startTime || !endTime || !room) {
        throw httpError(400, "Для обновления занятия нужны группа, дата, время начала, время окончания и зал.");
      }

      const scheduleItem = await findScheduleItem(id);

      if (!scheduleItem) {
        throw httpError(404, "Занятие не найдено.");
      }

      await sequelize.query(
        `
          UPDATE schedule
          SET
            group_id = :groupId,
            lesson_date = :lessonDate,
            start_time = :startTime,
            end_time = :endTime,
            room = :room
          WHERE id = :id
        `,
        {
          replacements: {
            id,
            groupId,
            lessonDate,
            startTime,
            endTime,
            room,
          },
        }
      );

      return res.json({ ok: true });
    })
  );

  app.delete(
    "/api/admin/schedule/:id",
    withAdminAccess(async (req, res) => {
      const scheduleItem = await findScheduleItem(req.params.id);

      if (!scheduleItem) {
        throw httpError(404, "Занятие не найдено.");
      }

      await sequelize.query(
        `
          DELETE FROM schedule
          WHERE id = :id
        `,
        {
          replacements: { id: req.params.id },
        }
      );

      return res.json({ ok: true });
    })
  );

  app.post(
    "/api/admin/subscriptions",
    withAdminAccess(async (req, res) => {
      const studentId = normalizeString(req.body.studentId);
      const lessonsTotal = normalizeString(req.body.lessonsTotal);
      const lessonsLeft = normalizeString(req.body.lessonsLeft);
      const startDate = normalizeString(req.body.startDate);
      const endDate = normalizeString(req.body.endDate);
      const status = normalizeString(req.body.status);

      if (!studentId || !lessonsTotal || !lessonsLeft || !startDate || !endDate || !status) {
        throw httpError(400, "Для абонемента нужны ученик, количество занятий, остаток, даты и статус.");
      }

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
            :lessonsTotal,
            :lessonsLeft,
            :startDate,
            :endDate,
            :status
          )
        `,
        {
          replacements: {
            studentId,
            lessonsTotal,
            lessonsLeft,
            startDate,
            endDate,
            status,
          },
        }
      );

      return res.status(201).json({ ok: true });
    })
  );

  app.put(
    "/api/admin/subscriptions/:id",
    withAdminAccess(async (req, res) => {
      const id = req.params.id;
      const studentId = normalizeString(req.body.studentId);
      const lessonsTotal = normalizeString(req.body.lessonsTotal);
      const lessonsLeft = normalizeString(req.body.lessonsLeft);
      const startDate = normalizeString(req.body.startDate);
      const endDate = normalizeString(req.body.endDate);
      const status = normalizeString(req.body.status);

      if (!studentId || !lessonsTotal || !lessonsLeft || !startDate || !endDate || !status) {
        throw httpError(400, "Для обновления абонемента нужны ученик, количество занятий, остаток, даты и статус.");
      }

      const subscription = await findSubscription(id);

      if (!subscription) {
        throw httpError(404, "Абонемент не найден.");
      }

      await sequelize.query(
        `
          UPDATE subscriptions
          SET
            student_id = :studentId,
            lessons_total = :lessonsTotal,
            lessons_left = :lessonsLeft,
            start_date = :startDate,
            end_date = :endDate,
            status = :status
          WHERE id = :id
        `,
        {
          replacements: {
            id,
            studentId,
            lessonsTotal,
            lessonsLeft,
            startDate,
            endDate,
            status,
          },
        }
      );

      return res.json({ ok: true });
    })
  );

  app.delete(
    "/api/admin/subscriptions/:id",
    withAdminAccess(async (req, res) => {
      const subscription = await findSubscription(req.params.id);

      if (!subscription) {
        throw httpError(404, "Абонемент не найден.");
      }

      await sequelize.query(
        `
          DELETE FROM subscriptions
          WHERE id = :id
        `,
        {
          replacements: { id: req.params.id },
        }
      );

      return res.json({ ok: true });
    })
  );
}

module.exports = {
  attachAdminRoutes,
};
