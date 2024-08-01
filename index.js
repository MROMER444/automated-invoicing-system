const express = require("express");
const app = express();
const productController = require("./src/controllers/productController");
const categoryController = require("./src/controllers/categoryController");
const userController = require("./src/controllers/userController");

app.use(express.json());
app.use("/api", productController);
app.use("/api", categoryController);
app.use("/api", userController);

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log('Listening on port', PORT));
