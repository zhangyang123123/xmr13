export function getHomePage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>File Hosting Service</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
  .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
  h1 { text-align: center; font-size: 2rem; margin-bottom: 8px; color: #f8fafc; }
  .subtitle { text-align: center; color: #94a3b8; margin-bottom: 32px; font-size: 0.95rem; }
  .drop-zone {
    border: 2px dashed #475569; border-radius: 12px; padding: 60px 20px;
    text-align: center; cursor: pointer; transition: all 0.3s;
    background: #1e293b; position: relative;
  }
  .drop-zone:hover, .drop-zone.drag-over { border-color: #3b82f6; background: #1e293b; }
  .drop-zone.drag-over { background: rgba(59, 130, 246, 0.1); }
  .drop-zone-icon { font-size: 3rem; margin-bottom: 12px; }
  .drop-zone-text { color: #94a3b8; font-size: 1rem; }
  .drop-zone-text span { color: #3b82f6; text-decoration: underline; }
  input[type="file"] { display: none; }
  .file-input-label { display: inline-block; margin-top: 12px; color: #3b82f6; cursor: pointer; font-size: 0.9rem; }
  .btn {
    display: inline-block; padding: 10px 24px; background: #3b82f6; color: #fff;
    border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 16px; transition: background 0.2s;
  }
  .btn:hover { background: #2563eb; }
  .btn:disabled { background: #475569; cursor: not-allowed; }
  .progress { margin-top: 16px; display: none; }
  .progress-bar { height: 4px; background: #1e293b; border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: #3b82f6; width: 0; transition: width 0.3s; }
  .results { margin-top: 24px; }
  .result-item {
    background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px;
    border: 1px solid #334155;
  }
  .result-item .filename { font-weight: 600; color: #f8fafc; margin-bottom: 8px; }
  .result-item .url-row { display: flex; align-items: center; gap: 8px; }
  .result-item .url {
    flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 6px;
    padding: 8px 12px; color: #60a5fa; font-size: 0.85rem; word-break: break-all;
    font-family: 'Consolas', monospace;
  }
  .copy-btn {
    padding: 6px 12px; background: #334155; color: #e2e8f0; border: none;
    border-radius: 6px; cursor: pointer; font-size: 0.8rem; white-space: nowrap;
  }
  .copy-btn:hover { background: #475569; }
  .meta { color: #64748b; font-size: 0.8rem; margin-top: 6px; }
  .error-msg { color: #f87171; margin-top: 12px; font-size: 0.9rem; }
  .api-links {
    margin-top: 40px; padding-top: 24px; border-top: 1px solid #1e293b;
  }
  .api-links h3 { color: #94a3b8; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .api-links a { color: #60a5fa; text-decoration: none; font-size: 0.9rem; display: block; margin-bottom: 6px; }
  .api-links a:hover { text-decoration: underline; }
  .toast {
    position: fixed; bottom: 20px; right: 20px; background: #22c55e; color: #fff;
    padding: 10px 20px; border-radius: 8px; font-size: 0.9rem; opacity: 0;
    transition: opacity 0.3s; pointer-events: none;
  }
  .toast.show { opacity: 1; }
</style>
</head>
<body>
<div class="container">
  <h1>File Hosting</h1>
  <p class="subtitle">Support: jpg/png/gif/webp/svg/pdf/txt/md/zip &mdash; Max 10MB per file, up to 10 files</p>
  <p class="subtitle" style="margin-top:-20px;font-size:0.85rem;">Drag & drop, click to browse, or <strong>Ctrl+V</strong> to paste screenshot</p>

  <div class="drop-zone" id="dropZone">
    <div class="drop-zone-icon">&#128462;</div>
    <div class="drop-zone-text">Drag & drop files here, <span>click to browse</span>, or Ctrl+V to paste</div>
    <input type="file" id="fileInput" multiple accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.txt,.md,.zip">
  </div>

  <div style="text-align:center">
    <button class="btn" id="uploadBtn" disabled>Upload</button>
  </div>

  <div class="progress" id="progress">
    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
  </div>

  <div id="error" class="error-msg"></div>
  <div class="results" id="results"></div>

  <div class="api-links">
    <h3>API Endpoints</h3>
    <a href="/api/files">GET /api/files &mdash; File list</a>
    <a href="/api/stats">GET /api/stats &mdash; Statistics</a>
    <span style="color:#94a3b8;font-size:0.9rem;">POST /api/upload &mdash; Upload files</span><br>
    <span style="color:#94a3b8;font-size:0.9rem;">DELETE /api/files/:filename &mdash; Delete file</span><br>
    <span style="color:#94a3b8;font-size:0.9rem;">GET /files/:filename &mdash; Access file</span><br>
    <span style="color:#94a3b8;font-size:0.9rem;">GET /files/:filename?width=200 &mdash; Resize image (contain)</span><br>
    <span style="color:#94a3b8;font-size:0.9rem;">GET /files/:filename?thumb=200 &mdash; Thumbnail (cover crop, for lists)</span>
  </div>
</div>

<div class="toast" id="toast">Copied!</div>

<script>
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const results = document.getElementById('results');
const errorDiv = document.getElementById('error');
const toast = document.getElementById('toast');

let selectedFiles = [];

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
});

document.addEventListener('paste', (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  const files = [];
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        if (!file.name || file.name === 'image.png' || file.name.startsWith('image')) {
          const ext = getExtensionFromMime(file.type);
          Object.defineProperty(file, 'name', { value: 'pasted-' + Date.now() + ext, writable: false });
        }
        files.push(file);
      }
    }
  }

  if (files.length > 0) {
    e.preventDefault();
    handleFiles(files);
    upload();
  }
});

function getExtensionFromMime(mime) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
  };
  return map[mime] || '.png';
}

function handleFiles(files) {
  selectedFiles = Array.from(files).slice(0, 10);
  uploadBtn.disabled = selectedFiles.length === 0;
  if (selectedFiles.length > 0) {
    dropZone.querySelector('.drop-zone-text').textContent = selectedFiles.length + ' file(s) selected';
  }
}

uploadBtn.addEventListener('click', upload);

async function upload() {
  if (selectedFiles.length === 0) return;
  uploadBtn.disabled = true;
  errorDiv.textContent = '';
  progress.style.display = 'block';
  progressFill.style.width = '10%';

  const formData = new FormData();
  selectedFiles.forEach(f => formData.append('files', f));

  try {
    progressFill.style.width = '50%';
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    progressFill.style.width = '100%';

    const data = await res.json();

    if (!res.ok) {
      errorDiv.textContent = data.error || 'Upload failed';
      return;
    }

    results.innerHTML = '';
    data.files.forEach(file => {
      const item = document.createElement('div');
      item.className = 'result-item';
      const isImage = file.mimetype.startsWith('image/');

      const filenameDiv = document.createElement('div');
      filenameDiv.className = 'filename';
      filenameDiv.textContent = file.filename;
      item.appendChild(filenameDiv);

      if (isImage) {
        const imgDiv = document.createElement('div');
        imgDiv.style.marginBottom = '12px';
        const img = document.createElement('img');
        img.src = file.url + '?thumb=200';
        img.style.maxWidth = '200px';
        img.style.maxHeight = '200px';
        img.style.borderRadius = '6px';
        imgDiv.appendChild(img);
        item.appendChild(imgDiv);
      }

      item.appendChild(createUrlRow(file.url, 'Copy URL'));
      item.appendChild(createUrlRow(file.markdown, 'Copy Markdown', '0.8rem', '8px'));
      item.appendChild(createUrlRow(file.html, 'Copy HTML', '0.75rem', '8px'));

      const metaDiv = document.createElement('div');
      metaDiv.className = 'meta';
      metaDiv.textContent = formatSize(file.size) + ' · ' + file.mimetype + ' · ' + new Date(file.uploaded_at).toLocaleString();
      item.appendChild(metaDiv);

      results.appendChild(item);
    });
  } catch (err) {
    errorDiv.textContent = 'Network error: ' + err.message;
  } finally {
    setTimeout(() => { progress.style.display = 'none'; progressFill.style.width = '0'; }, 500);
    uploadBtn.disabled = false;
    selectedFiles = [];
    fileInput.value = '';
    dropZone.querySelector('.drop-zone-text').innerHTML = 'Drag & drop files here, <span>click to browse</span>, or Ctrl+V to paste';
  }
}

function createUrlRow(text, btnText, fontSize, marginTop) {
  const row = document.createElement('div');
  row.className = 'url-row';
  if (marginTop) row.style.marginTop = marginTop;

  const urlDiv = document.createElement('div');
  urlDiv.className = 'url';
  if (fontSize) urlDiv.style.fontSize = fontSize;
  urlDiv.textContent = text;
  row.appendChild(urlDiv);

  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = btnText;
  btn.dataset.copyText = text;
  row.appendChild(btn);

  return row;
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (btn && btn.dataset.copyText) {
    copyText(btn.dataset.copyText);
  }
});

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  });
}
</script>
</body>
</html>`;
}
