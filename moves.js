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
