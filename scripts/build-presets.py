# -*- coding: utf-8 -*-
"""
build-presets.py — converts approved ELSA privacy policies (.docx/.pdf, Annex 4
structure) into the preset-event data the app's step 1 offers.

Usage:
    python scripts/build-presets.py "C:\\path\\to\\All ELSA Privacy Policies (Archived, Current, Drafts)"

Output: src/data/presets.generated.json
- One preset per event (the MOST RECENT version of each policy wins).
- Only VARIABLE data is extracted (subjects, categories, purposes+bases,
  recipients, sources, transfers, controller); fixed Annex 4 wording always
  comes from the app's clause library, never from here.

To add newly approved policies: drop them in the folder, re-run, commit the JSON.
"""
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

AREA_BY_FOLDER = {
    "1. bee": "BEE", "2. im": "IM", "3. fm": "FM",
    "4. aa": "Academic Activities", "5. academic activities": "Academic Activities",
    "5. c": "Competitions", "6. competitions": "Competitions",
    "6. s&c": "Seminars & Conferences", "8. seminars & conferences": "Seminars & Conferences",
    "7. professional development": "Professional Development",
    "privacy policies 2024-2025": None,  # archived — area inferred from name
}

# folder priority when dates tie: current area folders > top level > 24-25 archive > pre-2024
def folder_rank(path: Path, root: Path) -> int:
    rel = path.relative_to(root)
    top = rel.parts[0].lower() if len(rel.parts) > 1 else ""
    if top in AREA_BY_FOLDER and AREA_BY_FOLDER[top]:
        return 3
    if len(rel.parts) == 1:
        return 2 if "pre-2024" not in rel.parts[0].lower() else 0
    if "2024-2025" in top:
        return 1
    return 0

STD_CATEGORIES = [
    ("personal-identification", ["personal identification"]),
    ("contact-information", ["contact information", "contact detail"]),
    ("billing-contribution", ["billing", "contribution"]),
    ("financial-information", ["financial"]),
    ("elsa-activity", ["elsa activity", "elsa affiliation", "elsa career", "elsa background"]),
    ("emergency-contact", ["emergency contact"]),
    ("professional-educational", ["professional and educational", "professional details", "educational details", "professional & educational"]),
    ("application-process", ["application process", "application details", "application data"]),
    ("meal-details", ["meal details", "meal preferences"]),
    ("health-data", ["health data", "dietary"]),
    ("transfer-details", ["transfer details", "travel details", "travel data"]),
    ("accommodation-details", ["accommodation"]),
    ("additional-services", ["additional services"]),
    ("photos-recordings", ["photograph", "recording", "image", "photo"]),
    ("communication-data", ["communication data"]),
    ("religious-beliefs", ["religious"]),
    ("political-opinions", ["political"]),
    ("trade-union", ["trade union"]),
]

KNOWN_SUBJECTS = [
    "National/Local Group Representatives", "National Group Team Officers", "International Guests",
    "Chairs", "Auditors", "Representatives of the Board", "Representatives of former Boards for Relief of Responsibility",
    "Alumni", "Partners", "Speakers", "Emergency Contacts of Participants",
    "Participants of the project (and coaches of teams)", "Panelists",
]

BASIS_HEADS = [
    ("contract", re.compile(r"^contractual obligations?\s*:", re.I)),
    ("consent", re.compile(r"^consent\s*:", re.I)),
    ("legitimateInterest", re.compile(r"^legitimate interests?\s*:", re.I)),
    ("legalObligation", re.compile(r"^legal (compliance|obligations?)\s*:", re.I)),
]

VOLUNTEER_AUDIENCE = re.compile(r"officer|trainer|coach|judge|panellist|panelist|national coordinator|organiser|organizer|oc\b|board|host|facilitator|academic board", re.I)


def clean(s: str) -> str:
    s = unicodedata.normalize("NFC", s)
    return re.sub(r"\s+", " ", s).strip()


def docx_lines(path: Path):
    from docx import Document
    doc = Document(str(path))
    out = []
    for p in doc.paragraphs:
        t = clean(p.text)
        if not t:
            continue
        style = (p.style.name or "").lower() if p.style else ""
        is_list = "list" in style or (p._p.pPr is not None and p._p.pPr.numPr is not None)
        out.append((t, is_list, style.startswith("heading") or style == "title"))
    return out


def pdf_lines(path: Path):
    from pypdf import PdfReader
    r = PdfReader(str(path))
    out = []
    for page in r.pages:
        text = page.extract_text() or ""
        for chunk in re.split(r"[●•▪‣·]|\n", text):
            t = clean(chunk)
            if t:
                out.append((t, True, False))  # pdf: treat split chunks as list-ish lines
    return out


