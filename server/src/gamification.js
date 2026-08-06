import { prisma } from "./db.js";

export function levelForXp(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

const BADGES = [
  {
    slug: "coffee-explorer",
    check: (stats) => stats.ratedPlaces >= 3,
  },
  {
    slug: "top-reviewer",
    check: (stats) => stats.reviews >= 3,
  },
  {
    slug: "top-contributor",
    check: (stats) => stats.posts >= 3,
  },
  {
    slug: "rising-creator",
    check: (stats) => stats.likesReceived >= 2,
  },
];

export async function recomputeGamification(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return null;

  const [posts, ratings, reviews, likesReceived, placesCreated] = await Promise.all([
    prisma.post.count({ where: { authorId: userId } }),
    prisma.rating.findMany({
      where: { userId },
      select: { placeId: true },
    }),
    prisma.comment.count({ where: { userId } }),
    prisma.postLike.count({ where: { post: { authorId: userId } } }),
    prisma.place.count({ where: { authorId: userId } }),
  ]);

  const stats = {
    posts,
    ratedPlaces: new Set(ratings.map((r) => r.placeId)).size,
    reviews,
    likesReceived,
    placesCreated,
  };

  const xp =
    stats.posts * 10 +
    stats.ratedPlaces * 5 +
    stats.reviews * 5 +
    stats.likesReceived +
    stats.placesCreated * 20;

  const level = levelForXp(xp);

  const badges = await prisma.badge.findMany();

  const earnedSlugs = BADGES.filter((b) => b.check(stats)).map((b) => b.slug);

  for (const badge of badges) {
    const shouldHave = earnedSlugs.includes(badge.slug);
    const has = await prisma.userAchievement.findUnique({
      where: {
        userId_badgeId: { userId, badgeId: badge.id },
      },
      select: { id: true },
    });
    if (shouldHave && !has) {
      await prisma.userAchievement.create({
        data: { userId, badgeId: badge.id },
      });
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: { xp, level },
  });
}
