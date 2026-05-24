import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CartItem } from "@/shared/lib/cartApi";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import {
  fetchCheckoutSettings,
  submitCheckout,
  type FulfillmentDelivery,
  type PlacedOrder,
} from "@/shared/lib/checkoutApi";
import "@/shared/styles/Checkout.css";
import "leaflet/dist/leaflet.css";

/* Leaflet icon fix (webpack/vite asset path issue) */
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error override default icon URLs
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/* Types */
type Method = "delivery" | "pickup";
type Step = 1 | 2 | 3 | 4;

type AddressForm = {
  street: string;
  barangay: string;
  city: string;
  province: string;
};

type ReverseGeocodeAddress = {
  city?: string;
  city_district?: string;
  county?: string;
  house_number?: string;
  municipality?: string;
  neighbourhood?: string;
  province?: string;
  region?: string;
  road?: string;
  state?: string;
  state_district?: string;
  suburb?: string;
  town?: string;
  village?: string;
};

type ReverseGeocodeResponse = {
  address?: ReverseGeocodeAddress;
};

type Props = {
  items: CartItem[];
  onClose: () => void;
  onSuccess: () => void;
};

type MockGcashCompletionEvent = {
  order?: PlacedOrder;
  paymentMethod?: string;
  paymentStatus?: string;
  paidAt?: string;
  receiptNumber?: string;
  sessionId?: string;
  totalAmount?: number;
  type?: string;
};

type GcashPaymentReview = {
  paidAt: string;
  paymentMethod: "GCash";
  paymentStatus: "Paid";
  receiptNumber: string;
};

/* Helpers */
function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", { currency: "PHP", style: "currency" }).format(value);
}

const DELIVERY_PAYMENT_OPTIONS = [
  { value: "GCash", desc: "Pay via GCash e-wallet" },
  { value: "Cash on Delivery", desc: "Pay when your order arrives" },
];

const PICKUP_PAYMENT_OPTIONS = [
  { value: "GCash", desc: "Pay via GCash e-wallet" },
  { value: "Pay on Pick Up", desc: "Pay at the shop when claiming your order" },
];

const STORE_ADDRESS = "Old Albay District, Legazpi City, Albay";
const OLD_ALBAY_SHOP_LOCATION = { lat: 13.1391, lng: 123.7438 };
const ALBAY_CENTER = OLD_ALBAY_SHOP_LOCATION;
const BASE_DELIVERY_FEE = 50;
const DEFAULT_DELIVERY_RATE_PER_KM = 7.51;
const ALBAY_DELIVERY_BOUNDS = {
  north: 13.55,
  south: 12.95,
  east: 124.25,
  west: 123.25,
};

function isWithinAlbayDeliveryArea(lat: number, lng: number) {
  return (
    lat >= ALBAY_DELIVERY_BOUNDS.south &&
    lat <= ALBAY_DELIVERY_BOUNDS.north &&
    lng >= ALBAY_DELIVERY_BOUNDS.west &&
    lng <= ALBAY_DELIVERY_BOUNDS.east
  );
}