def parse_date_from(name: str, lines) -> str:
    pats = [r"last updated[:\s]*([\d]{1,2}[._/-][\d]{1,2}[._/-][\d]{2,4})", r"([\d]{1,2}[._/-][\d]{1,2}[._/-][\d]{4})"]
    hay = name.lower()
    for pat in pats:
        m = re.search(pat, hay)
        if m:
            return norm_date(m.group(1))
    for (t, _l, _h) in lines[:40]:
        m = re.search(pats[0], t.lower())
        if m:
            return norm_date(m.group(1))
    return ""


def norm_date(s: str) -> str:
    parts = re.split(r"[._/-]", s)
    if len(parts) != 3:
        return ""
    d, m, y = parts
    if len(y) == 2:
        y = "20" + y
    try:
        return date(int(y), int(m), int(d)).isoformat()
    except ValueError:
        return ""


def section_slices(lines):
    """Return dict of landmark -> (start_index, end_index) using text landmarks."""
    idx = {}
    landmarks = [
        ("summary_data", re.compile(r"^personal data we process$", re.I)),
        ("summary_purposes", re.compile(r"^purposes of the processing$", re.I)),
        ("summary_rights", re.compile(r"^your rights$", re.I)),
        ("about", re.compile(r"^1\s*[-–]\s*about us", re.I)),
        ("applies", re.compile(r"^this policy applies to", re.I)),
        ("collection", re.compile(r"^2\s*[-–]\s*personal data collection", re.I)),
        ("direct", re.compile(r"^direct collection$", re.I)),
        ("indirect", re.compile(r"^indirect collection$", re.I)),
        ("legal", re.compile(r"^3\s*[-–]\s*legal basis", re.I)),
        ("retention", re.compile(r"^4\s*[-–]\s*data retention", re.I)),
        ("transfers", re.compile(r"^5\s*[-–]\s*data transfers", re.I)),
        ("recipients_list", re.compile(r"^types of data recipients", re.I)),
        ("third_country_h", re.compile(r"^third[- ]country and international organisation transfers?$", re.I)),
        ("countries", re.compile(r"these countries include", re.I)),
        ("orgs", re.compile(r"these organisations are", re.I)),
        ("disclosure", re.compile(r"^data disclosure$", re.I)),
        ("security", re.compile(r"^6\s*[-–]\s*data security", re.I)),
    ]
    for i, (t, _l, _h) in enumerate(lines):
        for key, pat in landmarks:
            if key not in idx and pat.search(t):
                idx[key] = i
    return idx


def bullets_between(lines, start, end):
    out = []
    for t, is_list, is_head in lines[start:end]:
        if is_head:
            break
        if is_list or (t.endswith(";") or t.endswith(".")) and len(t) < 400:
            if not re.match(r"^(we |you |our |in particular|specifically|unless|the data|types of|this policy)", t, re.I):
                out.append(t.rstrip(";.").strip())
    return out


def split_category(b: str):
    m = re.match(r"^(.*?)\s*\((.*)\)\s*$", b)
    label, items = (m.group(1), m.group(2)) if m else (b, "")
    label_l = label.lower()
    for cid, keys in STD_CATEGORIES:
        if any(k in label_l for k in keys):
            return {"id": cid, "items": items or label}
    return {"custom": label, "items": items}


AUDIENCE_WORDS = r"(participants?|applicants?|coaches|judges|panell?ists?|trainers?|organisers?|providers?|submissions?|national coordinators?|alumni|officers?|former hosts?|facilitators?|academic board|delegates?)"


def name_from_filename(path: Path) -> str:
    stem = re.sub(r"\(last.?updated.*?\)?|\d{2}[._-]\d{2}[._-]\d{2,4}", "", path.stem, flags=re.I)
    stem = stem.replace("_", " ").replace("(", " ").replace(")", " ")
    stem = re.sub(r"\.docx|\bamended\b|\bdraft\b", "", stem, flags=re.I)
    stem = re.sub(r"\b\d{2}-\d{2}\b", "", stem).strip(" -–.")
    stem = re.sub(r"^\d+\.?\d*\s*", "", stem)
    # "Privacy Policy - Coaches | Helga Pedersen MCC" style
    m = re.match(r"privacy policy\s*[-–]?\s*" + AUDIENCE_WORDS + r"\s+(.+)$", clean(stem), flags=re.I)
    if m:
        return clean(f"{m.group(2)} — {m.group(1).title()}")
    stem = re.sub(r"^(old )?privacy policy( for\b| the\b|[-–\s])*", "", clean(stem), flags=re.I)
    return clean(stem.strip(" -–."))


