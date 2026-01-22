import express from "express";
import cors from "cors";
import sql from "mssql";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔹 Configuración SQL Server (SAP)
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 60000 // ⬅️ clave para tablas grandes SAP
};

// 🔹 Endpoint principal
app.get("/MovimientosDeInventario", async (req, res) => {
  try {
    const pool = await sql.connect(sqlConfig);

    const result = await pool.request().query(`
      SELECT TOP 100
        CHARG,
        LIFNR,
        MENGE,
        LGORT,
        BWART,
        MATNR,
        BUDAT_MKPF
      FROM MovimientosDeInventario WITH (NOLOCK)
      WHERE BUDAT_MKPF >= CONVERT(INT, FORMAT(DATEADD(MONTH, -2, GETDATE()), 'yyyyMMdd'))
        AND LGORT = 'M001'
        AND BWART IN (101, 102)
        AND MATNR = '000000000110000016544'
      ORDER BY BUDAT_MKPF DESC
    `);

    res.status(200).json(result.recordset);

  } catch (error) {
    console.error("Error consultando inventario:", error);
    res.status(500).json({
      error: "Error consultando inventario",
      detail: error.message
    });
  }
});

// 🔹 Health check (Render lo necesita)
app.get("/", (req, res) => {
  res.send("API Layout Moldeados OK");
});

// 🔹 Arranque del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

