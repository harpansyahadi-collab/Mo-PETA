/* =====================================================
   Mo-PETA — admin.js
   Panel Admin
   ===================================================== */

var semuaData = [];
var editId    = null;

/* =====================================================
   UTILITIES (sama seperti script.js)
   ===================================================== */

function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function fmtTgl(s) {
  if (!s) return '—';
  var d = new Date(s);
  return isNaN(d) ? String(s) : d.toLocaleDateString('id-ID', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  });
}

function badgeClass(status) {
  return {
    'Menunggu Konfirmasi':'badge-wait',
    'Dikonfirmasi':'badge-confirm',
    'Sedang Diproses':'badge-process',
    'Revisi':'badge-revise',
    'Selesai':'badge-done'
  }[status] || 'badge-wait';
}

function escAttr(s) { return "'" + String(s).replace(/'/g,"\\'") + "'"; }

function apiGet(params, cb) {
  var qs = Object.keys(params).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(params[k]);}).join('&');
  fetch(CONFIG.SPREADSHEET_API_URL + '?' + qs)
    .then(function(r){ return r.json(); })
    .then(function(d){ cb({ ok:true, data:d }); })
    .catch(function(){ cb({ ok:false, err:'Gagal menghubungi server.' }); });
}

function apiPost(body, cb) {
  fetch(CONFIG.SPREADSHEET_API_URL, { method:'POST', body: JSON.stringify(body) })
    .then(function(r){ return r.json(); })
    .then(function(d){ cb({ ok:true, data:d }); })
    .catch(function(){ cb({ ok:false, err:'Gagal menghubungi server.' }); });
}

function showToast(msg, type) {
  var el = document.getElementById('_toast');
  if (!el) { el = document.createElement('div'); el.id = '_toast'; document.body.appendChild(el); }
  el.className = 'toast toast-' + (type||'success');
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.style.display='none'; }, 3000);
}

/* =====================================================
   INIT
   ===================================================== */

document.addEventListener('DOMContentLoaded', function() {
  /* Overlay sidebar */
  var ov = document.getElementById('sidebarOverlay');
  if (ov) ov.addEventListener('click', tutupSidebar);

  /* Cek kode di URL */
  var kodeUrl = new URLSearchParams(location.search).get('kode');
  if (kodeUrl) {
    if (kodeUrl === CONFIG.ADMIN_CODE) bukaAdmin();
    else tampilErrLogin();
  }
});

/* =====================================================
   LOGIN
   ===================================================== */

function doLogin() {
  var kode = document.getElementById('inputKode').value;
  if (kode === CONFIG.ADMIN_CODE) {
    document.getElementById('loginErr').style.display = 'none';
    bukaAdmin();
  } else {
    tampilErrLogin();
    document.getElementById('inputKode').value = '';
    document.getElementById('inputKode').focus();
  }
}

function tampilErrLogin() {
  document.getElementById('loginErr').style.display = 'block';
}

function bukaAdmin() {
  document.getElementById('loginScreen').style.display  = 'none';
  document.getElementById('adminScreen').style.display  = 'block';
  muatData();
}

function doLogout() {
  if (!confirm('Yakin ingin keluar?')) return;
  document.getElementById('adminScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('inputKode').value = '';
  history.replaceState({}, '', location.pathname);
}

/* =====================================================
   PANEL NAVIGATION
   ===================================================== */

function gotoPanel(id, btn) {
  document.querySelectorAll('.admin-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.sidebar-link').forEach(function(b){ b.classList.remove('active'); });

  var panel = document.getElementById('panel' + id.charAt(0).toUpperCase() + id.slice(1));
  if (panel) panel.classList.add('active');
  if (btn)   btn.classList.add('active');

  var titles = { dashboard:'Dashboard', pesanan:'Daftar Pesanan' };
  document.getElementById('topbarTitle').textContent = titles[id] || id;

  tutupSidebar();
}

/* =====================================================
   SIDEBAR MOBILE
   ===================================================== */

function bukaSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}

function tutupSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

/* =====================================================
   MUAT DATA
   ===================================================== */

function muatData() {
  document.getElementById('tblTerbaru').innerHTML = '<div class="tbl-empty"><div class="ei">⏳</div>Memuat data...</div>';
  document.getElementById('tblSemua').innerHTML   = '<div class="tbl-empty"><div class="ei">⏳</div>Memuat data...</div>';

  if (!IS_CONFIG_READY) {
    semuaData = demoData();
    renderSemua();
    return;
  }

  apiGet({ action:'semuaPesanan', adminCode: CONFIG.ADMIN_CODE }, function(res) {
    if (res.ok && res.data && res.data.pesanan) {
      semuaData = res.data.pesanan;
    } else {
      semuaData = [];
      showToast('Gagal memuat data: ' + (res.err || 'Error tidak diketahui'), 'error');
    }
    renderSemua();
  });
}

