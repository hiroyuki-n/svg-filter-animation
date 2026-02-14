/**
 * SVG Filter Animation Generator
 * feTurbulence + feDisplacementMap による波打つアニメーションを生成
 */
(function () {
  "use strict";

  // ========== Constants ==========
  const KEYFRAME_COUNT = 5;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const DEFAULT_STATE = {
    baseFrequency: 0.05,
    numOctaves: 3,
    turbulenceType: "fractalNoise",
    scales: [2, 6, 3, 4, 3],
    duration: 0.5,
    infinite: true,
    imgWidth: 100,
  };

  const PRESETS = {
    strength1: {
      baseFrequency: 0.02,
      numOctaves: 2,
      turbulenceType: "fractalNoise",
      scales: [0, 2, 1, 2, 1],
      imgWidth: 100,
    },
    strength2: {
      baseFrequency: 0.03,
      numOctaves: 2,
      turbulenceType: "fractalNoise",
      scales: [1, 4, 2, 3, 2],
      imgWidth: 100,
    },
    strength3: {
      baseFrequency: 0.05,
      numOctaves: 3,
      turbulenceType: "fractalNoise",
      scales: [2, 6, 3, 5, 4],
      imgWidth: 100,
    },
    strength4: {
      baseFrequency: 0.06,
      numOctaves: 4,
      turbulenceType: "fractalNoise",
      scales: [4, 10, 6, 9, 6],
      imgWidth: 100,
    },
    strength5: {
      baseFrequency: 0.08,
      numOctaves: 6,
      turbulenceType: "turbulence",
      scales: [8, 18, 12, 16, 10],
      imgWidth: 100,
    },
  };

  const PRESET_IMAGES = [
    "img/meteor.svg",
    "img/flag.svg",
    "img/serif.svg",
    "img/wallet.svg",
    "img/thought.svg",
    "img/heart.svg",
    "img/hands.svg",
    "img/mail.svg",
  ];

  const RANGE_INPUTS = [
    { id: "baseFrequency", key: "baseFrequency", parse: Number },
    { id: "numOctaves", key: "numOctaves", parse: Number },
    { id: "duration", key: "duration", parse: Number },
    { id: "imgWidth", key: "imgWidth", parse: Number },
  ];

  // ========== State ==========
  let state = { ...DEFAULT_STATE, scales: [...DEFAULT_STATE.scales] };
  let currentPresetSrc = null;
  let uploadedSvgData = null;

  // ========== DOM Helpers ==========
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

  // ========== Filter / SVG Logic ==========
  function buildFilterElement(i) {
    return {
      turbulence: {
        type: state.turbulenceType,
        baseFrequency: state.baseFrequency,
        numOctaves: state.numOctaves,
        result: "noise",
        seed: i,
      },
      displacement: { scale: state.scales[i] },
    };
  }

  function createFilterSvgElement(filterData, i) {
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", `svg_filter_${i}`);

    const turbulence = document.createElementNS(SVG_NS, "feTurbulence");
    Object.entries(filterData.turbulence).forEach(([k, v]) =>
      turbulence.setAttribute(k, String(v))
    );

    const displacement = document.createElementNS(SVG_NS, "feDisplacementMap");
    displacement.setAttribute("in", "SourceGraphic");
    displacement.setAttribute("in2", "noise");
    displacement.setAttribute("scale", String(filterData.displacement.scale));

    filter.append(turbulence, displacement);
    return filter;
  }

  function createFilterHtmlString(filterData, i) {
    const t = filterData.turbulence;
    const d = filterData.displacement;
    return `  <filter id="svg_filter_${i}">
    <feTurbulence type="${t.type}" baseFrequency="${t.baseFrequency}" numOctaves="${t.numOctaves}" result="${t.result}" seed="${t.seed}" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${d.scale}" />
  </filter>`;
  }

  function getKeyframesCss() {
    return Array.from({ length: KEYFRAME_COUNT }, (_, i) => {
      const pct = (i / (KEYFRAME_COUNT - 1)) * 100;
      return `${pct}% { filter: url(#svg_filter_${i}); }`;
    }).join("\n");
  }

  // ========== Preview & Output ==========
  function getPreviewIcons() {
    return $$("#preview-heading img");
  }

  function updateSvgFilters() {
    const container = $("#svg-container");
    if (!container) return;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.style.cssText = "position:absolute;width:0;height:0;";

    for (let i = 0; i < KEYFRAME_COUNT; i++) {
      svg.appendChild(createFilterSvgElement(buildFilterElement(i), i));
    }

    container.innerHTML = "";
    container.appendChild(svg);
  }

  function updateKeyframes() {
    let style = $("#dynamic-keyframes");
    if (!style) {
      style = document.createElement("style");
      style.id = "dynamic-keyframes";
      document.head.appendChild(style);
    }
    style.textContent = `@keyframes svg_filter {\n${getKeyframesCss()}\n}`;
  }

  function updateAnimation() {
    const iter = state.infinite ? "infinite" : "1";
    const anim = `svg_filter ${state.duration}s ${iter}`;
    getPreviewIcons().forEach((el) => {
      el.style.animation = anim;
      el.style.width = `${state.imgWidth}px`;
    });
  }

  function generateHtmlFilterCode() {
    const filters = Array.from({ length: KEYFRAME_COUNT }, (_, i) =>
      createFilterHtmlString(buildFilterElement(i), i)
    ).join("\n");
    return `<svg style="position:absolute;width:0;height:0;">\n${filters}\n</svg>`;
  }

  function generateCssCode() {
    const iter = state.infinite ? "infinite" : "1";
    return `@keyframes svg_filter {
${getKeyframesCss()}
}

img {
  width: ${state.imgWidth}px;
  animation: svg_filter ${state.duration}s ${iter};
}`;
  }

  function updateCodeDisplay() {
    const htmlEl = $("#code-html code");
    const cssEl = $("#code-css code");
    if (htmlEl) htmlEl.textContent = generateHtmlFilterCode();
    if (cssEl) cssEl.textContent = generateCssCode();
  }

  function apply() {
    updateSvgFilters();
    updateKeyframes();
    updateAnimation();
    updateCodeDisplay();
  }

  // ========== Download ==========
  function buildAnimatedSvgContent(svg) {
    const viewBox =
      svg.getAttribute("viewBox") ||
      `0 0 ${svg.getAttribute("width") || "100"} ${svg.getAttribute("height") || "100"}`;
    const width = svg.getAttribute("width") || "100";
    const height = svg.getAttribute("height") || "100";
    const iter = state.infinite ? "infinite" : "1";
    const dur = `${state.duration}s`;
    const filters = Array.from({ length: KEYFRAME_COUNT }, (_, i) =>
      createFilterHtmlString(buildFilterElement(i), i)
    ).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${SVG_NS}" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}" width="${width}" height="${height}">
<defs>
${filters}
</defs>
<style>
@keyframes svg_filter {
${getKeyframesCss()}
}
.anim { animation: svg_filter ${dur} ${iter}; }
</style>
<g class="anim">${svg.innerHTML}</g>
</svg>`;
  }

  function createAnimatedSvg(svgText) {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    return svg ? buildAnimatedSvgContent(svg) : null;
  }

  function triggerDownload(content, filename) {
    const blob = new Blob([content], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function downloadSvg(src, btnEl) {
    const origText = btnEl.textContent;
    btnEl.textContent = "生成中...";
    btnEl.disabled = true;

    try {
      const res = await fetch(src);
      const svgText = await res.text();
      const animated = createAnimatedSvg(svgText);
      if (!animated) throw new Error("SVGの解析に失敗しました");
      triggerDownload(animated, src.replace("img/", "animated_"));
    } catch (err) {
      console.error(err);
      btnEl.textContent = "エラー";
    }

    btnEl.textContent = origText;
    btnEl.disabled = false;
  }

  function downloadSvgFromText(svgText, filename) {
    const animated = createAnimatedSvg(svgText);
    if (!animated) {
      alert("SVGの解析に失敗しました");
      return;
    }
    triggerDownload(animated, filename.replace(/\.svg$/i, "_animated.svg"));
  }

  // ========== UI State ==========
  function clearPresetActive() {
    $$(".preset-btn").forEach((b) => b.classList.remove("active"));
  }

  function syncStateToUI() {
    RANGE_INPUTS.forEach(({ id, key }) => {
      const el = $(`#${id}`);
      const valueEl = $(`#${id}-value`);
      if (el) el.value = state[key];
      if (valueEl) valueEl.textContent = state[key];
    });

    $$('input[name="turbulenceType"]').forEach((radio) => {
      radio.checked = radio.value === state.turbulenceType;
    });

    for (let i = 0; i < KEYFRAME_COUNT; i++) {
      const el = $(`#scale${i}`);
      const valueEl = $(`#scale${i}-value`);
      if (el) el.value = state.scales[i];
      if (valueEl) valueEl.textContent = state.scales[i];
    }
  }

  function applyPreset(presetId) {
    const preset = PRESETS[presetId];
    if (!preset) return;
    state = {
      ...state,
      ...preset,
      scales: [...(preset.scales || state.scales)],
      infinite: state.infinite,
    };
    syncStateToUI();
    apply();
  }

  function reset() {
    state = { ...DEFAULT_STATE, scales: [...DEFAULT_STATE.scales] };
    clearPresetActive();
    syncStateToUI();
    apply();
  }

  // ========== Event Handlers ==========
  function bindRangeInput({ id, key, parse }) {
    const el = $(`#${id}`);
    if (!el) return;
    el.addEventListener("input", () => {
      state[key] = parse(el.value);
      const valueEl = $(`#${id}-value`);
      if (valueEl) valueEl.textContent = el.value;
      clearPresetActive();
      apply();
    });
  }

  function bindScaleInputs() {
    for (let i = 0; i < KEYFRAME_COUNT; i++) {
      const el = $(`#scale${i}`);
      if (!el) continue;
      el.addEventListener("input", () => {
        state.scales[i] = Number(el.value);
        const valueEl = $(`#scale${i}-value`);
        if (valueEl) valueEl.textContent = el.value;
        clearPresetActive();
        apply();
      });
    }
  }

  function bindRadioGroup(name, key) {
    $$(`input[name="${name}"]`).forEach((radio) => {
      radio.addEventListener("change", () => {
        const checked = $(`input[name="${name}"]:checked`);
        if (checked) state[key] = checked.value;
        clearPresetActive();
        apply();
      });
    });
  }

  function handleSvgUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".svg")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const svgText = ev.target?.result;
      if (typeof svgText !== "string") return;

      uploadedSvgData = { text: svgText, name: file.name };
      const heading = $("#preview-heading");
      if (heading) {
        heading.innerHTML = "";
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        heading.appendChild(img);
      }
      updateDownloadButtons();
      apply();
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function copyToClipboard(btn, text) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> コピーしました！';
      setTimeout(() => (btn.innerHTML = orig), 2000);
    });
  }

  // ========== Init ==========
  function initPreviewHeading() {
    const heading = $("#preview-heading");
    if (!heading) return;
    currentPresetSrc =
      PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)];
    const img = document.createElement("img");
    img.src = currentPresetSrc;
    img.alt = "";
    heading.appendChild(img);
  }

  function updateDownloadButtons() {
    const container = $("#download-buttons");
    if (!container) return;
    container.innerHTML = "";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "download-btn";

    if (uploadedSvgData) {
      btn.textContent = "アップロード画像をダウンロード";
      btn.addEventListener("click", () =>
        downloadSvgFromText(uploadedSvgData.text, uploadedSvgData.name)
      );
    } else if (currentPresetSrc) {
      btn.textContent = currentPresetSrc.replace("img/", "");
      btn.setAttribute("data-src", currentPresetSrc);
      btn.addEventListener("click", () => downloadSvg(currentPresetSrc, btn));
    }

    if (btn.textContent) container.appendChild(btn);
  }

  function init() {
    RANGE_INPUTS.forEach(bindRangeInput);
    bindRadioGroup("turbulenceType", "turbulenceType");
    bindScaleInputs();

    $("#reset")?.addEventListener("click", reset);

    $$(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        clearPresetActive();
        btn.classList.add("active");
        applyPreset(btn.getAttribute("data-preset"));
      });
    });

    $("#copy-html")?.addEventListener("click", () => {
      const text = $("#code-html code")?.textContent || "";
      copyToClipboard($("#copy-html"), text);
    });
    $("#copy-css")?.addEventListener("click", () => {
      const text = $("#code-css code")?.textContent || "";
      copyToClipboard($("#copy-css"), text);
    });

    $("#svgUpload")?.addEventListener("change", handleSvgUpload);

    initPreviewHeading();
    updateDownloadButtons();
    apply();
  }

  init();
})();
