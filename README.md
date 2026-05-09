# Harddelete's CRM

Harddelete's CRM egy magyar nyelvű, egyedi CRM és munkaszervező webalkalmazás rendezvényes ládavasút jellegű vállalkozáshoz. A rendszer célja, hogy egy helyen kezelhetőek legyenek az ügyfelek, árajánlatok, kitelepülések, dolgozói beosztások, eszközök, ütemezések és bemutatóképes üzleti áttekintések.

## Mire való?

Az app olyan céghez készült, amely különböző rendezvényekre visz ki ládavasutakat és kapcsolódó eszközöket: falunapokra, majálisokra, céges rendezvényekre, családi napokra, városi programokra, iskolai rendezvényekre, fesztiválokra vagy magánrendezvényekre.

## Fő modulok

- Supabase Auth email + jelszavas regisztrációval és belépéssel
- Dashboard céges metrikákkal, közelgő munkákkal és bemutató áttekintéssel
- Ügyfélkezelés
- Árajánlat-kezelés, tételszámítással és PDF exporttal
- Munkák / rendezvények kezelése dátummal, helyszínnel, státusszal és vállalási árral
- Dolgozók kezelése aktív/inaktív státusszal, munkakörrel és pozícióval
- Dolgozói beosztások munkákhoz szereppel és tervezett idővel
- Eszközök / ládavasutak kezelése státusszal és kapacitással
- Eszközhozzárendelés munkákhoz mennyiséggel és megjegyzéssel
- Naptár / ütemezés nézet időrendi munkalistával
- Ütközésfigyelés dolgozókra és eszközökre
- Nyomtatható kitelepülési lap minden munkához
- Opcionális AI CRM asszisztens munkaszervezési összefoglalóhoz és checklistához

## Használt technológiák

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase adatbázis és Auth
- jsPDF árajánlat PDF exporthoz
- lucide-react ikonokhoz
- OpenAI Responses API opcionális szerveroldali AI funkcióhoz

## Telepítés

```bash
npm install
```

Windows PowerShellben, ha az `npm.ps1` tiltva van:

```powershell
npm.cmd install
```

## Környezeti változók

Másold a példa fájlt:

```powershell
Copy-Item .env.example .env.local
```

Töltsd ki:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

A Supabase értékeket a Supabase projekt `Project Settings > API` oldalán találod. Service role kulcsot ne tegyél a frontend kódba.

Az `OPENAI_API_KEY` opcionális. Ha nincs beállítva, az AI asszisztens panel nem omlik össze, hanem jelzi: `Az AI funkció nincs konfigurálva.`

## Supabase beállítás

1. Hozz létre egy Supabase projektet.
2. Engedélyezd az email + password authot.
3. Futtasd le az alap sémát a Supabase SQL Editorban:

```text
supabase/schema.sql
```

4. Futtasd le az új CRM modulok migrációját:

```text
supabase/migrations/add_crm_modules.sql
```

Ez a migráció hozza létre az alábbi táblákat:

- `employees`
- `jobs`
- `job_assignments`
- `equipment`
- `job_equipment`

Minden új táblán aktív a Row Level Security. A policy-k userenként szeparálják az adatokat, és a kapcsolótáblák azt is ellenőrzik, hogy a kapcsolt munka, dolgozó vagy eszköz ugyanahhoz a felhasználóhoz tartozzon.

## Fejlesztői indítás

```bash
npm run dev
```

Windows PowerShellben:

```powershell
npm.cmd run dev
```

Alapértelmezett URL:

```text
http://localhost:3000
```

## Build és lint

```bash
npm run lint
npm run build
```

Windows PowerShellben:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Fontos oldalak

- `/login`
- `/register`
- `/dashboard`
- `/calendar`
- `/jobs`
- `/jobs/new`
- `/jobs/[id]`
- `/jobs/[id]/edit`
- `/jobs/[id]/sheet`
- `/employees`
- `/employees/new`
- `/employees/[id]`
- `/employees/[id]/edit`
- `/equipment`
- `/equipment/new`
- `/equipment/[id]`
- `/equipment/[id]/edit`
- `/clients`
- `/quotes`
- `/settings`

## AI CRM asszisztens

Az AI funkció szerveroldali route-on keresztül működik:

```text
app/api/ai/crm-assistant/route.ts
```

A frontend nem kap API kulcsot. A dashboardon és a munka részleteinél elérhető panel rövid, magyar nyelvű munkaszervezési összefoglalót és praktikus checklistát tud generálni. Az asszisztens nem ment adatot automatikusan az adatbázisba.

## Vercel deploy röviden

1. Töltsd fel a projektet GitHubra.
2. Hozz létre új Vercel projektet a repóból.
3. Add meg az Environment Variables értékeket:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY` opcionálisan
4. Futtasd a Supabase SQL fájlokat a Supabase SQL Editorban.
5. Deploy után teszteld a belépést, dashboardot, munkákat, naptárat és egy kitelepülési lap nyomtatási nézetét.

## Ismert korlátok

- Az AI asszisztens csak akkor ad generált választ, ha az `OPENAI_API_KEY` be van állítva.
- A kitelepülési lap jelenleg böngészőből nyomtatható, nem külön PDF export.
- Az ütközésfigyelés figyelmeztet, de nem blokkolja a mentést.
- Nincs automatikus email küldés vagy naptárszinkron.
- Nincs szerepkör alapú jogosultság több belső felhasználóhoz.

## Következő fejlesztési ötletek

- Ajánlatból munka létrehozása egy kattintással
- Google Calendar vagy Outlook Calendar szinkron
- Emailes rendezvényemlékeztetők
- Dolgozói munkaidő és bérköltség riport
- Eszközkarbantartási napló
- PDF kitelepülési lap céges sablonnal
- Több felhasználós jogosultsági rendszer
