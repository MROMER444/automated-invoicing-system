const express = require("express");
const app = express();
const cors = require("cors");

const invoiceController = require("./src/controllers/invoice");
const register = require("./src/auth/register");
const login = require("./src/auth/Login");

app.use(cors());
app.use(express.json());

app.use("/api", invoiceController);
app.use("/api", register);
app.use("/api", login);

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log("Listening on port", PORT));
