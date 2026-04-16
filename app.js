// ============================================================
// Mo-PETA — Konfigurasi & Fungsi Utama
// ============================================================

var CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxxyfhHPeWI-szre9zxK-OxTz-AYYBjHIS54c5tnFZwM8AoKbiwNBBcmzA31R9hJ1uOTw/exec",
  WHATSAPP: "62895425966562",   // ← Ganti dengan nomor WhatsApp
  INSTAGRAM: "mopeta.official" // ← Ganti dengan username Instagram
};

// Setel link WA & IG di footer
document.addEventListener("DOMContentLoaded", function () {
  var waLinks = document.querySelectorAll(".footer-wa");
  var igLinks = document.querySelectorAll(".footer-ig");
  waLinks.forEach(function (el) {
    el.href = "https://wa.me/" + CONFIG.WHATSAPP;
    el.target = "_blank";
  });
  igLinks.forEach(function (el) {
    el.href = "https://instagram.com/" + CONFIG.INSTAGRAM;
    el.target = "_blank";
  });

  // Tandai nav aktif
  var path = window.location.pathname.split("/").pop() || "index.html";
  var navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(function (link) {
    if (link.getAttribute("href") === path) {
      link.classList.add("active");
    }
  });

  // Inisialisasi halaman
  if (typeof initPage === "function") initPage();
});


// ============================================================
// Utilitas: Panggil API (semua pakai GET)
// ============================================================
function apiGet(params, callback) {
  var url = CONFIG.SCRIPT_URL + "?" + objToQuery(params);
  var script = document.createElement("script");
  var cbName = "mopeta_cb_" + Date.now();
  url += "&callback=" + cbName;

  window[cbName] = function (data) {
    delete window[cbName];
    document.body.removeChild(script);
    callback(null, data);
  };

  script.onerror = function () {
    delete window[cbName];
    document.body.removeChild(script);
    callback("Gagal terhubung ke server");
  };

  script.src = url;
  document.body.appendChild(script);
}

function objToQuery(obj) {
  return Object.keys(obj).map(function (k) {
    return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]);
  }).join("&");
}

function apiPost(params, callback) {
  fetch(CONFIG.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: objToQuery(params)
  })
  .then(function(res) { return res.json(); })
  .then(function(data) { callback(null, data); })
  .catch(function(err) { callback(err.message || "Gagal terhubung"); });
}


// ============================================================
// HALAMAN PESAN
// ============================================================
function initFormPesan() {
  var form = document.getElementById("form-pesan");
  if (!form) return;

  var jenisPetaSelect = document.getElementById("jenis-peta");
  var sectionLokasi = document.getElementById("section-lokasi");
  var sectionKoordinat = document.getElementById("section-koordinat");
  var jenisLokasiSelect = document.getElementById("jenis-lokasi");
  var sectionDetailLokasi = document.getElementById("section-detail-lokasi");
  var labelDetail = document.getElementById("label-detail");

  jenisPetaSelect.addEventListener("change", function () {
    var val = this.value;
    if (val === "Peta Lokasi Penelitian") {
      sectionLokasi.style.display = "block";
      if (sectionKoordinat) sectionKoordinat.style.display = "none";
      updateDetailLabel();
    } else if (val === "Peta Titik Pengambilan Sampel") {
      sectionLokasi.style.display = "none";
      if (sectionKoordinat) sectionKoordinat.style.display = "block";
    } else {
      sectionLokasi.style.display = "none";
      if (sectionKoordinat) sectionKoordinat.style.display = "none";
    }
  });

  if (jenisLokasiSelect) {
    jenisLokasiSelect.addEventListener("change", updateDetailLabel);
  }

  function updateDetailLabel() {
    var jl = jenisLokasiSelect.value;
    if (jl === "Wilayah") {
      labelDetail.textContent = "Nama Wilayah";
      document.getElementById("detail-lokasi").placeholder = "Contoh: Kecamatan Pandan, Kab. Tapanuli Tengah";
    } else if (jl === "Nama Tempat (Institusi/Lembaga)") {
      labelDetail.textContent = "Nama Institusi / Lembaga";
      document.getElementById("detail-lokasi").placeholder = "Contoh: Pasar Balam, Sibolga";
    } else {
      labelDetail.textContent = "Detail Lokasi";
      document.getElementById("detail-lokasi").placeholder = "";
    }
    sectionDetailLokasi.style.display = jl ? "block" : "none";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    kirimPesanan();
  });

  // Upload template peta
  setupFileInput("template-peta", "upload-preview", "preview-name", "upload-error", "btn-hapus-file", ["image/jpeg", "image/png"], 5 * 1024 * 1024);
  // Upload file koordinat
  setupFileInput("file-koordinat", "upload-preview-koordinat", "preview-name-koordinat", "upload-error-koordinat", "btn-hapus-file-koordinat", null, 1 * 1024 * 1024);
}

