const express = require("express");
const sql = require("mssql");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración SQL Server (Azure)
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

// Endpoint principal
app.get("/MovimientosDeInventario", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT
        CHARG,
        LIFNR,
        MENGE,
        LGORT,
        BWART,
        MATNR,
        BUDAT_MKPF
      FROM MovimientosDeInventario
      WHERE LGORT = 'M001'
        AND BWART IN (101, 102)
        AND MATNR = '110000016544'
        AND BUDAT_MKPF >= DATEADD(MONTH, -2, CAST(GETDATE() AS DATE))
    `);

    res.json(result.recordset);
  } catch (error) {
  console.error("ERROR SQL:", error);
  res.status(500).json({
    error: "Error consultando inventario",
    detail: error.message
  });
}

});

// Health check (IMPORTANTE para Render)
app.get("/", (req, res) => {
  res.send("API Layout Moldeados OK");
});

app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`);
});
