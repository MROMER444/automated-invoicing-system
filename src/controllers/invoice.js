const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const formatAccounting = (value) => {
  return parseFloat(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

router.get("/v1/get_data", async (req, res) => {
  try {
    const report = await prisma.sp_monthly_rev_data.findMany();
    res.status(200).json({ data: report });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.get("/v1/rev_share", async (req, res) => {
  try {
    const rev_share = await prisma.rev_share.findMany();
    res.status(200).json({ rev_share: rev_share });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

router.get("/v1/total_rev_per_sp_per_month", async (req, res) => {
  try {
    // Fetch data from sp_monthly_rev_data along with rev_share values
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

      const revenue = parseFloat(Total_Revenue.replace(/[^0-9.-]+/g, "") || 0); // Handle string values like '0'

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
          Zain_share: revShare?.Zain_share ?? 0.3, // Use value from revShare if available, default if not
          Bawaba_share: revShare?.Bawaba_share ?? 0.7, // Use value from revShare if available, default if not
          Zain_RS_Amount: 0,
          Bawaba_RS_Amount: 0,
        };
      }

      // Update revenue data for each entry
      revenueMap[key].Gross_Revenue += revenue;
      revenueMap[key].Tax_Amount = revenueMap[key].Gross_Revenue * 0.195; // 19.5% tax
      revenueMap[key].Net_Revenue =
        revenueMap[key].Gross_Revenue - revenueMap[key].Tax_Amount;

      // Revenue Share calculations
      revenueMap[key].Zain_RS_Amount =
        revenueMap[key].Net_Revenue * revenueMap[key].Zain_share;
      revenueMap[key].Bawaba_RS_Amount =
        revenueMap[key].Net_Revenue * revenueMap[key].Bawaba_share;
    });

    // Convert revenueMap to final result array
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

    // Calculate total Bawaba revenue share amount
    const totalBawabaRSAmount = result.reduce((sum, item) => {
      return sum + parseFloat(item.Bawaba_RS_Amount.replace(/,/g, "")); // Remove commas for accurate sum
    }, 0);

    // Format total Bawaba revenue share
    const formattedTotalBawabaRSAmount = totalBawabaRSAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    res.status(200).json({
      data: result,
      Total_Bawaba_Revenue: formattedTotalBawabaRSAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

module.exports = router;
