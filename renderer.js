const SVG_NS = "http://www.w3.org/2000/svg";

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

function polarPoint(x, y, length, deg) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: x + Math.cos(rad) * length,
    y: y + Math.sin(rad) * length
  };
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

function renderStickman(stickmanGroup, pose) {
  clearEl(stickmanGroup);

  const g = svgEl("g");

  const hip = { x: 210 + pose.rootX, y: 260 + pose.rootY };
  const neck = { x: 210 + pose.rootX + pose.bodyTilt * 0.5, y: 182 + pose.rootY };
  const head = { x: neck.x + pose.headX, y: 150 + pose.rootY };

  const leftShoulder = { x: neck.x - 28, y: neck.y + 8 };
  const rightShoulder = { x: neck.x + 28, y: neck.y + 8 };
  const leftHip = { x: hip.x - 18, y: hip.y };
  const rightHip = { x: hip.x + 18, y: hip.y };

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

  drawHand(g, leftArm.end.x, leftArm.end.y, pose.leftArm.handOpen, pose.leftArm.handScale);
  drawHand(g, rightArm.end.x, rightArm.end.y, pose.rightArm.handOpen, pose.rightArm.handScale);

  drawLimb(g, leftHip, pose.leftLeg.hip, 50, pose.leftLeg.knee, 54, 9);
  drawLimb(g, rightHip, pose.rightLeg.hip, 50, pose.rightLeg.knee, 54, 9);

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
        stroke: "#0f172a",
        "stroke-width": 4,
        "stroke-linecap": "round"
      })
    );
  }

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
