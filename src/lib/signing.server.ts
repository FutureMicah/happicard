const encoder = new TextEncoder();

function secret() {
  const value = process.env["CHECKOUT_SHARED_SECRET"];
  if (!value) throw new Error("CHECKOUT_SHARED_SECRET is not configured");
  return value;
}

async function key() {
  return crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

export async function sign(payload: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await key(), encoder.encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verify(payload: string, signature: string): Promise<boolean> {
  const expected = await sign(payload);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
