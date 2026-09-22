const db = require("../db");

const autoAssignDeliveryPartner = async (orderId) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    /* =========================
       GET ORDER
    ========================= */

    const [orders] = await connection.query(
      `
      SELECT
        id,
        shipping_address,
        delivery_partner_id,
        order_status
      FROM orders
      WHERE id = ?
      FOR UPDATE
      `,
      [orderId]
    );

    if (orders.length === 0) {
      throw new Error("Order not found");
    }

    const order = orders[0];

    /* =========================
       CHECK ALREADY ASSIGNED
    ========================= */

    if (order.delivery_partner_id) {
      await connection.rollback();

      return {
        success: false,
        message: "Order already assigned",
      };
    }

    /* =========================
       GET CUSTOMER CITY
    ========================= */

    let customerCity = null;

    try {
      const address =
        typeof order.shipping_address === "string"
          ? JSON.parse(order.shipping_address)
          : order.shipping_address;

      customerCity =
        address?.city ||
        address?.district ||
        null;

    } catch (error) {
      console.log(
        "Shipping address parse error:",
        error
      );
    }

    if (!customerCity) {
      await connection.rollback();

      return {
        success: false,
        message: "Customer city not found",
      };
    }

    /* =========================
       FIND AVAILABLE PARTNER
       IN SAME CITY
    ========================= */

    const [partners] = await connection.query(
      `
      SELECT
        id,
        name,
        city,
        availability_status
      FROM delivery_partners
      WHERE LOWER(city) = LOWER(?)
      AND status = 'active'
      AND availability_status = 'Online'
      ORDER BY id ASC
      LIMIT 1
      FOR UPDATE
      `,
      [customerCity]
    );

    /* =========================
       NO PARTNER AVAILABLE
    ========================= */

    if (partners.length === 0) {

      await connection.commit();

      return {
        success: false,
        message:
          "No delivery partner available in this location",
      };
    }

    const deliveryPartner = partners[0];

    /* =========================
       ASSIGN ORDER
    ========================= */

    await connection.query(
      `
      UPDATE orders
      SET
        delivery_partner_id = ?,
        delivery_status = 'Assigned',
        assigned_at = NOW()
      WHERE id = ?
      `,
      [
        deliveryPartner.id,
        orderId,
      ]
    );

    /* =========================
       SET PARTNER BUSY
    ========================= */

    await connection.query(
      `
      UPDATE delivery_partners
      SET availability_status = 'Busy'
      WHERE id = ?
      `,
      [deliveryPartner.id]
    );

    /* =========================
       CREATE NOTIFICATION
    ========================= */

    await connection.query(
      `
      INSERT INTO delivery_notifications
      (
        delivery_partner_id,
        order_id,
        title,
        message,
        is_read
      )
      VALUES (?, ?, ?, ?, FALSE)
      `,
      [
        deliveryPartner.id,
        orderId,
        "New Order Assigned",
        `A new order #${orderId} has been assigned to you`,
      ]
    );

    await connection.commit();

    return {
      success: true,

      message:
        "Order automatically assigned",

      delivery_partner: {
        id: deliveryPartner.id,
        name: deliveryPartner.name,
        city: deliveryPartner.city,
      },
    };

  } catch (error) {

    await connection.rollback();

    console.error(
      "Auto assignment error:",
      error
    );

    throw error;

  } finally {

    connection.release();

  }
};

module.exports =
  autoAssignDeliveryPartner;