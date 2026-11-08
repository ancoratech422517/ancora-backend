import { useEffect, useRef } from "react";

const random = (min, max) => min + Math.random() * (max - min);
const TAU = Math.PI * 2;

function createParticles(count, width, height, options = {}) {
  return Array.from({ length: count }, () => ({
    x: random(0, width),
    y: random(0, height),
    vx: random(options.minSpeed ?? -20, options.maxSpeed ?? 20),
    vy: random(options.minSpeed ?? -20, options.maxSpeed ?? 20),
    radius: random(options.minRadius ?? 1, options.maxRadius ?? 3),
    phase: random(0, TAU),
    hue: random(0, 360),
  }));
}

function drawScene(ctx, sceneId, width, height, time, delta, state) {
  const { particles } = state;
  const gradient = (top, bottom) => {
    const fill = ctx.createLinearGradient(0, 0, 0, height);
    fill.addColorStop(0, top);
    fill.addColorStop(1, bottom);
    return fill;
  };

  if (sceneId === "matrix") {
    ctx.fillStyle = "rgba(2, 10, 4, .18)";
    ctx.fillRect(0, 0, width, height);
    ctx.font = "15px ui-monospace, monospace";
    for (const drop of particles) {
      drop.y += (45 + drop.radius * 32) * delta;
      if (drop.y > height + 20) drop.y = random(-height * 0.4, 0);
      ctx.fillStyle = `rgba(109, 255, 160, ${0.35 + (Math.sin(time * 2 + drop.phase) + 1) * 0.3})`;
      ctx.fillText("アイウエオカキクケコサシスセソ0123456789"[Math.floor(drop.phase * 100) % 25], drop.x, drop.y);
    }
    return;
  }

  if (sceneId === "oceano") {
    ctx.fillStyle = gradient("#211847", "#10153a");
    ctx.fillRect(0, 0, width, height);
    const horizon = height * 0.48;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#27204e");
    sky.addColorStop(0.7, "#a34778");
    sky.addColorStop(1, "#ff9a5a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, horizon);
    const glow = ctx.createRadialGradient(width / 2, horizon, 0, width / 2, horizon, width * 0.55);
    glow.addColorStop(0, "rgba(255, 230, 160, .75)");
    glow.addColorStop(1, "rgba(255, 120, 80, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
    for (let layer = 0; layer < 5; layer += 1) {
      const base = horizon + (height - horizon) * (0.12 + layer * 0.18);
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 8) {
        ctx.lineTo(x, base + Math.sin(x * 0.018 + time * (0.8 + layer * 0.18)) * (3 + layer * 2));
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = `rgba(20, 15, 55, ${0.2 + layer * 0.09})`;
      ctx.fill();
    }
    return;
  }

  if (sceneId === "tempestade") {
    ctx.fillStyle = gradient("#070b16", "#1a2440");
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(190, 215, 255, .48)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const drop of particles) {
      drop.y += random(360, 540) * delta;
      drop.x -= 100 * delta;
      if (drop.y > height) {
        drop.y = random(-80, 0);
        drop.x = random(0, width);
      }
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + 5, drop.y - 14);
    }
    ctx.stroke();
    if (Math.sin(time * 0.7) > 0.995) {
      ctx.strokeStyle = "rgba(235, 244, 255, .95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      let x = random(width * 0.2, width * 0.8);
      ctx.moveTo(x, 0);
      for (let y = 0; y < height * 0.58; y += 24) {
        x += random(-18, 18);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return;
  }

  if (sceneId === "aurora") {
    ctx.fillStyle = gradient("#030812", "#0a1a2e");
    ctx.fillRect(0, 0, width, height);
    for (let band = 0; band < 3; band += 1) {
      const color = ["34, 255, 160", "58, 184, 255", "179, 107, 255"][band];
      ctx.beginPath();
      for (let x = 0; x <= width; x += 5) {
        const y = height * (0.28 + band * 0.08) +
          Math.sin(x * 0.012 + time * 0.5 + band) * height * 0.08;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${color}, .45)`;
      ctx.lineWidth = Math.max(12, height * 0.08);
      ctx.shadowColor = `rgba(${color}, .85)`;
      ctx.shadowBlur = 28;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    return;
  }

  if (sceneId === "lava") {
    ctx.fillStyle = gradient("#1c0a38", "#3d0f4f");
    ctx.fillRect(0, 0, width, height);
    for (const blob of particles) {
      blob.x += blob.vx * delta;
      blob.y += blob.vy * delta;
      if (blob.x < -width * 0.2 || blob.x > width * 1.2) blob.vx *= -1;
      if (blob.y < -height * 0.2 || blob.y > height * 1.2) blob.vy *= -1;
      const glow = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius * 48);
      glow.addColorStop(0, `hsla(${blob.hue}, 95%, 60%, .42)`);
      glow.addColorStop(1, `hsla(${blob.hue}, 95%, 60%, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(blob.x - blob.radius * 48, blob.y - blob.radius * 48, blob.radius * 96, blob.radius * 96);
    }
    return;
  }

  ctx.fillStyle = sceneId === "vagalumes"
    ? gradient("#03100c", "#0c2e1e")
    : sceneId === "fogo-de-artificio"
      ? "rgba(5, 7, 20, .22)"
      : sceneId === "neve"
        ? gradient("#0c1c34", "#2d5580")
        : sceneId === "warp"
          ? "rgba(4, 6, 26, .3)"
          : gradient("#0a1030", "#14224a");
  ctx.fillRect(0, 0, width, height);

  if (sceneId === "warp") {
    const cx = width / 2;
    const cy = height / 2;
    ctx.lineWidth = 1;
    for (const star of particles) {
      star.radius += delta * 0.22;
      if (star.radius > 1) {
        star.x = random(-1, 1);
        star.y = random(-1, 1);
        star.radius = 0.04;
      }
      const scale = Math.min(width, height) * 0.45;
      const from = Math.max(0, star.radius - delta * 0.18);
      ctx.strokeStyle = `rgba(210, 230, 255, ${Math.min(0.9, star.radius)})`;
      ctx.beginPath();
      ctx.moveTo(cx + star.x * scale * from, cy + star.y * scale * from);
      ctx.lineTo(cx + star.x * scale * star.radius, cy + star.y * scale * star.radius);
      ctx.stroke();
    }
    return;
  }

  if (sceneId === "rede") {
    for (const point of particles) {
      point.x += point.vx * delta;
      point.y += point.vy * delta;
      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const first = particles[i];
        const second = particles[j];
        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        if (distance < 110) {
          ctx.strokeStyle = `rgba(110, 168, 255, ${(1 - distance / 110) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(first.x, first.y);
          ctx.lineTo(second.x, second.y);
          ctx.stroke();
        }
      }
    }
    ctx.fillStyle = "#b9d5ff";
    for (const point of particles) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.8, 0, TAU);
      ctx.fill();
    }
    return;
  }

  if (sceneId === "fogo-de-artificio") {
    state.spawn -= delta;
    if (state.spawn <= 0) {
      state.spawn = random(0.75, 1.5);
      const hue = random(0, 360);
      for (let index = 0; index < 64; index += 1) {
        const angle = (index / 64) * TAU;
        const speed = random(35, 155);
        state.bursts.push({
          x: random(width * 0.15, width * 0.85),
          y: random(height * 0.15, height * 0.48),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          hue: hue + random(-18, 18),
        });
      }
    }
    for (let index = state.bursts.length - 1; index >= 0; index -= 1) {
      const particle = state.bursts[index];
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 60 * delta;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.life -= delta * 0.55;
      if (particle.life <= 0) {
        state.bursts.splice(index, 1);
        continue;
      }
      ctx.fillStyle = `hsla(${particle.hue}, 100%, 70%, ${particle.life})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, TAU);
      ctx.fill();
    }
    return;
  }

  ctx.globalCompositeOperation = sceneId === "vagalumes" ? "lighter" : "source-over";
  for (const point of particles) {
    point.x += point.vx * delta;
    point.y += point.vy * delta;
    if (point.x < -10) point.x = width + 10;
    if (point.x > width + 10) point.x = -10;
    if (point.y < -10) point.y = height + 10;
    if (point.y > height + 10) point.y = -10;
    const alpha = sceneId === "vagalumes"
      ? 0.4 + (Math.sin(time * 2 + point.phase) + 1) * 0.28
      : 0.35 + (Math.sin(time + point.phase) + 1) * 0.3;
    ctx.fillStyle = sceneId === "neve"
      ? `rgba(255,255,255,${alpha})`
      : `rgba(255,235,130,${alpha})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.radius, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

export default function AnimatedChatBackground({ sceneId, paused = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !container || !context) {
      console.error("Não foi possível iniciar o fundo animado do chat.");
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId;
    let lastFrame = 0;
    let elapsed = 0;
    let width = 0;
    let height = 0;
    let state = { particles: [], bursts: [], spawn: 0 };

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const particleCount = sceneId === "matrix"
        ? Math.ceil(width / 15)
        : sceneId === "rede"
          ? Math.min(95, Math.round(width * height / 6500))
          : sceneId === "neve"
            ? 110
            : sceneId === "warp"
              ? 180
              : sceneId === "vagalumes"
                ? 55
                : sceneId === "lava"
                  ? 8
                  : 0;
      state = {
        particles: createParticles(particleCount, width, height, {
          minRadius: sceneId === "lava" ? 0.18 : 1,
          maxRadius: sceneId === "lava" ? 0.32 : 3,
          minSpeed: sceneId === "lava" ? -22 : -18,
          maxSpeed: sceneId === "lava" ? 22 : 18,
        }),
        bursts: [],
        spawn: 0.3,
      };
      context.clearRect(0, 0, width, height);
      drawScene(context, sceneId, width, height, 0, 0, state);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const render = (timestamp) => {
      if (paused || reduceMotion) return;
      const delta = Math.min((timestamp - (lastFrame || timestamp)) / 1000, 0.05);
      lastFrame = timestamp;
      elapsed += delta;
      drawScene(context, sceneId, width, height, elapsed, delta, state);
      frameId = requestAnimationFrame(render);
    };
    if (!paused && !reduceMotion) frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [sceneId, paused]);

  return <canvas ref={canvasRef} className="animated-chat-background" aria-hidden="true" />;
}
