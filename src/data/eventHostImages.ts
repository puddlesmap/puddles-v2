/**
 * Host identity photos for events that lack their own imageUrl.
 *
 * Rules (see `.cursor/rules/event-images.mdc`):
 * 1. Event-specific image first
 * 2. Else this host/org identity photo
 * 3. Never another event’s flyer just because the venue matches
 */
export const EVENT_HOST_IMAGES: Record<string, string> = {
  'Linden Tree Books':
    'https://cdn.shoplightspeed.com/shops/611345/themes/10258/v/1120325/assets/banner-image.png?20260305055717',
  'Sunnyvale Public Library':
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Sunnyvale_Public_Library_%28January_2025%29.jpg',
  'Los Altos Library':
    'https://sccl.bibliocommons.com/events/uploads/images/full/9789d6ae7a5db8da406ba9e1d3837e1e/Early%20Learning%20%26%20Storytime.jpg',
  'Mountain View Public Library':
    'https://d68g328n4ug0e.cloudfront.net/data/feat_img/3989/8800/1738805385.png',
  'Magical Bridge Playground · Fair Oaks Park':
    'https://static.wixstatic.com/media/b287ea_66fff7ceec2e46bf9603d2a4fef94da4~mv2.jpg/v1/fit/w_1548,h_920,q_90/b287ea_66fff7ceec2e46bf9603d2a4fef94da4~mv2.jpg',
  'Magical Bridge Playground':
    'https://static.wixstatic.com/media/b287ea_66fff7ceec2e46bf9603d2a4fef94da4~mv2.jpg/v1/fit/w_1548,h_920,q_90/b287ea_66fff7ceec2e46bf9603d2a4fef94da4~mv2.jpg',
  'Unity Church · Music Together Palo Alto':
    'https://duy554ewuuwzm.cloudfront.net/photos/3/39/DMN_3989/image_vault/190319115534710_1.png',
  'Music Together Palo Alto':
    'https://duy554ewuuwzm.cloudfront.net/photos/3/39/DMN_3989/image_vault/190319115534710_1.png',
  'Downtown Mountain View':
    'https://upload.wikimedia.org/wikipedia/commons/b/b8/Castro_Street_Mountain_View_sidewalk.jpg',
  'Downtown Castro Street':
    'https://upload.wikimedia.org/wikipedia/commons/b/b8/Castro_Street_Mountain_View_sidewalk.jpg',
  'Downtown Los Altos':
    'https://upload.wikimedia.org/wikipedia/commons/2/2f/Los_Altos_Main_Street_2.jpg',
  'Civic Center Plaza':
    'https://upload.wikimedia.org/wikipedia/commons/9/95/City_Hall_of_Mountain_View_-_panoramio_-_Aleh_Haiko_%281%29.jpg',
  'Deer Hollow Farm':
    'https://upload.wikimedia.org/wikipedia/commons/7/73/Meadow_in_Rancho_San_Antonio_County_Park.jpg',
  'Rengstorff Park':
    'https://upload.wikimedia.org/wikipedia/commons/8/87/Rengstorff_House.jpg',
  'Elizabeth F. Gamble Garden':
    'https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg',
  'Gamble Garden':
    'https://www.gamblegarden.org/wp-content/uploads/2018/09/mini-pumpkins-890x890.jpg',
  'Pioneer Park':
    'https://upload.wikimedia.org/wikipedia/commons/3/31/Pioneer_Memorial_Park%2C_Mountain_View%2C_California%2C_July_2019.jpg',
  'Mountain View Center for the Performing Arts':
    'https://upload.wikimedia.org/wikipedia/commons/4/4d/Mountain_View_Center_for_the_Performing_Art_-_panoramio_-_Aleh_Haiko_%281%29.jpg',
}

/** Case-insensitive venue / host alias → canonical EVENT_HOST_IMAGES key */
const EVENT_HOST_IMAGE_ALIASES: Record<string, string> = {
  'linden tree books': 'Linden Tree Books',
  'sunnyvale public library': 'Sunnyvale Public Library',
  'los altos library': 'Los Altos Library',
  'mountain view public library': 'Mountain View Public Library',
  'mountain view library': 'Mountain View Public Library',
  'magical bridge playground · fair oaks park': 'Magical Bridge Playground · Fair Oaks Park',
  'magical bridge playground': 'Magical Bridge Playground',
  'magical bridge': 'Magical Bridge Playground',
  'unity church · music together palo alto': 'Unity Church · Music Together Palo Alto',
  'music together palo alto': 'Music Together Palo Alto',
  'unity church': 'Unity Church · Music Together Palo Alto',
  'downtown mountain view': 'Downtown Mountain View',
  'downtown castro street': 'Downtown Castro Street',
  'downtown los altos': 'Downtown Los Altos',
  'civic center plaza': 'Civic Center Plaza',
  'deer hollow farm': 'Deer Hollow Farm',
  'rengstorff park': 'Rengstorff Park',
  'elizabeth f. gamble garden': 'Elizabeth F. Gamble Garden',
  'gamble garden': 'Gamble Garden',
  'pioneer park': 'Pioneer Park',
  'mountain view center for the performing arts': 'Mountain View Center for the Performing Arts',
  'mvcpa': 'Mountain View Center for the Performing Arts',
}

/** @deprecated Use getEventHostImageUrl */
export function getVenueImageUrl(venue: string | undefined | null): string | null {
  return getEventHostImageUrl(venue)
}

export function getEventHostImageUrl(hostOrVenue: string | undefined | null): string | null {
  const trimmed = String(hostOrVenue ?? '').trim()
  if (!trimmed) return null
  if (EVENT_HOST_IMAGES[trimmed]) return EVENT_HOST_IMAGES[trimmed]
  const canonical = EVENT_HOST_IMAGE_ALIASES[trimmed.toLowerCase()]
  return canonical ? EVENT_HOST_IMAGES[canonical] ?? null : null
}
