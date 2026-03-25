(function () {
  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://institute-project-mu.vercel.app";
  const AUTH_KEY = "sci_auth";
  const CATALOG_KEY = "sci_catalog_settings";
  const SHELL_PAGES = ["student-dashboard", "admin-dashboard", "courses", "attendance"];

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

  let PAGE = document.body.getAttribute("data-page") || "";
  let adminRefreshTimer = null;
  let coursesSearchTimer = null;

  const DEFAULT_COURSE_IMAGE =
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";

  const coursesState = {
    items: [],
    page: 1,
    limit: 6,
    totalPages: 1,
    total: 0,
    search: "",
    duration: "",
    isAdmin: false,
  };

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
    const isFormData = options && options.body instanceof FormData;
    const headers = Object.assign(
      isFormData ? {} : { "Content-Type": "application/json" },
      (options && options.headers) || {}
    );

    if (auth && auth.token) {
      headers.Authorization = "Bearer " + auth.token;
    }

    const response = await fetch(API_BASE + path, {
      method: (options && options.method) || "GET",
      headers: headers,
      body:
        options && options.body
          ? isFormData
            ? options.body
            : JSON.stringify(options.body)
          : undefined,
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

  function getPageNameFromRoute(route) {
    if (!route) return "";
    const clean = route.split("?")[0].split("#")[0];
    const last = clean.split("/").pop() || "";
    return last.replace(/\.html$/i, "");
  }

  function updateShellNavState() {
    if (SHELL_PAGES.indexOf(PAGE) === -1) return;

    const navLinks = document.querySelectorAll("[data-route]");
    navLinks.forEach(function (link) {
      const target = getPageNameFromRoute(link.getAttribute("data-route") || "");
      const active = target === PAGE;
      const isMobile = link.classList.contains("flex-col");

      if (isMobile) {
        if (active) {
          link.classList.add("bg-amber-100", "text-blue-900", "rounded-2xl", "px-5", "py-2", "scale-110");
          link.classList.remove("text-slate-400");
        } else {
          link.classList.remove("bg-amber-100", "text-blue-900", "rounded-2xl", "px-5", "py-2", "scale-110");
          link.classList.add("text-slate-400");
        }
        return;
      }

      if (active) {
        link.classList.add("border-l-4", "border-amber-400", "bg-amber-50", "text-blue-900");
        link.classList.remove("text-slate-600", "text-slate-500");
      } else {
        link.classList.remove("border-l-4", "border-amber-400", "bg-amber-50", "text-blue-900");
        if (!link.classList.contains("text-slate-400")) {
          link.classList.add("text-slate-600");
        }
      }
    });
  }

  async function swapMainContent(route) {
    const currentMain = document.querySelector("main");
    if (!currentMain) {
      window.location.href = route;
      return;
    }

    const response = await fetch(route, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load page");
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nextMain = doc.querySelector("main");

    if (!nextMain) {
      window.location.href = route;
      return;
    }

    currentMain.innerHTML = nextMain.innerHTML;
    PAGE = getPageNameFromRoute(route);
    document.body.setAttribute("data-page", PAGE);
    window.history.pushState({}, "", route);
    initializePageFeatures();
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

  function toSafeProgress(progress) {
    const num = Number(progress);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, num));
  }

  function formatCreatedDate(value) {
    if (!value) return "--";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "--";
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function buildCoursePayloadFromForm() {
    return {
      title: (document.getElementById("courseTitleInput")?.value || "").trim(),
      description: (document.getElementById("courseDescriptionInput")?.value || "").trim(),
      instructor: (document.getElementById("courseInstructorInput")?.value || "").trim(),
      duration: (document.getElementById("courseDurationInput")?.value || "").trim(),
      image_url: (document.getElementById("courseImageUrlInput")?.value || "").trim(),
      progress: toSafeProgress(document.getElementById("courseProgressInput")?.value || 0),
    };
  }

  function openCourseModal(mode, course) {
    const modal = document.getElementById("courseModal");
    const title = document.getElementById("courseModalTitle");
    const idInput = document.getElementById("courseIdInput");
    const imagePreview = document.getElementById("courseImagePreview");
    const form = document.getElementById("courseModalForm");
    if (!modal || !title || !idInput || !imagePreview || !form) return;

    form.reset();
    idInput.value = "";
    title.textContent = mode === "edit" ? "Edit Course" : "Add Course";

    if (mode === "edit" && course) {
      idInput.value = course._id || "";
      const titleInput = document.getElementById("courseTitleInput");
      const descriptionInput = document.getElementById("courseDescriptionInput");
      const instructorInput = document.getElementById("courseInstructorInput");
      const durationInput = document.getElementById("courseDurationInput");
      const imageUrlInput = document.getElementById("courseImageUrlInput");
      const progressInput = document.getElementById("courseProgressInput");

      if (titleInput) titleInput.value = course.title || "";
      if (descriptionInput) descriptionInput.value = course.description || "";
      if (instructorInput) instructorInput.value = course.instructor || "";
      if (durationInput) durationInput.value = course.duration || "";
      if (imageUrlInput) imageUrlInput.value = course.image_url || "";
      if (progressInput) progressInput.value = toSafeProgress(course.progress || 0);
      imagePreview.src = course.image_url || DEFAULT_COURSE_IMAGE;
    } else {
      imagePreview.src = DEFAULT_COURSE_IMAGE;
    }

    modal.classList.remove("hidden");
  }

  function closeCourseModal() {
    const modal = document.getElementById("courseModal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  function renderCoursesGrid() {
    const grid = document.getElementById("coursesGrid");
    const template = document.getElementById("courseCardTemplate");
    const emptyState = document.getElementById("coursesEmptyState");
    if (!grid || !template || !emptyState) return;

    grid.innerHTML = "";

    if (!coursesState.items.length) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    coursesState.items.forEach(function (course) {
      const card = template.cloneNode(true);
      const progressValue = toSafeProgress(course.progress || 0);

      card.removeAttribute("id");
      card.classList.remove("hidden");
      card.dataset.courseId = course._id || "";

      const title = card.querySelector("[data-course-title]");
      const desc = card.querySelector("[data-course-description]");
      const progress = card.querySelector("[data-course-progress]");
      const bar = card.querySelector("[data-course-progress-bar]");
      const duration = card.querySelector("[data-course-duration]");
      const instructor = card.querySelector("[data-course-instructor]");
      const image = card.querySelector("[data-course-image]");
      const avatar = card.querySelector("[data-course-avatar]");
      const createdAt = card.querySelector("[data-course-created-at]");
      const adminControls = card.querySelector("[data-admin-card-controls]");
      const studentOnly = card.querySelector("[data-course-student-only]");
      const editBtn = card.querySelector("[data-edit-course]");
      const deleteBtn = card.querySelector("[data-delete-course]");

      if (title) title.textContent = course.title || "Untitled Course";
      if (desc) desc.textContent = course.description || "No description available";
      if (progress) progress.textContent = progressValue + "%";
      if (bar) bar.style.width = progressValue + "%";
      if (duration) duration.textContent = course.duration || "--";
      if (instructor) instructor.textContent = course.instructor || "--";
      if (image) image.src = course.image_url || DEFAULT_COURSE_IMAGE;
      if (avatar) avatar.src = DEFAULT_COURSE_IMAGE;
      if (createdAt) createdAt.textContent = "Created: " + formatCreatedDate(course.createdAt);

      if (coursesState.isAdmin) {
        if (adminControls) {
          adminControls.classList.remove("hidden");
          adminControls.classList.add("flex");
        }
        if (studentOnly) {
          studentOnly.classList.add("hidden");
        }
      } else if (adminControls) {
        adminControls.classList.add("hidden");
        if (studentOnly) {
          studentOnly.classList.remove("hidden");
        }
      }

      if (editBtn && coursesState.isAdmin) {
        editBtn.addEventListener("click", function () {
          openCourseModal("edit", course);
        });
      }

      if (deleteBtn && coursesState.isAdmin) {
        deleteBtn.addEventListener("click", async function () {
          const ok = window.confirm("Are you sure you want to delete this course?");
          if (!ok) return;

          const currentItems = coursesState.items.slice();
          coursesState.items = coursesState.items.filter(function (item) {
            return item._id !== course._id;
          });
          renderCoursesGrid();

          try {
            await api("/api/courses/" + course._id, { method: "DELETE" });
            notify("Course deleted", "success");
          } catch (err) {
            coursesState.items = currentItems;
            renderCoursesGrid();
            notify(err.message || "Delete failed", "error");
          }
        });
      }

      const continueBtn = card.querySelector("[data-course-continue]");
      if (continueBtn && !coursesState.isAdmin) {
        continueBtn.addEventListener("click", function () {
          notify("Continuing " + (course.title || "course"), "success");
        });
      }

      grid.appendChild(card);
    });
  }

  function renderCoursePagination() {
    const prevBtn = document.getElementById("coursesPrevPage");
    const nextBtn = document.getElementById("coursesNextPage");
    const pageInfo = document.getElementById("coursesPageInfo");
    if (!prevBtn || !nextBtn || !pageInfo) return;

    const current = coursesState.page;
    const totalPages = coursesState.totalPages || 1;

    prevBtn.disabled = current <= 1;
    nextBtn.disabled = current >= totalPages;
    pageInfo.textContent = "Page " + current + " of " + totalPages;
  }

  async function fetchAndRenderCourses() {
    const skeleton = document.getElementById("coursesSkeleton");
    const grid = document.getElementById("coursesGrid");
    if (skeleton) skeleton.classList.remove("hidden");
    if (grid) grid.classList.add("hidden");

    try {
      const params = new URLSearchParams();
      params.set("page", String(coursesState.page));
      params.set("limit", String(coursesState.limit));
      if (coursesState.search) params.set("search", coursesState.search);
      if (coursesState.duration) params.set("duration", coursesState.duration);

      const result = await api("/api/courses?" + params.toString());
      coursesState.items = Array.isArray(result.data) ? result.data : [];
      coursesState.totalPages = result.pagination?.totalPages || 1;
      coursesState.total = result.pagination?.total || coursesState.items.length;

      renderCoursesGrid();
      renderCoursePagination();
    } catch (err) {
      coursesState.items = [];
      renderCoursesGrid();
      renderCoursePagination();
      notify(err.message || "Unable to load courses", "error");
    } finally {
      if (skeleton) skeleton.classList.add("hidden");
      if (grid) grid.classList.remove("hidden");
    }
  }

  function bindCourseManagementEvents() {
    const addBtn = document.getElementById("addCourseButton");
    const floatingAddBtn = document.getElementById("floatingAddCourseButton");
    const closeBtn = document.getElementById("closeCourseModal");
    const cancelBtn = document.getElementById("cancelCourseModal");
    const modal = document.getElementById("courseModal");
    const form = document.getElementById("courseModalForm");
    const imageUrlInput = document.getElementById("courseImageUrlInput");
    const imageFileInput = document.getElementById("courseImageFileInput");
    const imagePreview = document.getElementById("courseImagePreview");
    const searchInput = document.getElementById("courseSearchInput");
    const durationFilter = document.getElementById("courseDurationFilter");
    const prevBtn = document.getElementById("coursesPrevPage");
    const nextBtn = document.getElementById("coursesNextPage");

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        openCourseModal("add");
      });
    }

    if (floatingAddBtn) {
      floatingAddBtn.addEventListener("click", function () {
        openCourseModal("add");
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeCourseModal);
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeCourseModal);
    }

    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) {
          closeCourseModal();
        }
      });
    }

    if (imageUrlInput && imagePreview) {
      imageUrlInput.addEventListener("input", function () {
        const value = imageUrlInput.value.trim();
        imagePreview.src = value || DEFAULT_COURSE_IMAGE;
      });
    }

    if (imageFileInput && imagePreview) {
      imageFileInput.addEventListener("change", function () {
        const file = imageFileInput.files && imageFileInput.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
          notify("Image must be 10MB or less", "error");
          imageFileInput.value = "";
          return;
        }
        imagePreview.src = URL.createObjectURL(file);
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        if (coursesSearchTimer) {
          clearTimeout(coursesSearchTimer);
        }
        coursesSearchTimer = setTimeout(function () {
          coursesState.search = searchInput.value.trim();
          coursesState.page = 1;
          fetchAndRenderCourses();
        }, 300);
      });
    }

    if (durationFilter) {
      durationFilter.addEventListener("change", function () {
        coursesState.duration = durationFilter.value;
        coursesState.page = 1;
        fetchAndRenderCourses();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (coursesState.page <= 1) return;
        coursesState.page -= 1;
        fetchAndRenderCourses();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (coursesState.page >= coursesState.totalPages) return;
        coursesState.page += 1;
        fetchAndRenderCourses();
      });
    }

    if (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const id = (document.getElementById("courseIdInput")?.value || "").trim();
        const payload = buildCoursePayloadFromForm();
        const imageFileInput = document.getElementById("courseImageFileInput");
        const imageFile = imageFileInput && imageFileInput.files ? imageFileInput.files[0] : null;

        if (imageFile && imageFile.size > 10 * 1024 * 1024) {
          notify("Image must be 10MB or less", "error");
          return;
        }

        if (!payload.title || !payload.description || !payload.instructor || !payload.duration) {
          notify("Please fill all required fields", "error");
          return;
        }

        if (!coursesState.isAdmin) {
          notify("Only admin can manage courses", "error");
          return;
        }

        const saveBtn = document.getElementById("saveCourseButton");
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = "Saving...";
        }

        try {
          let requestBody = payload;
          if (imageFile) {
            const formData = new FormData();
            formData.append("title", payload.title);
            formData.append("description", payload.description);
            formData.append("instructor", payload.instructor);
            formData.append("duration", payload.duration);
            formData.append("progress", String(payload.progress));
            if (payload.image_url) {
              formData.append("image_url", payload.image_url);
            }
            formData.append("image", imageFile);
            requestBody = formData;
          }

          if (id) {
            await api("/api/courses/" + id, {
              method: "PUT",
              body: requestBody,
            });
            notify("Course updated", "success");
          } else {
            const optimistic = {
              _id: "temp-" + Date.now(),
              createdAt: new Date().toISOString(),
              ...payload,
            };
            coursesState.items = [optimistic].concat(coursesState.items);
            renderCoursesGrid();

            const created = await api("/api/courses", {
              method: "POST",
              body: requestBody,
            });

            const createdCourse = created.data;
            coursesState.items = coursesState.items.map(function (item) {
              return item._id === optimistic._id ? createdCourse : item;
            });
            notify("Course created", "success");
          }

          closeCourseModal();
          await fetchAndRenderCourses();
        } catch (err) {
          notify(err.message || "Unable to save course", "error");
          await fetchAndRenderCourses();
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Course";
          }
        }
      });
    }
  }

  async function initCourses() {
    const grid = document.getElementById("coursesGrid");
    if (!grid) return;

    const auth = getAuth();
    const isAdmin = Boolean(auth && auth.user && auth.user.role === "admin");
    const sidebar = document.getElementById("adminCoursesSidebar");
    const main = document.getElementById("coursesMain");
    const addBtn = document.getElementById("addCourseButton");
    const floatingAddBtn = document.getElementById("floatingAddCourseButton");
    const pageTitle = document.getElementById("coursesPageTitle");
    const pageSubtitle = document.getElementById("coursesPageSubtitle");

    if (sidebar) {
      if (isAdmin) {
        sidebar.classList.remove("hidden");
      } else {
        sidebar.classList.add("hidden");
      }
    }

    if (main) {
      main.style.marginLeft = isAdmin ? "" : "0";
    }

    if (addBtn) {
      if (isAdmin) {
        addBtn.classList.remove("hidden");
        addBtn.classList.add("inline-flex");
      } else {
        addBtn.classList.add("hidden");
      }
    }

    if (floatingAddBtn) {
      if (isAdmin) {
        floatingAddBtn.classList.remove("hidden");
        floatingAddBtn.classList.add("flex");
      } else {
        floatingAddBtn.classList.add("hidden");
      }
    }

    if (pageTitle) {
      pageTitle.textContent = isAdmin ? "Courses Management" : "My Courses";
    }
    if (pageSubtitle) {
      pageSubtitle.textContent = isAdmin
        ? "Manage all courses with full admin control: add, edit, and delete."
        : "Continue learning with your enrolled courses and track your progress.";
    }

    coursesState.isAdmin = isAdmin;

    const root = document.getElementById("coursesMain") || document.querySelector("main");
    if (root && root.dataset.coursesBound !== "true") {
      bindCourseManagementEvents();
      root.dataset.coursesBound = "true";
    }

    await fetchAndRenderCourses();
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
    if (adminRefreshTimer) {
      clearInterval(adminRefreshTimer);
      adminRefreshTimer = null;
    }

    if (PAGE !== "admin-dashboard") return;

    const yearEl = document.getElementById("dashboardCurrentYear");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    loadAdminData();

    const refreshMs = 30000;
    adminRefreshTimer = setInterval(async function () {
      await loadAdminData();
      notify("Dashboard data auto-refreshed", "success");
    }, refreshMs);
  }

  function initRouteRedirects() {
    if (document.body.dataset.routeBound === "true") return;
    document.body.dataset.routeBound = "true";

    document.addEventListener("click", function (e) {
      const link = e.target.closest("[data-route]");
      if (!link) return;

      e.preventDefault();
      const to = link.getAttribute("data-route");
      if (!to) return;

      const targetPage = getPageNameFromRoute(to);
      if (SHELL_PAGES.indexOf(PAGE) !== -1 && SHELL_PAGES.indexOf(targetPage) !== -1) {
        swapMainContent(to).catch(function () {
          window.location.href = to;
        });
        return;
      }

      window.location.href = to;
    });
  }

  function initializePageFeatures() {
    guardRoute();
    bindLogout();
    applyUserName();
    updateShellNavState();
    initLogin();
    initRegister();
    initStudentDashboard();
    initAdminDashboard();
    initCourses();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initRouteRedirects();
    initializePageFeatures();
  });
})();
