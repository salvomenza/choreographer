function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2;
}

function smoothstep(t) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function arcPoint(side, t) {
  const s = side === "right" ? 1 : -1;
  const e = easeInOutSine(t);
  const angle = Math.PI * (1.02 - e * 0.82);
  const cx = s * 18;
  const cy = -16;
  const rx = 34;
  const ry = 54;
  return { x: cx + s * Math.cos(angle) * rx, y: cy - Math.sin(angle) * ry };
}

function basePose() {
  return {
    label: "",
    section: "",
    bar: 1,
    beat: 1,

    pelvisX: 0,
    pelvisY: 68,
    chestX: 0,
    chestY: 8,
    shoulderTilt: 0,
    chestTwist: 0,

    headX: 0,
    headY: -42,
    headScale: 1,
    headTilt: 0,
    closedEyes: false,

    hairSwing: 0,
    hairLift: 0,
    hairSpread: 1,

    rightHand: { x: 16, y: 0 },
    leftHand: { x: -16, y: 0 },
    rightElbow: { x: 6, y: 15 },
    leftElbow: { x: -6, y: 15 },

    rightHandMode: "fist",
    leftHandMode: "fist",

    rightHandWidth: 1,
    leftHandWidth: 1,
    rightHandScale: 1,
    leftHandScale: 1,
    rightFistScale: 1,
    leftFistScale: 1,
    rightArmScale: 1,
    leftArmScale: 1,

    lowBounce: false,

    rightFootOffsetX: 0,
    leftFootOffsetX: 0,
    rightFootLift: 0,
    leftFootLift: 0,

    handNote: ""
  };
}

function addStrum1aArms(pose, onRightBeat, beatPhase, low = false) {
  const punchForward = Math.sin(Math.PI * beatPhase);
  const punch = punchForward * 8;

  pose.rightHandMode = "fist";
  pose.leftHandMode = "fist";
  pose.rightElbow = { x: 6, y: 15 };
  pose.leftElbow = { x: -6, y: 15 };

  if (onRightBeat) {
    pose.rightHand = { x: 18 + punch, y: low ? 2 : 0 };
    pose.leftHand = { x: -15, y: low ? 4 : 2 };
    pose.rightFistScale = 1 + 0.3 * punchForward;
    pose.leftFistScale = 0.94 - 0.05 * punchForward;
    pose.rightArmScale = 1 + 0.08 * punchForward;
    pose.leftArmScale = 0.96;
  } else {
    pose.rightHand = { x: 15, y: low ? 4 : 2 };
    pose.leftHand = { x: -18 - punch, y: low ? 2 : 0 };
    pose.rightFistScale = 0.94 - 0.05 * punchForward;
    pose.leftFistScale = 1 + 0.3 * punchForward;
    pose.rightArmScale = 0.96;
    pose.leftArmScale = 1 + 0.08 * punchForward;
  }
}

function getLocalTiming(currentBar, choreoTime, sectionStartBar) {
  const barDuration = currentBar.duration;
  const beatDuration = barDuration / 2;
  const localBar = currentBar.bar - sectionStartBar + 1;
  const localTime = (localBar - 1) * barDuration + (choreoTime - currentBar.start);
  const beatFloat = localTime / beatDuration;
  const beatIndex = Math.floor(beatFloat);
  const beatPhase = beatFloat - beatIndex;
  const barProgress = clamp((choreoTime - currentBar.start) / barDuration, 0, 0.999999);

  return {
    localBar,
    localTime,
    beatIndex,
    beatPhase,
    barProgress,
    beat: (beatIndex % 2) + 1,
    onRightBeat: beatIndex % 2 === 0,
    barDuration,
    beatDuration
  };
}

function getPose(cue, currentBar, choreoTime) {
  const sectionId = currentBar.sectionId;

  if (sectionId === "strum1") {
    return getStrum1Pose(currentBar, choreoTime);
  }

  if (sectionId === "strofa1a") {
    return getStrofa1APose(currentBar, choreoTime);
  }

  if (sectionId === "strofa1b") {
    return getStrofa1BPose(currentBar, choreoTime);
  }

  return basePose();
}

