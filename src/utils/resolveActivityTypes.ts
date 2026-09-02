import type { ActivityType } from '../types/event'
import { ACTIVITY_TYPES } from '../types/event'
import { inferActivityTypesFromText } from './eventImages'

function parseSheetActivityTypes(raw: string): ActivityType[] {
  const parts = String(raw)
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)

  const matched: ActivityType[] = []
  for (const part of parts) {
    const found = ACTIVITY_TYPES.find((type) => type.toLowerCase() === part.toLowerCase())
    if (found && !matched.includes(found)) matched.push(found)
  }
  return matched
}

function normalizeCategoryTags(categoryTags: string[] | string): string[] {
  if (Array.isArray(categoryTags)) return categoryTags
  return String(categoryTags)
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Farm, barn, or pony/animal community gatherings → Festivals & Community. */
function isAnimalCommunityGathering(
  title: string,
  description: string,
  categoryTags: string[],
): boolean {
  const text = `${title} ${description}`.toLowerCase()
  const seasonal = categoryTags.some((tag) => /^seasonal$/i.test(tag))
  const animalOrFarm =
    /\b(farm|barn|livestock|sheep|goats?|chickens?|rabbits?|pigs?|cows?|ponies?|horses?|petting\s+zoo)\b/.test(
      text,
    )
  const halloween = /\b(halloween|spooky|haunted)\b/.test(text)
  const gathering =
    /\b(festival|celebrate|celebration|invite you and your family|annual)\b/.test(text)
  return (
    (seasonal && (animalOrFarm || halloween)) ||
    (animalOrFarm && gathering) ||
    (animalOrFarm && halloween && gathering)
  )
}

/** Merge sheet tags with title/description inference for parent-facing activity types. */
export function resolveActivityTypes(
  sheetTypesRaw: string,
  title: string,
  description: string,
  categoryTags: string[] | string = '',
): ActivityType[] {
  const tags = normalizeCategoryTags(categoryTags)
  const sheetTypes = parseSheetActivityTypes(sheetTypesRaw)
  const combinedRaw = [sheetTypesRaw, ...tags].filter(Boolean).join(', ')

  if (isAnimalCommunityGathering(title, description, tags)) {
    return ['Festivals & Community']
  }

  const onlyOther = sheetTypes.length === 1 && sheetTypes[0] === 'Other'
  const inferred = inferActivityTypesFromText(title, description, combinedRaw)

  if (sheetTypes.length === 0 || onlyOther) {
    return inferred.length > 0 ? inferred : ['Other']
  }

  return sheetTypes
}
