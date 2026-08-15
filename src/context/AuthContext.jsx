import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  authApi,
  subscriptionApi,
  userAPI
} from '../services/api.js'

const AuthContext = createContext(null)
const AUTH_TOKEN_KEY = 'edudia_auth_token'
const CURRENT_USER_KEY = 'edudia_current_user'
const LEGACY_USERS_KEY = 'edudia_users'
const LEGACY_CURRENT_USER_KEY = 'edudia_current_user'
const AUTH_NOTICE_KEY = 'edudia_auth_notice'

const LEVELS = [
  { name: 'Debutant', min: 0, max: 99 },
  { name: 'Contributeur', min: 100, max: 499 },
  { name: 'Expert', min: 500, max: 999 },
  { name: 'Ambassadeur', min: 1000, max: Number.POSITIVE_INFINITY }
]

const splitFullName = (fullName) => {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ')
  if (!cleaned) {
  return { firstName: '', lastName: '' }
}

  const [firstName, ...rest] = cleaned.split(' ')
return {
  firstName,
  lastName: rest.join(' ')
}
}


const getLevelFromPoints = (points) => {
  return LEVELS.find((level) => points >= level.min && points <= level.max) || LEVELS[0]
}

const buildBadges = (profile) => {
  const badges = []
  badges.push(getLevelFromPoints(profile.points).name)
  if ((profile.documentUploads || 0) >= 1) badges.push('Partageur')
  if ((profile.forumReplies || 0) >= 1) badges.push('Aidant')
  if ((profile.documentDownloadsEarned || 0) >= 10) badges.push('Document utile')
  if ((profile.fiveStarBonuses || 0) >= 1) badges.push('Document vedette')
  return [...new Set(badges)]
}

const mapBackendUser = (input) => {
  if (!input) return null
  const firstName = String(input.first_name || input.firstName || '').trim()
const rawLastName = String(input.last_name || input.lastName || '').trim()
const lastName = rawLastName.toLowerCase() === 'edudia' ? '' : rawLastName
  const points = Number(input.points || 0)
  const subscriptionStatus = input.subscription_status || input.subscriptionStatus || 'inactive'
  const subscriptionType = input.subscription_type || input.subscriptionType || ''
  const trialStart = input.trial_start || input.trialStart || ''
  const trialEnd = input.trial_end || input.trialEnd || ''
  const subscriptionStartDate = input.subscription_start || input.subscriptionStartDate || ''
  const subscriptionEndDate = input.subscription_end || input.subscriptionEndDate || ''
  const autoRenew = typeof input.auto_renew === 'boolean' ? input.auto_renew : Boolean(input.autoRenew)

  return {
  id: input.id,
  firstName,
  lastName,
  nom: `${firstName} ${lastName}`.trim() || 'Etudiant',
  email: input.email,
  school: input.school || '',
  programme: input.program || input.programme || '',
  session: input.session || '',
  profilePhotoUrl:
    input.profile_photo_url ||
    input.profilePhotoUrl ||
    '',
    subscriptionStatus,
    subscriptionType,
    trialStart,
    trialEnd,
    subscriptionStartDate,
    subscriptionEndDate,
    autoRenew,
    role: input.role === 'admin' ? 'admin' : 'student',
    isDisabled: Boolean(input.is_active === false || input.isDisabled),
    createdAt: input.created_at || input.createdAt || '',
    points,
    level: getLevelFromPoints(points).name,
    documentUploads: Number(input.documentUploads || 0),
    forumReplies: Number(input.forumReplies || 0),
    documentDownloadsEarned: Number(input.documentDownloadsEarned || 0),
    fiveStarBonuses: Number(input.fiveStarBonuses || 0),
    badges: Array.isArray(input.badges) && input.badges.length > 0
      ? input.badges
      : buildBadges({
          points,
          documentUploads: Number(input.documentUploads || 0),
          forumReplies: Number(input.forumReplies || 0),
          documentDownloadsEarned: Number(input.documentDownloadsEarned || 0),
          fiveStarBonuses: Number(input.fiveStarBonuses || 0)
        })
  }
}

