import { Link, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/order-complete")({
  validateSearch: z.object({
    status: z.string().optional(),
    reference: z.string().optional(),
    session: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmation — Demo Shop" },
      { name: "description", content: "Your demo shop order status after returning from the Banking Jungle payment page." },
      { property: "og:title", content: "Order Confirmation — Demo Shop" },
      { property: "og:description", content: "See whether your demo payment succeeded and what happens next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrderComplete,
});

function OrderComplete() {
  const { status, reference } = Route.useSearch();
  const paid = status === "paid";

  return (
    <main className="flow-page">
      <div className="flow-card flow-card-center">
        <p className="flow-kicker">Demo Shop</p>
        <h1>{paid ? "Order confirmed" : "Payment not completed"}</h1>
        <p className="flow-muted">
          {paid
            ? "The payment page confirmed your transaction and sent the result straight back to the shop."
            : "The payment was cancelled or failed. Nothing has been charged — you can try again."}
        </p>
        {reference ? <p className="flow-ref">Reference · {reference}</p> : null}
        <div className="flow-actions">
          <Link to="/checkout" className="flow-button">
            Back to checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
