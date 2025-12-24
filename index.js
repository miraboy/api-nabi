require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to api-nabi" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
