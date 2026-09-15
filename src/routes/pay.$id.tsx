import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Leaf, LockKeyhole, ShieldCheck, Wifi, XCircle } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import html2canvas from "html2canvas";

import jungleCanopy from "@/assets/jungle-canopy.jpg";
import { abandonPayment, completePayment, getPaymentSession } from "@/lib/payments.functions";

export const Route = createFileRoute("/pay/$id")({
  loader: ({ params }) => getPaymentSession({ data: { id: params.id } }),
  head: ({ loaderData }) => {
    const title = loaderData ? `Pay ${loaderData.merchant} — Banking Jungle` : "Payment link unavailable";
    return {
      meta: [
        { title },
        { name: "description", content: "Secure Banking Jungle payment page for your order." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Complete your order on the Banking Jungle payment page." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: PayPage,
});

const POLLEN = Array.from({ length: 22 }, (_, index) => ({
  left: `${(index * 41) % 97}%`,
  top: `${(index * 59) % 91}%`,
  delay: `${(index % 9) * -0.7}s`,
  size: `${2 + (index % 3)}px`,
}));

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function PayPage() {
  const session = Route.useLoaderData();
  const pay = useServerFn(completePayment);
  const abandon = useServerFn(abandonPayment);

  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [outcome, setOutcome] = useState<{ status: string; reference: string | null; returnUrl: string } | null>(null);
  const [error, setError] = useState("");

  const holder = session?.customer.name ?? "";
  const displayCard = useMemo(() => card || "5311 2468 3513 4592", [card]);

  useEffect(() => {
    if (!outcome) return;
    const timer = window.setTimeout(() => {
      window.location.href = outcome.returnUrl;
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [outcome]);

  if (!session) {
    return (
      <main className="flow-page">
        <div className="flow-card flow-card-center">
          <h1>Payment link not found</h1>
          <p className="flow-muted">This link is invalid or was created by a different site.</p>
        </div>
      </main>
    );
  }

  if (session.status !== "pending" && !outcome) {
    return (
      <main className="flow-page">
        <div className="flow-card flow-card-center">
          <p className="flow-kicker">{session.merchant}</p>
          <h1>{session.status === "paid" ? "This order is already paid" : "This payment was not completed"}</h1>
          <p className="flow-muted">
            {money(session.amount, session.currency)} · {session.items.length} item(s)
          </p>
          {session.paymentReference ? <p className="flow-ref">Reference · {session.paymentReference}</p> : null}
        </div>
      </main>
    );
  }

  async function run(kind: "pay" | "cancel", event?: FormEvent) {
    event?.preventDefault();
    if (phase !== "idle") return;
    setError("");
    setPhase("processing");
    try {
      const result = kind === "pay" ? await pay({ data: { id: session!.id } }) : await abandon({ data: { id: session!.id } });
      window.setTimeout(() => {
        setOutcome({ status: result.status, reference: result.paymentReference, returnUrl: result.returnUrl });
        setPhase("done");
      }, 1400);
    } catch (runError) {
      console.error(runError);
      setError("Something went wrong. Please try again.");
      setPhase("idle");
    }
  }

  return (
    <main className={`jungle-stage ${phase === "processing" ? "is-processing" : ""} ${phase === "done" ? "is-complete" : ""}`}>
      <img src={jungleCanopy} width={1920} height={1080} alt="" className="jungle-backdrop" />
      <div className="canopy canopy-near" aria-hidden="true" />
      <div className="canopy canopy-far" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <div className="pollen-field" aria-hidden="true">
        {POLLEN.map((p, index) => (
          <i key={index} style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay }} />
        ))}
      </div>

      <div className="jungle-shell">
        <section className="brand-panel">
          <div className="brand-lockup">
            <Leaf size={19} strokeWidth={1.7} aria-hidden="true" />
            <span>Banking Jungle</span>
          </div>
          <h1 className="kinetic-title">
            <span>{session.merchant}</span>
            <span>secure</span>
            <span>checkout</span>
          </h1>

          <div className="order-summary">
            <h2>Order summary</h2>
            <ul>
              {session.items.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <span>
                    {item.name} <small>× {item.qty}</small>
                  </span>
                  <span>{money(item.price * item.qty, session.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="order-total">
              <span>Total</span>
              <strong>{money(session.amount, session.currency)}</strong>
            </p>
            <div className="order-deliver">
              <ShieldCheck size={15} aria-hidden="true" />
              <div>
                <strong>{session.customer.name}</strong>
                <span>{session.customer.email}</span>
                <span>
                  {[session.customer.addressLine, session.customer.city, session.customer.state, session.customer.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            </div>
          </div>
          <div className="signal-line">
            <span /> Step 2 of 2 · you will return to {session.returnHost}
          </div>
        </section>

        <section className="experience-panel" aria-label="Card payment">
          {phase === "done" && outcome ? (
            <div className="success-state" role="status" aria-live="polite">
              <div className="crystal-wrap">
                <div className="emerald-crystal">{outcome.status === "paid" ? <Check size={42} /> : <XCircle size={42} />}</div>
                <span className="liquid-drop" />
              </div>
              <p className="success-kicker">{outcome.status === "paid" ? "Transaction sealed" : "Payment cancelled"}</p>
              <h2>{outcome.status === "paid" ? "Payment complete" : "Not completed"}</h2>
              <p className="success-amount">{money(session.amount, session.currency)}</p>
              {outcome.reference ? <p className="transaction-id">{outcome.reference}</p> : null}
              <p className="simulation-note">Returning you to {session.returnHost}…</p>
              <a className="reset-button" href={outcome.returnUrl}>
                Return now <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="card-scene"
                onClick={() => setFlipped((value) => !value)}
                aria-label={flipped ? "Show front of virtual card" : "Show back of virtual card"}
              >
                <span className={`living-card ${flipped ? "is-flipped" : ""}`}>
                  <span className="card-face card-front">
                    <span className="moss-pattern" aria-hidden="true" />
                    <span className="card-topline">
                      <span className="leaf-mark">
                        <Leaf size={22} />
                      </span>
                      <span className="card-brand">Banking Jungle</span>
                      <Wifi size={24} className="contactless" aria-hidden="true" />
                    </span>
                    <span className="chip" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="card-number">{displayCard}</span>
                    <span className="card-bottom">
                      <span>
                        <small>Cardholder</small>
                        {holder || "Jungle Explorer"}
                      </span>
                      <span>
                        <small>Valid thru</small>
                        {expiry || "12 / 27"}
                      </span>
                    </span>
                  </span>
                  <span className="card-face card-back">
                    <span className="magstripe" />
                    <span className="nfc-ripple">
                      <Wifi size={38} />
                    </span>
                    <span className="flip-note">Tap to return</span>
                  </span>
                </span>
              </button>

              <form className="payment-glass" onSubmit={(event) => run("pay", event)}>
                <div className="form-heading">
                  <div>
                    <span>Secure transaction</span>
                    <h2>Complete payment</h2>
                  </div>
                  <LockKeyhole size={19} aria-hidden="true" />
                </div>

                <div className="field-grid">
                  <Field label="Card number" htmlFor="card-number" wide>
                    <input
                      id="card-number"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={card}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
                        setCard(digits.replace(/(\d{4})(?=\d)/g, "$1 "));
                      }}
                      placeholder="0000 0000 0000 0000"
                    />
                  </Field>
                  <Field label="Expiry" htmlFor="expiry">
                    <input
                      id="expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={expiry}
                      onChange={(event) => {
                        let digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                        if (digits.length > 2) digits = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
                        setExpiry(digits);
                      }}
                      placeholder="MM / YY"
                    />
                  </Field>
                  <Field label="CVV" htmlFor="cvv">
                    <input
                      id="cvv"
                      type="text"
                      inputMode="numeric"
                      value={cvv}
                      onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                    />
                  </Field>
                </div>

                {error ? <p className="flow-error">{error}</p> : null}

                <button type="submit" disabled={phase === "processing"} className="jungle-button">
                  {phase === "processing" ? "Sealing transaction" : `Pay ${money(session.amount, session.currency)}`}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button type="button" className="ghost-button" onClick={() => run("cancel")} disabled={phase === "processing"}>
                  Cancel and return to {session.returnHost}
                </button>
                <p className="simulation-note">Visual simulation only · no real bank card is charged or stored</p>
              </form>
            </>
          )}

          {phase === "processing" && (
            <div className="ritual" role="status" aria-live="polite">
              <div className="holo-lock">
                <LockKeyhole size={54} />
              </div>
              <p>Securing the canopy</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, htmlFor, wide, children }: { label: string; htmlFor: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={`jungle-field ${wide ? "field-wide" : ""}`} htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
    </label>
  );
}
