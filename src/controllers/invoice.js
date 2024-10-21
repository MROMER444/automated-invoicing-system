const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const csv = require("csv-parser");
router.use(bodyParser.json());

const formatAccounting = (value) => {
  return parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

router.get("/v1/total_rev_per_sp_per_month", async (req, res) => {
  try {
    const data = await prisma.sp_monthly_rev_data.findMany({
      select: {
        id: true,
        SP_Name: true,
        Service_Name: true,
        ShortCode: true,
        Charged_Units: true,
        Tariff: true,
        Total_Revenue: true,
        revShare: {
          select: {
            Zain_share: true,
            Bawaba_share: true,
          },
        },
      },
    });

    const revenueMap = {};

    data.forEach((item) => {
      const { id, SP_Name, Service_Name, Total_Revenue, Tariff, ShortCode, revShare } =
        item;

      const revenue = parseFloat(Total_Revenue.replace(/[^0-9.-]+/g, "") || 0);

      const key = `${SP_Name}-${Service_Name}`;

      if (!revenueMap[key]) {
        revenueMap[key] = {
          id,
          SP_Name,
          Service_Name,
          Tariff,
          ShortCode,
          Gross_Revenue: 0,
          Net_Revenue: 0,
          Tax_Amount: 0,
          Zain_share: revShare?.Zain_share ?? 0.3,
          Bawaba_share: revShare?.Bawaba_share ?? 0.7,
          Zain_RS_Amount: 0,
          Bawaba_RS_Amount: 0,
        };
      }

      revenueMap[key].Gross_Revenue += revenue;
      revenueMap[key].Tax_Amount = revenueMap[key].Gross_Revenue * 0.195;
      revenueMap[key].Net_Revenue =
        revenueMap[key].Gross_Revenue - revenueMap[key].Tax_Amount;

      revenueMap[key].Zain_RS_Amount =
        revenueMap[key].Net_Revenue * revenueMap[key].Zain_share;
      revenueMap[key].Bawaba_RS_Amount =
        revenueMap[key].Net_Revenue * revenueMap[key].Bawaba_share;
    });

    const result = Object.values(revenueMap).map((entry) => ({
      id: entry.id,
      SP_Name: entry.SP_Name,
      Service_Name: entry.Service_Name,
      Tariff: entry.Tariff,
      ShortCode: entry.ShortCode,
      Gross_Revenue: formatAccounting(entry.Gross_Revenue),
      Net_Revenue: formatAccounting(entry.Net_Revenue),
      Tax_Amount: formatAccounting(entry.Tax_Amount),
      Tax_Percentage: "19.5%",
      Zain_share: entry.Zain_share,
      Bawaba_share: entry.Bawaba_share,
      Zain_RS_Amount: formatAccounting(entry.Zain_RS_Amount),
      Bawaba_RS_Amount: formatAccounting(entry.Bawaba_RS_Amount),
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Revenue Data");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "SP Name", key: "SP_Name", width: 20 },
      { header: "Service Name", key: "Service_Name", width: 20 },
      { header: "Tariff", key: "Tariff", width: 15 },
      { header: "Short Code", key: "ShortCode", width: 15 },
      { header: "Gross Revenue", key: "Gross_Revenue", width: 20 },
      { header: "Net Revenue", key: "Net_Revenue", width: 20 },
      { header: "Tax Amount", key: "Tax_Amount", width: 15 },
      { header: "Tax Percentage", key: "Tax_Percentage", width: 15 },
      { header: "Zain Share", key: "Zain_share", width: 15 },
      { header: "Bawaba Share", key: "Bawaba_share", width: 15 },
      { header: "Zain RS Amount", key: "Zain_RS_Amount", width: 20 },
      { header: "Bawaba RS Amount", key: "Bawaba_RS_Amount", width: 20 },
    ];

    worksheet.addRows(result);

    const totalBawabaRSAmount = result.reduce((sum, item) => {
      return sum + parseFloat(item.Bawaba_RS_Amount.replace(/,/g, ""));
    }, 0);

    const TotalBawabaRSAmount = totalBawabaRSAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const filePath = path.join(
      __dirname,
      "../downloads",
      `Revenue_Report_${new Date().toISOString()}.xlsx`
    );
    await workbook.xlsx.writeFile(filePath);

    res.status(200).json({
      message: "Excel file generated and saved successfully.",
      path: filePath,
      data: result,
      BawabaRSAmount: TotalBawabaRSAmount,
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

  // Read the CSV file and parse it
  fs.createReadStream(
    "/Users/omer/Documents/my_pro/automated invoicing system/Aug-revcsv4444444.csv"
  ) // Replace with the actual path to your CSV
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        // Insert each row from CSV into the database
        for (const row of results) {
          await prisma.sp_monthly_rev_data.create({
            data: {
              SP_Name: row["SP Name"],
              Service_Name: row["Service Name"],
              Tariff: row["Tariff"],
              ShortCode: parseInt(row["Short Code"]),
              Opt_In: parseInt(row["Opt-In"]),
              Opt_Out: parseInt(row["Opt-Out"]),
              Out_Of_Balance: parseInt(row["Out Of Balance"]),
              Charged_Units: parseInt(row["Charged Units"]),
              Total_Revenue: row["Total Revenue"], // Clean up currency format
              Date: Date(row["Date"]),
            },
          });
        }
        res.status(200).json({ message: "CSV data inserted successfully!" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error inserting data", error });
      }
    });
});

router.get("/v1/getshare", async (req, res) => {
  const { skip = 0, take = 4 } = req.query; // Default values for pagination
  try {
    const total_services2 = await prisma.rev_share.findMany({
      skip: Number(skip),
      take: Number(take),
    });
    const totalCount = await prisma.rev_share.count(); // Total records count

    res.status(200).json({ total_services2, totalCount });
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

module.exports = router;
