import { useEffect, useMemo, useState } from "react";
import {
  sendMockGcashReceiptEmail,
  submitCheckout,
  type CheckoutPayload,
  type PlacedOrder,
} from "@/shared/lib/checkoutApi";
import "@/shared/styles/MockGcash.css";

type GatewayStep = "phone" | "otp" | "pin" | "confirm" | "receipt";

type MockGcashSession = CheckoutPayload & {
  createdAt: string;
  sessionId: string;
  shipping: number;
  subtotal: number;
  total: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", { currency: "PHP", style: "currency" }).format(value);
}

function getSessionId() {
  return new URLSearchParams(window.location.search).get("session") ?? "";
}

function readSession(sessionId: string): MockGcashSession | null {
  if (!sessionId) return null;

  const rawSession = localStorage.getItem(`appliansys:mock-gcash:${sessionId}`);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession) as MockGcashSession;
  } catch {
    return null;
  }
}

function generateMockOtp() {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

function generateReceiptRef() {
  const values = new Uint32Array(2);
  globalThis.crypto.getRandomValues(values);
  return `GC${values[0].toString().padStart(10, "0")}${String(values[1]).slice(0, 4)}`;
}

export default function MockGcashPage() {
  const sessionId = useMemo(() => getSessionId(), []);
  const session = useMemo(() => readSession(sessionId), [sessionId]);
  const [step, setStep] = useState<GatewayStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [mockOtp, setMockOtp] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [receiptRef, setReceiptRef] = useState("");
  const [paidAt, setPaidAt] = useState<Date | null>(null);
  const [closeCountdown, setCloseCountdown] = useState(10);
  const [emailStatus, setEmailStatus] = useState("");
  const generatedAt = useMemo(() => new Date(), []);

  const normalizedPhone = phone.replace(/\D/g, "");

  useEffect(() => {
    if (step !== "receipt") return;

    const timer = window.setInterval(() => {
      setCloseCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          window.close();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step]);

  if (!session) {
    return (
      <main className="mock-gcash-page">
        <section className="mock-gcash-card">
          <h1>GCash</h1>
          <h2>Payment session not found</h2>
          <p>This mock payment link is invalid or has already been used.</p>
        </section>
      </main>
    );
  }

  const pendingOrderRef = `PENDING-${session.sessionId.slice(0, 8).toUpperCase()}`;

  const handleSendOtp = () => {
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError("Enter a valid 11-digit mobile number starting with 09.");
      return;
    }

    setError("");
    setMockOtp(generateMockOtp());
    setOtp("");
    setStep("otp");
  };

  const handleOtp = () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit mock OTP.");
      return;
    }

    setError("");
    setStep("pin");
  };

  const handlePin = () => {
    if (!/^\d{4}$/.test(pin.trim())) {
      setError("Enter a 4-digit mock GCash PIN.");
      return;
    }

    setError("");
    setStep("confirm");
  };

  const handlePay = async () => {
    setSubmitting(true);
    setError("");

    try {
      const order = await submitCheckout({
        fulfillment: session.fulfillment,
        paymentMethod: "GCash",
        productIds: session.productIds,
      });
      const nextReceiptRef = generateReceiptRef();
      const nextPaidAt = new Date();
      const successEvent = {
        at: nextPaidAt.getTime(),
        order,
        orderId: order.orderId,
        paidAt: nextPaidAt.toISOString(),
        paymentMethod: "GCash",
        paymentStatus: "Paid",
        receiptNumber: nextReceiptRef,
        sessionId: session.sessionId,
        totalAmount: order.totalAmount,
        type: "GCASH_PAYMENT_SUCCESS",
      };

      setPlacedOrder(order);
      setReceiptRef(nextReceiptRef);
      setPaidAt(nextPaidAt);
      setCloseCountdown(10);
      localStorage.removeItem(`appliansys:mock-gcash:${session.sessionId}`);
      localStorage.setItem(
        "appliansys:checkout-completed",
        JSON.stringify(successEvent),
      );
      const openerWindow = window.opener as Window | null;
      openerWindow?.postMessage(successEvent, window.location.origin);
      void sendMockGcashReceiptEmail({
        orderId: order.orderId,
        paidAt: nextPaidAt.toISOString(),
        receiptNumber: nextReceiptRef,
      })
        .then((result) => setEmailStatus(result.message))
        .catch(() => setEmailStatus("Mock confirmation email could not be sent, but payment succeeded."));
      setStep("receipt");
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Mock payment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mock-gcash-page">
      <section className="mock-gcash-shell">
        <div className="mock-gcash-brand">
          <span>GCash</span>
          <small>Mock payment gateway</small>
        </div>

        {step === "phone" ? (
          <div className="mock-gcash-card">
            <h1>Cellphone Number</h1>
            <p>Enter a mock GCash cellphone number to continue.</p>
            <label htmlFor="gcash-phone">Cellphone number</label>
            <input
              id="gcash-phone"
              inputMode="numeric"
              maxLength={11}
              placeholder="09XXXXXXXXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            {error ? <div className="mock-gcash-error">{error}</div> : null}
            <button type="button" onClick={handleSendOtp}>Send OTP</button>
          </div>
        ) : null}

        {step === "otp" ? (
          <div className="mock-gcash-card">
            <h1>Enter OTP</h1>
            <p>Mock OTP sent to {normalizedPhone}. Test code: <strong>{mockOtp}</strong></p>
            <label htmlFor="gcash-otp">Mock OTP</label>
            <input
              id="gcash-otp"
              className="mock-gcash-otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
            {error ? <div className="mock-gcash-error">{error}</div> : null}
            <button type="button" onClick={handleOtp}>Continue</button>
          </div>
        ) : null}

        {step === "pin" ? (
          <div className="mock-gcash-card">
            <h1>Login PIN</h1>
            <p>Enter any 4-digit mock GCash login PIN.</p>
            <label htmlFor="gcash-pin">4-digit PIN</label>
            <input
              id="gcash-pin"
              className="mock-gcash-pin"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
            />
            {error ? <div className="mock-gcash-error">{error}</div> : null}
            <button type="button" onClick={handlePin}>Continue</button>
          </div>
        ) : null}

        {step === "confirm" ? (
          <div className="mock-gcash-card">
            <h1>Payment Confirmation</h1>
            <div className="mock-gcash-amount">{formatCurrency(session.total)}</div>
            <dl className="mock-gcash-details">
              <div><dt>Amount to be paid</dt><dd>{formatCurrency(session.total)}</dd></div>
              <div><dt>Date</dt><dd>{generatedAt.toLocaleDateString("en-PH", { dateStyle: "long" })}</dd></div>
              <div><dt>Time</dt><dd>{generatedAt.toLocaleTimeString("en-PH", { timeStyle: "short" })}</dd></div>
              <div><dt>Order reference</dt><dd>{pendingOrderRef}</dd></div>
            </dl>
            {error ? <div className="mock-gcash-error">{error}</div> : null}
            <button type="button" onClick={() => void handlePay()} disabled={submitting}>
              {submitting ? "Processing..." : "Pay"}
            </button>
          </div>
        ) : null}

        {step === "receipt" && placedOrder ? (
          <div className="mock-gcash-card mock-gcash-card--receipt">
            <div className="mock-gcash-check">✓</div>
            <h1>Payment Successful</h1>
            <p>You can close this tab now.</p>
            <dl className="mock-gcash-details">
              <div><dt>Receipt No.</dt><dd>{receiptRef}</dd></div>
              <div><dt>Order Ref.</dt><dd>{placedOrder.orderRef}</dd></div>
              <div><dt>Amount Paid</dt><dd>{formatCurrency(placedOrder.totalAmount)}</dd></div>
              <div><dt>Payment Method</dt><dd>Mock GCash</dd></div>
              <div>
                <dt>Date and Time Paid</dt>
                <dd>{(paidAt ?? new Date()).toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" })}</dd>
              </div>
            </dl>
            {emailStatus ? <div className="mock-gcash-email-status">{emailStatus}</div> : null}
            <div className="mock-gcash-countdown">
              This tab will automatically close in {closeCountdown} seconds.
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
