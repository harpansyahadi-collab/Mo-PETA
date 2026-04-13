/**
 * ============================================================
 *  Mo-PETA — LACAK JS
 * ============================================================
 */

// ==========================================
// LACAK BERDASARKAN ID PESANAN
// ==========================================

function lacakById() {
  var input = document.getElementById('inputIdPesanan').value.trim().toUpperCase();
  var hasil = document.getElementById('hasilLacakId');
  var hasilCard = document.getElementById('hasilCardId');
  var error = document.getElementById('errorLacakId');
  var loading = document.getElementById('loadingLacakId');

  // Reset tampilan
  hasil.style.display = 'none';
  error.style.display = 'none';
  loading.style.display = 'none';

  if (!input) {
    error.textContent = 'Silakan masukkan ID pesanan terlebih dahulu.';
    error.style.display = 'block';
    return;
  }

  if (!input.startsWith('PETA-')) {
    error.textContent = 'Format ID tidak valid. ID pesanan harus dimulai dengan "PETA-".';
    error.style.display = 'block';
    return;
  }

  loading.style.display = 'block';

  // Cek ke spreadsheet jika sudah dikonfigurasi
  if (IS_CONFIG_READY) {
    callApi({ action: 'lacakById', idPesanan: input }, function (result) {
      loading.style.display = 'none';
      if (result.ok && result.data && result.data.found) {
        var data = result.data.pesanan;
        hasilCard.innerHTML = renderHasilPesanan(data);
        hasil.style.display = 'block';
      } else if (result.ok && result.data && !result.data.found) {
        // Coba dari localStorage
        var lokal = cariDariLokal(input);
        if (lokal) {
          hasilCard.innerHTML = renderHasilPesanan(lokal);
          hasil.style.display = 'block';
        } else {
          error.textContent = 'Pesanan dengan ID "' + input + '" tidak ditemukan.';
          error.style.display = 'block';
        }
      } else {
        error.textContent = result.error || 'Gagal menghubungi server.';
        error.style.display = 'block';
      }
    });
  } else {
    // Mode demo: cari dari localStorage saja
    loading.style.display = 'none';
    var lokal = cariDariLokal(input);
    if (lokal) {
      hasilCard.innerHTML = renderHasilPesanan(lokal);
      hasil.style.display = 'block';
    } else {
      error.textContent = 'Spreadsheet belum dikonfigurasi. Pesanan dengan ID "' + input + '" tidak ditemukan di data lokal.';
      error.style.display = 'block';
    }
  }
}

// ==========================================
// LACAK BERDASARKAN NIM
// ==========================================

function lacakByNIM() {
  var nim = document.getElementById('inputNIM').value.trim();
  var hasilRiwayat = document.getElementById('hasilRiwayat');
  var listRiwayat = document.getElementById('listRiwayat');
  var error = document.getElementById('errorRiwayat');
  var loading = document.getElementById('loadingRiwayat');

  // Reset tampilan
  hasilRiwayat.style.display = 'none';
  error.style.display = 'none';
  loading.style.display = 'none';

  if (!nim) {
    error.textContent = 'Silakan masukkan NIM terlebih dahulu.';
    error.style.display = 'block';
    return;
  }

  loading.style.display = 'block';

  if (IS_CONFIG_READY) {
    callApi({ action: 'riwayatByNIM', nim: nim }, function (result) {
      loading.style.display = 'none';
      if (result.ok && result.data && result.data.pesanan) {
        var daftarSpreadsheet = result.data.pesanan;
        // Gabungkan dengan localStorage
        var daftarLokal = cariRiwayatLokal(nim);
        var daftar = gabungDaftar(daftarSpreadsheet, daftarLokal);

        if (daftar.length === 0) {
          error.textContent = 'Tidak ada riwayat pesanan untuk NIM "' + nim + '".';
          error.style.display = 'block';
        } else {
          listRiwayat.innerHTML = daftar.map(renderRiwayatItem).join('');
          hasilRiwayat.style.display = 'block';
        }
      } else {
        error.textContent = result.error || 'Gagal menghubungi server.';
        error.style.display = 'block';
      }
    });
  } else {
    // Mode demo: dari localStorage
    loading.style.display = 'none';
    var daftar = cariRiwayatLokal(nim);
    if (daftar.length === 0) {
      error.textContent = 'Spreadsheet belum dikonfigurasi. Tidak ada riwayat lokal untuk NIM "' + nim + '".';
      error.style.display = 'block';
    } else {
      listRiwayat.innerHTML = daftar.map(renderRiwayatItem).join('');
      hasilRiwayat.style.display = 'block';
    }
  }
}

// ==========================================
// RENDER HTML HASIL PESANAN
// ==========================================

