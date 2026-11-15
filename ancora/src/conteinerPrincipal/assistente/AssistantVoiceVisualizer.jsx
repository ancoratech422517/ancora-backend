import { useEffect, useRef } from "react";

const SPHERE_POINTS = Array.from({ length: 1400 }, (_, index) => {
  const y = 1 - (2 * (index + 0.5)) / 1400;
  const radius = Math.sqrt(1 - y * y);
  const angle = index * 2.39996;
  return {
    x: Math.cos(angle) * radius,
    y,
    z: Math.sin(angle) * radius,
    k: (index * 0.61803398875) % 1,
    lat: Math.asin(y),
    lon: angle,
  };
});

function drawSphere(context, centerX, centerY, radius, level, time, styleIndex, accent, accentLight) {
  const options = [
    {
      n: 700,
      v: 0.5,
      f: (point) => 1 + level * 0.35 * Math.sin(point.y * 6 + time * 5),
      d: (x, y, depth) => {
        context.globalAlpha = 0.2 + 0.8 * depth;
        context.beginPath();
        context.arc(x, y, 1 + depth * 1.6 + level, 0, Math.PI * 2);
        context.fill();
      },
    },
    {
      n: 1400,
      v: 0.35,
      f: (point) => Math.abs(Math.sin(point.lat * 6)) < 0.07
        ? 1 + level * 0.22 * Math.sin(point.lat * 10 - time * 8)
        : 0,
      d: (x, y, depth) => {
        context.globalAlpha = 0.25 + 0.75 * depth;
        context.beginPath();
        context.arc(x, y, 0.9 + depth * 1.3, 0, Math.PI * 2);
        context.fill();
      },
    },
    {
      n: 300,
      v: 0.4,
      f: () => 1,
      d: (x, y, depth, index, point, dx, dy) => {
        const length = radius * (0.05 + level * 0.55 * Math.abs(Math.sin(index * 1.7 + time * 7)) * (0.4 + depth));
        const magnitude = Math.hypot(dx, dy) || 1;
        context.globalAlpha = 0.3 + 0.7 * depth;
        context.lineWidth = 1.6;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + (dx / magnitude) * length, y + (dy / magnitude) * length);
        context.stroke();
      },
    },
    {
      n: 1400,
      v: 0.3,
      f: (point) => (
        Math.abs(Math.sin(point.lat * 6)) < 0.05 ||
        Math.abs(Math.sin(point.lon * 3)) < 0.05
      ) ? 1 + level * 0.15 * Math.sin(time * 6 + point.lat * 4) : 0,
      d: (x, y, depth) => {
        context.globalAlpha = 0.25 + 0.75 * depth;
        context.beginPath();
        context.arc(x, y, 1 + depth * 1.2 + level, 0, Math.PI * 2);
        context.fill();
      },
    },
    {
      n: 320,
      v: 0.35,
      f: (point, index) => 1 + level * 0.22 * Math.sin(time * 8 + index),
      d: (x, y, depth, index, point) => {
        const glyphs = "01{}<>/#";
        context.font = `${8 + depth * 8 + level * 6}px monospace`;
        context.textAlign = "center";
        context.globalAlpha = 0.25 + 0.75 * depth;
        context.fillText(
          glyphs[Math.floor(point.k * glyphs.length + time * 3 * (0.4 + point.k)) % glyphs.length],
          x,
          y,
        );
      },
    },
    {
      n: 90,
      v: 0.3,
      sort: true,
      f: (point, index) => 1 + level * 0.3 * Math.sin(time * 4 + index),
      d: (x, y, depth, index, point) => {
        const dotRadius = (5 + point.k * 9) * (0.6 + depth * 0.6) * (1 + level * 0.5);
        context.globalAlpha = 0.18;
        context.beginPath();
        context.arc(x, y, dotRadius, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 0.4 + 0.6 * depth;
        context.beginPath();
        context.arc(x, y, dotRadius, 0, Math.PI * 2);
        context.stroke();
      },
    },
    {
      n: 230,
      v: 0.4,
      f: (point, index) => 1 + level * 0.3 * Math.sin(index + time * 6),
      d: (x, y, depth, index, point) => {
        const twinkle = (0.5 + 0.5 * Math.sin(time * 4 * (0.5 + point.k) + index)) * (1 + level * 1.5);
        const size = 1.5 + twinkle * 3.5 * (0.5 + depth);
        context.globalAlpha = 0.2 + 0.8 * depth * twinkle / (1 + level * 1.5);
        context.beginPath();
        context.moveTo(x - size, y);
        context.lineTo(x + size, y);
        context.moveTo(x, y - size);
        context.lineTo(x, y + size);
        context.stroke();
      },
    },
    {
      n: 520,
      v: 0.25,
      f: (point, index) => 1 + level * 0.7 * Math.pow(0.5 + 0.5 * Math.sin(index * 12.9 + time * 6), 2),
      d: (x, y, depth) => {
        context.globalAlpha = 0.25 + 0.75 * depth;
        context.beginPath();
        context.arc(x, y, 1.2 + depth * 1.8, 0, Math.PI * 2);
        context.fill();
      },
    },
    {
      n: 70,
      v: 0.3,
      sort: true,
      f: (point, index) => 1 + level * 0.25 * Math.sin(time * 5 + index),
      d: (x, y, depth) => {
        const dotRadius = (9 + depth * 10) * (1 + level * 0.5);
        const gradient = context.createRadialGradient(
          x - dotRadius * 0.3,
          y - dotRadius * 0.3,
          dotRadius * 0.1,
          x,
          y,
          dotRadius,
        );
        gradient.addColorStop(0, accentLight);
        gradient.addColorStop(1, accent);
        context.fillStyle = gradient;
        context.globalAlpha = 0.55 + 0.45 * depth;
        context.beginPath();
        context.arc(x, y, dotRadius, 0, Math.PI * 2);
        context.fill();
      },
    },
    {
      n: 170,
      v: 0.3,
      sort: true,
      f: (point, index) => 1 + level * 0.3 * Math.sin(time * 4 + index),
      d: (x, y, depth, index, point, dx, dy) => {
        const angle = Math.atan2(dy, dx);
        context.fillStyle = index % 2 ? accent : accentLight;
        context.globalAlpha = 0.35 + 0.55 * depth;
        context.beginPath();
        context.ellipse(
          x,
          y,
          (6 + point.k * 5) * (0.6 + depth * 0.6) * (1 + level * 0.4),
          (3 + point.k * 2) * (0.6 + depth * 0.6),
          angle,
          0,
          Math.PI * 2,
        );
        context.fill();
      },
    },
  ];

  const style = options[styleIndex] || options[0];
  const rotationY = time * style.v;
  const rotationX = 0.45;
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  const step = Math.max(1, (SPHERE_POINTS.length / style.n) | 0);
  const points = [];

  for (let sourceIndex = 0, index = 0; index < SPHERE_POINTS.length; sourceIndex += 1, index += step) {
    const point = SPHERE_POINTS[index];
    const modifier = style.f(point, sourceIndex);
    if (!modifier) continue;

    const rotatedX = point.x * cosY + point.z * sinY;
    const rotatedZ = -point.x * sinY + point.z * cosY;
    const rotatedY = point.y * cosX - rotatedZ * sinX;
    const depthZ = point.y * sinX + rotatedZ * cosX;
    const depth = (depthZ + 1) / 2;
    const scale = modifier * radius * (0.8 + 0.3 * depth);
    points.push({
      x: centerX + rotatedX * scale,
      y: centerY + rotatedY * scale,
      depth,
      index: sourceIndex,
      point,
      dx: rotatedX,
      dy: rotatedY,
    });
  }

  if (style.sort) points.sort((first, second) => first.depth - second.depth);
  points.forEach((point) => {
    style.d(point.x, point.y, point.depth, point.index, point.point, point.dx, point.dy);
  });
}

