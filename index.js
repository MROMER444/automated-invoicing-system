const express = require("express");
const app = express();
const productController = require("./src/controllers/productController");

app.use(express.json());
app.use("/api", productController);

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log('Listening on port', PORT));
