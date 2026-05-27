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

function phaseSin(t) {
  return Math.sin(t * Math.PI * 2);
}

const neutralPose = {
  rootX: 0,
  rootY: 0,
  bodyTilt: 0,
  headTilt: 0,
  headX: 0,
  headY: 0,
  hairSwing: 0,
  eyesClosed: false,
  mouth: "smile",
  leftArm: { shoulder: -120, elbow: 32, length: 1, handScale: 1, handOpen: true },
  rightArm: { shoulder: -60, elbow: 32, length: 1, handScale: 1, handOpen: true },
  leftLeg: { hip: 105, knee: -20, foot: 0 },
  rightLeg: { hip: 75, knee: 20, foot: 0 },
  note: ""
};

function armPose(shoulder, elbow, handOpen = true, handScale = 1) {
  return { shoulder, elbow, length: 1, handOpen, handScale };
}

function legPose(hip, knee, foot = 0) {
  return { hip, knee, foot };
}

function barProgressFromCurrentBar(currentBar, choreoTime) {
  return clamp(
    (choreoTime - currentBar.start) / currentBar.duration,
    0,
    0.999999
  );
}

function getPose(cue, currentBar, choreoTime) {
  const globalBar = currentBar.bar;
  const barProgress = barProgressFromCurrentBar(currentBar, choreoTime);
  const move = cue?.move ?? "";

  if (move === "strum1a") {
    if (globalBar >= 49 && globalBar <= 52) {
      return getStrum1BasePose(((globalBar - 49) % 8) + 1, barProgress);
    }
    if (globalBar >= 54 && globalBar <= 57) {
      return getStrum1BasePose(((globalBar - 54) % 8) + 1, barProgress);
    }
    return getStrum1BasePose(globalBar, barProgress);
  }

  if (move === "strum1b") return getStrum1BasePose(globalBar, barProgress);
  if (move === "strum1Base") return getStrum1BasePose(globalBar, barProgress);
  if (move === "bellyCircle") return getStrofa1APose(globalBar, barProgress);
  if (move === "comeHere") return getStrofa1APose(globalBar, barProgress);
  if (move === "lowBounce") return getStrofa1APose(globalBar, barProgress);
  if (move === "visorSearch") return getStrofa1APose(globalBar, barProgress);
  if (move === "sleepCute" || move === "cunotto") return getStrofa1APose(globalBar, barProgress);
  if (move === "hawaiianSideStep") return getHawaiianSideStepPose(globalBar, barProgress);
  if (move === "goodThingCircle" || move === "goodThingGesture") return getGoodThingGesturePose(globalBar, barProgress);
  if (move === "accentHead") return getAccentHeadPose(globalBar, barProgress, cue?.text ?? "accento");

  if (currentBar.sectionId === "strum1") return getStrum1BasePose(globalBar, barProgress);
  if (currentBar.sectionId === "strofa1a") return getStrofa1APose(globalBar, barProgress);
  if (currentBar.sectionId === "strofa1b") return getStrofa1BPose(globalBar, barProgress);

  return { ...neutralPose };
}

