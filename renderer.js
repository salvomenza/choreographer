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

function drawLine(group, x1, y1, x2, y2, options = {}) {
  group.appendChild(
    svgEl("line", {
      x1,
      y1,
      x2,
      y2,
      stroke: options.stroke ?? "#0f172a",
      "stroke-width": options.width ?? 8,
      "stroke-linecap": options.cap ?? "round",
      "stroke-linejoin": "round"
    })
  );
}

function drawPath(group, d, options = {}) {
  group.appendChild(
    svgEl("path", {
      d,
      fill: options.fill ?? "none",
      stroke: options.stroke ?? "#0f172a",
      "stroke-width": options.width ?? 4,
      "stroke-linecap": options.cap ?? "round",
      "stroke-linejoin": "round"
    })
  );
}

function drawLimb(group, from, a1, l1, a2, l2, width = 8) {
  const joint = polarPoint(from.x, from.y, l1, a1);
  const end = polarPoint(joint.x, joint.y, l2, a1 + a2);

  drawLine(group, from.x, from.y, joint.x, joint.y, { width });
  drawLine(group, joint.x, joint.y, end.x, end.y, { width });

  return { joint, end, finalAngle: a1 + a2 };
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
    transform: `translate(${x} ${y}) scale(${scale})`,
    fill: "none",
    stroke: "#0f172a",
    "stroke-width": 3,
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });

  hand.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 7 }));

  const fingers = [
    [0, -7, 0, -16],
    [-5, -5, -13, -13],
    [5, -5, 13, -13],
    [-7, 1, -15, -4]
  ];

  for (const [x1, y1, x2, y2] of fingers) {
    hand.appendChild(svgEl("line", { x1, y1, x2, y2 }));
  }

  group.appendChild(hand);
}

function drawFoot(group, ankle, angle, side = 1) {
  const footLength = 22;
  const footAngle = angle + side * 18;
  const toe = polarPoint(ankle.x, ankle.y, footLength, footAngle);

  drawLine(group, ankle.x, ankle.y, toe.x, toe.y, {
    width: 7,
    cap: "round"
  });
}

function drawFace(headGroup, cx, cy, pose) {
  if (pose.eyesClosed) {
    drawLine(headGroup, cx - 12, cy - 4, cx - 4, cy - 4, { width: 3 });
    drawLine(headGroup, cx + 4, cy - 4, cx + 12, cy - 4, { width: 3 });
  } else {
    headGroup.appendChild(
      svgEl("circle", {
        cx: cx - 8,
        cy: cy - 5,
        r: 2.8,
        fill: "#0f172a"
      })
    );

    headGroup.appendChild(
      svgEl("circle", {
        cx: cx + 8,
        cy: cy - 5,
        r: 2.8,
        fill: "#0f172a"
      })
    );
  }

  drawPath(
    headGroup,
    `M ${cx - 8} ${cy + 11} Q ${cx} ${cy + 18} ${cx + 8} ${cy + 11}`,
    { width: 3 }
  );
}

function drawHair(headGroup, cx, cy, pose) {
  const hs = pose.hairSwing ?? 0;

  /*
    Capelli: sempre solo quattro fili 2D.
    Due a sinistra e due a destra, lunghi fino a sotto le spalle / metà schiena.
    Nessuna massa piena.
  */
  const hairPaths = [
    `M ${cx - 18} ${cy - 16}
     C ${cx - 39 - hs} ${cy + 10},
       ${cx - 48 - hs} ${cy + 58},
       ${cx - 36 - hs * 0.45} ${cy + 106}`,

    `M ${cx - 7} ${cy - 23}
     C ${cx - 25 - hs} ${cy + 18},
       ${cx - 30 - hs} ${cy + 74},
       ${cx - 19 - hs * 0.35} ${cy + 124}`,

    `M ${cx + 7} ${cy - 23}
     C ${cx + 25 - hs} ${cy + 18},
       ${cx + 30 - hs} ${cy + 74},
       ${cx + 19 - hs * 0.35} ${cy + 124}`,

    `M ${cx + 18} ${cy - 16}
     C ${cx + 39 - hs} ${cy + 10},
       ${cx + 48 - hs} ${cy + 58},
       ${cx + 36 - hs * 0.45} ${cy + 106}`
  ];

  for (const d of hairPaths) {
    drawPath(headGroup, d, { width: 4 });
  }
}

