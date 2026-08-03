/**
 * Builds a wireframe polyhedron: vertices scaled to `radius`, edges derived
 * from the shortest inter-vertex distance (works for any regular solid).
 */
function buildPolyhedron(rawVertices, radius) {
  const vertices = rawVertices.map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    return [(x / len) * radius, (y / len) * radius, (z / len) * radius];
  });

  let minDistSq = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const [ax, ay, az] = vertices[i];
      const [bx, by, bz] = vertices[j];
      const d = (ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2;
      if (d < minDistSq) minDistSq = d;
    }
  }

  const edges = [];
  const threshold = minDistSq * 1.01;
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const [ax, ay, az] = vertices[i];
      const [bx, by, bz] = vertices[j];
      const d = (ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2;
      if (d <= threshold) edges.push([i, j]);
    }
  }

  return { vertices, edges };
}

function icosahedronVertices() {
  const t = (1 + Math.sqrt(5)) / 2;
  return [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
}

function cubeVertices() {
  const pts = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) pts.push([x, y, z]);
  return pts;
}

function tetrahedronVertices() {
  return [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
}

function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let frameId = null;
  let lastTime = 0;

  const shapes = [
    {
      shape: buildPolyhedron(icosahedronVertices(), 1),
      offset: [0, -0.02, 0],
      radiusFactor: 0.3,
      angle: [0.4, 0.2],
      speed: [0.12, 0.18],
      color: '79, 123, 255',
      lineWidth: 1.3,
      glow: 12,
    },
    {
      shape: buildPolyhedron(cubeVertices(), 1),
      offset: [0.62, -0.52, -0.35],
      radiusFactor: 0.115,
      angle: [0.9, 1.4],
      speed: [0.32, -0.24],
      color: '155, 92, 255',
      lineWidth: 1.1,
      glow: 9,
    },
    {
      shape: buildPolyhedron(tetrahedronVertices(), 1),
      offset: [-0.6, -0.6, -0.4],
      radiusFactor: 0.1,
      angle: [1.6, 0.3],
      speed: [-0.26, 0.34],
      color: '61, 255, 192',
      lineWidth: 1.1,
      glow: 9,
    },
  ];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rotate([x, y, z], ax, ay) {
    let cy = Math.cos(ay), sy = Math.sin(ay);
    let x1 = x * cy + z * sy;
    let z1 = -x * sy + z * cy;
    let cx = Math.cos(ax), sx = Math.sin(ax);
    let y1 = y * cx - z1 * sx;
    let z2 = y * sx + z1 * cx;
    return [x1, y1, z2];
  }

  function drawShape(entry) {
    const focal = Math.min(width, height) * 1.15;
    const size = Math.min(width, height);
    const cx = width / 2 + entry.offset[0] * size * 0.42;
    const cy = height / 2 + entry.offset[1] * size * 0.42;
    const cz = entry.offset[2] * size * 0.42;
    const radius = size * entry.radiusFactor;

    const projected = entry.shape.vertices.map((v) => {
      const rotated = rotate(v, entry.angle[0], entry.angle[1]);
      const z = rotated[2] * radius + cz;
      const scale = focal / (focal + z + focal * 0.55);
      return {
        x: cx + rotated[0] * radius * scale,
        y: cy + rotated[1] * radius * scale,
        scale,
      };
    });

    ctx.lineWidth = entry.lineWidth;
    ctx.shadowBlur = entry.glow;
    ctx.shadowColor = `rgba(${entry.color}, 0.9)`;
    entry.shape.edges.forEach(([a, b]) => {
      const pa = projected[a];
      const pb = projected[b];
      const avgScale = (pa.scale + pb.scale) / 2;
      ctx.strokeStyle = `rgba(${entry.color}, ${Math.min(avgScale * 0.85, 0.95)})`;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
  }

  function draw(dt) {
    ctx.clearRect(0, 0, width, height);
    shapes.forEach((entry) => {
      entry.angle[0] += entry.speed[0] * dt;
      entry.angle[1] += entry.speed[1] * dt;
      drawShape(entry);
    });
  }

  function loop(time) {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    draw(dt);
    frameId = requestAnimationFrame(loop);
  }

  resize();

  if (prefersReduced) {
    draw(0);
  } else {
    frameId = requestAnimationFrame(loop);
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resize();
      if (prefersReduced) draw(0);
    }, 150);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();

  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  const contactForm = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  const yearEl = document.getElementById('year');

  yearEl.textContent = new Date().getFullYear();

  // Header background on scroll
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu toggle
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuToggle.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Fade-in on scroll
  const fadeEls = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach((el) => observer.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Contact form (submits to Formspree)
  const submitBtn = contactForm.querySelector('.form__submit');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();

    if (!contactForm.checkValidity()) {
      formNote.textContent = 'Por favor completa todos los campos correctamente.';
      formNote.style.color = '#ff7676';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    formNote.style.color = '';
    formNote.textContent = '';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        formNote.textContent = `¡Gracias${name ? ', ' + name : ''}! Recibimos tu mensaje y te contactaremos pronto.`;
        contactForm.reset();
      } else {
        formNote.style.color = '#ff7676';
        formNote.textContent = 'No pudimos enviar tu mensaje. Intenta nuevamente o escríbenos directo por email.';
      }
    } catch (err) {
      formNote.style.color = '#ff7676';
      formNote.textContent = 'Error de conexión. Intenta nuevamente en unos minutos.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensaje';
    }
  });
});
