import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

let rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
  rawKey = rawKey.slice(1, -1);
} else if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
  rawKey = rawKey.slice(1, -1);
}
rawKey = rawKey.replace(/\\n/g, "\n");

const jwt = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: rawKey,
  scopes: SCOPES,
});

const loadDocWithAuthCheck = async (spreadsheetId) => {
  const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
  try {
    await doc.loadInfo();
    return doc;
  } catch (error) {
    if (
      error.status === 403 ||
      error.message?.includes("403") ||
      error.message?.includes("permission")
    ) {
      throw new Error(
        `Google Sheet access denied (403). Please share the spreadsheet with Editor permissions to: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`,
      );
    }
    throw error;
  }
};

const getColLetter = (index) => {
  let letter = "";
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

const applyFormatting = async (
  sheet,
  rowCount,
  colCount,
  title,
  mode = "applications",
) => {
  await sheet.updateProperties({
    gridProperties: {
      frozenRowCount: 2,
    },
  });

  const endCol = getColLetter(colCount - 1);
  await sheet.loadCells(`A1:${endCol}${rowCount}`);

  const titleCell = sheet.getCell(0, 0);
  titleCell.value = title;
  titleCell.textFormat = {
    fontSize: 16,
    bold: true,
    foregroundColor: { red: 1, green: 1, blue: 1 },
  };
  titleCell.backgroundColor = {
    red: 30 / 255,
    green: 58 / 255,
    blue: 138 / 255,
  };
  titleCell.horizontalAlignment = "CENTER";
  titleCell.verticalAlignment = "MIDDLE";
  await sheet.mergeCells({
    startRowIndex: 0,
    endRowIndex: 1,
    startColumnIndex: 0,
    endColumnIndex: colCount,
  });

  for (let c = 0; c < colCount; c++) {
    const cell = sheet.getCell(1, c);
    cell.textFormat = {
      fontSize: 11,
      bold: true,
      foregroundColor: { red: 1, green: 1, blue: 1 },
    };
    cell.backgroundColor = { red: 30 / 255, green: 41 / 255, blue: 59 / 255 };
    cell.horizontalAlignment = "CENTER";
    cell.verticalAlignment = "MIDDLE";
  }

  for (let r = 2; r < rowCount; r++) {
    const isEven = (r - 2) % 2 === 0;
    const bg = isEven
      ? { red: 240 / 255, green: 244 / 255, blue: 255 / 255 }
      : { red: 1, green: 1, blue: 1 };

    for (let c = 0; c < colCount; c++) {
      const cell = sheet.getCell(r, c);
      cell.backgroundColor = bg;
      cell.verticalAlignment = "MIDDLE";
      if (c === 0) cell.horizontalAlignment = "CENTER";

      cell.textFormat = {
        bold: false,
        foregroundColor: { red: 0, green: 0, blue: 0 },
      };

      const val = (cell.value || "").toString().toUpperCase();

      if (val === "ACTIVE" || val === "CONFIRMED" || val === "SUCCESS") {
        cell.textFormat = {
          bold: true,
          foregroundColor: { red: 21 / 255, green: 128 / 255, blue: 61 / 255 },
        };
      } else if (val === "REJECTED" || val === "FAILED") {
        cell.textFormat = {
          bold: true,
          foregroundColor: { red: 220 / 255, green: 38 / 255, blue: 38 / 255 },
        };
      } else if (val === "PENDING" || val === "UNDER_REVIEW") {
        cell.textFormat = {
          bold: true,
          foregroundColor: { red: 217 / 255, green: 119 / 255, blue: 6 / 255 },
        };
      } else if (val === "INTERVIEW") {
        cell.textFormat = {
          bold: true,
          foregroundColor: { red: 37 / 255, green: 99 / 255, blue: 235 / 255 },
        };
      }
    }
  }

  await sheet.saveUpdatedCells();

  let colWidths = [];
  if (mode === "applications") {
    colWidths = [50, 150, 240, 240, 150, 180, 200, 140, 140, 180, 180];
  } else if (mode === "event_registrations") {
    colWidths = [
      50, 160, 90, 80, 100, 220, 200, 140, 160, 100, 110, 130, 110, 80, 110, 160, 140, 120,
      120, 160, 90, 180, 180, 160,
    ];
  } else if (mode === "payments_event") {
    colWidths = [50, 160, 90, 80, 100, 220, 140, 180, 120, 180, 100, 120, 180, 180, 160];
  } else {
    colWidths = [50, 150, 240, 140, 200, 100, 130, 120, 180, 180];
  }

  for (let i = 0; i < Math.min(colWidths.length, colCount); i++) {
    await sheet.updateDimensionProperties(
      "COLUMNS",
      { pixelSize: colWidths[i] },
      { startIndex: i, endIndex: i + 1 },
    );
  }
  await sheet.updateDimensionProperties(
    "ROWS",
    { pixelSize: 40 },
    { startIndex: 0, endIndex: 1 },
  );
  await sheet.updateDimensionProperties(
    "ROWS",
    { pixelSize: 30 },
    { startIndex: 1, endIndex: rowCount },
  );
};

export const syncApplicationsToSheets = async (applications) => {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID_APPLICATIONS;
  const doc = await loadDocWithAuthCheck(spreadsheetId);
  let sheet = doc.sheetsByTitle["Applications"];
  if (!sheet) {
    sheet = doc.sheetsByIndex[0];
    await sheet.updateProperties({ title: "Applications" });
  }
  await sheet.clear();

  const allRows = [
    ["Recruitment-2026 Applications"],
    [
      "S.No.",
      "Name",
      "Email",
      "College Email",
      "Phone",
      "Primary Department",
      "Secondary Departments",
      "Application Status",
      "Payment Status",
      "Applied At",
      "Payment Date",
    ],
  ];

  applications.forEach((app, index) => {
    allRows.push([
      index + 1,
      app.userId?.userName || "N/A",
      app.userId?.email || "N/A",
      app.userId?.collegeEmail || "N/A",
      app.userId?.phoneNumber || "N/A",
      app.preferredDepartmentId?.name || "N/A",
      app.secondaryDepartmentId?.map((d) => d.name).join(", ") || "—",
      app.status,
      app.paymentStatus,
      new Date(app.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }),
      app.paymentStatus === "SUCCESS"
        ? new Date(app.updatedAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          })
        : "—",
    ]);
  });
  await sheet.setHeaderRow(allRows[0]);
  await sheet.addRows(allRows.slice(1), { raw: true, insert: false });
  await applyFormatting(
    sheet,
    allRows.length,
    allRows[1].length,
    "Recruitment-2026 Applications",
    "applications",
  );
  return {
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheet.sheetId}`,
  };
};

export const syncEventRegistrationsToSheets = async (
  registrations,
  eventTitle = "",
) => {
  const spreadsheetId =
    process.env.GOOGLE_SPREADSHEET_ID_ACC_REGISTRATIONS ||
    process.env.GOOGLE_SPREADSHEET_ID_EVENT_REGISTRATIONS ||
    process.env.GOOGLE_SPREADSHEET_ID_APPLICATIONS;

  const doc = await loadDocWithAuthCheck(spreadsheetId);

  const sheetTitle = "Event Registrations";
  let sheet = doc.sheetsByTitle[sheetTitle];
  if (!sheet) {
    if (
      doc.sheetsByIndex.length === 1 &&
      (doc.sheetsByIndex[0].title === "Sheet1" ||
        doc.sheetsByIndex[0].title === "Sheet 1")
    ) {
      sheet = doc.sheetsByIndex[0];
      await sheet.updateProperties({ title: sheetTitle });
    } else {
      sheet = await doc.addSheet({ title: sheetTitle });
    }
  }
  await sheet.clear();

  const titleHeader = eventTitle
    ? `${eventTitle} - Registrations 2026`
    : "Event Registrations - 2026";

  const allRows = [
    [titleHeader],
    [
      "S.No.",
      "Name",
      "Gender",
      "Year",
      "Branch",
      "Email",
      "College Email",
      "Phone",
      "Tournament",
      "Division",
      "Rating Bracket",
      "Chess.com",
      "Peak Rapid (30d)",
      "Games (30d)",
      "Residence",
      "Club / Organization",
      "Team Name",
      "Registration Status",
      "Payment Status",
      "UTR / Transaction ID",
      "Fee (₹)",
      "Screenshot URL",
      "Receipt URL",
      "Registered Date",
    ],
  ];

  registrations.forEach((reg, index) => {
    const user = reg.registeredBy || reg.userId || {};
    allRows.push([
      index + 1,
      user.userName || "N/A",
      reg.gender
        ? reg.gender.charAt(0).toUpperCase() + reg.gender.slice(1)
        : "—",
      user.year ? `Year ${user.year}` : "—",
      user.branch || "—",
      user.email || "N/A",
      user.collegeEmail || "N/A",
      user.phoneNumber || "N/A",
      reg.eventId?.title || eventTitle || "ACC 2026",
      reg.section ? reg.section.toUpperCase() : "OPEN",
      reg.bracket ? reg.bracket.toUpperCase() : "OPEN",
      reg.chessUsername ? `@${reg.chessUsername}` : "N/A",
      reg.peakRapidRating ?? "N/A",
      reg.rapidGamesCount ?? 0,
      reg.isHosteler || reg.residentType === "hosteler"
        ? "Hosteler"
        : "Day Scholar",
      reg.clubName || "—",
      reg.teamName || reg.team?.teamName || "—",
      (reg.status || "PENDING").toUpperCase(),
      (reg.paymentStatus || "PENDING").toUpperCase(),
      reg.utr || "—",
      reg.paymentAmount || 60,
      reg.paymentScreenshotUrl || "—",
      reg.receiptUrl || "—",
      new Date(reg.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }),
    ]);
  });

  await sheet.setHeaderRow(allRows[0]);
  await sheet.addRows(allRows.slice(1), { raw: true, insert: false });
  await applyFormatting(
    sheet,
    allRows.length,
    allRows[1].length,
    titleHeader,
    "event_registrations",
  );
  return {
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheet.sheetId}`,
  };
};