function setupFileInput(inputId, previewId, nameId, errorId, btnHapusId, allowedTypes, maxSize) {
  var inputFile = document.getElementById(inputId);
  if (!inputFile) return;
  var uploadPreview = document.getElementById(previewId);
  var previewName = document.getElementById(nameId);
  var uploadError = document.getElementById(errorId);
  var btnHapusFile = document.getElementById(btnHapusId);

  inputFile.addEventListener("change", function () {
    uploadError.textContent = "";
    var file = this.files[0];
    if (!file) {
      uploadPreview.style.display = "none";
      return;
    }
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      uploadError.textContent = "Format gambar tidak didukung.";
      this.value = "";
      uploadPreview.style.display = "none";
      return;
    }
    if (file.size > maxSize) {
      uploadError.textContent = "Ukuran file melebihi batas " + (maxSize / 1024 / 1024) + " MB.";
      this.value = "";
      uploadPreview.style.display = "none";
      return;
    }
    previewName.textContent = file.name;
    uploadPreview.style.display = "flex";
  });

  if (btnHapusFile) {
    btnHapusFile.addEventListener("click", function () {
      inputFile.value = "";
      uploadPreview.style.display = "none";
      uploadError.textContent = "";
    });
  }
}

function readAsBase64(file) {
  return new Promise(function(resolve, reject) {
    if (!file) return resolve(null);
    var reader = new FileReader();
    reader.onload = function(e) {
      resolve({
        base64: e.target.result.split(",")[1],
        name: file.name,
        type: file.type || "application/octet-stream"
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function kirimPesanan() {
  var btn = document.getElementById("btn-kirim");
  var statusEl = document.getElementById("status-pesan");
  var hasilEl = document.getElementById("hasil-pesan");

  // Validasi form manual sebelum disable button
  var inputTemplate = document.getElementById("template-peta");
  var fileTemplateObj = inputTemplate && inputTemplate.files[0] ? inputTemplate.files[0] : null;

  var inputKoordinat = document.getElementById("file-koordinat");
  var fileKoordinatObj = inputKoordinat && inputKoordinat.files[0] ? inputKoordinat.files[0] : null;
  
  if (document.getElementById("jenis-peta").value === "Peta Titik Pengambilan Sampel") {
    if (!fileKoordinatObj) {
      var errKoor = document.getElementById("upload-error-koordinat");
      if (errKoor) errKoor.textContent = "File Koordinat wajib diisi.";
      return;
    }
  }

  btn.disabled = true;
  btn.textContent = "Mengirim...";
  statusEl.style.display = "none";
  hasilEl.style.display = "none";

  var kontakEl = document.getElementById("kontak");
  var pesanKhususEl = document.getElementById("pesan-khusus");

  var params = {
    action: "submitOrder",
    bahasa: document.getElementById("bahasa").value,
    nama: document.getElementById("nama").value,
    nim: document.getElementById("nim").value,
    programStudi: document.getElementById("program-studi").value,
    jenisPeta: document.getElementById("jenis-peta").value,
    jenisLokasi: document.getElementById("jenis-lokasi") ? document.getElementById("jenis-lokasi").value : "-",
    detailLokasi: document.getElementById("detail-lokasi") ? document.getElementById("detail-lokasi").value : "-",
    kontak: kontakEl ? kontakEl.value : "-",
    pesanKhusus: pesanKhususEl ? pesanKhususEl.value : "-"
  };

  Promise.all([
    readAsBase64(fileTemplateObj),
    readAsBase64(fileKoordinatObj)
  ]).then(function(results) {
    var resTemplate = results[0];
    var resKoordinat = results[1];

    if (resTemplate) {
      params.fileBase64 = resTemplate.base64;
      params.fileName = resTemplate.name;
      params.fileType = resTemplate.type;
    }
    if (resKoordinat) {
      params.koordinatBase64 = resKoordinat.base64;
      params.koordinatName = resKoordinat.name;
      params.koordinatType = resKoordinat.type;
    }

    apiPost(params, function (err, data) {
      handleResponPesanan(err, data, btn, statusEl, hasilEl);
    });
  }).catch(function() {
    handleResponPesanan("Gagal membaca file", null, btn, statusEl, hasilEl);
  });
}

function handleResponPesanan(err, data, btn, statusEl, hasilEl) {
  btn.disabled = false;
  btn.textContent = "Kirim Pesanan";

  if (err || !data || !data.success) {
    statusEl.className = "alert alert-error";
    statusEl.textContent = "Gagal mengirim pesanan. Coba lagi atau hubungi WhatsApp kami.";
    statusEl.style.display = "block";
    return;
  }

  hasilEl.querySelector(".order-id-display").textContent = data.orderId;
  hasilEl.style.display = "block";
  document.getElementById("form-pesan").reset();
  var uploadPreview = document.getElementById("upload-preview");
  if (uploadPreview) uploadPreview.style.display = "none";
  var uploadPreviewKoor = document.getElementById("upload-preview-koordinat");
  if (uploadPreviewKoor) uploadPreviewKoor.style.display = "none";
  var sectLokasi = document.getElementById("section-lokasi");
  if (sectLokasi) sectLokasi.style.display = "none";
  var sectKoor = document.getElementById("section-koordinat");
  if (sectKoor) sectKoor.style.display = "none";
  window.scrollTo({ top: hasilEl.offsetTop - 80, behavior: "smooth" });
}

function salinId(elId) {
  var el = document.getElementById(elId) || document.querySelector(".order-id-display");
  var teks = el ? el.textContent.trim() : "";
  if (!teks) return;
  navigator.clipboard.writeText(teks).then(function () {
    var btn = document.querySelector(".btn-salin");
    if (btn) {
      var asal = btn.textContent;
      btn.textContent = "Tersalin!";
      setTimeout(function () { btn.textContent = asal; }, 2000);
    }
  });
}


// ============================================================
// HALAMAN LACAK PESANAN
// ============================================================
function initLacak() {
  var formId = document.getElementById("form-lacak-id");
  var formNim = document.getElementById("form-lacak-nim");

  if (formId) {
    formId.addEventListener("submit", function (e) {
      e.preventDefault();
      lacakById();
    });
  }

  if (formNim) {
    formNim.addEventListener("submit", function (e) {
      e.preventDefault();
      lacakByNim();
    });
  }
}

function lacakById() {
  var id = document.getElementById("input-id").value.trim().toUpperCase();
  var hasilEl = document.getElementById("hasil-lacak-id");
  hasilEl.innerHTML = '<p class="loading">Mencari pesanan...</p>';

  apiGet({ action: "getOrder", id: id }, function (err, data) {
    if (err || !data || !data.success) {
      hasilEl.innerHTML = '<p class="alert alert-error">Pesanan dengan ID <strong>' + id + '</strong> tidak ditemukan.</p>';
      return;
    }
    var o = data.order;
    var statusClass = getStatusClass(o.status);
    hasilEl.innerHTML =
      '<div class="order-card">' +
        '<div class="order-card-header">' +
          '<span class="order-id">' + o.id + '</span>' +
          '<span class="badge ' + statusClass + '">' + o.status + '</span>' +
        '</div>' +
        '<div class="order-card-body">' +
          '<div class="order-row"><span>Nama</span><span>' + maskName(o.nama) + '</span></div>' +
          (o.jenisLokasi && o.jenisLokasi !== "-" ? '<div class="order-row"><span>Jenis Lokasi</span><span>' + o.jenisLokasi + '</span></div>' : '') +
          (o.detailLokasi && o.detailLokasi !== "-" ? '<div class="order-row"><span>Detail Lokasi</span><span>' + o.detailLokasi + '</span></div>' : '') +
          '<div class="order-row"><span>Tanggal Pesan</span><span>' + o.tanggalPesan + '</span></div>' +
        '</div>' +
      '</div>';
  });
}

function lacakByNim() {
  var nim = document.getElementById("input-nim").value.trim();
  var hasilEl = document.getElementById("hasil-lacak-nim");
  hasilEl.innerHTML = '<p class="loading">Mencari riwayat...</p>';

  apiGet({ action: "getOrdersByNIM", nim: nim }, function (err, data) {
    if (err || !data || !data.success || data.total === 0) {
      hasilEl.innerHTML = '<p class="alert alert-error">Tidak ada riwayat pesanan untuk NIM <strong>' + nim + '</strong>.</p>';
      return;
    }

    var html = '<p class="riwayat-info">Ditemukan <strong>' + data.total + '</strong> pesanan</p>';
    data.orders.forEach(function (o) {
      var statusClass = getStatusClass(o.status);
      html +=
        '<div class="riwayat-item">' +
          '<div class="riwayat-summary" onclick="toggleRiwayat(this)">' +
            '<div>' +
              '<span class="riwayat-id">' + o.id + '</span>' +
              '<span class="riwayat-peta">' + o.jenisPeta + '</span>' +
            '</div>' +
            '<div class="riwayat-kanan">' +
              '<span class="badge ' + statusClass + '">' + o.status + '</span>' +
              '<span class="riwayat-arrow">▼</span>' +
            '</div>' +
          '</div>' +
          '<div class="riwayat-detail">' +
            '<div class="order-row"><span>Nama</span><span>' + o.nama + '</span></div>' +
            '<div class="order-row"><span>NIM</span><span>' + o.nim + '</span></div>' +
            '<div class="order-row"><span>ID Pesanan</span>' +
              '<span>' + o.id + ' <button class="btn-salin-kecil" onclick="salinTeks(\'' + o.id + '\', this)">Salin</button></span>' +
            '</div>' +
            '<div class="order-row"><span>Tanggal</span><span>' + o.tanggalPesan + '</span></div>' +
            (o.catatanAdmin ? '<div class="order-row catatan"><span>Catatan</span><span>' + o.catatanAdmin + '</span></div>' : '') +
          '</div>' +
        '</div>';
    });
    hasilEl.innerHTML = html;
  });
}

function toggleRiwayat(el) {
  var item = el.parentElement;
  item.classList.toggle("open");
  var arrow = el.querySelector(".riwayat-arrow");
  if (arrow) arrow.textContent = item.classList.contains("open") ? "▲" : "▼";
}

function salinTeks(teks, btn) {
  navigator.clipboard.writeText(teks).then(function () {
    var asal = btn.textContent;
    btn.textContent = "Tersalin!";
    setTimeout(function () { btn.textContent = asal; }, 2000);
  });
}

function getStatusClass(status) {
  var map = {
    "Menunggu Konfirmasi": "badge-kuning",
    "Diproses": "badge-biru",
    "Menunggu Revisi": "badge-oranye",
    "Selesai": "badge-hijau",
    "Dibatalkan": "badge-merah"
  };
  return map[status] || "badge-abu";
}

function maskName(name) {
  if (!name || name === "-") return name;
  return name.split(" ").map(function(w) {
    if (w.length <= 2) return w.charAt(0) + "*";
    return w.substring(0, 2) + "*".repeat(w.length - 2);
  }).join(" ");
}
