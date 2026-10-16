/**
 * Google Apps Script (GAS) Spreadsheet Integration
 * Masukkan URL Web App hasil deploy Google Apps Script Anda pada variabel SCRIPT_URL di bawah ini:
 */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwLfpdkrydi2FFWgPIi0LE_37GFbZQKvBE3YvXVpNe66aFRxONXhNdhVdcTRudi8FD4/exec";

// Tangani parameter URL ?to=NamaTamu
const params = new URLSearchParams(document.location.search);
let guest = params.get("to");

if (guest) {
    $("#receiverName").text(guest);
    $("#guestName").val(guest);
}

// Handler pengiriman pesan / doa restu
$("#guestForm").on("submit", async function (e) {
    e.preventDefault();

    const name = $("#guestName").val().trim();
    const message = $("#message").val().trim();
    const submitBtn = $("#guestForm button[type=submit]");

    if (!name || !message) {
        if (typeof toastr !== "undefined") {
            toastr.warning("Harap isi nama dan pesan/doa Anda.");
        } else {
            alert("Harap isi nama dan pesan/doa Anda.");
        }
        return;
    }

    if (SCRIPT_URL === "URL_GOOGLE_APPS_SCRIPT_ANDA" || !SCRIPT_URL.startsWith("http")) {
        if (typeof toastr !== "undefined") {
            toastr.info("Silakan pasang URL Google Apps Script Anda pada variabel SCRIPT_URL di berkas js/script.js");
        } else {
            alert("Silakan pasang URL Google Apps Script pada js/script.js");
        }
        return;
    }

    // Ubah status tombol saat mengirim
    const originalBtnText = submitBtn.html();
    submitBtn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span> Mengirim...');

    try {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("message", message);

        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: formData
        });

        if (typeof toastr !== "undefined") {
            toastr.success("Terima kasih! Doa dan ucapan Anda berhasil dikirim.");
        }
        $("#message").val("");

        // Beri jeda 1.2 detik agar Spreadsheet selesai menulis baris baru sebelum ditarik kembali
        setTimeout(loadMessages, 1200);
    } catch (err) {
        console.error("Gagal mengirim doa/ucapan:", err);
        if (typeof toastr !== "undefined") {
            toastr.error("Terjadi kendala saat mengirim pesan. Silakan coba kembali.");
        }
    } finally {
        submitBtn.prop("disabled", false).html(originalBtnText);
    }
});

// Fungsi untuk menarik dan menampilkan seluruh ucapan dari Google Spreadsheet
async function loadMessages() {
    if (SCRIPT_URL === "URL_GOOGLE_APPS_SCRIPT_ANDA" || !SCRIPT_URL.startsWith("http")) {
        $("#message-div").html(`
            <div class="col-md-10 text-center text-muted py-4">
                <p class="mb-0"><em>(Hubungkan Google Apps Script Web App pada <code>js/script.js</code> untuk menampilkan ucapan dari spreadsheet)</em></p>
            </div>
        `);
        return;
    }

    try {
        $("#message-div").html(`
            <div class="col-12 text-center text-muted py-4">
                <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
                <span class="ml-2">Memuat ucapan & doa...</span>
            </div>
        `);

        // Cachebuster (?t=...) agar browser selalu mengambil data paling segar dari Spreadsheet
        const response = await fetch(SCRIPT_URL + "?action=read&t=" + Date.now());
        const data = await response.json();

        $("#message-div").empty();

        if (!Array.isArray(data) || data.length === 0) {
            $("#message-div").html(`
                <div class="col-12 text-center text-muted py-4">
                    <p class="mb-0">Belum ada ucapan. Jadilah yang pertama memberikan doa restu!</p>
                </div>
            `);
            return;
        }

        // Tampilkan ucapan terbaru di paling atas
        const latestMessages = [...data].reverse();

        latestMessages.forEach(item => {
            const name = item.name || "Tamu Undangan";
            const message = item.message || "";
            const timestamp = item.timestamp || "";
            const avatar = `https://na.ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=50&background=111&color=ffffff`;

            const cardHtml = `
                <div class="col-md-10 col-12 mb-3">
                    <div class="media p-3 media-comment shadow-sm bg-white rounded">
                        <img class="rounded-circle mr-3 d-none d-sm-block" src="${avatar}" alt="${escapeHtml(name)}" width="45" height="45">
                        <div class="media-body">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <h6 class="mb-0 font-weight-bold text-dark">${escapeHtml(name)}</h6>
                                <small class="text-muted" style="font-size: 0.75rem;">${escapeHtml(timestamp)}</small>
                            </div>
                            <p class="mb-0 text-secondary" style="font-size: 0.92rem; white-space: pre-wrap;">${escapeHtml(message)}</p>
                        </div>
                    </div>
                </div>
            `;
            $("#message-div").append(cardHtml);
        });
    } catch (err) {
        console.error("Gagal memuat ucapan:", err);
        $("#message-div").html(`
            <div class="col-12 text-center text-muted py-3">
                <small>Belum dapat memuat ucapan saat ini.</small>
            </div>
        `);
    }
}

// Fungsi pencegah XSS Injection
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Jalankan otomatis saat halaman selesai dimuat
$(document).ready(function () {
    loadMessages();
});