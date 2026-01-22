const express = require("express");
const sql = require("mssql");
const app = express();

// Configuración desde variables de ambiente
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

// Endpoint para leer Entradas de Paca de Cartón
app.get("/MovimientosDeInventario", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT
        CHARG, LIFNR, MENGE, LGORT, BWART, MATNR, BUDAT_MKPF      
      FROM MovimientosDeInventario
      WHERE LGORT = 'M001'
        AND BWART IN (101, 102)
        AND MATNR = '110000016544'
        AND BUDAT_MKPF >= DATEADD(DAY, -2, CAST(GETDATE() AS DATE))
    `);

// Endpoint para leer PedidosDeCompra_Ekpo
app.get("/PedidosDeCompra_Ekpo", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT EBELN, EBELP, AEDAT, LGORT, TXZ01, MENGE, PLIFZ 
      FROM PedidosDeCompra_Ekpo
    `);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3000, () => {
  console.log("API Costeo-Panovo MM60 corriendo en puerto 3000");
});
