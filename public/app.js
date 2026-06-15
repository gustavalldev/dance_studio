const nodes = {
  authMessage: document.getElementById("auth-message"),
  adminMessage: document.getElementById("admin-message"),
  teacherMessage: document.getElementById("teacher-message"),
  studentMessage: document.getElementById("student-message"),
  loginForm: document.getElementById("login-form"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  dashboard: document.getElementById("dashboard"),
  adminWorkspace: document.getElementById("admin-workspace"),
  teacherWorkspace: document.getElementById("teacher-workspace"),
  studentWorkspace: document.getElementById("student-workspace"),
  currentUser: document.getElementById("current-user"),
  currentRole: document.getElementById("current-role"),
  moduleList: document.getElementById("module-list"),
  logoutButton: document.getElementById("logout-button"),
  teacherSummary: document.getElementById("teacher-summary"),
  teacherTodayLessonsList: document.getElementById("teacher-today-lessons-list"),
  teacherWeekDays: document.getElementById("teacher-week-days"),
  teacherWeekDayTitle: document.getElementById("teacher-week-day-title"),
  teacherWeekLessonsList: document.getElementById("teacher-week-lessons-list"),
  teacherWeekRange: document.getElementById("teacher-week-range"),
  teacherWeekPrev: document.getElementById("teacher-week-prev"),
  teacherWeekCurrent: document.getElementById("teacher-week-current"),
  teacherWeekNext: document.getElementById("teacher-week-next"),
  teacherLessonFocus: document.getElementById("teacher-lesson-focus"),
  teacherArchiveLessonsList: document.getElementById("teacher-archive-lessons-list"),
  studentSummary: document.getElementById("student-summary"),
  studentProfileCard: document.getElementById("student-profile-card"),
  studentGroupsList: document.getElementById("student-groups-list"),
  studentScheduleList: document.getElementById("student-schedule-list"),
  studentSubscriptionsList: document.getElementById("student-subscriptions-list"),
  studentAttendanceList: document.getElementById("student-attendance-list"),
  reportsSummary: document.getElementById("reports-summary"),
  attendanceReportList: document.getElementById("attendance-report-list"),
  subscriptionsReportList: document.getElementById("subscriptions-report-list"),
  scheduleReportList: document.getElementById("schedule-report-list"),
  groupForm: document.getElementById("group-form"),
  scheduleForm: document.getElementById("schedule-form"),
  subscriptionForm: document.getElementById("subscription-form"),
  studentsList: document.getElementById("students-list"),
  teachersList: document.getElementById("teachers-list"),
  groupsList: document.getElementById("groups-list"),
  scheduleList: document.getElementById("schedule-list"),
  subscriptionsList: document.getElementById("subscriptions-list"),
  groupTeacherId: document.getElementById("group-teacher-id"),
  groupStudentIds: document.getElementById("group-student-ids"),
  groupStudentSearch: document.getElementById("group-student-search"),
  groupSelectedStudents: document.getElementById("group-selected-students"),
  groupSelectedCount: document.getElementById("group-selected-count"),
  groupSelectedPanelCount: document.getElementById("group-selected-panel-count"),
  groupSelectedPreview: document.getElementById("group-selected-preview"),
  groupStudentOptions: document.getElementById("group-student-options"),
  groupStudentResultsMeta: document.getElementById("group-student-results-meta"),
  groupPickerPanel: document.getElementById("group-picker-panel"),
  toggleGroupPicker: document.getElementById("toggle-group-picker"),
  groupPickerToggleIcon: document.getElementById("group-picker-toggle-icon"),
  scheduleGroupId: document.getElementById("schedule-group-id"),
  subscriptionStudentId: document.getElementById("subscription-student-id"),
  resetStudentForm: document.getElementById("reset-student-form"),
  resetTeacherForm: document.getElementById("reset-teacher-form"),
  resetGroupForm: document.getElementById("reset-group-form"),
  clearGroupSelection: document.getElementById("clear-group-selection"),
  resetScheduleForm: document.getElementById("reset-schedule-form"),
  resetSubscriptionForm: document.getElementById("reset-subscription-form"),
  toggleSubscriptionForm: document.getElementById("toggle-subscription-form"),
  subscriptionFormPanel: document.getElementById("subscription-form-panel"),
  adminTabButtons: Array.from(document.querySelectorAll("[data-admin-tab]")),
  adminTabPanels: Array.from(document.querySelectorAll("[data-admin-tab-panel]")),
  operationsViewButtons: Array.from(document.querySelectorAll("[data-operations-view]")),
  operationsPanels: Array.from(document.querySelectorAll("[data-operations-panel]")),
  reportViewButtons: Array.from(document.querySelectorAll("[data-report-view]")),
  reportPanels: Array.from(document.querySelectorAll("[data-report-panel]")),
  teacherViewButtons: Array.from(document.querySelectorAll("[data-teacher-view]")),
  teacherPanels: Array.from(document.querySelectorAll("[data-teacher-panel]")),
  studentViewButtons: Array.from(document.querySelectorAll("[data-student-view]")),
  studentPanels: Array.from(document.querySelectorAll("[data-student-panel]")),
};

const pageName = document.body.dataset.page || "login";
const roleRoutes = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
};
const ADMIN_TAB_STORAGE_KEY = "dancestudio-admin-tab";

const state = {
  user: null,
  admin: {
    students: [],
    teachers: [],
    groups: [],
    schedule: [],
    subscriptions: [],
    reports: {
      attendance: [],
      subscriptions: [],
      schedule: [],
    },
    ui: {
      student: {
        expandedId: null,
        editingId: null,
        creating: false,
        focusNewest: false,
      },
      teacher: {
        expandedId: null,
        editingId: null,
        creating: false,
        focusNewest: false,
      },
      groupStudentSearch: "",
      groupPickerExpanded: false,
      operationsView: "subscriptions",
      reportView: "attendance",
      subscriptionFormExpanded: false,
    },
  },
  teacher: {
    lessons: [],
    ui: {
      view: "week",
      selectedLessonId: null,
      selectedWeekDay: null,
      weekOffset: 0,
    },
  },
  student: {
    profile: null,
    groups: [],
    schedule: [],
    subscriptions: [],
    attendance: [],
    summary: null,
    ui: {
      view: "overview",
    },
  },
};

function setMessage(node, message = "", tone = "neutral") {
  if (!node) {
    return;
  }

  node.textContent = message;
  node.style.color =
    tone === "error"
      ? "var(--danger)"
      : tone === "success"
        ? "var(--accent-strong)"
        : "var(--muted)";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatRole(role) {
  const labels = {
    admin: "Администратор",
    teacher: "Преподаватель",
    student: "Ученик",
  };

  return labels[role] || role;
}

function formatSubscriptionStatus(status) {
  const labels = {
    active: "Активен",
    completed: "Завершен",
    suspended: "Приостановлен",
  };

  return labels[status] || status;
}

function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey)
    .split("-")
    .map((value) => Number(value));

  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date, amount) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (normalized.getDay() + 6) % 7;
  return addDays(normalized, -shift);
}

function formatDateKey(dateKey, options) {
  return new Intl.DateTimeFormat("ru-RU", options).format(parseDateKey(dateKey));
}

function requiredRoleForPage() {
  if (pageName === "admin" || pageName === "teacher" || pageName === "student") {
    return pageName;
  }

  return null;
}

function redirectTo(path, replace = true) {
  if (window.location.pathname === path) {
    return;
  }

  if (replace) {
    window.location.replace(path);
    return;
  }

  window.location.assign(path);
}

function redirectToRolePage(role, replace = true) {
  redirectTo(roleRoutes[role] || "/", replace);
}

function readAdminTabPreference() {
  try {
    return window.localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveAdminTabPreference(tabName) {
  try {
    window.localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tabName);
  } catch {
    return;
  }
}

function setActiveAdminTab(tabName) {
  if (!nodes.adminTabButtons.length || !nodes.adminTabPanels.length) {
    return;
  }

  const availableTabs = new Set(
    nodes.adminTabButtons.map((button) => button.dataset.adminTab).filter(Boolean)
  );
  const resolvedTab = availableTabs.has(tabName) ? tabName : "directory";

  nodes.adminTabButtons.forEach((button) => {
    const isActive = button.dataset.adminTab === resolvedTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  nodes.adminTabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.adminTabPanel !== resolvedTab);
  });

  saveAdminTabPreference(resolvedTab);
}

function initializeAdminTabs() {
  if (!nodes.adminTabButtons.length || !nodes.adminTabPanels.length) {
    return;
  }

  setActiveAdminTab(readAdminTabPreference() || "directory");
}

function setOperationsView(viewName) {
  if (!nodes.operationsViewButtons.length || !nodes.operationsPanels.length) {
    return;
  }

  const availableViews = new Set(
    nodes.operationsViewButtons.map((button) => button.dataset.operationsView).filter(Boolean)
  );
  const resolvedView = availableViews.has(viewName) ? viewName : "subscriptions";

  state.admin.ui.operationsView = resolvedView;

  nodes.operationsViewButtons.forEach((button) => {
    const isActive = button.dataset.operationsView === resolvedView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  nodes.operationsPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.operationsPanel !== resolvedView);
  });
}

function setReportView(viewName) {
  if (!nodes.reportViewButtons.length || !nodes.reportPanels.length) {
    return;
  }

  const availableViews = new Set(
    nodes.reportViewButtons.map((button) => button.dataset.reportView).filter(Boolean)
  );
  const resolvedView = availableViews.has(viewName) ? viewName : "attendance";

  state.admin.ui.reportView = resolvedView;

  nodes.reportViewButtons.forEach((button) => {
    const isActive = button.dataset.reportView === resolvedView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  nodes.reportPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.reportPanel !== resolvedView);
  });
}

function setSubscriptionFormExpanded(expanded) {
  state.admin.ui.subscriptionFormExpanded = expanded;

  if (!nodes.subscriptionFormPanel || !nodes.toggleSubscriptionForm) {
    return;
  }

  nodes.subscriptionFormPanel.classList.toggle("hidden", !expanded);
  nodes.toggleSubscriptionForm.textContent = expanded ? "Скрыть форму" : "Показать форму";
}

function setTeacherView(viewName) {
  if (!nodes.teacherViewButtons.length || !nodes.teacherPanels.length) {
    return;
  }

  const availableViews = new Set(
    nodes.teacherViewButtons.map((button) => button.dataset.teacherView).filter(Boolean)
  );
  const resolvedView = availableViews.has(viewName) ? viewName : "week";

  state.teacher.ui.view = resolvedView;
  syncTeacherLessonSelection(resolvedView);

  nodes.teacherViewButtons.forEach((button) => {
    const isActive = button.dataset.teacherView === resolvedView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  nodes.teacherPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.teacherPanel !== resolvedView);
  });

  renderTeacherFocus();
}

function setStudentView(viewName) {
  if (!nodes.studentViewButtons.length || !nodes.studentPanels.length) {
    return;
  }

  const availableViews = new Set(
    nodes.studentViewButtons.map((button) => button.dataset.studentView).filter(Boolean)
  );
  const resolvedView = availableViews.has(viewName) ? viewName : "overview";

  state.student.ui.view = resolvedView;

  nodes.studentViewButtons.forEach((button) => {
    const isActive = button.dataset.studentView === resolvedView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  nodes.studentPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.studentPanel !== resolvedView);
  });
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {
        ok: false,
        error: "Сервер вернул неожиданный ответ.",
      };
    }
  }

  return { response, payload };
}

function collectSelectedValues(selectNode) {
  return Array.from(selectNode.selectedOptions).map((option) => option.value);
}

