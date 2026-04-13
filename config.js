/**
 * ============================================================
 *  Mo-PETA — config.js
 *
 *  CARA SETUP:
 *  1. Jalankan setupSheet() di Google Apps Script (appscript/Code.gs)
 *  2. Deploy sebagai Web App (Execute as: Me, Who has access: Anyone)
 *  3. Salin URL Web App dan isi ke SPREADSHEET_API_URL di bawah
 *
 *  AKSES ADMIN: admin.html?kode=KODE_ANDA
 * ============================================================
 */

const CONFIG = {
  /* URL Web App dari Google Apps Script — wajib diisi */
  SPREADSHEET_API_URL: "https://script.google.com/macros/s/AKfycbyPLx94vcE3JkfoVPlAWtgXRC3zO0UnWXag_tuPpEjqlFsn2MxvXJEe-GWlFGBDpS5K/exec",

  /* Nomor WhatsApp (format: 628xxx, tanpa + atau spasi) */
  WHATSAPP_NUMBER: "6281275540985",

  /* Tampilan nomor WA di footer */
  WHATSAPP_DISPLAY: "+62 812-7554-0985",

  /* Username Instagram */
  INSTAGRAM: "@mopeta.id",

  /* Kode akses admin — samakan dengan ADMIN_CODE di Code.gs */
  ADMIN_CODE: "0delapan5dua",
};

/* Jangan ubah baris ini */
const IS_CONFIG_READY = CONFIG.SPREADSHEET_API_URL !== "https://script.google.com/macros/s/AKfycbyPLx94vcE3JkfoVPlAWtgXRC3zO0UnWXag_tuPpEjqlFsn2MxvXJEe-GWlFGBDpS5K/exec";
