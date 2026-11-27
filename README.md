# CMS-DEMO — System B2B konfiguracji produktów i obsługi zamówień

Aplikacja webowa klasy B2B do konfiguracji produktów pod wymiar, automatycznej wyceny na podstawie szablonów macierzowych oraz kompleksowej obsługi zamówień (projekt inżynierski).

## Główne funkcjonalności

- **Panel klienta (`/nowe-zamowienie`, `/koszyk`, `/zamowienia`)**:
  - dynamiczny konfigurator produktów (wymiary w mm, wariant/kolor, model, ilość),
  - koszyk oparty na zamówieniach w statusie `DRAFT` zapisywanych w bazie danych,
  - formularz finalizacji zamówienia (odbiór osobisty lub dostawa + dane firmy) z walidacją Zod,
  - historia zamówień, podgląd szczegółów, anulowanie, ponowne dodawanie do koszyka oraz eksport do **PDF** i **XLSX**.
- **Silnik wyceny (`lib/pricing.ts`)**:
  - obliczanie ceny na podstawie macierzy wymiarowej (szerokość × wysokość) i dopłat za warianty,
  - serwerowe przeliczanie cen podczas składania zamówienia,
  - oznaczanie pozycji przekraczających zakres tabeli lub bez cennika jako wymagających wyceny indywidualnej.
- **Panel administratora (`/admin/zamowienia`, `/admin/produkty`, `/admin/cennik`)**:
  - zarządzanie zamówieniami, zmiana statusów i eksport zestawień,
  - kreator i edytor produktów z konfigurowalnymi parametrami wejściowymi,
  - edytor szablonów cenników.
- **Autoryzacja i bezpieczeństwo**:
  - uwierzytelnianie w oparciu o NextAuth (JWT + `bcryptjs`),
  - kontrola dostępu oparta o role (`klient`, `pracownik`, `host`) w middleware oraz endpointach API,
  - nagłówki bezpieczeństwa HTTP (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`).

## Stos technologiczny

- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Baza danych i ORM**: PostgreSQL, Prisma 5
- **Uwierzytelnianie**: NextAuth 4
- **UI i walidacja**: Tailwind CSS, Radix UI / shadcn/ui, React Hook Form, Zod
- **Eksport dokumentów**: `jspdf`, `jspdf-autotable`, `exceljs`, `xlsx`
- **Testy**: Vitest

## Uruchomienie lokalne

1. Przejdź do katalogu aplikacji i zainstaluj zależności:
   ```bash
   cd cms-demo
   pnpm install
   ```

2. Utwórz plik `.env` na podstawie `.env.example` i uzupełnij połączenie do bazy PostgreSQL oraz sekrety:
   ```bash
   cp .env.example .env
   ```

3. Wygeneruj klienta Prisma, zastosuj migracje i załaduj dane startowe:
   ```bash
   pnpm exec prisma generate
   pnpm exec prisma migrate deploy
   pnpm db:seed
   ```

4. Uruchom serwer deweloperski:
   ```bash
   pnpm dev
   ```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Konta demonstracyjne (po wykonaniu `pnpm db:seed`)

| Rola | E-mail | Hasło |
| --- | --- | --- |
| Administrator (`host`) | `admin@demo.pl` | `Admin123!` |
| Klient (`klient`) | `klient@demo.pl` | `Klient123!` |

## Dostępne skrypty (`cms-demo`)

- `pnpm dev` — uruchomienie serwera deweloperskiego Next.js
- `pnpm build` — budowanie wersji produkcyjnej
- `pnpm start` — uruchomienie wersji produkcyjnej
- `pnpm lint` — weryfikacja reguł ESLint
- `pnpm typecheck` — sprawdzenie typów TypeScript (`tsc --noEmit`)
- `pnpm test` — uruchomienie testów jednostkowych (Vitest)
- `pnpm db:seed` — zasilenie bazy danymi demonstracyjnymi