function setSelectedValues(selectNode, values) {
  const selected = new Set(values.map((value) => String(value)));
  Array.from(selectNode.options).forEach((option) => {
    option.selected = selected.has(option.value);
  });
}

function setSingleSelectOptions(selectNode, items, placeholder) {
  const currentValue = selectNode.value;
  selectNode.innerHTML = "";

  if (placeholder) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    selectNode.appendChild(option);
  }

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.value);
    option.textContent = item.label;
    selectNode.appendChild(option);
  });

  if (items.some((item) => String(item.value) === String(currentValue))) {
    selectNode.value = String(currentValue);
  }
}

function setMultiSelectOptions(selectNode, items) {
  const currentValues = collectSelectedValues(selectNode);
  selectNode.innerHTML = "";

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.value);
    option.textContent = item.label;
    selectNode.appendChild(option);
  });

  setSelectedValues(selectNode, currentValues);
}

function summaryCardsMarkup(items) {
  return items
    .map(
      (item) => `
        <article class="summary-card">
          <span class="label">${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          ${item.hint ? `<span class="summary-hint">${escapeHtml(item.hint)}</span>` : ""}
        </article>
      `
    )
    .join("");
}

function badgeClassBySubscriptionStatus(status) {
  if (status === "active") {
    return "badge badge-success";
  }

  if (status === "suspended") {
    return "badge badge-warning";
  }

  return "badge badge-muted";
}

function isActiveSubscriptionStatus(status) {
  return status === "active";
}

function subscriptionControlText(subscription) {
  if (!isActiveSubscriptionStatus(subscription.status)) {
    return "Неактивен";
  }

  return Number(subscription.lessonsLeft) <= 2 ? "Низкий остаток" : "Под контролем";
}

function formatDaysRemaining(value) {
  const days = Number(value);

  if (!Number.isFinite(days)) {
    return "—";
  }

  if (days < 0) {
    return `истек ${Math.abs(days)} дн. назад`;
  }

  if (days === 0) {
    return "сегодня";
  }

  return `${days} дн.`;
}

function tableCellMarkup(cell) {
  if (cell && typeof cell === "object") {
    const className = cell.className ? ` class="${escapeHtml(cell.className)}"` : "";
    return `<td${className}>${cell.html}</td>`;
  }

  return `<td>${escapeHtml(cell)}</td>`;
}

