const { QueryTypes } = require("sequelize");
const { sequelize } = require("./db");
const { getCurrentUser } = require("./auth");

function mapDatabaseError(error) {
  if (error.httpStatus) {
    return {
      status: error.httpStatus,
      message: error.message,
    };
  }

  const code = error.original?.code || error.parent?.code || error.code;

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
    message: "Не удалось выполнить операцию с посещаемостью.",
  };
}

function httpError(status, message) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

function parseAttendanceValue(value) {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }

  return null;
}

async function findTeacherProfileByUserId(userId, transaction) {
  const teachers = await sequelize.query(
    `
      SELECT id
      FROM teachers
      WHERE user_id = :userId
      LIMIT 1
    `,
    {
      replacements: { userId },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return teachers[0] || null;
}

function withTeacherAccess(handler) {
  return async (req, res) => {
    const user = getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Требуется авторизация.",
      });
    }

    if (user.role !== "teacher") {
      return res.status(403).json({
        ok: false,
        error: "Доступ разрешен только преподавателю.",
      });
    }

    try {
      const teacher = await findTeacherProfileByUserId(user.id);

      if (!teacher) {
        throw httpError(404, "Профиль преподавателя не найден.");
      }

      return await handler(req, res, user, teacher);
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

async function loadTeacherLessons(teacherId) {
  const lessons = await sequelize.query(
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
      WHERE g.teacher_id = :teacherId
      ORDER BY s.lesson_date DESC, s.start_time DESC, s.id DESC
    `,
    {
      replacements: { teacherId },
      type: QueryTypes.SELECT,
    }
  );

  const rosterRows = await sequelize.query(
    `
      SELECT
        sch.id AS "scheduleId",
        st.id AS "studentId",
        u.full_name AS "fullName",
        st.phone,
        att.id AS "attendanceId",
        att.attendance_status AS "attendanceStatus",
        att.subscription_id AS "attendanceSubscriptionId",
        sub.id AS "subscriptionId",
        sub.lessons_total AS "lessonsTotal",
        sub.lessons_left AS "lessonsLeft",
        sub.start_date AS "subscriptionStartDate",
        sub.end_date AS "subscriptionEndDate",
        sub.status AS "subscriptionStatus"
      FROM schedule sch
      JOIN groups g ON g.id = sch.group_id
      JOIN group_students gs ON gs.group_id = g.id
      JOIN students st ON st.id = gs.student_id
      JOIN users u ON u.id = st.user_id
      LEFT JOIN attendance att
        ON att.schedule_id = sch.id
       AND att.student_id = st.id
      LEFT JOIN subscriptions sub
        ON sub.id = COALESCE(
          att.subscription_id,
          (
            SELECT s2.id
            FROM subscriptions s2
            WHERE s2.student_id = st.id
              AND s2.status = 'active'
              AND s2.start_date <= sch.lesson_date
              AND s2.end_date >= sch.lesson_date
              AND s2.lessons_left > 0
            ORDER BY s2.start_date DESC, s2.id DESC
            LIMIT 1
          )
        )
      WHERE g.teacher_id = :teacherId
      ORDER BY sch.lesson_date DESC, sch.start_time DESC, u.full_name ASC
    `,
    {
      replacements: { teacherId },
      type: QueryTypes.SELECT,
    }
  );

  const lessonMap = new Map(
    lessons.map((lesson) => [
      lesson.id,
      {
        ...lesson,
        students: [],
      },
    ])
  );

  rosterRows.forEach((row) => {
    const lesson = lessonMap.get(row.scheduleId);

    if (!lesson) {
      return;
    }

    lesson.students.push({
      studentId: row.studentId,
      fullName: row.fullName,
      phone: row.phone,
      attendanceId: row.attendanceId,
      attendanceStatus: row.attendanceStatus,
      subscriptionId: row.subscriptionId,
      lessonsTotal: row.lessonsTotal,
      lessonsLeft: row.lessonsLeft,
      subscriptionStartDate: row.subscriptionStartDate,
      subscriptionEndDate: row.subscriptionEndDate,
      subscriptionStatus: row.subscriptionStatus,
      attendanceSubscriptionId: row.attendanceSubscriptionId,
    });
  });

  return lessons.map((lesson) => lessonMap.get(lesson.id));
}

async function findTeacherSchedule(scheduleId, teacherId, transaction) {
  const schedules = await sequelize.query(
    `
      SELECT
        s.id,
        s.group_id AS "groupId",
        s.lesson_date AS "lessonDate"
      FROM schedule s
      JOIN groups g ON g.id = s.group_id
      WHERE s.id = :scheduleId
        AND g.teacher_id = :teacherId
      LIMIT 1
    `,
    {
      replacements: {
        scheduleId,
        teacherId,
      },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return schedules[0] || null;
}

async function findGroupMembership(studentId, groupId, transaction) {
  const memberships = await sequelize.query(
    `
      SELECT student_id
      FROM group_students
      WHERE student_id = :studentId
        AND group_id = :groupId
      LIMIT 1
    `,
    {
      replacements: {
        studentId,
        groupId,
      },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return memberships[0] || null;
}

async function findAttendanceRecord(studentId, scheduleId, transaction) {
  const attendance = await sequelize.query(
    `
      SELECT
        id,
        attendance_status AS "attendanceStatus",
        subscription_id AS "subscriptionId"
      FROM attendance
      WHERE student_id = :studentId
        AND schedule_id = :scheduleId
      LIMIT 1
      FOR UPDATE
    `,
    {
      replacements: {
        studentId,
        scheduleId,
      },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return attendance[0] || null;
}

async function findSubscriptionForAttendance(studentId, lessonDate, subscriptionId, transaction) {
  if (subscriptionId) {
    const subscriptions = await sequelize.query(
      `
        SELECT
          id,
          lessons_left AS "lessonsLeft",
          status,
          start_date AS "startDate",
          end_date AS "endDate"
        FROM subscriptions
        WHERE id = :subscriptionId
          AND student_id = :studentId
          AND lessons_left > 0
          AND status <> 'suspended'
          AND start_date <= :lessonDate
          AND end_date >= :lessonDate
        LIMIT 1
        FOR UPDATE
      `,
      {
        replacements: {
          subscriptionId,
          studentId,
          lessonDate,
        },
        transaction,
        type: QueryTypes.SELECT,
      }
    );

    return subscriptions[0] || null;
  }

  const subscriptions = await sequelize.query(
    `
      SELECT
        id,
        lessons_left AS "lessonsLeft",
        status,
        start_date AS "startDate",
        end_date AS "endDate"
      FROM subscriptions
      WHERE student_id = :studentId
        AND status = 'active'
        AND lessons_left > 0
        AND start_date <= :lessonDate
        AND end_date >= :lessonDate
      ORDER BY start_date DESC, id DESC
      LIMIT 1
      FOR UPDATE
    `,
    {
      replacements: {
        studentId,
        lessonDate,
      },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return subscriptions[0] || null;
}

async function debitSubscription(subscriptionId, transaction) {
  const [updatedRows] = await sequelize.query(
    `
      UPDATE subscriptions
      SET
        lessons_left = lessons_left - 1,
        status = CASE
          WHEN lessons_left - 1 <= 0 THEN 'completed'
          ELSE 'active'
        END
      WHERE id = :subscriptionId
        AND lessons_left > 0
        AND status <> 'suspended'
      RETURNING id
    `,
    {
      replacements: { subscriptionId },
      transaction,
    }
  );

  if (!updatedRows.length) {
    throw httpError(409, "Не удалось списать занятие с абонемента.");
  }
}

async function restoreSubscription(subscriptionId, lessonDate, transaction) {
  const [updatedRows] = await sequelize.query(
    `
      UPDATE subscriptions
      SET
        lessons_left = LEAST(lessons_total, lessons_left + 1),
        status = CASE
          WHEN status IN ('active', 'completed')
            AND end_date >= :lessonDate
            AND LEAST(lessons_total, lessons_left + 1) > 0
          THEN 'active'
          ELSE status
        END
      WHERE id = :subscriptionId
      RETURNING id
    `,
    {
      replacements: {
        subscriptionId,
        lessonDate,
      },
      transaction,
    }
  );

  if (!updatedRows.length) {
    throw httpError(409, "Не удалось восстановить остаток занятий в абонементе.");
  }
}

function attachTeacherRoutes(app) {
  app.get(
    "/api/teacher/bootstrap",
    withTeacherAccess(async (_req, res, _user, teacher) => {
      const lessons = await loadTeacherLessons(teacher.id);
      return res.json({
        ok: true,
        lessons,
      });
    })
  );

  app.post(
    "/api/teacher/attendance",
    withTeacherAccess(async (req, res, _user, teacher) => {
      const scheduleId = String(req.body.scheduleId || "").trim();
      const studentId = String(req.body.studentId || "").trim();
      const attendanceStatus = parseAttendanceValue(req.body.attendanceStatus);

      if (!scheduleId || !studentId || attendanceStatus === null) {
        throw httpError(400, "Для отметки посещаемости нужны занятие, ученик и статус.");
      }

      await sequelize.transaction(async (transaction) => {
        const schedule = await findTeacherSchedule(scheduleId, teacher.id, transaction);

        if (!schedule) {
          throw httpError(404, "Занятие преподавателя не найдено.");
        }

        const membership = await findGroupMembership(studentId, schedule.groupId, transaction);

        if (!membership) {
          throw httpError(409, "Ученик не состоит в группе этого занятия.");
        }

        const attendance = await findAttendanceRecord(studentId, scheduleId, transaction);

        if (!attendance) {
          if (!attendanceStatus) {
            await sequelize.query(
              `
                INSERT INTO attendance (
                  student_id,
                  schedule_id,
                  subscription_id,
                  attendance_status
                )
                VALUES (:studentId, :scheduleId, NULL, FALSE)
              `,
              {
                replacements: {
                  studentId,
                  scheduleId,
                },
                transaction,
              }
            );

            return;
          }

          const subscription = await findSubscriptionForAttendance(
            studentId,
            schedule.lessonDate,
            null,
            transaction
          );

          if (!subscription) {
            throw httpError(409, "У ученика нет активного абонемента для этого занятия.");
          }

          await debitSubscription(subscription.id, transaction);

          await sequelize.query(
            `
              INSERT INTO attendance (
                student_id,
                schedule_id,
                subscription_id,
                attendance_status
              )
              VALUES (:studentId, :scheduleId, :subscriptionId, TRUE)
            `,
            {
              replacements: {
                studentId,
                scheduleId,
                subscriptionId: subscription.id,
              },
              transaction,
            }
          );

          return;
        }

        if (attendance.attendanceStatus === attendanceStatus) {
          return;
        }

        if (attendanceStatus) {
          const subscription = await findSubscriptionForAttendance(
            studentId,
            schedule.lessonDate,
            attendance.subscriptionId,
            transaction
          );

          if (!subscription) {
            throw httpError(409, "У ученика нет доступного абонемента для отметки посещаемости.");
          }

          await debitSubscription(subscription.id, transaction);

          await sequelize.query(
            `
              UPDATE attendance
              SET
                attendance_status = TRUE,
                subscription_id = :subscriptionId,
                marked_at = CURRENT_TIMESTAMP
              WHERE id = :attendanceId
            `,
            {
              replacements: {
                subscriptionId: subscription.id,
                attendanceId: attendance.id,
              },
              transaction,
            }
          );

          return;
        }

        if (attendance.attendanceStatus && attendance.subscriptionId) {
          await restoreSubscription(attendance.subscriptionId, schedule.lessonDate, transaction);
        }

        await sequelize.query(
          `
            UPDATE attendance
            SET
              attendance_status = FALSE,
              marked_at = CURRENT_TIMESTAMP
            WHERE id = :attendanceId
          `,
          {
            replacements: {
              attendanceId: attendance.id,
            },
            transaction,
          }
        );
      });

      return res.json({ ok: true });
    })
  );
}

module.exports = {
  attachTeacherRoutes,
};
