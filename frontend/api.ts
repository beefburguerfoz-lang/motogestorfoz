
// Prioriza variável de ambiente (Vite) e mantém fallback compatível com proxy reverso (/api)
const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('mg_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  
  if (res.status === 401) {
    // Se o token expirar ou for inválido, limpa o acesso
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('mg_token');
      localStorage.removeItem('mg_user');
      window.location.href = '/';
    }
    return null;
  }

  if (!res.ok) {
    if (data.errors && Array.isArray(data.errors)) {
      const messages = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
      throw new Error(messages);
    }
    throw new Error(data.message || 'Erro na comunicação com o servidor');
  }

  return data;
};

export const api = {
  async get(endpoint: string) {
    const res = await fetch(`${API_URL}${endpoint}`, { 
      headers: getHeaders(),
      mode: 'cors'
    });
    return handleResponse(res);
  },

  async post(endpoint: string, data: any) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      mode: 'cors',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async patch(endpoint: string, data: any) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      mode: 'cors',
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async delete(endpoint: string) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
      mode: 'cors'
    });
    return handleResponse(res);
  }
};