function renderDataTable(headers, rows, options = {}) {
  if (!rows.length) {
    return emptyState(options.emptyMessage || "Данных пока нет.");
  }

  const caption = options.caption
    ? `<caption>${escapeHtml(options.caption)}</caption>`
    : "";

  return `
    <div class="data-table-shell">
      <table class="data-table">
        ${caption}
        <thead>
          <tr>
            ${headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  ${row.map((cell) => tableCellMarkup(cell)).join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function hideRoleWorkspaces() {
  nodes.adminWorkspace?.classList.add("hidden");
  nodes.teacherWorkspace?.classList.add("hidden");
  nodes.studentWorkspace?.classList.add("hidden");
}

function renderDashboard(payload) {
  state.user = payload.user;

  if (nodes.currentUser) {
    nodes.currentUser.textContent = payload.user.fullName;
  }

  if (nodes.currentRole) {
    nodes.currentRole.textContent = formatRole(payload.user.role);
  }

  if (nodes.moduleList) {
    nodes.moduleList.innerHTML = "";

    payload.modules.forEach((moduleName) => {
      const card = document.createElement("article");
      card.className = "module-card";
      card.textContent = moduleName;
      nodes.moduleList.appendChild(card);
    });
  }

  if (nodes.dashboard) {
    nodes.dashboard.classList.remove("hidden");
  }
}

async function loadDashboard() {
  const { response, payload } = await apiRequest("/api/dashboard");

  if (!response.ok) {
    nodes.dashboard?.classList.add("hidden");
    return null;
  }

  renderDashboard(payload);
  return payload;
}

async function loadRoleWorkspace(role) {
  hideRoleWorkspaces();
  setMessage(nodes.adminMessage);
  setMessage(nodes.teacherMessage);
  setMessage(nodes.studentMessage);

  if (role === "admin") {
    await loadAdminWorkspace();
    return;
  }

  if (role === "teacher") {
    await loadTeacherWorkspace();
    return;
  }

  if (role === "student") {
    await loadStudentWorkspace();
  }
}

async function initializePage() {
  const requiredRole = requiredRoleForPage();
  const { response, payload } = await apiRequest("/api/auth/me");

  if (!response.ok) {
    if (requiredRole) {
      redirectTo("/");
    }
    return;
  }

  state.user = payload.user;

  if (!requiredRole) {
    redirectToRolePage(payload.user.role);
    return;
  }

  if (payload.user.role !== requiredRole) {
    redirectToRolePage(payload.user.role);
    return;
  }

  const dashboard = await loadDashboard();

  if (!dashboard) {
    redirectTo("/");
    return;
  }

  await loadRoleWorkspace(requiredRole);
}

async function login(event) {
  event.preventDefault();
  setMessage(nodes.authMessage, "Выполняется вход...");

  const { response, payload } = await apiRequest("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: nodes.email.value,
      password: nodes.password.value,
    }),
  });

  if (!response.ok) {
    setMessage(nodes.authMessage, payload.error || "Не удалось выполнить вход.", "error");
    nodes.dashboard?.classList.add("hidden");
    hideRoleWorkspaces();
    return;
  }

  redirectToRolePage(payload.user.role, false);
}

async function logout() {
  await apiRequest("/api/auth/logout", { method: "POST" });
  nodes.dashboard?.classList.add("hidden");
  hideRoleWorkspaces();
  state.user = null;
  setMessage(nodes.authMessage, "Вы вышли из системы.");
  setMessage(nodes.adminMessage);
  setMessage(nodes.teacherMessage);
  setMessage(nodes.studentMessage);
  redirectTo("/");
}

function populateTeacherSelect() {
  setSingleSelectOptions(
    nodes.groupTeacherId,
    state.admin.teachers.map((teacher) => ({
      value: teacher.id,
      label: teacher.fullName,
    })),
    "Выберите преподавателя"
  );
}

function populateGroupSelect() {
  setSingleSelectOptions(
    nodes.scheduleGroupId,
    state.admin.groups.map((group) => ({
      value: group.id,
      label: group.groupName,
    })),
    "Выберите группу"
  );
}

function populateStudentSelects() {
  const studentItems = state.admin.students.map((student) => ({
    value: student.id,
    label: `${student.fullName} (${student.email})`,
  }));

  setMultiSelectOptions(nodes.groupStudentIds, studentItems);
  setSingleSelectOptions(nodes.subscriptionStudentId, studentItems, "Выберите ученика");
  renderGroupStudentPicker();
}

function formatOptionalValue(value, fallback = "—") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function pluralizeRu(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }

  return many;
}

function getDirectoryUi(entity) {
  return state.admin.ui[entity];
}

function normalizeDirectoryUiState(entity, items) {
  const ui = getDirectoryUi(entity);

  if (ui.focusNewest) {
    ui.expandedId = items[0] ? String(items[0].id) : null;
    ui.editingId = null;
    ui.creating = false;
    ui.focusNewest = false;
  }

  if (ui.creating) {
    ui.expandedId = "new";
    ui.editingId = "new";
    return;
  }

  if (ui.expandedId === "new") {
    ui.expandedId = null;
  }

  if (ui.editingId === "new") {
    ui.editingId = null;
  }

  if (ui.expandedId && !findById(items, ui.expandedId)) {
    ui.expandedId = null;
  }

  if (ui.editingId && !findById(items, ui.editingId)) {
    ui.editingId = null;
  }

  if (ui.editingId) {
    ui.expandedId = ui.editingId;
  }
}

function getStudentGroups(studentId) {
  return state.admin.groups.filter((group) =>
    (group.studentIds || []).some((id) => String(id) === String(studentId))
  );
}

function getStudentSubscriptions(studentId) {
  return state.admin.subscriptions.filter(
    (subscription) => String(subscription.studentId) === String(studentId)
  );
}

function getTeacherGroups(teacherId) {
  return state.admin.groups.filter((group) => String(group.teacherId) === String(teacherId));
}

function getTeacherSchedule(teacherId) {
  const teacherGroupIds = new Set(
    getTeacherGroups(teacherId).map((group) => String(group.id))
  );

  return state.admin.schedule.filter((item) => teacherGroupIds.has(String(item.groupId)));
}

function selectedGroupStudentIds() {
  return collectSelectedValues(nodes.groupStudentIds);
}

function sortByFullName(items) {
  return [...items].sort((left, right) => left.fullName.localeCompare(right.fullName, "ru"));
}

function groupStudentSearchQuery() {
  return state.admin.ui.groupStudentSearch.trim().toLowerCase();
}

function matchesStudentSearch(student, query) {
  if (!query) {
    return true;
  }

  return [student.fullName, student.email, student.phone]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function selectedGroupStudents() {
  const selectedIds = new Set(selectedGroupStudentIds());
  return sortByFullName(
    state.admin.students.filter((student) => selectedIds.has(String(student.id)))
  );
}

function setGroupStudents(values) {
  setSelectedValues(nodes.groupStudentIds, values);
  renderGroupStudentPicker();
}

function toggleGroupStudentSelection(studentId) {
  const currentIds = new Set(selectedGroupStudentIds());
  const resolvedId = String(studentId);

  if (currentIds.has(resolvedId)) {
    currentIds.delete(resolvedId);
  } else {
    currentIds.add(resolvedId);
  }

  setGroupStudents([...currentIds]);
}

function clearGroupStudentSelection() {
  setGroupStudents([]);
}

function groupSelectedPreviewText(selectedStudents) {
  if (!selectedStudents.length) {
    return "Состав пока не заполнен.";
  }

  const names = selectedStudents.slice(0, 3).map((student) => student.fullName);

  if (selectedStudents.length <= 3) {
    return names.join(", ");
  }

  return `${names.join(", ")} и еще ${selectedStudents.length - 3}`;
}

function setGroupPickerExpanded(expanded) {
  state.admin.ui.groupPickerExpanded = expanded;

  if (!nodes.groupPickerPanel || !nodes.toggleGroupPicker || !nodes.groupPickerToggleIcon) {
    return;
  }

  nodes.groupPickerPanel.classList.toggle("hidden", !expanded);
  nodes.toggleGroupPicker.setAttribute("aria-expanded", expanded ? "true" : "false");
  nodes.groupPickerToggleIcon.textContent = expanded ? "−" : "+";
}

function renderGroupStudentPicker() {
  if (
    !nodes.groupStudentIds ||
    !nodes.groupStudentSearch ||
    !nodes.groupSelectedStudents ||
    !nodes.groupSelectedCount ||
    !nodes.groupSelectedPanelCount ||
    !nodes.groupSelectedPreview ||
    !nodes.groupStudentOptions ||
    !nodes.groupStudentResultsMeta ||
    !nodes.groupPickerPanel
  ) {
    return;
  }

  const selectedStudents = selectedGroupStudents();
  const selectedIds = new Set(selectedStudents.map((student) => String(student.id)));
  const query = groupStudentSearchQuery();
  const matchingStudents = sortByFullName(
    state.admin.students.filter(
      (student) => !selectedIds.has(String(student.id)) && matchesStudentSearch(student, query)
    )
  );
  const visibleStudents = matchingStudents.slice(0, 40);
  const hiddenCount = matchingStudents.length - visibleStudents.length;

  nodes.groupSelectedCount.textContent = `${selectedStudents.length} ${pluralizeRu(
    selectedStudents.length,
    "ученик",
    "ученика",
    "учеников"
  )}`;
  nodes.groupSelectedPanelCount.textContent = nodes.groupSelectedCount.textContent;
  nodes.groupSelectedPreview.textContent = groupSelectedPreviewText(selectedStudents);
  nodes.groupStudentSearch.value = state.admin.ui.groupStudentSearch;
  nodes.groupStudentResultsMeta.textContent = query
    ? `Найдено ${matchingStudents.length}`
    : `Всего доступно ${matchingStudents.length}`;
  setGroupPickerExpanded(state.admin.ui.groupPickerExpanded);

  nodes.groupSelectedStudents.innerHTML = selectedStudents.length
    ? selectedStudents
        .map(
          (student) => `
            <button
              type="button"
              class="group-selection-chip"
              data-action="remove-group-student"
              data-student-id="${escapeHtml(student.id)}"
            >
              <span>${escapeHtml(student.fullName)}</span>
              <span class="group-selection-chip-remove" aria-hidden="true">×</span>
            </button>
          `
        )
        .join("")
    : `<p class="group-picker-empty">Пока никто не выбран.</p>`;

  if (!visibleStudents.length) {
    nodes.groupStudentOptions.innerHTML = `<p class="group-picker-empty">${
      query ? "По запросу никто не найден." : "Все ученики уже добавлены в состав."
    }</p>`;
    return;
  }

  nodes.groupStudentOptions.innerHTML = `
    ${visibleStudents
      .map(
        (student) => `
          <button
            type="button"
            class="group-student-option"
            data-action="toggle-group-student"
            data-student-id="${escapeHtml(student.id)}"
          >
            <strong>${escapeHtml(student.fullName)}</strong>
            <span>${escapeHtml(student.email)}</span>
          </button>
        `
      )
      .join("")}
    ${
      hiddenCount > 0
        ? `<p class="group-picker-meta group-picker-meta-note">Показано 40 из ${matchingStudents.length}. Уточните поиск.</p>`
        : ""
    }
  `;
}

function nextUpcomingLesson(scheduleItems) {
  return [...scheduleItems]
    .filter((item) => item.lessonDate >= todayKey())
    .sort((left, right) =>
      `${left.lessonDate} ${left.startTime}`.localeCompare(
        `${right.lessonDate} ${right.startTime}`
      )
    )[0];
}

function directoryTagsMarkup(tags) {
  if (!tags.length) {
    return "";
  }

  return `
    <div class="directory-tags">
      ${tags
        .map((tag) => `<span class="directory-tag">${escapeHtml(tag)}</span>`)
        .join("")}
    </div>
  `;
}

function directoryFactsMarkup(facts) {
  return `
    <div class="directory-facts">
      ${facts
        .map(
          (fact) => `
            <div class="directory-fact${fact.wide ? " directory-fact-wide" : ""}">
              <span class="label">${escapeHtml(fact.label)}</span>
              <strong>${escapeHtml(formatOptionalValue(fact.value))}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function directoryTokenSectionMarkup(title, items, emptyText) {
  return `
    <section class="directory-section">
      <span class="label">${escapeHtml(title)}</span>
      ${
        items.length
          ? `<div class="directory-token-list">${items
              .map((item) => `<span class="directory-token">${escapeHtml(item)}</span>`)
              .join("")}</div>`
          : `<p class="directory-note">${escapeHtml(emptyText)}</p>`
      }
    </section>
  `;
}

function directoryRowsSectionMarkup(title, items, emptyText) {
  return `
    <section class="directory-section">
      <span class="label">${escapeHtml(title)}</span>
      ${
        items.length
          ? `<div class="directory-row-list">${items
              .map(
                (item) => `
                  <div class="directory-row">
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml(item.subtitle)}</span>
                  </div>
                `
              )
              .join("")}</div>`
          : `<p class="directory-note">${escapeHtml(emptyText)}</p>`
      }
    </section>
  `;
}

function directoryFormActionsMarkup(entity, submitLabel, id = "") {
  return `
    <div class="directory-form-actions">
      <button type="submit" class="primary-button">${escapeHtml(submitLabel)}</button>
      <button
        type="button"
        class="secondary-button"
        data-action="cancel"
        data-entity="${escapeHtml(entity)}"
        data-id="${escapeHtml(id)}"
      >
        Отменить
      </button>
    </div>
  `;
}

function renderStudentForm(student = null) {
  const id = student ? String(student.id) : "";

  return `
    <form class="entity-form directory-form" data-directory-form="student" data-id="${escapeHtml(id)}">
      <div class="field-grid">
        <label class="field">
          <span>ФИО</span>
          <input name="fullName" type="text" value="${escapeHtml(student?.fullName || "")}" required />
        </label>
        <label class="field">
          <span>Email</span>
          <input name="email" type="email" value="${escapeHtml(student?.email || "")}" required />
        </label>
        <label class="field">
          <span>Пароль</span>
          <input
            name="password"
            type="text"
            ${student ? "" : "required"}
            placeholder="${escapeHtml(
              student ? "Оставьте пустым, если менять не нужно" : "Обязателен при создании"
            )}"
          />
        </label>
        <label class="field">
          <span>Телефон</span>
          <input name="phone" type="text" value="${escapeHtml(student?.phone || "")}" />
        </label>
        <label class="field">
          <span>Дата рождения</span>
          <input
            name="birthDate"
            type="date"
            value="${escapeHtml(student?.birthDate || "")}"
          />
        </label>
        <label class="field">
          <span>Дата регистрации</span>
          <input
            name="registrationDate"
            type="date"
            value="${escapeHtml(student?.registrationDate || "")}"
          />
        </label>
      </div>
      ${directoryFormActionsMarkup("student", student ? "Сохранить изменения" : "Создать ученика", id)}
    </form>
  `;
}

function renderTeacherForm(teacher = null) {
  const id = teacher ? String(teacher.id) : "";

  return `
    <form class="entity-form directory-form" data-directory-form="teacher" data-id="${escapeHtml(id)}">
      <div class="field-grid">
        <label class="field">
          <span>ФИО</span>
          <input name="fullName" type="text" value="${escapeHtml(teacher?.fullName || "")}" required />
        </label>
        <label class="field">
          <span>Email</span>
          <input name="email" type="email" value="${escapeHtml(teacher?.email || "")}" required />
        </label>
        <label class="field">
          <span>Пароль</span>
          <input
            name="password"
            type="text"
            ${teacher ? "" : "required"}
            placeholder="${escapeHtml(
              teacher ? "Оставьте пустым, если менять не нужно" : "Обязателен при создании"
            )}"
          />
        </label>
        <label class="field">
          <span>Специализация</span>
          <input
            name="specialization"
            type="text"
            value="${escapeHtml(teacher?.specialization || "")}"
          />
        </label>
        <label class="field">
          <span>Дата приема</span>
          <input name="hireDate" type="date" value="${escapeHtml(teacher?.hireDate || "")}" />
        </label>
      </div>
      ${directoryFormActionsMarkup(
        "teacher",
        teacher ? "Сохранить изменения" : "Создать преподавателя",
        id
      )}
    </form>
  `;
}

function renderStudentDetails(student) {
  const groups = getStudentGroups(student.id);
  const subscriptions = getStudentSubscriptions(student.id);
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "active"
  );

  return `
    <div class="directory-details">
      ${directoryFactsMarkup([
        { label: "Телефон", value: student.phone },
        { label: "Дата рождения", value: student.birthDate },
        { label: "Дата регистрации", value: student.registrationDate },
        {
          label: "Активные абонементы",
          value: activeSubscriptions.length
            ? `${activeSubscriptions.length} ${pluralizeRu(
                activeSubscriptions.length,
                "активный",
                "активных",
                "активных"
              )}`
            : "Нет",
        },
      ])}
      <div class="directory-sections">
        ${directoryTokenSectionMarkup(
          "Группы",
          groups.map((group) =>
            [group.groupName, group.level].filter(Boolean).join(" • ")
          ),
          "Ученик пока не добавлен в группы."
        )}
        ${directoryRowsSectionMarkup(
          "Абонементы",
          subscriptions.map((subscription) => ({
            title: `${formatSubscriptionStatus(subscription.status)} • ${subscription.lessonsLeft}/${subscription.lessonsTotal}`,
            subtitle: `${formatOptionalValue(subscription.startDate)} - ${formatOptionalValue(subscription.endDate)}`,
          })),
          "У ученика пока нет абонементов."
        )}
      </div>
      <div class="entity-actions directory-actions">
        <button
          class="small-button edit"
          data-entity="student"
          data-action="edit"
          data-id="${escapeHtml(student.id)}"
          type="button"
        >
          Редактировать
        </button>
        <button
          class="small-button delete"
          data-entity="student"
          data-action="delete"
          data-id="${escapeHtml(student.id)}"
          type="button"
        >
          Удалить
        </button>
      </div>
    </div>
  `;
}

function renderTeacherDetails(teacher) {
  const groups = getTeacherGroups(teacher.id);
  const schedule = getTeacherSchedule(teacher.id);
  const nextLesson = nextUpcomingLesson(schedule);

  return `
    <div class="directory-details">
      ${directoryFactsMarkup([
        { label: "Специализация", value: teacher.specialization },
        { label: "Дата приема", value: teacher.hireDate },
        {
          label: "Группы",
          value: groups.length
            ? `${groups.length} ${pluralizeRu(groups.length, "группа", "группы", "групп")}`
            : "Нет",
        },
        {
          label: "Ближайшее занятие",
          value: nextLesson
            ? `${nextLesson.lessonDate} • ${nextLesson.startTime}`
            : "Не запланировано",
        },
      ])}
      <div class="directory-sections">
        ${directoryTokenSectionMarkup(
          "Группы",
          groups.map((group) =>
            [group.groupName, group.level, group.ageCategory].filter(Boolean).join(" • ")
          ),
          "Преподаватель пока не привязан к группам."
        )}
        ${directoryRowsSectionMarkup(
          "Ближайшие занятия",
          schedule
            .filter((item) => item.lessonDate >= todayKey())
            .sort((left, right) =>
              `${left.lessonDate} ${left.startTime}`.localeCompare(
                `${right.lessonDate} ${right.startTime}`
              )
            )
            .slice(0, 4)
            .map((item) => ({
              title: `${item.groupName} • ${item.lessonDate}`,
              subtitle: `${item.startTime} - ${item.endTime} • ${formatOptionalValue(item.room)}`,
            })),
          "Ближайших занятий пока нет."
        )}
      </div>
      <div class="entity-actions directory-actions">
        <button
          class="small-button edit"
          data-entity="teacher"
          data-action="edit"
          data-id="${escapeHtml(teacher.id)}"
          type="button"
        >
          Редактировать
        </button>
        <button
          class="small-button delete"
          data-entity="teacher"
          data-action="delete"
          data-id="${escapeHtml(teacher.id)}"
          type="button"
        >
          Удалить
        </button>
      </div>
    </div>
  `;
}

function renderDirectoryCreateCard(title, formMarkup) {
  return `
    <article class="directory-item is-expanded is-editing is-new">
      <div class="directory-static-header">
        <div class="directory-avatar">${escapeHtml(title.slice(0, 1))}</div>
        <div class="directory-primary">
          <strong>${escapeHtml(title)}</strong>
          <span>Новая запись откроется сразу в рабочем состоянии.</span>
        </div>
      </div>
      ${formMarkup}
    </article>
  `;
}

function renderStudents() {
  const ui = getDirectoryUi("student");
  const cards = [];

  if (ui.creating) {
    cards.push(renderDirectoryCreateCard("Новый ученик", renderStudentForm()));
  }

  cards.push(
    ...state.admin.students.map((student) => {
      const groups = getStudentGroups(student.id);
      const subscriptions = getStudentSubscriptions(student.id);
      const activeSubscriptions = subscriptions.filter(
        (subscription) => subscription.status === "active"
      );
      const isExpanded = ui.expandedId === String(student.id);
      const isEditing = ui.editingId === String(student.id);

      return `
        <article class="directory-item${isExpanded ? " is-expanded" : ""}${isEditing ? " is-editing" : ""}">
          <button
            class="directory-summary"
            type="button"
            data-action="toggle"
            data-entity="student"
            data-id="${escapeHtml(student.id)}"
            aria-expanded="${isExpanded ? "true" : "false"}"
          >
            <span class="directory-avatar">${escapeHtml(
              student.fullName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") || "У"
            )}</span>
            <span class="directory-primary">
              <strong>${escapeHtml(student.fullName)}</strong>
              <span>${escapeHtml(student.email)}</span>
            </span>
            ${directoryTagsMarkup([
              groups.length
                ? `${groups.length} ${pluralizeRu(groups.length, "группа", "группы", "групп")}`
                : "Без групп",
              activeSubscriptions.length
                ? `${activeSubscriptions.length} активн. абонем.`
                : subscriptions.length
                  ? "Нет активных абонементов"
                  : "Без абонемента",
              student.phone || `Регистрация: ${formatOptionalValue(student.registrationDate)}`,
            ])}
            <span class="directory-chevron" aria-hidden="true">${
              isExpanded ? "−" : "+"
            }</span>
          </button>
          ${isExpanded ? (isEditing ? renderStudentForm(student) : renderStudentDetails(student)) : ""}
        </article>
      `;
    })
  );

  if (!cards.length) {
    nodes.studentsList.innerHTML = emptyState("Пока нет учеников. Создайте первую запись.");
    return;
  }

  nodes.studentsList.innerHTML = cards.join("");
}

function renderTeachers() {
  const ui = getDirectoryUi("teacher");
  const cards = [];

  if (ui.creating) {
    cards.push(renderDirectoryCreateCard("Новый преподаватель", renderTeacherForm()));
  }

  cards.push(
    ...state.admin.teachers.map((teacher) => {
      const groups = getTeacherGroups(teacher.id);
      const upcomingLessons = getTeacherSchedule(teacher.id).filter(
        (item) => item.lessonDate >= todayKey()
      );
      const isExpanded = ui.expandedId === String(teacher.id);
      const isEditing = ui.editingId === String(teacher.id);

      return `
        <article class="directory-item${isExpanded ? " is-expanded" : ""}${isEditing ? " is-editing" : ""}">
          <button
            class="directory-summary"
            type="button"
            data-action="toggle"
            data-entity="teacher"
            data-id="${escapeHtml(teacher.id)}"
            aria-expanded="${isExpanded ? "true" : "false"}"
          >
            <span class="directory-avatar">${escapeHtml(
              teacher.fullName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("") || "П"
            )}</span>
            <span class="directory-primary">
              <strong>${escapeHtml(teacher.fullName)}</strong>
              <span>${escapeHtml(teacher.email)}</span>
            </span>
            ${directoryTagsMarkup([
              teacher.specialization || "Без специализации",
              groups.length
                ? `${groups.length} ${pluralizeRu(groups.length, "группа", "группы", "групп")}`
                : "Без групп",
              upcomingLessons.length
                ? `${upcomingLessons.length} ближайш. занятий`
                : "Нет ближайших занятий",
            ])}
            <span class="directory-chevron" aria-hidden="true">${
              isExpanded ? "−" : "+"
            }</span>
          </button>
          ${isExpanded ? (isEditing ? renderTeacherForm(teacher) : renderTeacherDetails(teacher)) : ""}
        </article>
      `;
    })
  );

  if (!cards.length) {
    nodes.teachersList.innerHTML = emptyState("Пока нет преподавателей. Создайте первую запись.");
    return;
  }

  nodes.teachersList.innerHTML = cards.join("");
}

function renderGroups() {
  if (!state.admin.groups.length) {
    nodes.groupsList.innerHTML = emptyState("Пока нет групп. Создайте первую запись.");
    return;
  }

  nodes.groupsList.innerHTML = state.admin.groups
    .map((group) => {
      const members = group.students || [];
      const summaryTokens = [
        group.level || null,
        group.ageCategory || null,
        members.length
          ? `${members.length} ${pluralizeRu(members.length, "ученик", "ученика", "учеников")}`
          : "Состав не заполнен",
      ].filter(Boolean);

      return `
        <article class="entity-card group-card">
          <div class="entity-card-header">
            <div>
              <strong>${escapeHtml(group.groupName)}</strong>
              <span>${escapeHtml(group.teacherName)}</span>
            </div>
            <div class="entity-actions">
              <button class="small-button edit" data-entity="group" data-action="edit" data-id="${escapeHtml(group.id)}" type="button">Редактировать</button>
              <button class="small-button delete" data-entity="group" data-action="delete" data-id="${escapeHtml(group.id)}" type="button">Удалить</button>
            </div>
          </div>
          <div class="group-card-summary">
            ${summaryTokens
              .map((token) => `<span class="directory-token">${escapeHtml(token)}</span>`)
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSchedule() {
  if (!state.admin.schedule.length) {
    nodes.scheduleList.innerHTML = emptyState("Пока нет занятий в расписании.");
    return;
  }

  nodes.scheduleList.innerHTML = state.admin.schedule
    .map(
      (item) => `
        <article class="entity-card">
          <div class="entity-card-header">
            <div>
              <strong>${escapeHtml(item.groupName)}</strong>
              <span>${escapeHtml(item.lessonDate)}</span>
            </div>
            <div class="entity-actions">
              <button class="small-button edit" data-entity="schedule" data-action="edit" data-id="${escapeHtml(item.id)}" type="button">Редактировать</button>
              <button class="small-button delete" data-entity="schedule" data-action="delete" data-id="${escapeHtml(item.id)}" type="button">Удалить</button>
            </div>
          </div>
          <div class="entity-meta">
            <div><span class="label">Время</span><strong>${escapeHtml(`${item.startTime} - ${item.endTime}`)}</strong></div>
            <div><span class="label">Зал</span><strong>${escapeHtml(item.room)}</strong></div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderSubscriptions() {
  if (!state.admin.subscriptions.length) {
    nodes.subscriptionsList.innerHTML = emptyState("Пока нет абонементов.");
    return;
  }

  const renderSubscriptionRows = (subscriptions) =>
    subscriptions.map((subscription) => [
      subscription.studentName,
      `${formatOptionalValue(subscription.startDate)} - ${formatOptionalValue(subscription.endDate)}`,
      `${subscription.lessonsLeft}/${subscription.lessonsTotal}`,
      {
        html: `<span class="${badgeClassBySubscriptionStatus(subscription.status)}">${escapeHtml(
          formatSubscriptionStatus(subscription.status)
        )}</span>`,
      },
      subscriptionControlText(subscription),
      {
        className: "data-table-actions",
        html: `
          <button class="small-button edit" data-entity="subscription" data-action="edit" data-id="${escapeHtml(
            subscription.id
          )}" type="button">Редактировать</button>
          <button class="small-button delete" data-entity="subscription" data-action="delete" data-id="${escapeHtml(
            subscription.id
          )}" type="button">Удалить</button>
        `,
      },
    ]);

  const sections = [
    {
      title: "Активные абонементы",
      hint: "Доступны для отметки посещаемости и списания занятий.",
      items: state.admin.subscriptions.filter((subscription) =>
        isActiveSubscriptionStatus(subscription.status)
      ),
      emptyMessage: "Активных абонементов пока нет.",
    },
    {
      title: "Неактивные абонементы",
      hint: "Завершенные и приостановленные записи без текущего доступа к занятиям.",
      items: state.admin.subscriptions.filter(
        (subscription) => !isActiveSubscriptionStatus(subscription.status)
      ),
      emptyMessage: "Неактивных абонементов пока нет.",
    },
  ];

  nodes.subscriptionsList.innerHTML = sections
    .map(
      (section) => `
        <section class="subscription-status-section">
          <div class="section-heading-row">
            <div>
              <span class="label">${escapeHtml(section.title)}</span>
              <p>${escapeHtml(section.hint)}</p>
            </div>
            <strong>${escapeHtml(section.items.length)}</strong>
          </div>
          ${renderDataTable(
            ["Ученик", "Период", "Остаток", "Статус", "Контроль", "Действия"],
            renderSubscriptionRows(section.items),
            { emptyMessage: section.emptyMessage }
          )}
        </section>
      `
    )
    .join("");
}

function renderReportsSummary() {
  const today = todayKey();
  const attendance = state.admin.reports.attendance;
  const subscriptions = state.admin.reports.subscriptions;
  const schedule = state.admin.reports.schedule;

  nodes.reportsSummary.innerHTML = summaryCardsMarkup([
    {
      label: "Журнал посещаемости",
      value: attendance.length,
      hint: "отмеченных записей",
    },
    {
      label: "Активные абонементы",
      value: subscriptions.filter((item) => item.status === "active").length,
      hint: "по всем ученикам",
    },
    {
      label: "Предстоящие занятия",
      value: schedule.filter((item) => item.lessonDate >= today).length,
      hint: "в расписании",
    },
    {
      label: "Нужен контроль",
      value: subscriptions.filter(
        (item) => item.status === "active" && Number(item.lessonsLeft) <= 2
      ).length,
      hint: "абонементов с остатком 2 и меньше",
    },
  ]);
}

function renderAttendanceReport() {
  if (!state.admin.reports.attendance.length) {
    nodes.attendanceReportList.innerHTML = emptyState(
      "Отмеченные посещения появятся после работы преподавателя."
    );
    return;
  }

  nodes.attendanceReportList.innerHTML = renderDataTable(
    ["Дата", "Ученик", "Группа", "Время", "Статус", "Преподаватель", "Абонемент", "Отмечено"],
    state.admin.reports.attendance.map((item) => {
      const badgeClass = item.attendanceStatus ? "badge badge-success" : "badge badge-muted";
      const badgeText = item.attendanceStatus ? "Присутствовал" : "Отсутствовал";
      const subscriptionText =
        item.lessonsTotal && item.lessonsLeft !== null
          ? `${item.lessonsLeft}/${item.lessonsTotal}`
          : "Без списания";

      return [
        item.lessonDate,
        item.studentName,
        item.groupName,
        `${item.startTime} - ${item.endTime}`,
        {
          html: `<span class="${badgeClass}">${escapeHtml(badgeText)}</span>`,
        },
        item.teacherName,
        subscriptionText,
        item.markedAt,
      ];
    })
  );
}

function renderSubscriptionReport() {
  if (!state.admin.reports.subscriptions.length) {
    nodes.subscriptionsReportList.innerHTML = emptyState("Отчет по абонементам пока пуст.");
    return;
  }

  const activeCount = state.admin.reports.subscriptions.filter((item) =>
    isActiveSubscriptionStatus(item.status)
  ).length;
  const inactiveCount = state.admin.reports.subscriptions.length - activeCount;
  const attentionCount = state.admin.reports.subscriptions.filter(
    (item) => isActiveSubscriptionStatus(item.status) && Number(item.lessonsLeft) <= 2
  ).length;

  nodes.subscriptionsReportList.innerHTML = `
    <div class="report-status-strip">
      <span><strong>${escapeHtml(activeCount)}</strong> активных</span>
      <span><strong>${escapeHtml(inactiveCount)}</strong> неактивных</span>
      <span><strong>${escapeHtml(attentionCount)}</strong> требуют контроля</span>
    </div>
    ${renderDataTable(
      ["Раздел", "Ученик", "Группы", "Остаток", "Период", "До окончания", "Статус"],
      state.admin.reports.subscriptions.map((item) => [
        isActiveSubscriptionStatus(item.status) ? "Активные" : "Неактивные",
        item.studentName,
        item.groupNames,
        `${item.lessonsLeft}/${item.lessonsTotal}`,
        `${item.startDate} - ${item.endDate}`,
        formatDaysRemaining(item.daysRemaining),
        {
          html: `<span class="${badgeClassBySubscriptionStatus(item.status)}">${escapeHtml(
            formatSubscriptionStatus(item.status)
          )}</span>`,
        },
      ])
    )}
  `;
}

function renderScheduleReport() {
  if (!state.admin.reports.schedule.length) {
    nodes.scheduleReportList.innerHTML = emptyState("Операционные данные по расписанию пока пусты.");
    return;
  }

  nodes.scheduleReportList.innerHTML = renderDataTable(
    [
      "Дата",
      "Группа",
      "Время",
      "Зал",
      "Преподаватель",
      "Учеников",
      "Отмечено",
      "Присутствовали",
      "Отсутствовали",
      "Без отметки",
    ],
    state.admin.reports.schedule.map((item) => [
      item.lessonDate,
      item.groupName,
      `${item.startTime} - ${item.endTime}`,
      item.room,
      item.teacherName,
      item.studentCount,
      `${item.markedCount}/${item.studentCount}`,
      item.presentCount,
      item.absentCount,
      item.unmarkedCount,
    ])
  );
}

function renderAdminWorkspace() {
  populateTeacherSelect();
  populateGroupSelect();
  populateStudentSelects();
  renderStudents();
  renderTeachers();
  renderGroups();
  renderSchedule();
  renderSubscriptions();
  renderReportsSummary();
  renderAttendanceReport();
  renderSubscriptionReport();
  renderScheduleReport();
  initializeAdminTabs();
  setOperationsView(state.admin.ui.operationsView);
  setReportView(state.admin.ui.reportView);
  setSubscriptionFormExpanded(state.admin.ui.subscriptionFormExpanded);
  nodes.adminWorkspace.classList.remove("hidden");
}

async function loadAdminWorkspace() {
  const [bootstrapResult, reportsResult] = await Promise.all([
    apiRequest("/api/admin/bootstrap"),
    apiRequest("/api/admin/reports"),
  ]);

  if (!bootstrapResult.response.ok) {
    nodes.adminWorkspace.classList.add("hidden");
    setMessage(
      nodes.adminMessage,
      bootstrapResult.payload.error || "Не удалось загрузить админские данные.",
      "error"
    );
    return;
  }

  state.admin.students = bootstrapResult.payload.students;
  state.admin.teachers = bootstrapResult.payload.teachers;
  state.admin.groups = bootstrapResult.payload.groups;
  state.admin.schedule = bootstrapResult.payload.schedule;
  state.admin.subscriptions = bootstrapResult.payload.subscriptions;
  normalizeDirectoryUiState("student", state.admin.students);
  normalizeDirectoryUiState("teacher", state.admin.teachers);

  if (reportsResult.response.ok) {
    state.admin.reports.attendance = reportsResult.payload.attendance;
    state.admin.reports.subscriptions = reportsResult.payload.subscriptions;
    state.admin.reports.schedule = reportsResult.payload.schedule;
    setMessage(nodes.adminMessage);
  } else {
    state.admin.reports.attendance = [];
    state.admin.reports.subscriptions = [];
    state.admin.reports.schedule = [];
    setMessage(
      nodes.adminMessage,
      reportsResult.payload.error || "Базовые данные загружены, но отчеты пока недоступны.",
      "error"
    );
  }

  renderAdminWorkspace();
}

function startDirectoryCreate(entity) {
  const ui = getDirectoryUi(entity);
  ui.creating = true;
  ui.editingId = "new";
  ui.expandedId = "new";
  renderAdminWorkspace();
}

function toggleDirectoryCard(entity, id) {
  const ui = getDirectoryUi(entity);
  const resolvedId = String(id);

  if (ui.expandedId === resolvedId && ui.editingId !== resolvedId) {
    ui.expandedId = null;
    renderAdminWorkspace();
    return;
  }

  ui.creating = false;
  ui.editingId = null;
  ui.expandedId = resolvedId;
  renderAdminWorkspace();
}

function startDirectoryEdit(entity, id) {
  const ui = getDirectoryUi(entity);
  ui.creating = false;
  ui.editingId = String(id);
  ui.expandedId = String(id);
  renderAdminWorkspace();
}

function cancelDirectoryEdit(entity, id = "") {
  const ui = getDirectoryUi(entity);

  if (ui.creating || String(id) === "new") {
    ui.creating = false;
    ui.editingId = null;
    ui.expandedId = null;
    renderAdminWorkspace();
    return;
  }

  ui.editingId = null;
  ui.expandedId = String(id);
  renderAdminWorkspace();
}

function directoryRequestConfig(entity) {
  if (entity === "student") {
    return {
      baseUrl: "/api/admin/students",
      createSuccessMessage: "Ученик создан.",
      updateSuccessMessage: "Данные ученика сохранены.",
      deleteSuccessMessage: "Ученик удален.",
      serialize: (formData) => ({
        fullName: String(formData.get("fullName") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        password: String(formData.get("password") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
        birthDate: String(formData.get("birthDate") ?? "").trim(),
        registrationDate: String(formData.get("registrationDate") ?? "").trim(),
      }),
    };
  }

  return {
    baseUrl: "/api/admin/teachers",
    createSuccessMessage: "Преподаватель создан.",
    updateSuccessMessage: "Данные преподавателя сохранены.",
    deleteSuccessMessage: "Преподаватель удален.",
    serialize: (formData) => ({
      fullName: String(formData.get("fullName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? "").trim(),
      specialization: String(formData.get("specialization") ?? "").trim(),
      hireDate: String(formData.get("hireDate") ?? "").trim(),
    }),
  };
}

async function saveDirectoryRecord(entity, form) {
  const config = directoryRequestConfig(entity);
  const formData = new FormData(form);
  const id = String(form.dataset.id || "").trim();
  const ui = getDirectoryUi(entity);
  const { response, payload } = await apiRequest(id ? `${config.baseUrl}/${id}` : config.baseUrl, {
    method: id ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(config.serialize(formData)),
  });

  if (!response.ok) {
    setMessage(nodes.adminMessage, payload.error || "Не удалось сохранить запись.", "error");
    return;
  }

  ui.creating = false;
  ui.editingId = null;
  ui.focusNewest = !id;
  ui.expandedId = id || null;
  await loadAdminWorkspace();
  setMessage(
    nodes.adminMessage,
    id ? config.updateSuccessMessage : config.createSuccessMessage,
    "success"
  );
}

async function deleteDirectoryRecord(entity, id, title) {
  if (!window.confirm(`Удалить запись: ${title}?`)) {
    return;
  }

  const config = directoryRequestConfig(entity);
  const { response, payload } = await apiRequest(`${config.baseUrl}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    setMessage(nodes.adminMessage, payload.error || "Не удалось удалить запись.", "error");
    return;
  }

  const ui = getDirectoryUi(entity);

  if (ui.expandedId === String(id)) {
    ui.expandedId = null;
  }

  if (ui.editingId === String(id)) {
    ui.editingId = null;
  }

  await loadAdminWorkspace();
  setMessage(nodes.adminMessage, config.deleteSuccessMessage, "success");
}