const normalizeCompatUser = (input) => {
  if (!input) return null
  return {
    id: input.id,
    nom: String(input.nom || '').trim(),
    email: String(input.email || '').trim(),
    programme: String(input.programme || '').trim(),
    subscriptionStatus: input.subscriptionStatus || 'inactive',
    subscriptionType: input.subscriptionType || '',
    trialStart: input.trialStart || '',
    trialEnd: input.trialEnd || '',
    subscriptionStartDate: input.subscriptionStartDate || '',
    subscriptionEndDate: input.subscriptionEndDate || '',
    autoRenew: Boolean(input.autoRenew),
    role: input.role === 'admin' ? 'admin' : 'student',
    isDisabled: Boolean(input.isDisabled),
    createdAt: input.createdAt || '',
    points: Number(input.points || 0),
    level: input.level || getLevelFromPoints(Number(input.points || 0)).name,
    documentUploads: Number(input.documentUploads || 0),
    forumReplies: Number(input.forumReplies || 0),
    documentDownloadsEarned: Number(input.documentDownloadsEarned || 0),
    fiveStarBonuses: Number(input.fiveStarBonuses || 0),
    badges: Array.isArray(input.badges) ? input.badges : buildBadges(input)
  }
}

const readCompatUsers = () => {
  try {
    const users = JSON.parse(window.localStorage.getItem(LEGACY_USERS_KEY) || '[]')
    return Array.isArray(users)
      ? users
          .map(normalizeCompatUser)
          .filter(Boolean)
      : []
  } catch {
    return []
  }
}

const saveCompatUsers = (users) => {
  window.localStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(users))
}

const upsertCompatUser = (user) => {
  const normalized = normalizeCompatUser(user)
  if (!normalized) return

  const users = readCompatUsers()
  const nextUsers = users.some((entry) => entry.id === normalized.id)
    ? users.map((entry) => (entry.id === normalized.id ? { ...entry, ...normalized } : entry))
    : [normalized, ...users]

  saveCompatUsers(nextUsers)
}

const hasLegacySensitiveData = (legacyUsers, legacyCurrentUser) => {
  const list = Array.isArray(legacyUsers) ? legacyUsers : []
  const hasPasswordInUsers = list.some((entry) => typeof entry?.password === 'string' && entry.password.length > 0)
  const hasPasswordInCurrent = typeof legacyCurrentUser?.password === 'string' && legacyCurrentUser.password.length > 0
  return hasPasswordInUsers || hasPasswordInCurrent
}

const clearLegacyAuthData = () => {
  const sanitizedLegacyUsers = readCompatUsers()
  if (sanitizedLegacyUsers.length > 0) {
    saveCompatUsers(sanitizedLegacyUsers)
  } else {
    window.localStorage.removeItem(LEGACY_USERS_KEY)
  }
  window.localStorage.removeItem(LEGACY_CURRENT_USER_KEY)
  window.localStorage.removeItem(CURRENT_USER_KEY)
  window.sessionStorage.removeItem(LEGACY_USERS_KEY)
  window.sessionStorage.removeItem(LEGACY_CURRENT_USER_KEY)
  window.sessionStorage.removeItem(CURRENT_USER_KEY)
}

const persistSession = ({ token, user }) => {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  }
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
  }
}

const clearSession = () => {
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(CURRENT_USER_KEY)
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY)
  window.sessionStorage.removeItem(CURRENT_USER_KEY)
}

