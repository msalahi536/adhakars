function safeEqual(a: string, b: string) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function checkAdminPassword(pw: string) {
  const expected = process.env["ADMIN_PASSWORD"]?.trim();
  if (!expected || expected.length < 8 || !safeEqual(pw.trim(), expected)) {
    await new Promise((r) => setTimeout(r, 800));
    throw new Error("Unauthorized");
  }
}
