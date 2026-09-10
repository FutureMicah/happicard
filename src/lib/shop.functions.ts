import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export type OrderItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  color: string;
  size: string;
  qty: number;
};

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: product, error } = await db.from("products").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;
    const { data: reviews } = await db
      .from("reviews")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .limit(20);
    const { data: related } = await db
      .from("products")
      .select("*")
      .eq("category", product.category)
      .neq("id", product.id)
      .limit(6);
    return {
      product: product as Product,
      reviews: (reviews ?? []) as Review[],
      related: (related ?? []) as Product[],
    };
  });

export const addReview = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        authorName: z.string().trim().min(1).max(60),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(600).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await publicClient().from("reviews").insert({
      product_id: data.productId,
      author_name: data.authorName,
      rating: data.rating,
      comment: data.comment,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const itemSchema = z.object({
  productId: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  image: z.string(),
  price: z.number().nonnegative(),
  color: z.string().default(""),
  size: z.string().default(""),
  qty: z.number().int().min(1).max(20),
});

function orderCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `SRN-${out.slice(0, 5)}-${out.slice(5)}`;
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        receiverName: z.string().trim().min(2).max(80),
        receiverEmail: z.string().trim().email().max(160),
        receiverPhone: z.string().trim().min(6).max(30),
        addressLine: z.string().trim().min(4).max(200),
        city: z.string().trim().min(1).max(80),
        state: z.string().trim().min(1).max(80),
        postalCode: z.string().trim().min(1).max(20),
        country: z.string().trim().max(80).default(""),
        note: z.string().trim().max(300).default(""),
        items: z.array(itemSchema).min(1).max(30),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = publicClient();
    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: rows, error: priceError } = await db.from("products").select("id, price, name, stock").in("id", ids);
    if (priceError) throw new Error(priceError.message);
    const byId = new Map((rows ?? []).map((r) => [r.id, r]));

    const items: OrderItem[] = data.items.map((item) => {
      const row = byId.get(item.productId);
      if (!row) throw new Error("One of the items is no longer available.");
      return { ...item, price: Number(row.price), name: row.name };
    });

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shipping = subtotal >= 25 ? 0 : 2.99;
    const total = Number((subtotal + shipping).toFixed(2));

    const { data: order, error } = await db
      .from("orders")
      .insert({
        code: orderCode(),
        receiver_name: data.receiverName,
        receiver_email: data.receiverEmail,
        receiver_phone: data.receiverPhone,
        address_line: data.addressLine,
        city: data.city,
        state: data.state,
        postal_code: data.postalCode,
        country: data.country,
        note: data.note,
        items: items as unknown as Database["public"]["Tables"]["orders"]["Insert"]["items"],
        subtotal: Number(subtotal.toFixed(2)),
        shipping,
        total,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return order as Order;
  });

export const getOrder = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => z.object({ code: z.string().trim().min(4).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { data: order, error } = await publicClient()
      .from("orders")
      .select("*")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (order ?? null) as Order | null;
  });

/**
 * Payment hook. Replace the body of this handler with a call to your own
 * payment provider (Stripe PaymentIntent capture, Paystack verify, etc.).
 * It records the order as paid and stores the provider reference.
 */
export const settleOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().trim().min(4).max(40),
        paymentReference: z.string().trim().min(3).max(80),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: order, error } = await db
      .from("orders")
      .update({ status: "paid", payment_reference: data.paymentReference, paid_at: new Date().toISOString() })
      .eq("code", data.code.toUpperCase())
      .neq("status", "paid")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (order) return order as Order;
    const { data: existing } = await db.from("orders").select("*").eq("code", data.code.toUpperCase()).maybeSingle();
    return (existing ?? null) as Order | null;
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => z.object({ code: z.string().trim().min(4).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const { data: order, error } = await publicClient()
      .from("orders")
      .update({ status: "cancelled" })
      .eq("code", data.code.toUpperCase())
      .neq("status", "paid")
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (order ?? null) as Order | null;
  });
