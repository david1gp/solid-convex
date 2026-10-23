/**
 * Shared types for the cookie-consent + Google tracking helpers.
 *
 * - Consent is persisted in `localStorage` (no third-party cookie library).
 * - Google Consent Mode v2 defaults everything to "denied" until the user opts in.
 * - `gtag.js` is only injected once the user grants statistics and/or marketing.
 */

export type ConsentCategory = "statistics" | "marketing"
