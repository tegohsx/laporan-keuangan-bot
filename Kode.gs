//CONFIG
var BOT_TOKEN = "6642440655:AADRAWN3nXcuJf5xJkSQLhyJgQXGag08cLc" //BOT TOKEN ANDA
var SS_URL = "https://docs.google.com/spreadsheets/d/1LArhvsBXZ8lJ3tzvx8DyYrFWwtRxlQsWQEFzdsyignw/edit#gid=0" //URL SPREADSHEET
var CREDIT_SHEET_NAME = "Pemasukan" //NAMA SHEET PEMASUKAN
var DEBIT_SHEET_NAME = "Pengeluaran" //NAMA SHEET PENGELUARAN

// Constants
const MESSAGES = {
  start: `Mulai laporan keuangan.
Pemasukan:
/masuk [nominal] [#kategori] [item1, item2 dst]
Pengeluaran:
/keluar [nominal] [#kategori] [item1, item2 dst]

Rekapitulasi: /rekap [tanggal/bulan] [tanggal/bulan (opsional)]
Tanggal dan bulan berformat YYYY-MM-DD dan YYYY-MM
Contoh: 
/rekap 2024-01-01
/rekap 2024-01-01 2024-01-10
/rekap 2024-01
/rekap 2024-01 2024-06`,
  formatError: {
    masuk: 'Gagal. Pastikan sesuai format. \n/masuk [harga] [#kategori] [item1, item2 dst]',
    keluar: 'Gagal. Pastikan sesuai format. \n/keluar [harga] [#kategori] [item1, item2 dst]',
    rekap: 'Gagal. Pastikan sesuai format. \n/rekap [tanggal/bulan] [tanggal/bulan (opsional)]\nTanggal dan bulan berformat YYYY-MM-DD dan YYYY-MM\nContoh: \n/rekap 2024-01-01\n/rekap 2024-01-01 2024-01-10\n/rekap 2024-01\n/rekap 2024-01 2024-06'
  },
  success: {
    masuk: 'Laporan pemasukan sukses.',
    keluar: 'Laporan pengeluaran sukses.'
  }
};

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
  const usersQuery = queryParameters?.users;
  
  if (!usersQuery) {
    Logger.log("No users parameter provided");
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No users parameter' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const validUsers = usersQuery.split(',');
  
  try {
    if (e.postData.type == "application/json") {
      let update = JSON.parse(e.postData.contents);
      if (update) {
        commands(update, validUsers);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (error) {
    Logger.log(`Error in doPost: ${error.message}`);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function validateInput(nominal, kategori, item) {
  if (!nominal || isNaN(nominal) || nominal <= 0) {
    return "Nominal harus berupa angka positif";
  }
  if (!kategori || typeof kategori !== 'string') {
    return "Kategori tidak valid";
  }
  if (!item || typeof item !== 'string' || item.trim() === '') {
    return "Item tidak boleh kosong";
  }
  return null;
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim();
}

function handleTransaction(type, data) {
  const collection = type === 'masuk' ? Credit : Debit;
  const { _date, tanggal, kategori, nominal, item, chatId, first_name } = data;
  
  try {
    collection.insert({
      _date,
      Tanggal: tanggal,
      Kategori: kategori,
      Nominal: nominal,
      Item: item,
      ReporterID: chatId,
      ReporterName: first_name
    });
    
    return true;
  } catch (error) {
    Logger.log(`Error in ${type}: ${error.message}`);
    return false;
  }
}

function commands(update, validUsers) {
  const chatId = update.message.chat.id;
  const first_name = update.message.chat.first_name;
  const text = update.message.text || '';
  const tanggal = new Date().toLocaleString();
  const _date = new Date().toJSON();

  if (!validUsers.includes(String(chatId))) {
    return;
  }

  if (text.startsWith("/start")) {
    sendMessage({
      chat_id: chatId,
      text: MESSAGES.start
    });
    return;
  }

  const handleInputCommand = (type) => {
    const stext = text.split(' ');
    const nominal = Number(stext[1]);
    const kategori = stext[2]?.startsWith('#') ? stext[2].replace('#', '') : '';
    
    stext.splice(0, 3);
    const item = sanitizeInput(stext.join(' '));

    const validationError = validateInput(nominal, kategori, item);
    if (validationError) {
      sendMessage({
        chat_id: chatId,
        text: validationError
      });
      return;
    }

    const success = handleTransaction(type, {
      _date,
      tanggal,
      kategori,
      nominal,
      item,
      chatId,
      first_name
    });

    sendMessage({
      chat_id: chatId,
      text: success ? MESSAGES.success[type] : MESSAGES.formatError[type]
    });
  };

  if (text.startsWith("/masuk")) {
    handleInputCommand('masuk');
  } else if (text.startsWith("/keluar")) {
    handleInputCommand('keluar');
  } else if (text.startsWith("/rekap")) {
    const stext = text.split(' ');
    stext.splice(0, 1);

    const oDateRange = Collection.generateDateRange(stext.join(' '));
    const dataRange = oDateRange.dateRange;
    const sumType = oDateRange.sumType;
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    if (dataRange.length > 0) {
      let textToSend = "Rekapitulasi: \n";

      for (let _date of dataRange) {
        const pengeluaran = Debit.find(
          {
            _date: d => new Date(d) >= _date.from && new Date(d) < _date.to
          }
        );

        const pemasukan = Credit.find(
          {
            _date: d => new Date(d) >= _date.from && new Date(d) < _date.to
          }
        );

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
          let dateTo = new Date(_date.to);
          dateTo.setDate(dateTo.getDate() - 1);
          textToSend += "Pemasukan " + _date.from.toLocaleDateString() + ' s.d ' + dateTo.toLocaleDateString() + "\n";
          textToSend += Object.keys(rekapMasuk).map((i) => `${i}: ${Number(rekapMasuk[i]).toLocaleString('id-ID')}`).join('\n') || '---';
          textToSend += '\nTotal: ' + Object.values(rekapMasuk).reduce((acc, value) => acc + value, 0).toLocaleString('id-ID');
          textToSend += "\n\n";
          textToSend += "Pengeluaran " + _date.from.toLocaleDateString() + ' s.d ' + dateTo.toLocaleDateString() + "\n";
          textToSend += Object.keys(rekapKeluar).map((i) => `${i}: ${Number(rekapKeluar[i]).toLocaleString('id-ID')}`).join('\n') || '---';
          textToSend += '\nTotal: ' + Object.values(rekapKeluar).reduce((acc, value) => acc + value, 0).toLocaleString('id-ID');
          textToSend += "\n\n";
        } else {
          textToSend += "Pemasukan bulan " + monthNames[_date.from.getMonth()] + ' ' + _date.from.getFullYear() + "\n";
          textToSend += Object.keys(rekapMasuk).map((i) => `${i}: ${Number(rekapMasuk[i]).toLocaleString('id-ID')}`).join('\n') || '---';
          textToSend += '\nTotal: ' + Object.values(rekapMasuk).reduce((acc, value) => acc + value, 0).toLocaleString('id-ID');
          textToSend += "\n\n";
          textToSend += "Pengeluaran bulan " + monthNames[_date.from.getMonth()] + ' ' + _date.from.getFullYear() + "\n";
          textToSend += Object.keys(rekapKeluar).map((i) => `${i}: ${Number(rekapKeluar[i]).toLocaleString('id-ID')}`).join('\n') || '---';
          textToSend += '\nTotal: ' + Object.values(rekapKeluar).reduce((acc, value) => acc + value, 0).toLocaleString('id-ID');
          textToSend += "\n\n";
        }
      }

      sendMessage({
        chat_id: chatId,
        text: textToSend
      });
    } else {
      sendMessage({
        chat_id: chatId,
        text: MESSAGES.formatError.rekap
      });
    }
  }
}

function sendMessage(postdata) {
  const maxRetries = 3;
  const delayBetweenRetries = 1000; // 1 second
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(postdata),
        'muteHttpExceptions': true
      };
      
      const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', options);
      const responseCode = response.getResponseCode();
      
      if (responseCode === 200) {
        return true;
      }
      
      if (responseCode === 429) { // Too Many Requests
        Utilities.sleep(delayBetweenRetries);
        continue;
      }
      
      Logger.log(`Failed to send message. Response code: ${responseCode}`);
      return false;
      
    } catch (error) {
      Logger.log(`Error sending message: ${error.message}`);
      Utilities.sleep(delayBetweenRetries);
    }
  }
  return false;
}