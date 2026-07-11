import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const isPaidSubscriber = (user) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.subscriptionStatus === 'active' && ['monthly', 'annual'].includes(user.subscriptionType)
}

export function RequireAuth() {
  const { user, ready, loading } = useAuth()
  const location = useLocation()

  if (!ready || loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireActiveSubscription() {
  const { user, ready, loading } = useAuth()
  const location = useLocation()

  if (!ready || loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!isPaidSubscriber(user)) {
    return <Navigate to="/subscription" replace state={{ denied: true, from: location.pathname }} />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const { user, ready, loading } = useAuth()
  const location = useLocation()

  if (!ready || loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== 'admin') {
    return <Navigate to="/access-denied" replace state={{ deniedReason: 'admin', from: location.pathname }} />
  }

  return <Outlet />
}
