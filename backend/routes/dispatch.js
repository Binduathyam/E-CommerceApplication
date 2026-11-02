const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.use(requireAuth, requireRole("dispatch"));

const validId = value =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0;

// GET /api/dispatch/hubs?city=Chennai&status=Active
router.get("/hubs", async (req, res) => {
  try {
    const conditions = [];
    const params = [];

    if (req.query.city) {
      conditions.push("city = ?");
      params.push(String(req.query.city).trim());
    }
    if (req.query.status) {
      if (!["Active", "Inactive"].includes(String(req.query.status))) {
        return res.status(400).json({
          success: false, message: "status must be Active or Inactive"
        });
      }
      conditions.push("status = ?");
      params.push(String(req.query.status));
    }

    const [hubs] = await db.query(
      `SELECT id, hub_code, hub_name, address, city, state, pincode,
              status, created_at
       FROM dispatch_hubs
       ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
       ORDER BY city, hub_name`,
      params
    );
    res.json({ success: true, count: hubs.length, hubs });
  } catch (error) {
    console.error("Dispatch list hubs:", error);
    res.status(500).json({ success: false, message: "Failed to list hubs" });
  }
});

// POST /api/dispatch/hubs
router.post("/hubs", async (req, res) => {
  try {
    const fields = ["hub_code", "hub_name", "address", "city", "state", "pincode"];
    const limits = {
      hub_code: 30, hub_name: 150, address: 500,
      city: 100, state: 100, pincode: 10
    };
    const values = {};

    for (const field of fields) {
      if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
        return res.status(400).json({
          success: false, message: `${field} is required`
        });
      }
      values[field] = req.body[field].trim();
      if (values[field].length > limits[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} must be ${limits[field]} characters or fewer`
        });
      }
    }

    const [result] = await db.query(
      `INSERT INTO dispatch_hubs
       (hub_code, hub_name, address, city, state, pincode, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
      fields.map(field => values[field])
    );
    const [rows] = await db.query(
      `SELECT id, hub_code, hub_name, address, city, state,
              pincode, status, created_at
       FROM dispatch_hubs WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json({
      success: true, message: "Hub created successfully", hub: rows[0]
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false, message: "A hub with this code already exists"
      });
    }
    console.error("Dispatch create hub:", error);
    res.status(500).json({ success: false, message: "Failed to create hub" });
  }
});

// PUT /api/dispatch/hubs/:id/status
router.put("/hubs/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!validId(id)) {
      return res.status(400).json({ success: false, message: "Invalid hub ID" });
    }
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false, message: "status must be Active or Inactive"
      });
    }

    const [result] = await db.query(
      "UPDATE dispatch_hubs SET status = ? WHERE id = ?", [status, id]
    );
    if (!result.affectedRows) {
      const [existing] = await db.query(
        "SELECT id FROM dispatch_hubs WHERE id = ?", [id]
      );
      if (!existing.length) {
        return res.status(404).json({ success: false, message: "Hub not found" });
      }
    }

    const [rows] = await db.query(
      `SELECT id, hub_code, hub_name, address, city, state, pincode,
              status, created_at FROM dispatch_hubs WHERE id = ?`, [id]
    );
    res.json({ success: true, message: `Hub ${status.toLowerCase()}`, hub: rows[0] });
  } catch (error) {
    console.error("Dispatch hub status:", error);
    res.status(500).json({ success: false, message: "Failed to update hub" });
  }
});

// GET /api/dispatch/shipments?status=Picked%20Up
router.get("/shipments", async (req, res) => {
  try {
    const allowedStatuses = [
      "Ready for Pickup", "Picked Up", "Received at Origin Hub",
      "In Transit", "Arrived at Destination Hub"
    ];
    const conditions = [];
    const params = [];

    if (req.query.status) {
      if (!allowedStatuses.includes(String(req.query.status))) {
        return res.status(400).json({
          success: false, message: "Unsupported shipment status"
        });
      }
      conditions.push("s.shipment_status = ?");
      params.push(String(req.query.status));
    }

    const [shipments] = await db.query(
      `SELECT s.id, s.order_id, s.merchant_id, s.tracking_number,
              s.shipment_status, s.pickup_address, s.pickup_city,
              s.pickup_state, s.pickup_pincode, s.origin_hub_id,
              s.destination_hub_id, s.current_hub_id, s.created_at,
              oh.hub_name AS origin_hub_name,
              dh.hub_name AS destination_hub_name,
              ch.hub_name AS current_hub_name,
              ht.id AS transfer_id, ht.transfer_status,
              ht.transport_reference
       FROM merchant_shipments s
       LEFT JOIN dispatch_hubs oh ON oh.id = s.origin_hub_id
       LEFT JOIN dispatch_hubs dh ON dh.id = s.destination_hub_id
       LEFT JOIN dispatch_hubs ch ON ch.id = s.current_hub_id
       LEFT JOIN hub_transfers ht
         ON ht.id = (
           SELECT MAX(ht2.id) FROM hub_transfers ht2
           WHERE ht2.shipment_id = s.id
         )
       ${conditions.length ? "WHERE " + conditions.join(" AND ") : ""}
       ORDER BY s.created_at DESC LIMIT 500`,
      params
    );
    res.json({ success: true, count: shipments.length, shipments });
  } catch (error) {
    console.error("Dispatch list shipments:", error);
    res.status(500).json({
      success: false, message: "Failed to retrieve shipments"
    });
  }
});

// POST /api/dispatch/hubs/:hubId/shipments/:shipmentId/receive
router.post("/hubs/:hubId/shipments/:shipmentId/receive", async (req, res) => {
  let connection;
  try {
    const hubId = Number(req.params.hubId);
    const shipmentId = Number(req.params.shipmentId);
    if (!validId(hubId) || !validId(shipmentId)) {
      return res.status(400).json({
        success: false, message: "Invalid hub ID or shipment ID"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [hubs] = await connection.query(
      "SELECT id, hub_name, city, state, status FROM dispatch_hubs WHERE id = ? FOR UPDATE",
      [hubId]
    );
    const [shipments] = await connection.query(
      `SELECT id, order_id, merchant_id, tracking_number, shipment_status,
              origin_hub_id, current_hub_id
       FROM merchant_shipments WHERE id = ? FOR UPDATE`,
      [shipmentId]
    );

    if (!hubs.length || hubs[0].status !== "Active") {
      await connection.rollback();
      return res.status(409).json({
        success: false, message: "Hub not found or inactive"
      });
    }
    if (!shipments.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }

    const hub = hubs[0];
    const shipment = shipments[0];

    if (Number(shipment.origin_hub_id) !== hubId ||
        shipment.shipment_status !== "Picked Up") {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "Shipment must be Picked Up and assigned to this origin hub",
        currentStatus: shipment.shipment_status
      });
    }

    await connection.query(
      `UPDATE merchant_shipments
       SET shipment_status = 'Received at Origin Hub', current_hub_id = ?
       WHERE id = ?`, [hubId, shipmentId]
    );
    await connection.query(
      `INSERT INTO shipment_tracking_events
       (shipment_id, event_status, location_type, hub_id, city, state,
        notes, updated_by_role, updated_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shipmentId, "Received at Origin Hub", "hub", hubId, hub.city, hub.state,
       `Shipment received at origin hub: ${hub.hub_name}`, "dispatch", req.user.id]
    );

    await connection.commit();
    res.json({
      success: true, message: "Shipment received at origin hub",
      shipment: { id: shipmentId, shipment_status: "Received at Origin Hub", current_hub_id: hubId }
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    console.error("Dispatch receive shipment:", error);
    res.status(500).json({ success: false, message: "Failed to receive shipment" });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/dispatch/shipments/:shipmentId/dispatch
router.post("/shipments/:shipmentId/dispatch", async (req, res) => {
  let connection;
  try {
    const shipmentId = Number(req.params.shipmentId);
    const transportReference = typeof req.body.transport_reference === "string"
      ? req.body.transport_reference.trim().slice(0, 150) : null;

    if (!validId(shipmentId)) {
      return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [shipments] = await connection.query(
      `SELECT id, order_id, tracking_number, shipment_status,
              origin_hub_id, destination_hub_id, current_hub_id
       FROM merchant_shipments WHERE id = ? FOR UPDATE`, [shipmentId]
    );
    if (!shipments.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Shipment not found" });
    }
    const shipment = shipments[0];

    if (shipment.shipment_status !== "Received at Origin Hub" ||
        !shipment.origin_hub_id || !shipment.destination_hub_id ||
        Number(shipment.current_hub_id) !== Number(shipment.origin_hub_id)) {
      await connection.rollback();
      return res.status(409).json({
        success: false, message: "Shipment must be received at its origin hub first",
        currentStatus: shipment.shipment_status
      });
    }

    const [hubs] = await connection.query(
      `SELECT id, hub_name, city, state, status FROM dispatch_hubs
       WHERE id IN (?, ?) ORDER BY id FOR UPDATE`,
      [shipment.origin_hub_id, shipment.destination_hub_id]
    );
    const origin = hubs.find(h => Number(h.id) === Number(shipment.origin_hub_id));
    const destination = hubs.find(h => Number(h.id) === Number(shipment.destination_hub_id));

    if (!origin || !destination || origin.status !== "Active" ||
        destination.status !== "Active" || Number(origin.id) === Number(destination.id)) {
      await connection.rollback();
      return res.status(409).json({
        success: false, message: "Origin and destination hubs must be different and active"
      });
    }

    const [transferResult] = await connection.query(
      `INSERT INTO hub_transfers
       (shipment_id, origin_hub_id, destination_hub_id, transfer_status,
        transport_reference, dispatched_at)
       VALUES (?, ?, ?, 'In Transit', ?, NOW())`,
      [shipmentId, origin.id, destination.id, transportReference || null]
    );
    await connection.query(
      "UPDATE merchant_shipments SET shipment_status = 'In Transit' WHERE id = ?",
      [shipmentId]
    );
    await connection.query(
      `INSERT INTO shipment_tracking_events
       (shipment_id, event_status, location_type, hub_id, city, state,
        notes, updated_by_role, updated_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shipmentId, "In Transit", "hub", origin.id, origin.city, origin.state,
       `Shipment dispatched from ${origin.hub_name} to ${destination.hub_name}` +
         (transportReference ? `. Transport reference: ${transportReference}` : ""),
       "dispatch", req.user.id]
    );

    await connection.commit();
    res.status(201).json({
      success: true, message: "Shipment dispatched to destination hub",
      transfer: {
        id: transferResult.insertId, shipment_id: shipmentId,
        origin_hub: origin.hub_name, destination_hub: destination.hub_name,
        transfer_status: "In Transit", transport_reference: transportReference || null
      }
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    console.error("Dispatch intercity shipment:", error);
    res.status(500).json({ success: false, message: "Failed to dispatch shipment" });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/dispatch/hub-transfers/:transferId/arrive
router.post("/hub-transfers/:transferId/arrive", async (req, res) => {
  let connection;
  try {
    const transferId = Number(req.params.transferId);
    if (!validId(transferId)) {
      return res.status(400).json({ success: false, message: "Invalid transfer ID" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [transfers] = await connection.query(
      `SELECT id, shipment_id, destination_hub_id, transfer_status
       FROM hub_transfers WHERE id = ? FOR UPDATE`, [transferId]
    );
    if (!transfers.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Transfer not found" });
    }
    const transfer = transfers[0];

    const [shipments] = await connection.query(
      `SELECT id, shipment_status, destination_hub_id
       FROM merchant_shipments WHERE id = ? FOR UPDATE`, [transfer.shipment_id]
    );
    if (transfer.transfer_status !== "In Transit" || !shipments.length ||
        shipments[0].shipment_status !== "In Transit" ||
        Number(shipments[0].destination_hub_id) !== Number(transfer.destination_hub_id)) {
      await connection.rollback();
      return res.status(409).json({
        success: false, message: "Transfer or shipment is not in a valid arrival state"
      });
    }

    const [hubs] = await connection.query(
      `SELECT id, hub_name, city, state, status FROM dispatch_hubs WHERE id = ?`,
      [transfer.destination_hub_id]
    );
    if (!hubs.length || hubs[0].status !== "Active") {
      await connection.rollback();
      return res.status(409).json({
        success: false, message: "Destination hub not found or inactive"
      });
    }
    const destination = hubs[0];

    await connection.query(
      "UPDATE hub_transfers SET transfer_status = 'Arrived', arrived_at = NOW() WHERE id = ?",
      [transferId]
    );
    await connection.query(
      `UPDATE merchant_shipments
       SET shipment_status = 'Arrived at Destination Hub', current_hub_id = ?
       WHERE id = ?`, [destination.id, transfer.shipment_id]
    );
    await connection.query(
      `INSERT INTO shipment_tracking_events
       (shipment_id, event_status, location_type, hub_id, city, state,
        notes, updated_by_role, updated_by_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [transfer.shipment_id, "Arrived at Destination Hub", "hub",
       destination.id, destination.city, destination.state,
       `Shipment received at destination hub: ${destination.hub_name}`,
       "dispatch", req.user.id]
    );

    await connection.commit();
    res.json({
      success: true, message: "Destination arrival recorded",
      transfer: {
        id: transferId, shipment_id: transfer.shipment_id,
        transfer_status: "Arrived",
        shipment_status: "Arrived at Destination Hub",
        destination_hub: destination.hub_name
      }
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    console.error("Dispatch destination arrival:", error);
    res.status(500).json({ success: false, message: "Failed to record arrival" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;