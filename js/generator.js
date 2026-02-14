(function () {
  const KEYFRAME_COUNT = 5;
  const SVG_NS = "http://www.w3.org/2000/svg";

  const DEFAULT_STATE = {
    baseFrequency: 0.02,
    numOctaves: 3,
    turbulenceType: "fractalNoise",
    scales: [2, 6, 3, 4, 3],
    duration: 0.5,
    infinite: true,
    imgWidth: 100,
  };

  let state = {
    ...DEFAULT_STATE,
    scales: [...DEFAULT_STATE.scales],
  };

  const DOM = {
    svgContainer: () => document.getElementById("svg-container"),
    dynamicKeyframes: () => document.getElementById("dynamic-keyframes"),
  };

  function getPreviewIcons() {
    const heading = document.querySelectorAll("#preview-heading img");
    const uploaded = document.querySelectorAll("#uploaded-preview img");
    return [...heading, ...uploaded];
  }

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

  function createSvgFilters() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.style.cssText = "position:absolute;width:0;height:0;";

    for (let i = 0; i < KEYFRAME_COUNT; i++) {
      svg.appendChild(
        createFilterSvgElement(buildFilterElement(i), i)
      );
    }
    return svg;
  }

  function getKeyframesCss() {
    return Array.from({ length: KEYFRAME_COUNT }, (_, i) => {
      const pct = (i / (KEYFRAME_COUNT - 1)) * 100;
      return `${pct}% { filter: url(#svg_filter_${i}); }`;
    }).join("\n");
  }

  function updateSvgFilters() {
    const container = DOM.svgContainer();
    if (!container) return;
    container.innerHTML = "";
    container.appendChild(createSvgFilters());
  }

  function updateKeyframes() {
    let style = DOM.dynamicKeyframes();
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
    const htmlEl = document.querySelector("#code-html code");
    const cssEl = document.querySelector("#code-css code");
    if (htmlEl) htmlEl.textContent = generateHtmlFilterCode();
    if (cssEl) cssEl.textContent = generateCssCode();
  }

  function apply() {
    updateSvgFilters();
    updateKeyframes();
    updateAnimation();
    updateCodeDisplay();
  }

  const RANGE_INPUTS = [
    { id: "baseFrequency", key: "baseFrequency", parse: Number },
    { id: "numOctaves", key: "numOctaves", parse: Number },
    { id: "duration", key: "duration", parse: Number },
    { id: "imgWidth", key: "imgWidth", parse: Number },
  ];

  function bindRangeInput({ id, key, parse }) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      state[key] = parse(el.value);
      const valueEl = document.getElementById(`${id}-value`);
      if (valueEl) valueEl.textContent = el.value;
      apply();
    });
  }

  function bindScaleInputs() {
    for (let i = 0; i < KEYFRAME_COUNT; i++) {
      const el = document.getElementById(`scale${i}`);
      if (!el) continue;
      el.addEventListener("input", () => {
        state.scales[i] = Number(el.value);
        const valueEl = document.getElementById(`scale${i}-value`);
        if (valueEl) valueEl.textContent = el.value;
        apply();
      });
    }
  }

  function bindRadioGroup(name, key) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
      radio.addEventListener("change", () => {
        const checked = document.querySelector(`input[name="${name}"]:checked`);
        if (checked) state[key] = checked.value;
        apply();
      });
    });
  }

  function syncStateToUI() {
    RANGE_INPUTS.forEach(({ id, key }) => {
      const el = document.getElementById(id);
      const valueEl = document.getElementById(`${id}-value`);
      if (el) el.value = state[key];
      if (valueEl) valueEl.textContent = state[key];
    });

    document.querySelectorAll('input[name="turbulenceType"]').forEach((radio) => {
      radio.checked = radio.value === state.turbulenceType;
    });

    const infiniteEl = document.getElementById("infinite");
    if (infiniteEl) infiniteEl.checked = state.infinite;

    for (let i = 0; i < KEYFRAME_COUNT; i++) {
      const el = document.getElementById(`scale${i}`);
      const valueEl = document.getElementById(`scale${i}-value`);
      if (el) el.value = state.scales[i];
      if (valueEl) valueEl.textContent = state.scales[i];
    }
  }

  function reset() {
    state = {
      ...DEFAULT_STATE,
      scales: [...DEFAULT_STATE.scales],
    };
    syncStateToUI();
    apply();
  }

  let uploadedSvgData = null;

  function init() {
    RANGE_INPUTS.forEach(bindRangeInput);
    bindRadioGroup("turbulenceType", "turbulenceType");
    bindScaleInputs();

    const infiniteEl = document.getElementById("infinite");
    if (infiniteEl) {
      infiniteEl.addEventListener("change", () => {
        state.infinite = infiniteEl.checked;
        apply();
      });
    }

    document.getElementById("reset")?.addEventListener("click", reset);

    function copyToClipboard(btn, text) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = "コピーしました！";
        setTimeout(() => (btn.textContent = orig), 2000);
      });
    }

    document.getElementById("copy-html")?.addEventListener("click", () => {
      const text = document.querySelector("#code-html code")?.textContent || "";
      copyToClipboard(document.getElementById("copy-html"), text);
    });
    document.getElementById("copy-css")?.addEventListener("click", () => {
      const text = document.querySelector("#code-css code")?.textContent || "";
      copyToClipboard(document.getElementById("copy-css"), text);
    });

    document.querySelectorAll(".download-btn[data-src]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-src");
        if (src) downloadSvg(src, btn);
      });
    });

    document.getElementById("svgUpload")?.addEventListener("change", handleSvgUpload);
    document.getElementById("download-uploaded")?.addEventListener("click", handleDownloadUploaded);

    apply();
  }

  function handleSvgUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !file.name.toLowerCase().endsWith(".svg")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const svgText = ev.target?.result;
      if (typeof svgText !== "string") return;

      uploadedSvgData = { text: svgText, name: file.name };
      const wrap = document.getElementById("uploaded-preview");
      if (wrap) {
        wrap.innerHTML = "";
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        wrap.appendChild(img);
      }
      document.getElementById("download-uploaded-wrap").style.display = "block";
      apply();
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleDownloadUploaded() {
    if (!uploadedSvgData) return;
    downloadSvgFromText(uploadedSvgData.text, uploadedSvgData.name);
  }

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

  init();
})();
