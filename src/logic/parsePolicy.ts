/**
 * Structural parser for an UPLOADED previous privacy policy (new event → step 1,
 * upload under A). ELSA policies follow the same Annex 4 framework, so the
 * variable details are copied 1-on-1 into step 2 — exactly like choosing a
 * previous event (user request 2026-07-12): purposes verbatim (unmatched ones
 * become "Added / new purposes"), categories ticked with their literal items
 * (unmatched wording becomes an added custom category), subjects, recipients,
 * sources and transfers.
 *
 * Mirrors scripts/build-presets.py `parse_policy`. Returns null when the text is
 * not recognisably an Annex 4-style policy; the keyword analyser then remains the
 * only (suggest-only) signal.
 */

import type { GeneratedPreset } from '../data/presets';

const clean = (s: string): string => s.normalize('NFC').replace(/\s+/g, ' ').trim();

/**
 * One logical line per paragraph/bullet. The PDF extractor (extractFiles.ts) has
 * already reflowed wrapped visual lines using the page geometry, and mammoth gives
 * one paragraph per line for DOCX — so here we only split on newlines, clean, strip
 * a leftover leading bullet glyph, and drop page furniture (running titles, page
 * numbers, the repeated contact footer).
 */
function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((t) => clean(t).replace(/^[•●▪‣·]\s*/, ''))
    .filter((t) => t
      && !/^privacy policy [-–]/i.test(t)
      && !/^\d{1,3}$/.test(t)
      && !(/e-?mail:/i.test(t) && /tel\.?:/i.test(t)));
}

const LANDMARKS: [string, RegExp][] = [
  ['summary_data', /^personal data we process$/i],
  ['summary_purposes', /^purposes of the processing$/i],
  ['summary_rights', /^your rights$/i],
  ['about', /^1\s*[-–]\s*about us/i],
  ['applies', /^this policy applies to/i],
  ['collection', /^2\s*[-–]\s*personal data collection/i],
  ['direct', /^direct collection$/i],
  ['indirect', /^indirect collection$/i],
  ['legal', /^3\s*[-–]\s*legal basis/i],
  ['retention', /^4\s*[-–]\s*data retention/i],
  ['transfers', /^5\s*[-–]\s*data transfers/i],
  ['recipients_list', /^types of data recipients/i],
  ['third_country_h', /^third[- ]country and international organisation transfers?/i],
  ['countries', /these countries include/i],
  ['orgs', /these organisations are/i],
  ['disclosure', /^data disclosure$/i],
  ['security', /^6\s*[-–]\s*data security/i],
];

/**
 * Landmark -> line index. The LAST occurrence wins: policies with a table of
 * contents list the same headings once in the TOC and once for real.
 */
function sectionSlices(lines: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  lines.forEach((t, i) => {
    for (const [key, pat] of LANDMARKS) if (pat.test(t)) idx[key] = i;
  });
  return idx;
}

/** Raw lines in a range, minus obvious furniture/boilerplate — before reflow. */
function rangeLines(lines: string[], start: number, end: number): string[] {
  return lines.slice(Math.max(0, start), Math.min(end, lines.length))
    .filter((t) => t.length < 400
      && !/^(in particular|specifically|unless|the data controller|types of|this policy applies)/i.test(t)
      && !/e-?mail:|^address:|^phone:/i.test(t));
}

/** Variable list items in a range — template/boilerplate sentences filtered out. */
function bulletsBetween(lines: string[], start: number, end: number): string[] {
  const out: string[] = [];
  for (const t of rangeLines(lines, start, end)) {
    if (/^(we |you |our )/i.test(t)) continue;
    const v = t.replace(/[;.]+$/, '').trim();
    if (v) out.push(v);
  }
  return out;
}

/**
 * Reflow wrapped category lines: a summary category is "Label (items)" whose
 * parentheses may span several wrapped visual lines. Join lines until the
 * parentheses balance, so each category ends up on one logical line.
 */