function renderHasilPesanan(d) {
  var persen = getProgressPersen(d.status || 'Menunggu Konfirmasi');
  var statusClass = getStatusClass(d.status || 'Menunggu Konfirmasi');

  return (
    '<div class="hasil-header">' +
      '<div class="hasil-id">' + escHtml(d.idPesanan) + '</div>' +
      '<span class="status-badge ' + statusClass + '">' + escHtml(d.status || 'Menunggu Konfirmasi') + '</span>' +
    '</div>' +
    '<div class="hasil-info-grid">' +
      '<div class="hasil-info-item"><label>Nama</label><span>' + escHtml(d.nama) + '</span></div>' +
      '<div class="hasil-info-item"><label>NIM</label><span>' + escHtml(d.nim) + '</span></div>' +
      '<div class="hasil-info-item"><label>Program Studi</label><span>' + escHtml(d.prodi) + '</span></div>' +
      '<div class="hasil-info-item"><label>Jenis Peta</label><span>' + escHtml(d.jenisPeta) + '</span></div>' +
      '<div class="hasil-info-item"><label>Bahasa</label><span>' + escHtml(d.bahasa || '-') + '</span></div>' +
      '<div class="hasil-info-item"><label>Tanggal Pesan</label><span>' + formatTanggal(d.waktu) + '</span></div>' +
    '</div>' +
    '<div class="progress-section">' +
      '<div class="progress-label">Progress Pengerjaan</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width:' + persen + '%"></div></div>' +
      '<div class="progress-text">' + persen + '%</div>' +
    '</div>'
  );
}

function renderRiwayatItem(d) {
  var statusClass = getStatusClass(d.status || 'Menunggu Konfirmasi');
  return (
    '<div class="riwayat-item" onclick="bukaDetailModal(' + escAttr(JSON.stringify(d)) + ')">' +
      '<div class="riwayat-item-info">' +
        '<div class="riwayat-item-id">' + escHtml(d.idPesanan) + '</div>' +
        '<div class="riwayat-item-meta">' + escHtml(d.jenisPeta) + ' &bull; ' + formatTanggal(d.waktu) + '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span class="status-badge ' + statusClass + '">' + escHtml(d.status || 'Menunggu Konfirmasi') + '</span>' +
        '<button class="btn-detail">Lihat</button>' +
      '</div>' +
    '</div>'
  );
}

// ==========================================
// MODAL DETAIL
// ==========================================

function bukaDetailModal(dataStr) {
  var d;
  try {
    d = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
  } catch (e) {
    return;
  }

  var modal = document.getElementById('modalDetail');
  var content = document.getElementById('modalContent');

  content.innerHTML =
    '<div class="modal-info-row">' +
      '<div class="modal-info-item"><label>Nama</label><div class="val">' + escHtml(d.nama) + '</div></div>' +
      '<div class="modal-info-item"><label>NIM</label><div class="val">' + escHtml(d.nim) + '</div></div>' +
      '<div class="modal-info-item"><label>Program Studi</label><div class="val">' + escHtml(d.prodi) + '</div></div>' +
      '<div class="modal-info-item"><label>Jenis Peta</label><div class="val">' + escHtml(d.jenisPeta) + '</div></div>' +
      '<div class="modal-info-item"><label>Bahasa Peta</label><div class="val">' + escHtml(d.bahasa || '-') + '</div></div>' +
      '<div class="modal-info-item"><label>Status</label><div class="val"><span class="status-badge ' + getStatusClass(d.status || '') + '">' + escHtml(d.status || 'Menunggu Konfirmasi') + '</span></div></div>' +
      '<div class="modal-info-item"><label>Tanggal Pesan</label><div class="val">' + formatTanggal(d.waktu) + '</div></div>' +
    '</div>' +
    '<p style="font-size:0.85rem;color:var(--text-light);margin-bottom:8px;">ID Pesanan (klik salin):</p>' +
    '<div class="modal-id-box">' +
      '<span class="modal-id-val" id="modalIdVal">' + escHtml(d.idPesanan) + '</span>' +
      '<button class="btn-copy" onclick="salinIdModal()">📋 Salin</button>' +
    '</div>';

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function tutupModal(e, paksa) {
  if (!paksa && e && e.target !== document.getElementById('modalDetail')) return;
  var modal = document.getElementById('modalDetail');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

function salinIdModal() {
  var idEl = document.getElementById('modalIdVal');
  var btn = document.querySelector('.modal-id-box .btn-copy');
  if (idEl) salinTeks(idEl.textContent, btn);
}

// Tutup modal dengan tombol Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') tutupModal(null, true);
});

// ==========================================
// LOKAL STORAGE HELPERS
// ==========================================

function cariDariLokal(idPesanan) {
  try {
    var riwayat = JSON.parse(localStorage.getItem('mopeta_riwayat') || '[]');
    for (var i = 0; i < riwayat.length; i++) {
      if (riwayat[i].idPesanan === idPesanan) return riwayat[i];
    }
  } catch (e) {}
  return null;
}

function cariRiwayatLokal(nim) {
  try {
    var riwayat = JSON.parse(localStorage.getItem('mopeta_riwayat') || '[]');
    return riwayat.filter(function (r) { return r.nim === nim; });
  } catch (e) {
    return [];
  }
}

function gabungDaftar(dariServer, dariLokal) {
  var ids = {};
  dariServer.forEach(function (d) { ids[d.idPesanan] = true; });
  var lokalBaru = dariLokal.filter(function (d) { return !ids[d.idPesanan]; });
  return dariServer.concat(lokalBaru);
}

// ==========================================
// ESCAPE HELPER (keamanan XSS)
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