def parse_policy(path: Path, root: Path):
    lines = docx_lines(path) if path.suffix.lower() == ".docx" else pdf_lines(path)
    if not lines:
        return None
    text_all = " ".join(t for t, _l, _h in lines).lower()
    if "privacy policy" not in text_all[:2000]:
        return None
    # Legacy pre-Annex-4 template ("What data do we collect?") — not usable as a
    # preset: its structure predates the Handbook Ch. 4.2 mapping. Skip with log.
    if "what data do we collect" in text_all:
        print(f"LEGACY (skipped, pre-Annex-4 template): {path.name}")
        return None
    idx = section_slices(lines)

    # ---- event name: prefer the filename (it encodes the audience), fall back to the title
    name = name_from_filename(path)
    if not name or len(name) < 3:
        title = next((t for t, _l, _h in lines[:8] if re.search(r"privacy policy", t, re.I)), path.stem)
        name = re.sub(r"privacy policy( for| -| –|:)?", "", title, flags=re.I)
        name = clean(name.replace("_", " ").strip(" -–:"))
    name = re.sub(r"\(last updated.*?\)", "", name, flags=re.I).strip(" -–.")

    # ---- summary data categories
    cats, custom_cats = [], []
    if "summary_data" in idx and "summary_purposes" in idx:
        for b in bullets_between(lines, idx["summary_data"] + 1, idx["summary_purposes"]):
            c = split_category(b)
            if "id" in c:
                if c["id"] not in [x["id"] for x in cats]:
                    cats.append(c)
            elif c["custom"] and len(c["custom"]) < 80:
                custom_cats.append({"label": c["custom"], "items": c["items"]})

    # ---- purposes per basis from §3
    purposes = []
    if "legal" in idx:
        end = idx.get("retention", idx.get("transfers", len(lines)))
        current = None
        for t, is_list, _h in lines[idx["legal"]: end]:
            matched = None
            for basis, pat in BASIS_HEADS:
                if pat.search(t):
                    matched = basis
                    break
            if matched:
                current = matched
                continue
            if current and (is_list or t.startswith("To ") or t.startswith("to ")) and 5 < len(t) < 300:
                if re.match(r"^(you may|the withdrawal|in particular|we |where you)", t, re.I):
                    continue
                purposes.append({"text": t.rstrip(";.").strip(), "basis": current})

    # ---- data subjects: scan the whole About-us region for "personal data of X"
    subjects = []
    scan_end = idx.get("collection", min(len(lines), 80))
    for t, _l, _h in lines[idx.get("about", 0):scan_end]:
        for m in re.finditer(r"(?:the )?processing of personal data of\s*\[?([^;.\]]{3,70})\]?", t, re.I):
            s = clean(m.group(1)).strip(" [];.")
            if s and s.lower() not in [x.lower() for x in subjects]:
                subjects.append(s)

    # ---- recipients
    recipients = []
    if "recipients_list" in idx:
        stop = idx.get("third_country_h", idx.get("disclosure", idx.get("security", len(lines))))
        recipients = bullets_between(lines, idx["recipients_list"] + 1, stop)

    # ---- transfers
    tc = "third_country_h" in idx
    countries, orgs = [], []
    if "countries" in idx:
        countries = bullets_between(lines, idx["countries"] + 1, idx["countries"] + 8)[:6]
        countries = [c for c in countries if len(c) < 60 and not c.lower().startswith("in cases")]
    if "orgs" in idx:
        orgs = bullets_between(lines, idx["orgs"] + 1, idx["orgs"] + 6)[:4]
        orgs = [o for o in orgs if len(o) < 80 and not o.lower().startswith("in cases")]
    # International organisations are not countries — reclassify anything that
    # slipped into the countries list (e.g. "European Youth Foundation").
    IO_RE = re.compile(r"foundation|organisation|organization|council of europe|united nations|\bun\b|world trade|committee|institute|association|european youth", re.I)
    for c in list(countries):
        if IO_RE.search(c):
            countries.remove(c)
            if c not in orgs:
                orgs.append(c)

    # ---- sources
    direct, indirect = [], []
    if "direct" in idx:
        direct = bullets_between(lines, idx["direct"] + 1, idx.get("indirect", idx["direct"] + 8))
    if "indirect" in idx:
        indirect = bullets_between(lines, idx["indirect"] + 1, idx.get("legal", idx["indirect"] + 6))

    # ---- controller
    controller = {"name": "International", "address": "239 Boulevard Général Jacques, 1050 Ixelles, Brussels, Belgium", "email": "", "phone": ""}
    for t, _l, _h in lines[:60]:
        m = re.search(r"\(ELSA\)\s+([A-ZÀ-Ž][\w’' -]{2,40})[,:]", t)
        if m and "located" not in m.group(1).lower():
            controller["name"] = clean(m.group(1))
        m = re.search(r"address:\s*(.+)", t, re.I)
        if m:
            controller["address"] = clean(m.group(1))
        m = re.search(r"e-?mail:\s*([\w.+-]+@[\w.-]+)", t, re.I)
        if m and not controller["email"]:
            controller["email"] = m.group(1)
        m = re.search(r"phone:\s*(\+?[\d\s()./-]{7,20})", t, re.I)
        if m:
            controller["phone"] = clean(m.group(1))
    if not controller["email"]:
        controller["email"] = "secgen@elsa.org"

    audience = "volunteers" if VOLUNTEER_AUDIENCE.search(name) else "participants"

    rel = path.relative_to(root)
    top = rel.parts[0].lower() if len(rel.parts) > 1 else ""
    area = AREA_BY_FOLDER.get(top) or infer_area(name)

    return {
        "file": str(rel),
        "name": name,
        "area": area,
        "lastUpdated": parse_date_from(path.name, lines),
        "rank": folder_rank(path, root),
        "audience": audience,
        "controller": controller,
        "subjects": subjects,
        "categories": cats,
        "customCategories": custom_cats,
        "purposes": purposes,
        "recipients": recipients,
        "transfersOutsideEEA": tc,
        "thirdCountries": countries,
        "internationalOrgs": orgs,
        "directSources": direct,
        "indirectSources": indirect,
    }


