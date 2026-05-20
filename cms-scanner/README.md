Hotspot z telefonu, laptop podłączony do tej sieci Wi‑Fi.
W cms-scanner/.env:
EXPO_PUBLIC_API_URL=http://ipv4:3000
cms-demo: pnpm dev:lan
cms-scanner: npx expo start -c
Na ekranie skanera: API: http://...:3000/api/warehouse/intake
