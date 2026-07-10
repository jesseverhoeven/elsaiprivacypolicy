/**
 * Handbook Ch. 5.2 — which data-subject rights apply under which legal basis.
 * Encoded as DATA ONLY for v1 (brief §6): the "Your Rights" section stays verbatim
 * per Annex 4; nothing branches on this yet. A future version can.
 *
 * Extraction note: two rows of the Handbook's PDF table (Erasure / Object) render
 * scrambled in text extraction; this encoding follows the legible marks and the
 * table's two footnotes and should get one glance from dataprotection@elsa.org.
 */

import type { LegalBasis } from '../types';

export type RightKey =
  | 'information' | 'access' | 'rectification' | 'erasure'
  | 'restriction' | 'portability' | 'object' | 'noAutomatedDecision';

export const RIGHTS_MATRIX: Record<RightKey, Record<LegalBasis, boolean | string>> = {
  information: { consent: true, contract: true, legalObligation: true, vitalInterests: true, publicInterest: true, legitimateInterest: true },
  access: { consent: true, contract: true, legalObligation: true, vitalInterests: true, publicInterest: true, legitimateInterest: true },
  rectification: { consent: true, contract: true, legalObligation: true, vitalInterests: true, publicInterest: true, legitimateInterest: true },
  erasure: {
    consent: true, contract: true,
    legalObligation: 'Not applicable — except where erasure itself is required for compliance with a legal obligation',
    vitalInterests: true, publicInterest: 'Not applicable', legitimateInterest: true,
  },
  restriction: { consent: true, contract: true, legalObligation: true, vitalInterests: true, publicInterest: true, legitimateInterest: true },
  portability: { consent: true, contract: true, legalObligation: 'Not applicable', vitalInterests: 'Not applicable', publicInterest: 'Not applicable', legitimateInterest: 'Not applicable' },
  object: {
    consent: 'Not applicable: withdraw consent instead',
    contract: 'Not applicable', legalObligation: 'Not applicable', vitalInterests: 'Not applicable',
    publicInterest: true, legitimateInterest: 'Applies — and at all times for direct marketing',
  },
  noAutomatedDecision: {
    consent: 'Right to a human intervention', contract: 'Right to a human intervention',
    legalObligation: true, vitalInterests: true, publicInterest: true, legitimateInterest: true,
  },
};

/** Footnote: for public-interest processing, the basis must be laid down by Union or Member State law (HB Ch. 5.2). */
export const RIGHTS_MATRIX_FOOTNOTE =
  'Erasure can be requested if the personal data has to be erased for compliance with a legal obligation. ' +
  'For public interest, the basis for processing must be laid down by Union or Member State law.';
