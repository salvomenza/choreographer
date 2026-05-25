const SVG_NS = "http://www.w3.org/2000/svg";

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
let playing = false;
let rafId = null;

let audioCtx = null;
let lastMetroBeat = -1;

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smooth01(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function polarPoint(x, y, length, deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: x + Math.cos(rad) * length,
    y: y + Math.sin(rad) * length
  };
}

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

function makeNeutralPose() {
  return {
    rootX: 0,
    rootY: 0,
    bodyTilt: 0,
    headTilt: 0,
    headX: 0,
    hairSwing: 0,
    eyesClosed: false,

    leftArm: { shoulder: -120, elbow: 35, handScale: 1, handOpen: true },
    rightArm: { shoulder: -60, elbow: -35, handScale: 1, handOpen: true },

    leftLeg: { hip: 105, knee: -20 },
    rightLeg: { hip: 75, knee: 20 }
  };
}

function getPose(cue, currentBar, choreoTime) {
  const move = cue?.move ?? "neutral";
  const barProgress = clamp(
    (choreoTime - currentBar.start) / currentBar.duration,
    0,
    0.999999
  );

  switch (move) {
    case "strum1a":
      return getStrum1aPose(currentBar.bar, barProgress);
    case "strum1b":
      return getStrum1bPose(currentBar.bar, barProgress);
    case "hawaiianSideStep":
      return getHawaiianSideStepPose(currentBar.bar, barProgress);
    case "goodThingCircle":
      return getGoodThingCirclePose(currentBar.bar, barProgress);
    case "accentHead":
      return getAccentHeadPose(currentBar.bar, barProgress, cue?.params || {});
    default:
      return makeNeutralPose();
  }
}

function getStrum1aPose(globalBar, barProgress) {
  const pose = makeNeutralPose();
  const halfBeat = Math.floor(barProgress * 2);
  const alt = (globalBar + halfBeat) % 2 === 0 ? 1 : -1;
  const pulse = Math.sin(barProgress * Math.PI * 2);
  const bounce = Math.abs(pulse) * 8;

  pose.rootY = bounce;
  pose.bodyTilt = alt * 4;
  pose.headTilt = alt * -3;
  pose.hairSwing = alt * 8;

  if (alt > 0) {
    pose.rightArm = { shoulder: -15, elbow: -10, handScale: 0.95, handOpen: false };
    pose.leftArm = { shoulder: -120, elbow: 40, handScale: 0.95, handOpen: false };
  } else {
    pose.leftArm = { shoulder: -165, elbow: 10, handScale: 0.95, handOpen: false };
    pose.rightArm = { shoulder: -75, elbow: -45, handScale: 0.95, handOpen: false };
  }

  pose.leftLeg = { hip: 105 + alt * 8, knee: -28 };
  pose.rightLeg = { hip: 75 + alt * 8, knee: 28 };

  return pose;
}

function getStrum1bPose(globalBar, barProgress) {
  const pose = makeNeutralPose();
  const halfBeat = Math.floor(barProgress * 2);
  const alt = (globalBar + halfBeat) % 2 === 0 ? 1 : -1;
  const pulse = Math.sin(barProgress * Math.PI * 2);
  const bounce = Math.abs(pulse) * 6;

  pose.rootY = bounce;
  pose.bodyTilt = alt * 3;
  pose.headTilt = alt * 4;
  pose.hairSwing = alt * 10;

  pose.leftArm = {
    shoulder: -150 + alt * 10,
    elbow: 20 + Math.abs(pulse) * 20,
    handScale: 1.05,
    handOpen: true
  };

  pose.rightArm = {
    shoulder: -30 + alt * 10,
    elbow: -20 - Math.abs(pulse) * 20,
    handScale: 1.05,
    handOpen: true
  };

  pose.leftLeg = { hip: 108 + alt * 6, knee: -18 };
  pose.rightLeg = { hip: 72 + alt * 6, knee: 18 };

  return pose;
}

function getHawaiianSideStepPose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const localIndex = globalBar - 33;
  const phase = (localIndex % 4) + barProgress;
  const goingRight = phase < 2;
  const dir = goingRight ? 1 : -1;

  const phaseInHalf = phase % 2;
  const slot = Math.floor(phaseInHalf * 4);
  const active = slot < 3;
  const pulse = active ? smooth01((phaseInHalf * 4) % 1) : 0;

  if (goingRight) {
    pose.rootX = lerp(-10, 18, Math.min(phase / 1.5, 1));
  } else {
    pose.rootX = lerp(18, -10, Math.min((phase - 2) / 1.5, 1));
  }

  pose.rootY = active ? pulse * 4 : 0;
  pose.bodyTilt = dir * 5;
  pose.headTilt = dir * 5;
  pose.hairSwing = dir * 12;

  pose.leftArm = {
    shoulder: goingRight ? -110 : -155,
    elbow: goingRight ? 70 : 20,
    handScale: 1.05,
    handOpen: true
  };

  pose.rightArm = {
    shoulder: goingRight ? -25 : -70,
    elbow: goingRight ? -20 : -70,
    handScale: 1.05,
    handOpen: true
  };

  if (goingRight) {
    pose.leftLeg = { hip: 100, knee: -16 };
    pose.rightLeg = { hip: 85 + pulse * 20, knee: 10 };
  } else {
    pose.leftLeg = { hip: 95 - pulse * 20, knee: -10 };
    pose.rightLeg = { hip: 80, knee: 16 };
  }

  return pose;
}

