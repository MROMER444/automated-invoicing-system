const express = require("express");
const app = express();
const productController = require("./src/controllers/productController");
const categoryController = require("./src/controllers/categoryController");

app.use(express.json());
app.use("/api", productController);
app.use("/api", categoryController);

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log('Listening on port', PORT));