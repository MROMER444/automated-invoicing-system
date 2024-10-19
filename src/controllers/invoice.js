const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const formatAccounting = (value) => {
  const formattedValue = parseFloat(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formattedValue;
};

router.get("/v1/get_data", async (req, res) => {
  try {
    const report = await prisma.sp_monthly_rev_data.findMany();
    res.status(200).json({ data: report });
  } catch (error) {
    console.log(error);
  }
});

router.get("/v1/total_rev_per_sp_per_month", async (req, res) => {
  try {
    const data = await prisma.sp_monthly_rev_data.findMany({
      select: {
        SP_Name: true,
        Service_Name: true,
        ShortCode: true,
        Charged_Units: true,
        Tariff: true,
        Total_Revenue: true,
        Date: true,
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
      const { SP_Name, Service_Name, Total_Revenue, Tariff, ShortCode, Date, revShare } =
        item;

      const revenue = parseFloat(Total_Revenue.replace(/[^0-9.-]+/g, ""));

      const key = `${SP_Name}-${Service_Name}`;

      if (!revenueMap[key]) {
        revenueMap[key] = {
          SP_Name,
          Service_Name,
          Tariff,
          ShortCode,
          Gross_Revenue: 0,
          Net_Revenue: 0,
          Tax_Amount: 0,
          Zain_share: revShare?.Zain_share ?? 0,
          Bawaba_share: revShare?.Bawaba_share ?? 0,
          Zain_RS_Amount: 0,
          Bawaba_RS_Amount: 0,
          Date,
        };
      }

      revenueMap[key].Gross_Revenue += revenue;

      revenueMap[key].Tax_Amount = revenueMap[key].Gross_Revenue * 0.195;

      revenueMap[key].Net_Revenue =
        revenueMap[key].Gross_Revenue - revenueMap[key].Tax_Amount;

      revenueMap[key].Zain_RS_Amount =
        revenueMap[key].Net_Revenue * (revenueMap[key].Zain_share || 0);

      revenueMap[key].Bawaba_RS_Amount =
        revenueMap[key].Net_Revenue * (revenueMap[key].Bawaba_share || 0);
    });

    const result = Object.values(revenueMap).map((entry) => ({
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
      Date: entry.Date,
    }));

    const totalBawabaRSAmount = result.reduce((sum, item) => {
      return sum + parseFloat(item.Bawaba_RS_Amount.replace(/,/g, ""));
    }, 0);

    const formattedTotalBawabaRSAmount = totalBawabaRSAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    res.status(200).json({
      data: result,
      "Total Bawaba_RS_Amount": formattedTotalBawabaRSAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

module.exports = router;