function getStrum1Pose(currentBar, choreoTime) {
  const info = getLocalTiming(currentBar, choreoTime, 1);
  const pose = basePose();

  const barIndex = info.localBar - 1;
  const onRightBeat = info.onRightBeat;
  const hipShift = onRightBeat ? -7 : 7;
  const hipEase = Math.sin(Math.PI * info.beatPhase);

  pose.section = barIndex < 8 ? "Strum1a" : "Strum1b";
  pose.label = barIndex < 8 ? "Strum1a: pugni + anche" : "Strum1b: saluto ampio + anche";
  pose.bar = info.localBar;
  pose.beat = info.beat;

  pose.pelvisX = hipShift * (0.55 + 0.45 * hipEase);
  pose.chestX = pose.pelvisX * 0.35;
  pose.shoulderTilt = -pose.pelvisX * 0.1;
  pose.headX = pose.pelvisX * 0.18;
  pose.hairSwing = -pose.pelvisX * 0.6;
  pose.hairLift = Math.sin(Math.PI * info.beatPhase) * 1.5;
  pose.hairSpread = 1;

  if (barIndex < 8) {
    addStrum1aArms(pose, onRightBeat, info.beatPhase);
    return pose;
  }

  const localBar = barIndex - 8;
  const twoBarGroup = Math.floor(localBar / 2);
  const side = twoBarGroup % 2 === 0 ? "right" : "left";
  const groupStart = 8 * info.barDuration + twoBarGroup * 2 * info.barDuration;
  const groupPhase = (info.localTime - groupStart) / (2 * info.barDuration);
  const p = arcPoint(side, groupPhase);

  pose.rightHandMode = "palm";
  pose.leftHandMode = "palm";
  pose.rightElbow = { x: 18, y: 8 };
  pose.leftElbow = { x: -18, y: 8 };
  pose.rightHand = { x: 28, y: 16 };
  pose.leftHand = { x: -28, y: 16 };

  if (side === "right") {
    pose.rightHand = p;
    pose.rightElbow = { x: p.x * 0.42, y: p.y * 0.45 + 10 };
    pose.hairSwing += -2;
  } else {
    pose.leftHand = p;
    pose.leftElbow = { x: p.x * 0.42, y: p.y * 0.45 + 10 };
    pose.hairSwing += 2;
  }

  return pose;
}

