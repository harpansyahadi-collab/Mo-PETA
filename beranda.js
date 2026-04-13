/**
 * ============================================================
 *  Mo-PETA — BERANDA JS
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  initGaleri();
});

// ==========================================
// GALERI SCROLL
// ==========================================

function initGaleri() {
  var scroll = document.getElementById('galeriScroll');
  var dotsContainer = document.getElementById('galeriDots');
  if (!scroll || !dotsContainer) return;

  var items = scroll.querySelectorAll('.galeri-item');
  if (items.length === 0) return;

  // Buat dots
  items.forEach(function (_, i) {
    var dot = document.createElement('div');
    dot.className = 'galeri-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', function () {
      scrollKeIndex(i);
    });
    dotsContainer.appendChild(dot);
  });

  // Update dots saat scroll
  scroll.addEventListener('scroll', updateDots);

  // Auto-scroll setiap 4 detik
  var autoPlay = setInterval(function () {
    var itemLebar = items[0].offsetWidth + 20; // 20 = gap
    var maxScroll = scroll.scrollWidth - scroll.clientWidth;
    if (scroll.scrollLeft >= maxScroll - 10) {
      scroll.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scroll.scrollBy({ left: itemLebar, behavior: 'smooth' });
    }
  }, 4000);

  // Hentikan autoplay saat user menyentuh/klik galeri
  scroll.addEventListener('mousedown', function () { clearInterval(autoPlay); });
  scroll.addEventListener('touchstart', function () { clearInterval(autoPlay); }, { passive: true });
}

function scrollGaleri(arah) {
  var scroll = document.getElementById('galeriScroll');
  if (!scroll) return;
  var lebar = scroll.querySelector('.galeri-item');
  var delta = lebar ? lebar.offsetWidth + 20 : 280;
  scroll.scrollBy({ left: arah * delta, behavior: 'smooth' });
}

function scrollKeIndex(idx) {
  var scroll = document.getElementById('galeriScroll');
  if (!scroll) return;
  var items = scroll.querySelectorAll('.galeri-item');
  if (idx < 0 || idx >= items.length) return;
  var target = items[idx].offsetLeft - scroll.offsetLeft;
  scroll.scrollTo({ left: target, behavior: 'smooth' });
}

function updateDots() {
  var scroll = document.getElementById('galeriScroll');
  var dotsContainer = document.getElementById('galeriDots');
  if (!scroll || !dotsContainer) return;

  var items = scroll.querySelectorAll('.galeri-item');
  var dots = dotsContainer.querySelectorAll('.galeri-dot');
  if (items.length === 0) return;

  var itemLebar = items[0].offsetWidth + 20;
  var aktifIdx = Math.round(scroll.scrollLeft / itemLebar);
  aktifIdx = Math.max(0, Math.min(aktifIdx, dots.length - 1));

  dots.forEach(function (d, i) {
    d.classList.toggle('active', i === aktifIdx);
  });
}
