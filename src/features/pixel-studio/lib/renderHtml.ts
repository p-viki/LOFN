/**
 * 把像素画打包成一个自包含的 index.html。
 *
 * 采用 Canvas 2D + 内联脚本：单个文件双击即可打开，体积小、渲染快，
 * 并且可以带上「点击改色 / 缩放 / 导出 PNG」等交互（无需任何外部依赖与网络）。
 */

import type { PixelGrid } from '../types'

export interface HtmlOptions {
  title: string
  description?: string
  /** 打开时的初始放大倍数，默认按画布宽度自适应 */
  scale?: number
}

/** 像素色号编码为可打印字符（从 33 起），让 ROWS 既紧凑又便于人眼检查 */
const CODE_OFFSET = 33
const MAX_PALETTE_SIZE = 94
const PNG_SCALE = 8

export function renderPixelHtml(grid: PixelGrid, options: HtmlOptions): string {
  const { width, height, palette, indices } = grid
  const title = options.title.trim() || '像素画'
  const description = options.description?.trim() ?? ''
  const scale = options.scale ?? defaultScale(width)
  const rows = encodeRows(indices, width, height)
  const rowsJson = JSON.stringify(rows).replace(/</g, '\\u003c')
  const paletteJson = JSON.stringify(palette)

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<!-- 由 LOFN 像素工坊生成：${width} × ${height} 像素，${palette.length} 色调色板 -->
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #050810;
    color: #f0f9ff;
    font-family: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  }
  .art { width: 100%; max-width: 720px; text-align: center; }
  h1 { margin: 0 0 8px; font-size: 22px; font-weight: 600; }
  .desc { margin: 0 0 18px; font-size: 13px; line-height: 1.6; color: #94a3b8; }
  .frame {
    display: inline-block;
    padding: 10px;
    border-radius: 14px;
    border: 1px solid rgba(125, 211, 252, 0.18);
    background: #0a0f1a;
  }
  canvas {
    display: block;
    max-width: 100%;
    height: auto;
    image-rendering: pixelated;
    cursor: crosshair;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
  }
  .swatches { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  .swatch {
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: 999px;
    border: 2px solid transparent;
    box-shadow: inset 0 0 0 1px rgba(125, 211, 252, 0.35);
    cursor: pointer;
  }
  .swatch[aria-pressed="true"] { border-color: #f0f9ff; }
  .zoom { display: flex; align-items: center; gap: 4px; }
  #zoom-value { min-width: 40px; font-size: 13px; color: #94a3b8; }
  button {
    font: inherit;
    font-size: 13px;
    padding: 7px 12px;
    border-radius: 10px;
    border: 1px solid rgba(125, 211, 252, 0.18);
    background: #0f172a;
    color: #f0f9ff;
    cursor: pointer;
  }
  button:hover { border-color: rgba(125, 211, 252, 0.45); }
  .meta { margin: 14px 0 0; font-size: 12px; color: #64748b; }
</style>
</head>
<body>
<main class="art">
  <h1>${escapeHtml(title)}</h1>
${description ? `  <p class="desc">${escapeHtml(description)}</p>\n` : ''}  <div class="frame"><canvas id="art" width="${width}" height="${height}"></canvas></div>
  <div class="bar">
    <div class="swatches" id="swatches" role="group" aria-label="画笔颜色"></div>
    <div class="zoom">
      <button id="zoom-out" type="button" aria-label="缩小">−</button>
      <span id="zoom-value">${scale}×</span>
      <button id="zoom-in" type="button" aria-label="放大">＋</button>
    </div>
    <button id="reset" type="button">还原</button>
    <button id="save" type="button">下载 PNG</button>
  </div>
  <p class="meta">${width} × ${height} 像素 · ${palette.length} 色调色板 · 点击画面即可改色</p>
</main>
<script>
(function () {
  var PALETTE = ${paletteJson};
  var ROWS = ${rowsJson};
  var W = ${width};
  var H = ${height};
  var OFFSET = ${CODE_OFFSET};
  var SCALE_MIN = 1;
  var SCALE_MAX = 32;
  var INITIAL_SCALE = ${scale};

  var canvas = document.getElementById('art');
  var ctx = canvas.getContext('2d');
  var pixels = new Uint8Array(W * H);
  var original = new Uint8Array(W * H);
  var x;
  var y;
  for (y = 0; y < H; y++) {
    var row = ROWS[y];
    for (x = 0; x < W; x++) original[y * W + x] = row.charCodeAt(x) - OFFSET;
  }
  pixels.set(original);

  var rgb = PALETTE.map(function (hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  });

  function draw() {
    var image = ctx.createImageData(W, H);
    for (var i = 0; i < pixels.length; i++) {
      var color = rgb[pixels[i]] || [0, 0, 0];
      image.data[i * 4] = color[0];
      image.data[i * 4 + 1] = color[1];
      image.data[i * 4 + 2] = color[2];
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }

  var zoom = INITIAL_SCALE;
  var zoomLabel = document.getElementById('zoom-value');
  function applyZoom() {
    canvas.style.width = (W * zoom) + 'px';
    canvas.style.height = (H * zoom) + 'px';
    zoomLabel.textContent = zoom + '×';
  }

  var current = 0;
  var swatches = document.getElementById('swatches');
  Array.prototype.forEach.call(PALETTE, function (hex, index) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.style.backgroundColor = hex;
    button.setAttribute('aria-label', '颜色 ' + hex);
    button.setAttribute('aria-pressed', index === current ? 'true' : 'false');
    button.onclick = function () {
      current = index;
      Array.prototype.forEach.call(swatches.children, function (child, position) {
        child.setAttribute('aria-pressed', position === index ? 'true' : 'false');
      });
    };
    swatches.appendChild(button);
  });

  canvas.addEventListener('click', function (event) {
    var rect = canvas.getBoundingClientRect();
    var px = Math.floor(((event.clientX - rect.left) / rect.width) * W);
    var py = Math.floor(((event.clientY - rect.top) / rect.height) * H);
    if (px < 0 || py < 0 || px >= W || py >= H) return;
    pixels[py * W + px] = current;
    draw();
  });

  document.getElementById('zoom-in').onclick = function () {
    zoom = Math.min(SCALE_MAX, zoom + 1);
    applyZoom();
  };
  document.getElementById('zoom-out').onclick = function () {
    zoom = Math.max(SCALE_MIN, zoom - 1);
    applyZoom();
  };
  document.getElementById('reset').onclick = function () {
    pixels.set(original);
    draw();
  };
  document.getElementById('save').onclick = function () {
    var out = document.createElement('canvas');
    out.width = W * ${PNG_SCALE};
    out.height = H * ${PNG_SCALE};
    var outCtx = out.getContext('2d');
    outCtx.imageSmoothingEnabled = false;
    outCtx.drawImage(canvas, 0, 0, out.width, out.height);
    out.toBlob(function (blob) {
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'pixel-art.png';
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  };

  draw();
  applyZoom();
})();
</script>
</body>
</html>
`
}

/** 逐行编码色号；越界色号会被截断到可编码范围，避免生成非法字符 */
function encodeRows(indices: Uint8Array, width: number, height: number): string[] {
  const rows: string[] = []
  for (let y = 0; y < height; y += 1) {
    let row = ''
    for (let x = 0; x < width; x += 1) {
      const index = Math.min(indices[y * width + x], MAX_PALETTE_SIZE - 1)
      row += String.fromCharCode(CODE_OFFSET + index)
    }
    rows.push(row)
  }
  return rows
}

function defaultScale(width: number): number {
  return Math.max(2, Math.min(24, Math.round(560 / Math.max(1, width))))
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
