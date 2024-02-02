//CONFIG
var BOT_TOKEN = "6642440695:AAFRAWN3nXcuJf5xJkSQLhyJgQXGag08cLc" //BOT TOKEN ANDA
var SS_URL = "https://docs.google.com/spreadsheets/d/1LABhvsBXZ8lJ3tzvx8DyYrFWwtRxlQsWQEFzdsyignw/edit#gid=0" //URL SPREADSHEET
var CREDIT_SHEET_NAME = "Pemasukan" //NAMA SHEET PEMASUKAN
var DEBIT_SHEET_NAME = "Pengeluaran" //NAMA SHEET PENGELUARAN


//BEGIN
const ss = SpreadsheetApp.openByUrl(SS_URL);
const creditSheet = ss.getSheetByName(CREDIT_SHEET_NAME);
const debitSheet = ss.getSheetByName(DEBIT_SHEET_NAME);
const Credit = new Collection.Collect(creditSheet)
const Debit = new Collection.Collect(debitSheet)

function doGet(e) {
  return HtmlService.createHtmlOutput('<h1>OK</h1>')
}

function doPost(e) {
  const queryParameters = e.parameter;
  const usersQuery = queryParameters.users
  const validUsers = usersQuery.split(',')
  try {
    if (e.postData.type == "application/json") {
      let update = JSON.parse(e.postData.contents);
      if (update) {
        commands(update, validUsers)
        return true
      }
    }
  } catch (e) {
    Logger.log(e)
  }
}