export default function AssistantVoiceVisualizer({ styleIndex = 0, active = false, pulse = 0 }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  const pulseRef = useRef(pulse);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    pulseRef.current = pulse;
  }, [pulse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let width = 0;
    let height = 0;
    let frame = 0;
    let level = 0;
    let impulse = 0;
    let lastPulse = pulseRef.current;
    let accent = "#0f9f92";
    let accentLight = "#66d9c8";

    const readThemeColors = () => {
      const styles = getComputedStyle(canvas);
      accent = styles.getPropertyValue("--assistant-accent").trim() || "#0f9f92";
      accentLight = styles.getPropertyValue("--assistant-accent-light").trim() || "#66d9c8";
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(resize);
    if (resizeObserver) {
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }
    const themeObserver = new MutationObserver(readThemeColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    readThemeColors();
    resize();

    const draw = (timestamp) => {
      const time = timestamp / 1000;
      if (pulseRef.current !== lastPulse) {
        impulse = 1;
        lastPulse = pulseRef.current;
      }
      const target = activeRef.current
        ? 0.3 + 0.3 * (Math.sin(time * 9) * 0.5 + 0.5) + impulse * 0.4
        : 0.04 + 0.03 * Math.sin(time * 2);
      level += (target - level) * 0.15;
      impulse *= 0.9;

      context.clearRect(0, 0, width, height);
      if (width > 0 && height > 0) {
        context.save();
        context.fillStyle = accent;
        context.strokeStyle = accent;
        context.shadowColor = accent;
        context.shadowBlur = styleIndex === 0 || styleIndex === 6 ? 10 : 0;
        drawSphere(
          context,
          width / 2,
          height / 2,
          Math.min(width, height) * 0.26,
          Math.min(1, level * 1.4),
          time,
          styleIndex,
          accent,
          accentLight,
        );
        context.restore();
      }
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      themeObserver.disconnect();
    };
  }, [styleIndex]);

  return <canvas ref={canvasRef} className="assistantVoiceCanvas" aria-hidden="true" />;
}
