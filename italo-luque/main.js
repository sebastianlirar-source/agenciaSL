(function () {
  'use strict';

  // ---- Links de WhatsApp ----
  // Los <a data-wa="mensaje"> usan ese mensaje; los <a data-wa> sin valor usan el mensaje por defecto.
  var WA_NUMBER = '56927298341';
  var WA_DEFAULT = 'Hola Ítalo, vi tu página y quiero información sobre el entrenamiento a domicilio';
  document.querySelectorAll('a[data-wa]').forEach(function (a) {
    var msg = a.getAttribute('data-wa') || WA_DEFAULT;
    a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  });

  // ---- Menú móvil ----
  var btn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu-movil');
  if (btn && menu) {
    var setOpen = function (open) {
      menu.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
  }

  // ---- FAQ: solo una pregunta abierta a la vez ----
  var faqs = document.querySelectorAll('#faq-list details');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      faqs.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });

  // ---- Fade-in al hacer scroll ----
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---- Año del footer ----
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
