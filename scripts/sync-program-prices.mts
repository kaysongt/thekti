import { writeFile } from "node:fs/promises";
import Stripe from "stripe";
import { ACADEMY_OFFERS, BASIC_PASS } from "../lib/programs";
import { STRIPE_API_VERSION } from "../lib/payments/stripe-version";

async function sync() {
  if (process.env.VERCEL_ENV !== "production") return;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (process.env.STRIPE_MODE !== "live" || !key || !/^(sk|rk)_live_/.test(key)) {
    console.info("New program checkout awaits KingsWord live Stripe configuration.");
    return;
  }
  const stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION, maxNetworkRetries: 2 });
  const account = await stripe.accounts.retrieve();
  const merchantNames = [account.business_profile?.name, account.company?.name, account.settings?.dashboard?.display_name];
  const verified = merchantNames.some((name) => name && /^kingsword(?:$|\s|international|ministries|training|chicago)/i.test(name.trim()));
  if (!verified || !account.charges_enabled) {
    console.info("New program checkout awaits verification of the KingsWord merchant.");
    return;
  }
  const prices: Record<string, string> = {};
  for (const offer of [BASIC_PASS, ...ACADEMY_OFFERS]) {
    const lookup = "kti_" + offer.product.replaceAll("-", "_") + "_usd";
    const productId = "kti_" + offer.product.replaceAll("-", "_");
    const amount = offer.amount * 100;
    let price = (await stripe.prices.list({ lookup_keys: [lookup], limit: 1 })).data[0];
    if (!price) {
      let product;
      try { product = await stripe.products.retrieve(productId); }
      catch (err) {
        if (!(err instanceof Stripe.errors.StripeInvalidRequestError) || err.code !== "resource_missing") throw err;
        product = await stripe.products.create({ id: productId, name: offer.title, metadata: { kti_program: offer.product } }, { idempotencyKey: productId + "_create_v1" });
      }
      if (!product.active || product.metadata.kti_program !== offer.product) throw new Error("Unexpected Stripe product.");
      price = await stripe.prices.create({ currency: "usd", unit_amount: amount, product: productId, lookup_key: lookup }, { idempotencyKey: lookup + "_v1" });
    }
    if (!price.active || !price.livemode || price.type !== "one_time" || price.currency !== "usd" || price.unit_amount !== amount || price.product !== productId) {
      throw new Error("Program price differs from KTI tuition.");
    }
    prices[offer.product] = price.id;
  }
  await writeFile("lib/payments/program-prices.json", JSON.stringify({ account: account.id, prices }));
  console.info("Verified KingsWord live tuition for all " + Object.keys(prices).length + " offers.");
}
try { await sync(); } catch (err) {
  console.error("New program checkout unavailable:", err instanceof Error ? err.name : "Stripe error");
}
