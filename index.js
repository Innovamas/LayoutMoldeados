const express = require("express");
const sql = require("mssql");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración SQL Server (Azure / SAP)
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 30000
};

// Endpoint principal
app.get("/MovimientosDeInventario", async (req, res) => {
  try {
    // Conexión
    const pool = await sql.connect(config);

    // 🔹 Fechas en formato SAP YYYYMMDD
    const fechaInicio = 20250301;
    const fechaFin = 20250306;

    // 🔹 Material SAP (18 posiciones)
    const matnr = "110000016544".padStart(18, "0");

    const result = await pool
      .request()
      .input("fechaInicio", sql.Int, fechaInicio)
      .input("fechaFin", sql.Int, fechaFin)
      .input("matnr", sql.VarChar(18), matnr)
      .query(`
        SELECT TOP 100
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
          AND MATNR = @matnr
          AND BUDAT_MKPF BETWEEN @fechaInicio AND @fechaFin
        ORDER BY BUDAT_MKPF DESC
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

// Health check (Render)
app.get("/", (req, res) => {
  res.send("API Layout Moldeados OK");
});

app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`);
});
