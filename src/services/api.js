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
  },
  async forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    headers: buildHeaders(null, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ email })
  })
},

async resetPassword(token, password) {
  return request('/auth/reset-password', {
    method: 'POST',
    headers: buildHeaders(null, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({
      token,
      password
    })
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
export const userAPI = {
    async getProfile(token) {
    return request('/users/profile', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async updateProfile(token, payload) {
    return request('/users/profile', {
      method: 'PUT',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },
  async getAllUsers(token) {
    return request('/users', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

async updateUser(token, userId, payload) {
  return request(`/users/${userId}`, {
    method: 'PATCH',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(payload)
  })
},

  async updateUserRole(token, userId, role) {
  return request(`/users/${userId}/role`, {
    method: 'PATCH',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ role })
  })
},

async updateUserStatus(token, userId, isActive) {
  return request(`/users/${userId}/status`, {
    method: 'PATCH',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ isActive })
  })
},

async deleteUser(token, userId) {
  return request(`/users/${userId}`, {
    method: 'DELETE',
    headers: buildHeaders(token)
  })
}
}
export const documentAPI = {
  async getAllDocuments(token) {
    return request('/documents?status=approved&limit=100', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async uploadDocument(token, formData) {
  return request('/documents/upload', {
    method: 'POST',
    headers: buildHeaders(token),
    body: formData
  })
},

  async reportDocument(token, documentId, payload) {
  return request(`/documents/${documentId}/report`, {
    method: 'POST',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(payload)
  })
},

  async deleteDocument(token, documentId) {
    return request(`/documents/${documentId}`, {
      method: 'DELETE',
      headers: buildHeaders(token)
    })
  }
}
export const reportAPI = {
  async getAllReports(token) {
    return request('/reports', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async ignoreReport(token, reportId) {
    return request(`/reports/${reportId}/ignore`, {
      method: 'PATCH',
      headers: buildHeaders(token)
    })
  },

  async resolveReport(token, reportId) {
    return request(`/reports/${reportId}/resolve`, {
      method: 'PATCH',
      headers: buildHeaders(token)
    })
  }
}

export const forumAPI = {
  async deleteQuestion(token, questionId) {
  return request(`/forum/questions/${questionId}`, {
    method: 'DELETE',
    headers: buildHeaders(token)
  })
},

async deleteAnswer(token, answerId) {
  return request(`/forum/answers/${answerId}`, {
    method: 'DELETE',
    headers: buildHeaders(token)
  })
},

  async getQuestions(token, program = '') {
  const params = new URLSearchParams({
    limit: '100'
  })

  if (program) {
    params.set('program', program)
  }

  return request(
    `/forum/questions?${params.toString()}`,
    {
      method: 'GET',
      headers: buildHeaders(token)
    }
  )
},

  async createQuestion(token, payload) {
    return request('/forum/questions', {
      method: 'POST',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async updateQuestion(token, questionId, payload) {
  return request(`/forum/questions/${questionId}`, {
    method: 'PUT',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(payload)
  })
},

  async getAnswers(questionId) {
    return request(`/forum/questions/${questionId}/answers?limit=100`, {
      method: 'GET'
    })
  },

  async createAnswer(token, questionId, content) {
    return request(`/forum/questions/${questionId}/answers`, {
      method: 'POST',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ content })
    })
  },

  async voteAnswer(token, answerId, voteType) {
    return request(`/forum/answers/${answerId}/vote`, {
      method: 'POST',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ voteType })
    })
  },

  async markAsSolution(token, answerId) {
    return request(`/forum/answers/${answerId}/mark-solution`, {
      method: 'POST',
      headers: buildHeaders(token)
    })
  },
  async reportContent(token, payload) {
  return request('/reports', {
    method: 'POST',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(payload)
  })
},
}

export const noteAPI = {
  async listNotebooks(token) {
    return request('/notes', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async createNotebook(token, payload) {
    return request('/notes', {
      method: 'POST',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async getNotebook(token, notebookId) {
    return request(`/notes/${notebookId}`, {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async updateNotebook(token, notebookId, payload) {
    return request(`/notes/${notebookId}`, {
      method: 'PUT',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async createPage(token, notebookId, payload) {
    return request(`/notes/${notebookId}/pages`, {
      method: 'POST',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async updatePage(token, notebookId, pageId, payload) {
    return request(
      `/notes/${notebookId}/pages/${pageId}`,
      {
        method: 'PUT',
        headers: buildHeaders(token, {
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(payload)
      }
    )
  },
  async deletePage(token, notebookId, pageId) {
  return request(
    `/notes/${notebookId}/pages/${pageId}`,
    {
      method: 'DELETE',
      headers: buildHeaders(token)
    }
  )

},
async listFolders(token) {
  return request('/notes/folders', {
    method: 'GET',
    headers: buildHeaders(token)
  })
},

async createFolder(token, name) {
  return request('/notes/folders', {
    method: 'POST',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ name })
  })
},

async renameFolder(
  token,
  sourceFolderName,
  targetFolderName
) {
  return request('/notes/folders/rename', {
    method: 'PATCH',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({
      sourceFolderName,
      targetFolderName
    })
  })
},

async deleteFolder(
  token,
  folderName,
  targetFolderName
) {
  return request('/notes/folders', {
    method: 'DELETE',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({
      folderName,
      targetFolderName
    })
  })
},

async setFavorite(token, notebookId, isFavorite) {
  return request(`/notes/${notebookId}/favorite`, {
    method: 'PATCH',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ isFavorite })
  })
},

async setTrash(token, notebookId, isTrashed) {
  return request(`/notes/${notebookId}/trash`, {
    method: 'PATCH',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ isTrashed })
  })
},

async moveToFolder(token, notebookId, folderName) {
  return request(`/notes/${notebookId}/folder`, {
    method: 'PATCH',
    headers: buildHeaders(token, {
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({ folderName })
  })
}
}

export const notificationAPI = {
  async createTest(token) {
  return request('/notifications/test', {
    method: 'POST',
    headers: buildHeaders(token)
  })
},
  async list(token) {
    return request('/notifications', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async unreadCount(token) {
    return request('/notifications/unread-count', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async markAsRead(token, notificationId) {
    return request(
      `/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
        headers: buildHeaders(token)
      }
    )
  },

  async markAllAsRead(token) {
    return request('/notifications/read-all', {
      method: 'PATCH',
      headers: buildHeaders(token)
    })
  },

  async delete(token, notificationId) {
    return request(
      `/notifications/${notificationId}`,
      {
        method: 'DELETE',
        headers: buildHeaders(token)
      }
    )
  }
}

export const agendaAPI = {
  async list(token) {
    return request('/agenda', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async create(token, payload) {
    return request('/agenda', {
      method: 'POST',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async update(token, eventId, payload) {
    return request(`/agenda/${eventId}`, {
      method: 'PUT',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async deleteSeries(token, groupId) {
  return request(`/agenda/series/${groupId}`, {
    method: 'DELETE',
    headers: buildHeaders(token)
  })
},

  async delete(token, eventId) {
    return request(`/agenda/${eventId}`, {
      method: 'DELETE',
      headers: buildHeaders(token)
    })
  }
}

export const flashcardAPI = {
  async getDecks(token) {
    return request('/flashcards', {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async createDeck(token, payload) {
    return request('/flashcards', {
      method: 'POST',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async getDeck(token, deckId) {
    return request(`/flashcards/${deckId}`, {
      method: 'GET',
      headers: buildHeaders(token)
    })
  },

  async updateDeck(token, deckId, payload) {
    return request(`/flashcards/${deckId}`, {
      method: 'PUT',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async deleteDeck(token, deckId) {
    return request(`/flashcards/${deckId}`, {
      method: 'DELETE',
      headers: buildHeaders(token)
    })
  },

  async createCard(token, deckId, payload) {
    return request(`/flashcards/${deckId}/cards`, {
      method: 'POST',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async updateCard(token, deckId, cardId, payload) {
    return request(`/flashcards/${deckId}/cards/${cardId}`, {
      method: 'PUT',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    })
  },

  async deleteCard(token, deckId, cardId) {
    return request(`/flashcards/${deckId}/cards/${cardId}`, {
      method: 'DELETE',
      headers: buildHeaders(token)
    })
  },

  async reviewCard(token, deckId, cardId, known) {
    return request(`/flashcards/${deckId}/cards/${cardId}/review`, {
      method: 'PATCH',
      headers: buildHeaders(token, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ known })
    })
  }
}

export { API_BASE_URL }