function calculateDistanceKm(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
) {
  const earthRadiusKm = 6371;
  const latDelta = ((second.lat - first.lat) * Math.PI) / 180;
  const lngDelta = ((second.lng - first.lng) * Math.PI) / 180;
  const firstLat = (first.lat * Math.PI) / 180;
  const secondLat = (second.lat * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMethodLabel(value: Method | PlacedOrder["deliveryMethod"]) {
  return value === "delivery" ? "Home Delivery" : "Store Pickup";
}

function formatOrderStatus(value: string) {
  if (value === "ready_for_pickup") return "Ready for Pickup";
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function createMockGcashSessionId() {
  const browserCrypto = globalThis.crypto;

  if (browserCrypto.randomUUID) {
    return browserCrypto.randomUUID();
  }

  const values = new Uint32Array(2);
  browserCrypto.getRandomValues(values);
  return `mock-gcash-${values[0].toString(16)}-${values[1].toString(16)}`;
}

function getSelectedProductIds(items: CartItem[]) {
  return items.map((item) => item.productId);
}

async function reverseGeocodeLocation(lat: number, lng: number): Promise<Partial<AddressForm>> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) return {};

  const data = (await response.json()) as ReverseGeocodeResponse;
  const result = data.address;
  if (!result) return {};

  const province =
    result.province ||
    (result.county?.toLowerCase().includes("albay") ? result.county : "") ||
    (result.state_district?.toLowerCase().includes("albay") ? result.state_district : "") ||
    (result.state?.toLowerCase().includes("albay") ? result.state : "") ||
    (isWithinAlbayDeliveryArea(lat, lng) ? "Albay" : result.state || result.region || "");

  return {
    street: [result.house_number, result.road].filter(Boolean).join(" "),
    barangay: result.suburb || result.village || result.neighbourhood || result.city_district || "",
    city: result.city || result.town || result.municipality || result.county || "",
    province,
  };
}

/* Map component (lazy-loaded to avoid SSR issues) */
function DeliveryMap({
  deliveryBounds,
  lat,
  lng,
  onPick,
}: {
  deliveryBounds?: typeof ALBAY_DELIVERY_BOUNDS;
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current).setView([lat, lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '(c) <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    if (deliveryBounds) {
      L.rectangle(
        [
          [deliveryBounds.south, deliveryBounds.west],
          [deliveryBounds.north, deliveryBounds.east],
        ],
        {
          color: "#aa6d27",
          fillColor: "#aa6d27",
          fillOpacity: 0.08,
          weight: 2,
        },
      ).addTo(map);
    }

    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.bindPopup("Drag me to your exact location").openPopup();

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onPick(pos.lat, pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onPick(e.latlng.lat, e.latlng.lng);
    });

    leafletMap.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync if parent updates lat/lng
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}

/*
   Main component
*/
export function CheckoutModal({ items, onClose, onSuccess }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>("delivery");
  const [address, setAddress] = useState<AddressForm>({
    street: "", barangay: "", city: "", province: "",
  });
  const [lat, setLat] = useState(ALBAY_CENTER.lat);
  const [lng, setLng] = useState(ALBAY_CENTER.lng);
  const [geoLocating, setGeoLocating] = useState(false);
  const [addressLookupStatus, setAddressLookupStatus] = useState("");
  const [deliveryRatePerKm, setDeliveryRatePerKm] = useState(DEFAULT_DELIVERY_RATE_PER_KM);
  const [shopLocation, setShopLocation] = useState(OLD_ALBAY_SHOP_LOCATION);
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [gcashPaymentReview, setGcashPaymentReview] = useState<GcashPaymentReview | null>(null);
  const [confirmAction, setConfirmAction] = useState<"gcash" | "place-order" | null>(null);
  const mockGcashSessionIdRef = useRef<string | null>(null);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryDistanceKm =
    method === "delivery" ? calculateDistanceKm(shopLocation, { lat, lng }) : 0;
  const shipping = method === "delivery" ? roundMoney(BASE_DELIVERY_FEE + deliveryDistanceKm * deliveryRatePerKm) : 0;
  const total = subtotal + shipping;
  const deliveryLocationInAlbay = isWithinAlbayDeliveryArea(lat, lng);
  const lookupRequestId = useRef(0);
  const paymentOptions = method === "pickup" ? PICKUP_PAYMENT_OPTIONS : DELIVERY_PAYMENT_OPTIONS;
  const completedGcashOrder = Boolean(placedOrder && gcashPaymentReview);
  const reviewItems = placedOrder?.items ?? items;
  const reviewSubtotal = placedOrder ? placedOrder.totalAmount - placedOrder.deliveryFee : subtotal;
  const reviewShipping = placedOrder ? placedOrder.deliveryFee : shipping;
  const reviewTotal = placedOrder ? placedOrder.totalAmount : total;
  const reviewDistanceKm = placedOrder ? placedOrder.deliveryDistanceKm : deliveryDistanceKm;
  const reviewMethod = formatMethodLabel(placedOrder?.deliveryMethod ?? method);
  const reviewOrderStatus = placedOrder
    ? placedOrder.deliveryMethod === "pickup"
      ? `${formatOrderStatus(placedOrder.status)} - Paid`
      : formatOrderStatus(placedOrder.status)
    : "";

  const handleMockGcashCompleted = useCallback((event: MockGcashCompletionEvent) => {
    if (!event || typeof event !== "object") {
      return;
    }

    if (
      event.type !== "GCASH_PAYMENT_SUCCESS" ||
      !event.sessionId ||
      event.sessionId !== mockGcashSessionIdRef.current ||
      !event.order ||
      event.paymentMethod !== "GCash" ||
      event.paymentStatus !== "Paid" ||
      !event.paidAt
    ) {
      return;
    }

    mockGcashSessionIdRef.current = null;
    setPlacedOrder(event.order);
    setGcashPaymentReview({
      paidAt: event.paidAt,
      paymentMethod: "GCash",
      paymentStatus: "Paid",
      receiptNumber: event.receiptNumber ?? "",
    });
    setPaymentMethod("GCash");
    setSubmitting(false);
    setSubmitError("");
    setStep(3);
    onSuccess();
  }, [onSuccess]);

  useEffect(() => {
    void (async () => {
      try {
        const checkoutSettings = await fetchCheckoutSettings();
        setDeliveryRatePerKm(checkoutSettings.deliveryRatePerKm);
        setShopLocation(checkoutSettings.shopLocation);
      } catch {
        setDeliveryRatePerKm(DEFAULT_DELIVERY_RATE_PER_KM);
        setShopLocation(OLD_ALBAY_SHOP_LOCATION);
      }
    })();
  }, []);

  useEffect(() => {
    const parseCompletion = (value: string | null) => {
      if (!value) return null;

      try {
        return JSON.parse(value) as MockGcashCompletionEvent;
      } catch {
        return null;
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "appliansys:checkout-completed") return;
      const completion = parseCompletion(event.newValue);
      if (!completion) return;

      handleMockGcashCompleted(completion);
      localStorage.removeItem("appliansys:checkout-completed");
    };

    const handleMessage = (event: MessageEvent<MockGcashCompletionEvent>) => {
      if (event.origin !== window.location.origin) return;
      handleMockGcashCompleted(event.data);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMockGcashCompleted]);

  /* Geolocation */
  const updatePinnedLocation = (nextLat: number, nextLng: number) => {
    setLat(nextLat);
    setLng(nextLng);
    setAddressLookupStatus("Finding address...");

    const requestId = lookupRequestId.current + 1;
    lookupRequestId.current = requestId;

    void (async () => {
      try {
        const nextAddress = await reverseGeocodeLocation(nextLat, nextLng);
        if (lookupRequestId.current !== requestId) return;

        setAddress((current) => ({
          street: nextAddress.street || current.street,
          barangay: nextAddress.barangay || current.barangay,
          city: nextAddress.city || current.city,
          province: nextAddress.province || current.province,
        }));
        setAddressLookupStatus("Address updated from pinned location.");
      } catch {
        if (lookupRequestId.current === requestId) {
          setAddressLookupStatus("Address lookup failed. Please enter the address manually.");
        }
      }
    })();
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePinnedLocation(pos.coords.latitude, pos.coords.longitude);
        setGeoLocating(false);
      },
      () => setGeoLocating(false),
    );
  };

  /* Step validation */
  const canProceedStep2 =
    method === "pickup" ||
    (address.street.trim() !== "" &&
      address.barangay.trim() !== "" &&
      address.city.trim() !== "" &&
      address.province.trim() !== "" &&
      deliveryLocationInAlbay);

  const buildFulfillment = () =>
    method === "delivery"
      ? ({
          method: "delivery",
          street: address.street,
          barangay: address.barangay,
          city: address.city,
          province: address.province,
          latitude: lat,
          longitude: lng,
        } satisfies FulfillmentDelivery)
      : { method: "pickup" as const };

  const openMockGcashGateway = () => {
    if (method === "delivery" && !deliveryLocationInAlbay) {
      setSubmitError("ApplianSys can only deliver within Albay. Please select a location inside Albay or choose pickup.");
      return;
    }

    const sessionId = createMockGcashSessionId();
    mockGcashSessionIdRef.current = sessionId;

    localStorage.setItem(
      `appliansys:mock-gcash:${sessionId}`,
      JSON.stringify({
        createdAt: new Date().toISOString(),
        fulfillment: buildFulfillment(),
        paymentMethod: "GCash",
        productIds: getSelectedProductIds(items),
        sessionId,
        shipping,
        subtotal,
        total,
      }),
    );

    const gatewayUrl = `/mock-gcash-payment?session=${encodeURIComponent(sessionId)}`;
    const paymentWindow = window.open(gatewayUrl, "_blank", "popup,width=520,height=760");

    if (!paymentWindow) {
      setSubmitError("Popup blocked. Please allow popups and try GCash again.");
      return;
    }

    setSubmitError("Mock GCash payment opened in a new tab.");
  };

  /* Submit */
  const handlePlaceOrder = async () => {
    if (method === "delivery" && !deliveryLocationInAlbay) {
      setSubmitError("ApplianSys can only deliver within Albay. Please select a location inside Albay or choose pickup.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const order = await submitCheckout({
        fulfillment: buildFulfillment(),
        paymentMethod,
        productIds: getSelectedProductIds(items),
      });
      setPlacedOrder(order);
      onSuccess();
      if (paymentMethod === "Cash on Delivery" || paymentMethod === "Pay on Pick Up") {
        onClose();
        void navigate("/orders");
        return;
      }

      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  /* Close on overlay click */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && step !== 4) onClose();
  };

  /* Step labels */
  const STEPS = [
    { num: 1, label: "Method" },
    { num: 2, label: "Details" },
    { num: 3, label: "Review" },
  ];

  return (
    <div className="checkout-overlay" onClick={handleOverlayClick} role="dialog" aria-modal aria-label="Checkout">
      <div className="checkout-sheet">

        {/* Header */}
        <div className="checkout-sheet__header">
          <h2 className="checkout-sheet__title">
            {step === 4 ? "Order Placed!" : "Checkout"}
          </h2>
          {step !== 4 && (
            <button type="button" className="checkout-sheet__close" onClick={onClose} aria-label="Close checkout">
              x
            </button>
          )}
        </div>

        {/* Step indicator */}
        {step !== 4 && (
          <div className="checkout-steps" aria-label="Checkout progress">
            {STEPS.map((s, idx) => {
              const isDone = step > s.num;
              const isActive = step === s.num;
              return (
                <div key={s.num} style={{ display: "flex", alignItems: "center", flex: idx < STEPS.length - 1 ? 1 : "none" }}>
                  <div className={`checkout-step${isActive ? " checkout-step--active" : ""}${isDone ? " checkout-step--done" : ""}`}>
                    <div className="checkout-step__num">
                      {isDone ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : s.num}
                    </div>
                    <span>{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`checkout-step__connector${isDone ? " checkout-step__connector--done" : ""}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="checkout-sheet__body">

          {/* STEP 1: Method */}
          {step === 1 && (
            <>
              <p className="checkout-section-label">How would you like to receive your order?</p>
              <div className="checkout-method-grid">
                <button
                  type="button"
                  className={`checkout-method-card${method === "delivery" ? " checkout-method-card--selected" : ""}`}
                  onClick={() => {
                    setMethod("delivery");
                    if (!DELIVERY_PAYMENT_OPTIONS.some((option) => option.value === paymentMethod)) {
                      setPaymentMethod(DELIVERY_PAYMENT_OPTIONS[0].value);
                    }
                  }}
                >
                  <div className="checkout-method-card__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <path d="M16 8h4l3 5v3h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <h3 className="checkout-method-card__title">Home Delivery</h3>
                  <p className="checkout-method-card__desc">
                    Delivered from Old Albay. Fee starts at {formatCurrency(BASE_DELIVERY_FEE)} plus {formatCurrency(deliveryRatePerKm)} per km.
                  </p>
                </button>

                <button
                  type="button"
                  className={`checkout-method-card${method === "pickup" ? " checkout-method-card--selected" : ""}`}
                  onClick={() => {
                    setMethod("pickup");
                    if (!PICKUP_PAYMENT_OPTIONS.some((option) => option.value === paymentMethod)) {
                      setPaymentMethod(PICKUP_PAYMENT_OPTIONS[0].value);
                    }
                  }}
                >
                  <div className="checkout-method-card__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <h3 className="checkout-method-card__title">Store Pickup</h3>
                  <p className="checkout-method-card__desc">
                    Pick up from our store. Ready next business day. Free.
                  </p>
                </button>
              </div>
            </>
          )}

          {/* STEP 2: Details */}
          {step === 2 && method === "delivery" && (
            <>
              <p className="checkout-section-label">Delivery Address</p>
              <div className="checkout-form-grid">
                <div className="checkout-field checkout-field--full">
                  <label htmlFor="co-street">Street / House No.</label>
                  <input
                    id="co-street"
                    className="checkout-input"
                    placeholder="e.g. 123 Rizal St."
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  />
                </div>
                <div className="checkout-field">
                  <label htmlFor="co-barangay">Barangay</label>
                  <input
                    id="co-barangay"
                    className="checkout-input"
                    placeholder="e.g. Brgy. Poblacion"
                    value={address.barangay}
                    onChange={(e) => setAddress({ ...address, barangay: e.target.value })}
                  />
                </div>
                <div className="checkout-field">
                  <label htmlFor="co-city">City / Municipality</label>
                  <input
                    id="co-city"
                    className="checkout-input"
                    placeholder="e.g. Makati City"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                </div>
                <div className="checkout-field checkout-field--full">
                  <label htmlFor="co-province">Province / Region</label>
                  <input
                    id="co-province"
                    className="checkout-input"
                    placeholder="e.g. Metro Manila"
                    value={address.province}
                    onChange={(e) => setAddress({ ...address, province: e.target.value })}
                  />
                </div>
              </div>

              {/* Map pin */}
              <div className="checkout-map-label">
                Pin your location
                <span>optional - drag the marker or click the map</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  className="checkout-btn-back"
                  style={{ padding: "8px 14px", fontSize: 13 }}
                  onClick={handleGeolocate}
                  disabled={geoLocating}
                >
                  {geoLocating ? "Locating..." : "Use my location"}
                </button>
              </div>
              <div className="checkout-map-wrap">
                <DeliveryMap
                  deliveryBounds={ALBAY_DELIVERY_BOUNDS}
                  lat={lat}
                  lng={lng}
                  onPick={updatePinnedLocation}
                />
              </div>
              <p className="checkout-map-hint">
                Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
              {addressLookupStatus ? (
                <p className="checkout-map-hint">{addressLookupStatus}</p>
              ) : null}
              {!deliveryLocationInAlbay ? (
                <p className="checkout-map-warning">
                  ApplianSys can only deliver within Albay. Move the pin inside the highlighted area or choose pickup.
                </p>
              ) : null}
            </>
          )}

          {step === 2 && method === "pickup" && (
            <>
              <p className="checkout-section-label">Pickup Information</p>
              <div className="checkout-pickup-info">
                <div className="checkout-pickup-info__icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <p className="checkout-pickup-info__title">ApplianSys Main Store</p>
                  <p className="checkout-pickup-info__address">{STORE_ADDRESS}</p>
                  <p className="checkout-pickup-info__hours">Mon-Sat, 8:00 AM - 6:00 PM</p>
                  <p className="checkout-pickup-info__address">
                    Present your order reference number and a valid ID when claiming your item.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Payment method - shown on step 2 */}
          {step === 2 && (
            <>
              <p className="checkout-section-label" style={{ marginTop: 24 }}>Payment Method</p>
              <div className="checkout-payment-options">
                {paymentOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`checkout-payment-option${paymentMethod === opt.value ? " checkout-payment-option--selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                    />
                    <span className="checkout-payment-option__label">{opt.value}</span>
                    <span className="checkout-payment-option__desc">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <>
              {completedGcashOrder ? (
                <>
                  <div className="checkout-review-confirmation">
                    <div className="checkout-review-confirmation__icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <h3>Payment Successful</h3>
                      <p>Your order has been placed and recorded as paid.</p>
                    </div>
                  </div>

                  <div className="checkout-review-summary">
                    <div>
                      <span>Receiving Method</span>
                      <strong>{reviewMethod}</strong>
                    </div>
                    <div>
                      <span>Payment Method</span>
                      <strong>{gcashPaymentReview?.paymentMethod}</strong>
                    </div>
                    <div>
                      <span>Payment Status</span>
                      <strong>{gcashPaymentReview?.paymentStatus}</strong>
                    </div>
                    <div>
                      <span>Order Status</span>
                      <strong>{reviewOrderStatus}</strong>
                    </div>
                    <div>
                      <span>Order Reference</span>
                      <strong>{placedOrder?.orderRef}</strong>
                    </div>
                    <div>
                      <span>Total Paid</span>
                      <strong>{formatCurrency(reviewTotal)}</strong>
                    </div>
                    <div>
                      <span>Date and Time Paid</span>
                      <strong>{gcashPaymentReview ? formatDateTime(gcashPaymentReview.paidAt) : "Not available"}</strong>
                    </div>
                    {gcashPaymentReview?.receiptNumber ? (
                      <div>
                        <span>Receipt No.</span>
                        <strong>{gcashPaymentReview.receiptNumber}</strong>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}

              <p className="checkout-section-label">{completedGcashOrder ? "Confirmed Items" : "Order Items"}</p>
              <div className="checkout-review-items">
                {reviewItems.map((item) => (
                  <div key={item.productId} className="checkout-review-item">
                    <div className="checkout-review-item__img">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.2" aria-hidden>
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                        </svg>
                      )}
                    </div>
                    <div className="checkout-review-item__name">
                      {item.productName}
                      <div className="checkout-review-item__qty">Qty: {item.quantity}</div>
                    </div>
                    <span className="checkout-review-item__price">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="checkout-review-totals">
                <div className="checkout-review-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(reviewSubtotal)}</span>
                </div>
                <div className="checkout-review-row">
                  <span>Shipping</span>
                  <span>
                    {method === "delivery"
                      ? `${formatCurrency(reviewShipping)} (${reviewDistanceKm.toFixed(2)} km)`
                      : "Free"}
                  </span>
                </div>
                <div className="checkout-review-row checkout-review-row--total">
                  <span>Total</span>
                  <span>{formatCurrency(reviewTotal)}</span>
                </div>
              </div>

              <div className="checkout-review-address">
                <p className="checkout-review-address__label">
                  {method === "delivery" ? "Delivery Address" : "Pickup Location"}
                </p>
                <p className="checkout-review-address__value">
                  {method === "delivery"
                    ? [address.street, address.barangay, address.city, address.province]
                        .filter(Boolean)
                        .join(", ")
                    : STORE_ADDRESS}
                </p>
              </div>

              <div className="checkout-review-address">
                <p className="checkout-review-address__label">Payment</p>
                <p className="checkout-review-address__value">
                  {paymentMethod}{completedGcashOrder ? " - Paid" : ""}
                </p>
              </div>

              {submitError && (
                <p style={{ color: "#b42318", fontSize: 14, margin: "12px 0 0", fontWeight: 600 }}>
                  {submitError}
                </p>
              )}
            </>
          )}

          {/* STEP 4: Success */}
          {step === 4 && placedOrder && (
            <div className="checkout-success">
              <div className="checkout-success__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="checkout-success__title">Order Confirmed!</h3>
              <p className="checkout-success__ref">
                Reference: <strong>{placedOrder.orderRef}</strong>
              </p>
              <p className="checkout-success__detail">
                {placedOrder.deliveryMethod === "delivery"
                  ? "Your order is being processed and will be delivered in 3-5 business days."
                  : paymentMethod === "Pay on Pick Up"
                    ? "Your pickup order was placed. Payment will be collected at the shop. Present your order reference number when claiming the item."
                    : "Your order is ready for pickup at our store next business day."}
                {" "}Payment method: <strong>{paymentMethod}</strong>.
              </p>
              <div className="checkout-success__actions">
                <Link to="/orders" className="checkout-success__btn-primary" onClick={onClose}>
                  View My Orders
                </Link>
                <Link to="/" className="checkout-success__btn-secondary" onClick={onClose}>
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 4 && (
          <div className="checkout-sheet__footer">
            {step > 1 && !completedGcashOrder && (
              <button
                type="button"
                className="checkout-btn-back"
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={submitting}
              >
                Back
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                className="checkout-btn-next"
                disabled={step === 2 && !canProceedStep2}
                onClick={() => {
                  if (step === 2 && paymentMethod === "GCash") {
                    setConfirmAction("gcash");
                    return;
                  }

                  setStep((s) => (s + 1) as Step);
                }}
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {step === 3 && completedGcashOrder && (
              <>
                <button
                  type="button"
                  className="checkout-btn-back"
                  onClick={onClose}
                >
                  Close
                </button>
                <Link
                  to="/orders"
                  className="checkout-btn-next checkout-btn-next--link"
                  onClick={onClose}
                >
                  View My Orders
                </Link>
              </>
            )}

            {step === 3 && !completedGcashOrder && (
              <button
                type="button"
                className="checkout-btn-next"
                disabled={submitting}
                onClick={() => setConfirmAction("place-order")}
              >
                {submitting ? (
                  <><div className="checkout-spinner" /> Placing Order...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Place Order - {formatCurrency(total)}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      <ConfirmationModal
        open={confirmAction !== null}
        title={confirmAction === "gcash" ? "Continue to GCash payment?" : "Place this order?"}
        message={
          confirmAction === "gcash"
            ? `You are about to open the mock GCash gateway for ${formatCurrency(total)}. Review your selected items and delivery details before continuing.`
            : `This will place an order for ${formatCurrency(total)} using ${paymentMethod}. Please confirm that the selected items, quantity, and fulfillment details are correct.`
        }
        confirmLabel={confirmAction === "gcash" ? "Open GCash" : "Place Order"}
        isBusy={submitting}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          const action = confirmAction;
          setConfirmAction(null);
          if (action === "gcash") {
            openMockGcashGateway();
            return;
          }
          if (action === "place-order") {
            void handlePlaceOrder();
          }
        }}
      />
    </div>
  );
}
