const express = require("express");
const sql = require("mssql");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración SQL Server
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: 1433,
  options: {
    encrypt: true
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};


// ===============================
// Endpoint Movimientos Inventario
// ===============================
app.get("/test-connection", async (req, res) => {
  try {
    await sql.connect(config);
    res.json({ status: "Conectado a SQL Server OK" });
  } catch (error) {
    res.status(500).json({
      error: "No conecta",
      detail: error.message
    });
  }
});

// ===============================
// Health check Render
// ===============================
app.get("/", (req, res) => {
  res.send("API Layout Moldeados OK");
});

// ===============================
// Start server
// ===============================
app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`);
});
