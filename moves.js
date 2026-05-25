function makeNeutralPose() {
  return {
    rootX: 0,
    rootY: 0,
    bodyTilt: 0,
    headTilt: 0,
    headX: 0,
    headY: 0,
    hairSwing: 0,
    eyesClosed: false,

    leftArm: { shoulder: -120, elbow: 32, handScale: 1, handOpen: true },
    rightArm: { shoulder: -60, elbow: 32, handScale: 1, handOpen: true },

    leftLeg: { hip: 105, knee: -20 },
    rightLeg: { hip: 75, knee: 20 }
  };
}

function armPose(shoulder, elbow, handOpen = true, handScale = 1) {
  return { shoulder, elbow, handOpen, handScale };
}

function legPose(hip, knee) {
  return { hip, knee };
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

function phaseSin(t) {
  return Math.sin(t * Math.PI * 2);
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

    case "strum1Base":
      return getStrum1BasePose(currentBar.bar, barProgress);

    case "bellyCircle":
      return getBellyCirclePose(currentBar.bar, barProgress);

    case "comeHere":
      return getComeHerePose(currentBar.bar, barProgress);

    case "lowBounce":
      return getLowBouncePose(currentBar.bar, barProgress);

    case "visorSearch":
      return getVisorSearchPose(currentBar.bar, barProgress);

    case "sleepCute":
    case "cunotto":
      return getSleepCutePose(currentBar.bar, barProgress);

    case "hawaiianSideStep":
      return getHawaiianSideStepPose(currentBar.bar, barProgress);

    case "goodThingCircle":
    case "goodThingGesture":
      return getGoodThingCirclePose(currentBar.bar, barProgress);

    case "accentHead":
      return getAccentHeadPose(currentBar.bar, barProgress, cue?.params || {});

    default:
      return makeNeutralPose();
  }
}

function getStrum1BasePose(globalBar, barProgress) {
  const normalizedBar = ((globalBar - 1) % 16) + 1;

  if (normalizedBar <= 8) {
    return getStrum1aPose(globalBar, barProgress);
  }

  return getStrum1bPose(globalBar, barProgress);
}

function getStrum1aPose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const beatIndex = Math.floor(barProgress * 2);
  const beatPhase = (barProgress * 2) % 1;
  const punch = smooth01(beatPhase < 0.5 ? beatPhase * 2 : (1 - beatPhase) * 2);
  const alt = (globalBar + beatIndex) % 2 === 0 ? -1 : 1;
  const bounce = Math.abs(phaseSin(barProgress * 2)) * 8;

  pose.rootY = bounce;
  pose.bodyTilt = alt * 4;
  pose.headTilt = alt * -3;
  pose.hairSwing = alt * 7;

  pose.leftArm =
    alt < 0
      ? armPose(-170, 8 + punch * 4, false, 0.95)
      : armPose(-95, 55 - punch * 10, false, 0.95);

  pose.rightArm =
    alt > 0
      ? armPose(-10, -8 - punch * 4, false, 0.95)
      : armPose(-85, -55 + punch * 10, false, 0.95);

  pose.leftLeg = legPose(105 + alt * 10, -28);
  pose.rightLeg = legPose(75 + alt * 10, 28);

  return pose;
}

function getStrum1bPose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const beatIndex = Math.floor(barProgress * 2);
  const beatPhase = (barProgress * 2) % 1;
  const pulse = smooth01(beatPhase < 0.5 ? beatPhase * 2 : (1 - beatPhase) * 2);
  const alt = (globalBar + beatIndex) % 2 === 0 ? -1 : 1;
  const bounce = Math.abs(phaseSin(barProgress * 2)) * 6.4;

  pose.rootY = bounce;
  pose.bodyTilt = alt * 3;
  pose.headTilt = alt * 4;
  pose.hairSwing = alt * 8;

  pose.leftArm = armPose(-155 + alt * 18, 26 + pulse * 18, true, 1.05);
  pose.rightArm = armPose(-25 + alt * 18, -26 - pulse * 18, true, 1.05);

  pose.leftLeg = legPose(110 + alt * 8, -18);
  pose.rightLeg = legPose(70 + alt * 8, 18);

  return pose;
}

/*
  Strofa1A
  17–19: “Se ti sviluppa pititto” = cerchio sulla pancia con una mano
*/
function getBellyCirclePose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const circle = barProgress * Math.PI * 2;

  pose.rootY = 2;
  pose.bodyTilt = Math.sin(circle) * 2;
  pose.headTilt = Math.sin(circle) * 2;
  pose.hairSwing = Math.sin(circle) * 3;

  pose.leftArm = armPose(-116, 45, true, 1);

  pose.rightArm = armPose(
    -68 + Math.cos(circle) * 24,
    -82 + Math.sin(circle) * 35,
    true,
    1
  );

  pose.leftLeg = legPose(104, -20);
  pose.rightLeg = legPose(76, 20);

  return pose;
}

/*
  20 e 28: “fermati qua” = gesto “vieni qua”
*/
function getComeHerePose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const pulse = smooth01(
    barProgress < 0.5 ? barProgress * 2 : (1 - barProgress) * 2
  );

  pose.rootX = -10 * pulse;
  pose.bodyTilt = -12 * pulse;
  pose.headTilt = -8 * pulse;
  pose.hairSwing = -9 * pulse;

  pose.leftArm = armPose(-130, 65, true, 1);

  pose.rightArm = armPose(
    -30,
    -85 + pulse * 80,
    true,
    1.05
  );

  pose.leftLeg = legPose(104, -18);
  pose.rightLeg = legPose(76, 18);

  return pose;
}

