export const generateApplicationsExcel = async (applications) => {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Applications", {
    properties: { defaultRowHeight: 35 },
    views: [{ state: "frozen", ySplit: 3 }],
  });

  worksheet.columns = [
    { header: "Name", key: "name", width: 28 },
    { header: "Email", key: "email", width: 38 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "Primary Department", key: "primaryDept", width: 26 },
    { header: "Secondary Departments", key: "secondaryDepts", width: 32 },
    { header: "Application Status", key: "status", width: 20 },
    { header: "Payment Status", key: "paymentStatus", width: 20 },
    { header: "Applied At", key: "appliedAt", width: 26 },
    { header: "Payment Date", key: "paymentDate", width: 26 },
  ];

  worksheet.spliceRows(1, 0, []);
  worksheet.mergeCells("A1:I1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Recruitment-2026 Applications";
  titleCell.font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 48;

  const headerRow = worksheet.getRow(2);
  headerRow.height = 38;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFBFDBFE" } },
      left: { style: "thin", color: { argb: "FFBFDBFE" } },
      bottom: { style: "medium", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFBFDBFE" } },
    };
  });

  applications.forEach((app, index) => {
    const name = app.userId?.userName || "N/A";
    const email = app.userId?.email || "N/A";
    const phone = app.userId?.phoneNumber || "N/A";
    const primaryDept = app.preferredDepartmentId?.name || "N/A";
    const secondaryDepts =
      app.secondaryDepartmentId?.map((d) => d.name).join(", ") || "—";

    const appliedAt = new Date(app.createdAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
    const paymentDate =
      app.paymentStatus === "SUCCESS"
        ? new Date(app.updatedAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          })
        : "—";

    const row = worksheet.addRow({
      name,
      email,
      phone,
      primaryDept,
      secondaryDepts,
      status: app.status,
      paymentStatus: app.paymentStatus,
      appliedAt,
      paymentDate,
    });

    const isEven = index % 2 === 0;
    const rowBg = isEven ? "FFF0F4FF" : "FFFFFFFF";

    row.height = 35;

    row.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1,
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: rowBg },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    const statusCell = row.getCell("status");
    const statusColors = {
      ACTIVE: "FF15803D",
      REJECTED: "FFDC2626",
      INTERVIEW: "FF2563EB",
      DRAFT: "FFD97706",
    };
    statusCell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: statusColors[app.status] || "FFD97706" },
    };
    statusCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    const paymentStatusCell = row.getCell("paymentStatus");
    const paymentColors = {
      SUCCESS: "FF15803D",
      FAILED: "FFDC2626",
      PENDING: "FFD97706",
    };
    paymentStatusCell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: paymentColors[app.paymentStatus] || "FFD97706" },
    };
    paymentStatusCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  workbook.creator = "En Passant Admin";
  workbook.created = new Date();

  return await workbook.xlsx.writeBuffer();
};

export const generatePaymentsExcel = async (payments) => {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Payments", {
    properties: { defaultRowHeight: 35 },
    views: [{ state: "frozen", ySplit: 2 }],
  });

  worksheet.columns = [
    { header: "Name", key: "name", width: 28 },
    { header: "Email", key: "email", width: 38 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "UTR / Payment ID", key: "utr", width: 32 },
    { header: "Amount (₹)", key: "amount", width: 16 },
    { header: "Payment Status", key: "status", width: 20 },
    { header: "Purpose", key: "purpose", width: 16 },
    { header: "Date & Time", key: "date", width: 28 },
  ];

  worksheet.spliceRows(1, 0, []);
  worksheet.mergeCells("A1:H1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Recruitment-2026 Payments";
  titleCell.font = {
    name: "Calibri",
    size: 18,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" },
  };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 48;

  const headerRow = worksheet.getRow(2);
  headerRow.height = 38;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFBFDBFE" } },
      left: { style: "thin", color: { argb: "FFBFDBFE" } },
      bottom: { style: "medium", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFBFDBFE" } },
    };
  });

  payments.forEach((payment, index) => {
    const name = payment.userId?.userName || "N/A";
    const email = payment.userId?.email || "N/A";
    const phone = payment.userId?.phoneNumber || "N/A";
    const utr =
      payment.utr ||
      payment.gatewayPaymentId ||
      payment.gatewayOrderId ||
      "N/A";
    const amount = (payment.amount / 100).toFixed(2);
    const date = new Date(payment.createdAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });

    const row = worksheet.addRow({
      name,
      email,
      phone,
      utr,
      amount,
      status: payment.status,
      purpose: payment.purpose?.toUpperCase() || "N/A",
      date,
    });

    const isEven = index % 2 === 0;
    row.height = 35;

    row.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
        indent: 1,
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFF0F4FF" : "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    row.getCell("amount").alignment = {
      vertical: "middle",
      horizontal: "right",
      indent: 1,
    };

    const statusCell = row.getCell("status");
    const statusColors = {
      SUCCESS: "FF15803D",
      FAILED: "FFDC2626",
      PENDING: "FFD97706",
    };
    statusCell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: statusColors[payment.status] || "FFD97706" },
    };
    statusCell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  workbook.creator = "En Passant Admin";
  workbook.created = new Date();

  return await workbook.xlsx.writeBuffer();
};
