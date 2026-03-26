(function () {
  const DEPLOYED_API_ORIGIN = "https://institute-project-mu.vercel.app";
  const API_BASE_STORAGE_KEY = "sci_api_base";
  const AUTH_KEY = "sci_auth";
  const CATALOG_KEY = "sci_catalog_settings";
  const PROFILE_GENDER_KEY = "sci_profile_gender";
  const SERVICE_DETAIL_PAGES = ["printout", "photocopy", "lamination", "form-apply"];
  const SHELL_PAGES = [
    "student-dashboard",
    "admin-dashboard",
    "courses",
    "attendance",
    "student-settings",
    "services",
    ...SERVICE_DETAIL_PAGES,
  ];
  const AVATAR_BY_GENDER = {
    male: "https://img.icons8.com/color/96/administrator-male.png",
    female: "https://img.icons8.com/color/96/businesswoman.png",
    other: "https://img.icons8.com/color/96/user.png",
  };

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
    selectedCourse: "",
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

  function normalizeGender(value) {
    const v = String(value || "").trim().toLowerCase();
    if (!v) return "";
    if (v === "m" || v === "male" || v === "man" || v === "boy") return "male";
    if (v === "f" || v === "female" || v === "woman" || v === "girl") return "female";
    return "other";
  }

  function normalizeRole(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getEffectiveGender() {
    const auth = getAuth();
    const fromAuth = normalizeGender(auth && auth.user ? auth.user.gender : "");
    if (fromAuth) return fromAuth;

    const fromStorage = normalizeGender(localStorage.getItem(PROFILE_GENDER_KEY));
    return fromStorage || "other";
  }

  function getAvatarForGender(gender) {
    return AVATAR_BY_GENDER[normalizeGender(gender)] || AVATAR_BY_GENDER.other;
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

  function normalizeBase(base) {
    if (!base) return "";
    return String(base).trim().replace(/\/+$/, "").replace(/\/api$/i, "");
  }

  function getApiBaseCandidates() {
    const candidates = [];
    const fromStorage = normalizeBase(localStorage.getItem(API_BASE_STORAGE_KEY));
    if (fromStorage) candidates.push(fromStorage);

    const fromGlobal = normalizeBase(window.__API_BASE__);
    if (fromGlobal) candidates.push(fromGlobal);

    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      candidates.push("http://localhost:5000");
    }

    candidates.push(normalizeBase(window.location.origin));
    candidates.push(DEPLOYED_API_ORIGIN);

    return Array.from(new Set(candidates.filter(Boolean)));
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

    const requestBody =
      options && options.body
        ? isFormData
          ? options.body
          : JSON.stringify(options.body)
        : undefined;

    const method = (options && options.method) || "GET";
    const bases = getApiBaseCandidates();
    let lastNetworkError = null;

    for (const base of bases) {
      try {
        const response = await fetch(base + path, {
          method,
          headers,
          body: requestBody,
        });

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          if (response.status === 404) {
            continue;
          }
          throw new Error(data.message || `API error (${response.status})`);
        }

        localStorage.setItem(API_BASE_STORAGE_KEY, base);
        return data;
      } catch (error) {
        if (error instanceof TypeError) {
          lastNetworkError = error;
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      `Failed to connect to API. Checked: ${bases.join(", ")}. ` +
        `Ensure backend is running and reachable over HTTPS in production.`
    );
  }

  function redirectByRole(user) {
    if (!user) {
      window.location.href = "./login.html";
      return;
    }

    const role = normalizeRole(user.role);

    if (role === "admin") {
      window.location.href = "./admin-dashboard.html";
      return;
    }

    if (role === "student" && !user.isProfileCompleted) {
      window.location.href = "./student-form.html";
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
      const active = target === PAGE || (target === "services" && SERVICE_DETAIL_PAGES.indexOf(PAGE) !== -1);
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
      "student-form",
      "student-dashboard",
      "admin-dashboard",
      "courses",
      "attendance",
      "services",
      ...SERVICE_DETAIL_PAGES,
      "student-settings",
    ];

    if (protectedPages.indexOf(PAGE) !== -1 && (!auth || !auth.token || !auth.user)) {
      window.location.href = "./login.html";
      return;
    }

    if (
      (PAGE === "admin-dashboard" || PAGE === "services" || SERVICE_DETAIL_PAGES.indexOf(PAGE) !== -1) &&
      auth &&
      auth.user &&
      normalizeRole(auth.user.role) !== "admin"
    ) {
      window.location.href = "./student-dashboard.html";
      return;
    }

    if (!auth || !auth.user) return;

    const user = auth.user;
    const role = normalizeRole(user.role);
    const studentLockedPages = ["student-dashboard", "courses", "attendance", "student-settings"];

    if (role === "student" && !user.isProfileCompleted && studentLockedPages.indexOf(PAGE) !== -1) {
      window.location.href = "./student-form.html";
      return;
    }

    if (PAGE === "student-form") {
      if (role !== "student") {
        window.location.href = "./admin-dashboard.html";
        return;
      }

      if (user.isProfileCompleted) {
        window.location.href = "./student-dashboard.html";
      }
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

  function getHelpRole() {
    const auth = getAuth();
    if (auth && auth.user && normalizeRole(auth.user.role) === "admin") return "admin";
    return "student";
  }

  function getHelpDrawerContent(role) {
    if (role === "admin") {
      return (
        '<section class="space-y-4">' +
        '<h3 class="text-base font-extrabold text-primary">Admin Guide</h3>' +
        '<div class="space-y-3 text-sm text-on-surface-variant leading-6">' +
        '<div><p class="font-semibold text-on-surface">Dashboard</p><ul class="list-disc ml-5"><li>View analytics and user statistics</li></ul></div>' +
        '<div><p class="font-semibold text-on-surface">Courses Management</p><ul class="list-disc ml-5"><li>Add new courses</li><li>Edit or delete existing courses</li></ul></div>' +
        '<div><p class="font-semibold text-on-surface">Attendance</p><ul class="list-disc ml-5"><li>View and manage student attendance records</li></ul></div>' +
        '<div><p class="font-semibold text-on-surface">Services Management</p><ul class="list-disc ml-5"><li>Manage institute services (Printout, Photocopy, etc.)</li></ul></div>' +
        '<div><p class="font-semibold text-on-surface">Contact Requests</p><ul class="list-disc ml-5"><li>View and respond to student/public enquiries</li></ul></div>' +
        '</div>' +
        '</section>' +
        '<section class="mt-6 space-y-3">' +
        '<h3 class="text-base font-extrabold text-primary">How To Use The System</h3>' +
        '<ul class="list-disc ml-5 text-sm text-on-surface-variant leading-6">' +
        '<li>Login to your account</li>' +
        '<li>Navigate using sidebar menu</li>' +
        '<li>Click any section to open features</li>' +
        '<li>Use buttons like Add, Edit, Continue</li>' +
        '<li>Submit forms where required</li>' +
        '</ul>' +
        '</section>'
      );
    }

    return (
      '<section class="space-y-4">' +
      '<h3 class="text-base font-extrabold text-primary">Student Guide</h3>' +
      '<div class="space-y-3 text-sm text-on-surface-variant leading-6">' +
      '<div><p class="font-semibold text-on-surface">Dashboard</p><ul class="list-disc ml-5"><li>View your progress and updates</li></ul></div>' +
      '<div><p class="font-semibold text-on-surface">My Courses</p><ul class="list-disc ml-5"><li>Access enrolled courses</li></ul></div>' +
      '<div><p class="font-semibold text-on-surface">Attendance</p><ul class="list-disc ml-5"><li>Check your attendance records</li></ul></div>' +
      '<div><p class="font-semibold text-on-surface">Services</p><ul class="list-disc ml-5"><li>Request services like printout, photocopy, etc.</li></ul></div>' +
      '</div>' +
      '</section>' +
      '<section class="mt-6 space-y-3">' +
      '<h3 class="text-base font-extrabold text-primary">How To Use The System</h3>' +
      '<ul class="list-disc ml-5 text-sm text-on-surface-variant leading-6">' +
      '<li>Login to your account</li>' +
      '<li>Navigate using sidebar menu</li>' +
      '<li>Click any section to open features</li>' +
      '<li>Use buttons like Continue and Save</li>' +
      '<li>Submit forms where required</li>' +
      '</ul>' +
      '</section>'
    );
  }

  function ensureHelpDrawer() {
    let root = document.getElementById("helpDrawerRoot");
    if (root) return root;

    root = document.createElement("div");
    root.id = "helpDrawerRoot";
    root.className = "fixed inset-0 z-[120] hidden";
    root.innerHTML =
      '<div id="helpDrawerBackdrop" class="absolute inset-0 bg-slate-900/35 opacity-0 transition-opacity duration-300"></div>' +
      '<aside id="helpDrawerPanel" class="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 translate-x-full transition-transform duration-300 flex flex-col">' +
      '<div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">' +
      '<div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary">help</span><h2 class="text-lg font-extrabold text-primary">Help Center</h2></div>' +
      '<button type="button" data-help-close class="h-10 w-10 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center"><span class="material-symbols-outlined">close</span></button>' +
      '</div>' +
      '<div id="helpDrawerBody" class="p-6 overflow-y-auto"></div>' +
      '</aside>';

    document.body.appendChild(root);

    const backdrop = root.querySelector("#helpDrawerBackdrop");
    const closeBtn = root.querySelector("[data-help-close]");
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        closeHelpDrawer();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeHelpDrawer();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeHelpDrawer();
    });

    return root;
  }

  function openHelpDrawer() {
    const root = ensureHelpDrawer();
    const body = root.querySelector("#helpDrawerBody");
    const panel = root.querySelector("#helpDrawerPanel");
    const backdrop = root.querySelector("#helpDrawerBackdrop");

    if (!body || !panel || !backdrop) return;

    body.innerHTML = getHelpDrawerContent(getHelpRole());
    root.classList.remove("hidden");

    requestAnimationFrame(function () {
      backdrop.classList.remove("opacity-0");
      backdrop.classList.add("opacity-100");
      panel.classList.remove("translate-x-full");
      panel.classList.add("translate-x-0");
    });
  }

  function closeHelpDrawer() {
    const root = document.getElementById("helpDrawerRoot");
    if (!root || root.classList.contains("hidden")) return;

    const panel = root.querySelector("#helpDrawerPanel");
    const backdrop = root.querySelector("#helpDrawerBackdrop");
    if (!panel || !backdrop) return;

    backdrop.classList.remove("opacity-100");
    backdrop.classList.add("opacity-0");
    panel.classList.remove("translate-x-0");
    panel.classList.add("translate-x-full");

    setTimeout(function () {
      root.classList.add("hidden");
    }, 300);
  }

  function initHelpCenter() {
    const triggers = document.querySelectorAll("[data-help-open]");
    triggers.forEach(function (el) {
      if (el.dataset.helpBound === "true") return;
      el.dataset.helpBound = "true";
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openHelpDrawer();
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

    const avatarEls = document.querySelectorAll("[data-user-avatar]");
    const avatarSrc = getAvatarForGender(getEffectiveGender());
    avatarEls.forEach(function (el) {
      el.src = avatarSrc;
    });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 5) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
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

        if (!data.user || (selectedRole && normalizeRole(data.user.role) !== normalizeRole(selectedRole))) {
          notify("Role mismatch. Please select correct role.", "error");
          return;
        }

        setAuth({ token: data.token, user: data.user });
        notify("Login successful", "success");
        redirectByRole(data.user);
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

      try {
        const data = await api("/api/auth/register", {
          method: "POST",
          body: {
            name: name,
            email: email,
            password: password,
            role: "student",
          },
        });

        if (data.token && data.user) {
          setAuth({ token: data.token, user: data.user });
          notify("Registration successful", "success");
          redirectByRole(data.user);
          return;
        }

        notify("Registration successful. Please login.", "success");
        window.location.href = "./login.html";
      } catch (err) {
        notify(err.message, "error");
      }
    });
  }

  async function initStudentForm() {
    if (PAGE !== "student-form") return;

    const form = document.getElementById("studentOnboardingForm");
    if (!form) return;

    const auth = getAuth();
    if (!auth || !auth.user || normalizeRole(auth.user.role) !== "student") {
      window.location.href = "./login.html";
      return;
    }

    try {
      const existingProfile = await api("/api/student/profile");
      if (existingProfile && existingProfile.data) {
        const updatedAuth = getAuth();
        if (updatedAuth && updatedAuth.user) {
          updatedAuth.user.isProfileCompleted = true;
          setAuth(updatedAuth);
        }

        const serverGender = existingProfile.data.gender;
        if (serverGender) {
          localStorage.setItem(PROFILE_GENDER_KEY, normalizeGender(serverGender));
        }

        window.location.href = "./student-dashboard.html";
        return;
      }
    } catch (err) {
      const message = String((err && err.message) || "").toLowerCase();
      if (message && !message.includes("profile not found") && !message.includes("404")) {
        notify("Unable to verify existing admission form. You can submit now.", "error");
      }
    }

    const fullName = document.getElementById("full_name");
    const email = document.getElementById("email");
    const photoInput = document.getElementById("photo");
    const signatureInput = document.getElementById("signature");
    const photoPreview = document.getElementById("photoPreview");
    const photoPlaceholder = document.getElementById("photoPreviewPlaceholder");
    const signaturePreview = document.getElementById("signaturePreview");
    const signaturePlaceholder = document.getElementById("signaturePreviewPlaceholder");
    if (fullName && !fullName.value) fullName.value = auth.user.name || "";
    if (email && !email.value) email.value = auth.user.email || "";

    if (form.dataset.bound === "true") return;
    form.dataset.bound = "true";

    function bindImagePreview(input, preview, placeholder) {
      if (!input || !preview || !placeholder) return;
      input.addEventListener("change", function () {
        const file = input.files && input.files[0] ? input.files[0] : null;
        if (!file) {
          preview.classList.add("hidden");
          placeholder.classList.remove("hidden");
          preview.removeAttribute("src");
          return;
        }
        preview.src = URL.createObjectURL(file);
        preview.classList.remove("hidden");
        placeholder.classList.add("hidden");
      });
    }

    bindImagePreview(photoInput, photoPreview, photoPlaceholder);
    bindImagePreview(signatureInput, signaturePreview, signaturePlaceholder);

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const requiredIds = [
        "full_name",
        "father_name",
        "dob",
        "gender",
        "marital_status",
        "nationality",
        "religion",
        "address",
        "mobile",
        "email",
        "exam_passed",
        "board_university",
        "passing_year",
        "marks",
        "percentage",
        "course_selected",
      ];

      for (const id of requiredIds) {
        const el = document.getElementById(id);
        if (!el || !String(el.value || "").trim()) {
          notify("Please fill all mandatory fields", "error");
          el?.focus();
          return;
        }
      }

      const photoFile = photoInput && photoInput.files ? photoInput.files[0] : null;
      const signatureFile = signatureInput && signatureInput.files ? signatureInput.files[0] : null;

      if (!photoFile) {
        notify("Photo is required", "error");
        return;
      }

      if (photoFile.size > 10 * 1024 * 1024 || (signatureFile && signatureFile.size > 10 * 1024 * 1024)) {
        notify("File size must be 10MB or less", "error");
        return;
      }

      const formData = new FormData();
      requiredIds.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
          formData.append(id, String(el.value || "").trim());
        }
      });

      formData.append("photo", photoFile);
      if (signatureFile) {
        formData.append("signature", signatureFile);
      }

      const submitBtn = document.getElementById("submitOnboardingBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
      }

      try {
        localStorage.setItem(PROFILE_GENDER_KEY, normalizeGender(document.getElementById("gender")?.value || ""));

        await api("/api/student/profile", {
          method: "POST",
          body: formData,
        });

        const updatedAuth = getAuth();
        if (updatedAuth && updatedAuth.user) {
          updatedAuth.user.isProfileCompleted = true;
          setAuth(updatedAuth);
        }

        notify("Profile submitted successfully", "success");
        window.location.href = "./student-dashboard.html";
      } catch (err) {
        notify(err.message || "Failed to submit profile", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Admission Form";
        }
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

    const enrolledSection = document.getElementById("enrolledCoursesSection");
    const enrolledGrid = document.getElementById("enrolledCoursesGrid");
    const enrolledEmptyState = document.getElementById("enrolledCoursesEmptyState");
    const exploreSection = document.getElementById("exploreCoursesSection");

    grid.innerHTML = "";

    if (!coursesState.items.length) {
      if (enrolledSection) enrolledSection.classList.add("hidden");
      if (exploreSection) exploreSection.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    if (coursesState.isAdmin) {
      if (enrolledSection) enrolledSection.classList.add("hidden");
      if (exploreSection) exploreSection.classList.add("hidden");
    } else {
      if (enrolledSection) enrolledSection.classList.remove("hidden");
      if (exploreSection) exploreSection.classList.remove("hidden");
      if (enrolledGrid) enrolledGrid.innerHTML = "";
    }

    function normalizeText(value) {
      return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    }

    function isStudentEnrolledCourse(course) {
      const selected = normalizeText(coursesState.selectedCourse);
      const title = normalizeText(course && course.title);
      const description = normalizeText(course && course.description);

      if (selected && (title.includes(selected) || description.includes(selected) || selected.includes(title))) {
        return true;
      }

      return Number(course && course.progress) > 0;
    }

    function createCourseCard(course) {
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

      return card;
    }

    if (!coursesState.isAdmin && enrolledGrid) {
      const enrolledItems = [];
      const otherItems = [];

      coursesState.items.forEach(function (course) {
        if (isStudentEnrolledCourse(course)) {
          enrolledItems.push(course);
        } else {
          otherItems.push(course);
        }
      });

      if (enrolledItems.length) {
        if (enrolledEmptyState) enrolledEmptyState.classList.add("hidden");
        enrolledItems.forEach(function (course) {
          enrolledGrid.appendChild(createCourseCard(course));
        });
      } else if (enrolledEmptyState) {
        enrolledEmptyState.classList.remove("hidden");
      }

      if (!otherItems.length) {
        emptyState.textContent = "No other courses found for this filter.";
        emptyState.classList.remove("hidden");
        return;
      }

      emptyState.textContent = "No courses found for this filter.";
      otherItems.forEach(function (course) {
        grid.appendChild(createCourseCard(course));
      });
      return;
    }

    coursesState.items.forEach(function (course) {
      grid.appendChild(createCourseCard(course));
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
      if (!coursesState.isAdmin && !coursesState.selectedCourse) {
        try {
          const profileRes = await api("/api/student/profile");
          coursesState.selectedCourse = String(profileRes?.data?.course_selected || "").trim();
        } catch (profileErr) {
          coursesState.selectedCourse = "";
        }
      }

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

    if (grid && grid.dataset.coursesBound !== "true") {
      bindCourseManagementEvents();
      grid.dataset.coursesBound = "true";
    }

    await fetchAndRenderCourses();
  }

  async function initStudentDashboard() {
    if (PAGE !== "student-dashboard") return;

    try {
      const yearEl = document.getElementById("studentDashboardCurrentYear");
      if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
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

  async function initStudentSettings() {
    if (PAGE !== "student-settings") return;

    function setField(id, value) {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = value == null ? "" : String(value);
    }

    function applyProfile(profile) {
      const education = profile.education || {};
      localStorage.setItem(PROFILE_GENDER_KEY, normalizeGender(profile.gender));

      setField("settings_full_name", profile.full_name);
      setField("settings_father_name", profile.father_name);
      setField("settings_dob", profile.dob ? String(profile.dob).slice(0, 10) : "");
      setField("settings_gender", profile.gender);
      setField("settings_marital_status", profile.marital_status);
      setField("settings_nationality", profile.nationality);
      setField("settings_religion", profile.religion);
      setField("settings_mobile", profile.mobile);
      setField("settings_email", profile.email);
      setField("settings_address", profile.address);

      setField("settings_exam_passed", education.exam_passed);
      setField("settings_board_university", education.board_university);
      setField("settings_passing_year", education.passing_year);
      setField("settings_marks", education.marks);
      setField("settings_percentage", education.percentage);
      setField("settings_course_selected", profile.course_selected);

      const photo = document.getElementById("settings_photo");
      const signature = document.getElementById("settings_signature");
      if (photo) photo.src = profile.photo_url || "";
      if (signature) signature.src = profile.signature_url || "";
    }

    try {
      const result = await api("/api/student/profile");
      const profile = (result && result.data) || {};
      applyProfile(profile);

      const saveBtn = document.getElementById("settingsSaveBtn");
      const terms = document.getElementById("settings_terms");
      if (saveBtn && saveBtn.dataset.bound !== "true") {
        saveBtn.dataset.bound = "true";
        saveBtn.addEventListener("click", async function () {
          if (terms && !terms.checked) {
            notify("Please accept terms before saving", "error");
            return;
          }

          const payload = {
            gender: (document.getElementById("settings_gender")?.value || "").trim(),
            marital_status: (document.getElementById("settings_marital_status")?.value || "").trim(),
            nationality: (document.getElementById("settings_nationality")?.value || "").trim(),
            religion: (document.getElementById("settings_religion")?.value || "").trim(),
            email: (document.getElementById("settings_email")?.value || "").trim(),
            address: (document.getElementById("settings_address")?.value || "").trim(),
            education: {
              exam_passed: (document.getElementById("settings_exam_passed")?.value || "").trim(),
              board_university: (document.getElementById("settings_board_university")?.value || "").trim(),
              passing_year: (document.getElementById("settings_passing_year")?.value || "").trim(),
              marks: (document.getElementById("settings_marks")?.value || "").trim(),
              percentage: (document.getElementById("settings_percentage")?.value || "").trim(),
            },
            course_selected: (document.getElementById("settings_course_selected")?.value || "").trim(),
          };

          saveBtn.disabled = true;
          saveBtn.textContent = "Saving...";
          try {
            const updated = await api("/api/student/profile", {
              method: "PUT",
              body: payload,
            });

            applyProfile((updated && updated.data) || {});
            localStorage.setItem(PROFILE_GENDER_KEY, normalizeGender(payload.gender));
            notify("Settings saved successfully", "success");
          } catch (saveErr) {
            notify(saveErr.message || "Unable to save settings", "error");
          } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Changes";
          }
        });
      }
    } catch (err) {
      notify(err.message || "Unable to load student details", "error");
    }
  }

  function renderAdminTableRows(items, mapper) {
    return items
      .map(function (item, index) {
        return mapper(item, index);
      })
      .join("");
  }

  function formatShortDate(value) {
    if (!value) return "--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "--";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function renderUsersCreatedGraph(users) {
    const graph = document.getElementById("usersCreatedGraph");
    if (!graph) return;

    if (!users || !users.length) {
      graph.innerHTML = '<p class="text-xs text-slate-500">No user data available.</p>';
      return;
    }

    const allSorted = users
      .slice()
      .sort(function (a, b) {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });

    const now = new Date();
    let month = now.getMonth();
    let year = now.getFullYear();

    let monthItems = allSorted.filter(function (u) {
      const d = new Date(u.createdAt || 0);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    if (!monthItems.length && allSorted.length) {
      const latest = new Date(allSorted[allSorted.length - 1].createdAt || 0);
      month = latest.getMonth();
      year = latest.getFullYear();
      monthItems = allSorted.filter(function (u) {
        const d = new Date(u.createdAt || 0);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }

    if (!monthItems.length) {
      graph.innerHTML = '<p class="text-xs text-slate-500">No account creation data available for this month.</p>';
      return;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adminDaily = new Array(daysInMonth).fill(0);
    const studentDaily = new Array(daysInMonth).fill(0);

    monthItems.forEach(function (u) {
      const d = new Date(u.createdAt || 0);
      const dayIdx = Math.max(0, Math.min(daysInMonth - 1, d.getDate() - 1));
      const role = String(u.role || "student").toLowerCase();
      if (role === "admin") {
        adminDaily[dayIdx] += 1;
      } else {
        studentDaily[dayIdx] += 1;
      }
    });

    const maxCount = Math.max(1, ...adminDaily, ...studentDaily);
    const yTop = maxCount;
    const yMid = Math.max(0, Math.ceil(maxCount / 2));
    const yBottom = 0;

    const W = 920;
    const H = 280;
    const PAD_L = 56;
    const PAD_R = 16;
    const PAD_T = 20;
    const PAD_B = 48;
    const CW = W - PAD_L - PAD_R;
    const CH = H - PAD_T - PAD_B;

    function xFor(dayIndex) {
      if (daysInMonth === 1) return PAD_L + CW / 2;
      return PAD_L + (dayIndex * CW) / (daysInMonth - 1);
    }

    function yFor(value) {
      return PAD_T + CH - (value / maxCount) * CH;
    }

    function pathFor(series, yOffsetPx) {
      return series
        .map(function (v, i) {
          const cmd = i === 0 ? "M" : "L";
          return cmd + xFor(i).toFixed(2) + " " + (yFor(v) + yOffsetPx).toFixed(2);
        })
        .join(" ");
    }

    const adminPath = pathFor(adminDaily, -1.5);
    const studentPath = pathFor(studentDaily, 1.5);

    function pointsFor(series, color, yOffsetPx) {
      return series
        .map(function (v, i) {
          if (v <= 0) return "";
          return (
            '<circle cx="' +
            xFor(i).toFixed(2) +
            '" cy="' +
            (yFor(v) + yOffsetPx).toFixed(2) +
            '" r="3.2" fill="' +
            color +
            '" />'
          );
        })
        .join("");
    }

    const adminPoints = pointsFor(adminDaily, "#16a34a", -1.5);
    const studentPoints = pointsFor(studentDaily, "#dc2626", 1.5);

    const xTicks = [1, Math.ceil(daysInMonth * 0.25), Math.ceil(daysInMonth * 0.5), Math.ceil(daysInMonth * 0.75), daysInMonth]
      .filter(function (d, idx, arr) {
        return arr.indexOf(d) === idx;
      })
      .sort(function (a, b) {
        return a - b;
      });

    const xTickLabels = xTicks
      .map(function (day) {
        return (
          '<text x="' +
          xFor(day - 1).toFixed(2) +
          '" y="' +
          (H - 18) +
          '" font-size="11" fill="#64748b" text-anchor="middle">' +
          day +
          "</text>"
        );
      })
      .join("");

    const yGridVals = [yTop, yMid, yBottom];
    const yGrid = yGridVals
      .map(function (v) {
        const y = yFor(v).toFixed(2);
        return (
          '<line x1="' +
          PAD_L +
          '" y1="' +
          y +
          '" x2="' +
          (W - PAD_R) +
          '" y2="' +
          y +
          '" stroke="#d1d5db" stroke-width="1" />' +
          '<text x="' +
          (PAD_L - 10) +
          '" y="' +
          (Number(y) + 4).toFixed(2) +
          '" font-size="11" fill="#64748b" text-anchor="end">' +
          v +
          "</text>"
        );
      })
      .join("");

    const monthLabel = new Date(year, month, 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });

    graph.innerHTML =
      '<div class="flex items-center justify-between text-[12px] text-slate-600 mb-2">' +
      '<span class="font-semibold">One Month Timeline: ' +
      monthLabel +
      '</span>' +
      '<span class="inline-flex items-center gap-4">' +
      '<span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-0.5 bg-green-600"></span><span class="inline-block w-2 h-2 rounded-full bg-green-600"></span>Admin</span>' +
      '<span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-0.5 bg-red-600"></span><span class="inline-block w-2 h-2 rounded-full bg-red-600"></span>Student</span>' +
      "</span>" +
      "</div>" +
      '<svg viewBox="0 0 ' +
      W +
      " " +
      H +
      '" class="w-full h-56" preserveAspectRatio="none" aria-label="Account creation chart">' +
      yGrid +
      '<path d="' +
      adminPath +
      '" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '<path d="' +
      studentPath +
      '" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      adminPoints +
      studentPoints +
      xTickLabels +
      '<text x="' +
      (PAD_L + CW / 2).toFixed(2) +
      '" y="' +
      (H - 2) +
      '" font-size="11" fill="#475569" text-anchor="middle">Day of Month</text>' +
      "</svg>";
  }

  function renderRequestsStatusGraph(contacts) {
    const graph = document.getElementById("requestsStatusGraph");
    if (!graph) return;

    if (!contacts || !contacts.length) {
      graph.innerHTML = '<p class="text-xs text-slate-500">No contact requests available.</p>';
      return;
    }

    const counts = { new: 0, pending: 0, resolved: 0 };
    contacts.forEach(function (c) {
      const status = String((c && c.status) || "new").trim().toLowerCase();
      if (status === "resolved") {
        counts.resolved += 1;
      } else if (status === "pending") {
        counts.pending += 1;
      } else {
        counts.new += 1;
      }
    });

    const total = Math.max(1, contacts.length);

    function row(label, key, colorClass) {
      const value = counts[key] || 0;
      const widthPct = ((value / total) * 100).toFixed(1);
      return (
        '<div class="space-y-1">' +
        '<div class="flex items-center justify-between text-xs text-slate-600">' +
        '<span class="font-semibold">' +
        label +
        '</span>' +
        '<span class="font-bold">' +
        value +
        "</span>" +
        "</div>" +
        '<div class="w-full h-2 rounded-full bg-slate-200 overflow-hidden">' +
        '<div class="h-full ' +
        colorClass +
        '" style="width:' +
        widthPct +
        '%"></div>' +
        "</div>" +
        "</div>"
      );
    }

    graph.innerHTML =
      '<div class="space-y-3">' +
      row("New", "new", "bg-amber-500") +
      row("Pending", "pending", "bg-red-500") +
      row("Resolved", "resolved", "bg-green-600") +
      "</div>";
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
      renderUsersCreatedGraph(users);
      renderRequestsStatusGraph(contacts);

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
          '<td class="py-3 px-4 text-sm">' +
          (u.mobile || "-") +
          "</td>" +
          '<td class="py-3 px-4 text-sm uppercase font-semibold">' +
          (u.role || "student") +
          "</td>" +
          '<td class="py-3 px-4 text-sm">' +
          '<div class="flex items-center gap-2">' +
          '<select data-user-role-select data-user-id="' +
          (u._id || "") +
          '" class="border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold">' +
          '<option value="student" ' +
          ((u.role || "student") === "student" ? "selected" : "") +
          ">Student</option>" +
          '<option value="admin" ' +
          ((u.role || "student") === "admin" ? "selected" : "") +
          ">Admin</option>" +
          "</select>" +
          '<button data-user-role-save data-user-id="' +
          (u._id || "") +
          '" class="px-2 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold">Update</button>' +
          "</div>" +
          "</td>" +
          "</tr>"
        );
      });

      const roleSaveButtons = usersBody.querySelectorAll("[data-user-role-save]");
      roleSaveButtons.forEach(function (btn) {
        btn.addEventListener("click", async function () {
          const userId = btn.getAttribute("data-user-id");
          if (!userId) return;

          const select = usersBody.querySelector('[data-user-role-select][data-user-id="' + userId + '"]');
          if (!select) return;

          const nextRole = String(select.value || "").trim().toLowerCase();
          btn.disabled = true;
          const originalText = btn.textContent;
          btn.textContent = "Saving...";

          try {
            await api("/api/admin/users/" + userId + "/role", {
              method: "PUT",
              body: { role: nextRole },
            });

            const targetUser = users.find(function (item) {
              return String(item._id) === String(userId);
            });
            if (targetUser) {
              targetUser.role = nextRole;
            }

            const auth = getAuth();
            const authUserId = String((auth && auth.user && (auth.user.id || auth.user._id)) || "");
            if (auth && auth.user && authUserId && authUserId === String(userId)) {
              auth.user.role = normalizeRole(nextRole);
              auth.user.isProfileCompleted = false;
              setAuth(auth);
              notify("Your role was updated. Redirecting...", "success");
              redirectByRole(auth.user);
              return;
            }

            notify("User role updated", "success");
            await loadAdminData();
          } catch (roleErr) {
            notify(roleErr.message || "Failed to update role", "error");
          } finally {
            btn.disabled = false;
            btn.textContent = originalText;
          }
        });
      });

      requestsBody.innerHTML = renderAdminTableRows(contacts, function (c, i) {
        const rawMessage = String(c.message || "");
        const mobileFromField = String(c.mobile || "").trim();
        const mobileMatch = rawMessage.match(/(?:^|\n)\s*Mobile\s*:\s*([^\n]+)/i);
        const mobileFromMessage = mobileMatch ? String(mobileMatch[1] || "").trim() : "";
        const mobile = mobileFromField || mobileFromMessage || "-";
        const cleanedMessage = rawMessage.replace(/(?:^|\n)\s*Mobile\s*:\s*[^\n]+/i, "").trim() || "-";
        const requestStatus = String(c.status || "new").trim().toLowerCase();
        const statusLabelClass =
          requestStatus === "resolved"
            ? "text-green-700 bg-green-100"
            : requestStatus === "pending"
            ? "text-red-700 bg-red-100"
            : "text-amber-700 bg-amber-100";

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
          '<td class="py-3 px-4 text-sm">' +
          mobile +
          "</td>" +
          '<td class="py-3 px-4 text-sm line-clamp-1 max-w-[220px]">' +
          cleanedMessage +
          "</td>" +
          '<td class="py-3 px-4 text-sm">' +
          '<div class="flex items-center gap-2">' +
          '<span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ' +
          statusLabelClass +
          '">' +
          requestStatus +
          "</span>" +
          '<select data-request-status-select data-request-id="' +
          (c._id || "") +
          '" class="border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold">' +
          '<option value="new" ' +
          (requestStatus === "new" ? "selected" : "") +
          ">New</option>" +
          '<option value="pending" ' +
          (requestStatus === "pending" ? "selected" : "") +
          ">Pending</option>" +
          '<option value="resolved" ' +
          (requestStatus === "resolved" ? "selected" : "") +
          ">Resolved</option>" +
          "</select>" +
          '<button data-request-status-save data-request-id="' +
          (c._id || "") +
          '" class="px-2 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold">Update</button>' +
          "</div>" +
          "</td>" +
          "</tr>"
        );
      });

      const requestStatusSaveButtons = requestsBody.querySelectorAll("[data-request-status-save]");
      requestStatusSaveButtons.forEach(function (btn) {
        btn.addEventListener("click", async function () {
          const requestId = btn.getAttribute("data-request-id");
          if (!requestId) return;

          const select = requestsBody.querySelector('[data-request-status-select][data-request-id="' + requestId + '"]');
          if (!select) return;

          const nextStatus = String(select.value || "").trim().toLowerCase();
          btn.disabled = true;
          const originalText = btn.textContent;
          btn.textContent = "Saving...";

          try {
            await api("/api/admin/requests/" + requestId + "/status", {
              method: "PUT",
              body: { status: nextStatus },
            });

            const targetRequest = contacts.find(function (item) {
              return String(item._id) === String(requestId);
            });
            if (targetRequest) {
              targetRequest.status = nextStatus;
            }

            notify("Contact request status updated", "success");
            renderRequestsStatusGraph(contacts);
            await loadAdminData();
          } catch (statusErr) {
            notify(statusErr.message || "Failed to update request status", "error");
          } finally {
            btn.disabled = false;
            btn.textContent = originalText;
          }
        });
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

    const auth = getAuth();
    const adminName = String((auth && auth.user && auth.user.name) || "Admin");
    const welcomeTitle = document.getElementById("adminWelcomeTitle");
    const greetingLine = document.getElementById("adminGreetingLine");
    if (welcomeTitle) {
      welcomeTitle.textContent = "Welcome, " + adminName + "!";
    }
    if (greetingLine) {
      greetingLine.textContent = getGreeting();
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
    initHelpCenter();
    applyUserName();
    updateShellNavState();
    initLogin();
    initRegister();
    initStudentForm();
    initStudentDashboard();
    initStudentSettings();
    initAdminDashboard();
    initCourses();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initRouteRedirects();
    initializePageFeatures();
  });
})();
