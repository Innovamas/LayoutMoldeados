import sql from "mssql";

export const obtenerMovimientosInventario = async (req, res) => {
  try {
    // 🔹 Configuración de conexión
    const config = {
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
      requestTimeout: 60000 // ⬅️ importante para SAP grande
    };

    // 🔹 Conexión
    const pool = await sql.connect(config);

    // 🔹 Query: últimos 2 meses
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

    // 🔹 Respuesta
    res.status(200).json(result.recordset);

  } catch (error) {
    console.error("Error consultando inventario:", error);

    res.status(500).json({
      error: "Error consultando inventario",
      detail: error.message
    });
  }
};
