const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const buildHeaders = (token, customHeaders = {}) => {
  const headers = { ...customHeaders }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const parseJsonSafely = async (response) => {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options
  })

  const data = await parseJsonSafely(response)
  if (!response.ok || data.success === false) {
    const message = data.message || 'Une erreur est survenue.'
    throw new Error(message)
  }

  return data
}

export const authApi = {
  async register(payload) {
    return request('/auth/register', {
      method: 'POST',
      headers: buildHeaders(null, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
  },

  async login(payload) {
    return request('/auth/login', {
      method: 'POST',
      headers: buildHeaders(null, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
  },

  async verify(token) {
    return request('/auth/verify', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  }
}

export const subscriptionApi = {
  async getPlans() {
    return request('/subscriptions/plans', {
      method: 'GET'
    })
  },

  async getCurrent(token) {
    return request('/subscriptions/current', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async createCheckoutSession(token, payload) {
    return request('/subscriptions/checkout-session', {
      method: 'POST',
      headers: buildHeaders(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
  },

  async cancel(token) {
    return request('/subscriptions/cancel', {
      method: 'POST',
      headers: buildHeaders(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({})
    })
  }
}

export { API_BASE_URL }
