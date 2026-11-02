import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../../config/api";

// Delivery API (same endpoints as the web Shipments page)
const API = `${API_BASE_URL}/api/delivery`;

// Change this one colour if the delivery screens use a different theme
const ACCENT = "#7c3aed";
const ACCENT_SOFT = "#ede9fe";

// =====================================================
// TYPES
// =====================================================

type Shipment = {
  shipment_id: number;
  order_id?: number;
  tracking_number?: string;
  shipment_status?: string;

  pickup_address?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_pincode?: string;

  origin_hub_name?: string;
  destination_hub_name?: string;

  destination_city?: string;
  destination_state?: string;

  destination_hub_city?: string;
  destination_hub_state?: string;

  ready_at?: string;
  assigned_at?: string;
};

type ApiResult = {
  unavailable?: boolean;
  shipments?: Shipment[];
  pickupShipments?: Shipment[];
  lastMileShipments?: Shipment[];
  message?: string;
};

// =====================================================
// REQUEST HELPER (same behaviour as the web app)
// =====================================================

const getToken = async () => {
  const token =
    (await AsyncStorage.getItem("authToken")) ||
    (await AsyncStorage.getItem("delivery_token"));

  if (!token) {
    throw new Error("Delivery Partner session expired. Please log in again.");
  }

  return token;
};

