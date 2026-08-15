import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Badge, Card, Col, Container, Row } from 'react-bootstrap'

const MANIFEST_PATH = '/manifest.json'

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const hasAnyIcon = (icons) => Array.isArray(icons) && icons.length > 0

const hasInstallableIcons = (icons) => {
  if (!Array.isArray(icons)) return false

  const has192 = icons.some((icon) => String(icon?.sizes || '').split(' ').includes('192x192'))
  const has512 = icons.some((icon) => String(icon?.sizes || '').split(' ').includes('512x512'))
  const hasSupportedFormat = icons.some((icon) => ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'].includes(icon?.type))

  return has192 && has512 && hasSupportedFormat
}

const getIconSummary = (icons) => {
  if (!Array.isArray(icons) || icons.length === 0) return 'Aucune icône déclarée.'

  return icons
    .map((icon) => `${icon.src || '-'} (${icon.sizes || 'taille inconnue'}, ${icon.type || 'type inconnu'})`)
    .join(' | ')
}

export default function PWADiagnostic() {
  const [manifest, setManifest] = useState(null)
  const [manifestDetected, setManifestDetected] = useState(false)
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false)
  const [iconsDetected, setIconsDetected] = useState(false)
  const [beforeInstallPromptAvailable, setBeforeInstallPromptAvailable] = useState(false)
  const [installable, setInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setBeforeInstallPromptAvailable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    const evaluate = async () => {
      const manifestLink = document.querySelector('link[rel="manifest"]')?.getAttribute('href') || MANIFEST_PATH
      const response = await fetch(manifestLink).catch(() => null)

      let manifestJson = null
      if (response && response.ok) {
        manifestJson = safeParse(await response.text(), null)
        setManifest(manifestJson)
        setManifestDetected(Boolean(manifestJson))
        setIconsDetected(hasAnyIcon(manifestJson?.icons))
      } else {
        setManifest(null)
        setManifestDetected(false)
        setIconsDetected(false)
      }

      const registration = await navigator.serviceWorker?.getRegistration?.().catch(() => null)
      const readyRegistration = await navigator.serviceWorker?.ready?.catch(() => null)
      const swActive = Boolean(navigator.serviceWorker?.controller || registration?.active || readyRegistration?.active)
      setServiceWorkerActive(swActive)

      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
      setInstallable(Boolean(response?.ok && manifestJson && hasInstallableIcons(manifestJson?.icons) && swActive && !standalone))
    }

    evaluate().catch(() => {
      setManifest(null)
      setManifestDetected(false)
      setServiceWorkerActive(false)
      setIconsDetected(false)
      setInstallable(false)
    })
  }, [beforeInstallPromptAvailable])

  const installabilityMessage = useMemo(() => {
    if (!manifestDetected) return 'Le manifeste n’est pas détecté correctement.'
    if (!iconsDetected) return 'Le manifeste ne contient aucune icône.'
    if (!hasInstallableIcons(manifest?.icons)) {
      return 'Le manifeste contient une icône SVG unique, mais il manque des icônes d’installation valides (généralement PNG 192x192 et 512x512).'
    }
    if (!serviceWorkerActive) return 'Le service worker n’est pas actif.'
    if (!installable) return 'Les critères PWA ne sont pas tous réunis.'
    if (!beforeInstallPromptAvailable) return 'Les critères sont réunis, mais le navigateur n’a pas encore déclenché beforeinstallprompt.'
    return 'Les critères PWA sont réunis et le navigateur a déclenché beforeinstallprompt.'
  }, [beforeInstallPromptAvailable, iconsDetected, installable, manifest, manifestDetected, serviceWorkerActive])

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h1 className="h3 mb-2">Diagnostic PWA</h1>
              <p className="text-muted mb-4">Vérification locale de la configuration d’installation de l’application.</p>

              <div className="d-grid gap-3">
                <Card className="border-0 bg-light">
                  <Card.Body className="d-flex justify-content-between align-items-center gap-2">
                    <span>Manifest détecté</span>
                    <Badge bg={manifestDetected ? 'success' : 'danger'}>{manifestDetected ? 'Oui' : 'Non'}</Badge>
                  </Card.Body>
                </Card>
                <Card className="border-0 bg-light">
                  <Card.Body className="d-flex justify-content-between align-items-center gap-2">
                    <span>Service Worker actif</span>
                    <Badge bg={serviceWorkerActive ? 'success' : 'danger'}>{serviceWorkerActive ? 'Oui' : 'Non'}</Badge>
                  </Card.Body>
                </Card>
                <Card className="border-0 bg-light">
                  <Card.Body className="d-flex justify-content-between align-items-center gap-2">
                    <span>Application installable</span>
                    <Badge bg={installable ? 'success' : 'danger'}>{installable ? 'Oui' : 'Non'}</Badge>
                  </Card.Body>
                </Card>
                <Card className="border-0 bg-light">
                  <Card.Body className="d-flex justify-content-between align-items-center gap-2">
                    <span>Icônes détectées</span>
                    <Badge bg={iconsDetected ? 'success' : 'danger'}>{iconsDetected ? 'Oui' : 'Non'}</Badge>
                  </Card.Body>
                </Card>
              </div>

              <Alert variant="info" className="mt-4 mb-0">{installabilityMessage}</Alert>
              <Alert variant="secondary" className="mt-3 mb-0">
                beforeinstallprompt : {beforeInstallPromptAvailable ? 'déclenché' : 'non déclenché'}
              </Alert>

              <Card className="mt-4 bg-light border-0">
                <Card.Body>
                  <h2 className="h5">Détails du manifeste</h2>
                  <p className="text-muted small mb-2">Icônes déclarées : {getIconSummary(manifest?.icons)}</p>
                  <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {manifest ? JSON.stringify(manifest, null, 2) : 'Aucun manifeste exploitable.'}
                  </pre>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