function getGoodThingCirclePose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const circle = barProgress * Math.PI * 2;
  const side = Math.sin(circle);
  const depth = Math.cos(circle);
  const handScale = lerp(0.75, 1.35, (depth + 1) / 2);

  pose.rootY = Math.abs(Math.sin(circle)) * 4;
  pose.bodyTilt = 5;
  pose.headTilt = 4 + side * 2;
  pose.hairSwing = 6 + side * 6;

  pose.leftArm = { shoulder: -122, elbow: 40, handScale: 1, handOpen: true };
  pose.rightArm = {
    shoulder: -45 + side * 40,
    elbow: -35 + depth * 65,
    handScale,
    handOpen: true
  };

  pose.leftLeg = { hip: 103, knee: -20 };
  pose.rightLeg = { hip: 77, knee: 20 };

  return pose;
}

function getAccentHeadPose(globalBar, barProgress, params = {}) {
  const pose = makeNeutralPose();

  const firstDir = params.firstBeat === "left" ? -1 : 1;
  const secondDir = params.secondBeat === "right" ? 1 : -1;

  const firstHalf = barProgress < 0.5;
  const dir = firstHalf ? firstDir : secondDir;
  const p = firstHalf ? barProgress * 2 : (barProgress - 0.5) * 2;
  const hit = smooth01(p < 0.45 ? p / 0.45 : (1 - p) / 0.55);

  pose.headTilt = dir * 24 * hit;
  pose.headX = dir * 7 * hit;
  pose.bodyTilt = dir * 3 * hit;
  pose.hairSwing = dir * 24 * hit;
  pose.rootY = 2;

  pose.leftArm = { shoulder: -118, elbow: 45, handScale: 1, handOpen: true };
  pose.rightArm = { shoulder: -62, elbow: -45, handScale: 1, handOpen: true };

  return pose;
}

function drawLimb(group, from, a1, l1, a2, l2, width = 8) {
  const joint = polarPoint(from.x, from.y, l1, a1);
  const end = polarPoint(joint.x, joint.y, l2, a1 + a2);

  group.appendChild(
    svgEl("line", {
      x1: from.x,
      y1: from.y,
      x2: joint.x,
      y2: joint.y,
      stroke: "#0f172a",
      "stroke-width": width,
      "stroke-linecap": "round"
    })
  );

  group.appendChild(
    svgEl("line", {
      x1: joint.x,
      y1: joint.y,
      x2: end.x,
      y2: end.y,
      stroke: "#0f172a",
      "stroke-width": width,
      "stroke-linecap": "round"
    })
  );

  return { joint, end };
}

function drawHand(group, x, y, open = true, scale = 1) {
  if (!open) {
    group.appendChild(
      svgEl("circle", {
        cx: x,
        cy: y,
        r: 7 * scale,
        fill: "#0f172a"
      })
    );
    return;
  }

  const hand = svgEl("g", {
    transform: `translate(${x} ${y}) scale(${scale})`
  });

  hand.appendChild(
    svgEl("circle", {
      cx: 0,
      cy: 0,
      r: 7,
      fill: "none",
      stroke: "#0f172a",
      "stroke-width": 3
    })
  );

  const fingers = [
    [0, -7, 0, -16],
    [-5, -5, -13, -13],
    [5, -5, 13, -13]
  ];

  for (const [x1, y1, x2, y2] of fingers) {
    hand.appendChild(
      svgEl("line", {
        x1,
        y1,
        x2,
        y2,
        stroke: "#0f172a",
        "stroke-width": 3,
        "stroke-linecap": "round"
      })
    );
  }

  group.appendChild(hand);
}

