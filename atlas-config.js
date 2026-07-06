// Wanderer's Atlas online short-code configuration.
//
// Supabase is enabled for 7-character online share codes.
//
// Keep using the publishable/anon key only.
// Never paste a service_role or secret key into this public website file.

window.WANDERERS_ATLAS_CONFIG = {
  supabase: {
    enabled: true,
    url: "https://dwqwwmrhayewjkntjrmc.supabase.co",
    anonKey: "sb_publishable_bWrd3Q4pkWzjVmaiPY8_mw_D_zlfcT8",
    table: "atlas_shares",
    expiresDays: 30
  }
};
