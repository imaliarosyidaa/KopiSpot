export function parseTags(place) {
  try {
    const parsed = JSON.parse(place.tagsJson || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializePlace(place) {
  const { tagsJson, ...rest } = place;
  return { ...rest, tags: parseTags(place) };
}

export function serializePlaceWithStats(place) {
  const { tagsJson, ratings, ...rest } = place;
  const values = Array.isArray(ratings) ? ratings : [];
  const total = values.reduce((sum, r) => sum + (r.value ?? 0), 0);
  return {
    ...rest,
    tags: parseTags(place),
    avgRating: values.length ? total / values.length : 0,
    ratingCount: values.length,
  };
}