async function shipmentRequest(
  path: string,
  options: { method?: string; body?: any } = {}
): Promise<ApiResult> {
  const token = await getToken();

  const response = await fetch(`${API}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body:
      options.method && options.method !== "GET"
        ? JSON.stringify(options.body || {})
        : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // available-shipment endpoints return 409 when the partner is Busy/Offline
    if (response.status === 409) {
      return { ...data, unavailable: true };
    }

    throw new Error(data.message || "Shipment request failed");
  }

  return data;
}

// =====================================================
// SMALL COMPONENTS
// =====================================================

function SectionTitle({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle: string;
  count: number;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );
}

function EmptyBox({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function ShipmentCard({
  shipment,
  children,
}: {
  shipment: Shipment;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopText}>
          <Text style={styles.cardTitle}>Order #{shipment.order_id}</Text>
          <Text style={styles.cardSubtitle}>
            Tracking: {shipment.tracking_number || "N/A"}
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{shipment.shipment_status}</Text>
        </View>
      </View>

      {children}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  label,
  loadingLabel,
  loading,
  disabled,
  success,
  onPress,
}: {
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled: boolean;
  success?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        success && styles.actionSuccess,
        disabled && styles.actionDisabled,
      ]}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {loading ? (
        <View style={styles.actionLoading}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.actionText}>{loadingLabel}</Text>
        </View>
      ) : (
        <Text style={styles.actionText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

// =====================================================
// SCREEN
// =====================================================

export default function Shipments() {
  const router = useRouter();

  const [availablePickups, setAvailablePickups] = useState<Shipment[]>([]);
  const [availableLastMile, setAvailableLastMile] = useState<Shipment[]>([]);
  const [pickupAssignments, setPickupAssignments] = useState<Shipment[]>([]);
  const [lastMileAssignments, setLastMileAssignments] = useState<Shipment[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [hiddenNotice, setHiddenNotice] = useState(false);
  const [actionId, setActionId] = useState("");

  // =====================================================
  // LOAD SHIPMENTS
  // =====================================================

  const loadShipments = useCallback(async () => {
    setError("");

    try {
      const [pickups, lastMile, assignments] = await Promise.all([
        shipmentRequest("/shipments/available-pickups"),
        shipmentRequest("/shipments/available-last-mile"),
        shipmentRequest("/shipments/my-assignments"),
      ]);

      setAvailablePickups(pickups.unavailable ? [] : pickups.shipments || []);
      setAvailableLastMile(lastMile.unavailable ? [] : lastMile.shipments || []);

      setHiddenNotice(Boolean(pickups.unavailable || lastMile.unavailable));

      setPickupAssignments(assignments.pickupShipments || []);
      setLastMileAssignments(assignments.lastMileShipments || []);
    } catch (err: any) {
      console.error("Shipments load error:", err);
      setError(err?.message || "Unable to load shipments");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadShipments();
      setLoading(false);
    };

    load();
  }, [loadShipments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadShipments();
    setRefreshing(false);
  };

  // =====================================================
  // ACTIONS
  // =====================================================

  const performAction = async (
    id: number,
    action: string,
    path: string,
    method: string,
    body: any = {}
  ) => {
    setActionId(`${action}-${id}`);
    setError("");

    try {
      await shipmentRequest(path, { method, body });
      await loadShipments();
    } catch (err: any) {
      console.error("Shipment action error:", err);
      setError(err?.message || "Unable to update shipment");
    } finally {
      setActionId("");
    }
  };

  const confirmDelivered = (shipment: Shipment) => {
    Alert.alert(
      "Mark as Delivered",
      `Confirm that Order #${shipment.order_id} has been delivered to the customer.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Delivered",
          onPress: () =>
            performAction(
              shipment.shipment_id,
              "delivered",
              `/shipments/${shipment.shipment_id}/last-mile-status`,
              "PUT",
              { status: "Delivered" }
            ),
        },
      ]
    );
  };

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatDate = (value?: string) => {
    if (!value) return "Not available";

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
  };

  const joinParts = (...parts: (string | undefined)[]) =>
    parts.filter(Boolean).join(", ") || "Not available";

  const busy = !!actionId;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading shipments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ACCENT}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>DELIVERY OPERATIONS</Text>
            <Text style={styles.title}>Shipments</Text>
            <Text style={styles.subtitle}>
              Manage merchant pickups and destination hub deliveries.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.refreshButton, (busy || refreshing) && styles.actionDisabled]}
            onPress={handleRefresh}
            disabled={busy || refreshing}
          >
            <Text style={styles.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* ERROR */}

        {error !== "" && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* BUSY / OFFLINE NOTICE */}

        {hiddenNotice && (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              New shipments are hidden while your status is Busy or Offline. Set
              yourself Available to see them.
            </Text>
          </View>
        )}

        {/* =================================================
            AVAILABLE PICKUPS
        ================================================= */}

        <SectionTitle
          title="Available Pickups"
          subtitle="Collect parcels from merchants in your service area."
          count={availablePickups.length}
        />

        {availablePickups.length === 0 ? (
          <EmptyBox
            icon="📦"
            title="No available pickups"
            text="New merchant pickup requests will appear here."
          />
        ) : (
          availablePickups.map((shipment) => (
            <ShipmentCard key={shipment.shipment_id} shipment={shipment}>
              <Detail
                label="Pickup Address"
                value={shipment.pickup_address || "Not available"}
              />
              <Detail
                label="Location"
                value={joinParts(
                  shipment.pickup_city,
                  shipment.pickup_state,
                  shipment.pickup_pincode
                )}
              />
              <Detail
                label="Origin Hub"
                value={shipment.origin_hub_name || "Not assigned"}
              />
              <Detail label="Ready At" value={formatDate(shipment.ready_at)} />

              <ActionButton
                label="Accept Pickup"
                loadingLabel="Accepting..."
                loading={actionId === `accept-pickup-${shipment.shipment_id}`}
                disabled={busy}
                onPress={() =>
                  performAction(
                    shipment.shipment_id,
                    "accept-pickup",
                    `/shipments/${shipment.shipment_id}/accept-pickup`,
                    "POST"
                  )
                }
              />
            </ShipmentCard>
          ))
        )}

        {/* =================================================
            MY PICKUPS
        ================================================= */}

        <SectionTitle
          title="My Pickups"
          subtitle="Track parcels assigned to you for origin hub handover."
          count={pickupAssignments.length}
        />

        {pickupAssignments.length === 0 ? (
          <EmptyBox
            icon="🚚"
            title="No assigned pickups"
            text="Accepted merchant pickups will appear here."
          />
        ) : (
          pickupAssignments.map((shipment) => (
            <ShipmentCard key={shipment.shipment_id} shipment={shipment}>
              <Detail
                label="Pickup Location"
                value={joinParts(shipment.pickup_city, shipment.pickup_state)}
              />
              <Detail
                label="Origin Hub"
                value={shipment.origin_hub_name || "Not available"}
              />
              <Detail label="Assigned At" value={formatDate(shipment.assigned_at)} />

              {shipment.shipment_status === "Pickup Assigned" ? (
                <ActionButton
                  label="Confirm Pickup"
                  loadingLabel="Confirming..."
                  loading={actionId === `confirm-pickup-${shipment.shipment_id}`}
                  disabled={busy}
                  onPress={() =>
                    performAction(
                      shipment.shipment_id,
                      "confirm-pickup",
                      `/shipments/${shipment.shipment_id}/confirm-pickup`,
                      "PUT"
                    )
                  }
                />
              ) : (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingTitle}>Pickup Confirmed</Text>
                  <Text style={styles.waitingText}>
                    Waiting for the Dispatch Partner to receive this parcel at the
                    Origin Hub.
                  </Text>
                </View>
              )}
            </ShipmentCard>
          ))
        )}

        {/* =================================================
            AVAILABLE LAST MILE
        ================================================= */}

        <SectionTitle
          title="Available Last-Mile Deliveries"
          subtitle="Accept parcels that have arrived at their destination hub."
          count={availableLastMile.length}
        />

        {availableLastMile.length === 0 ? (
          <EmptyBox
            icon="🏠"
            title="No last-mile shipments available"
            text="Destination hub arrivals will appear here."
          />
        ) : (
          availableLastMile.map((shipment) => (
            <ShipmentCard key={shipment.shipment_id} shipment={shipment}>
              <Detail
                label="Destination Hub"
                value={shipment.destination_hub_name || "Not available"}
              />
              <Detail
                label="Location"
                value={joinParts(shipment.destination_city, shipment.destination_state)}
              />

              <ActionButton
                label="Accept Delivery"
                loadingLabel="Accepting..."
                loading={actionId === `accept-last-mile-${shipment.shipment_id}`}
                disabled={busy}
                onPress={() =>
                  performAction(
                    shipment.shipment_id,
                    "accept-last-mile",
                    `/shipments/${shipment.shipment_id}/accept-last-mile`,
                    "POST"
                  )
                }
              />
            </ShipmentCard>
          ))
        )}

        {/* =================================================
            MY LAST-MILE DELIVERIES
        ================================================= */}

        <SectionTitle
          title="My Last-Mile Deliveries"
          subtitle="Complete deliveries assigned to you."
          count={lastMileAssignments.length}
        />

        {lastMileAssignments.length === 0 ? (
          <EmptyBox
            icon="🛵"
            title="No active last-mile deliveries"
            text="Your accepted destination deliveries will appear here."
          />
        ) : (
          lastMileAssignments.map((shipment) => (
            <ShipmentCard key={shipment.shipment_id} shipment={shipment}>
              <Detail
                label="Destination Hub"
                value={shipment.destination_hub_name || "Not available"}
              />
              <Detail
                label="Location"
                value={joinParts(
                  shipment.destination_hub_city,
                  shipment.destination_hub_state
                )}
              />
              <Detail label="Assigned At" value={formatDate(shipment.assigned_at)} />

              {shipment.shipment_status === "Assigned for Last Mile" && (
                <ActionButton
                  label="Start Delivery"
                  loadingLabel="Updating..."
                  loading={actionId === `out-for-delivery-${shipment.shipment_id}`}
                  disabled={busy}
                  onPress={() =>
                    performAction(
                      shipment.shipment_id,
                      "out-for-delivery",
                      `/shipments/${shipment.shipment_id}/last-mile-status`,
                      "PUT",
                      { status: "Out for Delivery" }
                    )
                  }
                />
              )}

              {shipment.shipment_status === "Out for Delivery" && (
                <ActionButton
                  label="Mark Delivered"
                  loadingLabel="Updating..."
                  success
                  loading={actionId === `delivered-${shipment.shipment_id}`}
                  disabled={busy}
                  onPress={() => confirmDelivered(shipment)}
                />
              )}
            </ShipmentCard>
          ))
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7f7fb" },
  container: { flex: 1, backgroundColor: "#f7f7fb" },
  content: { padding: 16, paddingBottom: 30 },

  // header
  header: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    elevation: 2,
  },
  backText: { fontSize: 24, color: "#27272a" },
  headerText: { flex: 1 },
  eyebrow: { color: ACCENT, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#18181b", fontSize: 25, fontWeight: "800" },
  subtitle: { color: "#71717a", fontSize: 10, marginTop: 3, lineHeight: 15 },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    marginLeft: 8,
  },
  refreshText: { fontSize: 23, color: "#52525b" },

  // messages
  errorCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: "#b91c1c", fontSize: 12 },
  noticeCard: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  noticeText: { color: "#9a3412", fontSize: 11, lineHeight: 16 },

  // sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 12,
  },
  sectionHeaderText: { flex: 1, paddingRight: 10 },
  sectionTitle: { color: "#18181b", fontSize: 17, fontWeight: "800" },
  sectionSubtitle: { color: "#71717a", fontSize: 10, marginTop: 3, lineHeight: 15 },
  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: { color: ACCENT, fontSize: 12, fontWeight: "800" },

  // empty
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#dbe2ea",
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 6,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { color: "#334155", fontSize: 13, fontWeight: "800", marginTop: 10 },
  emptyText: { color: "#94a3b8", fontSize: 11, marginTop: 4, textAlign: "center" },

  // shipment card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cardTopText: { flex: 1, paddingRight: 10 },
  cardTitle: { color: "#1e293b", fontSize: 15, fontWeight: "800" },
  cardSubtitle: { color: "#94a3b8", fontSize: 10, marginTop: 4 },
  statusBadge: {
    backgroundColor: "#fff7ed",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 140,
  },
  statusText: { color: "#ea580c", fontSize: 9, fontWeight: "800", textAlign: "center" },

  // details
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  detailLabel: { color: "#334155", fontSize: 10, fontWeight: "800" },
  detailValue: { color: "#64748b", fontSize: 12, marginTop: 3, lineHeight: 17 },

  // actions
  actionButton: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  actionSuccess: { backgroundColor: "#16a34a" },
  actionDisabled: { opacity: 0.6 },
  actionText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  actionLoading: { flexDirection: "row", alignItems: "center", gap: 8 },

  waitingBox: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  waitingTitle: { color: "#c2410c", fontSize: 12, fontWeight: "800" },
  waitingText: { color: "#9a3412", fontSize: 11, lineHeight: 16, marginTop: 5 },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#71717a", fontSize: 13, marginTop: 12 },
  bottomSpace: { height: 25 },
});
