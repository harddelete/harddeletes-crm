# Harddelete's CRM

Harddelete's CRM egy magyar nyelvű céges CRM és munkaszervező MVP egy ládavasút élmény jellegű rendezvényes vállalkozásnak. A rendszer célja, hogy egy helyen kezelhetőek legyenek az ügyfelek, ajánlatok, konkrét kitelepülések, dolgozói beosztások és a ládavasutakhoz vagy rendezvényekhez használt eszközök.

## Mire való?

Az app olyan vállalkozáshoz készült, amely különböző rendezvényekre visz ki ládavasútakat és kapcsolódó eszközöket, például falunapra, majálisra, céges rendezvényre, családi napra, városi programra, iskolai rendezvényre, fesztiválra vagy magánrendezvényre.

## Fő modulok

- Supabase Auth email + jelszavas regisztrációval és belépéssel
- Dashboard közelgő munkákkal, státusz összesítővel és céges metrikákkal
- Ügyfelek kezelése
- Árajánlatok kezelése, tételszámítással és PDF exporttal
- Dolgozók kezelése aktív/inaktív státusszal, munkakörrel és pozícióval
- Eszközök / ládavasutak kezelése státusszal és kapacitással
- Munkák / rendezvények kezelése dátummal, helyszínnel, státusszal és vállalási árral
- Dolgozók hozzárendelése munkákhoz szereppel és tervezett idővel
- Eszközök hozzárendelése munkákhoz mennyiséggel és megjegyzéssel

## Használt technológiák

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase adatbázis és Auth
- jsPDF PDF exporthoz
- lucide-react ikonokhoz

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
```

Az értékeket a Supabase projekt `Project Settings > API` oldalán találod. Service role kulcsot ne tegyél a frontend kódba.

## Supabase beállítás

1. Hozz létre egy Supabase projektet.
2. Engedélyezd az email + password authot.
3. Futtasd le az alap sémát:

```text
supabase/schema.sql
```

4. Futtasd le az új CRM modulok migrációját:

```text
supabase/migrations/add_crm_modules.sql
```

Az új migráció ezeket a táblákat hozza létre:

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

## Új oldalak

- `/jobs`
- `/jobs/new`
- `/jobs/[id]`
- `/jobs/[id]/edit`
- `/employees`
- `/employees/new`
- `/employees/[id]`
- `/employees/[id]/edit`
- `/equipment`
- `/equipment/new`
- `/equipment/[id]`
- `/equipment/[id]/edit`

A meglévő `/clients`, `/quotes` és `/settings` oldalak továbbra is megmaradtak.

## Ismert korlátok

- Nincs AI ajánlatsegéd vagy OpenAI integráció.
- Nincs naptár szinkron, email küldés vagy automatikus számlázás.
- A PDF export továbbra is egyszerű böngészős ajánlat PDF.
- Az eszközfoglalás jelenleg nem figyel automatikus ütközéseket ugyanarra a dátumra.
- A dolgozói munkaidőből még nincs automatikus bérköltség számítás.

## Következő fejlesztési ötletek

- Naptár nézet munkákhoz
- Eszköz ütközésfigyelés
- Dolgozói munkaidő és költség riport
- Ajánlatból munka létrehozása egy kattintással
- Logózott PDF sablonok
- Emailes ajánlatküldés és rendezvény emlékeztetők
- Jogosultsági szintek több belső felhasználónak
