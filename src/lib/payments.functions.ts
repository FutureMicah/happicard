import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type SessionItem = { name: string; price: number; qty: number; image?: string };

export type PublicSession = {
  id: string;
  merchant: string;
  merchantReference: string | null;
  currency: string;
  amount: number;
  items: SessionItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    note?: string;
  };
  status: "pending" | "paid" | "failed" | "cancelled";
  paymentReference: string | null;
  returnHost: string;
};

function paymentReference() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `JGL-${out.slice(0, 4)}-${out.slice(4)}`;
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "the shop";
  }
}

/** Loads a shareable payment link. The link id is permanent and can be reopened any time. */
export const getPaymentSession = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payment_sessions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return {
      id: row.id,
      merchant: row.merchant,
      merchantReference: row.merchant_reference,
      currency: row.currency,
      amount: Number(row.amount),
      items: (row.items ?? []) as unknown as SessionItem[],
      customer: (row.customer ?? {}) as PublicSession["customer"],
      status: row.status as PublicSession["status"],
      paymentReference: row.payment_reference,
      returnHost: hostOf(row.return_url),
    } satisfies PublicSession;
  });

async function finish(id: string, outcome: "paid" | "failed") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sign } = await import("@/lib/signing.server");

  const { data: row, error } = await supabaseAdmin
    .from("payment_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("This payment link no longer exists.");

  let status = row.status as PublicSession["status"];
  let reference = row.payment_reference;

  if (status === "pending") {
    reference = outcome === "paid" ? paymentReference() : null;
    const { error: updateError } = await supabaseAdmin
      .from("payment_sessions")
      .update({
        status: outcome,
        payment_reference: reference,
        paid_at: outcome === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("status", "pending");
    if (updateError) throw new Error(updateError.message);
    status = outcome;
  }

  const payload = JSON.stringify({
    sessionId: row.id,
    merchantReference: row.merchant_reference,
    status,
    amount: Number(row.amount),
    currency: row.currency,
    paymentReference: reference,
    paidAt: status === "paid" ? new Date().toISOString() : null,
  });

  const signature = await sign(payload);

  if (row.webhook_url) {
    try {
      await fetch(row.webhook_url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-signature": signature },
        body: payload,
      });
    } catch (webhookError) {
      console.error("webhook delivery failed", webhookError);
    }
  }

  const query = new URLSearchParams({
    session: row.id,
    status,
    reference: reference ?? "",
    signature,
  });
  const joiner = row.return_url.includes("?") ? "&" : "?";

  return { status, paymentReference: reference, returnUrl: `${row.return_url}${joiner}${query.toString()}` };
}

export const completePayment = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => finish(data.id, "paid"));

export const abandonPayment = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => finish(data.id, "failed"));

const demoSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).default(""),
  addressLine: z.string().trim().min(3).max(240),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().max(80).default(""),
  postalCode: z.string().trim().max(20).default(""),
  country: z.string().trim().max(80).default(""),
  note: z.string().trim().max(300).default(""),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(140),
        price: z.number().nonnegative(),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
});

/** Demo shop checkout on this same site — creates the very same kind of payment link. */
export const createDemoSession = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => demoSchema.parse(d))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const origin = new URL(getRequest().url).origin;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const amount = Number(data.items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2));
    const { items, ...customer } = data;

    const { data: row, error } = await supabaseAdmin
      .from("payment_sessions")
      .insert({
        merchant: "Demo Shop",
        merchant_reference: `DEMO-${Date.now().toString(36).toUpperCase()}`,
        return_url: `${origin}/order-complete`,
        currency: "USD",
        amount,
        items,
        customer,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Could not start checkout");
    return { id: row.id as string, payUrl: `${origin}/pay/${row.id}` };
  });
