# laporan-keuangan-bot
Laporan keuangan, pencataan pemasukkan dan pengeluaran dengan Bot Telegram yang terintegrasi dengan Google Spreadsheet

### Yang ada di bot
1. Input pemasukan: /masuk [nominal] [#kategori] [item1, item2, keterangan dsb.] <br>
   Contoh:  <br>
      /keluar 100000 #gaji angkut barang <br>
2. Input pengeluaran: /keluar [nominal] [#kategori] [item1, item2, keterangan dsb.] <br>
   Contoh:  <br>
      /keluar 50000 #makan roti dan kopi <br>
3. Rekapitulasi: /rekap [tanggal/bulan] [tanggal/bulan (opsional)] <br>
   Tanggal dan bulan berformat YYYY-MM-DD dan YYYY-MM <br>
   Contoh: <br>
      /rekap 2024-02-01<br>
      /rekap 2024-02-01 2024-02-10<br>
      /rekap 2024-02<br>
      /rekap 2024-02 2024-06<br>


# Mulai

## Buat Bot telegram
1. Buka telegram search @BotFather
2. Create New Bot /newbot
3. Masukkan nama kemudian username.
4. Setelah berhasil maka akan mendapatkan Bot Token.

## Buat Spreadsheet
Buat dua sheet untuk pemasukan dan pengeluaran dengan kolom:
1. ID
2. Tanggal
3. Kategori
4. Item
5. Nominal
6. ReporterID
7. ReporterName

## Buat Apps Script
1. Copy Kode.gs
2. Sesuaikan Token, Spreadsheet URL, dan Nama Sheet untuk pemasukan dan pengeluaran
3. Tambahkan Library dengan ID: <code>1CZD-ai-ImkabBPSBVOqnFFWlXoA5kUEfoXvUXOC3uQHr_qpF1H7amHMr</code>
4. Deploy sebagai Web app, dan simpan URL-nya

## Set webhook Bot Telegram
1. Buka di browser <code>https[]()://api.telegram.org/bot[token]/setwebhook?url=[url hasil deploy]?users=ChatID1,ChatID2,...</code><br>
Sesuaikan ChatID* dengan user yang akan menggunakan bot, bisa lebih dari satu, pisahkan dengan koma.

## *Note:
Untuk mendapatkan Chat ID, buka telegram, search @getYourID_bot atau https://t.me/getyourid_bot


## Contact
Telegram: https://t.me/mastgh <br>
WhatsApp: +62 851-5541-1484

## Donasi
Paypal tegohsx@gmail.com <br>
BRI 000401061441500 <br>
Jago 100310049829 <br>
DANA/GOPAY 085290465350 <br>
a/n Teguh S
