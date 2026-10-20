// Gift vouchers sold on /voucher/ and paid online with Stripe.
//
// Tiers and prices set by the studio on 2026-10-20. The booking backend (google-apps-script/Code.gs)
// has its own copy (VOUCHERS) and charges those prices, never the ones sent by the page, so change
// both together. Names and contents per language are in src/i18n/content/voucherShop.ts.

export type VoucherTierId = 'gift' | 'start' | 'song' | 'single' | 'day' | 'rehearsal';

export interface VoucherTier {
  id: VoucherTierId;
  price: number | null; // PLN; null = the buyer picks the amount (gift card)
}

export const VOUCHER_TIERS: VoucherTier[] = [
  { id: 'start', price: 240 }, // 2 h recording
  { id: 'song', price: 599 }, // 2 h recording + mix and master of 1 song
  { id: 'single', price: 990 }, // 5 h recording + mix and master of 1 song
  { id: 'day', price: 1690 }, // 8 h recording + mix and master of 2 songs
  { id: 'rehearsal', price: 550 }, // 10 h in the rehearsal room
  { id: 'gift', price: null }, // any amount, for any service
];

// Gift card amount limits and the quick picks shown under the amount field.
export const GIFT_MIN = 100;
export const GIFT_MAX = 5000;
export const GIFT_PRESETS = [200, 300, 500, 1000];

export const VOUCHER_VALID_MONTHS = 3; // set by the studio on 2026-10-20
