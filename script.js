/* =====================================================
   Mo-PETA — script.js
   Semua fungsi untuk: Beranda, Pesan, Lacak
   ===================================================== */

/* =====================================================
   UTILITIES
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

function genId() {
  var c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', r = '';
  for (var i = 0; i < 5; i++) r += c[Math.floor(Math.random()*c.length)];
  return 'PETA-' + r;
}

function progressPct(status) {
  return { 'Menunggu Konfirmasi':10, 'Dikonfirmasi':30, 'Sedang Diproses':60, 'Revisi':80, 'Selesai':100 }[status] || 10;
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

function salin(teks, btn) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(teks).then(function() { flashBtn(btn); });
  } else {
    var t = document.createElement('textarea');
    t.value = teks; t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t); t.select(); document.execCommand('copy');
    document.body.removeChild(t); flashBtn(btn);
  }
}

function flashBtn(btn) {
  if (!btn) return;
  var ori = btn.textContent;
  btn.textContent = '✓ Tersalin!';
  btn.style.background = 'var(--green)'; btn.style.color = '#fff';
  setTimeout(function() { btn.textContent = ori; btn.style.background = ''; btn.style.color = ''; }, 1800);
}

function toast(msg, type) {
  var el = document.getElementById('_toast');
  if (!el) { el = document.createElement('div'); el.id = '_toast'; document.body.appendChild(el); }
  el.className = 'toast toast-' + (type || 'success');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(function() { el.style.display = 'none'; }, 3000);
}

/* API helpers */
function apiGet(params, cb) {
  if (!IS_CONFIG_READY) { cb({ ok:false, err:'Spreadsheet belum dikonfigurasi.' }); return; }
  var qs = Object.keys(params).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(params[k]);}).join('&');
  fetch(CONFIG.SPREADSHEET_API_URL + '?' + qs)
    .then(function(r){ return r.json(); })
    .then(function(d){ cb({ ok:true, data:d }); })
    .catch(function(){ cb({ ok:false, err:'Gagal menghubungi server.' }); });
}

function apiPost(body, cb) {
  if (!IS_CONFIG_READY) { cb({ ok:false, err:'Spreadsheet belum dikonfigurasi.' }); return; }
  fetch(CONFIG.SPREADSHEET_API_URL, { method:'POST', body: JSON.stringify(body) })
    .then(function(r){ return r.json(); })
    .then(function(d){ cb({ ok:true, data:d }); })
    .catch(function(){ cb({ ok:false, err:'Gagal menghubungi server.' }); });
}

/* localStorage */
function simpanLokal(data) {
  try {
    var r = JSON.parse(localStorage.getItem('mopeta') || '[]');
    r.unshift(data); if (r.length>100) r.length=100;
    localStorage.setItem('mopeta', JSON.stringify(r));
  } catch(e){}
}

function cariLokalById(id) {
  try {
    return (JSON.parse(localStorage.getItem('mopeta')||'[]')).find(function(x){return x.idPesanan===id;}) || null;
  } catch(e){ return null; }
}

function cariLokalByNIM(nim) {
  try {
    return (JSON.parse(localStorage.getItem('mopeta')||'[]')).filter(function(x){return String(x.nim)===String(nim);});
  } catch(e){ return []; }
}

/* =====================================================
   INIT
   ===================================================== */

document.addEventListener('DOMContentLoaded', function() {
  var pg = location.pathname.split('/').pop();

  /* Update kontak dari config */
  if (typeof CONFIG !== 'undefined') {
    document.querySelectorAll('a[href*="wa.me"]').forEach(function(a){
      a.href = 'https://wa.me/' + CONFIG.WHATSAPP_NUMBER;
      var s = a.querySelector('strong'); if (s) s.textContent = CONFIG.WHATSAPP_DISPLAY;
    });
    document.querySelectorAll('a[href*="instagram.com"]').forEach(function(a){
      a.href = 'https://instagram.com/' + CONFIG.INSTAGRAM.replace('@','');
      var s = a.querySelector('strong'); if (s) s.textContent = CONFIG.INSTAGRAM;
    });
  }

  if (pg === '' || pg === 'index.html') initBeranda();
  if (pg === 'pesan.html') initPesan();
  if (pg === 'lacak.html') {} /* Lacak pakai onclick inline */
});

/* =====================================================
   BERANDA
   ===================================================== */

