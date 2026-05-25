const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== null && value !== undefined) el.setAttribute(key, value);
  }
  return el;
}

function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function append(parent, child) {
  if (child) parent.appendChild(child);
  return child;
}

function line(parent, x1, y1, x2, y2, attrs = {}) {
  return append(parent, svgEl("line", {
    x1,
    y1,
    x2,
    y2,
    stroke: attrs.stroke ?? "#18181b",
    "stroke-width": attrs.width ?? 7,
    "stroke-linecap": attrs.cap ?? "round",
    "stroke-linejoin": attrs.join ?? "round",
    fill: "none"
  }));
}

function path(parent, d, attrs = {}) {
  return append(parent, svgEl("path", {
    d,
    fill: attrs.fill ?? "none",
    stroke: attrs.stroke ?? "#18181b",
    "stroke-width": attrs.width ?? 7,
    "stroke-linecap": attrs.cap ?? "round",
    "stroke-linejoin": attrs.join ?? "round"
  }));
}

function ellipse(parent, cx, cy, rx, ry, attrs = {}) {
  return append(parent, svgEl("ellipse", {
    cx,
    cy,
    rx,
    ry,
    fill: attrs.fill ?? "white",
    stroke: attrs.stroke ?? "#18181b",
    "stroke-width": attrs.width ?? 3
  }));
}

function circle(parent, cx, cy, r, attrs = {}) {
  return append(parent, svgEl("circle", {
    cx,
    cy,
    r,
    fill: attrs.fill ?? "white",
    stroke: attrs.stroke ?? "#18181b",
    "stroke-width": attrs.width ?? 3
  }));
}

function group(attrs = {}) {
  return svgEl("g", attrs);
}

function FistHand(x, y, scale = 1) {
  return svgEl("circle", {
    cx: x,
    cy: y,
    r: 7 * scale,
    fill: "#18181b"
  });
}

function PalmHand(x, y, scale = 1) {
  const g = group({ transform: `translate(${x} ${y}) scale(${scale})` });

  ellipse(g, 0, 0, 8, 6, { fill: "white", width: 3 });

  line(g, -6, -2, -11, -7, { width: 2 });
  line(g, -2, -5, -3, -11, { width: 2 });
  line(g, 2, -5, 2, -11, { width: 2 });
  line(g, 6, -2, 11, -7, { width: 2 });

  return g;
}

function PalmUpHand(x, y, width = 1, scale = 1) {
  const w = Math.max(0.06, width);
  const g = group({ transform: `translate(${x} ${y}) scale(${scale})` });

  if (w < 0.18) {
    line(g, -11, 0, 11, 0, { width: 4 });
    return g;
  }

  const inner = group({ transform: `scale(${w} 1)` });
  ellipse(inner, 0, 0, 9, 5.5, { fill: "white", width: 3 });

  line(inner, -6, -3, -9, -9, { width: 2 });
  line(inner, -2, -5, -2, -12, { width: 2 });
  line(inner, 2, -5, 2, -12, { width: 2 });
  line(inner, 6, -3, 9, -9, { width: 2 });
  line(inner, -8, 1, -14, 4, { width: 2 });

  append(g, inner);
  return g;
}

function BackHand(x, y, width = 1) {
  const w = Math.max(0.08, width);

  if (w < 0.22) {
    const g = group();
    line(g, x, y - 6, x, y + 6, { width: 4 });
    return g;
  }

  const g = group({ transform: `translate(${x} ${y}) scale(${w} 1)` });
  ellipse(g, 0, 0, 8, 6, { fill: "white", width: 3 });

  line(g, -5, -5, -5, -11, { width: 2 });
  line(g, -1.5, -6, -1.5, -12, { width: 2 });
  line(g, 2, -6, 2, -12, { width: 2 });
  line(g, 5.5, -5, 5.5, -10.5, { width: 2 });

  return g;
}

function SideHand(x, y) {
  const g = group();
  line(g, x - 7, y, x + 7, y, { width: 4 });
  return g;
}

function JoinedHands(x, y, scale = 1) {
  const g = group({ transform: `translate(${x} ${y}) scale(${scale})` });

  ellipse(g, -3.5, 0, 6, 5.5, { fill: "white", width: 3 });
  ellipse(g, 3.5, 0, 6, 5.5, { fill: "white", width: 3 });

  line(g, -6, -4, -7, -9, { width: 2 });
  line(g, -2, -5, -2, -10, { width: 2 });
  line(g, 2, -5, 2, -10, { width: 2 });
  line(g, 6, -4, 7, -9, { width: 2 });

  return g;
}

function Hand(x, y, mode, fistScale = 1, width = 1, scale = 1) {
  if (mode === "none") return null;
  if (mode === "fist") return FistHand(x, y, fistScale);
  if (mode === "palm") return PalmHand(x, y, scale);
  if (mode === "palmUp") return PalmUpHand(x, y, width, scale);
  if (mode === "joinedHands") return JoinedHands(x, y, scale);
  if (mode === "back") return BackHand(x, y, width);
  if (mode === "side") return SideHand(x, y);
  return PalmHand(x, y, scale);
}