function getStrum1BasePose(globalBar, barProgress) {
  const beatIndex = Math.floor(barProgress * 2);
  const beatPhase = (barProgress * 2) % 1;
  const punch = smooth01(beatPhase < 0.5 ? beatPhase * 2 : (1 - beatPhase) * 2);
  const alt = (globalBar + beatIndex) % 2 === 0 ? -1 : 1;
  const bounce = Math.abs(phaseSin(barProgress * 2)) * 8;

  if (globalBar <= 8) {
    return {
      ...neutralPose,
      rootY: bounce,
      bodyTilt: alt * 4,
      headTilt: alt * -3,
      hairSwing: alt * 7,
      leftArm: alt < 0 ? armPose(-170, 8, false, 0.95) : armPose(-95, 55, false, 0.95),
      rightArm: alt > 0 ? armPose(-10, -8, false, 0.95) : armPose(-85, -55, false, 0.95),
      leftLeg: legPose(105 + alt * 10, -28),
      rightLeg: legPose(75 + alt * 10, 28),
      note: "Strum1a: pugni alternati + anche"
    };
  }

  return {
    ...neutralPose,
    rootY: bounce * 0.8,
    bodyTilt: alt * 3,
    headTilt: alt * 4,
    hairSwing: alt * 8,
    leftArm: armPose(-155 + alt * 18, 26 + punch * 18, true, 1.05),
    rightArm: armPose(-25 + alt * 18, -26 - punch * 18, true, 1.05),
    leftLeg: legPose(110 + alt * 8, -18),
    rightLeg: legPose(70 + alt * 8, 18),
    note: "Strum1b: gesti ampi tipo saluto"
  };
}

function getStrofa1APose(globalBar, barProgress) {
  const bounce = Math.abs(phaseSin(barProgress * 2)) * 6;
  const pulse = smooth01(barProgress < 0.5 ? barProgress * 2 : (1 - barProgress) * 2);

  if (globalBar >= 17 && globalBar <= 19) {
    const circle = barProgress * Math.PI * 2;
    return {
      ...neutralPose,
      rootY: 2,
      bodyTilt: Math.sin(circle) * 2,
      headTilt: Math.sin(circle) * 2,
      hairSwing: Math.sin(circle) * 3,
      rightArm: armPose(-68 + Math.cos(circle) * 24, -82 + Math.sin(circle) * 35, true, 1),
      leftArm: armPose(-116, 45, true, 1),
      note: "cerchio sulla pancia con una mano"
    };
  }

  if (globalBar === 20 || globalBar === 28) {
    return {
      ...neutralPose,
      rootX: -10 * pulse,
      bodyTilt: -12 * pulse,
      headTilt: -8 * pulse,
      hairSwing: -9 * pulse,
      rightArm: armPose(-30, -85 + pulse * 80, true, 1.05),
      leftArm: armPose(-130, 65, true, 1),
      note: "fermati qua: gesto vieni qua"
    };
  }

  if (globalBar >= 21 && globalBar <= 24) {
    return {
      ...neutralPose,
      rootY: bounce + 4,
      bodyTilt: 0,
      headTilt: Math.sin(barProgress * Math.PI * 2) * 2,
      hairSwing: Math.sin(barProgress * Math.PI * 2) * 3,
      leftArm: armPose(-116, 45, true, 1),
      rightArm: armPose(-64, -45, true, 1),
      leftLeg: legPose(104, -35),
      rightLeg: legPose(76, 35),
      note: "bounce basso senza ancheggiamento"
    };
  }

  if (globalBar >= 25 && globalBar <= 26) {
    return {
      ...neutralPose,
      bodyTilt: phaseSin(barProgress) * 7,
      headTilt: phaseSin(barProgress) * 8,
      hairSwing: phaseSin(barProgress) * 10,
      rightArm: armPose(-132 + phaseSin(barProgress) * 35, -18, true, 1),
      leftArm: armPose(-105, 55, true, 1),
      note: "mano a visiera + rotazione"
    };
  }

  if (globalBar === 27) {
    return {
      ...neutralPose,
      headTilt: -22,
      headX: -5,
      eyesClosed: true,
      hairSwing: -8,
      leftArm: armPose(-78, 90, true, 1.05),
      rightArm: armPose(-102, -90, true, 1.05),
      note: "cunotto: mani giunte sotto guancia"
    };
  }

  return {
    ...neutralPose,
    rootY: bounce + 4,
    headTilt: Math.sin(barProgress * Math.PI * 2) * 2,
    hairSwing: Math.sin(barProgress * Math.PI * 2) * 3,
    leftArm: armPose(-116, 45, true, 1),
    rightArm: armPose(-64, -45, true, 1),
    leftLeg: legPose(104, -35),
    rightLeg: legPose(76, 35),
    note: "bounce basso"
  };
}