export const syncPaymentsToSheets = async (payments, purpose = null) => {
  const isEvent = purpose === "event";
  const spreadsheetId = isEvent
    ? process.env.GOOGLE_SPREADSHEET_ID_ACC_PAYMENTS ||
      process.env.GOOGLE_SPREADSHEET_ID_EVENT_PAYMENTS ||
      process.env.GOOGLE_SPREADSHEET_ID_PAYMENTS
    : process.env.GOOGLE_SPREADSHEET_ID_PAYMENTS;

  const doc = await loadDocWithAuthCheck(spreadsheetId);

  const sheetTitle = isEvent ? "Event Payments" : "Payments";
  let sheet = doc.sheetsByTitle[sheetTitle];
  if (!sheet) {
    if (
      doc.sheetsByIndex.length === 1 &&
      (doc.sheetsByIndex[0].title === "Sheet1" ||
        doc.sheetsByIndex[0].title === "Sheet 1" ||
        !isEvent)
    ) {
      sheet = doc.sheetsByIndex[0];
      await sheet.updateProperties({ title: sheetTitle });
    } else {
      sheet = await doc.addSheet({ title: sheetTitle });
    }
  }
  await sheet.clear();

  const headerTitle = isEvent
    ? "Tournament & Event Payments - 2026"
    : "Recruitment Payments - 2026";

  const allRows = isEvent
    ? [
        [headerTitle],
        [
          "S.No.",
          "Participant Name",
          "Gender",
          "Year",
          "Branch",
          "Email",
          "Phone",
          "Tournament",
          "Division",
          "UTR / Payment ID",
          "Amount (₹)",
          "Payment Status",
          "Screenshot URL",
          "Receipt URL",
          "Date & Time",
        ],
      ]
    : [
        [headerTitle],
        [
          "S.No.",
          "Name",
          "Email",
          "Phone",
          "UTR / Payment ID",
          "Amount (₹)",
          "Payment Status",
          "Purpose",
          "Receipt URL",
          "Date & Time",
        ],
      ];

  payments.forEach((payment, index) => {
    if (isEvent) {
      const pGender =
        payment.registrationId?.gender ||
        payment.metadata?.gender ||
        "—";
      const formattedGender =
        pGender !== "—"
          ? pGender.charAt(0).toUpperCase() + pGender.slice(1)
          : "—";
      const pYear = payment.userId?.year ? `Year ${payment.userId.year}` : "—";
      const pBranch = payment.userId?.branch || "—";

      allRows.push([
        index + 1,
        payment.userId?.userName || "N/A",
        formattedGender,
        pYear,
        pBranch,
        payment.userId?.email || "N/A",
        payment.userId?.phoneNumber || "N/A",
        payment.eventId?.title || "Chess Tournament",
        payment.registrationId?.section
          ? payment.registrationId.section.toUpperCase()
          : "OPEN",
        payment.utr ||
          payment.gatewayPaymentId ||
          payment.gatewayOrderId ||
          "N/A",
        (payment.amount / 100).toFixed(2),
        payment.status,
        payment.paymentScreenshotUrl || "—",
        payment.receiptUrl || "—",
        new Date(payment.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        }),
      ]);
    } else {
      allRows.push([
        index + 1,
        payment.userId?.userName || "N/A",
        payment.userId?.email || "N/A",
        payment.userId?.phoneNumber || "N/A",
        payment.utr ||
          payment.gatewayPaymentId ||
          payment.gatewayOrderId ||
          "N/A",
        (payment.amount / 100).toFixed(2),
        payment.status,
        payment.purpose?.toUpperCase() || "N/A",
        payment.receiptUrl || "—",
        new Date(payment.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        }),
      ]);
    }
  });

  await sheet.setHeaderRow(allRows[0]);
  await sheet.addRows(allRows.slice(1), { raw: true, insert: false });
  await applyFormatting(
    sheet,
    allRows.length,
    allRows[1].length,
    headerTitle,
    isEvent ? "payments_event" : "payments_recruitment",
  );
  return {
    sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${sheet.sheetId}`,
  };
};