function resetGroupForm() {
  document.getElementById("group-id").value = "";
  document.getElementById("group-name").value = "";
  nodes.groupTeacherId.value = "";
  document.getElementById("group-level").value = "";
  document.getElementById("group-age-category").value = "";
  setSelectedValues(nodes.groupStudentIds, []);
  state.admin.ui.groupStudentSearch = "";
  state.admin.ui.groupPickerExpanded = false;
  renderGroupStudentPicker();
}

function resetScheduleForm() {
  document.getElementById("schedule-id").value = "";
  nodes.scheduleGroupId.value = "";
  document.getElementById("schedule-lesson-date").value = "";
  document.getElementById("schedule-start-time").value = "";
  document.getElementById("schedule-end-time").value = "";
  document.getElementById("schedule-room").value = "";
}

function clearSubscriptionFormFields() {
  document.getElementById("subscription-id").value = "";
  nodes.subscriptionStudentId.value = "";
  document.getElementById("subscription-lessons-total").value = "";
  document.getElementById("subscription-lessons-left").value = "";
  document.getElementById("subscription-start-date").value = "";
  document.getElementById("subscription-end-date").value = "";
  document.getElementById("subscription-status").value = "active";
}

function resetSubscriptionForm() {
  clearSubscriptionFormFields();
  setOperationsView("subscriptions");
  setSubscriptionFormExpanded(true);
}

