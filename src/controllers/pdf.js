const sharp = require("sharp");
const pdfImage = require("pdf-image");
const fs = require("fs");

const imagePath =
  "/Users/omer/Documents/my_pro/automated invoicing system/src/controllers/dodo.png";

async function convertImageToPDF() {
  try {
    const image = await sharp(imagePath).toBuffer();
    const pdfBuffer = await pdfImage.convert(image);

    // Overwrite the original image file with the PDF
    fs.writeFileSync(imagePath, pdfBuffer);

    console.log("PDF file created successfully!");
  } catch (error) {
    console.error("Error converting image to PDF:", error);
  }
}

convertImageToPDF();