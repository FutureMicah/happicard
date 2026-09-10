import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Leaf, LockKeyhole, RotateCcw, Wifi } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import jungleCanopy from "@/assets/jungle-canopy.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Banking Jungle — Virtual Card Experience" },
      {
        name: "description",
        content: "An immersive Banking Jungle virtual-card payment simulation with cinematic motion and responsive controls.",
      },
      { property: "og:title", content: "Banking Jungle — Virtual Card Experience" },
      {
        property: "og:description",
        content: "Enter an immersive jungle-inspired virtual-card payment simulation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BankingJungle,
});

const POLLEN = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37) % 97}%`,
  top: `${(index * 61) % 91}%`,
  delay: `${(index % 9) * -0.7}s`,
  size: `${2 + (index % 3)}px`,
}));

const SHARDS = Array.from({ length: 72 }, (_, index) => ({
  angle: `${index * 5}deg`,
  distance: `${110 + (index % 7) * 18}px`,
  delay: `${(index % 8) * 0.015}s`,
}));

function BankingJungle() {
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("249.00");
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<"idle" | "processing" | "complete">("idle");
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 1850);
    return () => window.clearTimeout(timer);
  }, []);

  const displayCard = useMemo(() => card || "5311 2468 3513 4592", [card]);

  function handleMove(event: React.MouseEvent<HTMLElement>) {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    event.currentTarget.style.setProperty("--mouse-x", x.toFixed(3));
    event.currentTarget.style.setProperty("--mouse-y", y.toFixed(3));
  }

  function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (phase !== "idle") return;
    setPhase("processing");
    window.setTimeout(() => setPhase("complete"), 1900);
  }




  function reset() {
    setPhase("idle");
    setFlipped(false);
  }

  return (
    <main className={`jungle-stage ${phase === "processing" ? "is-processing" : ""} ${phase === "complete" ? "is-complete" : ""}`} onMouseMove={handleMove}>
      <img src={jungleCanopy} width={1920} height={1080} alt="" className="jungle-backdrop" />
      <div className="canopy canopy-near" aria-hidden="true" />
      <div className="canopy canopy-far" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />

      <div className="pollen-field" aria-hidden="true">
        {POLLEN.map((particle, index) => (
          <i key={index} style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size, animationDelay: particle.delay }} />
        ))}
      </div>

      {intro && (
        <div className="awakening" aria-hidden="true">
          <span className="falling-seed" />
          <span className="impact-ring" />
          <span className="vine-burst vine-one" />
          <span className="vine-burst vine-two" />
          <span className="vine-burst vine-three" />
        </div>
      )}

      <div className="jungle-shell">
        <section className="brand-panel" aria-labelledby="page-title">
          <div className="brand-lockup">
            <Leaf size={19} strokeWidth={1.7} aria-hidden="true" />
            <span>Banking Jungle</span>
          </div>
          <h1 id="page-title" className="kinetic-title" aria-label="Attractive enough to be remembered">
            <span>Attractive</span>
            <span>enough to be</span>
            <span>remembered</span>
          </h1>
          <p className="brand-copy">A virtual-card ritual shaped by the wild.</p>
          <div className="signal-line"><span /> Living network · secure simulation</div>
        </section>

        <section className="experience-panel" aria-label="Virtual card payment">
          {phase === "complete" ? (
            <SuccessState amount={amount} onReset={reset} />
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
                      <span className="leaf-mark"><Leaf size={22} /></span>
                      <span className="card-brand">Banking Jungle</span>
                      <Wifi size={24} className="contactless" aria-hidden="true" />
                    </span>
                    <span className="chip" aria-hidden="true"><i /><i /><i /></span>
                    <span className="card-number">{displayCard}</span>
                    <span className="card-bottom">
                      <span><small>Cardholder</small>{name || "Jungle Explorer"}</span>
                      <span><small>Valid thru</small>{expiry || "12 / 27"}</span>
                    </span>
                  </span>
                  <span className="card-face card-back">
                    <span className="magstripe" />
                    <span className="nfc-ripple"><Wifi size={38} /></span>
                    <span className="flip-note">Tap to return</span>
                  </span>
                </span>
              </button>

              <form className="payment-glass" onSubmit={submitPayment}>
                <div className="form-heading">
                  <div><span>Secure transaction</span><h2>Complete payment</h2></div>
                  <LockKeyhole size={19} aria-hidden="true" />
                </div>

                <div className="field-grid">
                  <Field label="Amount" htmlFor="amount" wide>
                    <div className="amount-wrap"><span>$</span><input id="amount" aria-label="Payment amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} /></div>
                  </Field>
                  <Field label="Cardholder name" htmlFor="holder" wide>
                    <input id="holder" aria-label="Cardholder name" autoComplete="cc-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jungle Explorer" />
                  </Field>
                  <Field label="Card number" htmlFor="card-number" wide>
                    <input id="card-number" aria-label="Virtual card number" inputMode="numeric" autoComplete="cc-number" value={card} onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 16); setCard(digits.replace(/(\d{4})(?=\d)/g, "$1 ")); }} placeholder="0000 0000 0000 0000" />
                  </Field>
                  <Field label="Expiry" htmlFor="expiry">
                    <input id="expiry" aria-label="Expiry date" inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={(event) => { let digits = event.target.value.replace(/\D/g, "").slice(0, 4); if (digits.length > 2) digits = `${digits.slice(0, 2)} / ${digits.slice(2)}`; setExpiry(digits); }} placeholder="MM / YY" />
                  </Field>
                  <Field label="CVV" htmlFor="cvv">
                    <input id="cvv" aria-label="Security code" type="password" inputMode="numeric" autoComplete="cc-csc" value={cvv} onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" />
                  </Field>
                </div>

                <JungleButton disabled={phase === "processing"}>
                  {phase === "processing" ? "Sealing transaction" : `Pay $${amount || "0.00"}`}
                  <ArrowRight size={18} aria-hidden="true" />
                </JungleButton>
                <p className="simulation-note">Visual simulation only · no real bank card is charged or stored</p>
              </form>
            </>
          )}

          {phase === "processing" && <PaymentRitual />}
        </section>
      </div>
    </main>
  );
}

function Field({ label, htmlFor, wide, children }: { label: string; htmlFor: string; wide?: boolean; children: ReactNode }) {
  return <label className={`jungle-field ${wide ? "field-wide" : ""}`} htmlFor={htmlFor}><span>{label}</span>{children}</label>;
}

function JungleButton({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  return <button type="submit" disabled={disabled} className="jungle-button">{children}</button>;
}

function PaymentRitual() {
  return (
    <div className="ritual" role="status" aria-live="polite" aria-label="Processing simulated payment">
      <div className="shard-field" aria-hidden="true">
        {SHARDS.map((shard, index) => <i key={index} style={{ "--angle": shard.angle, "--distance": shard.distance, animationDelay: shard.delay } as React.CSSProperties} />)}
      </div>
      <div className="holo-lock"><LockKeyhole size={54} /></div>
      <p>Securing the canopy</p>
    </div>
  );
}

function SuccessState({ amount, onReset }: { amount: string; onReset: () => void }) {
  return (
    <div className="success-state" role="status" aria-live="polite">
      <div className="crystal-wrap"><div className="emerald-crystal"><Check size={42} /></div><span className="liquid-drop" /></div>
      <p className="success-kicker">Transaction sealed</p>
      <h2>Payment complete</h2>
      <p className="success-amount">${amount || "0.00"}</p>
      <p className="transaction-id">SIM · JGL-8F2A-49C1</p>
      <button type="button" className="reset-button" onClick={onReset}><RotateCcw size={16} /> New simulation</button>
      <p className="simulation-note">Visual simulation only · no funds moved</p>
    </div>
  );
}