function initBeranda() {
  var sc = document.getElementById('galeriScroll');
  var dc = document.getElementById('galeriDots');
  if (!sc || !dc) return;

  var items = sc.querySelectorAll('.galeri-item');
  if (!items.length) return;

  items.forEach(function(_, i){
    var d = document.createElement('div');
    d.className = 'dot' + (i===0?' active':'');
    d.addEventListener('click', function(){ scrollTo(i); });
    dc.appendChild(d);
  });

  sc.addEventListener('scroll', updateDots);

  var auto = setInterval(function(){
    var w = items[0].offsetWidth + 14;
    if (sc.scrollLeft >= sc.scrollWidth - sc.clientWidth - 5) {
      sc.scrollTo({ left:0, behavior:'smooth' });
    } else {
      sc.scrollBy({ left:w, behavior:'smooth' });
    }
  }, 4000);

  sc.addEventListener('pointerdown', function(){ clearInterval(auto); });
}

function scrollTo(idx) {
  var sc = document.getElementById('galeriScroll');
  if (!sc) return;
  var items = sc.querySelectorAll('.galeri-item');
  if (items[idx]) sc.scrollTo({ left: items[idx].offsetLeft - sc.offsetLeft, behavior:'smooth' });
}

function geserGaleri(d) {
  var sc = document.getElementById('galeriScroll');
  if (!sc) return;
  var item = sc.querySelector('.galeri-item');
  sc.scrollBy({ left: d * (item ? item.offsetWidth + 14 : 214), behavior:'smooth' });
}

function updateDots() {
  var sc = document.getElementById('galeriScroll');
  var dc = document.getElementById('galeriDots');
  if (!sc || !dc) return;
  var item = sc.querySelector('.galeri-item');
  if (!item) return;
  var w = item.offsetWidth + 14;
  var idx = Math.round(sc.scrollLeft / w);
  var dots = dc.querySelectorAll('.dot');
  dots.forEach(function(d,i){ d.classList.toggle('active', i===idx); });
}

/* =====================================================
   PESAN — FORM
   ===================================================== */

function initPesan() {
  var banner = document.getElementById('bannerConfig');
  if (banner && !IS_CONFIG_READY) banner.style.display = 'flex';

  var form = document.getElementById('formPesan');
  if (form) form.addEventListener('submit', submitPesan);
}

function onJenisPetaChange() {
  var val = document.getElementById('jenisPeta').value;
  var sL = document.getElementById('secLokasi');
  var sS = document.getElementById('secSampel');

  sL.style.display = 'none'; sS.style.display = 'none';
  resetLokasiFields();

  if (val === 'Peta Lokasi Penelitian') { sL.style.display = 'block'; }
  if (val === 'Peta Titik Pengambilan Sampel') { sS.style.display = 'block'; }
}

function onJenisLokasiChange() {
  var val = document.getElementById('jenisLokasi').value;
  var sw = document.getElementById('subWilayah');
  var st = document.getElementById('subTempat');

  sw.style.display = 'none'; st.style.display = 'none';
  clearReq(['namaWilayah','namaTempat','alamatTempat']);

  if (val === 'Wilayah') {
    sw.style.display = 'block';
    document.getElementById('namaWilayah').required = true;
  }
  if (val === 'Nama Tempat') {
    st.style.display = 'block';
    document.getElementById('namaTempat').required = true;
    document.getElementById('alamatTempat').required = true;
  }
}

function resetLokasiFields() {
  var jl = document.getElementById('jenisLokasi');
  if (jl) jl.value = '';
  var sw = document.getElementById('subWilayah');
  var st = document.getElementById('subTempat');
  if (sw) sw.style.display = 'none';
  if (st) st.style.display = 'none';
  clearReq(['namaWilayah','namaTempat','alamatTempat']);
}

function clearReq(ids) {
  ids.forEach(function(id){ var el = document.getElementById(id); if (el) el.required = false; });
}

function bukaWA() {
  var nama  = (document.getElementById('nama')  || {}).value || '(belum diisi)';
  var nim   = (document.getElementById('nim')   || {}).value || '(belum diisi)';
  var prodi = (document.getElementById('prodi') || {}).value || '(belum diisi)';
  var bahasa= (document.getElementById('bahasa')|| {}).value || '(belum dipilih)';
  var pesan =
    'Halo Mo-PETA! 🗺️\n\nSaya ingin memesan *Peta Titik Pengambilan Sampel*.\n\n' +
    '*Data Pemohon:*\n• Nama: '+nama+'\n• NIM: '+nim+'\n• Program Studi: '+prodi+
    '\n• Bahasa Peta: '+bahasa+'\n\nMohon info lebih lanjut. Terima kasih!';
  var no = (typeof CONFIG !== 'undefined') ? CONFIG.WHATSAPP_NUMBER : '6281234567890';
  window.open('https://wa.me/'+no+'?text='+encodeURIComponent(pesan), '_blank');
}

