import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

let rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
  rawKey = rawKey.slice(1, -1);
} else if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
  rawKey = rawKey.slice(1, -1);
}
rawKey = rawKey.replace(/\\n/g, '\n');

const jwt = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: rawKey,
  scopes: SCOPES,
});

const applyFormatting = async (sheet, rowCount, colCount, title, isApplications) => {
  await sheet.updateProperties({
    gridProperties: {
      frozenRowCount: 2,
    }
  });

  const endCol = String.fromCharCode(65 + colCount - 1);
  await sheet.loadCells(`A1:${endCol}${rowCount}`);

  const titleCell = sheet.getCell(0, 0);
  titleCell.value = title;
  titleCell.textFormat = { fontSize: 18, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } };
  titleCell.backgroundColor = { red: 30/255, green: 58/255, blue: 138/255 };
  titleCell.horizontalAlignment = 'CENTER';
  titleCell.verticalAlignment = 'MIDDLE';
  await sheet.mergeCells({ startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount });

  for (let c = 0; c < colCount; c++) {
    const cell = sheet.getCell(1, c);
    cell.textFormat = { fontSize: 11, bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } };
    cell.backgroundColor = { red: 30/255, green: 41/255, blue: 59/255 };
    cell.horizontalAlignment = 'CENTER';
    cell.verticalAlignment = 'MIDDLE';
  }

  for (let r = 2; r < rowCount; r++) {
    const isEven = (r - 2) % 2 === 0;
    const bg = isEven ? { red: 240/255, green: 244/255, blue: 255/255 } : { red: 1, green: 1, blue: 1 };
    
    for (let c = 0; c < colCount; c++) {
      const cell = sheet.getCell(r, c);
      cell.backgroundColor = bg;
      cell.verticalAlignment = 'MIDDLE';
      if (c === 0) cell.horizontalAlignment = 'CENTER'; 
      
      if (isApplications) {
        if (c === 6) { 
          const val = cell.value;
          if (val === 'ACTIVE') cell.textFormat = { bold: true, foregroundColor: { red: 21/255, green: 128/255, blue: 61/255 } };
          else if (val === 'REJECTED') cell.textFormat = { bold: true, foregroundColor: { red: 220/255, green: 38/255, blue: 38/255 } };
          else if (val === 'INTERVIEW') cell.textFormat = { bold: true, foregroundColor: { red: 37/255, green: 99/255, blue: 235/255 } };
          else if (val === 'DRAFT') cell.textFormat = { bold: true, foregroundColor: { red: 217/255, green: 119/255, blue: 6/255 } };
        }
        if (c === 7) { 
          const val = cell.value;
          if (val === 'SUCCESS') cell.textFormat = { bold: true, foregroundColor: { red: 21/255, green: 128/255, blue: 61/255 } };
          else if (val === 'FAILED') cell.textFormat = { bold: true, foregroundColor: { red: 220/255, green: 38/255, blue: 38/255 } };
          else if (val === 'PENDING') cell.textFormat = { bold: true, foregroundColor: { red: 217/255, green: 119/255, blue: 6/255 } };
        }
      } else {
        if (c === 6) { 
          const val = cell.value;
          if (val === 'SUCCESS') cell.textFormat = { bold: true, foregroundColor: { red: 21/255, green: 128/255, blue: 61/255 } };
          else if (val === 'FAILED') cell.textFormat = { bold: true, foregroundColor: { red: 220/255, green: 38/255, blue: 38/255 } };
          else if (val === 'PENDING') cell.textFormat = { bold: true, foregroundColor: { red: 217/255, green: 119/255, blue: 6/255 } };
        }
        if (c === 5) cell.horizontalAlignment = 'RIGHT';
      }
    }
  }
  await sheet.saveUpdatedCells();
};

export const syncApplicationsToSheets = async (applications) => {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID_APPLICATIONS, jwt);
  await doc.loadInfo();
  let sheet = doc.sheetsByTitle['Applications'];
  if (!sheet) {
    sheet = doc.sheetsByIndex[0];
    await sheet.updateProperties({ title: 'Applications' });
  }
  await sheet.clear();

  const allRows = [
    ['Recruitment-2026 Applications'],
    ['S.No.', 'Name', 'Email', 'Phone', 'Primary Department', 'Secondary Departments', 'Application Status', 'Payment Status', 'Applied At', 'Payment Date']
  ];

  applications.forEach((app, index) => {
    allRows.push([
      index + 1,
      app.userId?.userName || "N/A",
      app.userId?.email || "N/A",
      app.userId?.phoneNumber || "N/A",
      app.preferredDepartmentId?.name || "N/A",
      app.secondaryDepartmentId?.map((d) => d.name).join(", ") || "—",
      app.status,
      app.paymentStatus,
      new Date(app.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
      app.paymentStatus === "SUCCESS" ? new Date(app.updatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—"
    ]);
  });
  await sheet.setHeaderRow(allRows[0]);
  await sheet.addRows(allRows.slice(1), { raw: true, insert: false });
  await applyFormatting(sheet, allRows.length, allRows[1].length, 'Recruitment-2026 Applications', true);
};

export const syncPaymentsToSheets = async (payments) => {
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID_PAYMENTS, jwt);
  await doc.loadInfo();
  let sheet = doc.sheetsByTitle['Payments'];
  if (!sheet) {
    sheet = doc.sheetsByIndex[0];
    await sheet.updateProperties({ title: 'Payments' });
  }
  await sheet.clear();

  const allRows = [
    ['Recruitment-2026 Payments'],
    ['S.No.', 'Name', 'Email', 'Phone', 'UTR / Payment ID', 'Amount (₹)', 'Payment Status', 'Purpose', 'Date & Time']
  ];

  payments.forEach((payment, index) => {
    allRows.push([
      index + 1,
      payment.userId?.userName || "N/A",
      payment.userId?.email || "N/A",
      payment.userId?.phoneNumber || "N/A",
      payment.utr || payment.gatewayPaymentId || payment.gatewayOrderId || "N/A",
      (payment.amount / 100).toFixed(2),
      payment.status,
      payment.purpose?.toUpperCase() || "N/A",
      new Date(payment.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
    ]);
  });
  await sheet.setHeaderRow(allRows[0]);
  await sheet.addRows(allRows.slice(1), { raw: true, insert: false });
  await applyFormatting(sheet, allRows.length, allRows[1].length, 'Recruitment-2026 Payments', false);
};
