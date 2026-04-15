// ============================================================
// Mo-PETA — Konfigurasi & Fungsi Utama
// ============================================================

var CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbx_BBwJLfZjJO0VJrWrXVMquDoz6UHhiNfm_7_p1ju7Rn60XCs7RdchoUp9x-Lw8nqXFw/exec",
  WHATSAPP: "6281275540985",   // ← Ganti dengan nomor WhatsApp
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


// ============================================================
// HALAMAN PESAN
// ============================================================
function initFormPesan() {
  var form = document.getElementById("form-pesan");
  if (!form) return;

  var jenisPetaSelect = document.getElementById("jenis-peta");
  var sectionLokasi = document.getElementById("section-lokasi");
  var sectionWa = document.getElementById("section-wa");
  var jenisLokasiSelect = document.getElementById("jenis-lokasi");
  var sectionDetailLokasi = document.getElementById("section-detail-lokasi");
  var labelDetail = document.getElementById("label-detail");

  jenisPetaSelect.addEventListener("change", function () {
    var val = this.value;
    if (val === "Peta Lokasi Penelitian") {
      sectionLokasi.style.display = "block";
      sectionWa.style.display = "none";
      updateDetailLabel();
    } else if (val === "Peta Titik Pengambilan Sampel") {
      sectionLokasi.style.display = "none";
      sectionWa.style.display = "block";
    } else {
      sectionLokasi.style.display = "none";
      sectionWa.style.display = "none";
    }
  });

  jenisLokasiSelect.addEventListener("change", updateDetailLabel);

  function updateDetailLabel() {
    var jl = jenisLokasiSelect.value;
    if (jl === "Wilayah") {
      labelDetail.textContent = "Nama Wilayah";
      document.getElementById("detail-lokasi").placeholder = "Contoh: Kecamatan Bogor Utara, Kota Bogor";
    } else if (jl === "Nama Tempat (Institusi/Lembaga)") {
      labelDetail.textContent = "Nama Institusi / Lembaga";
      document.getElementById("detail-lokasi").placeholder = "Contoh: IPB University, Bogor";
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

  var btnWa = document.getElementById("btn-wa-sampel");
  if (btnWa) {
    btnWa.addEventListener("click", function () {
      var pesan = "Halo Mo-PETA! Saya ingin memesan Peta Titik Pengambilan Sampel.";
      window.open("https://wa.me/" + CONFIG.WHATSAPP + "?text=" + encodeURIComponent(pesan), "_blank");
    });
  }
}

function kirimPesanan() {
  var btn = document.getElementById("btn-kirim");
  var statusEl = document.getElementById("status-pesan");
  var hasilEl = document.getElementById("hasil-pesan");

  btn.disabled = true;
  btn.textContent = "Mengirim...";
  statusEl.style.display = "none";
  hasilEl.style.display = "none";

  var params = {
    action: "submitOrder",
    bahasa: document.getElementById("bahasa").value,
    nama: document.getElementById("nama").value,
    nim: document.getElementById("nim").value,
    programStudi: document.getElementById("program-studi").value,
    jenisPeta: document.getElementById("jenis-peta").value,
    jenisLokasi: document.getElementById("jenis-lokasi") ? document.getElementById("jenis-lokasi").value : "-",
    detailLokasi: document.getElementById("detail-lokasi") ? document.getElementById("detail-lokasi").value : "-"
  };

  apiGet(params, function (err, data) {
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
    document.getElementById("section-lokasi").style.display = "none";
    document.getElementById("section-wa").style.display = "none";
    window.scrollTo({ top: hasilEl.offsetTop - 80, behavior: "smooth" });
  });
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
          '<div class="order-row"><span>Nama</span><span>' + o.nama + '</span></div>' +
          '<div class="order-row"><span>NIM</span><span>' + o.nim + '</span></div>' +
          '<div class="order-row"><span>Program Studi</span><span>' + o.programStudi + '</span></div>' +
          '<div class="order-row"><span>Jenis Peta</span><span>' + o.jenisPeta + '</span></div>' +
          (o.jenisLokasi && o.jenisLokasi !== "-" ? '<div class="order-row"><span>Jenis Lokasi</span><span>' + o.jenisLokasi + '</span></div>' : '') +
          (o.detailLokasi && o.detailLokasi !== "-" ? '<div class="order-row"><span>Detail Lokasi</span><span>' + o.detailLokasi + '</span></div>' : '') +
          '<div class="order-row"><span>Tanggal Pesan</span><span>' + o.tanggalPesan + '</span></div>' +
          (o.catatanAdmin ? '<div class="order-row catatan"><span>Catatan</span><span>' + o.catatanAdmin + '</span></div>' : '') +
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