function submitPesan(e) {
  e.preventDefault();

  var bahasa = document.getElementById('bahasa').value;
  var nama   = document.getElementById('nama').value.trim();
  var nim    = document.getElementById('nim').value.trim();
  var prodi  = document.getElementById('prodi').value.trim();
  var jp     = document.getElementById('jenisPeta').value;

  if (!bahasa) return alert('Pilih bahasa peta.');
  if (!nama)   return alert('Isi nama lengkap.');
  if (!nim)    return alert('Isi NIM.');
  if (!prodi)  return alert('Isi program studi.');
  if (!jp)     return alert('Pilih jenis peta.');

  var jl = '', detailLokasi = '';
  if (jp === 'Peta Lokasi Penelitian') {
    jl = document.getElementById('jenisLokasi').value;
    if (!jl) return alert('Pilih jenis lokasi.');
    if (jl === 'Wilayah') {
      var nw = document.getElementById('namaWilayah').value.trim();
      if (!nw) return alert('Isi nama wilayah.');
      detailLokasi = nw + (document.getElementById('ketWilayah').value.trim() ? ' | '+document.getElementById('ketWilayah').value.trim() : '');
    }
    if (jl === 'Nama Tempat') {
      var nt = document.getElementById('namaTempat').value.trim();
      var at = document.getElementById('alamatTempat').value.trim();
      if (!nt) return alert('Isi nama institusi/lembaga.');
      if (!at) return alert('Isi alamat lengkap.');
      detailLokasi = nt + ' | ' + at + (document.getElementById('ketTempat').value.trim() ? ' | '+document.getElementById('ketTempat').value.trim() : '');
    }
  }

  var id = genId();
  var payload = {
    action:'tambahPesanan', idPesanan:id, waktu: new Date().toISOString(),
    bahasa, nama, nim, prodi, jenisPeta:jp, jenisLokasi:jl, detailLokasi,
    catatan: (document.getElementById('catatan')||{}).value || '',
    status:'Menunggu Konfirmasi'
  };

  var btn = document.getElementById('btnSubmit');
  var lbl = document.getElementById('btnLabel');
  var ld  = document.getElementById('btnLoading');
  btn.disabled = true; lbl.style.display = 'none'; ld.style.display = 'inline';

  simpanLokal(payload);

  function tampilSukses() {
    document.getElementById('formWrap').style.display = 'none';
    document.getElementById('successWrap').style.display = 'block';
    document.getElementById('idDisplay').textContent = id;
  }

  if (IS_CONFIG_READY) {
    apiPost(payload, function(res) {
      btn.disabled = false; lbl.style.display = 'inline'; ld.style.display = 'none';
      if (res.ok && res.data && res.data.success) { tampilSukses(); }
      else { tampilSukses(); } // tetap tampil karena sudah disimpan lokal
    });
  } else {
    setTimeout(function() {
      btn.disabled = false; lbl.style.display = 'inline'; ld.style.display = 'none';
      tampilSukses();
    }, 600);
  }
}

function salinId() {
  var id  = document.getElementById('idDisplay').textContent;
  var btn = document.querySelector('.id-badge .btn-copy');
  salin(id, btn);
}

/* =====================================================
   LACAK
   ===================================================== */

function lacakById() {
  var input = document.getElementById('inputId').value.trim().toUpperCase();
  var elLoad = document.getElementById('loadId');
  var elErr  = document.getElementById('errId');
  var elHasil= document.getElementById('hasilId');
  var elCard = document.getElementById('hasilIdCard');

  elLoad.style.display='none'; elErr.style.display='none'; elHasil.style.display='none';

  if (!input) { showErr(elErr, 'Masukkan ID pesanan terlebih dahulu.'); return; }
  if (!input.startsWith('PETA-')) { showErr(elErr, 'Format ID tidak valid. Harus diawali "PETA-".'); return; }

  elLoad.style.display = 'block';

  function render(d) {
    elLoad.style.display = 'none';
    var pct = progressPct(d.status);
    elCard.innerHTML =
      '<div class="hasil-header">' +
        '<span class="hasil-id">'+esc(d.idPesanan)+'</span>' +
        '<span class="badge '+badgeClass(d.status)+'">'+esc(d.status||'Menunggu Konfirmasi')+'</span>' +
      '</div>' +
      '<div class="info-grid">' +
        mkInfo('Nama', d.nama) + mkInfo('NIM', d.nim) +
        mkInfo('Program Studi', d.prodi) + mkInfo('Jenis Peta', d.jenisPeta) +
        mkInfo('Bahasa', d.bahasa||'—') + mkInfo('Tanggal', fmtTgl(d.waktu)) +
      '</div>' +
      (d.catatanAdmin ? '<p style="font-size:.82rem;color:var(--text-mid);margin-bottom:12px;">📌 <em>'+esc(d.catatanAdmin)+'</em></p>' : '') +
      '<div class="progress-wrap">' +
        '<div class="progress-label">Progress Pengerjaan</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:'+pct+'%"></div></div>' +
        '<div class="progress-pct">'+pct+'%</div>' +
      '</div>';
    elHasil.style.display = 'block';
  }

  if (IS_CONFIG_READY) {
    apiGet({ action:'lacakById', idPesanan:input }, function(res) {
      elLoad.style.display = 'none';
      if (res.ok && res.data && res.data.found) { render(res.data.pesanan); }
      else {
        var lok = cariLokalById(input);
        if (lok) render(lok);
        else showErr(elErr, 'Pesanan "'+input+'" tidak ditemukan.');
      }
    });
  } else {
    elLoad.style.display = 'none';
    var lok = cariLokalById(input);
    if (lok) render(lok);
    else showErr(elErr, 'Spreadsheet belum dikonfigurasi. ID "'+input+'" tidak ditemukan di data lokal.');
  }
}