/*
  21–24 e 29–32: bounce basso senza ancheggiamento
*/
function getLowBouncePose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const bounce = Math.abs(phaseSin(barProgress * 2)) * 6;

  pose.rootY = bounce + 4;
  pose.bodyTilt = 0;
  pose.headTilt = Math.sin(barProgress * Math.PI * 2) * 2;
  pose.hairSwing = Math.sin(barProgress * Math.PI * 2) * 3;

  pose.leftArm = armPose(-116, 45, true, 1);
  pose.rightArm = armPose(-64, -45, true, 1);

  pose.leftLeg = legPose(104, -35);
  pose.rightLeg = legPose(76, 35);

  return pose;
}

/*
  25–26: “se vai cercando” = mano a visiera + rotazione
*/
function getVisorSearchPose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const sway = phaseSin(barProgress);

  pose.bodyTilt = sway * 7;
  pose.headTilt = sway * 8;
  pose.hairSwing = sway * 10;

  pose.leftArm = armPose(-105, 55, true, 1);

  /*
    Mano destra verso la fronte, tipo visiera.
    La rotazione del busto/testa dà l’effetto di cercare intorno.
  */
  pose.rightArm = armPose(-132 + sway * 35, -18, true, 1);

  pose.leftLeg = legPose(103, -18);
  pose.rightLeg = legPose(77, 18);

  return pose;
}

/*
  27: “cunotto” = mani giunte sotto guancia, testa reclinata, occhi chiusi
*/
function getSleepCutePose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const tinyRock = Math.sin(barProgress * Math.PI * 2) * 1.5;

  pose.headTilt = -22 + tinyRock;
  pose.headX = -5;
  pose.eyesClosed = true;
  pose.hairSwing = -8 + tinyRock;

  pose.leftArm = armPose(-78, 90, true, 1.05);
  pose.rightArm = armPose(-102, -90, true, 1.05);

  pose.leftLeg = legPose(103, -20);
  pose.rightLeg = legPose(77, 20);

  return pose;
}

/*
  Strofa1B
  33–40: passetto laterale + mani hawaiane
*/
function getHawaiianSideStepPose(globalBar, barProgress) {
  const pose = makeNeutralPose();

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

  pose.rootX = xBase;
  pose.rootY = active ? 4 * stepPulse : 0;

  pose.bodyTilt = dir * 5;
  pose.headTilt = dir * 5;
  pose.hairSwing = dir * 9;

  pose.leftArm = armPose(
    goingRight ? -112 : -154,
    goingRight ? 72 : 18,
    true,
    1.05
  );

  pose.rightArm = armPose(
    goingRight ? -26 : -68,
    goingRight ? -18 : -72,
    true,
    1.05
  );

  pose.leftLeg = goingRight
    ? legPose(101, -20)
    : legPose(91 - stepPulse * 22, -12);

  pose.rightLeg = goingRight
    ? legPose(89 + stepPulse * 22, 12)
    : legPose(79, 20);

  return pose;
}

/*
  41–47: gesto “cosa buona”
  Mano destra aperta, un cerchio per battuta.
  Piano del cerchio perpendicolare al tronco, ruotato idealmente a 45° verso destra.
  Mano più grande quando viene verso lo spettatore, più piccola quando va indietro.
*/
function getGoodThingCirclePose(globalBar, barProgress) {
  const pose = makeNeutralPose();

  const circle = barProgress * Math.PI * 2;
  const depth = Math.cos(circle);
  const side = Math.sin(circle);

  const scale = lerp(0.75, 1.35, (depth + 1) / 2);

  pose.rootY = Math.abs(Math.sin(circle)) * 4;
  pose.bodyTilt = 5;
  pose.headTilt = 4 + side * 3;
  pose.hairSwing = 5 + side * 5;

  pose.leftArm = armPose(-122, 45, true, 1);

  pose.rightArm = armPose(
    -42 + side * 42,
    -42 + depth * 68,
    true,
    scale
  );

  pose.leftLeg = legPose(103, -20);
  pose.rightLeg = legPose(77, 20);

  return pose;
}

/*
  48: SU SSI’
  53: SULU
  Due quarti accentati: testa/capelli prima a destra, poi a sinistra.
*/
function getAccentHeadPose(globalBar, barProgress, params = {}) {
  const pose = makeNeutralPose();

  const firstDir = params.firstBeat === "left" ? -1 : 1;
  const secondDir = params.secondBeat === "right" ? 1 : -1;

  const first = barProgress < 0.5;
  const p = first ? barProgress * 2 : (barProgress - 0.5) * 2;

  const hit = smooth01(p < 0.45 ? p / 0.45 : (1 - p) / 0.55);
  const dir = first ? firstDir : secondDir;

  pose.rootY = 2;
  pose.bodyTilt = dir * 3 * hit;
  pose.headTilt = dir * 24 * hit;
  pose.headX = dir * 7 * hit;
  pose.hairSwing = dir * 22 * hit;

  pose.leftArm = armPose(-116, 50, true, 1);
  pose.rightArm = armPose(-64, -50, true, 1);

  pose.leftLeg = legPose(104, -20);
  pose.rightLeg = legPose(76, 20);

  return pose;
}