function renderStickman(stickmanGroup, pose) {
  clearEl(stickmanGroup);

  const rootX = pose.rootX ?? 0;
  const rootY = pose.rootY ?? 0;
  const bodyTilt = pose.bodyTilt ?? 0;
  const headTilt = pose.headTilt ?? 0;
  const headX = pose.headX ?? 0;
  const headY = pose.headY ?? 0;

  const baseX = 210 + rootX;
  const hipY = 260 + rootY;

  const hip = { x: baseX, y: hipY };
  const torsoTop = {
    x: baseX + bodyTilt * 0.25,
    y: hipY - 78
  };

  const neck = {
    x: torsoTop.x,
    y: torsoTop.y - 5
  };

  const headCenter = {
    x: neck.x + headX,
    y: neck.y - 34 + headY
  };

  const leftShoulder = {
    x: torsoTop.x - 30,
    y: torsoTop.y + 5
  };

  const rightShoulder = {
    x: torsoTop.x + 30,
    y: torsoTop.y + 5
  };

  const leftHip = {
    x: hip.x - 18,
    y: hip.y
  };

  const rightHip = {
    x: hip.x + 18,
    y: hip.y
  };

  const mainGroup = svgEl("g", {
    transform: `rotate(${bodyTilt} ${hip.x} ${hip.y})`
  });

  /*
    Ordine di disegno:
    prima capelli posteriori/testa, poi arti, poi busto/testa.
    Per ora teniamo tutto semplice ma più ordinato del renderer minimale.
  */

  // Gambe
  const leftLeg = drawLimb(
    mainGroup,
    leftHip,
    pose.leftLeg?.hip ?? 105,
    50,
    pose.leftLeg?.knee ?? -20,
    54,
    9
  );

  const rightLeg = drawLimb(
    mainGroup,
    rightHip,
    pose.rightLeg?.hip ?? 75,
    50,
    pose.rightLeg?.knee ?? 20,
    54,
    9
  );

  drawFoot(mainGroup, leftLeg.end, leftLeg.finalAngle, -1);
  drawFoot(mainGroup, rightLeg.end, rightLeg.finalAngle, 1);

  // Braccia
  const leftArm = drawLimb(
    mainGroup,
    leftShoulder,
    pose.leftArm?.shoulder ?? -120,
    42,
    pose.leftArm?.elbow ?? 32,
    38,
    8
  );

  const rightArm = drawLimb(
    mainGroup,
    rightShoulder,
    pose.rightArm?.shoulder ?? -60,
    42,
    pose.rightArm?.elbow ?? 32,
    38,
    8
  );

  drawHand(
    mainGroup,
    leftArm.end.x,
    leftArm.end.y,
    pose.leftArm?.handOpen ?? true,
    pose.leftArm?.handScale ?? 1
  );

  drawHand(
    mainGroup,
    rightArm.end.x,
    rightArm.end.y,
    pose.rightArm?.handOpen ?? true,
    pose.rightArm?.handScale ?? 1
  );

  // Busto
  drawLine(mainGroup, neck.x, neck.y, hip.x, hip.y, {
    width: 9
  });

  // Piccolo accenno di spalle, rende il corpo meno “scheletro tecnico”
  drawLine(mainGroup, leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y, {
    width: 7
  });

  // Testa + capelli + faccia
  const headGroup = svgEl("g", {
    transform: `translate(${headCenter.x} ${headCenter.y}) rotate(${headTilt})`
  });

  headGroup.appendChild(
    svgEl("circle", {
      cx: 0,
      cy: 0,
      r: 26,
      fill: "white",
      stroke: "#0f172a",
      "stroke-width": 6
    })
  );

  drawHair(headGroup, 0, 0, pose);
  drawFace(headGroup, 0, 0, pose);

  mainGroup.appendChild(headGroup);
  stickmanGroup.appendChild(mainGroup);
}