async function submitEntityForm(config) {
  const id = config.idNode.value;
  const { response, payload } = await apiRequest(
    id ? `${config.baseUrl}/${id}` : config.baseUrl,
    {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config.serialize()),
    }
  );

  if (!response.ok) {
    setMessage(nodes.adminMessage, payload.error || "Не удалось сохранить запись.", "error");
    return;
  }

  config.reset();
  await loadAdminWorkspace();
  setMessage(nodes.adminMessage, config.successMessage, "success");
}

async function deleteEntity(path, title, successMessage) {
  if (!window.confirm(`Удалить запись: ${title}?`)) {
    return;
  }

  const { response, payload } = await apiRequest(path, { method: "DELETE" });

  if (!response.ok) {
    setMessage(nodes.adminMessage, payload.error || "Не удалось удалить запись.", "error");
    return;
  }

  await loadAdminWorkspace();
  setMessage(nodes.adminMessage, successMessage || "Запись удалена.", "success");
}

function findById(items, id) {
  return items.find((item) => String(item.id) === String(id));
}

function editGroup(id) {
  const group = findById(state.admin.groups, id);

  if (!group) {
    return;
  }

  document.getElementById("group-id").value = group.id;
  document.getElementById("group-name").value = group.groupName;
  nodes.groupTeacherId.value = group.teacherId;
  document.getElementById("group-level").value = group.level || "";
  document.getElementById("group-age-category").value = group.ageCategory || "";
  setSelectedValues(nodes.groupStudentIds, group.studentIds || []);
  state.admin.ui.groupStudentSearch = "";
  state.admin.ui.groupPickerExpanded = false;
  renderGroupStudentPicker();
  window.scrollTo({ top: nodes.groupForm.offsetTop - 20, behavior: "smooth" });
}

function editSchedule(id) {
  const item = findById(state.admin.schedule, id);

  if (!item) {
    return;
  }

  document.getElementById("schedule-id").value = item.id;
  nodes.scheduleGroupId.value = item.groupId;
  document.getElementById("schedule-lesson-date").value = item.lessonDate || "";
  document.getElementById("schedule-start-time").value = item.startTime || "";
  document.getElementById("schedule-end-time").value = item.endTime || "";
  document.getElementById("schedule-room").value = item.room || "";
  window.scrollTo({ top: nodes.scheduleForm.offsetTop - 20, behavior: "smooth" });
}

