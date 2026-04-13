/**
 * ============================================================
 *  Mo-PETA — ADMIN JS
 * ============================================================
 *
 *  Akses admin melalui: admin.html?kode=KODE_ADMIN_ANDA
 *  atau masukkan kode di form login yang muncul.
 *
 * ============================================================
 */

var semuaPesanan = [];
var idEditSedang = null;

// ==========================================
// INISIALISASI
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
  // Buat overlay sidebar untuk mobile
  var overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebarOverlay';
  overlay.addEventListener('click', tutupSidebar);
  document.body.appendChild(overlay);

  // Cek apakah ada kode di URL
  var params = new URLSearchParams(window.location.search);
  var kodeUrl = params.get('kode');

  if (kodeUrl) {
    if (verifikasiKode(kodeUrl)) {
      tampilPanelAdmin();
    } else {
      tampilScreenLogin();
      tampilErrorLogin();
    }
  } else {
    tampilScreenLogin();
  }
});

// ==========================================
// AUTENTIKASI
// ==========================================

function verifikasiKode(kode) {
  if (typeof CONFIG === 'undefined') return false;
  return kode === CONFIG.ADMIN_CODE;
}

function loginAdmin() {
  var input = document.getElementById('inputKodeLogin').value;
  var errorEl = document.getElementById('errorLogin');

  errorEl.style.display = 'none';

  if (verifikasiKode(input)) {
    tampilPanelAdmin();
  } else {
    errorEl.style.display = 'block';
    document.getElementById('inputKodeLogin').value = '';
    document.getElementById('inputKodeLogin').focus();
  }
}

function logout() {
  if (!confirm('Yakin ingin keluar dari panel admin?')) return;
  document.getElementById('screenAdmin').style.display = 'none';
  document.getElementById('screenLogin').style.display = 'flex';
  document.getElementById('inputKodeLogin').value = '';
  document.getElementById('errorLogin').style.display = 'none';
  // Hapus kode dari URL tanpa reload halaman
  window.history.replaceState({}, document.title, window.location.pathname);
}

function tampilScreenLogin() {
  document.getElementById('screenLogin').style.display = 'flex';
  document.getElementById('screenAdmin').style.display = 'none';
}

function tampilErrorLogin() {
  var errorEl = document.getElementById('errorLogin');
  errorEl.style.display = 'block';
}

function tampilPanelAdmin() {
  document.getElementById('screenLogin').style.display = 'none';
  document.getElementById('screenAdmin').style.display = 'flex';
  muatSemuaPesanan();
}

// ==========================================
// NAVIGASI TAB
// ==========================================

