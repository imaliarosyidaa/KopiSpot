const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const TOKEN_KEY = "Coffidoor_token";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  bio?: string | null;
  xp?: number;
  level?: number;
  role?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function uploadFile(file: File): Promise<{ url: string }> {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    let message = "Gagal mengunggah gambar.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    if (res.status === 401) clearToken();
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<{ url: string }>;
}

async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = "Terjadi kesalahan.";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore body parse errors
    }
    if (res.status === 401) clearToken();
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string, username?: string) =>
    api<{ token: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, username }),
    }),
  me: () =>
    api<
      AuthUser & {
        places: unknown[];
        orders: unknown[];
        reservations: unknown[];
        role: string;
      }
    >("/auth/me"),
};

export interface PartnerPlace {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  price: string;
  openHours: string;
  imageUrl: string;
  wifi: boolean;
  cozy: boolean;
  tags: string[];
  avgRating: number;
  createdAt: string;
  _count: { orders: number; menuItems: number; ratings: number };
}

export interface PartnerOrder {
  id: string;
  userId: string;
  placeId: string;
  status: OrderStatus;
  total: number;
  note: string | null;
  billingAddress: string | null;
  paymentMethod: string | null;
  paymentProofUrl: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; image: string | null };
  items: {
    id: string;
    quantity: number;
    price: number;
    menuItem: { id: string; name: string; price: number; category: string; imageUrl: string | null };
  }[];
}

export interface PartnerDashboard {
  totalOrders: number;
  totalRevenue: number;
  statusCounts: Record<OrderStatus, number>;
  bestSellers: { menuItemId: string; name: string; quantity: number }[];
  recentOrders: {
    id: string;
    createdAt: string;
    status: OrderStatus;
    total: number;
    user: { id: string; name: string | null; image: string | null };
  }[];
  avgRating: number;
  ratingCount: number;
  recentReviews: {
    id: string;
    body: string;
    createdAt: string;
    user: { id: string; name: string | null; image: string | null };
  }[];
  menuCount: number;
}

export interface PartnerMenuItem {
  id: string;
  placeId: string;
  name: string;
  price: number;
  description: string | null;
  calories: number | null;
  sugar: number | null;
  ingredients: string | null;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
}

