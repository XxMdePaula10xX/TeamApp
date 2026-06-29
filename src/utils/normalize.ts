/**
 * Normalização de texto para busca por prefixo (PRD §6).
 *
 * `normalizedName` é gravado no doc do time em lowercase e sem acento,
 * permitindo `where('normalizedName', '>=', termo)` +
 * `where('normalizedName', '<=', termo + PREFIX_HIGH)`.
 */

// Faixa Unicode dos diacríticos combinantes (U+0300–U+036F).
const COMBINING_MARKS = /[̀-ͯ]/g

/** Remove acentos, baixa a caixa e colapsa espaços. */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Caractere alto do Unicode (U+F8FF) usado como limite superior em
 * buscas por prefixo no Firestore.
 */
export const PREFIX_HIGH = ''
