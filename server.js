const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const path = require("path");

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "dashboard.html")); });
// ================= DATABASE =================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ================= CREATE TABLE =================

pool.query(`
CREATE TABLE IF NOT EXISTS tracker_data (
    id SERIAL PRIMARY KEY,
    tracker_id TEXT,
    latitude REAL,
    longitude REAL,
    current_angle REAL,
    target_angle REAL,
    actuator_stroke REAL,
    movement_count INTEGER,
    runtime_ms BIGINT,
    status TEXT,
    wifi_rssi INTEGER,
    gps_satellites INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);

// ================= UPDATE API =================

app.post("/update", async (req, res) => {
  try {
    const {
      tracker_id,
      latitude,
      longitude,
      current_angle,
      target_angle,
      actuator_stroke,
      movement_count,
      runtime_ms,
      status,
      wifi_rssi,
      gps_satellites,
    } = req.body;

    await pool.query(
      `
      INSERT INTO tracker_data (
        tracker_id,
        latitude,
        longitude,
        current_angle,
        target_angle,
        actuator_stroke,
        movement_count,
        runtime_ms,
        status,
        wifi_rssi,
        gps_satellites
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
    `,
      [
        tracker_id,
        latitude,
        longitude,
        current_angle,
        target_angle,
        actuator_stroke,
        movement_count,
        runtime_ms,
        status,
        wifi_rssi,
        gps_satellites,
      ]
    );

    res.json({
      status: "success",
    });
  } catch (err) {
    console.log(err);

    res.json({
      status: "error",
      error: err.message,
    });
  }
});

// ================= GET LATEST =================

app.get("/latest", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM tracker_data
      ORDER BY id DESC
      LIMIT 1
    `);

    res.json(result.rows[0]);
  } catch (err) {
    res.json({
      status: "error",
    });
  }
});

// ================= DASHBOARD =================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ================= START =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server Running");
});
