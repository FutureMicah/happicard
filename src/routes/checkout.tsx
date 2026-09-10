import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type FormEvent } from "react";

import { createDemoSession } from "@/lib/payments.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Demo Shop" },
      {
        name: "description",
        content: "Pick demo products, enter your delivery details and continue to the Banking Jungle payment page.",
      },
      { property: "og:title", content: "Checkout — Demo Shop" },
      { property: "og:description", content: "Delivery details and a seamless handover to secure payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

const CATALOGUE = [
  { name: "Gold Hoop Earrings", price: 38 },
  { name: "Layered Necklace", price: 54 },
  { name: "Silk Scarf", price: 29 },
  { name: "Mini Shoulder Bag", price: 72 },
];

function Checkout() {
  const navigate = useNavigate();
  const startCheckout = useServerFn(createDemoSession);

  const [qty, setQty] = useState<Record<string, number>>({ "Gold Hoop Earrings": 1, "Silk Scarf": 1 });
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const items = useMemo(
    () => CATALOGUE.filter((p) => (qty[p.name] ?? 0) > 0).map((p) => ({ ...p, qty: qty[p.name] ?? 0 })),
    [qty],
  );
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!items.length) {
      setError("Add at least one product first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const session = await startCheckout({ data: { ...form, items } });
      await navigate({ to: "/pay/$id", params: { id: session.id } });
    } catch (submitError) {
      console.error(submitError);
      setError("We could not start the payment. Please check your details and try again.");
      setBusy(false);
    }
  }

  return (
    <main className="flow-page">
      <div className="flow-card flow-wide">
        <p className="flow-kicker">Demo Shop · Step 1 of 2</p>
        <h1>Checkout</h1>
        <p className="flow-muted">Choose your items and delivery details. Payment happens on the next screen.</p>

        <form className="flow-form" onSubmit={submit}>
          <section className="flow-section">
            <h2>Your items</h2>
            <div className="flow-products">
              {CATALOGUE.map((product) => (
                <div key={product.name} className="flow-product">
                  <div className="flow-product-info">
                    <strong>{product.name}</strong>
                    <span>${product.price.toFixed(2)}</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    aria-label={`Quantity of ${product.name}`}
                    value={qty[product.name] ?? 0}
                    onChange={(e) => setQty((prev) => ({ ...prev, [product.name]: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </div>
              ))}
            </div>
            <p className="flow-total">
              Total <strong>${total.toFixed(2)}</strong>
            </p>
          </section>

          <section className="flow-section">
            <h2>Delivery details</h2>
            <div className="flow-grid">
              <label className="flow-field flow-span">
                <span>Full name</span>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
              </label>
              <label className="flow-field">
                <span>Email</span>
                <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
              </label>
              <label className="flow-field">
                <span>Phone</span>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
              </label>
              <label className="flow-field flow-span">
                <span>Address</span>
                <input required value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} autoComplete="street-address" />
              </label>
              <label className="flow-field">
                <span>City</span>
                <input required value={form.city} onChange={(e) => set("city", e.target.value)} />
              </label>
              <label className="flow-field">
                <span>State / Region</span>
                <input value={form.state} onChange={(e) => set("state", e.target.value)} />
              </label>
              <label className="flow-field">
                <span>Postal code</span>
                <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
              </label>
              <label className="flow-field">
                <span>Country</span>
                <input value={form.country} onChange={(e) => set("country", e.target.value)} autoComplete="country-name" />
              </label>
              <label className="flow-field flow-span">
                <span>Delivery note (optional)</span>
                <input value={form.note} onChange={(e) => set("note", e.target.value)} />
              </label>
            </div>
          </section>

          {error ? <p className="flow-error">{error}</p> : null}

          <button type="submit" className="flow-button" disabled={busy}>
            {busy ? "Preparing secure payment…" : `Continue to payment · $${total.toFixed(2)}`}
          </button>
          <p className="flow-note">Demo only · no real card is charged or stored</p>
        </form>
      </div>
    </main>
  );
}