function renderSemua() {
  renderStats();
  renderTblTerbaru();
  renderTblSemua(semuaData);
}

/* =====================================================
   STATS
   ===================================================== */

function renderStats() {
  var total    = semuaData.length;
  var menunggu = semuaData.filter(function(x){ return x.status === 'Menunggu Konfirmasi'; }).length;
  var proses   = semuaData.filter(function(x){
    return x.status === 'Dikonfirmasi' || x.status === 'Sedang Diproses' || x.status === 'Revisi';
  }).length;
  var selesai  = semuaData.filter(function(x){ return x.status === 'Selesai'; }).length;

  animNum('sTotal',    total);
  animNum('sMenunggu', menunggu);
  animNum('sProses',   proses);
  animNum('sSelesai',  selesai);
}

function animNum(id, target) {
  var el = document.getElementById(id);
  if (!el) return;
  var cur = 0, step = Math.ceil(target / 20);
  var t = setInterval(function(){
    cur = Math.min(cur + step, target);
    el.textContent = cur;
    if (cur >= target) clearInterval(t);
  }, 30);
}

/* =====================================================
   TABEL
   ===================================================== */

function renderTblTerbaru() {
  renderTbl('tblTerbaru', semuaData.slice(0, 8));
}

function renderTblSemua(data) {
  renderTbl('tblSemua', data);
}

function renderTbl(wrapperId, data) {
  var wrap = document.getElementById(wrapperId);
  if (!wrap) return;

  if (!data.length) {
    wrap.innerHTML = '<div class="tbl-empty"><div class="ei">📭</div>Tidak ada data</div>';
    return;
  }

  var rows = data.map(function(d){
    return '<tr>' +
      '<td class="td-id">'+esc(d.idPesanan)+'</td>' +
      '<td class="td-name">'+esc(d.nama)+'</td>' +
      '<td>'+esc(d.nim)+'</td>' +
      '<td class="td-clip" title="'+esc(d.prodi)+'">'+esc(d.prodi)+'</td>' +
      '<td>'+esc(d.jenisPeta||'—')+'</td>' +
      '<td class="td-time">'+fmtTgl(d.waktu)+'</td>' +
      '<td><span class="badge '+badgeClass(d.status)+'">'+esc(d.status||'Menunggu')+'</span></td>' +
      '<td class="td-act"><button class="btn btn-primary btn-sm" onclick="bukaUpdate('+escAttr(JSON.stringify(d))+')">✏️ Update</button></td>' +
    '</tr>';
  }).join('');

  wrap.innerHTML =
    '<div class="tbl-scroll">' +
    '<table>' +
    '<thead><tr>' +
      '<th>ID Pesanan</th><th>Nama</th><th>NIM</th><th>Prodi</th>' +
      '<th>Jenis Peta</th><th>Tanggal</th><th>Status</th><th>Aksi</th>' +
    '</tr></thead>' +
    '<tbody>'+rows+'</tbody>' +
    '</table></div>';
}

/* =====================================================
   FILTER TABEL
   ===================================================== */

function filterTabel() {
  var cari   = (document.getElementById('inputCari').value   || '').toLowerCase();
  var status = (document.getElementById('filterStatus').value || '');

  var filtered = semuaData.filter(function(d){
    var match = !cari ||
      (d.nama     && d.nama.toLowerCase().includes(cari)) ||
      (d.nim      && String(d.nim).toLowerCase().includes(cari)) ||
      (d.idPesanan&& d.idPesanan.toLowerCase().includes(cari)) ||
      (d.prodi    && d.prodi.toLowerCase().includes(cari));
    var sMatch = !status || d.status === status;
    return match && sMatch;
  });

  renderTblSemua(filtered);
}

/* =====================================================
   MODAL UPDATE STATUS
   ===================================================== */

