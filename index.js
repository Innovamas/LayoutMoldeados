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
        CHARG,          -- Lote
        LIFNR,          -- Proveedor
        MENGE,          -- Cantidad
        LGORT,          -- Almacén
        BWART,          -- Tipo de movimiento
        MATNR,          -- Material
        BUDAT_MKPF      -- Fecha de contabilización
      FROM MovimientosDeInventario
      WHERE LGORT = 'M001'
        AND BWART IN (101, 102)
        AND MATNR = '110000016544'
        AND BUDAT_MKPF >= DATEADD(MONTH, -2, CAST(GETDATE() AS DATE))
    `);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3000, () => {
  console.log("API Costeo-Panovo MM60 corriendo en puerto 3000");
});

