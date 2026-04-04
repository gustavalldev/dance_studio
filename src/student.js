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
    message: "Не удалось загрузить данные ученика.",
  };
}

function httpError(status, message) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

async function findStudentProfileByUserId(userId, transaction) {
  const students = await sequelize.query(
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
      WHERE s.user_id = :userId
      LIMIT 1
    `,
    {
      replacements: { userId },
      transaction,
      type: QueryTypes.SELECT,
    }
  );

  return students[0] || null;
}

function withStudentAccess(handler) {
  return async (req, res) => {
    const user = getCurrentUser(req);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "Требуется авторизация.",
      });
    }

    if (user.role !== "student") {
      return res.status(403).json({
        ok: false,
        error: "Доступ разрешен только ученику.",
      });
    }

    try {
      const profile = await findStudentProfileByUserId(user.id);

      if (!profile) {
        throw httpError(404, "Профиль ученика не найден.");
      }

      return await handler(req, res, user, profile);
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

async function loadStudentGroups(studentId) {
  return sequelize.query(
    `
      SELECT
        g.id,
        g.group_name AS "groupName",
        u.full_name AS "teacherName",
        g.level,
        g.age_category AS "ageCategory"
      FROM group_students gs
      JOIN groups g ON g.id = gs.group_id
      JOIN teachers t ON t.id = g.teacher_id
      JOIN users u ON u.id = t.user_id
      WHERE gs.student_id = :studentId
      ORDER BY g.group_name ASC
    `,
    {
      replacements: { studentId },
      type: QueryTypes.SELECT,
    }
  );
}

async function loadStudentSchedule(studentId) {
  return sequelize.query(
    `
      SELECT
        sch.id,
        sch.lesson_date AS "lessonDate",
        TO_CHAR(sch.start_time, 'HH24:MI') AS "startTime",
        TO_CHAR(sch.end_time, 'HH24:MI') AS "endTime",
        sch.room,
        g.id AS "groupId",
        g.group_name AS "groupName",
        u.full_name AS "teacherName",
        att.id AS "attendanceId",
        att.attendance_status AS "attendanceStatus"
      FROM group_students gs
      JOIN groups g ON g.id = gs.group_id
      JOIN teachers t ON t.id = g.teacher_id
      JOIN users u ON u.id = t.user_id
      JOIN schedule sch ON sch.group_id = g.id
      LEFT JOIN attendance att
        ON att.schedule_id = sch.id
       AND att.student_id = gs.student_id
      WHERE gs.student_id = :studentId
      ORDER BY sch.lesson_date DESC, sch.start_time DESC, sch.id DESC
    `,
    {
      replacements: { studentId },
      type: QueryTypes.SELECT,
    }
  );
}

async function loadStudentSubscriptions(studentId) {
  return sequelize.query(
    `
      SELECT
        sub.id,
        sub.lessons_total AS "lessonsTotal",
        sub.lessons_left AS "lessonsLeft",
        sub.start_date AS "startDate",
        sub.end_date AS "endDate",
        sub.status,
        CAST(sub.end_date - CURRENT_DATE AS INTEGER) AS "daysRemaining"
      FROM subscriptions sub
      WHERE sub.student_id = :studentId
      ORDER BY sub.start_date DESC, sub.id DESC
    `,
    {
      replacements: { studentId },
      type: QueryTypes.SELECT,
    }
  );
}

async function loadStudentAttendance(studentId) {
  return sequelize.query(
    `
      SELECT
        att.id,
        sch.lesson_date AS "lessonDate",
        TO_CHAR(sch.start_time, 'HH24:MI') AS "startTime",
        TO_CHAR(sch.end_time, 'HH24:MI') AS "endTime",
        sch.room,
        g.group_name AS "groupName",
        u.full_name AS "teacherName",
        att.attendance_status AS "attendanceStatus",
        att.marked_at AS "markedAt",
        sub.lessons_total AS "lessonsTotal",
        sub.lessons_left AS "lessonsLeft"
      FROM attendance att
      JOIN schedule sch ON sch.id = att.schedule_id
      JOIN groups g ON g.id = sch.group_id
      JOIN teachers t ON t.id = g.teacher_id
      JOIN users u ON u.id = t.user_id
      LEFT JOIN subscriptions sub ON sub.id = att.subscription_id
      WHERE att.student_id = :studentId
      ORDER BY sch.lesson_date DESC, sch.start_time DESC, att.marked_at DESC, att.id DESC
    `,
    {
      replacements: { studentId },
      type: QueryTypes.SELECT,
    }
  );
}

function buildStudentSummary(groups, schedule, subscriptions, attendance) {
  const today = new Date().toISOString().slice(0, 10);
  const activeSubscriptions = subscriptions.filter(
    (subscription) =>
      subscription.status === "active" &&
      subscription.startDate <= today &&
      subscription.endDate >= today
  );

  const nextLesson = [...schedule]
    .filter((lesson) => lesson.lessonDate >= today)
    .sort((left, right) => {
      const leftStamp = `${left.lessonDate}T${left.startTime}`;
      const rightStamp = `${right.lessonDate}T${right.startTime}`;
      return leftStamp.localeCompare(rightStamp);
    })[0];

  return {
    groupsCount: groups.length,
    scheduleCount: schedule.length,
    upcomingCount: schedule.filter((lesson) => lesson.lessonDate >= today).length,
    attendedCount: attendance.filter((item) => item.attendanceStatus === true).length,
    activeSubscriptionsCount: activeSubscriptions.length,
    lessonsLeftActive: activeSubscriptions.reduce(
      (total, subscription) => total + Number(subscription.lessonsLeft || 0),
      0
    ),
    nextLesson: nextLesson
      ? `${nextLesson.lessonDate} ${nextLesson.startTime} · ${nextLesson.groupName}`
      : null,
  };
}

function attachStudentRoutes(app) {
  app.get(
    "/api/student/bootstrap",
    withStudentAccess(async (_req, res, _user, profile) => {
      const [groups, schedule, subscriptions, attendance] = await Promise.all([
        loadStudentGroups(profile.id),
        loadStudentSchedule(profile.id),
        loadStudentSubscriptions(profile.id),
        loadStudentAttendance(profile.id),
      ]);

      return res.json({
        ok: true,
        profile,
        groups,
        schedule,
        subscriptions,
        attendance,
        summary: buildStudentSummary(groups, schedule, subscriptions, attendance),
      });
    })
  );
}

module.exports = {
  attachStudentRoutes,
};
