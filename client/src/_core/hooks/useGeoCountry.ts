import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { AFRICAN_COUNTRIES } from "../../../../shared/africanCountries";

const COUNTRY_CODES = new Set(AFRICAN_COUNTRIES.map(c => c.code));

// Detect country from browser locale (client-side fallback)
function detectFromBrowser(): string | null {
  const locales = navigator.languages || [navigator.language];
  for (const locale of locales) {
    const match = locale.match(/[a-z]{2}-([A-Z]{2})/);
    if (match && COUNTRY_CODES.has(match[1])) return match[1];
  }
  return null;
}

/**
 * On first mount (for a logged-in user), calls africa.autoDetectCountry
 * so the server can read CF-IPCountry / header-based geo and persist the result.
 * If server returns nothing, falls back to browser locale detection.
 */
export function useGeoCountry() {
  const autoDetect = trpc.africa.autoDetectCountry.useMutation();
  const setMyCountry = trpc.africa.setMyCountry.useMutation();
  const { data: myCountry } = trpc.africa.getMyCountry.useQuery();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || myCountry !== undefined) return; // already set or loading
    ran.current = true;

    autoDetect.mutate(undefined, {
      onSuccess(result) {
        // If server couldn't detect, try browser locale
        if (!result) {
          const code = detectFromBrowser();
          if (code) setMyCountry.mutate({ countryCode: code, method: "browser" });
        }
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCountry]);

  return myCountry;
}
