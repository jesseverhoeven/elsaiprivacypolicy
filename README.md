# elsaiprivacypolicy

A **deterministic privacy-policy generator for ELSA events**. An ELSA officer pastes or uploads
everything they know about an event; the tool scans it (client-side keyword rules — **no AI at
runtime**), asks only for what is still missing, applies the safeguards, and assembles a complete
GDPR privacy policy in the exact structure and fixed wording of **Annex 4 — Template Privacy
Policy**, following the mapping in the **ELSA Data Protection Handbook Ch. 4.2**.

> The output is a draft and an aid only — not legal advice, and no guarantee of completeness or
> legal validity. National laws must be observed. Every generated document must be reviewed by a
> qualified person. Questions: **dataprotection@elsa.org**. See the in-app legal disclaimer.

## Privacy by design

- 100 % client-side: no backend, no database, no accounts, no cookies, no analytics, no tracking.
- The app makes **no network requests** after loading its own static assets (verify in the browser
  Network tab). Uploaded files are parsed in the browser and never leave the device.
- Nothing is stored; refreshing clears the session. "Save answers" writes a JSON file to the
  user's own device only.

## How it works (4 steps)

1. **Your information** — one page, three channels: (a) upload PDF / Word (.docx) / text files
   (e.g. a JotForm PDF export or a Google Drive download), (b) JotForm link + pasted form content,
   (c) a free-text field. All of it feeds one deterministic analyser (`src/logic/analyze.ts`).
   *Note: the JotForm link itself is stored for reference only — browsers block cross-site reading
   of jotform.com, and the app deliberately makes no external requests. Paste the form's questions
   or upload its PDF export instead.*
2. **Complete & check** — gap analysis (`src/logic/gaps.ts`): only missing required information is
   asked. Selecting special-category data (e.g. health/dietary) triggers the **Art. 9 safeguard**
   (explicit consent + the Handbook Ch. 4.3.2 consent-banner checklist).
3. **Review & trim** — live preview in the exact Annex 4 order. Variable bullets can be rewritten,
   re-ordered and cut/restored like paper. Fixed sections are locked. A toggle shows each block's
   Annex 4 / Handbook source (traceability).
4. **Download** — Word (.docx), PDF (print dialog → Save as PDF), or "Copy for Google Docs"
   (rich-text clipboard). The policy document itself contains no generator notices — data subjects
   read it, so the review notice and disclaimer live on the webapp only, and the template-set
   version + generation date are stored in the .docx's invisible document properties. A calm
   follow-up panel lists only genuinely open points and when to contact **dataprotection@elsa.org**.

## Editing the clause library (the legally sensitive part)

All policy wording lives in **`src/data/clauses.ts`** — the single source of truth:

- Fixed text is **verbatim Annex 4** (including its original spelling). Never "improve" it in code
  review; changes must come from ELSA's Data Protection team.
- `{{tokens}}` mark the only variable spots (the yellow highlights in the .docx).
- Every deviation from verbatim Annex 4 is marked with a `deviation` note
  (`audience-adaptation`, `joint-controller-adaptation`, `contact-adaptation`,
  `brief-item-2`, `brief-item-12`) and must be reviewed by dataprotection@elsa.org.
- Pick-lists (Handbook Ch. 3.4) live in `src/data/picklists.ts`; the country → supervisory
  authority table (with **indicative, unverified** Art. 8 ages — `verified: false` until checked
  against national sources) in `src/data/supervisoryAuthorities.ts`; the Ch. 5.2 rights matrix
  (data-only in v1) in `src/data/rightsMatrix.ts`.

Because the text ships in the repo, **every wording change is a git commit** — reviewable,
attributable, and versioned. Bump `TEMPLATE_VERSION` in `clauses.ts` whenever clause text changes;
it is printed in every generated document's footer.

## Development

```bash
npm install
npm run dev      # local dev server
npm run check    # determinism + Annex 4 fidelity checks (19 assertions)
npm run build    # type-check + production build → dist/
```

`npm run check` asserts: same inputs → byte-identical output, verbatim fixed sections, exact
Annex 4 section order, conditional §5b behaviour, Art. 9 detection, locking, and per-block source
references. Run it before every deploy.

## Deploying to Cloudflare Pages

**Option A — GitHub integration (recommended):** push this repo to GitHub, then in the Cloudflare
dashboard: *Workers & Pages → Create → Pages → Connect to Git*, select the repo and set

- Build command: `npm run build`
- Build output directory: `dist`

Every push then auto-deploys. Default URL: `elsaiprivacypolicy.pages.dev` (a custom domain can be
added for free later).

**Option B — Wrangler CLI:**

```bash
npm run build
npx wrangler pages deploy ./dist --project-name elsaiprivacypolicy
```

No environment variables or secrets are needed. If access ever needs restricting to ELSA members,
use Cloudflare Access in front of the project — do not add auth to the app itself.

## Sources & traceability

| Artefact | Role |
|---|---|
| Annex 4 — Template Privacy Policy (.docx) | Exact master: section order, headings, fixed clause wording (verbatim) |
| Handbook Ch. 4.2 | What goes in each section (the mapping) |
| Handbook Ch. 3.4 | Questionnaire fields and ELSA pick-lists |
| Handbook Ch. 1.6.2 / 4.3.2 | Art. 9 sensitive-data rule / consent-banner checklist |
| Handbook Ch. 5.2 | Rights-per-legal-basis matrix (encoded as data, unused by v1 logic) |

Every rendered block carries a `source` reference to these documents (visible via the
"Show where each part comes from" toggle in step 3).