const getAuthToken = () => window.localStorage.getItem(AUTH_TOKEN_KEY)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authNotice, setAuthNotice] = useState('')

  useEffect(() => {
    const legacyUsers = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(LEGACY_USERS_KEY) || '[]')
      } catch {
        return []
      }
    })()

    const legacyCurrentUser = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(LEGACY_CURRENT_USER_KEY) || 'null')
      } catch {
        return null
      }
    })()

    if (hasLegacySensitiveData(legacyUsers, legacyCurrentUser)) {
      clearLegacyAuthData()
      clearSession()
      const notice = 'Pour securite, votre ancienne session locale a ete supprimee. Veuillez vous reconnecter.'
      setAuthNotice(notice)
      window.sessionStorage.setItem(AUTH_NOTICE_KEY, notice)
    } else {
      const existingNotice = window.sessionStorage.getItem(AUTH_NOTICE_KEY)
      if (existingNotice) {
        setAuthNotice(existingNotice)
      }
    }

    const bootstrap = async () => {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY)
      if (!token) {
        setReady(true)
        return
      }

      setLoading(true)
      try {
        const response = await authApi.verify(token)
        const mappedUser = mapBackendUser(response?.data?.user)
        if (!mappedUser) {
          clearSession()
          setUser(null)
          setReady(true)
          return
        }

        setUser(mappedUser)
        persistSession({ token, user: mappedUser })
        upsertCompatUser(mappedUser)
      } catch {
        clearSession()
        setUser(null)
      } finally {
        setLoading(false)
        setReady(true)
      }
    }

    bootstrap()
  }, [])

  const login = async ({ email, password }) => {
    setLoading(true)

    try {
      const response = await authApi.login({ email, password })
      const token = response?.data?.token
      const mappedUser = mapBackendUser(response?.data?.user)

      if (!token || !mappedUser) {
        throw new Error('Reponse de connexion incomplete.')
      }

      persistSession({ token, user: mappedUser })
      setUser(mappedUser)
      upsertCompatUser(mappedUser)
      return { success: true, user: mappedUser }
    } catch (error) {
      return { success: false, message: error.message || 'Connexion impossible.' }
    } finally {
      setLoading(false)
    }
  }

  const register = async ({ nom, email, password, programme }) => {
    setLoading(true)

    try {
      const split = splitFullName(nom)
      const response = await authApi.register({
        email: String(email || '').toLowerCase().trim(),
        password,
        firstName: split.firstName,
        lastName: split.lastName,
        program: programme
      })

      const token = response?.data?.token
      const mappedUser = mapBackendUser(response?.data?.user)

      if (!token || !mappedUser) {
        throw new Error('Reponse d inscription incomplete.')
      }

      persistSession({ token, user: mappedUser })
      setUser(mappedUser)
      upsertCompatUser(mappedUser)
      return { success: true, user: mappedUser }
    } catch (error) {
      return { success: false, message: error.message || 'Inscription impossible.' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    clearSession()
  }

  const activateSubscription = async (planType = 'monthly') => {
    try {
      const token = getAuthToken()
      if (!token) {
        return { success: false, message: 'Session invalide. Veuillez vous reconnecter.' }
      }

      const response = await subscriptionApi.createCheckoutSession(token, { plan: planType })
      const mappedUser = mapBackendUser(response?.data?.user)

      if (mappedUser) {
        setUser(mappedUser)
        persistSession({ token, user: mappedUser })
        upsertCompatUser(mappedUser)
      }

      return {
        success: true,
        mode: response?.data?.mode || 'simulated',
        message: response?.message || 'Abonnement mis a jour.',
        user: mappedUser
      }
    } catch (error) {
      return { success: false, message: error.message || 'Activation abonnement impossible.' }
    }
  }

  const deactivateSubscription = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        return { success: false, message: 'Session invalide. Veuillez vous reconnecter.' }
      }

      const response = await subscriptionApi.cancel(token)
      const mappedUser = mapBackendUser(response?.data?.user)

      if (mappedUser) {
        setUser(mappedUser)
        persistSession({ token, user: mappedUser })
        upsertCompatUser(mappedUser)
      }

      return { success: true, message: response?.message || 'Abonnement resilie.', user: mappedUser }
    } catch (error) {
      return { success: false, message: error.message || 'Resiliation impossible.' }
    }
  }

  const updateProgramme = async (programme) => {
  const normalizedProgramme =
    String(programme || '').trim()

  if (!normalizedProgramme) {
    return {
      success: false,
      message: 'Programme invalide.'
    }
  }

  try {
    const token = getAuthToken()

    if (!token) {
      return {
        success: false,
        message:
          'Session invalide. Veuillez vous reconnecter.'
      }
    }

    const response = await userAPI.updateProfile(
      token,
      {
        program: normalizedProgramme
      }
    )

    const mappedUser = mapBackendUser(
      response?.data?.user
    )

    if (!mappedUser) {
      return {
        success: false,
        message:
          'La réponse du serveur est incomplète.'
      }
    }

    setUser(mappedUser)
    persistSession({
      token,
      user: mappedUser
    })
    upsertCompatUser(mappedUser)

    return {
      success: true,
      user: mappedUser
    }
  } catch (error) {
    return {
      success: false,
      message:
        error.message ||
        'Impossible de mettre à jour le programme.'
    }
  }
}

const updateProfile = async (profileData) => {
  try {
    const token = getAuthToken()

    if (!token) {
      return {
        success: false,
        message:
          'Session invalide. Veuillez vous reconnecter.'
      }
    }

    const response = await userAPI.updateProfile(
      token,
      profileData
    )

    const mappedUser = mapBackendUser(
      response?.data?.user
    )

    if (!mappedUser) {
      return {
        success: false,
        message:
          'La réponse du serveur est incomplète.'
      }
    }

    setUser(mappedUser)

    persistSession({
      token,
      user: mappedUser
    })

    upsertCompatUser(mappedUser)

    return {
      success: true,
      user: mappedUser
    }
  } catch (error) {
    return {
      success: false,
      message:
        error.message ||
        'Impossible de modifier le profil.'
    }
  }
}

  const clearAuthNotice = () => {
    setAuthNotice('')
    window.sessionStorage.removeItem(AUTH_NOTICE_KEY)
  }

  const value = useMemo(
    () => ({
      user,
      ready,
      loading,
      authNotice,
      clearAuthNotice,
      login,
register,
logout,
activateSubscription,
deactivateSubscription,
updateProgramme,
updateProfile
    }),
    [user, ready, loading, authNotice]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
