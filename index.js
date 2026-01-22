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
    encrypt: true,
    trustServerCertificate: false
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

// ===============================
// Endpoint Movimientos Inventario
// ===============================
app.get("/MovimientosDeInventario", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
    SELECT TOP 100
  CHARG, LIFNR, MENGE, LGORT, BWART, MATNR, BUDAT_MKPF
FROM MovimientosDeInventario
WHERE LGORT = 'M001'
  AND BWART IN (101,102)
  AND MATNR = '000000110000016544'
ORDER BY BUDAT_MKPF DESC

    `);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(result.recordset);

  } catch (error) {
    console.error("ERROR SQL:", error);
    res.status(500).json({
      error: "Error consultando inventario",
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
