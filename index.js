const express = require("express");
const sql = require("mssql");
const app = express();
const PORT = process.env.PORT;

// ===============================
// Configuración SQL Server (SAP)
// ===============================
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
  pool: {
    max: 10,
    min: 1,
    idleTimeoutMillis: 300000
  },
  connectionTimeout: 30000,
  requestTimeout: 90000   // ⬅️ solo para medir cuánto tarda realmente
};

// ===============================
// CORS global (aplica también a errores)
// ===============================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  next();
});

// ===============================
// Pool persistente
// ===============================
let poolPromise = null;
const getPool = async () => {
  if (!poolPromise) poolPromise = sql.connect(config);
  return poolPromise;
};

// ===============================
// Endpoint Movimientos Inventario
// ===============================
app.get("/MovimientosDeInventario", async (req, res) => {
  const t0 = Date.now();
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
  CHARG,
  LIFNR,
  MENGE,
  LGORT,
  BWART,
  MATNR,
  BUDAT_MKPF
FROM MovimientosDeInventario WITH (NOLOCK)
WHERE BUDAT_MKPF >= CONVERT(INT, FORMAT(DATEADD(MONTH, -1, GETDATE()), 'yyyyMMdd'))
  AND LGORT = 'M001'
  AND BWART IN (101,102)
  AND MATNR = '000000110000016544'
ORDER BY BUDAT_MKPF DESC
    `);
    console.log(`OK - ${result.recordset.length} filas en ${Date.now() - t0} ms`);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error(`ERROR SQL tras ${Date.now() - t0} ms:`, error);
    poolPromise = null;  // fuerza reconexión al siguiente intento
    const esTimeout = /timeout/i.test(error.message);
    res.status(esTimeout ? 504 : 500).json({
      error: esTimeout ? "SAP no respondió a tiempo" : "Error consultando inventario",
      detail: error.message,
      ms: Date.now() - t0
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