function lacakByNIM() {
  var nim    = document.getElementById('inputNIM').value.trim();
  var elLoad = document.getElementById('loadNIM');
  var elErr  = document.getElementById('errNIM');
  var elHasil= document.getElementById('hasilNIM');
  var elList = document.getElementById('riwayatList');
  var elTitle= document.getElementById('riwayatTitle');

  elLoad.style.display='none'; elErr.style.display='none'; elHasil.style.display='none';

  if (!nim) { showErr(elErr, 'Masukkan NIM terlebih dahulu.'); return; }

  elLoad.style.display = 'block';

  function render(list) {
    elLoad.style.display = 'none';
    if (!list.length) { showErr(elErr, 'Tidak ada riwayat pesanan untuk NIM "'+nim+'".'); return; }
    elTitle.textContent = 'Ditemukan ' + list.length + ' pesanan';
    elList.innerHTML = list.map(function(d){
      return '<div class="riwayat-row" onclick="bukaModal('+escAttr(JSON.stringify(d))+')">' +
        '<div>' +
          '<div class="riwayat-info-id">'+esc(d.idPesanan)+'</div>' +
          '<div class="riwayat-info-meta">'+esc(d.jenisPeta)+' &bull; '+fmtTgl(d.waktu)+'</div>' +
        '</div>' +
        '<div class="riwayat-right">' +
          '<span class="badge '+badgeClass(d.status)+'">'+esc(d.status||'Menunggu')+'</span>' +
          '<span style="font-size:1rem;color:var(--text-soft);">›</span>' +
        '</div>' +
      '</div>';
    }).join('');
    elHasil.style.display = 'block';
  }

  if (IS_CONFIG_READY) {
    apiGet({ action:'riwayatByNIM', nim:nim }, function(res) {
      elLoad.style.display = 'none';
      if (res.ok && res.data) {
        var server = res.data.pesanan || [];
        var lokal  = cariLokalByNIM(nim);
        var ids = {}; server.forEach(function(x){ ids[x.idPesanan]=1; });
        var extra = lokal.filter(function(x){ return !ids[x.idPesanan]; });
        render(server.concat(extra));
      } else showErr(elErr, res.err || 'Gagal menghubungi server.');
    });
  } else {
    elLoad.style.display = 'none';
    render(cariLokalByNIM(nim));
  }
}

function mkInfo(lbl, val) {
  return '<div class="info-item"><label>'+esc(lbl)+'</label><span>'+esc(val||'—')+'</span></div>';
}

function showErr(el, msg) { el.textContent = msg; el.style.display = 'block'; }

function escAttr(s) { return "'" + String(s).replace(/'/g,"\\'") + "'"; }

/* Modal detail riwayat */
function bukaModal(raw) {
  var d = typeof raw === 'string' ? JSON.parse(raw) : raw;
  var info = document.getElementById('modalInfo');
  info.innerHTML =
    '<div class="info-grid" style="margin:0;">' +
      mkInfo('Nama', d.nama) + mkInfo('NIM', d.nim) +
      mkInfo('Program Studi', d.prodi) + mkInfo('Jenis Peta', d.jenisPeta) +
      mkInfo('Bahasa', d.bahasa||'—') + mkInfo('Status', d.status||'Menunggu Konfirmasi') +
      mkInfo('Tanggal', fmtTgl(d.waktu)) +
    '</div>';
  document.getElementById('modalIdVal').textContent = d.idPesanan;
  document.getElementById('modalBg').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function tutupModal(e, force) {
  if (!force && e && e.target !== document.getElementById('modalBg')) return;
  document.getElementById('modalBg').classList.remove('open');
  document.body.style.overflow = '';
}

function salinIdModal() {
  var v = document.getElementById('modalIdVal').textContent;
  var b = document.querySelector('.modal-id-row .btn-copy');
  salin(v, b);
}

document.addEventListener('keydown', function(e){
  if (e.key === 'Escape') {
    tutupModal(null, true);
  }
});