function reflowByParens(items: string[]): string[] {
  const out: string[] = [];
  let buf = '';
  for (const line of items) {
    buf = buf ? `${buf} ${line}` : line;
    const opens = (buf.match(/\(/g) ?? []).length;
    const closes = (buf.match(/\)/g) ?? []).length;
    if (opens === 0 || opens <= closes) { out.push(buf.trim()); buf = ''; }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/**
 * Imperative verbs an ELSA purpose can start with WITHOUT a "To " prefix (i.e. bare
 * table cells like "Record and use…", "Notify you…"). "To …" bullets are recognised
 * separately, so this list only needs the bare-verb forms actually seen in policies.
 */
const VERB_WORDS = new Set([
  'record', 'identify', 'communicate', 'assess', 'keep', 'maintain', 'comply', 'notify', 'establish',
  'provide', 'organise', 'organize', 'manage', 'process', 'contact', 'publish', 'send', 'share', 'transfer',
  'register', 'collect', 'handle', 'use', 'ensure', 'facilitate', 'verify', 'store', 'analyse', 'analyze',
  'improve', 'respond', 'monitor', 'evaluate', 'coordinate', 'promote', 'distribute', 'arrange', 'deliver',
  'support', 'enable', 'inform', 'create', 'develop', 'conduct', 'review', 'report', 'update', 'track',
  'allow', 'grant', 'issue', 'prepare', 'receive', 'obtain', 'protect', 'prevent', 'detect', 'carry',
  'fulfil', 'fulfill', 'meet', 'administer', 'run', 'host', 'award', 'select', 'assign',
  'participate', 'answer', 'photograph', 'gather', 'apply', 'attend', 'cover', 'feature', 'post', 'take',
]);

/** A "To …" bullet (capital T) — the infinitive form used for most ELSA purposes. */
function toPrefixed(line: string): boolean {
  return /^To\s+\S/.test(line.trim());
}

/** A bare imperative-verb start ("Record …", "Notify …") — must be capitalised. */
function verbStart(line: string): boolean {
  const m = /^([A-Z][a-z]+)/.exec(line.trim());
  return !!m && VERB_WORDS.has(m[1].toLowerCase());
}

/**
 * Does this line begin a NEW purpose (vs. continue the previous one)? True when it
 * is a "To …" bullet, a capitalised imperative verb, or the previous purpose already
 * ended in terminal punctuation (";" / "."). This handles both prose §3 (one bullet
 * per paragraph, e.g. "To share these photos…") and wrapped PDF tables (a purpose
 * spread over several visual lines that carry no terminal punctuation).
 */
function isPurposeStart(line: string, prevText: string | undefined): boolean {
  if (toPrefixed(line) || verbStart(line)) return true;
  if (prevText !== undefined && /[;.]$/.test(prevText)) return true;
  return false;
}

function reflowVerbBullets(items: string[]): string[] {
  const out: string[] = [];
  for (const line of items) {
    const prev = out[out.length - 1];
    if (prev !== undefined && !isPurposeStart(line, prev)) out[out.length - 1] = `${prev} ${line}`;
    else out.push(line);
  }
  return out.map((s) => s.trim());
}

/** Mirrors STD_CATEGORIES in build-presets.py — label phrases -> standard category ids. */
const STD_CATEGORIES: [string, string[]][] = [
  ['personal-identification', ['personal identification']],
  ['contact-information', ['contact information', 'contact detail']],
  ['billing-contribution', ['billing', 'contribution']],
  ['financial-information', ['financial']],
  ['elsa-activity', ['elsa activity', 'elsa affiliation', 'elsa career', 'elsa background']],
  ['emergency-contact', ['emergency contact']],
  ['professional-educational', ['professional and educational', 'professional details', 'educational details', 'professional & educational']],
  ['application-process', ['application process', 'application details', 'application data']],
  ['meal-details', ['meal details', 'meal preferences']],
  ['health-data', ['health data', 'dietary']],
  ['transfer-details', ['transfer details', 'travel details', 'travel data']],
  ['accommodation-details', ['accommodation']],
  ['additional-services', ['additional services']],
  ['event-activity', ['event activity']],
  ['photos-recordings', ['photograph', 'recording', 'image', 'photo']],
  ['communication-data', ['communication data']],
  ['religious-beliefs', ['religious']],
  ['political-opinions', ['political']],
  ['trade-union', ['trade union']],
];

function splitCategory(b: string): { id?: string; custom?: string; items: string } {
  const m = /^(.*?)\s*\((.*)\)\s*$/.exec(b);
  let [label, items] = m ? [m[1], m[2]] : [b, ''];
  // Some policies double the label inside the parentheses:
  // "Contact information (Contact information (e-mail address...))". Unwrap it.
  const dup = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\((.*)\\)$`, 'i');
  const dm = dup.exec(items.trim());
  if (dm) items = dm[1];
  const l = label.toLowerCase();
  for (const [cid, keys] of STD_CATEGORIES) {
    if (keys.some((k) => l.includes(k))) return { id: cid, items: items.trim() };
  }
  return { custom: label, items: items.trim() };
}

/**
 * Detect the legal-basis of a §3 line — prose header ("Consent: We may rely…"),
 * full table label ("Legitimate Interests"), or the first word of a wrapped table
 * label ("Legitimate" / "Legal" / "Contractual"). Returns null for the "Legal basis
 * | Purposes" header row and for anything that isn't a basis.
 */
function basisLabel(line: string): string | null {
  const l = line.toLowerCase().trim();
  if (/^legal basis\b/.test(l)) return null; // "Legal basis   Purposes" header
  const m = /^(contractual obligations?|consent|legitimate interests?|legal (?:compliance|obligations?))\b/.exec(l);
  if (m) {
    if (m[1].startsWith('contractual')) return 'contract';
    if (m[1].startsWith('consent')) return 'consent';
    if (m[1].startsWith('legitimate')) return 'legitimateInterest';
    return 'legalObligation';
  }
  // Wrapped table label: first word only on its own short line
  if (l === 'legitimate') return 'legitimateInterest';
  if (l === 'legal') return 'legalObligation';
  if (l === 'contractual') return 'contract';
  return null;
}

/** Post-table LeCercle paragraphs / prose that must end purpose collection in §3. */
const S3_STOP = /^(you may|you have|the withdrawal|please note|for more|we will|we may withdraw|if you)/i;

/**
 * Parse the §3 "Legal Basis and Purposes" section into {text, basis} pairs, reading
 * the basis 1-on-1 from the uploaded document (user request 2026-07-12). Handles both
 * layouts:
 *  - PROSE (DOCX): the lead-in is on the basis-label paragraph itself, which ends
 *    with ":" ("Contractual Obligations: We … obligations:"), and each purpose is its
 *    own paragraph ("To participate…;", "To share these photos…;").
 *  - TABLE (PDF): pdf.js emits the cell contents in order — a bare basis label
 *    ("Consent"), then a separate lead-in block ("We … to:"), then the purposes wrapped
 *    across visual lines.
 * So: when the label line ends in ":" collect immediately; otherwise skip the lead-in
 * block until the first purpose. A line starts a new purpose per isPurposeStart().
 */
function parseLegalBasisTable(lines: string[], start: number, end: number): { text: string; basis: string }[] {
  const res: { text: string; basis: string }[] = [];
  let current: string | null = null;
  let collecting = false;
  for (const raw of lines.slice(start, Math.min(end, lines.length))) {
    const line = raw.trim();
    if (!line) continue;
    const b = basisLabel(line);
    if (b) { current = b; collecting = /:\s*$/.test(line); continue; } // prose lead-in ends ":" → purposes follow
    if (!current) continue;
    if (S3_STOP.test(line)) { current = null; collecting = false; continue; } // end of table
    if (!collecting) {
      if (!(toPrefixed(line) || verbStart(line))) continue; // skip label remainder + lead-in prose
      collecting = true;
    }
    const prev = res[res.length - 1];
    if (prev && prev.basis === current && !isPurposeStart(line, prev.text)) {
      prev.text = `${prev.text} ${line}`;
    } else {
      res.push({ text: line, basis: current });
    }
  }
  return res.map((p) => ({ text: p.text.replace(/[;.]+$/, '').trim(), basis: p.basis }));
}

/**
 * Best-effort legal basis for a purpose taken from the Summary list (which has no
 * basis column). The officer confirms/edits the basis per purpose in step 2, so a
 * reasonable guess is enough. Consent-specific signals are checked first.
 */
function guessBasis(text: string): string {
  const t = text.toLowerCase();
  if (/pronoun|dietary|allerg|\bphoto|image|recording|voluntar(y|ily)|newsletter|marketing|invitation link|group chat/.test(t)) return 'consent';
  if (/compl(y|iance)|legal|tax|accounting|regulatory|\bclaims\b|changes to (this|our) privacy/.test(t)) return 'legalObligation';
  if (/improve|records|maintain|assess|internal|quality|coordinate|previous experience|human resources|optimi[sz]|secure|statistic/.test(t)) return 'legitimateInterest';
  return 'contract';
}

function nameFromFilename(filename: string): string {
  let stem = filename.replace(/\.(pdf|docx|txt|md)$/i, '');
  stem = stem.replace(/\(last.?updated.*?\)?|\d{2}[._-]\d{2}[._-]\d{2,4}/gi, '');
  stem = stem.replace(/_/g, ' ').replace(/[()]/g, ' ');
  stem = stem.replace(/\bamended\b|\bdraft\b|\bspecification form\b/gi, '');
  stem = stem.replace(/\b\d{2}-\d{2}\b/g, '').replace(/^[\s\-–.]+|[\s\-–.]+$/g, '');
  stem = stem.replace(/^\d+\.?\d*\s*/, '');
  stem = clean(stem).replace(/^(old )?privacy policy( for\b| the\b|[-–\s])*/i, '');
  return clean(stem).replace(/^[\s\-–.:]+|[\s\-–.:]+$/g, '');
}

function parseDate(filename: string, lines: string[]): string {
  const pat = /last updated[:\s]*([\d]{1,2}[._/-][\d]{1,2}[._/-][\d]{2,4})/i;
  const hays = [filename, ...lines.slice(0, 40)];
  for (const hay of hays) {
    const m = pat.exec(hay) ?? (hay === filename ? /([\d]{1,2}[._/-][\d]{1,2}[._/-][\d]{4})/.exec(hay) : null);
    if (m) {
      const parts = m[1].split(/[._/-]/);
      if (parts.length === 3) {
        const [d, mo, yRaw] = parts;
        const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
        const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
        if (!Number.isNaN(Date.parse(iso))) return iso;
      }
    }
  }
  return '';
}

export function parseUploadedPolicy(text: string, filename: string): GeneratedPreset | null {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  const all = lines.join(' ').toLowerCase();
  if (!all.slice(0, 3000).includes('privacy policy')) return null;
  // Legacy pre-Annex-4 template — its structure predates the Handbook Ch. 4.2 mapping
  if (all.includes('what data do we collect')) return null;

  const idx = sectionSlices(lines);
  const anchors = ['legal', 'applies', 'summary_data', 'summary_purposes', 'collection', 'transfers'].filter((k) => k in idx);
  if (anchors.length < 2) return null; // not recognisably the Annex 4 framework

  // ---- event name: the filename encodes it; fall back to the title line
  let name = nameFromFilename(filename);
  if (!name || name.length < 3) {
    const title = lines.slice(0, 8).find((t) => /privacy policy/i.test(t)) ?? '';
    name = clean(title.replace(/privacy policy( for| -| –|:)?/i, '').replace(/[–-]\s*/, ''));
  }
  if (!name || name.length < 3) return null;

  // ---- summary data categories (literal copy of label + items)
  const categories: { id: string; items: string }[] = [];
  const customCategories: { label: string; items: string }[] = [];
  if ('summary_data' in idx && 'summary_purposes' in idx) {
    const raw = rangeLines(lines, idx['summary_data'] + 1, idx['summary_purposes']);
    for (const b of reflowByParens(raw)) {
      const c = splitCategory(b);
      if (c.id) {
        if (!categories.some((x) => x.id === c.id)) categories.push({ id: c.id, items: c.items });
      } else if (c.custom && c.custom.length >= 3 && c.custom.length < 80) {
        customCategories.push({ label: c.custom, items: c.items });
      }
    }
  }

  // ---- purposes: read the §3 "Legal Basis and Purposes" table so each purpose keeps
  // the EXACT legal basis from the uploaded document (user request 2026-07-12). The
  // Summary "Purposes of the Processing" list (basis guessed) is only a fallback for
  // policies whose §3 could not be parsed.
  const purposes: { text: string; basis: string }[] = [];
  const addPurpose = (textIn: string, basis: string) => {
    const v = textIn.replace(/[;.]+$/, '').trim();
    if (v.length > 4 && !purposes.some((p) => p.text.toLowerCase() === v.toLowerCase())) purposes.push({ text: v, basis });
  };
  if ('legal' in idx) {
    const end = idx['retention'] ?? idx['transfers'] ?? lines.length;
    for (const p of parseLegalBasisTable(lines, idx['legal'], end)) addPurpose(p.text, p.basis);
  }
  if (purposes.length === 0 && 'summary_purposes' in idx) {
    const end = idx['summary_rights'] ?? idx['about'] ?? lines.length;
    const raw = rangeLines(lines, idx['summary_purposes'] + 1, end);
    for (const b of reflowVerbBullets(raw)) {
      if (toPrefixed(b) || verbStart(b)) addPurpose(b, guessBasis(b));
    }
  }

  // ---- data subjects: "processing of personal data of X"
  const subjects: string[] = [];
  const scanEnd = idx['collection'] ?? Math.min(lines.length, 80);
  const region = lines.slice(idx['about'] ?? 0, scanEnd);
  const addSubject = (raw: string) => {
    const s = clean(raw)
      .replace(/^[\s[\];.]+|[\s[\];.]+$/g, '')
      .replace(/^and\s+/i, '') // last item is often "; and The processing of…"
      .replace(/^(the )?processing of personal data of\s*/i, ''); // strip the list wrapper
    // Cap raised to 200 so long descriptive subject phrases survive (user report 2026-07-12).
    if (s.length >= 3 && s.length <= 200 && subjects.length < 20
      && !subjects.some((x) => x.toLowerCase() === s.toLowerCase())) subjects.push(s);
  };
  // The data-subjects list usually WRAPS across several lines and is a semicolon-
  // separated list after "This Policy applies to:" / "…aimed at:", or a
  // "The processing of personal data of …; …; …" sentence. Find where it starts,
  // join the wrapped lines into one blob, then split it so every subject is captured
  // (user report 2026-07-12: only the first of five was picked up).
  const introRe = /(?:this (?:privacy )?policy (?:is )?(?:applies to|aimed at|is intended for|is directed (?:at|to)|concerns))\s*:?\s*(.*)$/i;
  let startI = -1; let blob = '';
  for (let i = 0; i < region.length; i++) {
    const m = introRe.exec(region[i]);
    if (m) { startI = i; blob = m[1]; break; }
    if (/processing of personal data of/i.test(region[i])) { startI = i; blob = region[i]; break; }
  }
  if (startI >= 0) {
    for (let j = startI + 1; j < region.length; j++) {
      const t = region[j];
      if (/^\d\s*[-–]/.test(t)) break; // next section heading
      if (/^(you can reach|for certain purposes|unless otherwise|the data processing|we\b|our\b|in particular)/i.test(t)) break;
      blob += ` ${t}`;
      if (/[.]$/.test(t) && !/[;,]$/.test(t)) break; // list ended with a full stop
    }
    // Split rules:
    //  - a ";"-separated list → one subject per item (items may contain " and ");
    //  - a "processing of personal data of <phrase>" with no ";" → a SINGLE descriptive
    //    subject (keep it whole — its internal commas/"and" are part of the phrase, e.g.
    //    "participants, coaches, judges/panellists of the JHJMCC and the HPMCC");
    //  - a pure "aimed at: X, Y and Z" inline list → split on comma / "and".
    const parts = blob.includes(';') ? blob.split(';')
      : /processing of personal data of/i.test(blob) ? [blob]
      : blob.split(/,| and /i);
    for (const part of parts) if (part.trim()) addSubject(part);
  }
  // Whether the data subjects came from the document body (above) — if not, whatever we
  // set below is a calculated guess, and step 2 warns the officer to check it.
  const subjectsFromDoc = subjects.length > 0;
  // ELSA event policies often do NOT enumerate their data subjects in the text — the
  // audience is then encoded in the file name instead ("Privacy Policy - Coaches _ …",
  // "… — Participants"). Derive the subject from there when the body gave nothing, so
  // "Whose data do you process?" is still pre-filled (audit 2026-07-12).
  if (subjects.length === 0) {
    // Normalise separators first — file names use "_" and "-", which block \b matches.
    const m = /\b(participants?|coaches|judges|panell?ists?|trainers?|facilitators?|national coordinators?|coordinators?|officers?|alumni|applicants?|submissions?|providers?|delegates?|speakers?|members?|guests?|representatives?)\b/i
      .exec(filename.replace(/[_\-.]+/g, ' '));
    if (m) {
      const w = m[1].toLowerCase();
      const cap = w.charAt(0).toUpperCase() + w.slice(1);
      subjects.push(cap);
      // The descriptor is the audience, not part of the event title — drop it from the
      // front of the derived name ("Coaches Helga Pedersen…" → "Helga Pedersen…").
      const lead = new RegExp(`^${cap}\\s+`, 'i');
      if (lead.test(name) && name.replace(lead, '').trim().length >= 3) name = name.replace(lead, '').trim();
    }
  }

  // ---- recipients
  let recipients: string[] = [];
  if ('recipients_list' in idx) {
    const stop = idx['third_country_h'] ?? idx['disclosure'] ?? idx['security'] ?? lines.length;
    recipients = bulletsBetween(lines, idx['recipients_list'] + 1, stop);
  }

  // ---- transfers
  const transfersOutsideEEA = 'third_country_h' in idx;
  let thirdCountries: string[] = [];
  let internationalOrgs: string[] = [];
  if ('countries' in idx) {
    thirdCountries = bulletsBetween(lines, idx['countries'] + 1, idx['countries'] + 8)
      .slice(0, 6)
      .filter((c) => c.length < 60 && !c.toLowerCase().startsWith('in cases'));
  }
  if ('orgs' in idx) {
    internationalOrgs = bulletsBetween(lines, idx['orgs'] + 1, idx['orgs'] + 6)
      .slice(0, 4)
      .filter((o) => o.length < 80 && !o.toLowerCase().startsWith('in cases'));
  }
  // International organisations are never countries
  const IO_RE = /foundation|organisation|organization|council of europe|united nations|\bun\b|world trade|committee|institute|association|european youth/i;
  for (const c of [...thirdCountries]) {
    if (IO_RE.test(c)) {
      thirdCountries = thirdCountries.filter((x) => x !== c);
      if (!internationalOrgs.includes(c)) internationalOrgs.push(c);
    }
  }

  // ---- sources
  const directSources = 'direct' in idx
    ? bulletsBetween(lines, idx['direct'] + 1, idx['indirect'] ?? idx['direct'] + 8) : [];
  const indirectSources = 'indirect' in idx
    ? bulletsBetween(lines, idx['indirect'] + 1, idx['legal'] ?? idx['indirect'] + 6) : [];

  // ---- controller (no ELSA-International defaults here — an upload can be any group)
  const controller = { name: '', address: '', email: '', phone: '' };
  for (const t of lines.slice(0, 60)) {
    let m = /\(ELSA\)\s+([A-ZÀ-Ž][\w’' -]{2,40})[,:]/.exec(t);
    if (m && !m[1].toLowerCase().includes('located')) controller.name = clean(m[1]);
    m = /address:\s*(.+)/i.exec(t);
    if (m) controller.address = clean(m[1]);
    m = /e-?mail:\s*([\w.+-]+@[\w.-]+\w)/i.exec(t);
    if (m && !controller.email) controller.email = m[1];
    m = /phone:\s*(\+?[\d\s()./-]{7,20})/i.exec(t);
    if (m) controller.phone = clean(m[1]);
  }

  return {
    file: filename,
    name,
    area: 'Uploaded policy',
    lastUpdated: parseDate(filename, lines),
    audience: '', // derived from subjects/purposes by toPresetEvent
    controller,
    subjects,
    categories,
    customCategories,
    purposes,
    recipients,
    transfersOutsideEEA,
    thirdCountries,
    internationalOrgs,
    directSources,
    indirectSources,
    subjectsGuessed: !subjectsFromDoc,
  };
}
