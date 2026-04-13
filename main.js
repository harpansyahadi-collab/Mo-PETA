/**
 * ============================================================
 *  Mo-PETA — MAIN JS (Shared across all pages)
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  initNavbar();
  updateFooterContacts();
});

// ==========================================
// NAVBAR MOBILE TOGGLE
// ==========================================

function initNavbar() {
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });

    // Tutup menu saat klik link
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
      });
    });

    // Tutup menu saat klik di luar
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('open');
      }
    });
  }
}

// ==========================================
// UPDATE KONTAK FOOTER DARI CONFIG
// ==========================================

function updateFooterContacts() {
  if (typeof CONFIG === 'undefined') return;

  // Update WhatsApp
  const waLinks = document.querySelectorAll('a[href*="wa.me"]');
  waLinks.forEach(function (a) {
    a.href = 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER;
    const strong = a.querySelector('strong');
    if (strong) strong.textContent = CONFIG.WHATSAPP_DISPLAY;
  });

  // Update Instagram
  const igLinks = document.querySelectorAll('a[href*="instagram.com"]');
  igLinks.forEach(function (a) {
    a.href = 'https://instagram.com/' + CONFIG.INSTAGRAM.replace('@', '');
    const strong = a.querySelector('strong');
    if (strong) strong.textContent = CONFIG.INSTAGRAM;
  });
}

// ==========================================
// UTILITY: Salin teks ke clipboard
// ==========================================

function salinTeks(teks, btnEl) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(teks).then(function () {
      tampilPesanSalin(btnEl);
    });
  } else {
    // Fallback lama
    var ta = document.createElement('textarea');
    ta.value = teks;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    tampilPesanSalin(btnEl);
  }
}

function tampilPesanSalin(btnEl) {
  if (!btnEl) return;
  var asliTeks = btnEl.textContent;
  btnEl.textContent = '✓ Tersalin!';
  btnEl.style.background = 'var(--primary)';
  btnEl.style.color = 'white';
  setTimeout(function () {
    btnEl.textContent = asliTeks;
    btnEl.style.background = '';
    btnEl.style.color = '';
  }, 2000);
}

// ==========================================
// UTILITY: Format tanggal
// ==========================================

function formatTanggal(isoString) {
  if (!isoString) return '-';
  var d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==========================================
// UTILITY: Generate ID Pesanan
// ==========================================

function generateIdPesanan() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var result = '';
  for (var i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'PETA-' + result;
}

// ==========================================
// UTILITY: Get progress percentage berdasarkan status
// ==========================================

function getProgressPersen(status) {
  var map = {
    'Menunggu Konfirmasi': 10,
    'Dikonfirmasi': 25,
    'Sedang Diproses': 55,
    'Revisi': 75,
    'Selesai': 100,
  };
  return map[status] || 10;
}

function getStatusClass(status) {
  var map = {
    'Menunggu Konfirmasi': 'status-menunggu',
    'Dikonfirmasi': 'status-proses',
    'Sedang Diproses': 'status-proses',
    'Revisi': 'status-revisi',
    'Selesai': 'status-selesai',
  };
  return map[status] || 'status-menunggu';
}

// ==========================================
// CALL API (APPS SCRIPT)
// ==========================================

function callApi(params, callback) {
  if (!IS_CONFIG_READY) {
    callback({ ok: false, error: 'URL Spreadsheet belum dikonfigurasi.' });
    return;
  }

  var url = CONFIG.SPREADSHEET_API_URL + '?' + objectToQuery(params);

  fetch(url)
    .then(function (res) { return res.json(); })
    .then(function (data) { callback({ ok: true, data: data }); })
    .catch(function (err) {
      callback({ ok: false, error: 'Gagal menghubungi server. Pastikan URL Apps Script sudah benar.' });
    });
}

function callApiPost(payload, callback) {
  if (!IS_CONFIG_READY) {
    callback({ ok: false, error: 'URL Spreadsheet belum dikonfigurasi.' });
    return;
  }

  fetch(CONFIG.SPREADSHEET_API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) { callback({ ok: true, data: data }); })
    .catch(function (err) {
      callback({ ok: false, error: 'Gagal menghubungi server. Periksa URL Apps Script Anda.' });
    });
}

function objectToQuery(obj) {
  return Object.keys(obj)
    .map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
    })
    .join('&');
}
