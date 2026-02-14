(function () {
  const defaultValues = {
    baseFrequency: 0.02,
    numOctaves: 3,
    turbulenceType: "fractalNoise",
    scales: [2, 6, 3, 4, 3],
    duration: 0.5,
    infinite: true,
    imgWidth: 100,
  };

  let state = { ...defaultValues, scales: [...defaultValues.scales] };

  const svgContainer = document.getElementById("svg-container");
  let uploadedSvgData = null;

  function getPreviewIcons() {
    const heading = document.querySelectorAll("#preview-heading img");
    const uploaded = document.querySelectorAll("#uploaded-preview img");
    return [...heading, ...uploaded];
  }

  function createSvgFilters() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.cssText = "position:absolute;width:0;height:0;";

    for (let i = 0; i < 5; i++) {
      const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      filter.setAttribute("id", `svg_filter_${i}`);

      const turbulence = document.createElementNS("http://www.w3.org/2000/svg", "feTurbulence");
      turbulence.setAttribute("type", state.turbulenceType);
      turbulence.setAttribute("baseFrequency", state.baseFrequency);
      turbulence.setAttribute("numOctaves", state.numOctaves);
      turbulence.setAttribute("result", "noise");
      turbulence.setAttribute("seed", String(i));

      const displacement = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap");
      displacement.setAttribute("in", "SourceGraphic");
      displacement.setAttribute("in2", "noise");
      displacement.setAttribute("scale", String(state.scales[i]));

      filter.appendChild(turbulence);
      filter.appendChild(displacement);
      svg.appendChild(filter);
    }

    return svg;
  }

  function updateSvgFilters() {
    svgContainer.innerHTML = "";
    svgContainer.appendChild(createSvgFilters());
  }

  function updateAnimation() {
    const duration = state.duration;
    const iter = state.infinite ? "infinite" : "1";
    const anim = `svg_filter ${duration}s ${iter}`;
    getPreviewIcons().forEach((el) => {
      el.style.animation = anim;
      el.style.width = `${state.imgWidth}px`;
    });
  }

  function updateKeyframes() {
    let style = document.getElementById("dynamic-keyframes");
    if (!style) {
      style = document.createElement("style");
      style.id = "dynamic-keyframes";
      document.head.appendChild(style);
    }
    style.textContent = `
      @keyframes svg_filter {
        0% { filter: url(#svg_filter_0); }
        25% { filter: url(#svg_filter_1); }
        50% { filter: url(#svg_filter_2); }
        75% { filter: url(#svg_filter_3); }
        100% { filter: url(#svg_filter_4); }
      }
    `;
  }

  function generateHtmlFilterCode() {
    let code = "<svg style=\"position:absolute;width:0;height:0;\">\n";
    for (let i = 0; i < 5; i++) {
      code += `  <filter id="svg_filter_${i}">\n`;
      code += `    <feTurbulence type="${state.turbulenceType}" baseFrequency="${state.baseFrequency}" numOctaves="${state.numOctaves}" result="noise" seed="${i}" />\n`;
      code += `    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${state.scales[i]}" />\n`;
      code += `  </filter>\n`;
    }
    code += "</svg>";
    return code;
  }

  function generateCssCode() {
    const iter = state.infinite ? "infinite" : "1";
    return `@keyframes svg_filter {
  0% { filter: url(#svg_filter_0); }
  25% { filter: url(#svg_filter_1); }
  50% { filter: url(#svg_filter_2); }
  75% { filter: url(#svg_filter_3); }
  100% { filter: url(#svg_filter_4); }
}

.heading img {
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

  function bindInput(id, key, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      state[key] = fn ? fn(el) : el.value;
      if (el.type === "range") {
        const valueEl = document.getElementById(`${id}-value`);
        if (valueEl) valueEl.textContent = el.value;
      }
      apply();
    });
  }

  function bindScaleInputs() {
    for (let i = 0; i < 5; i++) {
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

  function init() {
    bindInput("baseFrequency", "baseFrequency", (el) => Number(el.value));
    bindInput("numOctaves", "numOctaves", (el) => Number(el.value));

    const turbulenceTypeEl = document.getElementById("turbulenceType");
    if (turbulenceTypeEl) {
      turbulenceTypeEl.addEventListener("change", () => {
        state.turbulenceType = turbulenceTypeEl.value;
        const valueEl = document.getElementById("turbulenceType-value");
        if (valueEl) valueEl.textContent = turbulenceTypeEl.value;
        apply();
      });
    }
    bindInput("duration", "duration", (el) => Number(el.value));
    bindInput("imgWidth", "imgWidth", (el) => Number(el.value));

    const infiniteEl = document.getElementById("infinite");
    infiniteEl.addEventListener("change", () => {
      state.infinite = infiniteEl.checked;
      apply();
    });
    bindScaleInputs();

    document.getElementById("reset").addEventListener("click", () => {
      state = {
        baseFrequency: defaultValues.baseFrequency,
        numOctaves: defaultValues.numOctaves,
        turbulenceType: defaultValues.turbulenceType,
        scales: [...defaultValues.scales],
        duration: defaultValues.duration,
        infinite: defaultValues.infinite,
        imgWidth: defaultValues.imgWidth,
      };

      document.getElementById("baseFrequency").value = state.baseFrequency;
      document.getElementById("baseFrequency-value").textContent = state.baseFrequency;
      document.getElementById("numOctaves").value = state.numOctaves;
      document.getElementById("numOctaves-value").textContent = state.numOctaves;
      const turbulenceTypeEl = document.getElementById("turbulenceType");
      if (turbulenceTypeEl) {
        turbulenceTypeEl.value = state.turbulenceType;
        const valueEl = document.getElementById("turbulenceType-value");
        if (valueEl) valueEl.textContent = state.turbulenceType;
      }
      document.getElementById("duration").value = state.duration;
      document.getElementById("duration-value").textContent = state.duration;
      document.getElementById("infinite").checked = state.infinite;
      document.getElementById("imgWidth").value = state.imgWidth;
      document.getElementById("imgWidth-value").textContent = state.imgWidth;

      for (let i = 0; i < 5; i++) {
        const el = document.getElementById(`scale${i}`);
        el.value = state.scales[i];
        document.getElementById(`scale${i}-value`).textContent = state.scales[i];
      }

      apply();
    });

    function copyAndFeedback(btn, text) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = "コピーしました！";
        setTimeout(() => (btn.textContent = orig), 2000);
      });
    }

    document.getElementById("copy-html").addEventListener("click", () => {
      const text = document.querySelector("#code-html code")?.textContent || "";
      copyAndFeedback(document.getElementById("copy-html"), text);
    });
    document.getElementById("copy-css").addEventListener("click", () => {
      const text = document.querySelector("#code-css code")?.textContent || "";
      copyAndFeedback(document.getElementById("copy-css"), text);
    });

    document.querySelectorAll(".download-btn[data-src]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-src");
        if (src) downloadSmilSvg(src, btn);
      });
    });

    document.getElementById("svgUpload").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file || !file.name.toLowerCase().endsWith(".svg")) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const svgText = ev.target?.result;
        if (typeof svgText !== "string") return;

        uploadedSvgData = { text: svgText, name: file.name };
        const url = URL.createObjectURL(file);

        const wrap = document.getElementById("uploaded-preview");
        wrap.innerHTML = "";
        const img = document.createElement("img");
        img.src = url;
        img.alt = file.name;
        wrap.appendChild(img);

        document.getElementById("download-uploaded-wrap").style.display = "block";
        apply();
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    document.getElementById("download-uploaded").addEventListener("click", () => {
      if (!uploadedSvgData) return;
      downloadSmilSvgFromText(uploadedSvgData.text, uploadedSvgData.name);
    });

    apply();
  }

  function createAnimatedSvgFromText(svgText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return null;

    const viewBox = svg.getAttribute("viewBox") || `0 0 ${svg.getAttribute("width") || "100"} ${svg.getAttribute("height") || "100"}`;
    const width = svg.getAttribute("width") || "100";
    const height = svg.getAttribute("height") || "100";

    const iter = state.infinite ? "infinite" : "1";
    const dur = `${state.duration}s`;

    const filters = [0, 1, 2, 3, 4]
      .map(
        (i) =>
          `  <filter id="svg_filter_${i}">
    <feTurbulence type="${state.turbulenceType}" baseFrequency="${state.baseFrequency}" numOctaves="${state.numOctaves}" result="noise" seed="${i}" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="${state.scales[i]}" />
  </filter>`
      )
      .join("\n");

    const filterDef = `<defs>
${filters}
</defs>`;

    const style = `<style>
@keyframes svg_filter {
  0% { filter: url(#svg_filter_0); }
  25% { filter: url(#svg_filter_1); }
  50% { filter: url(#svg_filter_2); }
  75% { filter: url(#svg_filter_3); }
  100% { filter: url(#svg_filter_4); }
}
.anim { animation: svg_filter ${dur} ${iter}; }
</style>`;

    const innerContent = svg.innerHTML;
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}" width="${width}" height="${height}">${filterDef}${style}
<g class="anim">${innerContent}</g>
</svg>`;
  }

  function downloadAnimatedSvg(animatedSvg, filename) {
    const blob = new Blob([animatedSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function downloadSmilSvg(src, btnEl) {
    const origText = btnEl.textContent;
    btnEl.textContent = "生成中...";
    btnEl.disabled = true;

    try {
      const res = await fetch(src);
      const svgText = await res.text();
      const animatedSvg = createAnimatedSvgFromText(svgText);
      if (!animatedSvg) throw new Error("SVGの解析に失敗しました");
      downloadAnimatedSvg(animatedSvg, src.replace("img/", "animated_"));
    } catch (err) {
      console.error(err);
      btnEl.textContent = "エラー";
    }

    btnEl.textContent = origText;
    btnEl.disabled = false;
  }

  function downloadSmilSvgFromText(svgText, filename) {
    const animatedSvg = createAnimatedSvgFromText(svgText);
    if (!animatedSvg) {
      alert("SVGの解析に失敗しました");
      return;
    }
    downloadAnimatedSvg(animatedSvg, filename.replace(/\.svg$/i, "_animated.svg"));
  }

  init();
})();