function getStrofa1APose(currentBar, choreoTime) {
  const info = getLocalTiming(currentBar, choreoTime, 17);
  const pose = basePose();

  const bar = info.localBar;
  const beatPhase = info.beatPhase;
  const onRightBeat = info.onRightBeat;

  pose.section = "Strofa1A";
  pose.bar = bar;
  pose.beat = info.beat;

  const softSway = onRightBeat ? -3 : 3;
  pose.pelvisX = softSway * (0.5 + 0.5 * Math.sin(Math.PI * beatPhase));
  pose.chestX = pose.pelvisX * 0.22;
  pose.headX = pose.pelvisX * 0.12;
  pose.shoulderTilt = -pose.pelvisX * 0.06;
  pose.hairSwing = -pose.pelvisX * 0.55;
  pose.hairLift = Math.sin(Math.PI * beatPhase) * 1;
  pose.hairSpread = 1;

  if (bar >= 1 && bar <= 3) {
    pose.label = "Strofa1A: appetito - una mano sulla pancia";
    pose.rightHandMode = "palm";
    pose.leftHandMode = "palm";

    const local = info.localTime / (3 * info.barDuration);
    const theta = Math.PI * 2 * 3 * local;
    const bellyX = 2;
    const bellyY = 42;

    pose.rightHand = {
      x: bellyX + Math.cos(theta) * 12,
      y: bellyY + Math.sin(theta) * 8
    };
    pose.rightElbow = { x: 16, y: 24 };
    pose.leftHand = { x: -24, y: 24 };
    pose.leftElbow = { x: -18, y: 18 };
    pose.chestY = 10;
    pose.headY = -39;
    pose.hairLift = 1.2;
    pose.handNote = "cerchio sulla pancia con la sola mano destra";
    return pose;
  }

  if (bar === 4 || bar === 12) {
    pose.label = "Strofa1A: vieni qua - avambraccio e busto a sinistra";

    const qPhase = beatPhase;
    const curl = Math.sin(Math.PI * qPhase);

    pose.chestX = -8 - 4 * curl;
    pose.shoulderTilt = -8 - 4 * curl;
    pose.headX = -6 - 2 * curl;
    pose.headTilt = -8 - 5 * curl;
    pose.chestY = 9 + 2 * curl;
    pose.headY = -42 + 2 * curl;

    pose.rightHandMode = "palmUp";
    pose.rightElbow = { x: 25, y: 17 };
    pose.rightHand = {
      x: 52 - 23 * curl,
      y: 30 - 11 * curl
    };
    pose.rightHandScale = 1.45 - 0.08 * curl;
    pose.rightHandWidth = 1 - 0.25 * curl;

    pose.leftHandMode = "palm";
    pose.leftElbow = { x: -16, y: 18 };
    pose.leftHand = { x: -24, y: 26 };

    pose.hairSwing = -7 - 3 * curl;
    pose.hairLift = 1;
    pose.hairSpread = 1.05;
    pose.handNote = "richiamo con avambraccio; busto curvato a sinistra";
    return pose;
  }

  if ((bar >= 5 && bar <= 8) || (bar >= 13 && bar <= 16)) {
    pose.label = "Strofa1A: bounce basso - senza ancheggiamento";
    const down = Math.sin(Math.PI * beatPhase);
    pose.lowBounce = true;

    pose.pelvisX = 0;
    pose.chestX = 0;
    pose.headX = 0;
    pose.shoulderTilt = 0;
    pose.pelvisY = 96 + 18 * down;
    pose.chestY = 30 + 12 * down;
    pose.headY = -24 + 10 * down;
    pose.headScale = 1.12 + 0.28 * down;
    pose.hairSwing = 0;
    pose.hairLift = 5 * down;
    pose.hairSpread = 1.08;

    addStrum1aArms(pose, onRightBeat, beatPhase, true);
    return pose;
  }

  if (bar === 9 || bar === 10) {
    pose.label = "Strofa1A: vai cercando - visiera e rotazione";
    const local = (info.localTime - 8 * info.barDuration) / (2 * info.barDuration);
    const sway = Math.sin(local * Math.PI * 2);

    pose.chestTwist = sway * 8;
    pose.chestX = sway * 8;
    pose.headX = sway * 10;
    pose.shoulderTilt = sway * 4;

    pose.rightHandMode = "side";
    pose.leftHandMode = "palm";
    pose.rightElbow = { x: 10, y: -4 };
    pose.rightHand = { x: 18, y: -34 };
    pose.leftElbow = { x: -18, y: 16 };
    pose.leftHand = { x: -28, y: 20 };

    pose.hairSwing = -6 * sway;
    pose.hairLift = 1.5;
    pose.hairSpread = 1.04;
    pose.handNote = "mano a visiera, rotazione a sx e dx";
    return pose;
  }

  if (bar === 11) {
    pose.label = "Strofa1A: conforto - mani giunte sotto la guancia";
    const pulse = Math.sin(Math.PI * beatPhase);

    pose.pelvisY = 70 + 4 * pulse;
    pose.chestY = 10 + 3 * pulse;
    pose.headY = -38 + 4 * pulse;
    pose.headX = -8;
    pose.headTilt = -24;
    pose.closedEyes = true;

    pose.rightHandMode = "joinedHands";
    pose.leftHandMode = "none";
    pose.rightElbow = { x: 8, y: 2 };
    pose.leftElbow = { x: -4, y: 4 };
    pose.rightHand = { x: 3, y: -21 };
    pose.leftHand = { x: 0, y: 0 };
    pose.rightHandScale = 1.05;

    pose.hairSwing = -8;
    pose.hairLift = 1.5 * pulse;
    pose.hairSpread = 1.02;
    pose.handNote = "mani giunte sotto la guancia, testa reclinata, occhi chiusi";
    return pose;
  }

  return pose;
}

