(function () {
  const service = window.ProjectService;
  const labels = {
    all: "All",
    banner: "Banner",
    product: "Product Page",
    video: "Video",
    editorial: "Editorial Design",
    asset: "Character & Asset"
  };
  const categoryDescriptions = {
    asset: "서비스, 게임, 콘텐츠 플랫폼 등 서로 다른 사용 환경에 맞춰 캐릭터와 일러스트 에셋을 제작했습니다. <br> 캐릭터의 개성과 시각적 완성도뿐 아니라 실제 화면에서의 활용성과 확장 가능성을 함께 고려했습니다."
  };
  const pageLinks = {
    banner: "banner.html",
    product: "product.html",
    video: "video.html",
    editorial: "editorial.html",
    asset: "asset.html"
  };
  const fallbackImage = "assets/images/placeholders/image-placeholder.png";
  const categoryViewModes = ["list", "post", "gallery"];
  const categoryViewOptions = [
    { mode: "list", label: "목록", icon: "list" },
    { mode: "post", label: "글", icon: "article" },
    { mode: "gallery", label: "갤러리", icon: "grid_view" }
  ];
  const categoryIcons = {
    banner: "web_asset",
    product: "article",
    video: "movie",
    editorial: "palette",
    asset: "category"
  };
  let selectedFileIndex = 0;
  let selectedPageIndex = 0;
  let selectedPreviewCategory = "all";
  let currentProject = null;
  let openDetailAccordion = null;
  let categoryDialogCleanup = null;
  let imageLightboxCleanup = null;
  let revealObserver = null;

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initMenu();
    setActiveNavigation();
    initEditorialHeader();
    protectImages();

    const page = document.body.dataset.page;
    if (page === "index") initIndexPage();
    if (page === "category") initCategoryPage();
    if (page === "detail") initDetailPage();
  });

  function initTheme() {
    const stored = localStorage.getItem("projectArchiveTheme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    applyTheme(theme);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        localStorage.setItem("projectArchiveTheme", nextTheme);
        applyTheme(nextTheme);
      });
    });
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll("[data-theme-label]").forEach((label) => {
      label.textContent = theme === "dark" ? "다크" : "라이트";
    });
    document.querySelectorAll(".theme-icon").forEach((icon) => {
      icon.textContent = theme === "dark" ? "dark_mode" : "light_mode";
    });
  }

  function initMenu() {
    const button = document.querySelector("[data-menu-toggle]");
    const nav = document.getElementById("siteNav");
    if (!button || !nav) return;

    const closeMenu = () => {
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "메뉴 열기");
    };

    const openMenu = () => {
      nav.classList.add("is-open");
      document.body.classList.add("menu-open");
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-label", "메뉴 닫기");
    };

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = !nav.classList.contains("is-open");
      if (isOpen) openMenu();
      else closeMenu();
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (event.target.closest("#siteNav") || event.target.closest("[data-menu-toggle]")) return;
      closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 767) closeMenu();
    });
  }

  function initEditorialHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const revealBoundary = 88;
    let pointerNearTop = false;

    const update = () => {
      const currentScrollY = window.scrollY;
      const isScrolled = currentScrollY > 20;
      const hasFocus = header.contains(document.activeElement);
      header.classList.toggle("is-scrolled", isScrolled);
      header.classList.toggle("is-visible", isScrolled || pointerNearTop || hasFocus);
    };

    document.addEventListener("pointermove", (event) => {
      if (!desktopQuery.matches) return;
      const nextPointerNearTop = event.clientY <= revealBoundary;
      if (nextPointerNearTop === pointerNearTop) return;
      pointerNearTop = nextPointerNearTop;
      update();
    }, { passive: true });
    header.addEventListener("focusin", () => update());
    header.addEventListener("focusout", () => window.requestAnimationFrame(update));
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function setActiveNavigation() {
    const project = service.getProjectById(document.body.dataset.projectId);
    const activeCategory = project ? project.category : document.body.dataset.category || "";
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === activeCategory) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function initCategoryPage() {
    const category = document.body.dataset.category;
    const requestedId = new URLSearchParams(window.location.search).get("project");
    const requestedProject = requestedId ? service.getProjectById(requestedId) : null;

    if (requestedProject && requestedProject.category === category) {
      currentProject = requestedProject;
      openDetailAccordion = null;
      selectedPreviewCategory = "all";
      document.body.dataset.projectId = requestedProject.id;
      document.body.classList.add("showing-detail");
      selectedFileIndex = getIndexFromHash(getPreviewItems(currentProject).length);
      renderDetail();
      window.addEventListener("hashchange", () => {
        selectedFileIndex = getIndexFromHash(getFilteredPreviewItems(currentProject).length);
        selectedPageIndex = 0;
        renderDetail();
      });
      return;
    }

    const heading = document.getElementById("categoryHeading");
    const grid = document.getElementById("categoryProjectGrid");
    if (!heading || !grid) return;
    const projects = service.getProjectsByCategory(category);
    const orderedProjects = category === "banner"
      ? sortCategoryProjects(projects, "newest")
      : projects;
    heading.innerHTML = `
      <span class="status-pill">${labels[category]}</span>
      <div class="category-heading-row">
        <div>
          <h1>${labels[category]}</h1>
          ${categoryDescriptions[category] ? `<p class="category-introduction">${categoryDescriptions[category]}</p>` : ""}
          <p>${projects.length}개의 프로젝트</p>
        </div>
        <div class="view-dropdown" data-view-dropdown>
          <button class="view-dropdown-toggle" type="button" data-view-toggle aria-haspopup="menu" aria-expanded="false" aria-label="프로젝트 보기 방식 선택">
            <span class="view-current-icon" data-current-view-icon aria-hidden="true"></span>
            <span data-current-view-label></span>
            <span class="material-symbols-outlined view-dropdown-arrow" aria-hidden="true">keyboard_arrow_down</span>
          </button>
          <div class="view-dropdown-menu" data-view-menu role="menu" aria-label="프로젝트 보기 방식">
            ${categoryViewOptions.map((option) => `
              <button type="button" role="menuitemradio" data-view-mode="${option.mode}" aria-checked="false" tabindex="-1">
                ${renderCategoryViewIcon(option.mode)}
                <span>${option.label}</span>
                <span class="material-symbols-outlined view-selected-icon" aria-hidden="true">check</span>
              </button>`).join("")}
          </div>
        </div>
      </div>`;
    grid.innerHTML = orderedProjects.map(categoryProjectTemplate).join("");
    initCategoryViewSwitcher(heading, grid);
    protectImages(grid);
    prepareVideoThumbnails(grid);
  }

  function sortCategoryProjects(projects, direction) {
    const yearDirection = direction === "oldest" ? 1 : -1;
    return projects.slice().sort((a, b) => {
      const yearDifference = (a.sortYear - b.sortYear) * yearDirection;
      return yearDifference || a.baseOrder - b.baseOrder;
    });
  }

  function initCategoryViewSwitcher(heading, grid) {
    const storedMode = localStorage.getItem("projectArchiveCategoryView");
    const initialMode = categoryViewModes.includes(storedMode) ? storedMode : "post";
    const dropdown = heading.querySelector("[data-view-dropdown]");
    const toggle = heading.querySelector("[data-view-toggle]");
    const menu = heading.querySelector("[data-view-menu]");
    const currentIcon = heading.querySelector("[data-current-view-icon]");
    const currentLabel = heading.querySelector("[data-current-view-label]");
    const modeButtons = Array.from(heading.querySelectorAll("[data-view-mode]"));
    if (!dropdown || !toggle || !menu || !currentIcon || !currentLabel || modeButtons.length === 0) return;

    function applyViewMode(mode) {
      const option = getCategoryViewOption(mode);
      categoryViewModes.forEach((item) => grid.classList.toggle(`view-${item}`, item === mode));
      currentIcon.innerHTML = renderCategoryViewIcon(mode);
      currentLabel.textContent = option.label;
      toggle.setAttribute("aria-label", `현재 보기 방식: ${option.label}`);
      modeButtons.forEach((button) => {
        const isActive = button.dataset.viewMode === mode;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-checked", String(isActive));
        button.tabIndex = isActive ? 0 : -1;
      });
    }

    function setDropdownOpen(isOpen) {
      dropdown.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      modeButtons.forEach((button) => {
        button.tabIndex = isOpen ? 0 : -1;
      });
    }

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      setDropdownOpen(!dropdown.classList.contains("is-open"));
    });

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.viewMode;
        localStorage.setItem("projectArchiveCategoryView", mode);
        applyViewMode(mode);
        setDropdownOpen(false);
        toggle.focus();
      });
    });

    document.addEventListener("click", (event) => {
      if (!dropdown.classList.contains("is-open")) return;
      if (dropdown.contains(event.target)) return;
      setDropdownOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dropdown.classList.contains("is-open")) {
        setDropdownOpen(false);
        toggle.focus();
      }
    });

    applyViewMode(initialMode);
  }

  function getCategoryViewOption(mode) {
    return categoryViewOptions.find((option) => option.mode === mode) || categoryViewOptions[1];
  }

  function renderCategoryViewIcon(mode) {
    if (mode === "list") {
      return '<span class="list-view-icon" aria-hidden="true"><i></i><i></i><i></i></span>';
    }
    return `<span class="material-symbols-outlined" aria-hidden="true">${getCategoryViewOption(mode).icon}</span>`;
  }

  function categoryProjectTemplate(project) {
    const file = project.files[0] || {};
    const cover = project.category === "product"
      ? (project.listThumbnail || project.cover || fallbackImage)
      : (project.listThumbnail || project.cover || file.thumbnail || fallbackImage);
    const preview = project.type === "video" && file.src
      ? `<video src="${file.src}" muted playsinline preload="metadata" data-video-thumbnail aria-label="${file.alt || project.title} 대표 장면"></video>`
      : `<img src="${cover}" alt="${file.alt || project.title}">`;
    return `
      <article class="project-card category-project-card" data-project-id="${project.id}">
        <a href="${pageLinks[project.category]}?project=${encodeURIComponent(project.id)}" aria-label="${project.title} 상세 보기">
          <div class="card-image">${preview}${project.type === "video" ? '<span class="play-badge material-symbols-outlined" aria-hidden="true">play_arrow</span>' : ""}</div>
          <div class="card-body"><span class="category-chip ${project.category}">${labels[project.category]}</span><h2>${project.title}</h2><p>${project.summary}</p><p class="card-meta-line">${project.category === "asset" ? (project.cardMeta || labels[project.category]) : `${project.period} · ${project.cardMeta || `${project.files.length}개 결과물`}`}</p></div>
        </a>
      </article>`;
  }

  function initIndexPage() {
    const filters = document.getElementById("categoryFilters");
    const grid = document.getElementById("projectGrid");
    const sort = document.getElementById("sortProjects");
    let activeCategory = "all";
    let activeProject = null;

    const selectProject = (project, scrollOnMobile = false) => {
      if (!project) return;
      activeProject = project;
      updateSelectedCard(grid, project.id);
      renderSummary(project);
      window.dispatchEvent(new CustomEvent("projectselectionchange", { detail: { projectId: project.id } }));
      if (scrollOnMobile && window.matchMedia("(max-width: 1024px)").matches) {
        window.requestAnimationFrame(() => {
          document.getElementById("summaryPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    };

    const clearSelectedProject = () => {
      if (!activeProject) return;
      activeProject = null;
      updateSelectedCard(grid, "");
      renderSummaryEmpty();
      window.dispatchEvent(new CustomEvent("projectselectionchange", { detail: { projectId: null } }));
    };

    Object.keys(labels).forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-button";
      button.dataset.category = category;
      button.textContent = labels[category];
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", category === activeCategory ? "true" : "false");
      button.addEventListener("click", () => {
        activeCategory = category;
        filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-selected", String(item === button)));
        const filtered = renderProjectCards(grid, activeCategory, sort.dataset.sort, activeProject?.id || "");
        if (activeProject && !filtered.some((project) => project.id === activeProject.id)) {
          activeProject = null;
          renderSummaryEmpty();
        }
      });
      filters.appendChild(button);
    });

    sort.addEventListener("click", () => {
      const nextSort = sort.dataset.sort === "latest" ? "category" : "latest";
      sort.dataset.sort = nextSort;
      sort.querySelector("span:first-child").textContent = nextSort === "latest" ? "최신순" : "카테고리순";
      sort.setAttribute(
        "aria-label",
        nextSort === "latest"
          ? "현재 최신순 정렬. 누르면 카테고리순으로 변경"
          : "현재 카테고리순 정렬. 누르면 최신순으로 변경"
      );
      renderProjectCards(grid, activeCategory, nextSort, activeProject?.id || "");
    });

    grid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-project-card]");
      if (!card) return;
      const project = service.getProjectById(card.dataset.projectId);
      if (!project) return;
      selectProject(project, true);
    });

    grid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-project-card]");
      if (!card) return;
      event.preventDefault();
      card.click();
    });

    document.querySelector(".archive-layout")?.addEventListener("click", (event) => {
      if (event.target.closest("[data-project-card], #summaryPanel, .toolbar")) return;
      clearSelectedProject();
    });

    window.addEventListener("projectringselect", (event) => {
      const project = service.getProjectById(event.detail?.projectId);
      if (!project) return;
      selectProject(project);
    });

    renderProjectCards(grid, activeCategory, sort.dataset.sort, "");
    renderSummaryEmpty();
  }

  function renderProjectCards(grid, category, sortMode, selectedId) {
    let projects = service.getProjectsByCategory(category);
    projects = projects.sort((a, b) => {
      if (sortMode === "category") return a.category.localeCompare(b.category);
      return b.period.localeCompare(a.period);
    });
    grid.innerHTML = projects.map((project) => projectCardTemplate(project, project.id === selectedId)).join("");
    protectImages(grid);
    return projects;
  }

  function projectCardTemplate(project, isSelected) {
    const file = project.files[0] || {};
    const thumbnail = getProjectThumbnail(project);
    return `
      <article class="project-card${isSelected ? " is-selected" : ""}" data-project-card data-project-id="${project.id}" role="button" tabindex="0" aria-label="${project.title}" aria-pressed="${isSelected}">
        <div class="card-image">
          <img src="${thumbnail}" alt="${file.alt || project.title}">
          ${project.type === "video" ? '<span class="play-badge material-symbols-outlined" aria-hidden="true">play_arrow</span>' : ""}
        </div>
        <div class="card-body">
          <span class="category-chip ${project.category}">${labels[project.category]}</span>
          <h2>${project.title}</h2>
          <p class="card-project-year">${getProjectYear(project)}</p>
        </div>
      </article>
    `;
  }

  function updateSelectedCard(grid, selectedId) {
    grid.querySelectorAll("[data-project-card]").forEach((card) => {
      const isSelected = card.dataset.projectId === selectedId;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function renderSummaryEmpty() {
    const panel = document.getElementById("summaryPanel");
    if (!panel) return;
    panel.hidden = true;
    panel.innerHTML = "";
    panel.closest(".archive-layout")?.classList.remove("has-selection");
  }

  function renderSummary(project) {
    const panel = document.getElementById("summaryPanel");
    if (!panel || !project) return;
    panel.hidden = false;
    panel.closest(".archive-layout")?.classList.add("has-selection");
    const file = project.files[0] || {};
    panel.classList.remove("is-empty");
    panel.innerHTML = `
      <p class="panel-eyebrow">선택한 프로젝트</p>
      <h2>${project.title}</h2>
      <div class="summary-meta">
        <span class="category-chip ${project.category}">${labels[project.category]}</span>
        <span>${getProjectYear(project)}</span>
      </div>
      <img class="summary-image" src="${getProjectThumbnail(project)}" alt="${file.alt || project.title}">
      <p>${project.summary}</p>
      <dl class="info-list compact">
        <div><dt>작업 범위</dt><dd>${project.scope}</dd></div>
        <div><dt>주요 목적</dt><dd>${project.improvementTitle}</dd></div>
        <div><dt>대표 결과물</dt><dd>${project.deliverables || file.meta || `${project.files.length}개 결과물`}</dd></div>
      </dl>
      <a class="primary-link" href="${pageLinks[project.category]}?project=${encodeURIComponent(project.id)}">상세 보기</a>
    `;
    protectImages(panel);
  }

  function getProjectThumbnail(project) {
    const file = project.files?.[0] || {};
    return project.ringThumbnail || project.listThumbnail || project.cover || file.thumbnail || file.src || fallbackImage;
  }

  function getProjectYear(project) {
    return String(project.year || project.period || "").match(/\d{4}/)?.[0] || "2026";
  }

  function initDetailPage() {
    currentProject = service.getProjectById(document.body.dataset.projectId);
    if (!currentProject) return;
    openDetailAccordion = null;
    selectedPreviewCategory = "all";
    selectedFileIndex = getIndexFromHash(getPreviewItems(currentProject).length);
    renderDetail();
    window.addEventListener("hashchange", () => {
      selectedFileIndex = getIndexFromHash(getFilteredPreviewItems(currentProject).length);
      selectedPageIndex = 0;
      renderDetail();
    });
  }

  function renderDetail() {
    const previewItems = getFilteredPreviewItems(currentProject);
    selectedFileIndex = Math.max(0, Math.min(selectedFileIndex, previewItems.length - 1));
    renderDetailHeading(currentProject);
    renderMedia(currentProject, selectedFileIndex);
    renderThumbs(currentProject, selectedFileIndex);
    renderPanels(currentProject);
    renderDetailNav(currentProject);
    protectImages();
  }

  function renderDetailHeading(project) {
    const heading = document.getElementById("detailHeading");
    const detailCopy = project.detailIntroduction
      ? `<div class="detail-introduction"><p>${project.category === "asset" ? project.detailIntroduction.replace(/\n\n/g, " ") : project.detailIntroduction.replace(/\n\n/g, "<br><br>")}</p></div>`
      : `<p>${project.summary}</p>`;
    heading.innerHTML = `
      <div>
        <span class="status-pill">${labels[project.category]}</span>
        <h1>${project.title}</h1>
        ${detailCopy}
      </div>
    `;
  }

  function renderMedia(project, index) {
    const media = document.getElementById("detailMedia");
    if (imageLightboxCleanup) {
      imageLightboxCleanup();
      imageLightboxCleanup = null;
    }
    if (project.caseStudy) {
      renderEditorialCaseStudy(media, project);
      return;
    }
    const previewItems = getFilteredPreviewItems(project);
    const item = previewItems[index] || previewItems[0];
    if (!item) return;
    const images = item.images && item.images.length ? item.images : [item];
    selectedPageIndex = Math.max(0, Math.min(selectedPageIndex, images.length - 1));
    const file = images[selectedPageIndex];
    const previousLabel = project.category === "editorial" ? "이전 페이지" : "이전 이미지";
    const nextLabel = project.category === "editorial" ? "다음 페이지" : "다음 이미지";
    const count = document.getElementById("detailCounter");
    count.textContent = item.pageLabel || file.pageLabel || `${pad(index + 1)} / ${pad(previewItems.length)}`;

    if (item.layout === "pages" && images.length > 1) {
      media.innerHTML = `
        <div class="banner-viewer project-preview project-preview--pages">
          <span class="banner-format-label">${file.displayMode === "compact" ? "모바일 배너" : "PC 배너"}</span>
          <button class="viewer-action prev material-symbols-outlined" type="button" data-page-step="-1" aria-label="이전 페이지" ${selectedPageIndex === 0 ? "disabled" : ""}>chevron_left</button>
          <img class="${file.displayMode === "compact" ? "is-compact-page" : ""}" src="${file.src}" alt="${file.alt || `${item.title} ${selectedPageIndex + 1}페이지`}">
          <button class="viewer-action next material-symbols-outlined" type="button" data-page-step="1" aria-label="다음 페이지" ${selectedPageIndex === images.length - 1 ? "disabled" : ""}>chevron_right</button>
          <span class="page-preview-indicator" aria-live="polite">${selectedPageIndex + 1} / ${images.length}</span>
          <button class="viewer-action expand material-symbols-outlined" type="button" data-fullscreen aria-label="전체 화면으로 보기">fullscreen</button>
        </div>
      `;
      bindPageNavigation(media, images.length);
      bindFullscreen(media);
      return;
    }

    if (project.type === "product") {
      media.innerHTML = `
        <div class="product-viewer" tabindex="0" aria-label="세로형 상세페이지 미리보기">
          <img src="${file.src}" alt="${file.alt}">
          <button class="viewer-action expand material-symbols-outlined" type="button" data-fullscreen aria-label="전체 화면으로 보기">fullscreen</button>
        </div>
      `;
      bindFullscreen(media);
      return;
    }

    if (project.type === "video") {
      media.innerHTML = `
        <div class="video-viewer">
          <video src="${file.src}" poster="${file.thumbnail || project.listThumbnail || ""}" controls playsinline preload="metadata" data-video-main-preview aria-label="${file.alt || file.title}"></video>
          <button class="viewer-action expand material-symbols-outlined" type="button" data-fullscreen aria-label="전체 화면으로 보기">fullscreen</button>
        </div>
      `;
      prepareVideoMainPreview(media);
      bindFullscreen(media);
      return;
    }

    if (project.category === "asset") {
      media.innerHTML = `
        <div class="editorial-viewer asset-main-viewer">
          <img src="${file.src}" alt="${file.alt}">
          <button class="viewer-action expand material-symbols-outlined" type="button" data-lightbox-open aria-haspopup="dialog" aria-controls="assetImageLightbox" aria-label="${project.title} 이미지 확대">fullscreen</button>
        </div>
        <div class="image-lightbox" id="assetImageLightbox" data-image-lightbox role="dialog" aria-modal="true" aria-label="${project.title} 확대 이미지" hidden>
          <button class="image-lightbox-close material-symbols-outlined" type="button" data-lightbox-close aria-label="확대 이미지 닫기">close</button>
          <div class="image-lightbox-content">
            <img src="${file.src}" alt="${file.alt} 확대 보기">
          </div>
        </div>
      `;
      imageLightboxCleanup = bindImageLightbox(media);
      return;
    }

    media.innerHTML = `
      <div class="${project.type === "editorial" ? "editorial-viewer" : "banner-viewer"}">
        <button class="viewer-action prev material-symbols-outlined" type="button" data-step="-1" aria-label="${previousLabel}">chevron_left</button>
        <img src="${file.src}" alt="${file.alt}">
        <button class="viewer-action next material-symbols-outlined" type="button" data-step="1" aria-label="${nextLabel}">chevron_right</button>
        <button class="viewer-action expand material-symbols-outlined" type="button" data-fullscreen aria-label="전체 화면으로 보기">fullscreen</button>
      </div>
    `;
    bindMediaNavigation(media);
    bindFullscreen(media);
  }

  function bindImageLightbox(media) {
    const openButton = media.querySelector("[data-lightbox-open]");
    const lightbox = media.querySelector("[data-image-lightbox]");
    const closeButton = media.querySelector("[data-lightbox-close]");
    if (!openButton || !lightbox || !closeButton) return null;

    const close = (restoreFocus = true) => {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove("lightbox-open");
      if (restoreFocus) openButton.focus();
    };
    const onKeydown = (event) => {
      if (event.key === "Escape" && !lightbox.hidden) close();
    };
    const onBackdropClick = (event) => {
      if (!event.target.closest(".image-lightbox-content img")) close();
    };

    openButton.addEventListener("click", () => {
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    });
    closeButton.addEventListener("click", () => close());
    lightbox.addEventListener("click", onBackdropClick);
    document.addEventListener("keydown", onKeydown);

    return () => {
      close(false);
      document.removeEventListener("keydown", onKeydown);
    };
  }

  function renderEditorialCaseStudy(media, project) {
    const content = project.caseStudy;
    const proposalImages = content.proposals.map((src, index) => `
      <figure class="case-study-figure">
        <img src="${src}" alt="명함 디자인 시안 ${index + 1}">
      </figure>
    `).join("");
    const finalImages = content.final.map((src, index) => `
      <figure class="case-study-figure">
        <img src="${src}" alt="최종 명함 ${index === 0 ? "앞면" : "뒷면"}">
        <figcaption>${index === 0 ? "Front" : "Back"}</figcaption>
      </figure>
    `).join("");

    media.classList.add("editorial-case-study-card");
    media.innerHTML = `
      <article class="editorial-case-study">
        <section class="case-study-section case-study-hero">
          <header>
            <p class="case-study-kicker">01</p>
            <h2>Brand Business Card Design</h2>
            <p>전달받은 기획서를 바탕으로 브랜드의 인상과 정보 전달력을 함께 고려한 명함 디자인을 제작했습니다.</p>
          </header>
          <figure class="case-study-figure">
            <img src="${content.main}" alt="브랜드 명함 디자인 프로젝트 메인 배너">
          </figure>
        </section>
        <section class="case-study-section">
          <header>
            <p class="case-study-kicker">02</p>
            <h2>Design Proposals</h2>
            <p>레이아웃과 컬러, 정보 강조 방식에 차이를 둔 여러 가지 시안을 제작해 선택지를 제안했습니다.</p>
          </header>
          <div class="case-study-grid case-study-grid--proposals">${proposalImages}</div>
        </section>
        <section class="case-study-section">
          <header>
            <p class="case-study-kicker">03</p>
            <h2>Final Design</h2>
            <p>선택된 시안을 바탕으로 정보 간 위계와 여백을 조정해 최종 디자인을 완성했습니다.</p>
          </header>
          <div class="case-study-grid case-study-grid--final">${finalImages}</div>
        </section>
        <section class="case-study-section">
          <header>
            <p class="case-study-kicker">04</p>
            <h2>Print-ready Output</h2>
            <p>인쇄 규격과 제작 기준을 반영해 별도의 추가 수정 없이 인쇄소에 전달할 수 있는 최종 파일로 정리했습니다.</p>
          </header>
          <figure class="case-study-figure">
            <img src="${content.printReady}" alt="재단선과 인쇄 제작 기준을 반영한 인쇄용 결과물">
            <figcaption>명함 규격 · 재단 여백 · CMYK 컬러 모드 · 서체 아웃라인 적용</figcaption>
          </figure>
        </section>
      </article>
    `;
  }

  function bindMediaNavigation(media) {
    media.querySelectorAll("[data-step]").forEach((button) => {
      button.addEventListener("click", () => moveFile(Number(button.dataset.step)));
    });
  }

  function bindPageNavigation(media, pageCount) {
    media.querySelectorAll("[data-page-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextPage = selectedPageIndex + Number(button.dataset.pageStep);
        if (nextPage < 0 || nextPage >= pageCount) return;
        selectedPageIndex = nextPage;
        renderDetail();
      });
    });
  }

  function bindFullscreen(media) {
    const button = media.querySelector("[data-fullscreen]");
    const target = button && button.closest(".product-viewer, .video-viewer, .editorial-viewer, .banner-viewer");
    if (!button || !target) return;

    const zoomImage = target.classList.contains("banner-viewer")
      ? target.querySelector("img")
      : null;

    if (zoomImage) {
      zoomImage.addEventListener("click", () => {
        if (document.fullscreenElement !== target) return;
        const fittedSize = zoomImage.getBoundingClientRect();
        const isZoomed = !target.classList.contains("is-zoomed");
        target.classList.toggle("is-zoomed", isZoomed);
        zoomImage.style.width = isZoomed ? `${Math.round(fittedSize.width * 1.75)}px` : "";
        zoomImage.style.height = isZoomed ? `${Math.round(fittedSize.height * 1.75)}px` : "";
        zoomImage.setAttribute("aria-label", isZoomed ? "이미지 축소" : "이미지 확대");

        window.requestAnimationFrame(() => {
          target.scrollLeft = isZoomed ? Math.max(0, (target.scrollWidth - target.clientWidth) / 2) : 0;
          target.scrollTop = isZoomed ? Math.max(0, (target.scrollHeight - target.clientHeight) / 2) : 0;
        });
      });
    }

    button.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await target.requestFullscreen();
      } catch (error) {
        console.warn("전체 화면을 열 수 없습니다.", error);
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const isFullscreen = document.fullscreenElement === target;
      if (!isFullscreen) {
        target.classList.remove("is-zoomed");
        if (zoomImage) {
          zoomImage.style.width = "";
          zoomImage.style.height = "";
          zoomImage.setAttribute("aria-label", "이미지 확대");
        }
      }
      button.textContent = isFullscreen ? "fullscreen_exit" : "fullscreen";
      button.setAttribute("aria-label", isFullscreen ? "전체 화면 종료" : "전체 화면으로 보기");
    }, { once: false });
  }

  function renderThumbs(project, activeIndex) {
    const thumbs = document.getElementById("detailThumbs");
    const wrap = thumbs.closest(".thumbs-wrap");
    const previewItems = getFilteredPreviewItems(project);
    renderPreviewFilters(project, wrap);
    thumbs.innerHTML = previewItems.map((item, index) => {
      const firstImage = item.images && item.images[0] ? item.images[0] : item;
      const thumbnail = project.id === "banner-winter-sale"
        ? `assets/images/projects/banner-winter-thumb-clean-${pad(index + 1)}.png`
        : (item.thumbnail || firstImage.thumbnail || firstImage.src);
      const thumbnailMedia = project.type === "video" && firstImage.src
        ? `<video src="${firstImage.src}" muted playsinline preload="metadata" data-video-thumbnail aria-label="${item.title} 대표 장면"></video>`
        : `<img src="${thumbnail}" alt="${item.title} 미니 썸네일">`;
      return `
      <button class="thumb-button${index === activeIndex ? " is-active" : ""}" type="button" data-file-index="${index}" aria-label="${item.title} 보기">
        ${thumbnailMedia}
        <span>${item.title}</span>
        ${firstImage.duration ? `<em>${firstImage.duration}</em>` : ""}
      </button>
    `;
    }).join("");
    thumbs.querySelectorAll("[data-file-index]").forEach((button) => {
      button.addEventListener("click", () => setFile(Number(button.dataset.fileIndex)));
    });
    prepareVideoThumbnails(thumbs);
  }

  function prepareVideoThumbnails(root = document) {
    root.querySelectorAll("video[data-video-thumbnail]").forEach((video) => {
      const showMainFrame = () => {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        const latestFrame = Math.max(video.duration - 0.1, 0);
        video.currentTime = Math.min(Math.max(video.duration * 0.2, 0.5), latestFrame);
      };
      video.addEventListener("loadedmetadata", showMainFrame, { once: true });
      video.addEventListener("seeked", () => video.pause(), { once: true });
      if (video.readyState >= 1) showMainFrame();
    });
  }

  function prepareVideoMainPreview(root) {
    const video = root.querySelector("video[data-video-main-preview]");
    if (!video) return;
    let previewTime = 0;
    let shouldResetOnPlay = true;

    video.addEventListener("loadedmetadata", () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      previewTime = Math.min(Math.max(video.duration * 0.2, 0.5), Math.max(video.duration - 0.1, 0));
      video.currentTime = previewTime;
    }, { once: true });

    video.addEventListener("seeked", () => {
      video.pause();
      video.removeAttribute("poster");
    }, { once: true });

    video.addEventListener("play", () => {
      if (!shouldResetOnPlay || Math.abs(video.currentTime - previewTime) > 0.25) return;
      shouldResetOnPlay = false;
      video.currentTime = 0;
    });
  }

  function renderPreviewFilters(project, wrap) {
    if (!wrap) return;
    const existing = wrap.querySelector("[data-preview-filters]");
    if (!project.previewFilters || project.previewFilters.length === 0) {
      if (existing) existing.remove();
      return;
    }

    const filters = existing || document.createElement("div");
    filters.className = "preview-filter-row";
    filters.dataset.previewFilters = "";
    filters.setAttribute("aria-label", `${project.title} 상품군 필터`);
    filters.innerHTML = project.previewFilters.map((filter) => `
      <button class="preview-filter-button${filter.id === selectedPreviewCategory ? " is-active" : ""}" type="button" data-preview-category="${filter.id}" aria-pressed="${filter.id === selectedPreviewCategory}">${filter.label}</button>
    `).join("");
    if (!existing) wrap.insertBefore(filters, wrap.firstChild);

    filters.querySelectorAll("[data-preview-category]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedPreviewCategory = button.dataset.previewCategory;
        selectedFileIndex = 0;
        selectedPageIndex = 0;
        history.replaceState(null, "", `${window.location.pathname}${window.location.search}#file-1`);
        renderDetail();
      });
    });
  }

  function renderPanels(project) {
    const panels = document.getElementById("detailPanels");
    const visibleImprovements = getVisibleImprovements(project);
    const customAccordions = project.accordions && project.accordions.length
      ? project.accordions.map((item) => `
          <section class="accordion-item${openDetailAccordion === item.id ? " is-open" : ""}" data-accordion-item="${item.id}">
            <button class="accordion-trigger" type="button" aria-expanded="${openDetailAccordion === item.id}" aria-controls="${project.id}-${item.id}-panel">
              <span><span class="material-symbols-outlined" aria-hidden="true">${item.icon || "notes"}</span>${item.title}</span>
              <span class="material-symbols-outlined accordion-arrow" aria-hidden="true">keyboard_arrow_down</span>
            </button>
            <div class="accordion-content" id="${project.id}-${item.id}-panel" role="region">
              <div class="accordion-content-inner"><p>${item.content.replace(/\n\n/g, "<br><br>")}</p></div>
            </div>
          </section>
        `).join("")
      : null;
    panels.innerHTML = `
      <section class="info-panel detail-info-panel">
        <div class="project-info-section">
          <h2><span class="material-symbols-outlined" aria-hidden="true">info</span> 프로젝트 정보</h2>
          <dl class="info-list">
            ${project.category === "asset" ? "" : `<div><dt>작업 기간</dt><dd>${project.period}</dd></div>`}
            ${project.projectType ? `<div><dt>프로젝트 형태</dt><dd>${project.projectType}</dd></div>` : ""}
            <div><dt>역할</dt><dd>${project.role}</dd></div>
            <div><dt>작업 범위</dt><dd>${project.scope}</dd></div>
            ${project.deliverables ? `<div><dt>결과물</dt><dd>${project.deliverables}</dd></div>` : ""}
            ${project.videoInfo ? `<div><dt>영상 정보</dt><dd>${project.videoInfo}</dd></div>` : ""}
            <div><dt>사용 툴</dt><dd>${project.tools.map((tool) => `<span class="tool-chip">${tool}</span>`).join("")}</dd></div>
          </dl>
        </div>
        <div class="detail-accordion" data-detail-accordion>
          ${customAccordions || `<section class="accordion-item${openDetailAccordion === "intention" ? " is-open" : ""}" data-accordion-item="intention">
            <button class="accordion-trigger" type="button" aria-expanded="${openDetailAccordion === "intention"}" aria-controls="planningIntentPanel">
              <span><span class="material-symbols-outlined" aria-hidden="true">lightbulb</span>${project.intentionTitle || "기획 의도"}</span>
              <span class="material-symbols-outlined accordion-arrow" aria-hidden="true">keyboard_arrow_down</span>
            </button>
            <div class="accordion-content" id="planningIntentPanel" role="region">
              <div class="accordion-content-inner"><p>${project.intention.replace(/\n\n/g, "<br><br>")}</p></div>
            </div>
          </section>
          <section class="accordion-item${openDetailAccordion === "improvements" ? " is-open" : ""}" data-accordion-item="improvements">
            <button class="accordion-trigger" type="button" aria-expanded="${openDetailAccordion === "improvements"}" aria-controls="improvementsPanel">
              <span><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>${project.improvementTitle || "핵심 개선"}</span>
              <span class="material-symbols-outlined accordion-arrow" aria-hidden="true">keyboard_arrow_down</span>
            </button>
            <div class="accordion-content" id="improvementsPanel" role="region">
              <div class="accordion-content-inner" aria-live="polite">
                <ul class="improvement-list">
                  ${visibleImprovements.map((item) => `<li>${item.title ? `<strong>${item.title}</strong>` : ""}${item.description ? `<span>${item.description.replace(/\n\n/g, "<br><br>")}</span>` : ""}</li>`).join("")}
                </ul>
              </div>
            </div>
          </section>`}
        </div>
      </section>
    `;
    bindDetailAccordion(panels);
  }

  function getVisibleImprovements(project) {
    if (!project.productCategories || project.productCategories.length === 0) return project.improvements;

    const previewItems = getFilteredPreviewItems(project);
    const selectedItem = previewItems[selectedFileIndex] || previewItems[0];
    const selectedCategory = project.productCategories.find((category) => category.fileId === selectedItem?.id)
      || project.productCategories[0];
    const commonImprovement = project.improvements[0];

    return [
      commonImprovement,
      { title: selectedCategory.title, description: selectedCategory.description }
    ].filter(Boolean);
  }

  function bindDetailAccordion(panels) {
    const items = Array.from(panels.querySelectorAll("[data-accordion-item]"));
    items.forEach((item) => {
      const trigger = item.querySelector(".accordion-trigger");
      trigger.addEventListener("click", () => {
        const itemId = item.dataset.accordionItem;
        openDetailAccordion = openDetailAccordion === itemId ? null : itemId;
        items.forEach((candidate) => {
          const isOpen = candidate.dataset.accordionItem === openDetailAccordion;
          candidate.classList.toggle("is-open", isOpen);
          candidate.querySelector(".accordion-trigger").setAttribute("aria-expanded", String(isOpen));
        });
      });
    });
  }

  function renderDetailNav(project) {
    const nav = document.getElementById("detailNav");
    const primary = service.getProjectsByCategory(project.category);
    const index = primary.findIndex((item) => item.id === project.id);
    const previous = primary[(index - 1 + primary.length) % primary.length];
    const next = primary[(index + 1) % primary.length];
    const categories = Object.keys(pageLinks).filter((category) => service.getProjectsByCategory(category).length > 0);
    nav.innerHTML = `
      <span class="project-nav-hover-hint" aria-hidden="true">마우스를 올려 프로젝트 메뉴 보기</span>
      <a href="${pageLinks[previous.category]}?project=${encodeURIComponent(previous.id)}" aria-label="이전 프로젝트 ${previous.title}"><span class="material-symbols-outlined" aria-hidden="true">chevron_left</span><span><small>이전 프로젝트</small>${previous.title}</span></a>
      <button class="all-projects" type="button" data-category-dialog-toggle aria-haspopup="dialog" aria-expanded="false" aria-controls="categoryDialog"><span class="material-symbols-outlined" aria-hidden="true">grid_view</span> 카테고리 목록</button>
      <a href="${pageLinks[next.category]}?project=${encodeURIComponent(next.id)}" aria-label="다음 프로젝트 ${next.title}"><span><small>다음 프로젝트</small>${next.title}</span><span class="material-symbols-outlined" aria-hidden="true">chevron_right</span></a>
      <div class="category-dialog-root" data-category-dialog hidden>
        <div class="category-dialog-overlay" data-category-dialog-close></div>
        <section class="category-dialog" id="categoryDialog" role="dialog" aria-modal="true" aria-labelledby="categoryDialogTitle" tabindex="-1">
          <header class="category-dialog-header">
            <h2 id="categoryDialogTitle">카테고리 목록</h2>
            <button class="category-dialog-close material-symbols-outlined" type="button" data-category-dialog-close aria-label="카테고리 목록 닫기">close</button>
          </header>
          <nav class="category-dialog-list" aria-label="카테고리">
            ${categories.map((category) => `
              <a class="${category === project.category ? "is-active" : ""}" href="${pageLinks[category]}" ${category === project.category ? 'aria-current="page"' : ""} data-category-dialog-link>
                <span class="material-symbols-outlined" aria-hidden="true">${categoryIcons[category] || "folder"}</span>
                <span>${labels[category]}</span>
                <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </a>`).join("")}
          </nav>
        </section>
      </div>
    `;
    bindCategoryDialog(nav);
  }

  function bindCategoryDialog(nav) {
    if (categoryDialogCleanup) categoryDialogCleanup();
    const dialogRoot = nav.querySelector("[data-category-dialog]");
    const dialog = nav.querySelector(".category-dialog");
    const toggle = nav.querySelector("[data-category-dialog-toggle]");
    const closeButtons = nav.querySelectorAll("[data-category-dialog-close]");
    const links = nav.querySelectorAll("[data-category-dialog-link]");
    let closeTimer = null;
    if (!dialogRoot || !dialog || !toggle) return;

    function openDialog() {
      window.clearTimeout(closeTimer);
      dialogRoot.hidden = false;
      dialogRoot.classList.remove("is-closing");
      document.body.classList.add("category-dialog-open");
      toggle.setAttribute("aria-expanded", "true");
      window.requestAnimationFrame(() => dialogRoot.classList.add("is-open"));
      const firstFocusTarget = dialogRoot.querySelector(".category-dialog-close") || links[0] || dialog;
      firstFocusTarget.focus();
    }

    function closeDialog(restoreFocus = true) {
      if (dialogRoot.hidden) return;
      dialogRoot.classList.remove("is-open");
      dialogRoot.classList.add("is-closing");
      document.body.classList.remove("category-dialog-open");
      toggle.setAttribute("aria-expanded", "false");
      closeTimer = window.setTimeout(() => {
        dialogRoot.classList.remove("is-closing");
        dialogRoot.hidden = true;
      }, 200);
      if (restoreFocus) toggle.focus();
    }

    function onKeydown(event) {
      if (event.key === "Escape") closeDialog();
    }

    toggle.addEventListener("click", () => {
      if (dialogRoot.hidden) openDialog();
      else closeDialog();
    });
    closeButtons.forEach((button) => button.addEventListener("click", () => closeDialog()));
    dialog.addEventListener("click", (event) => event.stopPropagation());
    links.forEach((link) => link.addEventListener("click", () => closeDialog(false)));
    document.addEventListener("keydown", onKeydown);

    categoryDialogCleanup = () => {
      document.removeEventListener("keydown", onKeydown);
      document.body.classList.remove("category-dialog-open");
      window.clearTimeout(closeTimer);
    };
  }

  function getPreviewItems(project) {
    if (project.previewGroups && project.previewGroups.length) return project.previewGroups;
    return project.files.map((file) => ({
      id: file.id,
      title: file.title,
      thumbnail: file.thumbnail || file.src,
      category: file.category || "all",
      pageLabel: file.pageLabel,
      images: [file]
    }));
  }

  function getFilteredPreviewItems(project) {
    const items = getPreviewItems(project);
    if (selectedPreviewCategory === "all") return items;
    const filtered = items.filter((item) => item.category === selectedPreviewCategory);
    return filtered.length ? filtered : items;
  }

  function moveFile(step) {
    const total = getFilteredPreviewItems(currentProject).length;
    setFile((selectedFileIndex + step + total) % total);
  }

  function setFile(index) {
    selectedFileIndex = index;
    selectedPageIndex = 0;
    window.location.hash = `file-${index + 1}`;
    renderDetail();
  }

  function getIndexFromHash(total) {
    const match = window.location.hash.match(/file-(\d+)/);
    const index = match ? Number(match[1]) - 1 : 0;
    return Math.max(0, Math.min(index, total - 1));
  }

  function protectImages(root = document) {
    root.querySelectorAll("img").forEach((image) => {
      if (!image.hasAttribute("loading") && image.getAttribute("fetchpriority") !== "high") image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => {
        if (!image.src.includes(fallbackImage)) image.src = fallbackImage;
      }, { once: true });
    });
    initRevealAnimations(root);
  }

  function initRevealAnimations(root = document) {
    const targets = root.querySelectorAll("[data-reveal], .project-card, .detail-heading, .viewer-card, .info-panel, .thumbs-wrap");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -16% 0px", threshold: 0.12 });
    }
    targets.forEach((target, index) => {
      if (target.classList.contains("is-visible") || target.dataset.revealBound === "true") return;
      target.dataset.revealBound = "true";
      target.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`);
      revealObserver.observe(target);
    });
  }

  function pad(number) {
    return String(number).padStart(2, "0");
  }
})();
