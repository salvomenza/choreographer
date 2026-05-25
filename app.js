const statusEl = document.getElementById("status");
const audioEl = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");
const metronomeToggle = document.getElementById("metronomeToggle");
const karaokeText = document.getElementById("karaokeText");
const karaokeMeta = document.getElementById("karaokeMeta");
const stickmanGroup = document.getElementById("stickman");

let choreography = null;
let bars = [];
let rafId = null;

let audioCtx = null;
let lastMetroBeat = -1;

async function loadChoreography() {
  const response = await fetch("choreographies/le-sirene.json");
  choreography = await response.json();

  document.title = `${choreography.title} — Coreografia`;

  if (choreography.audio?.src) {
    audioEl.src = choreography.audio.src;
    audioEl.volume = choreography.audio.volume ?? 0.8;
  }

  bars = buildBars(choreography);

  statusEl.textContent = JSON.stringify(choreography, null, 2);
  karaokeText.textContent = choreography.title;
  karaokeMeta.textContent = "JSON caricato correttamente";

  renderFrame();
}

function getSectionBarDuration(section, sections) {
  if (section.duration) return section.duration / section.bars;

  if (section.barDurationFrom) {
    const source = sections.find((s) => s.id === section.barDurationFrom);
    if (!source) {
      throw new Error(`Sezione sorgente non trovata: ${section.barDurationFrom}`);
    }
    return source.duration / source.bars;
  }

  throw new Error(`Durata non definita per la sezione ${section.id}`);
}

function buildBars(choreo) {
  const sections = choreo.timing.sections;
  const out = [];
  let currentTime = 0;

  for (const section of sections) {
    const barDuration = getSectionBarDuration(section, sections);

    for (let i = 0; i < section.bars; i++) {
      out.push({
        bar: section.fromBar + i,
        sectionId: section.id,
        sectionLabel: section.label,
        start: currentTime,
        duration: barDuration
      });
      currentTime += barDuration;
    }
  }

  return out;
}

function findCurrentBar(bars, time) {
  for (const bar of bars) {
    if (time >= bar.start && time < bar.start + bar.duration) return bar;
  }

  return bars[bars.length - 1] ?? null;
}

function findCue(choreo, barNumber) {
  return choreo.cues.find(
    (cue) => barNumber >= cue.fromBar && barNumber <= cue.toBar
  );
}

function maybePlayMetronome(currentBar, choreoTime) {
  if (!metronomeToggle.checked) return;
  if (!currentBar) return;

  const beatDuration = currentBar.duration / 2;
  const beatAbsolute = Math.floor(choreoTime / beatDuration);

  if (beatAbsolute === lastMetroBeat) return;
  lastMetroBeat = beatAbsolute;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioCtx) audioCtx = new AudioContextClass();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const isFirstBeat = ((choreoTime - currentBar.start) / beatDuration) < 1;
  osc.frequency.value = isFirstBeat ? 880 : 520;

  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.09);
}

function renderFrame() {
  if (!choreography || bars.length === 0) return;

  const offset = choreography.audio?.offset ?? 0;
  const choreoTime = Math.max(0, audioEl.currentTime - offset);

  const currentBar = findCurrentBar(bars, choreoTime);
  if (!currentBar) return;

  const cue = findCue(choreography, currentBar.bar);
  const pose = getPose(cue, currentBar, choreoTime);

  karaokeText.textContent = cue?.text ?? "";
  karaokeMeta.textContent =
    `battuta ${currentBar.bar} · ${currentBar.sectionLabel} · move: ${cue?.move ?? "neutral"}`;

  renderStickman(stickmanGroup, pose);

  statusEl.textContent = JSON.stringify(
    {
      title: choreography.title,
      time: Number(choreoTime.toFixed(3)),
      currentBar,
      cue
    },
    null,
    2
  );

  maybePlayMetronome(currentBar, choreoTime);
}

function tick() {
  renderFrame();

  if (!audioEl.paused && !audioEl.ended) {
    rafId = requestAnimationFrame(tick);
  }
}

playBtn.addEventListener("click", async () => {
  if (audioEl.paused) {
    await audioEl.play();
    playBtn.textContent = "Pausa";
    tick();
  } else {
    audioEl.pause();
    playBtn.textContent = "Play";
    if (rafId) cancelAnimationFrame(rafId);
  }
});

restartBtn.addEventListener("click", () => {
  audioEl.currentTime = 0;
  lastMetroBeat = -1;
  renderFrame();
});

audioEl.addEventListener("pause", () => {
  playBtn.textContent = "Play";
});

audioEl.addEventListener("play", () => {
  playBtn.textContent = "Pausa";
  tick();
});

audioEl.addEventListener("seeked", () => {
  lastMetroBeat = -1;
  renderFrame();
});

audioEl.addEventListener("loadedmetadata", renderFrame);

loadChoreography();
