import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const bodySchema = z.object({
  merchant: z.string().trim().min(1).max(80).default("Demo Shop"),
  merchantReference: z.string().trim().max(80).optional(),
  currency: z.string().trim().length(3).default("USD"),
  amount: z.number().nonnegative().max(1_000_000),
  returnUrl: z.string().url().max(500),
  webhookUrl: z.string().url().max(500).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(140),
        price: z.number().nonnegative(),
        qty: z.number().int().min(1).max(99).default(1),
        image: z.string().max(600).optional(),
      }),
    )
    .min(1)
    .max(40),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().max(40).default(""),
    addressLine: z.string().trim().max(240).default(""),
    city: z.string().trim().max(80).default(""),
    state: z.string().trim().max(80).default(""),
    postalCode: z.string().trim().max(20).default(""),
    country: z.string().trim().max(80).default(""),
    note: z.string().trim().max(300).default(""),
  }),
});

export const Route = createFileRoute("/api/public/checkout/sessions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-signature") ?? "";
        const { verify } = await import("@/lib/signing.server");

        let signatureOk = false;
        try {
          signatureOk = Boolean(signature) && (await verify(raw, signature));
        } catch {
          return Response.json({ error: "Payment site is not configured" }, { status: 500, headers: corsHeaders });
        }
        if (!signatureOk) {
          return Response.json({ error: "Invalid signature" }, { status: 401, headers: corsHeaders });
        }

        const parsed = bodySchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
          return Response.json({ error: "Invalid payload" }, { status: 400, headers: corsHeaders });
        }
        const input = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("payment_sessions")
          .insert({
            merchant: input.merchant,
            merchant_reference: input.merchantReference ?? null,
            currency: input.currency.toUpperCase(),
            amount: input.amount,
            return_url: input.returnUrl,
            webhook_url: input.webhookUrl ?? null,
            items: input.items,
            customer: input.customer,
          })
          .select("id")
          .single();

        if (error || !data) {
          return Response.json({ error: "Could not create session" }, { status: 500, headers: corsHeaders });
        }

        const origin = new URL(request.url).origin;
        return Response.json(
          { id: data.id, payUrl: `${origin}/pay/${data.id}` },
          { status: 201, headers: corsHeaders },
        );
      },
    },
  },
});