function LongHair(x, y, scale = 1, tilt = 0, swing = 0, lift = 0, spread = 1) {
  const g = group({
    transform: `translate(${x} ${y}) rotate(${tilt}) scale(${scale})`
  });

  const leftSwing = swing * 0.45 - spread * 2;
  const rightSwing = swing * 0.45 + spread * 2;
  const endLift = lift * 0.8;

  path(
    g,
    `M -10 -13 C ${-24 + leftSwing} 2, ${-25 + leftSwing} ${34 + endLift}, ${-19 + leftSwing} ${58 + endLift}`,
    { width: 3 }
  );

  path(
    g,
    `M -5 -15 C ${-15 + leftSwing} 6, ${-17 + leftSwing} ${38 + endLift}, ${-12 + leftSwing} ${66 + endLift}`,
    { width: 2.4 }
  );

  path(
    g,
    `M 10 -13 C ${24 + rightSwing} 2, ${25 + rightSwing} ${34 + endLift}, ${19 + rightSwing} ${58 + endLift}`,
    { width: 3 }
  );

  path(
    g,
    `M 5 -15 C ${15 + rightSwing} 6, ${17 + rightSwing} ${38 + endLift}, ${12 + rightSwing} ${66 + endLift}`,
    { width: 2.4 }
  );

  return g;
}

function renderStickman(stickmanGroup, pose) {
  clearEl(stickmanGroup);

  const pelvis = { x: pose.pelvisX, y: pose.pelvisY };
  const chest = { x: pose.chestX, y: pose.chestY };
  const neck = { x: chest.x + pose.shoulderTilt, y: pose.chestY - 28 };
  const head = { x: pose.headX, y: pose.headY };

  const rShoulder = {
    x: chest.x + 14 + pose.shoulderTilt + pose.chestTwist,
    y: pose.chestY - 14
  };

  const lShoulder = {
    x: chest.x - 14 + pose.shoulderTilt - pose.chestTwist,
    y: pose.chestY - 14
  };

  const rElbow = {
    x: rShoulder.x + pose.rightElbow.x,
    y: rShoulder.y + pose.rightElbow.y
  };

  const lElbow = {
    x: lShoulder.x + pose.leftElbow.x,
    y: lShoulder.y + pose.leftElbow.y
  };

  const rHand = {
    x: rShoulder.x + pose.rightHand.x,
    y: rShoulder.y + pose.rightHand.y
  };

  const lHand = {
    x: lShoulder.x + pose.leftHand.x,
    y: lShoulder.y + pose.leftHand.y
  };

  const low = pose.lowBounce;

  const rHip = { x: pelvis.x + 11, y: pelvis.y };
  const lHip = { x: pelvis.x - 11, y: pelvis.y };

  const rKnee = {
    x: low ? 42 + pose.pelvisX * 0.12 : 20 + pose.pelvisX * 0.2,
    y: low ? 122 : 111
  };

  const lKnee = {
    x: low ? -42 + pose.pelvisX * 0.12 : -20 + pose.pelvisX * 0.2,
    y: low ? 122 : 111
  };

  const rFoot = {
    x: (low ? 54 : 29) + pose.rightFootOffsetX,
    y: 150 - pose.rightFootLift
  };

  const lFoot = {
    x: (low ? -54 : -29) + pose.leftFootOffsetX,
    y: 150 - pose.leftFootLift
  };

  const g = group({
    transform: "translate(210 108) scale(1.25)"
  });

  ellipse(g, pelvis.x, pelvis.y + 4, low ? 32 : 24, 12, {
    fill: "#e4e4e7",
    stroke: "none",
    width: 0
  });

  line(g, pelvis.x, pelvis.y, chest.x, chest.y, { width: 7 });
  line(g, chest.x, chest.y, neck.x, neck.y, { width: 7 });

  append(
    g,
    LongHair(
      head.x,
      head.y,
      pose.headScale,
      pose.headTilt,
      pose.hairSwing,
      pose.hairLift,
      pose.hairSpread
    )
  );

  const headGroup = group({
    transform: `translate(${head.x} ${head.y}) rotate(${pose.headTilt}) scale(${pose.headScale})`
  });

  circle(headGroup, 0, 0, 18, {
    fill: "white",
    width: 7
  });

  if (pose.closedEyes) {
    line(headGroup, -8, -2, -2, -4, { width: 2.5 });
    line(headGroup, 2, -4, 8, -2, { width: 2.5 });
  }

  append(g, headGroup);

  line(g, lShoulder.x, lShoulder.y, rShoulder.x, rShoulder.y, { width: 7 });

  path(
    g,
    `M ${rShoulder.x} ${rShoulder.y} Q ${rElbow.x} ${rElbow.y} ${rHand.x} ${rHand.y}`,
    { width: 7 * pose.rightArmScale }
  );

  path(
    g,
    `M ${lShoulder.x} ${lShoulder.y} Q ${lElbow.x} ${lElbow.y} ${lHand.x} ${lHand.y}`,
    { width: 7 * pose.leftArmScale }
  );

  append(
    g,
    Hand(
      rHand.x,
      rHand.y,
      pose.rightHandMode,
      pose.rightFistScale,
      pose.rightHandWidth,
      pose.rightHandScale
    )
  );

  append(
    g,
    Hand(
      lHand.x,
      lHand.y,
      pose.leftHandMode,
      pose.leftFistScale,
      pose.leftHandWidth,
      pose.leftHandScale
    )
  );

  line(g, lHip.x, lHip.y, lKnee.x, lKnee.y, { width: 7 });
  line(g, lKnee.x, lKnee.y, lFoot.x, lFoot.y, { width: 7 });
  line(g, rHip.x, rHip.y, rKnee.x, rKnee.y, { width: 7 });
  line(g, rKnee.x, rKnee.y, rFoot.x, rFoot.y, { width: 7 });

  line(g, -62, 155, 62, 155, {
    width: 3,
    stroke: "#d4d4d8"
  });

  append(stickmanGroup, g);
}
