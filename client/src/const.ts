export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Redirect to Google OAuth — handled server-side at /api/auth/google
export const getLoginUrl = () => "/api/auth/google";
