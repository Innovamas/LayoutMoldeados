const express = require("express");
const sql = require("mssql");
const app = express();
const PORT = process.env.PORT;

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: 1433,
  options: { encrypt: true, trustServerCertificate: false },
  pool: { max: 10, min: 1, idleTimeoutMillis: 300000 },
  connectionTimeout: 15000,
  requestTimeout: 20000   // falla rápido y claro, no a los 60 s
};

// CORS global: aplica también a los errores
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  next();
});

// Pool único, creado al arrancar
let poolPromise = sql.connect(config).catch(e => {
  console.error("Fallo conexión inicial:", e.message);
  poolPromise = null;
});
const getPool = async () => (poolPromise ??= sql.connect(config));

// Caché simple en memoria (60 s)
let cache = { data: null, ts: 0 };

app.get("/MovimientosDeInventario", async (req, res) => {
  if (cache.data && Date.now() - cache.ts < 60000) {
    return res.status(200).json(cache.data);
  }
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input("lgort", sql.VarChar, "M001")
      .input("matnr", sql.VarChar, "000000110000016544")
      .query(`
        SELECT TOP 500 CHARG, LIFNR, MENGE, LGORT, BWART, MATNR, BUDAT_MKPF
        FROM MovimientosDeInventario WITH (NOLOCK)
        WHERE BUDAT_MKPF >= CONVERT(INT, CONVERT(CHAR(8), DATEADD(MONTH,-1,GETDATE()), 112))
          AND LGORT = @lgort
          AND BWART IN (101,102)
          AND MATNR = @matnr
        ORDER BY BUDAT_MKPF DESC
      `);
    cache = { data: result.recordset, ts: Date.now() };
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("ERROR SQL:", error);
    poolPromise = null;  // fuerza reconexión al siguiente intento
    const timeout = /timeout/i.test(error.message);
    res.status(timeout ? 504 : 500).json({
      error: timeout ? "SAP no respondió a tiempo" : "Error consultando inventario",
      detail: error.message
    });
  }
});

app.get("/", (req, res) => res.send("API Layout Moldeados OK"));
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));