function editSubscription(id) {
  const subscription = findById(state.admin.subscriptions, id);

  if (!subscription) {
    return;
  }

  document.getElementById("subscription-id").value = subscription.id;
  nodes.subscriptionStudentId.value = subscription.studentId;
  document.getElementById("subscription-lessons-total").value = subscription.lessonsTotal;
  document.getElementById("subscription-lessons-left").value = subscription.lessonsLeft;
  document.getElementById("subscription-start-date").value = subscription.startDate || "";
  document.getElementById("subscription-end-date").value = subscription.endDate || "";
  document.getElementById("subscription-status").value = subscription.status;
  setOperationsView("subscriptions");
  setSubscriptionFormExpanded(true);
  window.scrollTo({ top: nodes.subscriptionForm.offsetTop - 20, behavior: "smooth" });
}

function attachAdminEvents() {
  if (
    !nodes.studentsList ||
    !nodes.teachersList ||
    !nodes.groupsList ||
    !nodes.scheduleList ||
    !nodes.subscriptionsList ||
    !nodes.groupForm ||
    !nodes.scheduleForm ||
    !nodes.subscriptionForm
  ) {
    return;
  }

  nodes.adminTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveAdminTab(button.dataset.adminTab);
    });
  });

  nodes.operationsViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setOperationsView(button.dataset.operationsView);
    });
  });

  nodes.reportViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setReportView(button.dataset.reportView);
    });
  });

  nodes.studentsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    if (button.dataset.action === "toggle") {
      toggleDirectoryCard("student", button.dataset.id);
      return;
    }

    if (button.dataset.action === "edit") {
      startDirectoryEdit("student", button.dataset.id);
      return;
    }

    if (button.dataset.action === "cancel") {
      cancelDirectoryEdit("student", button.dataset.id);
      return;
    }

    if (button.dataset.action === "delete") {
      const student = findById(state.admin.students, button.dataset.id);

      if (student) {
        deleteDirectoryRecord("student", student.id, student.fullName);
      }
    }
  });

  nodes.studentsList.addEventListener("submit", async (event) => {
    const form = event.target.closest('form[data-directory-form="student"]');

    if (!form) {
      return;
    }

    event.preventDefault();
    await saveDirectoryRecord("student", form);
  });

  nodes.teachersList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    if (button.dataset.action === "toggle") {
      toggleDirectoryCard("teacher", button.dataset.id);
      return;
    }

    if (button.dataset.action === "edit") {
      startDirectoryEdit("teacher", button.dataset.id);
      return;
    }

    if (button.dataset.action === "cancel") {
      cancelDirectoryEdit("teacher", button.dataset.id);
      return;
    }

    if (button.dataset.action === "delete") {
      const teacher = findById(state.admin.teachers, button.dataset.id);

      if (teacher) {
        deleteDirectoryRecord("teacher", teacher.id, teacher.fullName);
      }
    }
  });

  nodes.teachersList.addEventListener("submit", async (event) => {
    const form = event.target.closest('form[data-directory-form="teacher"]');

    if (!form) {
      return;
    }

    event.preventDefault();
    await saveDirectoryRecord("teacher", form);
  });

  nodes.groupsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    if (button.dataset.action === "edit") {
      editGroup(button.dataset.id);
      return;
    }

    if (button.dataset.action === "delete") {
      const group = findById(state.admin.groups, button.dataset.id);

      if (group) {
        deleteEntity(`/api/admin/groups/${group.id}`, group.groupName);
      }
    }
  });

  nodes.groupStudentOptions?.addEventListener("click", (event) => {
    const button = event.target.closest('button[data-action="toggle-group-student"]');

    if (!button) {
      return;
    }

    toggleGroupStudentSelection(button.dataset.studentId);
  });

  nodes.groupSelectedStudents?.addEventListener("click", (event) => {
    const button = event.target.closest('button[data-action="remove-group-student"]');

    if (!button) {
      return;
    }

    toggleGroupStudentSelection(button.dataset.studentId);
  });

  nodes.groupStudentSearch?.addEventListener("input", (event) => {
    state.admin.ui.groupStudentSearch = event.target.value;
    renderGroupStudentPicker();
  });

  nodes.toggleGroupPicker?.addEventListener("click", () => {
    setGroupPickerExpanded(!state.admin.ui.groupPickerExpanded);
  });

  nodes.clearGroupSelection?.addEventListener("click", () => {
    clearGroupStudentSelection();
  });

  nodes.toggleSubscriptionForm?.addEventListener("click", () => {
    setSubscriptionFormExpanded(!state.admin.ui.subscriptionFormExpanded);
  });

  nodes.scheduleList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    if (button.dataset.action === "edit") {
      editSchedule(button.dataset.id);
      return;
    }

    if (button.dataset.action === "delete") {
      const schedule = findById(state.admin.schedule, button.dataset.id);

      if (schedule) {
        deleteEntity(
          `/api/admin/schedule/${schedule.id}`,
          `${schedule.groupName} ${schedule.lessonDate}`
        );
      }
    }
  });

  nodes.subscriptionsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    if (button.dataset.action === "edit") {
      editSubscription(button.dataset.id);
      return;
    }

    if (button.dataset.action === "delete") {
      const subscription = findById(state.admin.subscriptions, button.dataset.id);

      if (subscription) {
        deleteEntity(
          `/api/admin/subscriptions/${subscription.id}`,
          `${subscription.studentName} (${subscription.startDate})`
        );
      }
    }
  });

  nodes.groupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitEntityForm({
      idNode: document.getElementById("group-id"),
      baseUrl: "/api/admin/groups",
      serialize: () => ({
        groupName: document.getElementById("group-name").value,
        teacherId: nodes.groupTeacherId.value,
        level: document.getElementById("group-level").value,
        ageCategory: document.getElementById("group-age-category").value,
        studentIds: collectSelectedValues(nodes.groupStudentIds),
      }),
      reset: resetGroupForm,
      successMessage: "Данные группы сохранены.",
    });
  });

  nodes.scheduleForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitEntityForm({
      idNode: document.getElementById("schedule-id"),
      baseUrl: "/api/admin/schedule",
      serialize: () => ({
        groupId: nodes.scheduleGroupId.value,
        lessonDate: document.getElementById("schedule-lesson-date").value,
        startTime: document.getElementById("schedule-start-time").value,
        endTime: document.getElementById("schedule-end-time").value,
        room: document.getElementById("schedule-room").value,
      }),
      reset: resetScheduleForm,
      successMessage: "Занятие сохранено в расписании.",
    });
  });

  nodes.subscriptionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitEntityForm({
      idNode: document.getElementById("subscription-id"),
      baseUrl: "/api/admin/subscriptions",
      serialize: () => ({
        studentId: nodes.subscriptionStudentId.value,
        lessonsTotal: document.getElementById("subscription-lessons-total").value,
        lessonsLeft: document.getElementById("subscription-lessons-left").value,
        startDate: document.getElementById("subscription-start-date").value,
        endDate: document.getElementById("subscription-end-date").value,
        status: document.getElementById("subscription-status").value,
      }),
      reset: () => {
        clearSubscriptionFormFields();
        setSubscriptionFormExpanded(false);
        setOperationsView("subscriptions");
      },
      successMessage: "Абонемент сохранен.",
    });
  });

  nodes.resetStudentForm.addEventListener("click", () => {
    startDirectoryCreate("student");
  });
  nodes.resetTeacherForm.addEventListener("click", () => {
    startDirectoryCreate("teacher");
  });
  nodes.resetGroupForm.addEventListener("click", resetGroupForm);
  nodes.resetScheduleForm.addEventListener("click", resetScheduleForm);
  nodes.resetSubscriptionForm.addEventListener("click", resetSubscriptionForm);
}

function attendanceBadgeClass(student) {
  if (student.attendanceStatus === true) {
    return "badge badge-success";
  }

  if (student.attendanceId) {
    return "badge badge-muted";
  }

  return "badge badge-warning";
}

function attendanceBadgeText(student) {
  if (student.attendanceStatus === true) {
    return "Присутствовал";
  }

  if (student.attendanceId) {
    return "Отсутствовал";
  }

  return "Не отмечен";
}

function isUpcomingTeacherLesson(lesson) {
  return lesson.lessonDate >= todayKey();
}

function isTodayTeacherLesson(lesson) {
  return lesson.lessonDate === todayKey();
}

function sortLessonsAscending(items) {
  return [...items].sort((left, right) =>
    `${left.lessonDate} ${left.startTime}`.localeCompare(`${right.lessonDate} ${right.startTime}`)
  );
}

function sortLessonsDescending(items) {
  return [...items].sort((left, right) =>
    `${right.lessonDate} ${right.startTime}`.localeCompare(`${left.lessonDate} ${left.startTime}`)
  );
}

function teacherWeekWindow(weekOffset = state.teacher.ui.weekOffset) {
  const startDate = addDays(startOfWeek(parseDateKey(todayKey())), weekOffset * 7);
  const endDate = addDays(startDate, 6);

  return {
    startDate,
    endDate,
    startKey: toDateKey(startDate),
    endKey: toDateKey(endDate),
  };
}

function teacherLessonsForToday() {
  return sortLessonsAscending(state.teacher.lessons.filter(isTodayTeacherLesson));
}

function teacherLessonsForWeek(weekOffset = state.teacher.ui.weekOffset) {
  const weekWindow = teacherWeekWindow(weekOffset);

  return sortLessonsAscending(
    state.teacher.lessons.filter(
      (lesson) => lesson.lessonDate >= weekWindow.startKey && lesson.lessonDate <= weekWindow.endKey
    )
  );
}

function teacherLessonsForArchive() {
  return sortLessonsDescending(state.teacher.lessons.filter((lesson) => !isUpcomingTeacherLesson(lesson)));
}

function teacherWeekDayKeys(weekWindow = teacherWeekWindow()) {
  return Array.from({ length: 7 }, (_, index) => toDateKey(addDays(weekWindow.startDate, index)));
}

function syncTeacherWeekDaySelection() {
  const weekWindow = teacherWeekWindow();
  const dayKeys = teacherWeekDayKeys(weekWindow);

  if (dayKeys.includes(state.teacher.ui.selectedWeekDay)) {
    return;
  }

  const scheduledDays = new Set(teacherLessonsForWeek().map((lesson) => lesson.lessonDate));
  const preferredToday = dayKeys.includes(todayKey()) && scheduledDays.has(todayKey()) ? todayKey() : null;

  state.teacher.ui.selectedWeekDay = preferredToday || dayKeys.find((dayKey) => scheduledDays.has(dayKey)) || dayKeys[0];
}

function teacherLessonsForSelectedWeekDay() {
  syncTeacherWeekDaySelection();
  return teacherLessonsForWeek().filter((lesson) => lesson.lessonDate === state.teacher.ui.selectedWeekDay);
}

function lessonsForTeacherView(viewName) {
  if (viewName === "today") {
    return teacherLessonsForToday();
  }

  if (viewName === "archive") {
    return teacherLessonsForArchive();
  }

  return teacherLessonsForSelectedWeekDay();
}

function selectedTeacherLesson() {
  return findById(state.teacher.lessons, state.teacher.ui.selectedLessonId);
}

function syncTeacherLessonSelection(viewName = state.teacher.ui.view) {
  const lessons = lessonsForTeacherView(viewName);

  if (
    state.teacher.ui.selectedLessonId &&
    lessons.some((lesson) => String(lesson.id) === String(state.teacher.ui.selectedLessonId))
  ) {
    return;
  }

  state.teacher.ui.selectedLessonId = lessons[0] ? String(lessons[0].id) : null;
}

function selectTeacherLesson(lessonId) {
  if (!lessonId) {
    return;
  }

  state.teacher.ui.selectedLessonId = String(lessonId);
  renderTeacherWorkspace();
}