function commands(update, validUsers) {

  const chatId = update.message.chat.id;
  const first_name = update.message.chat.first_name;
  const text = update.message.text || '';
  const tanggal = new Date().toLocaleString();
  const _date = new Date().toJSON()

  if (validUsers.includes(String(chatId))) {

    if (text.startsWith("/start")) {
      sendMessage({
        chat_id: chatId,
        text: "Mulai laporan keuangan.\nPemasukan:\n/masuk [nominal] [#kategori] [item1, item2 dst]\nPengeluaran:\n/keluar [nominal] [#kategori] [item1, item2 dst]\n\nRekapitulasi: /rekap [tanggal/bulan] [tanggal/bulan (opsional)]\nTanggal dan bulan berformat YYYY-MM-DD dan YYYY-MM\nContoh: \n/rekap 2024-01-01\n/rekap 2024-01-01 2024-01-10\n/rekap 2024-01\n/rekap 2024-01 2024-06"
      })
    } else if (text.startsWith("/masuk")) {
      const stext = text.split(' ')

      const nominal = Number(stext[1]);
      const kategori = stext[2].startsWith('#') ? stext[2].replace('#', '') : '';

      stext.splice(0, 3);
      const item = stext.join(' ')

      if (nominal && kategori && item) {

        Credit.insert(
          {
            _date,
            Tanggal: tanggal,
            Kategori: kategori,
            Nominal: nominal,
            Item: item,
            ReporterID: chatId,
            ReporterName: first_name
          }
        )

        sendMessage({
          chat_id: chatId,
          text: 'Laporan pemasukan sukses.'
        })

      } else {
        sendMessage({
          chat_id: chatId,
          text: 'Gagal. Pastikan sesuai format. \n/masuk [harga] [#kategori] [item1, item2 dst]'
        })
      }
    } else if (text.startsWith("/keluar")) {
      const stext = text.split(' ')

      const nominal = Number(stext[1]);
      const kategori = stext[2].startsWith('#') ? stext[2].replace('#', '') : '';

      stext.splice(0, 3);
      const item = stext.join(' ')

      if (nominal && kategori && item) {

        Debit.insert(
          {
            _date,
            Tanggal: tanggal,
            Kategori: kategori,
            Nominal: nominal,
            Item: item,
            ReporterID: chatId,
            ReporterName: first_name
          }
        )

        sendMessage({
          chat_id: chatId,
          text: 'Laporan pengeluaran sukses.'
        })

      } else {
        sendMessage({
          chat_id: chatId,
          text: 'Gagal. Pastikan sesuai format. \n/keluar [harga] [#kategori] [item1, item2 dst]'
        })
      }
    } else if (text.startsWith("/rekap")) {
      const stext = text.split(' ')
      stext.splice(0, 1);

      const oDateRange = Collection.generateDateRange(stext.join(' '))
      const dataRange = oDateRange.dateRange
      const sumType = oDateRange.sumType
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

      if (dataRange.length > 0) {
        let textToSend = "Rekapitulasi: \n"

        for (let _date of dataRange) {
          const pengeluaran = Debit.find(
            {
              _date: d => new Date(d) >= _date.from && new Date(d) < _date.to
            }
          )

          const pemasukan = Credit.find(
            {
              _date: d => new Date(d) >= _date.from && new Date(d) < _date.to
            }
          )

          let rekapMasuk = pemasukan.reduce((acc, item) => {
            if (!acc[item.Kategori]) {
              acc[item.Kategori] = 0;
            }
            acc[item.Kategori] += item.Nominal;
            return acc;
          }, {});

          let rekapKeluar = pengeluaran.reduce((acc, item) => {
            if (!acc[item.Kategori]) {
              acc[item.Kategori] = 0;
            }
            acc[item.Kategori] += item.Nominal;
            return acc;
          }, {});

          if (sumType == 'daily') {
            let dateTo = new Date(_date.to)
            dateTo.setDate(dateTo.getDate() - 1)
            textToSend += "Pemasukan " + _date.from.toLocaleDateString() + ' s.d ' + dateTo.toLocaleDateString() + "\n"
            textToSend += Object.keys(rekapMasuk).map((i) => `${i}: ${Number(rekapMasuk[i]).toLocaleString('id-ID')}`).join('\n') || '---'
            textToSend += '\nTotal: ' + Object.values(rekapMasuk).reduce((acc, value) => acc + value, 0).toLocaleString('id-ID');
            textToSend += "\n"
            textToSend += "\n"
            textToSend += "Pengeluaran " + _date.from.toLocaleDateString() + ' s.d ' + dateTo.toLocaleDateString() + "\n"
            textToSend += Object.keys(rekapKeluar).map((i) => `${i}: ${Number(rekapKeluar[i]).toLocaleString('id-ID')}`).join('\n') || '---'
            textToSend += '\nTotal: ' + Object.values(rekapKeluar).reduce((acc, value) => acc + value, 0).toLocaleString('id-ID');
            textToSend += "\n"
            textToSend += "\n"

          }
          else {
            textToSend += "Pemasukan bulan " + monthNames[_date.from.getMonth()] + ' ' + _date.from.getFullYear() + "\n"

            textToSend += Object.keys(rekapMasuk).map((i) => `${i}: ${Number(rekapMasuk[i]).toLocaleString('id-ID')}`).join('\n') || '---'
            textToSend += '\nTotal: ' + Object.values(rekapMasuk).reduce((acc, value) => acc + value, 0).toLocaleString('id-ID');
            textToSend += "\n"

            textToSend += "\n"

            textToSend += "Pengeluaran bulan " + monthNames[_date.from.getMonth()] + ' ' + _date.from.getFullYear() + "\n"

            textToSend += Object.keys(rekapKeluar).map((i) => `${i}: ${Number(rekapKeluar[i]).toLocaleString('id-ID')}`).join('\n') || '---'
            textToSend += '\nTotal: ' + Object.values(rekapKeluar).reduce((acc, value) => acc + value, 0).toLocaleString('id-ID');
            textToSend += "\n"

            textToSend += "\n"
          }
        }

        sendMessage({
          chat_id: chatId,
          text: textToSend
        })

      } else {
        sendMessage({
          chat_id: chatId,
          text: 'Gagal. Pastikan sesuai format. \n/rekap [tanggal/bulan] [tanggal/bulan (opsional)]\nTanggal dan bulan berformat YYYY-MM-DD dan YYYY-MM\nContoh: \n/rekap 2024-01-01\n/rekap 2024-01-01 2024-01-10\n/rekap 2024-01\n/rekap 2024-01 2024-06'
        })
      }
    }
  }
}

function sendMessage(postdata) {
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(postdata),
    'muteHttpExceptions': true
  };
  UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', options);
}
