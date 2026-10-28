import { BillingCycleString } from '../entities/Pricing';

/**
 * A first-payment offer the product sets on the page (window.FS_PRICING_INTRO_OFFER): a coupon that takes a
 * fixed amount or a percentage off the first yearly payment of some plans ("$49 the first year, then $99").
 *
 *   {
 *     coupon: 'FIRSTYEAR',
 *     discount: 50,
 *     discount_type: 'dollar',          // or 'percentage'
 *     currency: 'usd',                  // the currency the offer is shown in
 *     plans: { '75042': 149 }           // plan id => the yearly price the offer was made for
 *   }
 *
 * It applies to a plan only while that plan's yearly price is still the one listed, so a price changed in
 * Freemius never shows a wrong first-year price.
 *
 * @param {Object} plan
 * @param {Object} pricing       The selected pricing of the plan.
 * @param {string} billingCycle  The selected billing cycle.
 * @param {string} currency      The selected currency.
 *
 * @return {Object|null} { coupon, firstPrice, regularPrice, savings } or null.
 */
export function introOffer(plan, pricing, billingCycle, currency) {
  const offer = window.FS_PRICING_INTRO_OFFER;

  if (
    !offer ||
    !offer.coupon ||
    !plan ||
    !pricing ||
    BillingCycleString.ANNUAL !== billingCycle ||
    (offer.currency && offer.currency !== currency)
  ) {
    return null;
  }

  const expected = offer.plans ? offer.plans[String(plan.id)] : undefined;
  const regularPrice = parseFloat(pricing.annual_price);

  if (
    undefined === expected ||
    !(regularPrice > 0) ||
    regularPrice !== parseFloat(expected)
  ) {
    return null;
  }

  const savings =
    'percentage' === offer.discount_type
      ? Math.round(regularPrice * parseFloat(offer.discount)) / 100
      : parseFloat(offer.discount);

  if (!(savings > 0) || savings >= regularPrice) {
    return null;
  }

  return {
    coupon: offer.coupon,
    firstPrice: Math.round((regularPrice - savings) * 100) / 100,
    regularPrice,
    savings,
  };
}
