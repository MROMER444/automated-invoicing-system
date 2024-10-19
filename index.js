const express = require("express");
const app = express();
const invoiceController = require("./src/controllers/invoice");

app.use(express.json());

app.use("/api", invoiceController);

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log("Listening on port", PORT));
