export const GUNN_SPANGENBERG_VENUE = 'Henry M. Gunn High School — Spangenberg Theatre'
export const GUNN_SPANGENBERG_ADDRESS = '780 Arastradero Rd, Palo Alto, CA 94306'

export function normalizeVenueFromCopy(
  venue: string,
  description: string,
): { venue?: string; address?: string } {
  const combined = `${venue} ${description}`.toLowerCase()

  if (/gunn high school/.test(combined) && /spangenberg/.test(combined)) {
    return {
      venue: GUNN_SPANGENBERG_VENUE,
      address: GUNN_SPANGENBERG_ADDRESS,
    }
  }

  if (/spangenberg theater/i.test(venue) && !/gunn/i.test(venue)) {
    return {
      venue: GUNN_SPANGENBERG_VENUE,
      address: GUNN_SPANGENBERG_ADDRESS,
    }
  }

  return {}
}
