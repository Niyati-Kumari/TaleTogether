import type {
  AiAssistAction,
  AiAssistResponse,
  AuthResponse,
  BootstrapData,
  Story,
  StoryDraft,
} from '../types';

const TOKEN_KEY = 'taletogether-token';

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // Check if we're in a Capacitor environment
  const isCapacitor = (window as any).Capacitor?.isNativePlatform();
  if (isCapacitor) {
    // For native apps, use the production server URL
    return 'https://taletogether-production.up.railway.app';
  }
  // For web, use relative URLs (Vite proxy in dev, direct in production)
  return '';
};

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
};

// Convert relative URLs to absolute using the API base URL
const convertRelativeUrls = (data: any): any => {
  if (!API_BASE_URL) return data;

  if (typeof data === 'string') {
    if (data.startsWith('/')) {
      return `${API_BASE_URL}${data}`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(convertRelativeUrls);
  }

  if (data && typeof data === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = convertRelativeUrls(value);
    }
    return result;
  }

  return data;
};

const request = async <T>(input: string, init: RequestInit = {}) => {
  const token = getStoredToken();
  const headers = new Headers(init.headers);

  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${input}`;
  const response = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(payload?.message || 'Request failed.', response.status);
  }

  return convertRelativeUrls(payload) as T;
};

export const api = {
  getBootstrap: () => request<BootstrapData>('/api/bootstrap'),

  register: (payload: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  viewStory: (storyId: string) =>
    request<{ story: Story }>(`/api/stories/${storyId}`),

  updatePreferences: (preferences: string[]) =>
    request<{ preferences: string[] }>('/api/me/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }),

  createStory: (draft: StoryDraft) =>
    request<{ story: Story }>('/api/stories', {
      method: 'POST',
      body: JSON.stringify(draft),
    }),

  toggleLike: (storyId: string) =>
    request<{ liked: boolean }>(`/api/stories/${storyId}/like`, {
      method: 'POST',
    }),

  addComment: (storyId: string, body: string) =>
    request<{ comment: { id: string; storyId: string; authorName: string; body: string; createdAt: string } }>(
      `/api/stories/${storyId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      },
    ),

  toggleFollow: (authorId: string) =>
    request<{ following: boolean }>(`/api/authors/${authorId}/follow`, {
      method: 'POST',
    }),

  uploadCover: async (file: File) => {
    const formData = new FormData();
    formData.append('cover', file);

    const result = await request<{ url: string }>('/api/uploads/cover', {
      method: 'POST',
      body: formData,
    });

    return result.url;
  },

  assistWriting: (payload: { action: AiAssistAction; text: string; genre?: string; title?: string }) =>
    request<AiAssistResponse>('/api/ai/assist', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createRazorpaySubscription: (billingCycle: 'monthly' | 'yearly') =>
    request<{ subscriptionId: string; keyId: string }>('/api/razorpay/subscription', {
      method: 'POST',
      body: JSON.stringify({ billingCycle }),
    }),

  createRazorpayConnectAccount: () =>
    request<{ url?: string; message?: string }>('/api/razorpay/connect', {
      method: 'POST',
    }),
};
