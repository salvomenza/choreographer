const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== null && value !== undefined) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function polarPoint(x, y, length, deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: x + Math.cos(rad) * length,
    y: y + Math.sin(rad) * length
  };
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
    stroke: attrs.stroke ?? "#0f172a",
    "stroke-width": attrs.width ?? 8,
    "stroke-linecap": attrs.cap ?? "round",
    "stroke-linejoin": attrs.join ?? "round",
    fill: "none"
  }));
}

function path(parent, d, attrs = {}) {
  return append(parent, svgEl("path", {
    d,
    fill: attrs.fill ?? "none",
    stroke: attrs.stroke ?? "#0f172a",
    "stroke-width": attrs.width ?? 4,
    "stroke-linecap": attrs.cap ?? "round",
    "stroke-linejoin": attrs.join ?? "round"
  }));
}

function circle(parent, cx, cy, r, attrs = {}) {
  return append(parent, svgEl("circle", {
    cx,
    cy,
    r,
    fill: attrs.fill ?? "none",
    stroke: attrs.stroke ?? "#0f172a",
    "stroke-width": attrs.width ?? 3
  }));
}

function group(attrs = {}) {
  return svgEl("g", attrs);
}

function drawLimb(parent, from, a1, l1, a2, l2, width = 8) {
  const joint = polarPoint(from.x, from.y, l1, a1);
  const end = polarPoint(joint.x, joint.y, l2, a1 + a2);

  const g = group({
    fill: "none",
    stroke: "#0f172a",
    "stroke-width": width,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });

  append(g, svgEl("line", { x1: from.x, y1: from.y, x2: joint.x, y2: joint.y }));
  append(g, svgEl("line", { x1: joint.x, y1: joint.y, x2: end.x, y2: end.y }));
  append(parent, g);

  return { joint, end };
}

function drawHand(parent, x, y, scale = 1, open = true) {
  if (!open) {
    append(parent, svgEl("circle", {
      cx: x,
      cy: y,
      r: 7 * scale,
      fill: "#0f172a"
    }));
    return;
  }

  const g = group({
    transform: `translate(${x} ${y}) scale(${scale})`,
    fill: "none",
    stroke: "#0f172a",
    "stroke-width": 3,
    "stroke-linecap": "round"
  });

  append(g, svgEl("circle", { cx: 0, cy: 0, r: 7 }));
  append(g, svgEl("line", { x1: 0, y1: -7, x2: 0, y2: -16 }));
  append(g, svgEl("line", { x1: -5, y1: -5, x2: -13, y2: -13 }));
  append(g, svgEl("line", { x1: 5, y1: -5, x2: 13, y2: -13 }));

  append(parent, g);
}

function renderStickman(stickmanGroup, pose) {
  clearEl(stickmanGroup);

  const baseX = 210 + pose.rootX;
  const hipY = 260 + pose.rootY;
  const torsoTop = { x: baseX + pose.bodyTilt * 0.25, y: hipY - 78 };
  const hip = { x: baseX, y: hipY };
  const neck = { x: torsoTop.x, y: torsoTop.y - 5 };
  const headCenter = { x: neck.x + pose.headX, y: neck.y - 34 + pose.headY };

  const lShoulder = { x: torsoTop.x - 30, y: torsoTop.y + 5 };
  const rShoulder = { x: torsoTop.x + 30, y: torsoTop.y + 5 };
  const lHip = { x: hip.x - 18, y: hip.y };
  const rHip = { x: hip.x + 18, y: hip.y };

  const g = group({
    transform: `rotate(${pose.bodyTilt} ${hip.x} ${hip.y})`
  });

  line(g, neck.x, neck.y, hip.x, hip.y, {
    width: 9
  });

  const lArm = drawLimb(
    g,
    lShoulder,
    pose.leftArm.shoulder,
    42 * (pose.leftArm.length ?? 1),
    pose.leftArm.elbow,
    38 * (pose.leftArm.length ?? 1),
    8
  );

  const rArm = drawLimb(
    g,
    rShoulder,
    pose.rightArm.shoulder,
    42 * (pose.rightArm.length ?? 1),
    pose.rightArm.elbow,
    38 * (pose.rightArm.length ?? 1),
    8
  );

  drawHand(g, lArm.end.x, lArm.end.y, pose.leftArm.handScale, pose.leftArm.handOpen);
  drawHand(g, rArm.end.x, rArm.end.y, pose.rightArm.handScale, pose.rightArm.handOpen);

  drawLimb(g, lHip, pose.leftLeg.hip, 50, pose.leftLeg.knee, 54, 9);
  drawLimb(g, rHip, pose.rightLeg.hip, 50, pose.rightLeg.knee, 54, 9);

  const headGroup = group({
    transform: `translate(${headCenter.x} ${headCenter.y}) rotate(${pose.headTilt})`
  });

  circle(headGroup, 0, 0, 26, {
    fill: "white",
    width: 6
  });

  const hair = group({
    fill: "none",
    stroke: "#0f172a",
    "stroke-width": 4,
    "stroke-linecap": "round"
  });

  /*
    Capelli: sempre e solo quattro fili 2D,
    due a sinistra e due a destra, lunghi fino a sotto le spalle/metà schiena.
  */
  path(
    hair,
    `M -18 -16 C ${-38 - pose.hairSwing} 10, ${-46 - pose.hairSwing} 58, ${-34 - pose.hairSwing * 0.4} 104`,
    { width: 4 }
  );
  path(
    hair,
    `M -8 -22 C ${-25 - pose.hairSwing} 18, ${-28 - pose.hairSwing} 72, ${-18 - pose.hairSwing * 0.35} 122`,
    { width: 4 }
  );
  path(
    hair,
    `M 8 -22 C ${25 - pose.hairSwing} 18, ${28 - pose.hairSwing} 72, ${18 - pose.hairSwing * 0.35} 122`,
    { width: 4 }
  );
  path(
    hair,
    `M 18 -16 C ${38 - pose.hairSwing} 10, ${46 - pose.hairSwing} 58, ${34 - pose.hairSwing * 0.4} 104`,
    { width: 4 }
  );
  append(headGroup, hair);

  const face = group({
    stroke: "#0f172a",
    "stroke-width": 3,
    "stroke-linecap": "round"
  });

  if (pose.eyesClosed) {
    append(face, svgEl("line", { x1: -11, y1: -4, x2: -3, y2: -4 }));
    append(face, svgEl("line", { x1: 3, y1: -4, x2: 11, y2: -4 }));
  } else {
    append(face, svgEl("circle", { cx: -8, cy: -5, r: 2.5, fill: "#0f172a" }));
    append(face, svgEl("circle", { cx: 8, cy: -5, r: 2.5, fill: "#0f172a" }));
  }

  path(face, "M -8 11 Q 0 18 8 11", {
    width: 3
  });

  append(headGroup, face);
  append(g, headGroup);
  append(stickmanGroup, g);
}
