const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { PDFDocument, rgb } = require("pdf-lib");
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const csv = require("csv-parser");
router.use(bodyParser.json());

const formatAccounting = (value) => {
  let numberValue = parseFloat(value || 0);
  let formattedValue = numberValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const noCommaValue = formattedValue.replace(/,/g, "");

  if (noCommaValue.length > 9) {
    const truncatedValue = Math.floor(numberValue).toString().substring(0, 9);
    return parseInt(truncatedValue, 10).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  return formattedValue;
};

router.get("/v1/total_rev_per_sp_per_month", async (req, res) => {
  try {
    const data = await prisma.sp_monthly_rev_data.findMany({
      select: {
        id: true,
        SP_Name: true,
        Service_Name: true,
        Total_Revenue: true,
        Date: true,
        revShare: {
          select: {
            Zain_share: true,
            Bawaba_share: true,
            Dizlee_share: true,
            Sp_share: true,
            Bawaba_PLUS_sp_shares: true,
          },
        },
      },
    });

    const revenueMap = {};
    let totalGrossRevenue = 0;
    let totalInvoiceToZain = 0;
    let totalNetZain = 0;
    let totalTax = 0;

    data.forEach((item) => {
      const { 
        id, 
        SP_Name, 
        Service_Name, 
        Total_Revenue, 
        revShare, 
        Date 
      } = item;

      const grossRevenue = parseFloat(Total_Revenue.replace(/[^0-9.-]+/g, "") || 0);
      totalGrossRevenue += grossRevenue;

      const key = `${SP_Name}-${Service_Name}`;

      const zainShare = revShare?.Zain_share ?? 0.3;
      const bawabaShare = revShare?.Bawaba_share ?? 0.7;
      const dizzleShare = revShare?.Dizlee_share ?? 0.5;
      const bawabaPlusSpShares = revShare?.Bawaba_PLUS_sp_shares ?? 0.7;
      const SP_SHARE_GET =revShare?.Sp_share ?? 0;

      if (!revenueMap[key]) {
        revenueMap[key] = {
          id,
          SP_Name,
          Service_Name,
          Gross_Revenue: 0,
          Net_Revenue: 0,
          CMS_Tax_Amount: 0,
          Net_Zain: 0,
          Net_Bawaba: 0,
          Net_Dizzle: 0,
          Net_SP: 0,
          total_Net_Zain: 0,
          Zain_share: zainShare,
          Bawaba_share: bawabaShare,
          Dizzle_share: dizzleShare,
          Sp_share: SP_SHARE_GET,
          Date,
        };
      }

      revenueMap[key].Gross_Revenue += grossRevenue;
      
      revenueMap[key].CMS_Tax_Amount = revenueMap[key].Gross_Revenue * 0.195;
      
      revenueMap[key].Net_Revenue = 
        revenueMap[key].Gross_Revenue - revenueMap[key].CMS_Tax_Amount;

      revenueMap[key].Net_Zain = 
        revenueMap[key].Net_Revenue * revenueMap[key].Zain_share;
      
      const netBawabaBeforeShares = 
        revenueMap[key].Net_Revenue * revenueMap[key].Bawaba_share;
      
      revenueMap[key].Net_SP = 
        netBawabaBeforeShares * revenueMap[key].Sp_share;

      revenueMap[key].Net_Bawaba = 
        netBawabaBeforeShares - revenueMap[key].Net_Dizzle - revenueMap[key].Net_SP;

        revenueMap[key].Net_Dizzle = 
      revenueMap[key].Net_Bawaba * revenueMap[key].Dizzle_share;

      revenueMap[key].total_Net_Zain += revenueMap[key].Net_Zain;


      totalNetZain += revenueMap[key].total_Net_Zain;
      totalInvoiceToZain += revenueMap[key].Net_Dizzle + revenueMap[key].Net_SP + revenueMap[key].Net_Bawaba;
      totalTax += revenueMap[key].CMS_Tax_Amount;
    });

    const result = Object.values(revenueMap).map((entry) => ({
      id: entry.id,
      SP_Name: entry.SP_Name,
      Service_Name: entry.Service_Name,
      Gross_Revenue: formatAccounting(entry.Gross_Revenue),
      Net_Revenue: formatAccounting(entry.Net_Revenue),
      CMS_Tax_Amount: formatAccounting(entry.CMS_Tax_Amount),
      Net_Zain: formatAccounting(entry.Net_Zain),
      Net_Dizzle: formatAccounting(entry.Net_Dizzle),
      Net_SP: formatAccounting(entry.Net_SP),
      Net_Bawaba: formatAccounting(entry.Net_Bawaba),
      Zain_share: entry.Zain_share,
      Bawaba_share: entry.Bawaba_share,
      Dizzle_share: entry.Dizzle_share,
      SP_share: entry.Sp_share,
      total_Net_Zain: formatAccounting(entry.total_Net_Zain),
      Date: entry.Date,
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Revenue Data");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "SP Name", key: "SP_Name", width: 20 },
      { header: "Service Name", key: "Service_Name", width: 20 },
      { header: "Gross Revenue", key: "Gross_Revenue", width: 20 },
      { header: "Net Revenue after Tax", key: "Net_Revenue", width: 20 },
      { header: "CMS Tax Amount", key: "CMS_Tax_Amount", width: 20 },
      { header: "Net Zain", key: "Net_Zain", width: 20 },
      { header: "Net Dizzle", key: "Net_Dizzle", width: 20 },
      { header: "Net SP", key: "Net_SP", width: 20 },
      { header: "Net revenue after zain share and CMC share", key: "Net_Bawaba", width: 20 },
      { header: "Zain Share", key: "Zain_share", width: 15 },
      { header: "Bawaba Share", key: "Bawaba_share", width: 15 },
      { header: "Dizzle Share", key: "Dizzle_share", width: 15 },
      { header: "SP Share", key: "SP_share", width: 15 },
    ];

    worksheet.addRows(result);

    const filePath = path.join(
      __dirname,
      "../downloads",
      `Revenue_Report_${new Date().toISOString()}.xlsx`
    );
    await workbook.xlsx.writeFile(filePath);

    const reportDate = data.length > 0 ? data[0].Date : null;

    if (reportDate) {
      const existingRecord = await prisma.monthly_statistic.findFirst({
        where: { Date: reportDate },
      });

      if (!existingRecord) {
        await prisma.monthly_statistic.create({
          data: {
            Total_Gross_Revenue: totalGrossRevenue,
            Total_Invoice_to_Zain: totalInvoiceToZain,
            Total_CMC_Tax_Amount: totalTax,
            Zain_Net_Revenue: totalNetZain,
            Date: reportDate,
          },
        });
        console.log("Record inserted successfully.");
      } else {
        console.log("Record with this date already exists. Insertion skipped.");
      }
    } else {
      console.log("No data to insert; report date is null.");
    }

    res.status(200).json({
      message: "Excel file generated and saved successfully.",
      path: filePath,
      data: result,
      "total Gross Revenue": formatAccounting(totalGrossRevenue),
      total_invoice_to_zain: formatAccounting(totalInvoiceToZain),
      total_Net_Zain_per_all_services: formatAccounting(totalNetZain),
      total_tax: formatAccounting(totalTax),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while generating the report." });
  }
  
});

router.get("/v1/get-total_services", async (req, res) => {
  try {
    const services = await prisma.rev_share.findMany({
      select: {
        Service_Name: true,
      },
    });

    const uniqueServices = new Set(services.map((service) => service.Service_Name));
    const total_services = uniqueServices.size;

    res.status(200).json({ total_services });
  } catch (error) {
    console.error("Error fetching total services:", error);
    res.status(500).json({ error: "Error fetching total services" });
  }
});

router.post("/v1/upload-csv", async (req, res) => {
  const results = [];

  fs.createReadStream(
    "/Users/omer/Documents/my_pro/automated invoicing system/SPs total revenue Sep 2024.csv"
  )
    .pipe(csv())
    .on("headers", (headers) => {
      headers.forEach((header, index) => {
        headers[index] = header.trim();
      });
    })
    .on("data", (data) => {
      const cleanedRow = {};
      Object.keys(data).forEach((key) => {
        cleanedRow[key.trim()] = data[key].trim();
      });
      results.push(cleanedRow);
    })
    .on("end", async () => {
      try {
        const currentDate = new Date().toLocaleDateString("en-GB");

        for (const row of results) {
          if (!row["SP Name"] || !row["Service name"] || !row["Total Revenue"]) {
            console.warn("Skipping row due to missing values:", row);
            continue;
          }

          const serviceExists = await prisma.rev_share.findUnique({
            where: { Service_Name: row["Service name"] },
          });

          if (!serviceExists) {
            console.warn(`Skipping row due to missing Service_Name in rev_share:`, row);
            continue;
          }

          await prisma.sp_monthly_rev_data.create({
            data: {
              SP_Name: row["SP Name"],
              Service_Name: row["Service name"],
              Total_Revenue: row["Total Revenue"].replace(/[^0-9.-]+/g, ""),
              Date: row["Date"],
            },
          });
        }
        res.status(200).json({ message: "CSV data inserted successfully!" });
      } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ message: "Error inserting data", error });
      }
    });
});

router.get("/v1/getshare", async (req, res) => {
  const { skip = 0, take = 4 } = req.query;
  try {
    const total_services = await prisma.rev_share.findMany({
      skip: Number(skip),
      take: Number(take),
    });
    const totalCount = await prisma.rev_share.count();

    res.status(200).json({ total_services, totalCount });
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.get("/v1/monthly_statistic", async (req, res) => {
  try {
    const monthly_statistic = await prisma.monthly_statistic.findMany();

    if (monthly_statistic.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    const lastStatistic = monthly_statistic[monthly_statistic.length - 1];

    const formattedLastStatistic = {
      id: lastStatistic.id,
      Total_Gross_Revenue: formatAccounting(lastStatistic.Total_Gross_Revenue),
      Total_Invoice_to_Zain: formatAccounting(lastStatistic.Total_Invoice_to_Zain),
      Total_CMC_Tax_Amount: formatAccounting(lastStatistic.Total_CMC_Tax_Amount),
      Zain_Net_Revenue: formatAccounting(lastStatistic.Zain_Net_Revenue),
      Date: lastStatistic.Date,
    };

    res.status(200).json({ monthly_statistic: formattedLastStatistic });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving data", error });
  }
});

router.get("/v1/filter_date", async (req, res) => {
  const date = req.query.date;

  try {
    const statistics = await prisma.monthly_statistic.findFirst({
      where: { Date: date },
    });

    if (!statistics) {
      return res.status(404).json({ message: "No data found for the selected date" });
    }

    const formattedStatistic = {
      id: statistics.id,
      Total_Gross_Revenue: formatAccounting(statistics.Total_Gross_Revenue),
      Total_Invoice_to_Zain: formatAccounting(statistics.Total_Invoice_to_Zain),
      Total_CMC_Tax_Amount: formatAccounting(statistics.Total_CMC_Tax_Amount),
      Zain_Net_Revenue: formatAccounting(statistics.Zain_Net_Revenue),
      Date: statistics.Date,
    };

    return res.status(200).json({ monthly_statistic: formattedStatistic });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
});

router.get("/v1/monthYearOptions", async (req, res) => {
  try {
    const monthYearOptions = await prisma.monthly_statistic.findMany({
      select: {
        Date: true,
      },
      distinct: ["Date"],
    });

    const uniqueDates = [...new Set(monthYearOptions.map((option) => option.Date))];

    res.json(uniqueDates);
  } catch (error) {
    console.error("Error fetching month-year options:", error);
    res.status(500).send("Server Error");
  }
});

router.get("/v1/financial-data", async (req, res) => {
  try {
    const financial_data = await prisma.monthly_statistic.findMany();
    if (!financial_data) {
      return res.status(200).json({ success: false });
    } else {
      const formattedStatistic = financial_data.map((entry) => ({
        id: entry.id,
        Total_Gross_Revenue: formatAccounting(entry.Total_Gross_Revenue),
        Total_Invoice_to_Zain: formatAccounting(entry.Total_Invoice_to_Zain),
        Total_CMC_Tax_Amount: formatAccounting(entry.Total_CMC_Tax_Amount),
        Zain_Net_Revenue: formatAccounting(entry.Zain_Net_Revenue),
        Date: entry.Date,
      }));

      return res.status(200).json({ success: true, data: formattedStatistic });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

const util = require("util");
const { log } = require("console");
const writeFile = util.promisify(fs.writeFile);

async function generateInvoicePDF(invoiceData) {
  try {
    const templatePath = path.join(__dirname, "image.png");
    const templateImage = await fs.readFile(templatePath);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);

    const image = await pdfDoc.embedPng(templateImage);
    const { width, height } = image.scale(1);
    page.drawImage(image, { x: 0, y: 0, width, height });

    const { invoiceNumber, invoiceDate, alBawabaShare, totalRevenue, tax, zainShare } =
      invoiceData;
    page.drawText(`Invoice #: ${invoiceNumber}`, {
      x: 450,
      y: 780,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Invoice Date: ${invoiceDate}`, {
      x: 450,
      y: 760,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(`AL-BAWABA share: ${alBawabaShare}`, {
      x: 50,
      y: 700,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Total Revenue: ${totalRevenue}`, {
      x: 50,
      y: 680,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(`19.5% Tax: ${tax}`, { x: 50, y: 660, size: 12, color: rgb(0, 0, 0) });
    page.drawText(`Zain share: ${zainShare}`, {
      x: 50,
      y: 640,
      size: 12,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Total: ${totalRevenue - tax - alBawabaShare - zainShare}`, {
      x: 50,
      y: 620,
      size: 12,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(__dirname, `invoices/${invoiceNumber}.pdf`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, pdfBytes);

    return pdfBytes;
  } catch (error) {
    console.error("Error in generateInvoicePDF:", error);
    throw error;
  }
}

module.exports = router;