export const partnerApi = {
  register: (data: {
    name: string;
    category: string;
    description: string;
    address: string;
    city: string;
    price: string;
    openHours: string;
    imageUrl?: string;
    tags?: string[];
  }) =>
    api<{ place: PartnerPlace; role: string }>("/partner/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  places: () => api<PartnerPlace[]>("/partner/places"),
  dashboard: (placeId: string) => api<PartnerDashboard>(`/partner/dashboard/${placeId}`),
  menus: (placeId: string) => api<PartnerMenuItem[]>(`/partner/places/${placeId}/menus`),
  createMenu: (
    placeId: string,
    data: Partial<{
      name: string;
      price: number;
      category: string;
      description: string;
      calories: number;
      sugar: number;
      ingredients: string;
      imageUrl: string;
      isAvailable: boolean;
    }>
  ) =>
    api<PartnerMenuItem>(`/partner/places/${placeId}/menus`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMenu: (
    placeId: string,
    menuId: string,
    data: Partial<{
      name: string;
      price: number;
      category: string;
      description: string;
      calories: number;
      sugar: number;
      ingredients: string;
      imageUrl: string;
      isAvailable: boolean;
    }>
  ) =>
    api<PartnerMenuItem>(`/partner/places/${placeId}/menus/${menuId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMenu: (placeId: string, menuId: string) =>
    api<{ ok: boolean }>(`/partner/places/${placeId}/menus/${menuId}`, { method: "DELETE" }),
  orders: (placeId: string) => api<PartnerOrder[]>(`/partner/places/${placeId}/orders`),
  setOrderStatus: (placeId: string, orderId: string, status: OrderStatus) =>
    api<PartnerOrder>(`/partner/places/${placeId}/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

export interface PlaceListItem {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  price: string;
  openHours: string;
  imageUrl: string;
  tags: string[];
  wifi: boolean;
  cozy: boolean;
  avgRating: number;
  ratingCount: number;
}

export const placesApi = {
  list: (params?: { category?: string; city?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.city) query.set("city", params.city);
    if (params?.q) query.set("q", params.q);
    const qs = query.toString();
    return api<PlaceListItem[]>(`/places${qs ? `?${qs}` : ""}`);
  },
  detail: (id: string) =>
    api<
      PlaceListItem & {
        createdAt: string;
        author: { id: string; name: string | null };
        comments: {
          id: string;
          body: string;
          userId: string;
          createdAt: string;
          rating: number | null;
          user: { id: string; name: string | null; image: string | null };
        }[];
        menuItems: { id: string; name: string; price: number; category: string }[];
        viewCount: number;
        commentCount: number;
        ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
      }
    >(`/places/${id}`),
  create: (data: Record<string, unknown>) =>
    api("/places", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/places/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) =>
    api<{ ok: boolean }>(`/places/${id}`, { method: "DELETE" }),
  rate: (id: string, value: number, orderId: string) =>
    api(`/places/${id}/rate`, { method: "POST", body: JSON.stringify({ value, orderId }) }),
  comment: (id: string, body: string, rating?: number, orderId?: string) =>
    api<{
      id: string;
      body: string;
      placeId: string;
      userId: string;
      createdAt: string;
      rating: number | null;
      user: { id: string; name: string | null; image: string | null };
    }>(`/places/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body, ...(rating ? { rating } : {}), ...(orderId ? { orderId } : {}) }),
    }),
  deleteComment: (placeId: string, commentId: string) =>
    api<{ ok: boolean }>(`/places/${placeId}/comments/${commentId}`, { method: "DELETE" }),
  view: (id: string) => api(`/places/${id}/view`, { method: "POST" }),
  order: (id: string, items: { menuItemId: string; quantity: number }[]) =>
    api(`/places/${id}/orders`, { method: "POST", body: JSON.stringify({ items }) }),
  reserve: (id: string, data: { date: string; partySize: number; note?: string }) =>
    api(`/places/${id}/reservations`, { method: "POST", body: JSON.stringify(data) }),
};

export interface PostAuthor {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  xp?: number;
  level?: number;
}

export interface PostPlaceRef {
  id: string;
  name: string;
  city: string;
  imageUrl: string;
}

export interface PostItem {
  id: string;
  caption: string;
  category: string;
  tags: string[];
  images: string[];
  placeId: string | null;
  place: PostPlaceRef | null;
  author: PostAuthor;
  createdAt: string;
  updatedAt: string;
  likedByMe: boolean;
  savedByMe: boolean;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
}

export interface PostListResponse {
  data: PostItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PostCommentItem {
  id: string;
  body: string;
  postId: string;
  userId: string;
  createdAt: string;
  user: { id: string; name: string | null; username: string | null; image: string | null };
}

export const postsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    sort?: "latest" | "popular";
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.q) query.set("q", params.q);
    if (params?.category) query.set("category", params.category);
    if (params?.sort) query.set("sort", params.sort);
    const qs = query.toString();
    return api<PostListResponse>(`/posts${qs ? `?${qs}` : ""}`);
  },
  detail: (id: string) =>
    api<
      PostItem & {
        comments: PostCommentItem[];
      }
    >(`/posts/${id}`),
  create: (data: {
    caption: string;
    placeId?: string | null;
    category?: string;
    tags?: string[];
    images?: string[];
  }) => api<PostItem>("/posts", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: Partial<{ caption: string; category: string; placeId: string | null; tags: string[]; images: string[] }>
  ) => api<PostItem>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => api<{ ok: boolean }>(`/posts/${id}`, { method: "DELETE" }),
  like: (id: string) =>
    api<{ liked: boolean; likesCount: number }>(`/posts/${id}/like`, { method: "POST" }),
  save: (id: string) =>
    api<{ saved: boolean; savesCount: number }>(`/posts/${id}/save`, { method: "POST" }),
  comments: (id: string) => api<PostCommentItem[]>(`/posts/${id}/comments`),
  addComment: (id: string, body: string) =>
    api<PostCommentItem>(`/posts/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) }),
  deleteComment: (postId: string, commentId: string) =>
    api<{ ok: boolean }>(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" }),
};

export interface TrendingPlace {
  id: string;
  name: string;
  city: string;
  price: string;
  imageUrl: string;
  tags: string[];
  avgRating?: number;
  viewCount: number;
  ratingCount: number;
}

export interface TopContributor {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  xp: number;
  level: number;
  _count?: { posts: number };
}

export interface LatestReview {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null; username: string | null; image: string | null };
  place: { id: string; name: string; imageUrl: string };
}

export interface FeedRight {
  trendingPlaces: TrendingPlace[];
  topContributors: TopContributor[];
  popularTags: { tag: string; count: number }[];
  latestReviews: LatestReview[];
}

export const feedApi = {
  right: () => api<FeedRight>("/feed/right"),
};

export interface ChatReply {
  reply: string;
  suggestions: string[];
}

export const chatApi = {
  send: (message: string) =>
    api<ChatReply>("/chat", { method: "POST", body: JSON.stringify({ message }) }),
};

export interface Badge {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface ProfileData {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  bio: string | null;
  image: string | null;
  xp: number;
  level: number;
  role: string;
  createdAt: string;
  stats: { posts: number; ratings: number; reviews: number; saved: number };
  badges: Badge[];
  posts: (PostItem & { likesCount: number; commentsCount: number })[];
  savedPosts: { savedAt: string; post: PostItem }[];
  ratings: { id: string; value: number; createdAt: string; place: PlaceListItem }[];
  comments: { id: string; body: string; createdAt: string; place: PlaceListItem }[];
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  xp: number;
  level: number;
  stats: { posts: number; ratings: number; reviews: number };
  badges: Badge[];
}

export const profileApi = {
  me: () => api<ProfileData>("/users/me"),
  update: (data: Partial<{ name: string; username: string; bio: string; image: string }>) =>
    api<{
      id: string;
      name: string | null;
      username: string | null;
      email: string;
      bio: string | null;
      image: string | null;
      xp: number;
      level: number;
    }>("/users/me", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ ok: boolean }>("/users/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  leaderboard: () => api<LeaderboardEntry[]>("/users/leaderboard"),
};

export interface MenuItemOption {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  calories: number | null;
  sugar: number | null;
  ingredients: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  place: { id: string; name: string; city: string; _count: { views: number } };
}

export const menusApi = {
  list: (placeId?: string) => {
    const qs = placeId ? `?placeId=${encodeURIComponent(placeId)}` : "";
    return api<MenuItemOption[]>(`/menus${qs}`);
  },
};

export type OrderStatus = "PENDING" | "PENDING_PAYMENT" | "CONFIRMED" | "PACKED" | "PREPARING" | "READY" | "SHIPPED" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "PAYMENT_FAILED";
export type PaymentStatus = "PENDING" | "UNPAID" | "PAID" | "FAILED";

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem: { id: string; name: string; price: number; category: string; imageUrl: string | null };
}

export interface Order {
  id: string;
  userId: string | null;
  guestToken?: string | null;
  placeId: string;
  status: OrderStatus;
  total: number;
  note: string | null;
  billingAddress: string | null;
  paymentMethod: string | null;
  paymentProofUrl: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  place: { id: string; name: string; city: string; imageUrl: string };
}

export const ordersApi = {
  list: (params?: { guestTokens?: string[] }) => {
    const query = new URLSearchParams()
    if (params?.guestTokens?.length) {
      query.set("guestTokens", params.guestTokens.join(","))
    }
    const qs = query.toString()
    return api<Order[]>(`/orders${qs ? `?${qs}` : ""}`)
  },
  ratedOrderIds: () => api<string[]>("/orders/ratings"),
  detail: (id: string, guestToken?: string) =>
    api<Order>(`/orders/${id}${guestToken ? `?guestToken=${encodeURIComponent(guestToken)}` : ""}`),
  create: (data: {
    placeId: string;
    checkoutSessionId: string;
    items: { menuItemId: string; quantity: number }[];
    note?: string;
    billingAddress?: string;
    couponCode?: string;
    shippingFee?: number;
    guestToken?: string;
  }) => api<Order & { guestToken?: string }>("/orders", { method: "POST", body: JSON.stringify(data) }),
  pay: (id: string, method: string, proofUrl?: string, guestToken?: string) =>
    api<Order>(`/orders/${id}/pay`, {
      method: "PUT",
      body: JSON.stringify({ method, proofUrl: proofUrl ?? null, guestToken }),
    }),
  remove: (id: string) => api<{ ok: boolean }>(`/orders/${id}`, { method: "DELETE" }),
};

export const paymentsApi = {
  syncStatus: (orderId: string, guestToken?: string) =>
    api<{ paymentStatus: PaymentStatus }>(
      `/payments/status/${orderId}${guestToken ? `?guestToken=${encodeURIComponent(guestToken)}` : ""}`,
    ),
  create: (data: {
    orderId: string;
    amount: number;
    guestToken?: string;
    customer?: {
      firstName?: string;
      email?: string;
      phone?: string;
    };
  }) =>
    api<{
      success: boolean;
      orderId: string;
      amount: number;
      token: string;
      redirect_url: string;
      paymentId: string;
    }>("/payments/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export interface ReviewMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string | null;
  avgRating?: number;
  ratingCount?: number;
}

export interface ReviewOrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem: ReviewMenuItem;
}

export interface ReviewOrderRef {
  id: string;
  createdAt: string;
  place: { id: string; name: string };
}

export interface Review {
  id: string;
  userId: string;
  orderId: string;
  orderItemId: string;
  menuItemId: string;
  placeId: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  orderItem: ReviewOrderItem;
  order: ReviewOrderRef;
}

export interface PendingReview {
  orderItem: ReviewOrderItem;
  order: ReviewOrderRef;
}

export const reviewsApi = {
  pending: () => api<PendingReview[]>("/reviews/pending"),
  mine: () => api<Review[]>("/reviews/mine"),
  create: (data: {
    orderItemId: string;
    orderId: string;
    rating: number;
    comment?: string;
    images?: string[];
  }) =>
    api<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    id: string,
    data: { rating?: number; comment?: string; images?: string[] },
  ) =>
    api<Review>(`/reviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  remove: (id: string) => api<{ ok: boolean }>(`/reviews/${id}`, { method: "DELETE" }),
};