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
    // Fetch data from sp_monthly_rev_data along with rev_share values
    const data = await prisma.sp_monthly_rev_data.findMany({
      select: {
        id: true,
        SP_Name: true,
        Service_Name: true,
        Total_Revenue: true,
        Date: true,
        revShare: {
          select: {
            Zain_share: true, // Fetch Zain share dynamically from the revShare table
            Bawaba_share: true, // Fetch Bawaba share dynamically from the revShare table
          },
        },
      },
    });

    const revenueMap = {};
    let totalGrossRevenue = 0; // Variable to store total gross revenue
    let totalInvoiceToZain = 0; // Variable to accumulate Bawaba's share of the revenue (Net Bawaba)
    let totalNetZain = 0; // Variable to accumulate the total Net Zain per service
    let totalTax = 0; // Variable to accumulate total CMS tax across all services

    data.forEach((item) => {
      const { id, SP_Name, Service_Name, Total_Revenue, revShare, Date } = item;

      // Parse total revenue correctly
      const grossRevenue = parseFloat(Total_Revenue.replace(/[^0-9.-]+/g, "") || 0);
      totalGrossRevenue += grossRevenue; // Accumulate total gross revenue

      const key = `${SP_Name}-${Service_Name}`;

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
          total_Net_Zain: 0, // Add the total Net Zain field for each service
          // Use Zain and Bawaba shares dynamically from revShare table, otherwise fallback to defaults
          Zain_share: revShare?.Zain_share ?? 0.3,
          Bawaba_share: revShare?.Bawaba_share ?? 0.7,
          Date,
        };
      }

      // Calculate gross revenue, CMS tax (19.5%), and net revenue
      revenueMap[key].Gross_Revenue += grossRevenue;
      revenueMap[key].CMS_Tax_Amount = revenueMap[key].Gross_Revenue * 0.195;
      revenueMap[key].Net_Revenue =
        revenueMap[key].Gross_Revenue - revenueMap[key].CMS_Tax_Amount;

      // Calculate Zain's and Bawaba's shares based on the net revenue
      revenueMap[key].Net_Zain = revenueMap[key].Net_Revenue * revenueMap[key].Zain_share;
      revenueMap[key].Net_Bawaba =
        revenueMap[key].Net_Revenue * revenueMap[key].Bawaba_share;

      // Add up the total Net Zain for this service
      revenueMap[key].total_Net_Zain += revenueMap[key].Net_Zain;

      // Accumulate the Net Zain share for the total Net Zain
      totalNetZain += revenueMap[key].total_Net_Zain; // Accumulate total Net Zain

      // Accumulate the Net Bawaba for total invoice to Zain
      totalInvoiceToZain += revenueMap[key].Net_Bawaba;

      // Accumulate total CMS tax
      totalTax += revenueMap[key].CMS_Tax_Amount;
    });

    // Format results to return the proper accounting format
    const result = Object.values(revenueMap).map((entry) => ({
      id: entry.id,
      SP_Name: entry.SP_Name,
      Service_Name: entry.Service_Name,
      Gross_Revenue: formatAccounting(entry.Gross_Revenue),
      Net_Revenue: formatAccounting(entry.Net_Revenue),
      CMS_Tax_Amount: formatAccounting(entry.CMS_Tax_Amount),
      Net_Zain: formatAccounting(entry.Net_Zain),
      Net_Bawaba: formatAccounting(entry.Net_Bawaba),
      Zain_share: entry.Zain_share,
      Bawaba_share: entry.Bawaba_share,
      total_Net_Zain: formatAccounting(entry.total_Net_Zain), // Add the total Net Zain for each service
      Date: entry.Date,
    }));

    // Save results to Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Revenue Data");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "SP Name", key: "SP_Name", width: 20 },
      { header: "Service Name", key: "Service_Name", width: 20 },
      { header: "Gross Revenue", key: "Gross_Revenue", width: 20 },
      { header: "Net Revenue", key: "Net_Revenue", width: 20 },
      { header: "CMS Tax Amount", key: "CMS_Tax_Amount", width: 20 },
      { header: "Net Zain", key: "Net_Zain", width: 20 },
      { header: "Net Bawaba", key: "Net_Bawaba", width: 20 },
      { header: "Zain Share", key: "Zain_share", width: 15 },
      { header: "Bawaba Share", key: "Bawaba_share", width: 15 },
      { header: "Total Net Zain", key: "total_Net_Zain", width: 20 }, // Add column for total Net Zain
    ];

    worksheet.addRows(result);

    const filePath = path.join(
      __dirname,
      "../downloads",
      `Revenue_Report_${new Date().toISOString()}.xlsx`
    );
    await workbook.xlsx.writeFile(filePath);

    const reportDate = data.length > 0 ? data[0].Date : null;
    // Save the summary statistics to the monthly_statistic table
    await prisma.monthly_statistic.create({
      data: {
        Total_Gross_Revenue: totalGrossRevenue,
        Total_Invoice_to_Zain: totalInvoiceToZain,
        Total_CMC_Tax_Amount: totalTax,
        Zain_Net_Revenue: totalNetZain,
        Date: reportDate,
      },
    });

    // Respond with data including total gross revenue, total invoice to Zain, and total tax
    res.status(200).json({
      message: "Excel file generated and saved successfully.",
      path: filePath,
      data: result,
      "total Gross Revenue": formatAccounting(totalGrossRevenue), // Return total gross revenue
      total_invoice_to_zain: formatAccounting(totalInvoiceToZain), // Return total invoice to Zain (Net Bawaba)
      total_Net_Zain_per_all_services: formatAccounting(totalNetZain), // Return the total Net Zain for all services
      total_tax: formatAccounting(totalTax), // Return the total CMS tax across all services
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
    "/Users/omer/Documents/my_pro/automated invoicing system/Aug-revcsv_with_date.csv"
  )
    .pipe(csv())
    .on("headers", (headers) => {
      // Clean up header names by trimming spaces
      headers.forEach((header, index) => {
        headers[index] = header.trim();
      });
    })
    .on("data", (data) => {
      // Clean each row's keys by trimming any extra spaces
      const cleanedRow = {};
      Object.keys(data).forEach((key) => {
        cleanedRow[key.trim()] = data[key].trim();
      });
      results.push(cleanedRow);
    })
    .on("end", async () => {
      try {
        // Get the current date in the format day/month/year
        const currentDate = new Date().toLocaleDateString("en-GB"); // "en-GB" formats it as day/month/year

        // Insert each row from CSV into the database
        for (const row of results) {
          // Validate required fields
          if (!row["SP Name"] || !row["Service name"] || !row["Total Revenue"]) {
            console.warn("Skipping row due to missing values:", row);
            continue;
          }

          // Check if the Service_Name exists in rev_share table
          const serviceExists = await prisma.rev_share.findUnique({
            where: { Service_Name: row["Service name"] },
          });

          if (!serviceExists) {
            console.warn(`Skipping row due to missing Service_Name in rev_share:`, row);
            continue; // Skip this row if Service_Name doesn't exist in rev_share
          }

          // Insert data if Service_Name exists
          await prisma.sp_monthly_rev_data.create({
            data: {
              SP_Name: row["SP Name"], // Trimmed and cleaned header
              Service_Name: row["Service name"], // Cleaned
              Total_Revenue: row["Total Revenue"].replace(/[^0-9.-]+/g, ""), // Clean currency format
              Date: row["Date"], // Store the current date in day/month/year format
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