function getHawaiianSideStepPose(globalBar, barProgress) {
  const localIndex = globalBar - 33;
  const twoBarPhase = (localIndex % 4) + barProgress;
  const goingRight = twoBarPhase < 2;
  const dir = goingRight ? 1 : -1;
  const stepSlot = Math.floor((twoBarPhase % 2) * 4);
  const active = stepSlot < 3;
  const stepPulse = active ? smooth01(((twoBarPhase % 2) * 4) % 1) : 0;
  const xBase = goingRight
    ? lerp(-12, 18, Math.min(twoBarPhase / 1.5, 1))
    : lerp(18, -12, Math.min((twoBarPhase - 2) / 1.5, 1));

  return {
    ...neutralPose,
    rootX: xBase,
    rootY: active ? 4 * stepPulse : 0,
    bodyTilt: dir * 5,
    headTilt: dir * 5,
    hairSwing: dir * 9,
    leftArm: armPose(goingRight ? -112 : -154, goingRight ? 72 : 18, true, 1.05),
    rightArm: armPose(goingRight ? -26 : -68, goingRight ? -18 : -72, true, 1.05),
    leftLeg: goingRight ? legPose(101, -20, -8) : legPose(91 - stepPulse * 22, -12, -8),
    rightLeg: goingRight ? legPose(89 + stepPulse * 22, 12, 8) : legPose(79, 20, 8),
    note: "passetto laterale + mani hawaiane"
  };
}

function getGoodThingGesturePose(globalBar, barProgress) {
  const circle = barProgress * Math.PI * 2;
  const depth = Math.cos(circle);
  const side = Math.sin(circle);
  const scale = lerp(0.75, 1.35, (depth + 1) / 2);

  return {
    ...neutralPose,
    rootY: Math.abs(Math.sin(circle)) * 4,
    bodyTilt: 5,
    headTilt: 4 + side * 3,
    hairSwing: 5 + side * 5,
    leftArm: armPose(-122, 45, true, 1),
    rightArm: armPose(-42 + side * 42, -42 + depth * 68, true, scale),
    leftLeg: legPose(103, -20),
    rightLeg: legPose(77, 20),
    note: "gesto cosa buona: cerchio mano destra aperta"
  };
}

function getAccentHeadPose(globalBar, barProgress, label) {
  const first = barProgress < 0.5;
  const p = first ? barProgress * 2 : (barProgress - 0.5) * 2;
  const hit = smooth01(p < 0.45 ? p / 0.45 : (1 - p) / 0.55);
  const dir = first ? 1 : -1;

  return {
    ...neutralPose,
    rootY: 2,
    bodyTilt: dir * 3 * hit,
    headTilt: dir * 24 * hit,
    headX: dir * 7 * hit,
    hairSwing: dir * 22 * hit,
    leftArm: armPose(-116, 50, true, 1),
    rightArm: armPose(-64, -50, true, 1),
    note: `${label}: due quarti accentati, testa e capelli dx/sx`
  };
}

function getStrofa1BPose(globalBar, barProgress) {
  if (globalBar >= 33 && globalBar <= 40) return getHawaiianSideStepPose(globalBar, barProgress);
  if (globalBar >= 41 && globalBar <= 47) return getGoodThingGesturePose(globalBar, barProgress);
  if (globalBar === 48) return getAccentHeadPose(globalBar, barProgress, "SU SSI’");
  if (globalBar >= 49 && globalBar <= 52) return getStrum1BasePose(((globalBar - 49) % 8) + 1, barProgress);
  if (globalBar === 53) return getAccentHeadPose(globalBar, barProgress, "SULU");
  if (globalBar >= 54 && globalBar <= 57) return getStrum1BasePose(((globalBar - 54) % 8) + 1, barProgress);
  return { ...neutralPose };
}
