(function () {
  const API_BASE = "https://institute-project-mu.vercel.app";
  const AUTH_KEY = "sci_auth";
  const CATALOG_KEY = "sci_catalog_settings";

  const DEFAULT_CATALOG = {
    certifications: [
      "Computer Fundamentals",
      "D.C.A",
      "ADCA",
      "Tally",
      "Stenography",
      "Computer Typing (Hindi English)",
    ],
    services: [
      "Colour Printout",
      "Photo Copy",
      "Online Bill Payment",
      "Lamination",
      "Passport Size Photo",
      "Spiral",
      "Railway & Air Ticket Booking",
    ],
  };

  const COURSE_VISUALS = [
    {
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
      instructor: "Prof. Arvind Sharma",
      duration: "3 Months",
    },
    {
      image:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
      instructor: "Ms. Meera Gupta",
      duration: "6 Months",
    },
    {
      image:
        "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80",
      avatar:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
      instructor: "Mr. Sanjay Verma",
      duration: "12 Months",
    },
  ];

  const PAGE = document.body.getAttribute("data-page") || "";

  function getAuth() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function setAuth(payload) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  }

  function clearAuth() {
    localStorage.removeItem(AUTH_KEY);
  }

  function getCatalogSettings() {
    try {
      const raw = localStorage.getItem(CATALOG_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed) return JSON.parse(JSON.stringify(DEFAULT_CATALOG));

      return {
        certifications: Array.isArray(parsed.certifications)
          ? parsed.certifications
          : JSON.parse(JSON.stringify(DEFAULT_CATALOG.certifications)),
        services: Array.isArray(parsed.services)
          ? parsed.services
          : JSON.parse(JSON.stringify(DEFAULT_CATALOG.services)),
      };
    } catch (err) {
      return JSON.parse(JSON.stringify(DEFAULT_CATALOG));
    }
  }

  function setCatalogSettings(settings) {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(settings));
  }

  function renderCatalogLists() {
    const certList = document.getElementById("certificationList");
    const serviceList = document.getElementById("servicesList");
    if (!certList || !serviceList) return;

    const settings = getCatalogSettings();
    certList.innerHTML = settings.certifications
      .map(function (item) {
        return (
          '<li class="flex items-center gap-3"><span class="check-chip material-symbols-outlined">check</span>' +
          item +
          "</li>"
        );
      })
      .join("");

    serviceList.innerHTML = settings.services
      .map(function (item) {
        return (
          '<li class="flex items-center gap-3"><span class="check-chip material-symbols-outlined">check</span>' +
          item +
          "</li>"
        );
      })
      .join("");
  }

  function notify(message, type) {
    const wrap = document.createElement("div");
    wrap.className = "fixed top-24 right-6 z-[100]";
    const bg = type === "error" ? "bg-red-600" : "bg-primary";
    wrap.innerHTML =
      '<div class="' +
      bg +
      ' text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold">' +
      message +
      "</div>";
    document.body.appendChild(wrap);
    setTimeout(function () {
      wrap.remove();
    }, 2500);
  }

  async function api(path, options) {
    const auth = getAuth();
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      (options && options.headers) || {}
    );

    if (auth && auth.token) {
      headers.Authorization = "Bearer " + auth.token;
    }

    const response = await fetch(API_BASE + path, {
      method: (options && options.method) || "GET",
      headers: headers,
      body: options && options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  function redirectByRole(role) {
    if (role === "admin") {
      window.location.href = "./admin-dashboard.html";
      return;
    }
    window.location.href = "./student-dashboard.html";
  }

  function guardRoute() {
    const auth = getAuth();
    const protectedPages = [
      "student-dashboard",
      "admin-dashboard",
      "courses",
      "attendance",
    ];

    if (protectedPages.indexOf(PAGE) !== -1 && (!auth || !auth.token || !auth.user)) {
      window.location.href = "./login.html";
      return;
    }

    if (PAGE === "admin-dashboard" && auth && auth.user && auth.user.role !== "admin") {
      window.location.href = "./student-dashboard.html";
    }
  }

  function bindLogout() {
    const targets = document.querySelectorAll("[data-logout]");
    targets.forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        clearAuth();
        window.location.href = "./login.html";
      });
    });
  }

  function applyUserName() {
    const auth = getAuth();
    if (!auth || !auth.user) return;

    const userEls = document.querySelectorAll("[data-user-name]");
    userEls.forEach(function (el) {
      el.textContent = auth.user.name || "User";
    });
  }

  function initLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    let selectedRole = "student";
    const roleBtns = document.querySelectorAll("[data-role]");
    roleBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedRole = btn.getAttribute("data-role") || "student";
        roleBtns.forEach(function (b) {
          b.classList.remove("bg-surface-container-lowest", "shadow-sm", "text-primary", "font-bold");
          b.classList.add("text-on-surface-variant", "font-medium");
        });
        btn.classList.add("bg-surface-container-lowest", "shadow-sm", "text-primary", "font-bold");
        btn.classList.remove("text-on-surface-variant", "font-medium");
      });
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      try {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: { email: email, password: password },
        });

        if (!data.user || (selectedRole && data.user.role !== selectedRole)) {
          notify("Role mismatch. Please select correct role.", "error");
          return;
        }

        setAuth({ token: data.token, user: data.user });
        notify("Login successful", "success");
        redirectByRole(data.user.role);
      } catch (err) {
        notify(err.message, "error");
      }
    });
  }

  function initRegister() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const role = document.querySelector("input[name='role']:checked");

      try {
        const data = await api("/api/auth/register", {
          method: "POST",
          body: {
            name: name,
            email: email,
            password: password,
            role: role ? role.value : "student",
          },
        });

        if (data.token && data.user) {
          setAuth({ token: data.token, user: data.user });
          notify("Registration successful", "success");
          redirectByRole(data.user.role);
          return;
        }

        notify("Registration successful. Please login.", "success");
        window.location.href = "./login.html";
      } catch (err) {
        notify(err.message, "error");
      }
    });
  }

  async function initCourses() {
    const grid = document.getElementById("coursesGrid");
    if (!grid) return;

    const template = document.getElementById("courseCardTemplate");
    if (!template) return;

    renderCatalogLists();

    const auth = getAuth();
    const isAdmin = Boolean(auth && auth.user && auth.user.role === "admin");
    initCatalogAdminControls(isAdmin);

    try {
      const result = await api("/api/courses");
      const courses = result.data || result.courses || [];

      if (!courses.length) {
        return;
      }

      grid.innerHTML = "";
      courses.forEach(function (course, index) {
        const card = template.cloneNode(true);
        card.removeAttribute("id");
        card.classList.remove("hidden");

        const title = card.querySelector("[data-course-title]");
        const desc = card.querySelector("[data-course-description]");
        const progress = card.querySelector("[data-course-progress]");
        const bar = card.querySelector("[data-course-progress-bar]");
        const duration = card.querySelector("[data-course-duration]");
        const instructor = card.querySelector("[data-course-instructor]");
        const image = card.querySelector("[data-course-image]");
        const avatar = card.querySelector("[data-course-avatar]");

        const visual = COURSE_VISUALS[index % COURSE_VISUALS.length];
        const randomProgress = Math.max(10, Math.min(98, Math.floor(Math.random() * 95)));

        if (title) title.textContent = course.title || "Untitled Course";
        if (desc) desc.textContent = course.description || "No description";
        if (progress) progress.textContent = randomProgress + "%";
        if (bar) bar.style.width = randomProgress + "%";
        if (duration) duration.textContent = visual.duration;
        if (instructor) instructor.textContent = visual.instructor;
        if (image) image.src = visual.image;
        if (avatar) avatar.src = visual.avatar;

        grid.appendChild(card);
      });
    } catch (err) {
      notify("Unable to load courses", "error");
    }
  }

  function initCatalogAdminControls(isAdmin) {
    const panel = document.getElementById("catalogAdminPanel");
    const courseForm = document.getElementById("adminCourseForm");
    const serviceForm = document.getElementById("adminServiceForm");

    if (!panel || !courseForm || !serviceForm) return;
    if (!isAdmin) {
      panel.classList.add("hidden");
      return;
    }

    panel.classList.remove("hidden");

    if (panel.dataset.bound === "true") {
      return;
    }
    panel.dataset.bound = "true";

    courseForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const title = document.getElementById("adminCourseTitle").value.trim();
      const instructor = document.getElementById("adminCourseInstructor").value.trim();
      const duration = document.getElementById("adminCourseDuration").value.trim();
      const price = Number(document.getElementById("adminCoursePrice").value || 0);
      const description = document.getElementById("adminCourseDescription").value.trim();

      if (!title || !instructor || !duration || !description) {
        notify("Please fill all course fields", "error");
        return;
      }

      try {
        await api("/api/courses", {
          method: "POST",
          body: { title: title, description: description, price: price },
        });

        notify("Course added successfully", "success");
        courseForm.reset();
        initCourses();
      } catch (err) {
        notify(err.message || "Failed to add course", "error");
      }
    });

    serviceForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const type = document.getElementById("adminServiceType").value;
      const name = document.getElementById("adminServiceName").value.trim();
      if (!name) {
        notify("Please enter item name", "error");
        return;
      }

      const settings = getCatalogSettings();
      const bucket = type === "services" ? "services" : "certifications";
      settings[bucket].push(name);
      setCatalogSettings(settings);
      renderCatalogLists();
      serviceForm.reset();
      notify("Catalog list updated", "success");
    });
  }

  async function initStudentDashboard() {
    if (PAGE !== "student-dashboard") return;

    try {
      const auth = getAuth();
      if (auth && auth.user && auth.user.name) {
        const welcome = document.getElementById("welcomeName");
        if (welcome) {
          welcome.textContent = auth.user.name;
        }
      }

      const result = await api("/api/courses");
      const courses = result.data || [];
      const enrolled = document.getElementById("enrolledCourses");
      if (enrolled && courses.length) {
        const firstTwo = courses.slice(0, 2);
        const labels = enrolled.querySelectorAll("[data-enrolled-title]");
        labels.forEach(function (label, idx) {
          if (firstTwo[idx]) {
            label.textContent = firstTwo[idx].title;
          }
        });
      }
    } catch (err) {
      notify("Failed to load dashboard data", "error");
    }
  }

  function renderAdminTableRows(items, mapper) {
    return items
      .map(function (item, index) {
        return mapper(item, index);
      })
      .join("");
  }

  async function loadAdminData() {
    const usersBody = document.getElementById("usersTableBody");
    const requestsBody = document.getElementById("requestsTableBody");
    if (!usersBody || !requestsBody) return;

    try {
      const usersRes = await api("/api/admin/users");
      const contactsRes = await api("/api/admin/requests");

      const users = usersRes.data || [];
      const contacts = contactsRes.data || [];

      const usersStat = document.getElementById("totalUsersStat");
      const requestsStat = document.getElementById("totalRequestsStat");
      if (usersStat) usersStat.textContent = String(users.length);
      if (requestsStat) requestsStat.textContent = String(contacts.length);

      usersBody.innerHTML = renderAdminTableRows(users, function (u, i) {
        return (
          '<tr class="border-t border-surface-variant/40">' +
          '<td class="py-3 px-4 text-sm font-semibold">' +
          (i + 1) +
          "</td>" +
          '<td class="py-3 px-4 text-sm">' +
          (u.name || "-") +
          "</td>" +
          '<td class="py-3 px-4 text-sm">' +
          (u.email || "-") +
          "</td>" +
          '<td class="py-3 px-4 text-sm uppercase font-semibold">' +
          (u.role || "student") +
          "</td>" +
          "</tr>"
        );
      });

      requestsBody.innerHTML = renderAdminTableRows(contacts, function (c, i) {
        return (
          '<tr class="border-t border-surface-variant/40">' +
          '<td class="py-3 px-4 text-sm font-semibold">' +
          (i + 1) +
          "</td>" +
          '<td class="py-3 px-4 text-sm">' +
          (c.name || "-") +
          "</td>" +
          '<td class="py-3 px-4 text-sm">' +
          (c.email || "-") +
          "</td>" +
          '<td class="py-3 px-4 text-sm line-clamp-1 max-w-[220px]">' +
          (c.message || "-") +
          "</td>" +
          '<td class="py-3 px-4 text-sm uppercase font-semibold">' +
          (c.status || "new") +
          "</td>" +
          "</tr>"
        );
      });
    } catch (err) {
      notify(err.message || "Admin data fetch failed", "error");
    }
  }

  function initAdminDashboard() {
    if (PAGE !== "admin-dashboard") return;

    loadAdminData();

    const refreshMs = 30000;
    setInterval(async function () {
      await loadAdminData();
      notify("Dashboard data auto-refreshed", "success");
    }, refreshMs);
  }

  function initRouteRedirects() {
    const links = document.querySelectorAll("[data-route]");
    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        const to = a.getAttribute("data-route");
        if (to) window.location.href = to;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    guardRoute();
    bindLogout();
    applyUserName();
    initRouteRedirects();
    initLogin();
    initRegister();
    initStudentDashboard();
    initAdminDashboard();
    initCourses();
  });
})();
