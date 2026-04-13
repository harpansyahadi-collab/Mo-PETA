/**
 * ============================================================
 *  Mo-PETA — KONFIGURASI SPREADSHEET & ADMIN
 * ============================================================
 *
 *  CARA PENGGUNAAN:
 *  1. Buka Google Apps Script (script.google.com)
 *  2. Buat project baru, paste kode dari file: appscript/Code.gs
 *  3. Deploy sebagai Web App (Execute as: Me, Who has access: Anyone)
 *  4. Salin URL deployment-nya
 *  5. Paste URL tersebut di bawah ini sebagai nilai SPREADSHEET_API_URL
 *
 *  AKSES ADMIN:
 *  Buka: admin.html?kode=KODE_ANDA
 *  atau masukkan kode saat form login muncul.
 *
 * ============================================================
 */

const CONFIG = {
  // Ganti dengan URL Web App dari Google Apps Script Anda
  SPREADSHEET_API_URL: "MASUKKAN_URL_APPS_SCRIPT_ANDA_DI_SINI",

  // Nomor WhatsApp untuk redirect (format: 628xxxxxxxx tanpa + atau -)
  WHATSAPP_NUMBER: "6281234567890",

  // Nomor WhatsApp yang ditampilkan di footer
  WHATSAPP_DISPLAY: "+62 812-3456-7890",

  // Username Instagram
  INSTAGRAM: "@mopeta.id",

  // ============================================================
  // KODE AKSES ADMIN
  // Ganti dengan kode rahasia pilihan Anda (minimal 8 karakter)
  // Akses admin: admin.html?kode=KODE_ANDA
  // ============================================================
  ADMIN_CODE: "mopeta-admin-2025",
};

// Jangan ubah bagian di bawah ini
const IS_CONFIG_READY = CONFIG.SPREADSHEET_API_URL !== "MASUKKAN_URL_APPS_SCRIPT_ANDA_DI_SINI";
