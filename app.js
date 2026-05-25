const statusEl = document.getElementById("status");
const audioEl = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");
const karaokeText = document.getElementById("karaokeText");
const karaokeMeta = document.getElementById("karaokeMeta");

let choreography = null;
let playing = false;
let rafId = null;

async function loadChoreography() {
  const response = await fetch("choreographies/le-sirene.json");
  choreography = await response.json();

  document.title = `${choreography.title} — Coreografia`;

  if (choreography.audio?.src) {
    audioEl.src = choreography.audio.src;
    audioEl.volume = choreography.audio.volume ?? 0.8;
  }

  statusEl.textContent = JSON.stringify(choreography, null, 2);
  karaokeText.textContent = choreography.title;
  karaokeMeta.textContent = "JSON caricato correttamente";
}

function getSectionBarDuration(section, sections) {
  if (section.duration) return section.duration / section.bars;

  if (section.barDurationFrom) {
    const source = sections.find((s) => s.id === section.barDurationFrom);
    return source.duration / source.bars;
  }

  throw new Error(`Durata non definita per la sezione ${section.id}`);
}

function buildBars(choreo) {
  const sections = choreo.timing.sections;
  const bars = [];

  let currentTime = 0;

  for (const section of sections) {
    const barDuration = getSectionBarDuration(section, sections);

    for (let i = 0; i < section.bars; i++) {
      bars.push({
        bar: section.fromBar + i,
        section: section.label,
        start: currentTime,
        duration: barDuration
      });
      currentTime += barDuration;
    }
  }

  return bars;
}

function findCurrentBar(bars, time) {
  return bars.find((bar) => time >= bar.start && time < bar.start + bar.duration) ?? bars[0];
}

function findCue(choreo, barNumber) {
  return choreo.cues.find((cue) => barNumber >= cue.fromBar && barNumber <= cue.toBar);
}

function tick() {
  if (!choreography) return;

  const bars = buildBars(choreography);
  const offset = choreography.audio?.offset ?? 0;
  const choreoTime = Math.max(0, audioEl.currentTime - offset);

  const currentBar = findCurrentBar(bars, choreoTime);
  const cue = findCue(choreography, currentBar.bar);

  karaokeText.textContent = cue?.text ?? "";
  karaokeMeta.textContent = `battuta ${currentBar.bar} · ${currentBar.section} · move: ${cue?.move ?? "nessuna"}`;

  statusEl.textContent = JSON.stringify(
    {
      title: choreography.title,
      time: choreoTime.toFixed(3),
      currentBar,
      cue
    },
    null,
    2
  );

  rafId = requestAnimationFrame(tick);
}

playBtn.addEventListener("click", async () => {
  if (!playing) {
    await audioEl.play();
    playing = true;
    playBtn.textContent = "Pausa";
    tick();
  } else {
    audioEl.pause();
    playing = false;
    playBtn.textContent = "Play";
    if (rafId) cancelAnimationFrame(rafId);
  }
});

restartBtn.addEventListener("click", () => {
  audioEl.currentTime = 0;
  tick();
});

loadChoreography();
