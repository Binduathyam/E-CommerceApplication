import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Adjust this import to wherever your mobile app keeps API_BASE_URL
import { API_BASE_URL } from "../../config/api";

const API = `${API_BASE_URL}/api/dispatch`;

type IconName = React.ComponentProps<typeof Feather>["name"];
type SectionId = "overview" | "hubs" | "inbound" | "intercity" | "arrival";

type Hub = {
  id: number | string;
  hub_code?: string;
  hub_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_active?: number | boolean;
  status?: string;
};

type Shipment = {
  id: number | string;
  order_id?: number | string;
  tracking_number?: string;
  origin_hub_id?: number | string;
  origin_hub_name?: string;
  destination_hub_name?: string;
  shipment_status?: string;
  transfer_id?: number | string;
};

const SECTIONS: { id: SectionId; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "hubs", label: "Hub Management", icon: "home" },
  { id: "inbound", label: "Inbound Shipments", icon: "package" },
  { id: "intercity", label: "Intercity Dispatch", icon: "truck" },
  { id: "arrival", label: "Destination Arrival", icon: "map-pin" },
];

const EMPTY_HUB_FORM = {
  hub_code: "",
  hub_name: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

// table column widths (table scrolls sideways, same as web on small screens)
const COL = { shipment: 130, origin: 150, destination: 150, status: 150, action: 250 };

/* ================= helpers ================= */

async function dispatchRequest(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("dispatchToken");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}

function getItems(data: any, key: string) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function isHubActive(hub: Hub) {
  return hub.is_active === 1 || hub.is_active === true || hub.status === "Active";
}

function badgeColors(status: string) {
  const key = status.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (["active", "delivered", "received", "arrived", "approved", "completed"].includes(key)) {
    return { bg: "#dcfce7", fg: "#166534" };
  }
  if (["inactive", "cancelled", "rejected", "failed"].includes(key)) {
    return { bg: "#fee2e2", fg: "#991b1b" };
  }
  if (["in-transit", "picked-up", "ready-for-pickup", "received-at-origin-hub"].includes(key)) {
    return { bg: "#dbeafe", fg: "#1d4ed8" };
  }
  if (["pending", "processing", "unknown"].includes(key)) {
    return { bg: "#fef3c7", fg: "#92400e" };
  }
  return { bg: "#f1f5f9", fg: "#475569" };
}

/* ================= small components ================= */

function StatusBadge({ status }: { status?: string }) {
  const value = status || "Unknown";
  const { bg, fg } = badgeColors(value);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{value}</Text>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  tint,
  tintBg,
}: {
  icon: IconName;
  label: string;
  value: number;
  description: string;
  tint: string;
  tintBg: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tintBg }]}>
        <Feather name={icon} size={22} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statDesc}>{description}</Text>
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Feather name={icon} size={15} color="#fff" />
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// replacement for the web <select>
function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const all = ["", ...options];

  return (
    <>
      <TouchableOpacity style={styles.select} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.selectText} numberOfLines={1}>
          {value || "All statuses"}
        </Text>
        <Feather name="chevron-down" size={16} color="#64748b" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            <ScrollView>
              {all.map((option) => (
                <TouchableOpacity
                  key={option || "all"}
                  style={styles.modalOption}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[styles.modalOptionText, value === option && styles.modalOptionActive]}
                  >
                    {option || "All statuses"}
                  </Text>
                  {value === option && <Feather name="check" size={16} color="#2563eb" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ================= LOGIN ================= */

export function DispatchLogin({
  onBack,
  onLoginSuccess,
  onRegister,
}: {
  onBack?: () => void;
  onLoginSuccess?: () => void;
  onRegister?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: "dispatch",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to sign in.");
      }

      const token =
        data.token || data.accessToken || data.data?.token || data.data?.accessToken;

      if (!token) {
        throw new Error("Login response did not include a token.");
      }

      await AsyncStorage.setItem("dispatchToken", token);
      await AsyncStorage.setItem(
        "dispatchUser",
        JSON.stringify(data.user || data.data?.user || {})
      );

      onLoginSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.loginScreen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.loginCard}>
            <View style={styles.brandMark}>
              <Feather name="truck" size={28} color="#fff" />
            </View>

            <Text style={styles.eyebrowLogin}>SHOPEASE LOGISTICS</Text>
            <Text style={styles.loginTitle}>Dispatch Portal</Text>
            <Text style={styles.loginMuted}>Sign in to manage hubs and shipment movement.</Text>

            {error !== "" && (
              <View style={[styles.alert, styles.alertError]}>
                <Feather name="alert-circle" size={18} color="#b91c1c" />
                <Text style={[styles.alertText, { color: "#b91c1c" }]}>{error}</Text>
              </View>
            )}

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your dispatch email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 22 }, busy && styles.disabled]}
              onPress={handleSubmit}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign in to Dispatch</Text>
              )}
            </TouchableOpacity>

            {onRegister && (
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>New dispatcher? </Text>
                <TouchableOpacity onPress={onRegister}>
                  <Text style={styles.registerLink}>Request an account</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
              <Text style={styles.backBtnText}>← Back to ShopEase</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= DASHBOARD ================= */

export function DispatchDashboard({ onLogout }: { onLogout?: () => void }) {
  const [section, setSection] = useState<SectionId>("overview");
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [transportRefs, setTransportRefs] = useState<Record<string, string>>({});
  const [hubForm, setHubForm] = useState(EMPTY_HUB_FORM);

  const loadData = useCallback(async () => {
    setError("");

    try {
      const [hubResponse, shipmentResponse] = await Promise.all([
        dispatchRequest("/hubs"),
        dispatchRequest("/shipments"),
      ]);

      setHubs(getItems(hubResponse, "hubs"));
      setShipments(getItems(shipmentResponse, "shipments"));
    } catch (err: any) {
      setError(err?.message || "Unable to load dispatch data.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("dispatchToken");
      if (!token) {
        onLogout?.();
        return;
      }
      loadData();
    })();
  }, [loadData, onLogout]);

  const counts = useMemo(() => {
    return {
      hubs: hubs.filter(isHubActive).length,
      total: shipments.length,
      inbound: shipments.filter((s) =>
        ["Picked Up", "Ready for Pickup"].includes(s.shipment_status || "")
      ).length,
      intercity: shipments.filter((s) => s.shipment_status === "Received at Origin Hub").length,
      arrival: shipments.filter((s) => s.shipment_status === "In Transit").length,
    };
  }, [hubs, shipments]);

  const statusOptions = useMemo(
    () => [...new Set(shipments.map((s) => s.shipment_status).filter(Boolean) as string[])].sort(),
    [shipments]
  );

  const visibleShipments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const status = shipment.shipment_status || "";
      const matchesFilter = !filter || status === filter;

      const searchableText = [
        shipment.id,
        shipment.order_id,
        shipment.tracking_number,
        shipment.origin_hub_name,
        shipment.destination_hub_name,
        shipment.shipment_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableText.includes(query);
    });
  }, [shipments, searchQuery, filter]);

  async function perform(path: string, body: object, successMessage: string) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await dispatchRequest(path, {
        method: "POST",
        body: JSON.stringify(body || {}),
      });

      setMessage(successMessage);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function createHub() {
    setError("");
    setMessage("");

    if (Object.values(hubForm).some((value) => !value.trim())) {
      setError("Please fill in all hub details.");
      return;
    }

    setBusy(true);

    try {
      await dispatchRequest("/hubs", {
        method: "POST",
        body: JSON.stringify(hubForm),
      });

      setHubForm(EMPTY_HUB_FORM);
      setMessage("Hub created successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Unable to create hub.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleHub(hub: Hub) {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await dispatchRequest(`/hubs/${hub.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !isHubActive(hub) }),
      });

      setMessage("Hub status updated.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Unable to update hub status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setMobileNavOpen(false);
    await AsyncStorage.multiRemove(["dispatchToken", "dispatchUser"]);
    onLogout?.();
  }

  function openSection(id: SectionId) {
    setSection(id);
    setFilter("");
    setSearchQuery("");
    setMobileNavOpen(false);
  }

  function shipmentTable(items: Shipment[], mode: SectionId) {
    if (!items.length) {
      return (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Feather name="package" size={26} color="#64748b" />
          </View>
          <Text style={styles.emptyTitle}>No shipments found</Text>
          <Text style={styles.emptyText}>Shipments matching this section will appear here.</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { width: COL.shipment }]}>SHIPMENT</Text>
              <Text style={[styles.th, { width: COL.origin }]}>ORIGIN HUB</Text>
              <Text style={[styles.th, { width: COL.destination }]}>DESTINATION HUB</Text>
              <Text style={[styles.th, { width: COL.status }]}>STATUS</Text>
              <Text style={[styles.th, { width: COL.action }]}>ACTION</Text>
            </View>

            {items.map((shipment, index) => {
              const status = shipment.shipment_status;
              const key = String(shipment.id);
              let action: React.ReactNode = null;

              if (mode === "inbound" && ["Picked Up", "Ready for Pickup"].includes(status || "")) {
                action = (
                  <ActionButton
                    icon="check-circle"
                    label="Receive"
                    disabled={busy || !shipment.origin_hub_id}
                    onPress={() =>
                      perform(
                        `/hubs/${shipment.origin_hub_id}/shipments/${shipment.id}/receive`,
                        {},
                        "Shipment received at origin hub."
                      )
                    }
                  />
                );
              } else if (mode === "intercity" && status === "Received at Origin Hub") {
                action = (
                  <View style={styles.actionGroup}>
                    <TextInput
                      style={[styles.input, styles.transportInput]}
                      placeholder="Transport ref"
                      placeholderTextColor="#94a3b8"
                      value={transportRefs[key] || ""}
                      onChangeText={(text) =>
                        setTransportRefs((current) => ({ ...current, [key]: text }))
                      }
                    />
                    <ActionButton
                      icon="truck"
                      label="Dispatch"
                      disabled={busy}
                      onPress={() =>
                        perform(
                          `/shipments/${shipment.id}/dispatch`,
                          { transport_reference: transportRefs[key] || "" },
                          "Shipment dispatched to destination hub."
                        )
                      }
                    />
                  </View>
                );
              } else if (mode === "arrival" && status === "In Transit" && shipment.transfer_id) {
                action = (
                  <ActionButton
                    icon="map-pin"
                    label="Mark Arrived"
                    disabled={busy}
                    onPress={() =>
                      perform(
                        `/hub-transfers/${shipment.transfer_id}/arrive`,
                        {},
                        "Shipment arrival recorded."
                      )
                    }
                  />
                );
              } else {
                action = <Text style={styles.muted}>No action</Text>;
              }

              return (
                <View
                  key={key}
                  style={[styles.tr, index === items.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={{ width: COL.shipment, paddingHorizontal: 16 }}>
                    <Text style={styles.shipmentId}>#{shipment.id}</Text>
                    <Text style={styles.shipmentSub}>
                      {shipment.tracking_number ||
                        (shipment.order_id ? `Order #${shipment.order_id}` : "Shipment")}
                    </Text>
                  </View>
                  <Text style={[styles.td, { width: COL.origin }]}>
                    {shipment.origin_hub_name || "—"}
                  </Text>
                  <Text style={[styles.td, { width: COL.destination }]}>
                    {shipment.destination_hub_name || "—"}
                  </Text>
                  <View style={{ width: COL.status, paddingHorizontal: 16, alignItems: "flex-start" }}>
                    <StatusBadge status={status} />
                  </View>
                  <View style={{ width: COL.action, paddingHorizontal: 16 }}>{action}</View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  const activeSection = SECTIONS.find((item) => item.id === section);

  const sectionHeading =
    section === "inbound"
      ? { title: "Inbound Shipments", sub: "Receive shipments at the origin hub." }
      : section === "intercity"
      ? { title: "Intercity Dispatch", sub: "Record dispatch between logistics hubs." }
      : { title: "Destination Arrival", sub: "Record arrival at the destination hub." };

  const sectionShipments = visibleShipments.filter((s) => {
    if (section === "inbound") {
      return ["Ready for Pickup", "Picked Up"].includes(s.shipment_status || "");
    }
    if (section === "intercity") return s.shipment_status === "Received at Origin Hub";
    return s.shipment_status === "In Transit";
  });

  const hubFields: { key: keyof typeof EMPTY_HUB_FORM; placeholder: string; numeric?: boolean }[] = [
    { key: "hub_code", placeholder: "Hub code" },
    { key: "hub_name", placeholder: "Hub name" },
    { key: "address", placeholder: "Address" },
    { key: "city", placeholder: "City" },
    { key: "state", placeholder: "State" },
    { key: "pincode", placeholder: "Pincode", numeric: true },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      {/* Sidebar (slide-in menu, same as web on mobile) */}
      <Modal
        visible={mobileNavOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMobileNavOpen(false)}
      >
        <View style={styles.drawerWrap}>
          <SafeAreaView style={styles.drawer}>
            <View style={styles.drawerBrand}>
              <View style={styles.brandMarkSmall}>
                <Feather name="truck" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerBrandTitle}>SHOPEASE</Text>
                <Text style={styles.drawerBrandSub}>LOGISTICS</Text>
              </View>
              <TouchableOpacity onPress={() => setMobileNavOpen(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <Text style={styles.drawerHeading}>WORKSPACE</Text>

            {SECTIONS.map(({ id, label, icon }) => {
              const active = section === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.drawerItem, active && styles.drawerItemActive]}
                  onPress={() => openSection(id)}
                  activeOpacity={0.8}
                >
                  <Feather name={icon} size={19} color={active ? "#93c5fd" : "#aab7cb"} />
                  <Text style={[styles.drawerItemText, active && { color: "#fff" }]}>{label}</Text>
                  {active && <Feather name="arrow-right" size={16} color="#fff" />}
                </TouchableOpacity>
              );
            })}

            <View style={styles.drawerBottom}>
              <View style={styles.online}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Dispatch system</Text>
                <Text style={styles.onlineSub}>Connected</Text>
              </View>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Feather name="log-out" size={18} color="#fca5a5" />
                <Text style={styles.logoutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <Pressable style={styles.drawerOverlay} onPress={() => setMobileNavOpen(false)} />
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.main} keyboardShouldPersistTaps="handled">
          {/* Topbar */}
          <View style={styles.topbar}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setMobileNavOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="menu" size={22} color="#334155" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>OPERATIONS / DISPATCH</Text>
              <Text style={styles.topTitle}>{activeSection?.label || "Overview"}</Text>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={loadData} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={15} color="#334155" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {(message !== "" || error !== "") && (
            <View style={[styles.alert, error ? styles.alertError : styles.alertSuccess]}>
              <Feather
                name={error ? "alert-circle" : "check-circle"}
                size={18}
                color={error ? "#b91c1c" : "#15803d"}
              />
              <Text style={[styles.alertText, { color: error ? "#b91c1c" : "#15803d" }]}>
                {error || message}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setError("");
                  setMessage("");
                }}
                hitSlop={10}
              >
                <Feather name="x" size={16} color={error ? "#b91c1c" : "#15803d"} />
              </TouchableOpacity>
            </View>
          )}

          {/* OVERVIEW */}
          {section === "overview" && (
            <>
              <View style={styles.welcome}>
                <Text style={styles.welcomeLabel}>OPERATIONS OVERVIEW</Text>
                <Text style={styles.welcomeTitle}>Keep every shipment moving.</Text>
                <Text style={styles.welcomeText}>
                  Manage hub operations and track shipment movement from origin to destination.
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <StatCard
                  icon="home"
                  label="Active Hubs"
                  value={counts.hubs}
                  description="Operational locations"
                  tint="#2563eb"
                  tintBg="#eff6ff"
                />
                <StatCard
                  icon="package"
                  label="Total Shipments"
                  value={counts.total}
                  description="Shipments in the system"
                  tint="#7c3aed"
                  tintBg="#f3e8ff"
                />
                <StatCard
                  icon="box"
                  label="Inbound"
                  value={counts.inbound}
                  description="Awaiting hub receipt"
                  tint="#0d9488"
                  tintBg="#ccfbf1"
                />
                <StatCard
                  icon="truck"
                  label="Ready to Dispatch"
                  value={counts.intercity}
                  description="Received at origin hub"
                  tint="#b45309"
                  tintBg="#fef3c7"
                />
                <StatCard
                  icon="map-pin"
                  label="In Transit"
                  value={counts.arrival}
                  description="Moving between hubs"
                  tint="#0891b2"
                  tintBg="#cffafe"
                />
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.panelTitle}>Recent Shipments</Text>
                    <Text style={styles.panelSub}>Latest shipment activity from the database</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.textBtn}
                    onPress={() => openSection("inbound")}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.textBtnText}>View operations</Text>
                    <Feather name="arrow-right" size={14} color="#2563eb" />
                  </TouchableOpacity>
                </View>
                {shipmentTable(shipments.slice(0, 8), "overview")}
              </View>
            </>
          )}

          {/* HUBS */}
          {section === "hubs" && (
            <>
              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.panelTitle}>Create a hub</Text>
                    <Text style={styles.panelSub}>Add a logistics location to the hub network.</Text>
                  </View>
                </View>

                <View style={{ gap: 14 }}>
                  {hubFields.map((field) => (
                    <TextInput
                      key={field.key}
                      style={styles.input}
                      placeholder={field.placeholder}
                      placeholderTextColor="#94a3b8"
                      value={hubForm[field.key]}
                      keyboardType={field.numeric ? "number-pad" : "default"}
                      onChangeText={(text) => setHubForm({ ...hubForm, [field.key]: text })}
                    />
                  ))}

                  <TouchableOpacity
                    style={[styles.primaryBtn, busy && styles.disabled]}
                    onPress={createHub}
                    disabled={busy}
                    activeOpacity={0.85}
                  >
                    <Feather name="plus" size={17} color="#fff" />
                    <Text style={styles.primaryBtnText}>{busy ? "Saving..." : "Create Hub"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.panelTitle}>Hub Directory</Text>
                    <Text style={styles.panelSub}>{hubs.length} hub(s) returned by the server</Text>
                  </View>
                </View>

                {hubs.length === 0 ? (
                  <View style={styles.empty}>
                    <View style={styles.emptyIcon}>
                      <Feather name="home" size={26} color="#64748b" />
                    </View>
                    <Text style={styles.emptyTitle}>No hubs available</Text>
                    <Text style={styles.emptyText}>Create a hub to get started.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 17 }}>
                    {hubs.map((hub) => {
                      const active = isHubActive(hub);

                      return (
                        <View key={String(hub.id)} style={styles.hubCard}>
                          <View style={styles.hubCardTop}>
                            <View style={styles.hubIcon}>
                              <Feather name="home" size={23} color="#2563eb" />
                            </View>
                            <StatusBadge status={active ? "Active" : "Inactive"} />
                          </View>
                          <Text style={styles.hubName}>{hub.hub_name}</Text>
                          <Text style={styles.hubCode}>{hub.hub_code}</Text>
                          <Text style={styles.hubLine}>
                            {hub.city}, {hub.state}
                          </Text>
                          <Text style={styles.hubLine}>{hub.address}</Text>
                          <Text style={styles.hubLine}>{hub.pincode}</Text>
                          <TouchableOpacity
                            style={[styles.secondaryBtn, { marginTop: 12 }, busy && styles.disabled]}
                            disabled={busy}
                            onPress={() => toggleHub(hub)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.secondaryBtnText}>
                              {active ? "Deactivate hub" : "Activate hub"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}

          {/* INBOUND / INTERCITY / ARRIVAL */}
          {["inbound", "intercity", "arrival"].includes(section) && (
            <View style={styles.panel}>
              <View style={styles.panelHeading}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.panelTitle}>{sectionHeading.title}</Text>
                  <Text style={styles.panelSub}>{sectionHeading.sub}</Text>
                </View>
              </View>

              <View style={styles.searchBox}>
                <Feather name="search" size={18} color="#94a3b8" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search shipment, tracking, order or hub..."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.filterRow}>
                <View style={{ flex: 1 }}>
                  <SelectField value={filter} options={statusOptions} onChange={setFilter} />
                </View>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setFilter("");
                    setSearchQuery("");
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBtnText}>Clear filters</Text>
                </TouchableOpacity>
              </View>

              {shipmentTable(sectionShipments, section)}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>ShopEase Logistics</Text>
            <Text style={styles.footerText}>Dispatch operations • Live database data</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default DispatchDashboard;

/* ================= styles ================= */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7fb" },
  main: { paddingHorizontal: 13, paddingBottom: 20 },
  disabled: { opacity: 0.55 },
  muted: { color: "#94a3b8", fontSize: 12 },

  /* login */
  loginScreen: { flex: 1, backgroundColor: "#eef4ff" },
  loginScroll: { flexGrow: 1, justifyContent: "center", padding: 18 },
  loginCard: {
    padding: 26,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 24,
    shadowColor: "#1e40af",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  brandMark: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    backgroundColor: "#2563eb",
    borderRadius: 17,
  },
  eyebrowLogin: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginBottom: 8,
  },
  loginTitle: { color: "#0f172a", fontSize: 30, fontWeight: "800" },
  loginMuted: { color: "#64748b", fontSize: 13, lineHeight: 22, marginTop: 12, marginBottom: 22 },
  label: { color: "#334155", fontSize: 13, fontWeight: "700", marginTop: 12, marginBottom: 8 },
  registerRow: { flexDirection: "row", justifyContent: "center", marginVertical: 22 },
  registerText: { color: "#64748b", fontSize: 13 },
  registerLink: { color: "#2563eb", fontSize: 13, fontWeight: "800" },
  backBtn: {
    alignItems: "center",
    paddingVertical: 13,
    marginTop: 4,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },
  backBtnText: { color: "#475569", fontSize: 13, fontWeight: "700" },

  /* topbar */
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 76,
    marginBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  menuBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 9,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },
  refreshText: { color: "#334155", fontSize: 11, fontWeight: "700" },
  eyebrow: { color: "#2563eb", fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  topTitle: { color: "#0f172a", fontSize: 18, fontWeight: "800", marginTop: 4 },

  /* drawer */
  drawerWrap: { flex: 1, flexDirection: "row" },
  drawer: {
    width: 275,
    maxWidth: "86%",
    backgroundColor: "#101a2e",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  drawerOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)" },
  drawerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 28,
    paddingTop: 10,
  },
  brandMarkSmall: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },
  drawerBrandTitle: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 1.2 },
  drawerBrandSub: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 4,
  },
  drawerHeading: {
    color: "#7f8da6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 10,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 47,
    paddingHorizontal: 13,
    borderRadius: 10,
    marginBottom: 6,
  },
  drawerItemActive: {
    backgroundColor: "#263b60",
    borderLeftWidth: 3,
    borderLeftColor: "#60a5fa",
  },
  drawerItemText: { flex: 1, color: "#aab7cb", fontSize: 13, fontWeight: "600" },
  drawerBottom: { marginTop: "auto", paddingBottom: 14 },
  online: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 11,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  onlineText: { color: "#cbd5e1", fontSize: 11 },
  onlineSub: { width: "100%", paddingLeft: 16, color: "#8493aa", fontSize: 11 },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, marginTop: 12 },
  logoutText: { color: "#fca5a5", fontSize: 13, fontWeight: "700" },

  /* alerts */
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginBottom: 18,
    borderRadius: 11,
    borderWidth: 1,
  },
  alertError: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  alertSuccess: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  alertText: { flex: 1, fontSize: 13, lineHeight: 20 },

  /* welcome */
  welcome: { padding: 22, borderRadius: 19, backgroundColor: "#2563eb" },
  welcomeLabel: { color: "#bfdbfe", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  welcomeTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 13, marginBottom: 9 },
  welcomeText: { color: "#dbeafe", fontSize: 12, lineHeight: 21 },

  /* stats */
  statsGrid: { gap: 11, marginTop: 17, marginBottom: 22 },
  statCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 15,
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { color: "#64748b", fontSize: 12, fontWeight: "600", marginTop: 2, marginBottom: 6 },
  statValue: { color: "#0f172a", fontSize: 25, fontWeight: "800", marginBottom: 5 },
  statDesc: { color: "#94a3b8", fontSize: 11 },

  /* panels */
  panel: {
    padding: 15,
    marginBottom: 17,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
  },
  panelHeading: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 20 },
  panelTitle: { color: "#172033", fontSize: 16, fontWeight: "800" },
  panelSub: { color: "#64748b", fontSize: 11, marginTop: 6, lineHeight: 17 },
  textBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
  },
  textBtnText: { color: "#2563eb", fontSize: 11, fontWeight: "700" },

  /* table */
  tableWrap: { borderWidth: 1, borderColor: "#edf0f5", borderRadius: 12, overflow: "hidden" },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  th: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f5",
  },
  td: { paddingHorizontal: 16, color: "#475569", fontSize: 12 },
  shipmentId: { color: "#172033", fontSize: 12, fontWeight: "800" },
  shipmentSub: { color: "#94a3b8", fontSize: 10, marginTop: 5 },
  actionGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  transportInput: { width: 120, paddingVertical: 9, paddingHorizontal: 10 },

  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 30 },
  badgeText: { fontSize: 10, fontWeight: "800" },

  /* buttons + inputs */
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 34,
    paddingHorizontal: 11,
    backgroundColor: "#2563eb",
    borderRadius: 10,
  },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    backgroundColor: "#2563eb",
    borderRadius: 10,
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },
  secondaryBtnText: { color: "#475569", fontSize: 13, fontWeight: "700" },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#172033",
    fontSize: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe2ed",
    borderRadius: 10,
  },

  /* search + select */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe2ed",
    borderRadius: 10,
  },
  searchInput: { flex: 1, paddingVertical: 12, color: "#172033", fontSize: 13 },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 42,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe2ed",
    borderRadius: 10,
  },
  selectText: { flex: 1, color: "#172033", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  modalSheet: { maxHeight: "60%", backgroundColor: "#fff", borderRadius: 14, paddingVertical: 6 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  modalOptionText: { color: "#334155", fontSize: 14 },
  modalOptionActive: { color: "#2563eb", fontWeight: "700" },

  /* hubs */
  hubCard: {
    padding: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
  },
  hubCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  hubIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
  },
  hubName: { color: "#172033", fontSize: 16, fontWeight: "800", marginBottom: 7 },
  hubCode: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginVertical: 7,
  },
  hubLine: { color: "#64748b", fontSize: 12, lineHeight: 19, marginVertical: 3 },

  /* empty */
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  emptyIcon: { padding: 12, marginBottom: 13, backgroundColor: "#f1f5f9", borderRadius: 14 },
  emptyTitle: { color: "#334155", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  emptyText: { color: "#94a3b8", fontSize: 12, textAlign: "center", lineHeight: 20 },

  /* footer */
  footer: { paddingTop: 12, gap: 6 },
  footerText: { color: "#94a3b8", fontSize: 11 },
});