function bukaUpdate(raw) {
  var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  editId = d.idPesanan;

  document.getElementById('updateInfo').innerHTML =
    '<div class="ii"><label>ID Pesanan</label><span>'+esc(d.idPesanan)+'</span></div>' +
    '<div class="ii"><label>Nama</label><span>'+esc(d.nama)+'</span></div>' +
    '<div class="ii"><label>NIM</label><span>'+esc(d.nim)+'</span></div>' +
    '<div class="ii"><label>Jenis Peta</label><span>'+esc(d.jenisPeta)+'</span></div>';

  document.getElementById('selectStatus').value = d.status || 'Menunggu Konfirmasi';
  document.getElementById('catatanAdmin').value = '';

  document.getElementById('modalUpdateBg').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function tutupModalUpdate(e, force) {
  if (!force && e && e.target !== document.getElementById('modalUpdateBg')) return;
  document.getElementById('modalUpdateBg').classList.remove('open');
  document.body.style.overflow = '';
  editId = null;
}

function simpanStatus() {
  if (!editId) return;

  var statusBaru    = document.getElementById('selectStatus').value;
  var catatanAdmin  = document.getElementById('catatanAdmin').value.trim();
  var btn           = document.getElementById('btnSimpan');
  var lbl           = document.getElementById('simpanLabel');
  var ld            = document.getElementById('simpanLoad');

  btn.disabled = true; lbl.style.display = 'none'; ld.style.display = 'inline';

  var payload = {
    action:'updateStatus',
    idPesanan:editId,
    statusBaru,
    catatanAdmin,
    adminCode: CONFIG.ADMIN_CODE
  };

  function selesai(sukses) {
    btn.disabled = false; lbl.style.display = 'inline'; ld.style.display = 'none';
    if (sukses) {
      semuaData = semuaData.map(function(x){
        return x.idPesanan === editId ? Object.assign({}, x, { status:statusBaru, catatanAdmin }) : x;
      });
      renderSemua();
      filterTabel();
      tutupModalUpdate(null, true);
      showToast('✅ Status berhasil diperbarui!');
    } else {
      showToast('❌ Gagal menyimpan. Coba lagi.', 'error');
    }
  }

  if (IS_CONFIG_READY) {
    apiPost(payload, function(res){
      selesai(res.ok && res.data && res.data.success);
    });
  } else {
    setTimeout(function(){ selesai(true); }, 700);
  }
}

/* =====================================================
   DEMO DATA (saat spreadsheet belum dikonfigurasi)
   ===================================================== */

function demoData() {
  var now = Date.now();
  return [
    { idPesanan:'PETA-DEMO1', waktu:new Date(now-7200000).toISOString(), nama:'Siti Rahma', nim:'20211001', prodi:'Teknik Lingkungan', bahasa:'Indonesia', jenisPeta:'Peta Lokasi Penelitian', jenisLokasi:'Wilayah', detailLokasi:'Kec. Waru, Kab. Sidoarjo', catatan:'', status:'Menunggu Konfirmasi', catatanAdmin:'' },
    { idPesanan:'PETA-DEMO2', waktu:new Date(now-36000000).toISOString(), nama:'Budi Santoso', nim:'20211002', prodi:'Biologi', bahasa:'Inggris', jenisPeta:'Peta Lokasi Penelitian', jenisLokasi:'Nama Tempat', detailLokasi:'Universitas Airlangga', catatan:'Sertakan legenda detail', status:'Sedang Diproses', catatanAdmin:'Sedang dikerjakan' },
    { idPesanan:'PETA-DEMO3', waktu:new Date(now-108000000).toISOString(), nama:'Ahmad Fauzi', nim:'20201015', prodi:'Kehutanan', bahasa:'Indonesia', jenisPeta:'Peta Lokasi Penelitian', jenisLokasi:'Wilayah', detailLokasi:'Hutan Lindung Pasuruan', catatan:'', status:'Selesai', catatanAdmin:'Peta sudah dikirim via email' },
    { idPesanan:'PETA-DEMO4', waktu:new Date(now-18000000).toISOString(), nama:'Putri Andini', nim:'20211034', prodi:'Ilmu Kelautan', bahasa:'Inggris', jenisPeta:'Peta Lokasi Penelitian', jenisLokasi:'Wilayah', detailLokasi:'Perairan Selat Madura', catatan:'Butuh secepatnya', status:'Dikonfirmasi', catatanAdmin:'' },
    { idPesanan:'PETA-DEMO5', waktu:new Date(now-172800000).toISOString(), nama:'Rizky Pratama', nim:'20201098', prodi:'Geografi', bahasa:'Indonesia', jenisPeta:'Peta Lokasi Penelitian', jenisLokasi:'Wilayah', detailLokasi:'Kabupaten Malang', catatan:'', status:'Revisi', catatanAdmin:'Mohon koreksi batas wilayah' },
  ];
}

/* =====================================================
   KEYBOARD SHORTCUT
   ===================================================== */

document.addEventListener('keydown', function(e){
  if (e.key === 'Escape') tutupModalUpdate(null, true);
});