def infer_area(name: str) -> str:
    n = name.lower()
    if any(k in n for k in ["moot court", "jhjmcc", "helga pedersen", "negotiation"]):
        return "Competitions"
    if any(k in n for k in ["law school", "delegation", "wels", "sels", "webinar", "elsa training", "training weekend"]):
        return "Seminars & Conferences"
    if any(k in n for k in ["traineeship", "career launch", "step"]):
        return "Professional Development"
    if any(k in n for k in ["role", "rule of law", "ahrc", "human rights", "law review", "essay", "lexisnexis"]):
        return "Academic Activities"
    if any(k in n for k in ["lecercle", "bee academy", "anniversary", "partners"]):
        return "BEE"
    if any(k in n for k in ["edf"]):
        return "FM"
    return "IM"


def norm_event_key(name: str) -> str:
    n = name.lower()
    aud = re.search(AUDIENCE_WORDS, n)
    n = re.sub(r"\b(19|20)\d{2}([./-]\d{2})?\b", "", n)          # years
    n = re.sub(r"\b\d{1,2}(st|nd|rd|th)\b", "", n)               # editions
    n = re.sub(r"\b(icms?|ncms?|isms?)\s*[a-zà-ž]*\b", lambda m: m.group(0)[:3], n)  # host cities & plurals
    n = re.sub(r"[^a-z&]+", " ", n)
    words = sorted(set(clean(n).split()) - {"the", "of", "elsa", "s", "for"})  # order-independent
    # distinct audiences (participants vs coaches vs judges…) are distinct events
    return " ".join(words) + ("|" + aud.group(1) if aud else "")


def main():
    root = Path(sys.argv[1])
    results = []
    for path in sorted(root.rglob("*")):
        if path.suffix.lower() not in (".docx", ".pdf") or path.name.startswith("~$"):
            continue
        if path.suffix.lower() == ".pdf" and path.with_suffix(".docx").exists():
            continue  # prefer the docx twin
        if "list of traineeship providers" in path.name.lower():
            continue  # annex, not a policy
        try:
            p = parse_policy(path, root)
            if p is None:
                continue
            if not p["categories"] and not p["purposes"]:
                print(f"EMPTY (skipped, no data extracted — review manually): {path.name}")
                continue
            results.append(p)
        except Exception as e:
            print(f"SKIP {path.name}: {e}")

    # newest version per event
    by_event = {}
    for p in results:
        key = norm_event_key(p["name"])
        cur = by_event.get(key)
        score = (p["lastUpdated"] or "0000", p["rank"])
        if cur is None or score > (cur["lastUpdated"] or "0000", cur["rank"]):
            by_event[key] = p

    # final guard: never show two entries with the identical display name + date
    seen_display = set()
    unique = []
    for p in sorted(by_event.values(), key=lambda p: (p["area"], p["name"])):
        disp = (p["name"].lower(), p["lastUpdated"])
        if disp in seen_display:
            print(f"DUPLICATE display name dropped: {p['name']} ({p['lastUpdated']}) from {p['file']}")
            continue
        seen_display.add(disp)
        unique.append(p)
    presets = unique
    out = Path(__file__).resolve().parent.parent / "src" / "data" / "presets.generated.json"
    out.write_text(json.dumps(presets, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{len(results)} policies parsed → {len(presets)} unique events → {out}")
    for p in presets:
        print(f"  [{p['area']}] {p['name']}  ({p['lastUpdated'] or 'no date'})  "
              f"cats={len(p['categories'])+len(p['customCategories'])} purp={len(p['purposes'])} rec={len(p['recipients'])}")


if __name__ == "__main__":
    main()
