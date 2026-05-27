const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) el.setAttribute(key, value);
  }
  return el;
}

function clearEl(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function polarPoint(x, y, length, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: x + Math.cos(rad) * length, y: y + Math.sin(rad) * length };
}

function append(parent, child) {
  parent.appendChild(child);
  return child;
}

function Limb(group, from, a1, l1, a2, l2, width = 8, rounded = true) {
  const joint = polarPoint(from.x, from.y, l1, a1);
  const end = polarPoint(joint.x, joint.y, l2, a1 + a2);

  const limb = svgEl("g", {
    fill: "none",
    stroke: "currentColor",
    "stroke-width": width,
    "stroke-linecap": rounded ? "round" : "butt",
    "stroke-linejoin": "round"
  });

  append(limb, svgEl("line", { x1: from.x, y1: from.y, x2: joint.x, y2: joint.y }));
  append(limb, svgEl("line", { x1: joint.x, y1: joint.y, x2: end.x, y2: end.y }));
  append(group, limb);

  return { joint, end };
}

function Hand(group, x, y, scale = 1, open = true) {
  if (open) {
    const hand = svgEl("g", {
      transform: `translate(${x} ${y}) scale(${scale})`,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 3,
      "stroke-linecap": "round"
    });

    append(hand, svgEl("circle", { cx: 0, cy: 0, r: 7 }));
    append(hand, svgEl("line", { x1: 0, y1: -7, x2: 0, y2: -16 }));
    append(hand, svgEl("line", { x1: -5, y1: -5, x2: -13, y2: -13 }));
    append(hand, svgEl("line", { x1: 5, y1: -5, x2: 13, y2: -13 }));
    append(group, hand);
    return;
  }

  append(group, svgEl("circle", {
    cx: x,
    cy: y,
    r: 7 * scale,
    fill: "currentColor"
  }));
}

function renderStickman(stickmanGroup, pose) {
  clearEl(stickmanGroup);

  const safePose = {
    rootX: 0,
    rootY: 0,
    bodyTilt: 0,
    headTilt: 0,
    headX: 0,
    headY: 0,
    hairSwing: 0,
    eyesClosed: false,
    leftArm: { shoulder: -120, elbow: 32, length: 1, handScale: 1, handOpen: true },
    rightArm: { shoulder: -60, elbow: 32, length: 1, handScale: 1, handOpen: true },
    leftLeg: { hip: 105, knee: -20, foot: 0 },
    rightLeg: { hip: 75, knee: 20, foot: 0 },
    ...pose
  };

  const baseX = 210 + safePose.rootX;
  const hipY = 260 + safePose.rootY;
  const torsoTop = { x: baseX + safePose.bodyTilt * 0.25, y: hipY - 78 };
  const hip = { x: baseX, y: hipY };
  const neck = { x: torsoTop.x, y: torsoTop.y - 5 };
  const headCenter = { x: neck.x + safePose.headX, y: neck.y - 34 + safePose.headY };

  const lShoulder = { x: torsoTop.x - 30, y: torsoTop.y + 5 };
  const rShoulder = { x: torsoTop.x + 30, y: torsoTop.y + 5 };
  const lHip = { x: hip.x - 18, y: hip.y };
  const rHip = { x: hip.x + 18, y: hip.y };

  const lArmJoint = polarPoint(lShoulder.x, lShoulder.y, 42, safePose.leftArm.shoulder);
  const lArmEnd = polarPoint(lArmJoint.x, lArmJoint.y, 38, safePose.leftArm.shoulder + safePose.leftArm.elbow);
  const rArmJoint = polarPoint(rShoulder.x, rShoulder.y, 42, safePose.rightArm.shoulder);
  const rArmEnd = polarPoint(rArmJoint.x, rArmJoint.y, 38, safePose.rightArm.shoulder + safePose.rightArm.elbow);

  const main = svgEl("g", {
    class: "text-slate-900",
    transform: `rotate(${safePose.bodyTilt} ${hip.x} ${hip.y})`,
    style: "color:#0f172a"
  });

  const torso = svgEl("g", {
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 9,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });
  append(torso, svgEl("line", { x1: neck.x, y1: neck.y, x2: hip.x, y2: hip.y }));
  append(main, torso);

  Limb(main, lShoulder, safePose.leftArm.shoulder, 42, safePose.leftArm.elbow, 38, 8);
  Limb(main, rShoulder, safePose.rightArm.shoulder, 42, safePose.rightArm.elbow, 38, 8);
  Hand(main, lArmEnd.x, lArmEnd.y, safePose.leftArm.handScale, safePose.leftArm.handOpen);
  Hand(main, rArmEnd.x, rArmEnd.y, safePose.rightArm.handScale, safePose.rightArm.handOpen);

  Limb(main, lHip, safePose.leftLeg.hip, 50, safePose.leftLeg.knee, 54, 9);
  Limb(main, rHip, safePose.rightLeg.hip, 50, safePose.rightLeg.knee, 54, 9);

  const headGroup = svgEl("g", {
    transform: `translate(${headCenter.x} ${headCenter.y}) rotate(${safePose.headTilt})`
  });

  append(headGroup, svgEl("circle", {
    cx: 0,
    cy: 0,
    r: 26,
    fill: "white",
    stroke: "currentColor",
    "stroke-width": 6
  }));

  const hair = svgEl("g", {
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 4,
    "stroke-linecap": "round"
  });

  append(hair, svgEl("path", {
    d: `M -18 -16 C ${-38 - safePose.hairSwing} 10, ${-46 - safePose.hairSwing} 58, ${-34 - safePose.hairSwing * 0.4} 104`
  }));
  append(hair, svgEl("path", {
    d: `M -8 -22 C ${-25 - safePose.hairSwing} 18, ${-28 - safePose.hairSwing} 72, ${-18 - safePose.hairSwing * 0.35} 122`
  }));
  append(hair, svgEl("path", {
    d: `M 8 -22 C ${25 - safePose.hairSwing} 18, ${28 - safePose.hairSwing} 72, ${18 - safePose.hairSwing * 0.35} 122`
  }));
  append(hair, svgEl("path", {
    d: `M 18 -16 C ${38 - safePose.hairSwing} 10, ${46 - safePose.hairSwing} 58, ${34 - safePose.hairSwing * 0.4} 104`
  }));
  append(headGroup, hair);

  const face = svgEl("g", {
    stroke: "currentColor",
    "stroke-width": 3,
    "stroke-linecap": "round"
  });

  if (safePose.eyesClosed) {
    append(face, svgEl("line", { x1: -11, y1: -4, x2: -3, y2: -4 }));
    append(face, svgEl("line", { x1: 3, y1: -4, x2: 11, y2: -4 }));
  } else {
    append(face, svgEl("circle", { cx: -8, cy: -5, r: 2.5, fill: "currentColor" }));
    append(face, svgEl("circle", { cx: 8, cy: -5, r: 2.5, fill: "currentColor" }));
  }

  append(face, svgEl("path", { d: "M -8 11 Q 0 18 8 11", fill: "none" }));
  append(headGroup, face);

  append(main, headGroup);
  append(stickmanGroup, main);
}