function renderStickman(pose) {
  clearEl(stickmanGroup);

  const g = svgEl("g");

  const hip = { x: 210 + pose.rootX, y: 260 + pose.rootY };
  const neck = { x: 210 + pose.rootX + pose.bodyTilt * 0.5, y: 182 + pose.rootY };
  const head = { x: neck.x + pose.headX, y: 150 + pose.rootY };

  const leftShoulder = { x: neck.x - 28, y: neck.y + 8 };
  const rightShoulder = { x: neck.x + 28, y: neck.y + 8 };
  const leftHip = { x: hip.x - 18, y: hip.y };
  const rightHip = { x: hip.x + 18, y: hip.y };

  // torso
  g.appendChild(
    svgEl("line", {
      x1: neck.x,
      y1: neck.y,
      x2: hip.x,
      y2: hip.y,
      stroke: "#0f172a",
      "stroke-width": 9,
      "stroke-linecap": "round"
    })
  );

  // arms
  const leftArm = drawLimb(
    g,
    leftShoulder,
    pose.leftArm.shoulder,
    42,
    pose.leftArm.elbow,
    38,
    8
  );

  const rightArm = drawLimb(
    g,
    rightShoulder,
    pose.rightArm.shoulder,
    42,
    pose.rightArm.elbow,
    38,
    8
  );

  drawHand(
    g,
    leftArm.end.x,
    leftArm.end.y,
    pose.leftArm.handOpen,
    pose.leftArm.handScale
  );

  drawHand(
    g,
    rightArm.end.x,
    rightArm.end.y,
    pose.rightArm.handOpen,
    pose.rightArm.handScale
  );

  // legs
  drawLimb(g, leftHip, pose.leftLeg.hip, 50, pose.leftLeg.knee, 54, 9);
  drawLimb(g, rightHip, pose.rightLeg.hip, 50, pose.rightLeg.knee, 54, 9);

  // head
  const headGroup = svgEl("g", {
    transform: `rotate(${pose.headTilt} ${head.x} ${head.y})`
  });

  headGroup.appendChild(
    svgEl("circle", {
      cx: head.x,
      cy: head.y,
      r: 26,
      fill: "white",
      stroke: "#0f172a",
      "stroke-width": 6
    })
  );

  // capelli: sempre 4 fili 2D
  const hairStroke = "#0f172a";
  const hs = pose.hairSwing;

  const hairPaths = [
    `M ${head.x - 18} ${head.y - 16} C ${head.x - 38 - hs} ${head.y + 10}, ${head.x - 46 - hs} ${head.y + 58}, ${head.x - 34 - hs * 0.4} ${head.y + 104}`,
    `M ${head.x - 8} ${head.y - 22} C ${head.x - 25 - hs} ${head.y + 18}, ${head.x - 28 - hs} ${head.y + 72}, ${head.x - 18 - hs * 0.35} ${head.y + 122}`,
    `M ${head.x + 8} ${head.y - 22} C ${head.x + 25 - hs} ${head.y + 18}, ${head.x + 28 - hs} ${head.y + 72}, ${head.x + 18 - hs * 0.35} ${head.y + 122}`,
    `M ${head.x + 18} ${head.y - 16} C ${head.x + 38 - hs} ${head.y + 10}, ${head.x + 46 - hs} ${head.y + 58}, ${head.x + 34 - hs * 0.4} ${head.y + 104}`
  ];

  for (const d of hairPaths) {
    headGroup.appendChild(
      svgEl("path", {
        d,
        fill: "none",
        stroke: hairStroke,
        "stroke-width": 4,
        "stroke-linecap": "round"
      })
    );
  }

  // eyes
  if (pose.eyesClosed) {
    headGroup.appendChild(
      svgEl("line", {
        x1: head.x - 11,
        y1: head.y - 4,
        x2: head.x - 3,
        y2: head.y - 4,
        stroke: "#0f172a",
        "stroke-width": 3,
        "stroke-linecap": "round"
      })
    );
    headGroup.appendChild(
      svgEl("line", {
        x1: head.x + 3,
        y1: head.y - 4,
        x2: head.x + 11,
        y2: head.y - 4,
        stroke: "#0f172a",
        "stroke-width": 3,
        "stroke-linecap": "round"
      })
    );
  } else {
    headGroup.appendChild(
      svgEl("circle", {
        cx: head.x - 8,
        cy: head.y - 5,
        r: 2.5,
        fill: "#0f172a"
      })
    );
    headGroup.appendChild(
      svgEl("circle", {
        cx: head.x + 8,
        cy: head.y - 5,
        r: 2.5,
        fill: "#0f172a"
      })
    );
  }

  // mouth
  headGroup.appendChild(
    svgEl("path", {
      d: `M ${head.x - 8} ${head.y + 11} Q ${head.x} ${head.y + 18} ${head.x + 8} ${head.y + 11}`,
      fill: "none",
      stroke: "#0f172a",
      "stroke-width": 3,
      "stroke-linecap": "round"
    })
  );

  g.appendChild(headGroup);
  stickmanGroup.appendChild(g);
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

  renderStickman(pose);

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
  renderFrame();
});

audioEl.addEventListener("pause", () => {
  playing = false;
  playBtn.textContent = "Play";
});

audioEl.addEventListener("play", () => {
  playing = true;
  playBtn.textContent = "Pausa";
});

audioEl.addEventListener("seeked", renderFrame);
audioEl.addEventListener("loadedmetadata", renderFrame);

loadChoreography();
