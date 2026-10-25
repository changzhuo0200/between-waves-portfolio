(() => {
  "use strict";

  const projectAssets = {
    a03: {
      title: "游戏中的中式文化审美与输出",
      description: "完整浏览 39 页文化研究与公开分享作品。",
      pdf: "assets/liner-notes/a03-cultural-aesthetics.pdf",
    },
    a04: {
      title: "从玩游戏的人，到分析游戏的人",
      description: "完整浏览 18 页一对一游戏质性分析课程大纲。",
      pdf: "assets/liner-notes/a04-course-outline.pdf",
    },
  };

  const qs = (selector, root = document) => root.querySelector(selector);

  function updateFigure(figure, { src, alt, caption, previewLabel }) {
    if (!figure) return;
    const image = qs("img", figure);
    const captionElement = qs("figcaption", figure);
    const captionText = captionElement && qs("span", captionElement);

    if (image) {
      image.src = src;
      image.alt = alt;
    }
    if (captionText) captionText.textContent = caption;

    let action = captionElement && qs("a, button", captionElement);
    if (!captionElement) return;
    if (!action) {
      action = document.createElement("button");
      captionElement.append(action);
    } else if (action.tagName === "A") {
      const button = document.createElement("button");
      action.replaceWith(button);
      action = button;
    }

    action.type = "button";
    action.className = "media-preview-trigger";
    action.textContent = previewLabel;
    action.dataset.previewSrc = src;
    action.dataset.previewAlt = alt;
    action.dataset.previewCaption = caption;
  }

  function createImageDialog() {
    const dialog = document.createElement("dialog");
    dialog.className = "media-lightbox";
    dialog.setAttribute("aria-label", "高清图片预览");

    const frame = document.createElement("div");
    frame.className = "media-lightbox__frame";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "media-lightbox__close";
    close.setAttribute("aria-label", "关闭图片预览");
    close.textContent = "关闭 ×";

    const image = document.createElement("img");
    const caption = document.createElement("p");

    frame.append(close, image, caption);
    dialog.append(frame);
    document.body.append(dialog);

    const closeDialog = () => {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      document.body.classList.remove("has-open-dialog");
    };

    close.addEventListener("click", closeDialog);
    dialog.addEventListener("close", () => document.body.classList.remove("has-open-dialog"));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });

    return { dialog, image, caption, close, closeDialog };
  }

  function setupImagePreviews() {
    const viewer = createImageDialog();

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest(".media-preview-trigger");
      if (!trigger) return;
      event.preventDefault();

      viewer.image.src = trigger.dataset.previewSrc;
      viewer.image.alt = trigger.dataset.previewAlt || "";
      viewer.caption.textContent = trigger.dataset.previewCaption || "";
      document.body.classList.add("has-open-dialog");

      if (typeof viewer.dialog.showModal === "function") viewer.dialog.showModal();
      else viewer.dialog.setAttribute("open", "");
      viewer.close.focus();
    });
  }

  function createFullWorkSection(projectId, asset) {
    const section = document.createElement("section");
    section.className = "content-block full-work-block";
    section.id = `${projectId}-full-work`;

    const header = document.createElement("header");
    header.className = "full-work-copy";
    header.innerHTML = `
      <span class="section-kicker">FULL WORK / 完整作品</span>
      <p>${asset.description}</p>
    `;

    const actions = document.createElement("div");
    actions.className = "full-work-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "full-work-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", `${projectId}-viewer`);
    toggle.textContent = "在本页浏览完整版 PDF / PPT ↓";

    actions.append(toggle);

    const viewer = document.createElement("div");
    viewer.className = "full-work-viewer";
    viewer.id = `${projectId}-viewer`;
    viewer.hidden = true;

    const iframe = document.createElement("iframe");
    iframe.title = `${asset.title}完整作品`;
    iframe.loading = "lazy";
    iframe.dataset.src = `${asset.pdf}#view=FitH&toolbar=1&navpanes=0`;
    viewer.append(iframe);

    toggle.addEventListener("click", () => {
      const shouldOpen = viewer.hidden;
      viewer.hidden = !shouldOpen;
      toggle.setAttribute("aria-expanded", String(shouldOpen));
      toggle.textContent = shouldOpen ? "收起完整版 ↑" : "在本页浏览完整版 PDF / PPT ↓";
      if (shouldOpen && !iframe.src) iframe.src = iframe.dataset.src;
      if (shouldOpen) requestAnimationFrame(() => viewer.scrollIntoView({ behavior: "smooth", block: "start" }));
    });

    section.append(header, actions, viewer);
    return section;
  }

  function setupFullWorks() {
    Object.entries(projectAssets).forEach(([projectId, asset]) => {
      const body = qs(`#${projectId} .project-body`);
      if (!body || qs(`#${projectId}-full-work`)) return;
      const evidence = qs(`#${projectId} .evidence-block`);
      if (evidence) evidence.insertAdjacentElement("afterend", createFullWorkSection(projectId, asset));
      else body.append(createFullWorkSection(projectId, asset));
    });
  }

  function setupTrackNavigation() {
    const scrollToProject = (hash, behavior = "auto") => {
      if (hash !== "#a03" && hash !== "#a04") return;
      const target = qs(hash);
      if (!target) return;
      target.scrollIntoView({ behavior, block: "start" });
    };

    document.addEventListener(
      "click",
      (event) => {
        const link = event.target.closest('a[href="#a03"], a[href="#a04"]');
        if (!link) return;
        const hash = link.getAttribute("href");
        if (!qs(hash)) return;

        event.preventDefault();
        history.pushState(null, "", hash);
        scrollToProject(
          hash,
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        );
      },
      true,
    );

    window.addEventListener("popstate", () => scrollToProject(window.location.hash));
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToProject(window.location.hash)));
    window.setTimeout(() => scrollToProject(window.location.hash), 180);
    window.addEventListener(
      "load",
      () => window.setTimeout(() => scrollToProject(window.location.hash), 80),
      { once: true },
    );
  }

  function applyContentUpdates() {
    updateFigure(qs("#a03-world .editorial-figure"), {
      src: "assets/liner-notes/a03-cover.jpg",
      alt: "浅谈游戏中的中式文化审美与输出作品首页",
      caption: "作品首页：以《崩坏：星穹铁道》为例，讨论游戏中的中式文化审美与输出。",
      previewLabel: "页面内查看高清首页 ↗",
    });

    updateFigure(qs("#a04-process .figure-1"), {
      src: "assets/liner-notes/a04-course-cover.jpg",
      alt: "游戏质性分析课程大纲首页",
      caption: "课程大纲首页：课程目标、分析框架与课堂约定的完整入口。",
      previewLabel: "页面内查看高清首页 ↗",
    });

    updateFigure(qs("#a04-process .figure-2"), {
      src: "assets/liner-notes/a04-course-case.jpg",
      alt: "课程大纲中的游戏空间与文化符号分析案例",
      caption: "课程案例页：用《赛博朋克 2077》与《原神》练习空间、符号与文化语境分析。",
      previewLabel: "页面内查看课程案例 ↗",
    });

    updateFigure(qs("#a03-output .figure-2"), {
      src: "assets/liner-notes/a03-animation-production.jpg",
      alt: "游戏文化表达中的动画制作案例页",
      caption: "媒介延伸：动画制作把文化意象转化为运动、声音与情绪节奏。",
      previewLabel: "页面内查看动画案例 ↗",
    });
  }

  function initialize() {
    if (!qs(".project-section") || document.body.dataset.linerEnhanced === "true") return false;
    document.body.dataset.linerEnhanced = "true";
    applyContentUpdates();
    setupTrackNavigation();
    setupImagePreviews();
    setupFullWorks();
    return true;
  }

  if (!initialize()) {
    const observer = new MutationObserver(() => {
      if (initialize()) observer.disconnect();
    });
    observer.observe(document.getElementById("root"), { childList: true, subtree: true });
  }
})();
