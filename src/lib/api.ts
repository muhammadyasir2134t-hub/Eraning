const LIVE_BACKEND_URL = 'https://ais-dev-5nzkpaledyax3iiyxzslxu-394997633999.asia-southeast1.run.app';

export function getApiBaseUrl(): string {
  // If explicitly configured in env
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // When running on Netlify or external static domains, route to backend server directly
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('netlify.app') || hostname.includes('github.io') || hostname.includes('vercel.app')) {
      return LIVE_BACKEND_URL;
    }
  }
  return '';
}

export function getFullApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = getApiBaseUrl();
  if (!base) {
    return endpoint;
  }
  return `${base.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = getFullApiUrl(endpoint);

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server returned error (${res.status}): ${res.statusText || 'Request failed'}`);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network connection error. Please verify backend server is reachable.');
    }
    throw err;
  }
}


export function formatCurrency(amount: string | number, currency = 'PKR') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `0.00 ${currency}`;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
