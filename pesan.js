/**
 * ============================================================
 *  Mo-PETA — PESAN JS
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  cekKonfigurasi();
  var form = document.getElementById('formPesan');
  if (form) {
    form.addEventListener('submit', submitPesanan);
  }
});

// ==========================================
// CEK KONFIGURASI
// ==========================================

function cekKonfigurasi() {
  var banner = document.getElementById('loadingConfig');
  if (!banner) return;
  if (!IS_CONFIG_READY) {
    banner.style.display = 'block';
  }
}

// ==========================================
// HANDLE PERUBAHAN JENIS PETA
// ==========================================

function handleJenisPeta() {
  var jenis = document.getElementById('jenisPeta').value;
  var sectionLokasi = document.getElementById('sectionLokasi');
  var sectionSampel = document.getElementById('sectionSampel');
  var catatanGroup = document.getElementById('catatanGroup');
  var btnSubmitGroup = document.getElementById('btnSubmitGroup');

  // Sembunyikan semua dulu
  sectionLokasi.style.display = 'none';
  sectionSampel.style.display = 'none';
  catatanGroup.style.display = 'none';
  btnSubmitGroup.style.display = 'none';

  // Reset sub-field lokasi
  resetFieldLokasi();

  if (jenis === 'Peta Lokasi Penelitian') {
    sectionLokasi.style.display = 'block';
    catatanGroup.style.display = 'block';
    btnSubmitGroup.style.display = 'block';

    // Update pesan WA jika field sudah terisi
    updatePesanWA();

  } else if (jenis === 'Peta Titik Pengambilan Sampel') {
    sectionSampel.style.display = 'block';
    updatePesanWA();
  }
}

// ==========================================
// HANDLE PERUBAHAN JENIS LOKASI
// ==========================================

function handleJenisLokasi() {
  var jenisLokasi = document.getElementById('jenisLokasi').value;
  var subWilayah = document.getElementById('subWilayah');
  var subTempat = document.getElementById('subTempat');

  subWilayah.style.display = 'none';
  subTempat.style.display = 'none';

  // Hapus required dari semua field sub
  clearRequiredSub();

  if (jenisLokasi === 'Wilayah') {
    subWilayah.style.display = 'block';
    document.getElementById('namaWilayah').required = true;

  } else if (jenisLokasi === 'Nama Tempat') {
    subTempat.style.display = 'block';
    document.getElementById('namaTempat').required = true;
    document.getElementById('alamatTempat').required = true;
  }
}

function clearRequiredSub() {
  var fields = ['namaWilayah', 'namaTempat', 'alamatTempat'];
  fields.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.required = false;
  });
}

function resetFieldLokasi() {
  var jenisLokasi = document.getElementById('jenisLokasi');
  if (jenisLokasi) jenisLokasi.value = '';
  var subWilayah = document.getElementById('subWilayah');
  var subTempat = document.getElementById('subTempat');
  if (subWilayah) subWilayah.style.display = 'none';
  if (subTempat) subTempat.style.display = 'none';
  clearRequiredSub();
}

// ==========================================
// PESAN WHATSAPP OTOMATIS
// ==========================================

function bukaWhatsApp() {
  var nama = document.getElementById('nama').value || '(belum diisi)';
  var nim = document.getElementById('nim').value || '(belum diisi)';
  var prodi = document.getElementById('prodi').value || '(belum diisi)';
  var bahasa = document.getElementById('bahasa').value || '(belum dipilih)';

  var pesan =
    'Halo Mo-PETA! 🗺️\n\n' +
    'Saya ingin memesan *Peta Titik Pengambilan Sampel*.\n\n' +
    '*Data Pemohon:*\n' +
    '• Nama: ' + nama + '\n' +
    '• NIM: ' + nim + '\n' +
    '• Program Studi: ' + prodi + '\n' +
    '• Bahasa Peta: ' + bahasa + '\n\n' +
    'Mohon informasi lebih lanjut. Terima kasih!';

  var waNumber = (typeof CONFIG !== 'undefined') ? CONFIG.WHATSAPP_NUMBER : '6281234567890';
  var url = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(pesan);
  window.open(url, '_blank');
  return false;
}

function updatePesanWA() {
  var btnWA = document.getElementById('btnWA');
  if (btnWA) {
    btnWA.onclick = bukaWhatsApp;
  }
}

// ==========================================
// SUBMIT FORM PESANAN
// ==========================================

function submitPesanan(e) {
  e.preventDefault();

  // Validasi manual
  if (!validasiForm()) return;

  var btnSubmit = document.getElementById('btnSubmit');
  var btnText = document.getElementById('btnText');
  var btnLoading = document.getElementById('btnLoading');

  btnSubmit.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';

  var idPesanan = generateIdPesanan();
  var sekarang = new Date().toISOString();

  var jenisLokasi = document.getElementById('jenisLokasi').value || '';
  var namaWilayah = document.getElementById('namaWilayah').value || '';
  var keteranganWilayah = document.getElementById('keteranganWilayah').value || '';
  var namaTempat = document.getElementById('namaTempat').value || '';
  var alamatTempat = document.getElementById('alamatTempat').value || '';
  var keteranganTempat = document.getElementById('keteranganTempat').value || '';

  var detailLokasi = '';
  if (jenisLokasi === 'Wilayah') {
    detailLokasi = namaWilayah + (keteranganWilayah ? ' | ' + keteranganWilayah : '');
  } else if (jenisLokasi === 'Nama Tempat') {
    detailLokasi = namaTempat + ' | ' + alamatTempat + (keteranganTempat ? ' | ' + keteranganTempat : '');
  }

  var payload = {
    action: 'tambahPesanan',
    idPesanan: idPesanan,
    waktu: sekarang,
    bahasa: document.getElementById('bahasa').value,
    nama: document.getElementById('nama').value,
    nim: document.getElementById('nim').value,
    prodi: document.getElementById('prodi').value,
    jenisPeta: document.getElementById('jenisPeta').value,
    jenisLokasi: jenisLokasi,
    detailLokasi: detailLokasi,
    catatan: document.getElementById('catatan').value || '',
    status: 'Menunggu Konfirmasi',
  };

  callApiPost(payload, function (result) {
    btnSubmit.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';

    if (result.ok && result.data && result.data.success) {
      tampilSukses(idPesanan);
    } else if (!IS_CONFIG_READY) {
      // Mode demo — tetap tampilkan sukses meski tidak ada spreadsheet
      tampilSukses(idPesanan);
    } else {
      alert('Terjadi kesalahan: ' + (result.error || 'Coba lagi nanti.'));
    }
  });
}

function tampilSukses(idPesanan) {
  var form = document.getElementById('formPesan');
  var successBox = document.getElementById('successBox');
  var idDisplay = document.getElementById('idPesananDisplay');

  form.style.display = 'none';
  successBox.style.display = 'block';
  idDisplay.textContent = idPesanan;

  // Simpan ke localStorage sebagai backup lokal
  simpanKeLokal(idPesanan);
}

function salinId() {
  var id = document.getElementById('idPesananDisplay').textContent;
  var btn = document.querySelector('.btn-copy');
  salinTeks(id, btn);
}

// ==========================================
// VALIDASI FORM
// ==========================================

function validasiForm() {
  var bahasa = document.getElementById('bahasa').value;
  var nama = document.getElementById('nama').value.trim();
  var nim = document.getElementById('nim').value.trim();
  var prodi = document.getElementById('prodi').value.trim();
  var jenisPeta = document.getElementById('jenisPeta').value;

  if (!bahasa) { alert('Silakan pilih bahasa peta.'); return false; }
  if (!nama) { alert('Silakan isi nama lengkap.'); return false; }
  if (!nim) { alert('Silakan isi NIM.'); return false; }
  if (!prodi) { alert('Silakan isi program studi / jurusan.'); return false; }
  if (!jenisPeta) { alert('Silakan pilih jenis peta.'); return false; }

  if (jenisPeta === 'Peta Lokasi Penelitian') {
    var jenisLokasi = document.getElementById('jenisLokasi').value;
    if (!jenisLokasi) { alert('Silakan pilih jenis lokasi.'); return false; }

    if (jenisLokasi === 'Wilayah') {
      var namaWilayah = document.getElementById('namaWilayah').value.trim();
      if (!namaWilayah) { alert('Silakan isi nama wilayah.'); return false; }
    }

    if (jenisLokasi === 'Nama Tempat') {
      var namaTempat = document.getElementById('namaTempat').value.trim();
      var alamatTempat = document.getElementById('alamatTempat').value.trim();
      if (!namaTempat) { alert('Silakan isi nama institusi / lembaga.'); return false; }
      if (!alamatTempat) { alert('Silakan isi alamat lengkap.'); return false; }
    }
  }

  return true;
}

// ==========================================
// SIMPAN KE LOCALSTORAGE (backup lokal)
// ==========================================

function simpanKeLokal(idPesanan) {
  try {
    var riwayat = JSON.parse(localStorage.getItem('mopeta_riwayat') || '[]');
    var sekarang = new Date().toISOString();
    riwayat.unshift({
      idPesanan: idPesanan,
      nama: document.getElementById('nama').value,
      nim: document.getElementById('nim').value,
      prodi: document.getElementById('prodi').value,
      jenisPeta: document.getElementById('jenisPeta').value,
      status: 'Menunggu Konfirmasi',
      waktu: sekarang,
    });
    // Simpan maksimal 50 entri
    if (riwayat.length > 50) riwayat = riwayat.slice(0, 50);
    localStorage.setItem('mopeta_riwayat', JSON.stringify(riwayat));
  } catch (err) {
    // Abaikan jika localStorage tidak tersedia
  }
}
