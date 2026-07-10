/**
 * Country → supervisory authority & Art. 8 digital-consent age (brief §13).
 * Authority names are stable public facts; the AGE COLUMN IS INDICATIVE ONLY and
 * must be verified against national sources before being relied on (verified: false
 * until ELSA confirms; getting a child-consent age wrong is a real problem).
 * Used for follow-up ADVICE only — never inserted into the fixed Annex 4 wording,
 * which has no placeholder for it (brief §13 rule).
 */

export interface SupervisoryAuthority {
  iso: string;
  country: string;
  authority: string;
  /** GDPR Art. 8 digital-consent age — indicative, verify before relying on it. */
  art8Age: number;
  verified: boolean;
  sourceUrl?: string;
  note?: string;
  /** Non-EEA separate frameworks (UK GDPR / FADP) — clearly labelled. */
  separateFramework?: string;
}

export const SUPERVISORY_AUTHORITIES: SupervisoryAuthority[] = [
  { iso: 'AT', country: 'Austria', authority: 'Datenschutzbehörde (DSB)', art8Age: 14, verified: false },
  { iso: 'BE', country: 'Belgium', authority: 'Gegevensbeschermingsautoriteit / Autorité de protection des données (APD/GBA)', art8Age: 13, verified: false },
  { iso: 'BG', country: 'Bulgaria', authority: 'Commission for Personal Data Protection (CPDP)', art8Age: 14, verified: false },
  { iso: 'HR', country: 'Croatia', authority: 'Agencija za zaštitu osobnih podataka (AZOP)', art8Age: 16, verified: false },
  { iso: 'CY', country: 'Cyprus', authority: 'Office of the Commissioner for Personal Data Protection', art8Age: 14, verified: false },
  { iso: 'CZ', country: 'Czechia', authority: 'Úřad pro ochranu osobních údajů (ÚOOÚ)', art8Age: 15, verified: false },
  { iso: 'DK', country: 'Denmark', authority: 'Datatilsynet', art8Age: 13, verified: false },
  { iso: 'EE', country: 'Estonia', authority: 'Andmekaitse Inspektsioon (AKI)', art8Age: 13, verified: false },
  { iso: 'FI', country: 'Finland', authority: 'Office of the Data Protection Ombudsman (Tietosuojavaltuutettu)', art8Age: 13, verified: false },
  { iso: 'FR', country: 'France', authority: 'Commission Nationale de l’Informatique et des Libertés (CNIL)', art8Age: 15, verified: false },
  {
    iso: 'DE', country: 'Germany', authority: 'BfDI (federal) — decentralised: 16 Länder authorities also exist', art8Age: 16, verified: false,
    note: 'Germany is decentralised: a federal authority (BfDI) plus 16 state (Land) authorities. Pick the relevant Land authority for your group, or default to the BfDI.',
  },
  { iso: 'GR', country: 'Greece', authority: 'Hellenic Data Protection Authority (HDPA)', art8Age: 15, verified: false },
  { iso: 'HU', country: 'Hungary', authority: 'Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)', art8Age: 16, verified: false },
  { iso: 'IE', country: 'Ireland', authority: 'Data Protection Commission (DPC)', art8Age: 16, verified: false },
  { iso: 'IT', country: 'Italy', authority: 'Garante per la protezione dei dati personali', art8Age: 14, verified: false },
  { iso: 'LV', country: 'Latvia', authority: 'Datu valsts inspekcija (DVI)', art8Age: 13, verified: false },
  { iso: 'LT', country: 'Lithuania', authority: 'Valstybinė duomenų apsaugos inspekcija (VDAI)', art8Age: 14, verified: false },
  { iso: 'LU', country: 'Luxembourg', authority: 'Commission Nationale pour la Protection des Données (CNPD)', art8Age: 16, verified: false },
  { iso: 'MT', country: 'Malta', authority: 'Information and Data Protection Commissioner (IDPC)', art8Age: 13, verified: false },
  { iso: 'NL', country: 'Netherlands', authority: 'Autoriteit Persoonsgegevens (AP)', art8Age: 16, verified: false },
  { iso: 'PL', country: 'Poland', authority: 'Urząd Ochrony Danych Osobowych (UODO)', art8Age: 16, verified: false },
  { iso: 'PT', country: 'Portugal', authority: 'Comissão Nacional de Proteção de Dados (CNPD)', art8Age: 13, verified: false },
  { iso: 'RO', country: 'Romania', authority: 'ANSPDCP', art8Age: 16, verified: false },
  { iso: 'SK', country: 'Slovakia', authority: 'Úrad na ochranu osobných údajov', art8Age: 16, verified: false },
  { iso: 'SI', country: 'Slovenia', authority: 'Informacijski pooblaščenec (IP)', art8Age: 15, verified: false },
  { iso: 'ES', country: 'Spain', authority: 'Agencia Española de Protección de Datos (AEPD)', art8Age: 14, verified: false },
  { iso: 'SE', country: 'Sweden', authority: 'Integritetsskyddsmyndigheten (IMY)', art8Age: 13, verified: false },
  { iso: 'IS', country: 'Iceland (EEA)', authority: 'Persónuvernd', art8Age: 13, verified: false },
  { iso: 'LI', country: 'Liechtenstein (EEA)', authority: 'Datenschutzstelle (DSS)', art8Age: 16, verified: false },
  { iso: 'NO', country: 'Norway (EEA)', authority: 'Datatilsynet', art8Age: 13, verified: false },
  {
    iso: 'GB', country: 'United Kingdom', authority: 'Information Commissioner’s Office (ICO)', art8Age: 13, verified: false,
    separateFramework: 'UK GDPR — separate (non-EEA) framework, not an EEA supervisory authority.',
  },
  {
    iso: 'CH', country: 'Switzerland', authority: 'Federal Data Protection and Information Commissioner (FDPIC)', art8Age: 16, verified: false,
    separateFramework: 'FADP — separate (non-EEA) framework, not an EEA supervisory authority.',
  },
];

export function authorityFor(iso: string): SupervisoryAuthority | undefined {
  return SUPERVISORY_AUTHORITIES.find((a) => a.iso === iso);
}
