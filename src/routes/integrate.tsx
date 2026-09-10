import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/integrate")({
  head: () => ({
    meta: [
      { title: "Connect Your Shop — Banking Jungle Payments" },
      {
        name: "description",
        content: "How an external shop creates a signed, permanent Banking Jungle payment link and receives the result back.",
      },
      { property: "og:title", content: "Connect Your Shop — Banking Jungle Payments" },
      { property: "og:description", content: "Signed checkout handover, permanent payment links and result callbacks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Integrate,
});

const createSnippet = `// Runs on the SHOP's server (never in the browser).
const body = JSON.stringify({
  merchant: "My Shop",
  merchantReference: order.id,
  currency: "USD",
  amount: order.total,
  returnUrl: "https://my-shop.lovable.app/order-complete",
  webhookUrl: "https://my-shop.lovable.app/api/public/payment-callback",
  items: order.items.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
  customer: {
    name, email, phone,
    addressLine, city, state, postalCode, country, note,
  },
});

const signature = await hmacSha256Hex(process.env.CHECKOUT_SHARED_SECRET, body);

const res = await fetch("https://happicard.lovable.app/api/public/checkout/sessions", {
  method: "POST",
  headers: { "content-type": "application/json", "x-signature": signature },
  body,
});

const { payUrl } = await res.json();
// Send the shopper here — the link is permanent and shareable.
return Response.redirect(payUrl, 303);`;

const hmacSnippet = `async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}`;

const callbackSnippet = `// Shop side: POST /api/public/payment-callback
const raw = await request.text();
const ok = (await hmacSha256Hex(process.env.CHECKOUT_SHARED_SECRET, raw))
  === request.headers.get("x-signature");
if (!ok) return new Response("Invalid signature", { status: 401 });

const result = JSON.parse(raw);
// { sessionId, merchantReference, status, amount, currency, paymentReference, paidAt }
await markOrder(result.merchantReference, result.status);
return new Response("ok");`;

export default function noop() {}

function Integrate() {
  return (
    <main className="flow-page">
      <div className="flow-card flow-wide">
        <p className="flow-kicker">Integration guide</p>
        <h1>Connect your shop to this payment page</h1>
        <p className="flow-muted">
          The shop and this payment site share one secret. Every handover and every result is signed with it, so nobody can
          edit a price in a link or fake a confirmation.
        </p>

        <ol className="flow-steps">
          <li>
            <h2>1 · Create a payment link (shop server)</h2>
            <pre>{createSnippet}</pre>
          </li>
          <li>
            <h2>2 · The signature helper</h2>
            <pre>{hmacSnippet}</pre>
          </li>
          <li>
            <h2>3 · Receive the result</h2>
            <p className="flow-muted">
              After payment the shopper is returned to your <code>returnUrl</code> with{" "}
              <code>?session=…&amp;status=paid&amp;reference=…&amp;signature=…</code>, and the same signed result is POSTed to your{" "}
              <code>webhookUrl</code>. Trust the webhook for fulfilment.
            </p>
            <pre>{callbackSnippet}</pre>
          </li>
        </ol>

        <p className="flow-muted">
          Payment links are permanent: <code>/pay/&lt;id&gt;</code> can be reopened or shared, and always shows the current
          status of that order.
        </p>
      </div>
    </main>
  );
}