function gantiTab(nama, elLink) {
  // Sembunyikan semua tab
  document.querySelectorAll('.admin-tab').forEach(function (el) {
    el.style.display = 'none';
  });

  // Hapus active dari semua link
  document.querySelectorAll('.sidebar-link').forEach(function (el) {
    el.classList.remove('active');
  });

  // Tampilkan tab yang dipilih
  var tabEl = document.getElementById('tab' + capitalizeFirst(nama));
  if (tabEl) tabEl.style.display = 'block';

  // Set active link
  if (elLink) elLink.classList.add('active');

  // Update title topbar
  var titles = {
    dashboard: 'Dashboard',
    pesanan: 'Daftar Pesanan',
  };
  document.getElementById('topbarTitle').textContent = titles[nama] || nama;

  // Tutup sidebar di mobile
  tutupSidebar();

  return false;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// SIDEBAR MOBILE
// ==========================================

function bukaSidebar() {
  document.getElementById('adminSidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('active');
}

function tutupSidebar() {
  document.getElementById('adminSidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// ==========================================
// MUAT DATA PESANAN
// ==========================================

function refreshData() {
  var tabPesanan = document.getElementById('tabPesanan');
  var tabDashboard = document.getElementById('tabDashboard');
  var sedangPesanan = tabPesanan && tabPesanan.style.display !== 'none';

  document.getElementById('tabelTerbaru').innerHTML = '<div class="loading-admin">⏳ Memuat data...</div>';
  document.getElementById('tabelPesanan').innerHTML = '<div class="loading-admin">⏳ Memuat data...</div>';

  muatSemuaPesanan();
}

function muatSemuaPesanan() {
  if (!IS_CONFIG_READY) {
    // Mode demo — tampilkan data dari localStorage
    var lokal = [];
    try {
      lokal = JSON.parse(localStorage.getItem('mopeta_riwayat') || '[]');
    } catch (e) {}

    if (lokal.length === 0) {
      lokal = contohDataDemo();
    }

    semuaPesanan = lokal;
    renderSemua();
    return;
  }

  callApi({ action: 'semuaPesanan', adminCode: CONFIG.ADMIN_CODE }, function (result) {
    if (result.ok && result.data && result.data.pesanan) {
      semuaPesanan = result.data.pesanan;
    } else {
      semuaPesanan = [];
    }
    renderSemua();
  });
}

function renderSemua() {
  renderStats();
  renderTabelTerbaru();
  renderTabelPesanan(semuaPesanan);
}

// ==========================================
// STATS
// ==========================================

function renderStats() {
  var total = semuaPesanan.length;
  var menunggu = semuaPesanan.filter(function (p) { return p.status === 'Menunggu Konfirmasi'; }).length;
  var proses = semuaPesanan.filter(function (p) {
    return p.status === 'Dikonfirmasi' || p.status === 'Sedang Diproses' || p.status === 'Revisi';
  }).length;
  var selesai = semuaPesanan.filter(function (p) { return p.status === 'Selesai'; }).length;

  animasiAngka('statTotal', total);
  animasiAngka('statMenunggu', menunggu);
  animasiAngka('statProses', proses);
  animasiAngka('statSelesai', selesai);
}

function animasiAngka(elId, targetAngka) {
  var el = document.getElementById(elId);
  if (!el) return;
  var mulai = 0;
  var durasi = 600;
  var interval = 16;
  var langkah = Math.ceil(targetAngka / (durasi / interval));
  var timer = setInterval(function () {
    mulai += langkah;
    if (mulai >= targetAngka) {
      mulai = targetAngka;
      clearInterval(timer);
    }
    el.textContent = mulai;
  }, interval);
}

// ==========================================
// TABEL TERBARU (dashboard)
// ==========================================

function renderTabelTerbaru() {
  var container = document.getElementById('tabelTerbaru');
  if (!container) return;

  var terbaru = semuaPesanan.slice(0, 8);

  if (terbaru.length === 0) {
    container.innerHTML = renderEmptyState('Belum ada pesanan masuk.');
    return;
  }

  container.innerHTML = renderTabel(terbaru, false);
}

// ==========================================
// TABEL SEMUA PESANAN (tab pesanan)
// ==========================================

function renderTabelPesanan(data) {
  var container = document.getElementById('tabelPesanan');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = renderEmptyState('Tidak ada pesanan yang sesuai filter.');
    return;
  }

  container.innerHTML = renderTabel(data, true);
}

function renderTabel(data, tampilkanSemua) {
  var baris = data.map(function (p) {
    var statusClass = getAdminStatusClass(p.status);
    return (
      '<tr>' +
        '<td class="td-id">' + escHtml(p.idPesanan) + '</td>' +
        '<td class="td-nama">' + escHtml(p.nama) + '</td>' +
        '<td>' + escHtml(p.nim) + '</td>' +
        '<td>' + escHtml(p.jenisPeta) + '</td>' +
        '<td class="td-detail" title="' + escHtml(p.prodi) + '">' + escHtml(p.prodi) + '</td>' +
        '<td class="td-waktu">' + formatTanggal(p.waktu) + '</td>' +
        '<td><span class="status-badge ' + statusClass + '">' + escHtml(p.status || 'Menunggu Konfirmasi') + '</span></td>' +
        '<td class="td-aksi">' +
          '<button class="btn-update" onclick="bukaModalUpdate(' + escAttr(JSON.stringify(p)) + ')">✏️ Update</button>' +
        '</td>' +
      '</tr>'
    );
  }).join('');

  return (
    '<div class="tabel-scroll">' +
    '<table class="admin-tabel">' +
      '<thead><tr>' +
        '<th>ID Pesanan</th>' +
        '<th>Nama</th>' +
        '<th>NIM</th>' +
        '<th>Jenis Peta</th>' +
        '<th>Program Studi</th>' +
        '<th>Tanggal</th>' +
        '<th>Status</th>' +
        '<th>Aksi</th>' +
      '</tr></thead>' +
      '<tbody>' + baris + '</tbody>' +
    '</table>' +
    '</div>'
  );
}

function renderEmptyState(pesan) {
  return (
    '<div class="tabel-empty">' +
      '<div class="empty-icon">📭</div>' +
      '<div>' + escHtml(pesan) + '</div>' +
    '</div>'
  );
}

function getAdminStatusClass(status) {
  var map = {
    'Menunggu Konfirmasi': 'status-menunggu',
    'Dikonfirmasi': 'status-konfirmasi',
    'Sedang Diproses': 'status-proses',
    'Revisi': 'status-revisi',
    'Selesai': 'status-selesai',
  };
  return map[status] || 'status-menunggu';
}

// ==========================================
// FILTER PESANAN
// ==========================================

function filterPesanan() {
  var cari = document.getElementById('inputCari').value.toLowerCase().trim();
  var filterStatus = document.getElementById('filterStatus').value;

  var filtered = semuaPesanan.filter(function (p) {
    var cocokCari = !cari ||
      (p.nama && p.nama.toLowerCase().includes(cari)) ||
      (p.nim && p.nim.toLowerCase().includes(cari)) ||
      (p.idPesanan && p.idPesanan.toLowerCase().includes(cari)) ||
      (p.prodi && p.prodi.toLowerCase().includes(cari));

    var cocokStatus = !filterStatus || p.status === filterStatus;

    return cocokCari && cocokStatus;
  });

  renderTabelPesanan(filtered);
}

// ==========================================
// MODAL UPDATE STATUS
// ==========================================

function bukaModalUpdate(dataStr) {
  var d;
  try {
    d = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
  } catch (e) { return; }

  idEditSedang = d.idPesanan;

  var info = document.getElementById('modalUpdateInfo');
  info.innerHTML =
    '<div class="modal-info-item"><label>ID Pesanan</label><div class="val">' + escHtml(d.idPesanan) + '</div></div>' +
    '<div class="modal-info-item"><label>Nama</label><div class="val">' + escHtml(d.nama) + '</div></div>' +
    '<div class="modal-info-item"><label>NIM</label><div class="val">' + escHtml(d.nim) + '</div></div>' +
    '<div class="modal-info-item"><label>Jenis Peta</label><div class="val">' + escHtml(d.jenisPeta) + '</div></div>';

  // Set status saat ini sebagai default
  var selectStatus = document.getElementById('selectStatusBaru');
  selectStatus.value = d.status || 'Menunggu Konfirmasi';

  // Kosongkan catatan admin
  document.getElementById('catatanAdmin').value = '';

  var modal = document.getElementById('modalUpdate');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function tutupModalUpdate(e, paksa) {
  if (!paksa && e && e.target !== document.getElementById('modalUpdate')) return;
  document.getElementById('modalUpdate').style.display = 'none';
  document.body.style.overflow = '';
  idEditSedang = null;
}

function simpanStatusBaru() {
  if (!idEditSedang) return;

  var statusBaru = document.getElementById('selectStatusBaru').value;
  var catatanAdmin = document.getElementById('catatanAdmin').value.trim();
  var btn = document.getElementById('btnSimpanStatus');
  var btnText = document.getElementById('btnSimpanText');
  var btnLoading = document.getElementById('btnSimpanLoading');

  btn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';

  var payload = {
    action: 'updateStatus',
    idPesanan: idEditSedang,
    statusBaru: statusBaru,
    catatanAdmin: catatanAdmin,
    adminCode: CONFIG.ADMIN_CODE,
  };

  if (IS_CONFIG_READY) {
    callApiPost(payload, function (result) {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';

      if (result.ok && result.data && result.data.success) {
        updateStatusLokal(idEditSedang, statusBaru);
        tutupModalUpdate(null, true);
        tampilNotifikasi('✅ Status berhasil diperbarui!', 'sukses');
      } else {
        tampilNotifikasi('❌ Gagal: ' + (result.error || 'Coba lagi.'), 'error');
      }
    });
  } else {
    // Mode demo — update lokal saja
    setTimeout(function () {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';

      updateStatusLokal(idEditSedang, statusBaru);
      tutupModalUpdate(null, true);
      tampilNotifikasi('✅ Status diperbarui (mode demo — tidak tersimpan ke spreadsheet)', 'sukses');
    }, 600);
  }
}

function updateStatusLokal(idPesanan, statusBaru) {
  semuaPesanan = semuaPesanan.map(function (p) {
    if (p.idPesanan === idPesanan) {
      return Object.assign({}, p, { status: statusBaru });
    }
    return p;
  });
  renderSemua();
  // Juga filter ulang jika tab pesanan sedang terbuka
  filterPesanan();
}

// ==========================================
// NOTIFIKASI TOAST
// ==========================================

function tampilNotifikasi(pesan, tipe) {
  var existing = document.getElementById('toastNotif');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'toastNotif';
  toast.style.cssText = [
    'position: fixed',
    'bottom: 24px',
    'right: 24px',
    'padding: 14px 20px',
    'border-radius: 10px',
    'font-size: 0.9rem',
    'font-weight: 600',
    'z-index: 99999',
    'box-shadow: 0 8px 24px rgba(0,0,0,0.2)',
    'animation: slideInRight 0.3s ease',
    'max-width: 320px',
    tipe === 'sukses'
      ? 'background: #dcfce7; color: #166534; border: 2px solid #86efac;'
      : 'background: #fee2e2; color: #991b1b; border: 2px solid #fca5a5;'
  ].join(';');
  toast.textContent = pesan;

  // Tambahkan animasi ke style
  var style = document.createElement('style');
  style.textContent = '@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
  document.head.appendChild(style);

  document.body.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 300);
  }, 3000);
}

// ==========================================
// DATA DEMO (jika spreadsheet belum dikonfigurasi)
// ==========================================

function contohDataDemo() {
  return [
    {
      idPesanan: 'PETA-DEMO1',
      waktu: new Date(Date.now() - 3600000 * 2).toISOString(),
      nama: 'Siti Rahma Dewi',
      nim: '20211001',
      prodi: 'Teknik Lingkungan',
      bahasa: 'Indonesia',
      jenisPeta: 'Peta Lokasi Penelitian',
      jenisLokasi: 'Wilayah',
      detailLokasi: 'Kecamatan Waru, Kabupaten Sidoarjo',
      catatan: '',
      status: 'Menunggu Konfirmasi'
    },
    {
      idPesanan: 'PETA-DEMO2',
      waktu: new Date(Date.now() - 3600000 * 10).toISOString(),
      nama: 'Budi Santoso',
      nim: '20211002',
      prodi: 'Biologi',
      bahasa: 'Inggris',
      jenisPeta: 'Peta Lokasi Penelitian',
      jenisLokasi: 'Nama Tempat',
      detailLokasi: 'Universitas Airlangga | Jl. Airlangga No. 4-6, Surabaya',
      catatan: 'Tolong sertakan legenda detail',
      status: 'Sedang Diproses'
    },
    {
      idPesanan: 'PETA-DEMO3',
      waktu: new Date(Date.now() - 3600000 * 30).toISOString(),
      nama: 'Ahmad Fauzi',
      nim: '20201015',
      prodi: 'Kehutanan',
      bahasa: 'Indonesia',
      jenisPeta: 'Peta Lokasi Penelitian',
      jenisLokasi: 'Wilayah',
      detailLokasi: 'Kawasan Hutan Lindung Pasuruan',
      catatan: '',
      status: 'Selesai'
    },
    {
      idPesanan: 'PETA-DEMO4',
      waktu: new Date(Date.now() - 3600000 * 5).toISOString(),
      nama: 'Putri Andini',
      nim: '20211034',
      prodi: 'Ilmu Kelautan',
      bahasa: 'Inggris',
      jenisPeta: 'Peta Lokasi Penelitian',
      jenisLokasi: 'Wilayah',
      detailLokasi: 'Perairan Selat Madura',
      catatan: 'Butuh secepatnya',
      status: 'Dikonfirmasi'
    },
    {
      idPesanan: 'PETA-DEMO5',
      waktu: new Date(Date.now() - 3600000 * 48).toISOString(),
      nama: 'Rizky Pratama',
      nim: '20201098',
      prodi: 'Geografi',
      bahasa: 'Indonesia',
      jenisPeta: 'Peta Lokasi Penelitian',
      jenisLokasi: 'Wilayah',
      detailLokasi: 'Kabupaten Malang',
      catatan: '',
      status: 'Revisi'
    },
  ];
}

// ==========================================
// UTILITY (escape untuk keamanan)
// ==========================================

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return "'" + String(str).replace(/'/g, "\\'") + "'";
}

// Tutup modal dengan Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') tutupModalUpdate(null, true);
});
