const IMG = (id: string) => `https://images.unsplash.com/${id}?w=400&h=400&fit=crop&auto=format`;

const CATEGORY_IMAGES: Record<string, string[]> = {
  coffee: [
    IMG("photo-1509042239860-f550ce710b93"),
    IMG("photo-1495474472287-4d71bcdd2085"),
    IMG("photo-1514432324607-a09d9b4aefdd"),
    IMG("photo-1521302080334-4bebac2763a6"),
    IMG("photo-1461023058943-07fcbe16d735"),
    IMG("photo-1447933601403-0c6688de566e"),
    IMG("photo-1459755486867-b55449bb39ff"),
    IMG("photo-1498804103079-a6351b050096"),
    IMG("photo-1554118811-1e0d58224f24"),
  ],
  "non-coffee": [
    IMG("photo-1544787219-7f47ccb76574"),
    IMG("photo-1556679343-c7306c1976bc"),
    IMG("photo-1595981267035-7b04ca84a82d"),
  ],
  food: [
    IMG("photo-1567620905732-2d1ec7ab7445"),
    IMG("photo-1546069901-ba9599a7e63c"),
    IMG("photo-1555939594-58d7cb561ad1"),
    IMG("photo-1482049016688-2d3e1b311543"),
  ],
  dessert: [
    IMG("photo-1551024506-0bccd828d307"),
    IMG("photo-1563805042-7684c019e1cb"),
    IMG("photo-1578985545062-69928b1d9587"),
    IMG("photo-1551106652-a5bcf4b29ab6"),
  ],
};

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function menuImageUrl(category: string, imageUrl: string | null, seed = ""): string {
  if (imageUrl) return imageUrl;
  const list = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.coffee;
  return list[hashString(seed || category) % list.length];
}
