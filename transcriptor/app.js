// Transcriptor — grabación + transcripción 100% en el navegador.
// Modelo: Xenova/whisper-small vía @huggingface/transformers (WASM/WebGPU).
import { pipeline, env, Tensor } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.2.3/dist/transformers.js";

// El propio transformers.js cachea los pesos del modelo en el navegador
// (Cache Storage), así que no hace falta implementar caché propia aquí.
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_ID = "Xenova/whisper-small";

// Grabaciones muy largas se acumulan enteras en memoria (MediaRecorder) y
// luego se decodifican de una sola vez a un Float32Array (~230MB por hora),
// así que ponemos un tope duro para no colgar el navegador, con aviso previo.
const MAX_RECORDING_SECONDS = 3 * 60 * 60; // 3 horas
const WARNING_THRESHOLD_SECONDS = 2 * 60 * 60; // aviso desde las 2 horas

// ---------- Referencias del DOM ----------

const stages = {
  record: document.getElementById("stage-record"),
  processing: document.getElementById("stage-processing"),
  result: document.getElementById("stage-result"),
  error: document.getElementById("stage-error"),
};

const recordBtn = document.getElementById("recordBtn");
const timerEl = document.getElementById("timer");
const hintEl = document.getElementById("hint");

const progressFillEl = document.getElementById("progressFill");
const processingTitleEl = document.getElementById("processingTitle");
const processingDetailEl = document.getElementById("processingDetail");
const processingNoticeEl = document.getElementById("processingNotice");

const resultTextEl = document.getElementById("resultText");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const newRecordingBtn = document.getElementById("newRecordingBtn");

const errorTitleEl = document.getElementById("errorTitle");
const errorDetailEl = document.getElementById("errorDetail");
const retryBtn = document.getElementById("retryBtn");

// ---------- Estado ----------

let mediaRecorder = null;
let mediaStream = null;
let audioChunks = [];
let isRecording = false;
let timerInterval = null;
let recordingStartedAt = 0;

let transcriberPromise = null; // se dispara al cargar la página para adelantar la descarga del modelo
let autoStopNotice = null; // mensaje a mostrar si la grabación se cortó sola por el límite de duración

function showStage(name) {
  for (const key of Object.keys(stages)) {
    stages[key].classList.toggle("stage--hidden", key !== name);
  }
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ---------- Grabación ----------

async function startRecording() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    showMicPermissionError(err);
    return;
  }

  audioChunks = [];
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "";
  mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);

  mediaRecorder.addEventListener("dataavailable", (e) => {
    if (e.data && e.data.size > 0) audioChunks.push(e.data);
  });

  mediaRecorder.addEventListener("stop", onRecordingStopped);

  mediaRecorder.start();
  isRecording = true;
  recordBtn.classList.add("is-recording");
  recordBtn.setAttribute("aria-label", "Toca para detener");
  hintEl.textContent = "Grabando… toca para detener";

  autoStopNotice = null;
  hintEl.classList.remove("hint--warning");
  recordingStartedAt = Date.now();
  timerEl.textContent = formatTime(0);
  timerInterval = setInterval(() => {
    const elapsedSeconds = (Date.now() - recordingStartedAt) / 1000;
    timerEl.textContent = formatTime(elapsedSeconds);

    if (elapsedSeconds >= MAX_RECORDING_SECONDS) {
      autoStopNotice =
        "La grabación se detuvo sola al llegar a las 3 horas (el límite máximo). Transcribiendo lo grabado hasta ahora…";
      stopRecording();
      return;
    }

    if (elapsedSeconds >= WARNING_THRESHOLD_SECONDS) {
      const remainingMin = Math.ceil((MAX_RECORDING_SECONDS - elapsedSeconds) / 60);
      hintEl.classList.add("hint--warning");
      hintEl.textContent = `Quedan ${remainingMin} min antes del límite de 3 horas`;
    }
  }, 250);
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") return;
  mediaRecorder.stop();
  mediaStream.getTracks().forEach((track) => track.stop());
  isRecording = false;
  clearInterval(timerInterval);
  recordBtn.classList.remove("is-recording");
}

async function onRecordingStopped() {
  const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
  showStage("processing");
  processingTitleEl.textContent = "Transcribiendo…";
  setProgress(0, "Preparando el audio…");
  processingNoticeEl.textContent = autoStopNotice ?? "";
  autoStopNotice = null;

  try {
    const audioData = await decodeToMono16k(blob);
    const text = await transcribe(audioData);
    resultTextEl.value = text.trim() || "(No se detectó voz en la grabación)";
    showStage("result");
  } catch (err) {
    console.error(err);
    showGenericError(
      "No se pudo transcribir el audio",
      "Intenta nuevamente. Si el problema persiste, revisa tu conexión a internet para la primera descarga del modelo."
    );
  }
}

function showMicPermissionError() {
  errorTitleEl.textContent = "No pudimos acceder al micrófono";
  errorDetailEl.textContent =
    "Revisa los permisos de micrófono para este sitio en tu navegador y vuelve a intentarlo.";
  showStage("error");
}

function showGenericError(title, detail) {
  errorTitleEl.textContent = title;
  errorDetailEl.textContent = detail;
  showStage("error");
}