function shiftTeacherWeek(offsetDelta) {
  state.teacher.ui.weekOffset += offsetDelta;
  renderTeacherWorkspace();
}

function resetTeacherWeek() {
  state.teacher.ui.weekOffset = 0;
  renderTeacherWorkspace();
}

function selectTeacherWeekDay(dayKey) {
  state.teacher.ui.selectedWeekDay = String(dayKey);
  renderTeacherWorkspace();
}

function teacherLessonStatusMeta(lesson) {
  if (lesson.lessonDate === todayKey()) {
    return {
      className: "badge badge-warning",
      text: "Сегодня",
    };
  }

  if (lesson.lessonDate > todayKey()) {
    return {
      className: "badge badge-success",
      text: "Запланировано",
    };
  }

  return {
    className: "badge badge-muted",
    text: "Архив",
  };
}

function teacherWeekRangeLabel(weekWindow) {
  return `${formatDateKey(weekWindow.startKey, { day: "numeric", month: "short" })} - ${formatDateKey(
    weekWindow.endKey,
    { day: "numeric", month: "short" }
  )}`;
}

function teacherWeekDayTitle(dayKey) {
  return formatDateKey(dayKey, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function teacherLessonScheduleLabel(lesson, includeDate = true) {
  const datePrefix = includeDate
    ? `${formatDateKey(lesson.lessonDate, { weekday: "short", day: "numeric", month: "short" })} • `
    : "";

  return `${datePrefix}${lesson.startTime} - ${lesson.endTime} • ${formatOptionalValue(
    lesson.room,
    "зал не указан"
  )}`;
}

function teacherLessonStats(lesson) {
  return lesson.students.reduce(
    (summary, student) => {
      if (student.attendanceStatus === true) {
        summary.presentCount += 1;
      } else if (student.attendanceId) {
        summary.absentCount += 1;
      } else {
        summary.unmarkedCount += 1;
      }

      if (!student.subscriptionId) {
        summary.withoutSubscriptionCount += 1;
      }

      return summary;
    },
    {
      presentCount: 0,
      absentCount: 0,
      unmarkedCount: 0,
      withoutSubscriptionCount: 0,
    }
  );
}

function renderTeacherStreamList(targetNode, lessons, emptyMessage, options = {}) {
  if (!targetNode) {
    return;
  }

  if (!lessons.length) {
    targetNode.innerHTML = emptyState(emptyMessage);
    return;
  }

  const { includeDate = true } = options;

  targetNode.innerHTML = lessons
    .map((lesson) => {
      const stats = teacherLessonStats(lesson);
      const status = teacherLessonStatusMeta(lesson);
      const isActive = String(state.teacher.ui.selectedLessonId) === String(lesson.id);

      return `
        <button
          type="button"
          class="teacher-stream-card${isActive ? " is-active" : ""}"
          data-teacher-select="${escapeHtml(lesson.id)}"
          aria-pressed="${isActive ? "true" : "false"}"
        >
          <span class="teacher-stream-copy">
            <strong>${escapeHtml(lesson.groupName)}</strong>
            <span>${escapeHtml(teacherLessonScheduleLabel(lesson, includeDate))}</span>
          </span>
          <span class="teacher-stream-meta">
            <span class="${status.className}">${escapeHtml(status.text)}</span>
            <span class="directory-token">${escapeHtml(
              `${lesson.students.length} ${pluralizeRu(lesson.students.length, "ученик", "ученика", "учеников")}`
            )}</span>
            <span class="directory-token">${escapeHtml(
              stats.unmarkedCount ? `Без отметки: ${stats.unmarkedCount}` : "Все отмечены"
            )}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderTeacherWeekCalendar() {
  if (!nodes.teacherWeekDays || !nodes.teacherWeekLessonsList) {
    return;
  }

  const weekWindow = teacherWeekWindow();
  const weekLessons = teacherLessonsForWeek();
  const lessonsByDay = weekLessons.reduce((map, lesson) => {
    const key = String(lesson.lessonDate);

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key).push(lesson);
    return map;
  }, new Map());

  if (nodes.teacherWeekRange) {
    nodes.teacherWeekRange.textContent = teacherWeekRangeLabel(weekWindow);
  }

  syncTeacherWeekDaySelection();

  nodes.teacherWeekDays.innerHTML = teacherWeekDayKeys(weekWindow)
    .map((dayKey) => {
      const dayLessons = lessonsByDay.get(dayKey) || [];
      const isActive = state.teacher.ui.selectedWeekDay === dayKey;
      const isToday = dayKey === todayKey();

      return `
        <button
          type="button"
          class="teacher-week-day-chip${isActive ? " is-active" : ""}${isToday ? " is-today" : ""}"
          data-teacher-week-day="${escapeHtml(dayKey)}"
          aria-pressed="${isActive ? "true" : "false"}"
        >
          <span class="label">${escapeHtml(formatDateKey(dayKey, { weekday: "short" }))}</span>
          <strong>${escapeHtml(formatDateKey(dayKey, { day: "numeric", month: "short" }))}</strong>
          <span class="teacher-week-day-chip-meta">${escapeHtml(
            dayLessons.length
              ? `${dayLessons.length} ${pluralizeRu(dayLessons.length, "занятие", "занятия", "занятий")}`
              : "Свободно"
          )}</span>
        </button>
      `;
    })
    .join("");

  if (nodes.teacherWeekDayTitle) {
    nodes.teacherWeekDayTitle.textContent = teacherWeekDayTitle(state.teacher.ui.selectedWeekDay);
  }

  renderTeacherStreamList(
    nodes.teacherWeekLessonsList,
    teacherLessonsForSelectedWeekDay(),
    "На выбранный день занятий нет.",
    {
      includeDate: false,
    }
  );
}

function renderTeacherSummary() {
  const todayLessons = teacherLessonsForToday();
  const weekLessons = teacherLessonsForWeek();
  const todayStudents = todayLessons.reduce((total, lesson) => total + lesson.students.length, 0);
  const unmarkedTotal = todayLessons.reduce(
    (total, lesson) => total + teacherLessonStats(lesson).unmarkedCount,
    0
  );
  const withoutSubscriptionTotal = weekLessons.reduce(
    (total, lesson) => total + teacherLessonStats(lesson).withoutSubscriptionCount,
    0
  );
  const weekWindow = teacherWeekWindow();

  nodes.teacherSummary.innerHTML = summaryCardsMarkup([
    {
      label: "Сегодня",
      value: todayLessons.length,
      hint: "занятий в текущий день",
    },
    {
      label: "Неделя",
      value: weekLessons.length,
      hint: teacherWeekRangeLabel(weekWindow),
    },
    {
      label: "Ученики сегодня",
      value: todayStudents,
      hint: "состав на уроки текущего дня",
    },
    {
      label: "Точки внимания",
      value: unmarkedTotal + withoutSubscriptionTotal,
      hint: `${unmarkedTotal} без отметки, ${withoutSubscriptionTotal} без абонемента`,
    },
  ]);
}

function renderTeacherFocus() {
  if (!nodes.teacherLessonFocus) {
    return;
  }

  const lesson = selectedTeacherLesson();

  if (!lesson) {
    nodes.teacherLessonFocus.innerHTML = emptyState(
      "Выберите занятие в календаре или в ленте, чтобы открыть полную карточку."
    );
    return;
  }

  const stats = teacherLessonStats(lesson);
  const status = teacherLessonStatusMeta(lesson);
  const roster = lesson.students.length
    ? lesson.students
        .map((student) => {
          const hasSubscription = Boolean(student.subscriptionId);
          const subscriptionSummary = hasSubscription
            ? `${student.lessonsLeft}/${student.lessonsTotal} занятий, статус ${formatSubscriptionStatus(
                student.subscriptionStatus
              )}`
            : "Нет активного абонемента на дату занятия";

          return `
            <article class="roster-card">
              <div class="roster-header">
                <div>
                  <strong>${escapeHtml(student.fullName)}</strong>
                  <span>${escapeHtml(student.phone || "Без телефона")}</span>
                </div>
                <span class="${attendanceBadgeClass(student)}">${escapeHtml(
                  attendanceBadgeText(student)
                )}</span>
              </div>

              <div class="entity-meta">
                <div>
                  <span class="label">Абонемент</span>
                  <strong>${escapeHtml(subscriptionSummary)}</strong>
                </div>
                <div>
                  <span class="label">Период</span>
                  <strong>${escapeHtml(
                    student.subscriptionStartDate && student.subscriptionEndDate
                      ? `${student.subscriptionStartDate} - ${student.subscriptionEndDate}`
                      : "—"
                  )}</strong>
                </div>
              </div>

              ${
                !hasSubscription
                  ? '<p class="directory-note">Для списания нужен активный абонемент на дату занятия.</p>'
                  : ""
              }

              <div class="attendance-controls">
                <button
                  type="button"
                  class="attendance-button present"
                  data-schedule-id="${escapeHtml(lesson.id)}"
                  data-student-id="${escapeHtml(student.studentId)}"
                  data-attendance="true"
                  ${!hasSubscription && student.attendanceStatus !== true ? "disabled" : ""}
                >
                  Присутствовал
                </button>
                <button
                  type="button"
                  class="attendance-button absent"
                  data-schedule-id="${escapeHtml(lesson.id)}"
                  data-student-id="${escapeHtml(student.studentId)}"
                  data-attendance="false"
                >
                  Отсутствовал
                </button>
              </div>
            </article>
          `;
        })
        .join("")
    : emptyState("В этой группе пока нет учеников.");

  nodes.teacherLessonFocus.innerHTML = `
    <article class="teacher-focus-card">
      <div class="teacher-focus-topline">
        <div>
          <span class="label">Выбранное занятие</span>
          <h4>${escapeHtml(lesson.groupName)}</h4>
          <p class="panel-copy">${escapeHtml(teacherLessonScheduleLabel(lesson))}</p>
        </div>
        <span class="${status.className}">${escapeHtml(status.text)}</span>
      </div>

      <div class="entity-meta">
        <div>
          <span class="label">Дата</span>
          <strong>${escapeHtml(
            formatDateKey(lesson.lessonDate, { weekday: "long", day: "numeric", month: "long" })
          )}</strong>
        </div>
        <div>
          <span class="label">Состав</span>
          <strong>${escapeHtml(
            `${lesson.students.length} ${pluralizeRu(lesson.students.length, "ученик", "ученика", "учеников")}`
          )}</strong>
        </div>
        <div>
          <span class="label">Зал</span>
          <strong>${escapeHtml(formatOptionalValue(lesson.room, "Не указан"))}</strong>
        </div>
        <div>
          <span class="label">Время</span>
          <strong>${escapeHtml(`${lesson.startTime} - ${lesson.endTime}`)}</strong>
        </div>
      </div>

      <div class="lesson-status-strip">
        <span class="directory-token">${escapeHtml(`Присутствовали: ${stats.presentCount}`)}</span>
        <span class="directory-token">${escapeHtml(`Отсутствовали: ${stats.absentCount}`)}</span>
        <span class="directory-token">${escapeHtml(`Без отметки: ${stats.unmarkedCount}`)}</span>
        ${
          stats.withoutSubscriptionCount
            ? `<span class="directory-token">${escapeHtml(
                `Без абонемента: ${stats.withoutSubscriptionCount}`
              )}</span>`
            : ""
        }
      </div>

      <div class="teacher-focus-roster-head">
        <div>
          <span class="label">Состав группы</span>
          <strong>Отмечайте посещаемость прямо внутри карточки занятия</strong>
        </div>
      </div>

      <div class="roster-list teacher-focus-roster">${roster}</div>
    </article>
  `;
}

function renderTeacherWorkspace() {
  syncTeacherLessonSelection(state.teacher.ui.view);
  renderTeacherSummary();
  renderTeacherStreamList(
    nodes.teacherTodayLessonsList,
    teacherLessonsForToday(),
    "На сегодня занятий нет. Переключитесь на неделю, чтобы посмотреть ближайший поток.",
    {
      includeDate: false,
    }
  );
  renderTeacherWeekCalendar();
  renderTeacherStreamList(
    nodes.teacherArchiveLessonsList,
    teacherLessonsForArchive(),
    "Прошедших занятий пока нет."
  );
  setTeacherView(state.teacher.ui.view);
  nodes.teacherWorkspace.classList.remove("hidden");
}

async function loadTeacherWorkspace() {
  const { response, payload } = await apiRequest("/api/teacher/bootstrap");

  if (!response.ok) {
    nodes.teacherWorkspace.classList.add("hidden");
    setMessage(
      nodes.teacherMessage,
      payload.error || "Не удалось загрузить кабинет преподавателя.",
      "error"
    );
    return;
  }

  state.teacher.lessons = payload.lessons;
  if (
    state.teacher.ui.selectedLessonId &&
    !findById(state.teacher.lessons, state.teacher.ui.selectedLessonId)
  ) {
    state.teacher.ui.selectedLessonId = null;
  }
  renderTeacherWorkspace();
}

async function markAttendance(scheduleId, studentId, attendanceStatus) {
  const { response, payload } = await apiRequest("/api/teacher/attendance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scheduleId,
      studentId,
      attendanceStatus,
    }),
  });

  if (!response.ok) {
    setMessage(
      nodes.teacherMessage,
      payload.error || "Не удалось сохранить отметку посещаемости.",
      "error"
    );
    return;
  }

  await loadTeacherWorkspace();
  setMessage(nodes.teacherMessage, "Посещаемость обновлена, остаток абонемента пересчитан.", "success");
}

function attachTeacherEvents() {
  if (
    !nodes.teacherTodayLessonsList ||
    !nodes.teacherArchiveLessonsList ||
    !nodes.teacherWeekDays ||
    !nodes.teacherWeekLessonsList ||
    !nodes.teacherLessonFocus
  ) {
    return;
  }

  nodes.teacherViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.teacher.ui.view = button.dataset.teacherView || "week";
      renderTeacherWorkspace();
    });
  });

  nodes.teacherWeekPrev?.addEventListener("click", () => {
    shiftTeacherWeek(-1);
  });

  nodes.teacherWeekCurrent?.addEventListener("click", () => {
    resetTeacherWeek();
  });

  nodes.teacherWeekNext?.addEventListener("click", () => {
    shiftTeacherWeek(1);
  });

  const handleTeacherListClick = async (event) => {
    const weekDayButton = event.target.closest("button[data-teacher-week-day]");

    if (weekDayButton) {
      selectTeacherWeekDay(weekDayButton.dataset.teacherWeekDay);
      return;
    }

    const selectionButton = event.target.closest("button[data-teacher-select]");

    if (selectionButton) {
      selectTeacherLesson(selectionButton.dataset.teacherSelect);
      return;
    }

    const button = event.target.closest("button[data-attendance]");

    if (!button) {
      return;
    }

    await markAttendance(
      button.dataset.scheduleId,
      button.dataset.studentId,
      button.dataset.attendance
    );
  };

  nodes.teacherTodayLessonsList.addEventListener("click", handleTeacherListClick);
  nodes.teacherWeekDays.addEventListener("click", handleTeacherListClick);
  nodes.teacherWeekLessonsList.addEventListener("click", handleTeacherListClick);
  nodes.teacherArchiveLessonsList.addEventListener("click", handleTeacherListClick);
  nodes.teacherLessonFocus.addEventListener("click", handleTeacherListClick);
}

function studentScheduleBadge(lesson) {
  if (lesson.attendanceStatus === true) {
    return {
      className: "badge badge-success",
      text: "Посещено",
    };
  }

  if (lesson.attendanceId) {
    return {
      className: "badge badge-muted",
      text: "Пропуск",
    };
  }

  if (lesson.lessonDate >= todayKey()) {
    return {
      className: "badge badge-warning",
      text: "Предстоит",
    };
  }

  return {
    className: "badge badge-muted",
    text: "Без отметки",
  };
}

function renderStudentGroups() {
  if (!state.student.groups.length) {
    nodes.studentGroupsList.innerHTML = emptyState(
      "Ученик пока не добавлен ни в одну группу."
    );
    return;
  }

  nodes.studentGroupsList.innerHTML = state.student.groups
    .map(
      (group) => `
        <article class="entity-card">
          <div class="entity-card-header">
            <div>
              <strong>${escapeHtml(group.groupName)}</strong>
              <span>${escapeHtml(group.teacherName)}</span>
            </div>
            <span class="badge badge-muted">${escapeHtml(group.level || "Без уровня")}</span>
          </div>
          <div class="entity-meta">
            <div><span class="label">Возрастная категория</span><strong>${escapeHtml(group.ageCategory || "—")}</strong></div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderStudentProfile() {
  if (!nodes.studentProfileCard) {
    return;
  }

  if (!state.student.profile) {
    nodes.studentProfileCard.innerHTML = emptyState("Профиль ученика пока недоступен.");
    return;
  }

  const profile = state.student.profile;
  const summary = state.student.summary || {};

  nodes.studentProfileCard.innerHTML = directoryFactsMarkup([
    { label: "Email", value: profile.email },
    { label: "Телефон", value: profile.phone },
    { label: "Дата рождения", value: profile.birthDate },
    { label: "Дата регистрации", value: profile.registrationDate },
    {
      label: "Следующее занятие",
      value: summary.nextLesson || "Пока не назначено",
      wide: true,
    },
    {
      label: "Активный остаток",
      value: `${summary.lessonsLeftActive || 0} занятий`,
    },
  ]);
}

function renderStudentSchedule() {
  if (!state.student.schedule.length) {
    nodes.studentScheduleList.innerHTML = emptyState("В персональном расписании пока нет занятий.");
    return;
  }

  nodes.studentScheduleList.innerHTML = state.student.schedule
    .map((lesson) => {
      const badge = studentScheduleBadge(lesson);

      return `
        <article class="entity-card">
          <div class="entity-card-header">
            <div>
              <strong>${escapeHtml(lesson.groupName)}</strong>
              <span>${escapeHtml(
                `${lesson.lessonDate} • ${lesson.startTime} - ${lesson.endTime}`
              )}</span>
            </div>
            <span class="${badge.className}">${escapeHtml(badge.text)}</span>
          </div>
          <div class="entity-meta">
            <div><span class="label">Преподаватель</span><strong>${escapeHtml(lesson.teacherName)}</strong></div>
            <div><span class="label">Зал</span><strong>${escapeHtml(lesson.room)}</strong></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderStudentSubscriptions() {
  if (!state.student.subscriptions.length) {
    nodes.studentSubscriptionsList.innerHTML = emptyState("У ученика пока нет абонементов.");
    return;
  }

  nodes.studentSubscriptionsList.innerHTML = state.student.subscriptions
    .map(
      (subscription) => `
        <article class="entity-card">
          <div class="entity-card-header">
            <div>
              <strong>${escapeHtml(`${subscription.lessonsLeft}/${subscription.lessonsTotal} занятий`)}</strong>
              <span>${escapeHtml(`${subscription.startDate} - ${subscription.endDate}`)}</span>
            </div>
            <span class="${badgeClassBySubscriptionStatus(subscription.status)}">${escapeHtml(
              formatSubscriptionStatus(subscription.status)
            )}</span>
          </div>
          <div class="entity-meta">
            <div><span class="label">Остаток</span><strong>${escapeHtml(subscription.lessonsLeft)}</strong></div>
            <div><span class="label">До окончания</span><strong>${escapeHtml(`${subscription.daysRemaining} дн.`)}</strong></div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderStudentAttendance() {
  if (!state.student.attendance.length) {
    nodes.studentAttendanceList.innerHTML = emptyState(
      "История появится после первых отмеченных занятий."
    );
    return;
  }

  nodes.studentAttendanceList.innerHTML = state.student.attendance
    .map((item) => {
      const badgeClass = item.attendanceStatus ? "badge badge-success" : "badge badge-muted";
      const badgeText = item.attendanceStatus ? "Присутствовал" : "Отсутствовал";
      const subscriptionText =
        item.lessonsTotal && item.lessonsLeft !== null
          ? `${item.lessonsLeft}/${item.lessonsTotal} занятий осталось`
          : "Без абонемента";

      return `
        <article class="entity-card">
          <div class="entity-card-header">
            <div>
              <strong>${escapeHtml(item.groupName)}</strong>
              <span>${escapeHtml(
                `${item.lessonDate} • ${item.startTime} - ${item.endTime} • ${item.room}`
              )}</span>
            </div>
            <span class="${badgeClass}">${escapeHtml(badgeText)}</span>
          </div>
          <div class="entity-meta">
            <div><span class="label">Преподаватель</span><strong>${escapeHtml(item.teacherName)}</strong></div>
            <div><span class="label">Абонемент</span><strong>${escapeHtml(subscriptionText)}</strong></div>
            <div><span class="label">Отмечено</span><strong>${escapeHtml(item.markedAt)}</strong></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderStudentWorkspace() {
  const summary = state.student.summary || {
    groupsCount: 0,
    scheduleCount: 0,
    upcomingCount: 0,
    attendedCount: 0,
    activeSubscriptionsCount: 0,
    lessonsLeftActive: 0,
    nextLesson: null,
  };

  nodes.studentSummary.innerHTML = summaryCardsMarkup([
    {
      label: "Мои группы",
      value: summary.groupsCount,
      hint: "активных направлений",
    },
    {
      label: "Предстоящие занятия",
      value: summary.upcomingCount,
      hint: `из ${summary.scheduleCount} в расписании`,
    },
    {
      label: "Активные абонементы",
      value: summary.activeSubscriptionsCount,
      hint: `остаток ${summary.lessonsLeftActive} занятий`,
    },
    {
      label: "Посещено",
      value: summary.attendedCount,
      hint: summary.nextLesson ? `следующее: ${summary.nextLesson}` : "новых занятий пока нет",
    },
  ]);

  renderStudentProfile();
  renderStudentGroups();
  renderStudentSchedule();
  renderStudentSubscriptions();
  renderStudentAttendance();
  setStudentView(state.student.ui.view);
  nodes.studentWorkspace.classList.remove("hidden");
}

async function loadStudentWorkspace() {
  const { response, payload } = await apiRequest("/api/student/bootstrap");

  if (!response.ok) {
    nodes.studentWorkspace.classList.add("hidden");
    setMessage(
      nodes.studentMessage,
      payload.error || "Не удалось загрузить кабинет ученика.",
      "error"
    );
    return;
  }

  state.student.profile = payload.profile;
  state.student.groups = payload.groups;
  state.student.schedule = payload.schedule;
  state.student.subscriptions = payload.subscriptions;
  state.student.attendance = payload.attendance;
  state.student.summary = payload.summary;
  renderStudentWorkspace();
}

function attachStudentEvents() {
  if (!nodes.studentViewButtons.length) {
    return;
  }

  nodes.studentViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setStudentView(button.dataset.studentView);
    });
  });
}

if (nodes.loginForm) {
  nodes.loginForm.addEventListener("submit", login);
}

if (nodes.logoutButton) {
  nodes.logoutButton.addEventListener("click", logout);
}

attachAdminEvents();
attachTeacherEvents();
attachStudentEvents();

initializePage();