function getStrofa1BPose(currentBar, choreoTime) {
  const info = getLocalTiming(currentBar, choreoTime, 33);
  const pose = basePose();

  const bar = info.localBar;
  const beatIndex = info.beatIndex;
  const beatPhase = info.beatPhase;
  const onRightBeat = info.onRightBeat;

  pose.section = "Strofa1B";
  pose.label = "Strofa1B";
  pose.bar = bar;
  pose.beat = info.beat;

  if (bar >= 9 && bar <= 15) {
    pose.label = "Strofa1B: gesto 'buona' - cerchio con mano destra";

    const barPhase = info.barProgress;
    const theta = -Math.PI / 2 + barPhase * Math.PI * 2;
    const u = Math.cos(theta);
    const v = Math.sin(theta);
    const projectedRx = 13;
    const circleRy = 18;
    const stepPulse = Math.sin(Math.PI * beatPhase);

    pose.pelvisX = 2;
    pose.pelvisY = 68 - 1.5 * stepPulse;
    pose.chestX = 4;
    pose.chestY = 8 - 1.2 * stepPulse;
    pose.chestTwist = 5;
    pose.shoulderTilt = 2;
    pose.headX = 3;
    pose.headY = -42;
    pose.headTilt = 2;

    pose.rightHandMode = "palm";
    pose.leftHandMode = "palm";

    const circleCenterX = 34;
    const circleCenterY = 8;

    pose.rightElbow = {
      x: 16 + projectedRx * 0.55 * u,
      y: 10 + circleRy * 0.35 * v
    };

    pose.rightHand = {
      x: circleCenterX + projectedRx * u,
      y: circleCenterY + circleRy * v
    };

    const depthScale = (u + 1) / 2;
    pose.rightHandScale = 0.78 + depthScale * 0.54;

    pose.leftElbow = { x: -14, y: 16 };
    pose.leftHand = { x: -20, y: 26 };
    pose.leftHandScale = 1;

    pose.rightArmScale = 1;
    pose.leftArmScale = 0.95;
    pose.hairSwing = -2;
    pose.hairLift = 0.6 * stepPulse;
    pose.hairSpread = 1.01;

    pose.handNote = "una circonferenza per battuta con mano destra aperta";
    return pose;
  }

  if (bar === 16 || bar === 21) {
    const isFirstQuarter = pose.beat === 1;
    const dir = isFirstQuarter ? 1 : -1;
    const snap = Math.sin(Math.PI * beatPhase);

    pose.label = bar === 16
      ? "Strofa1B: SU SSI' - testa e capelli dx/sx"
      : "Strofa1B: SULU - testa e capelli dx/sx";

    pose.pelvisX = dir * (1 + 1.5 * snap);
    pose.pelvisY = 68 - 1.5 * snap;
    pose.chestX = dir * (2 + 3 * snap);
    pose.chestY = 8 - 1 * snap;
    pose.shoulderTilt = dir * (2 + 2 * snap);
    pose.chestTwist = dir * 2;
    pose.headX = dir * (7 + 5 * snap);
    pose.headY = -42 + 1 * snap;
    pose.headTilt = dir * (10 + 8 * snap);

    pose.hairSwing = dir * (12 + 7 * snap);
    pose.hairLift = 0.6 * snap;
    pose.hairSpread = 1.08;

    pose.rightHandMode = "fist";
    pose.leftHandMode = "fist";
    pose.rightElbow = { x: 7, y: 16 };
    pose.leftElbow = { x: -7, y: 16 };
    pose.rightHand = { x: 18, y: 15 };
    pose.leftHand = { x: -18, y: 15 };

    pose.handNote = bar === 16
      ? "SU SSI': testa e capelli prima a destra poi a sinistra"
      : "SULU: testa e capelli prima a destra poi a sinistra";
    return pose;
  }

  if ((bar >= 17 && bar <= 20) || (bar >= 22 && bar <= 25)) {
    const hipShift = onRightBeat ? -7 : 7;
    const hipEase = Math.sin(Math.PI * beatPhase);

    pose.label = bar <= 20
      ? "Strofa1B: stancu ri manciari iaddhina - passo base Strum1"
      : "Strofa1B: masculi ra sira a matina - passo base Strum1";

    pose.pelvisX = hipShift * (0.55 + 0.45 * hipEase);
    pose.chestX = pose.pelvisX * 0.35;
    pose.shoulderTilt = -pose.pelvisX * 0.1;
    pose.headX = pose.pelvisX * 0.18;
    pose.headY = -42;
    pose.headTilt = 0;
    pose.hairSwing = -pose.pelvisX * 0.6;
    pose.hairLift = Math.sin(Math.PI * beatPhase) * 1.5;
    pose.hairSpread = 1;

    addStrum1aArms(pose, onRightBeat, beatPhase);
    return pose;
  }

  const cycleBeat = beatIndex % 8;
  const goingRight = cycleBeat < 4;
  const activeStep = cycleBeat !== 3 && cycleBeat !== 7;
  const stepPulse = activeStep ? Math.sin(Math.PI * beatPhase) : 0;
  const cycleX = [6, 12, 18, 18, 12, 6, 0, 0][cycleBeat];
  const dir = goingRight ? 1 : -1;

  pose.label = "Strofa1B: passetto laterale + mani hawaiane";
  pose.pelvisX = cycleX;
  pose.chestX = cycleX * 0.75;
  pose.headX = cycleX * 0.55;
  pose.shoulderTilt = dir * 3 * Math.sin(Math.PI * beatPhase);
  pose.pelvisY = 68 - 3 * stepPulse;
  pose.chestY = 8 - 2 * stepPulse;
  pose.headY = -42 - 1.5 * stepPulse;

  const rightMoving = activeStep && ((goingRight && [0, 2].includes(cycleBeat)) || (!goingRight && cycleBeat === 5));
  const leftMoving = activeStep && ((goingRight && cycleBeat === 1) || (!goingRight && [4, 6].includes(cycleBeat)));

  pose.rightFootOffsetX = (goingRight ? cycleX : cycleX + 4) + (rightMoving ? dir * 8 * stepPulse : 0);
  pose.leftFootOffsetX = (goingRight ? cycleX - 4 : cycleX) + (leftMoving ? dir * 8 * stepPulse : 0);
  pose.rightFootLift = rightMoving ? 6 * stepPulse : 0;
  pose.leftFootLift = leftMoving ? 6 * stepPulse : 0;

  const wave = Math.sin(Math.PI * beatPhase);
  pose.rightHandMode = "palm";
  pose.leftHandMode = "palm";
  pose.rightElbow = { x: dir * 10, y: 4 + 4 * wave };
  pose.leftElbow = { x: dir * 4, y: 10 - 2 * wave };
  pose.rightHand = { x: dir * 42, y: 3 + 8 * wave };
  pose.leftHand = { x: dir * 26, y: 20 - 5 * wave };
  pose.rightArmScale = 0.95;
  pose.leftArmScale = 0.95;

  pose.hairSwing = -dir * 4 - cycleX * 0.25;
  pose.hairLift = 1.2 * stepPulse;
  pose.hairSpread = 1.02;
  pose.handNote = goingRight
    ? "passi dx-sx-dx, pausa; mani verso destra"
    : "passi sx-dx-sx, pausa; mani verso sinistra";

  return pose;
}