// ---------- Decodificar + resamplear a mono 16kHz ----------
// Whisper espera audio mono a 16kHz; usamos un OfflineAudioContext con esa
// frecuencia de destino, que además resuelve el downmix a mono automáticamente
// al conectar una fuente con más canales a un destino de 1 canal.

async function decodeToMono16k(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await decodeCtx.decodeAudioData(arrayBuffer);
  decodeCtx.close();

  const TARGET_SAMPLE_RATE = 16000;
  const targetLength = Math.max(1, Math.ceil(decoded.duration * TARGET_SAMPLE_RATE));
  const offlineCtx = new OfflineAudioContext(1, targetLength, TARGET_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);

  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

// ---------- Transcripción con Whisper (transformers.js) ----------

async function pickDevice() {
  if (typeof navigator !== "undefined" && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) return "webgpu";
    } catch {
      // sin soporte real de WebGPU en este dispositivo/navegador
    }
  }
  return "wasm";
}

function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const device = await pickDevice();
      return pipeline("automatic-speech-recognition", MODEL_ID, {
        device,
        progress_callback: onModelProgress,
      });
    })();
  }
  return transcriberPromise;
}

// El callback de progreso llega por archivo del modelo (encoder, decoder,
// tokenizer, etc). Sumamos bytes cargados/totales de todos los archivos
// conocidos hasta el momento para mostrar una única barra de progreso.
const fileProgress = new Map();

function onModelProgress(event) {
  if (event.status === "progress" || event.status === "initiate") {
    fileProgress.set(event.file, {
      loaded: event.loaded || 0,
      total: event.total || 0,
    });
  } else if (event.status === "done") {
    const entry = fileProgress.get(event.file);
    if (entry) entry.loaded = entry.total || entry.loaded;
  }

  let loaded = 0;
  let total = 0;
  for (const entry of fileProgress.values()) {
    loaded += entry.loaded;
    total += entry.total;
  }
  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
  setProgress(pct, "Descargando el modelo (solo la primera vez)…");
}

function setProgress(percent, detail) {
  progressFillEl.style.width = `${percent}%`;
  if (detail) processingDetailEl.textContent = detail;
}

// transformers.js todavía no implementa la detección automática de idioma de
// Whisper (si no se indica "language", asume inglés). La replicamos a mano:
// un único paso del decoder tras <|startoftranscript|> da, en sus logits, la
// probabilidad de cada token de idioma; nos quedamos con el más probable.
// Solo hace falta la primera ventana de 30s de audio, igual que el propio
// Whisper original.
async function detectLanguage(transcriber, audioData) {
  const generationConfig = transcriber.model.generation_config;
  if (!generationConfig?.lang_to_id) return null;

  const { input_features } = await transcriber.processor(audioData);
  const decoder_input_ids = new Tensor(
    "int64",
    new BigInt64Array([BigInt(generationConfig.decoder_start_token_id)]),
    [1, 1]
  );

  const { logits } = await transcriber.model({ input_features, decoder_input_ids });
  const logitsData = logits.data;

  let bestToken = null;
  let bestScore = -Infinity;
  for (const [token, id] of Object.entries(generationConfig.lang_to_id)) {
    const score = logitsData[id];
    if (score > bestScore) {
      bestScore = score;
      bestToken = token; // p.ej. "<|es|>"
    }
  }
  return bestToken ? bestToken.replace(/^<\|/, "").replace(/\|>$/, "") : null;
}

async function transcribe(audioData) {
  const transcriber = await getTranscriber();

  setProgress(100, "Detectando idioma…");
  const language = await detectLanguage(transcriber, audioData).catch(() => null);

  setProgress(100, "Analizando el audio…");
  processingTitleEl.textContent = "Transcribiendo…";

  // return_timestamps: true es la forma documentada/probada de usar
  // chunk_length_s + stride_length_s en transformers.js: sin esto, el
  // ensamblado de los fragmentos de 30s puede perder contenido en audios
  // de más de 30 segundos.
  const output = await transcriber(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
    task: "transcribe",
    language: language ?? undefined,
  });

  return Array.isArray(output) ? output.map((o) => o.text).join(" ") : output.text;
}

// ---------- Interacciones ----------

recordBtn.addEventListener("click", () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

function resetToRecordStage() {
  showStage("record");
  hintEl.textContent = "Toca para grabar";
  hintEl.classList.remove("hint--warning");
  timerEl.textContent = formatTime(0);
  recordBtn.classList.remove("is-recording");
  recordBtn.setAttribute("aria-label", "Toca para grabar");
  processingNoticeEl.textContent = "";
}

retryBtn.addEventListener("click", resetToRecordStage);

newRecordingBtn.addEventListener("click", () => {
  resultTextEl.value = "";
  resetToRecordStage();
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultTextEl.value);
    copyBtn.textContent = "¡Copiado!";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "Copiar";
      copyBtn.classList.remove("copied");
    }, 1500);
  } catch {
    resultTextEl.select();
    document.execCommand("copy");
  }
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([resultTextEl.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `transcripcion-${stamp}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Adelanta la descarga del modelo en segundo plano desde que se abre la app,
// para que si el usuario ya terminó de grabar, la transcripción sea casi
// instantánea (o al menos ya vaya avanzada).
getTranscriber().catch((err) => {
  console.warn("No se pudo precargar el modelo:", err);
});

// Registro del service worker para uso como PWA.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("No se pudo registrar el service worker:", err);
    });
  });
}
