import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap'
import { FolderOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import NotebookPreview from '../components/NotebookPreview.jsx'
import { noteAPI } from '../services/api.js'
import {
  SHEET_TYPES,
  formatNoteDate
} from '../services/noteStore.js'
import { importPdfAsNotebookPages } from '../services/pdfNotebook.js'

const LIBRARY_SECTIONS = [
  { id: 'all', label: 'Mes cahiers' },
  { id: 'favorites', label: 'Favoris' },
  { id: 'recent', label: 'Recents' },
  { id: 'trash', label: 'Corbeille' }
]

const DEFAULT_FORM = {
  name: '',
  courseName: '',
  folderName: 'Sans dossier',
  color: '#0d6efd',
  sheetType: 'lined'
}

export default function Notes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notebooks, setNotebooks] = useState([])
  const [section, setSection] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [isImportingFile, setIsImportingFile] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [importedFiles, setImportedFiles] = useState([])
  const [importError, setImportError] = useState('')
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [folderDraft, setFolderDraft] = useState('')
  const [renameSource, setRenameSource] = useState('Sans dossier')
  const [renameTarget, setRenameTarget] = useState('')
  const [deleteSource, setDeleteSource] = useState('Sans dossier')
  const [deleteTarget, setDeleteTarget] = useState('Sans dossier')
  const [folderNotebookId, setFolderNotebookId] = useState(null)
  const [folderNotebookTarget, setFolderNotebookTarget] = useState('Sans dossier')
  const fileInputRef = useRef(null)
  const fallbackCourse = user?.programme || 'General'
  const token = window.localStorage.getItem('edudia_auth_token')

  const normalizeSearchValue = (value) => {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
  }

  useEffect(() => {
  if (!user?.id || !token) return

  const loadNotebooks = async () => {
    try {
      const response = await noteAPI.listNotebooks(token)
      const summaries = response?.data?.notebooks || []

      const detailedNotebooks = await Promise.all(
        summaries.map(async (item) => {
          const detailResponse = await noteAPI.getNotebook(
            token,
            item.id
          )

          const notebook =
            detailResponse?.data?.notebook

          return {
            id: notebook.id,
            name: notebook.title,
            courseName: notebook.course_name,
            folderName:
              notebook.folder_name || 'Sans dossier',
            color:
              notebook.color || '#0d6efd',
            isFavorite:
              Boolean(notebook.is_favorite),
            isTrashed:
              Boolean(notebook.is_trashed),
            sourcePdf:
              notebook.source_pdf || null,
            createdAt:
              notebook.created_at,
            updatedAt:
              notebook.updated_at,
            lastOpenedAt:
              notebook.last_opened_at,

            pages: (notebook.pages || []).map(
              (page) => ({
                id: page.id,
                title: page.title,
                sheetType:
                  page.sheet_type,
                previewText:
                  page.preview_text || '',
                background:
                  page.background || null,
                createdAt:
                  page.created_at,
                updatedAt:
                  page.updated_at,

                elements:
                  (page.elements || []).map(
                    (element) => ({
                      ...(element.data || {}),
                      id:
                        element.data?.id ||
                        element.id,
                      type:
                        element.data?.type ||
                        element.type
                    })
                  )
              })
            )
          }
        })
      )

      setNotebooks(detailedNotebooks)

      const nextFolders = [
        ...new Set(
          detailedNotebooks.map(
            (notebook) =>
              notebook.folderName ||
              'Sans dossier'
          )
        )
      ]

      if (!nextFolders.includes('Sans dossier')) {
        nextFolders.unshift('Sans dossier')
      }

      setFolders(nextFolders)

      // Temporairement, historique PDF encore local
      setImportedFiles(
  detailedNotebooks
    .filter((notebook) => notebook.sourcePdf)
    .map((notebook) => ({
      id: notebook.id,
      name:
        notebook.sourcePdf?.name ||
        notebook.name,
      createdAt:
        notebook.sourcePdf?.importedAt ||
        notebook.createdAt
    }))
)
    } catch (error) {
      console.error(
        'Erreur chargement cahiers PostgreSQL:',
        error
      )
    }
  }

  loadNotebooks()
}, [token, user?.id])

  const sectionCounts = useMemo(() => {
    const active = notebooks.filter((notebook) => !notebook.isTrashed)
    const recentCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7
    return {
      all: active.length,
      favorites: active.filter((notebook) => notebook.isFavorite).length,
      recent: active.filter((notebook) => new Date(notebook.updatedAt).getTime() >= recentCutoff).length,
      trash: notebooks.filter((notebook) => notebook.isTrashed).length
    }
  }, [notebooks])

  const filteredNotebooks = useMemo(() => {
    const query = normalizeSearchValue(searchTerm)
    const recentCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7

    return notebooks.filter((notebook) => {
      if (section === 'all' && notebook.isTrashed) return false
      if (section === 'favorites' && (notebook.isTrashed || !notebook.isFavorite)) return false
      if (section === 'recent' && (notebook.isTrashed || new Date(notebook.updatedAt).getTime() < recentCutoff)) return false
      if (section === 'trash' && !notebook.isTrashed) return false
      if (selectedFolder !== 'all' && (notebook.folderName || 'Sans dossier') !== selectedFolder) return false

      if (!query) return true

      const searchable = normalizeSearchValue([
        notebook.name,
        notebook.courseName,
        notebook.folderName,
        notebook.pages?.map((page) => page.title).join(' '),
        notebook.pages?.[0]?.previewText,
        notebook.pages?.map((page) => page.previewText).join(' ')
      ]
        .filter(Boolean)
        .join(' '))

      return searchable.includes(query)
    })
  }, [notebooks, section, selectedFolder, searchTerm])

  const folderCounts = useMemo(() => {
    const active = notebooks.filter((notebook) => {
      if (section === 'trash') return notebook.isTrashed
      if (notebook.isTrashed) return false
      if (section === 'favorites') return notebook.isFavorite
      if (section === 'recent') {
        const recentCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7
        return new Date(notebook.updatedAt).getTime() >= recentCutoff
      }
      return true
    })

    return active.reduce((accumulator, notebook) => {
      const key = notebook.folderName || 'Sans dossier'
      accumulator[key] = (accumulator[key] || 0) + 1
      accumulator.all = (accumulator.all || 0) + 1
      return accumulator
    }, { all: 0 })
  }, [notebooks, section])

  const groupedNotebooks = useMemo(() => {
    return filteredNotebooks.reduce((groups, notebook) => {
      const key = notebook.courseName || 'Sans cours'
      if (!groups[key]) groups[key] = []
      groups[key].push(notebook)
      return groups
    }, {})
  }, [filteredNotebooks])

  const refreshLibrary = async () => {
  if (!token || !user?.id) return

  try {
    const [notebooksResponse, foldersResponse] =
      await Promise.all([
        noteAPI.listNotebooks(token),
        noteAPI.listFolders(token)
      ])

    const summaries =
      notebooksResponse?.data?.notebooks || []

    const detailedNotebooks = await Promise.all(
      summaries.map(async (item) => {
        const detailResponse =
          await noteAPI.getNotebook(
            token,
            item.id
          )

        const notebook =
          detailResponse?.data?.notebook

        return {
          id: notebook.id,
          name: notebook.title,
          courseName: notebook.course_name,
          folderName:
            notebook.folder_name || 'Sans dossier',
          color:
            notebook.color || '#0d6efd',
          isFavorite:
            Boolean(notebook.is_favorite),
          isTrashed:
            Boolean(notebook.is_trashed),
          sourcePdf:
            notebook.source_pdf || null,
          createdAt:
            notebook.created_at,
          updatedAt:
            notebook.updated_at,
          lastOpenedAt:
            notebook.last_opened_at,

          pages: (notebook.pages || []).map(
            (page) => ({
              id: page.id,
              title: page.title,
              sheetType: page.sheet_type,
              previewText:
                page.preview_text || '',
              background:
                page.background || null,
              createdAt: page.created_at,
              updatedAt: page.updated_at,

              elements:
                (page.elements || []).map(
                  (element) => ({
                    ...(element.data || {}),
                    id:
                      element.data?.id ||
                      element.id,
                    type:
                      element.data?.type ||
                      element.type
                  })
                )
            })
          )
        }
      })
    )

    const nextFolders =
      (foldersResponse?.data?.folders || [])
        .map((folder) => folder.name)

    if (!nextFolders.includes('Sans dossier')) {
      nextFolders.unshift('Sans dossier')
    }

    setNotebooks(detailedNotebooks)
    setFolders(nextFolders)

    setRenameSource((current) =>
      nextFolders.includes(current)
        ? current
        : nextFolders[0] || 'Sans dossier'
    )

    setDeleteSource((current) =>
      nextFolders.includes(current)
        ? current
        : nextFolders[0] || 'Sans dossier'
    )

    setDeleteTarget((current) =>
      nextFolders.includes(current)
        ? current
        : nextFolders[0] || 'Sans dossier'
    )

    setFolderNotebookTarget((current) =>
      nextFolders.includes(current)
        ? current
        : nextFolders[0] || 'Sans dossier'
    )

    // PDF : encore local pour l'instant.
    setImportedFiles(
  detailedNotebooks
    .filter((notebook) => notebook.sourcePdf)
    .map((notebook) => ({
      id: notebook.id,
      name:
        notebook.sourcePdf?.name ||
        notebook.name,
      createdAt:
        notebook.sourcePdf?.importedAt ||
        notebook.createdAt
    }))
)
  } catch (error) {
    console.error(
      'Erreur actualisation Notes PostgreSQL:',
      error
    )
  }
}

  const handleCreateNotebook = async (event) => {
  event.preventDefault()

  if (!token) return

  try {
    const response = await noteAPI.createNotebook(
      token,
      {
        title: form.name,
        courseName:
          form.courseName || fallbackCourse,
        folderName:
          form.folderName || 'Sans dossier',
        color:
          form.color || '#0d6efd',
        sheetType:
          form.sheetType || 'lined'
      }
    )

    const notebook =
      response?.data?.notebook

    if (!notebook?.id) {
      throw new Error(
        'Cahier non retourné par le serveur.'
      )
    }

    setShowCreateModal(false)
    setForm(DEFAULT_FORM)

    navigate(`/notes/${notebook.id}`)
  } catch (error) {
    console.error(
      'Erreur création cahier PostgreSQL:',
      error
    )

    window.alert(
      error.message ||
        'Impossible de créer le cahier.'
    )
  }
  }

  const handleFavorite = async (
  notebookId,
  nextValue
) => {
  if (!token) return

  try {
    await noteAPI.setFavorite(
      token,
      notebookId,
      nextValue
    )

    await refreshLibrary()
  } catch (error) {
    console.error(
      'Erreur favori PostgreSQL:',
      error
    )
  }
}

  const handleTrash = async (
  notebookId,
  nextValue
) => {
  if (!token) return

  try {
    await noteAPI.setTrash(
      token,
      notebookId,
      nextValue
    )

    await refreshLibrary()
  } catch (error) {
    console.error(
      'Erreur corbeille PostgreSQL:',
      error
    )
  }
}

  const openFolderModal = (notebook = null) => {
  const available =
    folders.length > 0
      ? folders
      : ['Sans dossier']

  setRenameSource(
    available[0] || 'Sans dossier'
  )

  setDeleteSource(
    available[0] || 'Sans dossier'
  )

  setDeleteTarget(
    available[0] || 'Sans dossier'
  )

  setFolderNotebookId(
    notebook?.id || null
  )

  setFolderNotebookTarget(
    notebook?.folderName ||
      available[0] ||
      'Sans dossier'
  )

  setFolderDraft('')
  setRenameTarget('')
  setShowFolderModal(true)
}


const handleCreateFolder = async () => {
  const nextName = folderDraft.trim()

  if (!nextName || !token) return

  if (folders.includes(nextName)) {
    window.alert(
      'Ce dossier existe déjà.'
    )
    return
  }

  try {
    await noteAPI.createFolder(
      token,
      nextName
    )

    setFolderDraft('')

    await refreshLibrary()
  } catch (error) {
    console.error(
      'Erreur création dossier PostgreSQL:',
      error
    )

    window.alert(
      error.message ||
        'Impossible de créer le dossier.'
    )
  }
}


const handleAssignNotebookFolder = async () => {
  if (
    !folderNotebookId ||
    !token
  ) {
    return
  }

  try {
    await noteAPI.moveToFolder(
      token,
      folderNotebookId,
      folderNotebookTarget
    )

    await refreshLibrary()

    setShowFolderModal(false)
  } catch (error) {
    console.error(
      'Erreur déplacement dossier PostgreSQL:',
      error
    )

    window.alert(
      error.message ||
        'Impossible de déplacer le cahier.'
    )
  }
}


const handleRenameFolder = async () => {
  const nextName =
    renameTarget.trim()

  if (!nextName || !token) return

  if (renameSource === nextName) {
    return
  }

  try {
    await noteAPI.renameFolder(
      token,
      renameSource,
      nextName
    )

    if (selectedFolder === renameSource) {
      setSelectedFolder(nextName)
    }

    setRenameTarget('')

    await refreshLibrary()
  } catch (error) {
    console.error(
      'Erreur renommage dossier PostgreSQL:',
      error
    )

    window.alert(
      error.message ||
        'Impossible de renommer le dossier.'
    )
  }
}


const handleDeleteFolder = async () => {
  if (!token) return

  if (
    deleteSource ===
    deleteTarget
  ) {
    window.alert(
      'Choisissez un dossier de destination différent.'
    )
    return
  }

  try {
    await noteAPI.deleteFolder(
      token,
      deleteSource,
      deleteTarget
    )

    if (selectedFolder === deleteSource) {
      setSelectedFolder('all')
    }

    await refreshLibrary()
  } catch (error) {
    console.error(
      'Erreur suppression dossier PostgreSQL:',
      error
    )

    window.alert(
      error.message ||
        'Impossible de supprimer le dossier.'
    )
  }
}

  const handleFileImport = async (event) => {
  const file = event.target.files?.[0]

  if (!file || !user?.id || !token) return

  const lowerName = file.name.toLowerCase()

  const isPdfByType =
    file.type === 'application/pdf'

  const isPdfByExtension =
    lowerName.endsWith('.pdf')

  if (!isPdfByType && !isPdfByExtension) {
    setImportError(
      'Seuls les fichiers PDF sont acceptés.'
    )

    setSelectedFileName('')
    event.target.value = ''
    return
  }

  setIsImportingFile(true)
  setImportError('')
  setSelectedFileName(file.name)

  try {
    // Convertir le PDF en pages
    const imported =
      await importPdfAsNotebookPages(file)

    const importedPages =
      Array.isArray(imported.pages)
        ? imported.pages
        : []

    // Créer le cahier PostgreSQL
    const createResponse =
      await noteAPI.createNotebook(
        token,
        {
          title:
            file.name.replace(/\.pdf$/i, '') ||
            'PDF importé',

          courseName:
            fallbackCourse,

          folderName:
            'Sans dossier',

          color:
            '#0d6efd',

          sheetType:
            importedPages[0]?.sheetType ||
            'blank',

          sourcePdf: {
            name:
              imported.pdfName ||
              file.name,

            pageCount:
              importedPages.length,

            importedAt:
              new Date().toISOString(),

            size:
              file.size
          }
        }
      )

    const notebook =
      createResponse?.data?.notebook

    if (!notebook?.id) {
      throw new Error(
        'Le cahier PDF n’a pas été créé.'
      )
    }

    const firstDatabasePage =
      notebook.pages?.[0]

    // Remplir la première page créée automatiquement
    if (
      firstDatabasePage &&
      importedPages.length > 0
    ) {
      const firstImportedPage =
        importedPages[0]

      await noteAPI.updatePage(
        token,
        notebook.id,
        firstDatabasePage.id,
        {
          title:
            firstImportedPage.title ||
            'Page 1',

          sheetType:
            firstImportedPage.sheetType ||
            'blank',

          previewText:
            firstImportedPage.previewText ||
            '',

          background:
            firstImportedPage.background ||
            null,

          elements:
            firstImportedPage.elements ||
            []
        }
      )
    }

    // Créer toutes les autres pages
    for (
      let index = 1;
      index < importedPages.length;
      index += 1
    ) {
      const importedPage =
        importedPages[index]

      const pageResponse =
        await noteAPI.createPage(
          token,
          notebook.id,
          {
            title:
              importedPage.title ||
              `Page ${index + 1}`,

            sheetType:
              importedPage.sheetType ||
              'blank',

            background:
              importedPage.background ||
              null
          }
        )

      const newPage =
        pageResponse?.data?.page

      if (!newPage?.id) {
        throw new Error(
          `Impossible de créer la page ${index + 1}.`
        )
      }

      await noteAPI.updatePage(
        token,
        notebook.id,
        newPage.id,
        {
          title:
            importedPage.title ||
            `Page ${index + 1}`,

          sheetType:
            importedPage.sheetType ||
            'blank',

          previewText:
            importedPage.previewText ||
            '',

          background:
            importedPage.background ||
            null,

          elements:
            importedPage.elements ||
            []
        }
      )
    }

    await refreshLibrary()

    navigate(`/notes/${notebook.id}`)
  } catch (error) {
    console.error(
      'Erreur import PDF PostgreSQL:',
      error
    )

    setImportError(
      error.message ||
        'Import impossible. Vérifiez le fichier PDF et réessayez.'
    )

    window.alert(
      error.message ||
        'Import impossible. Vérifiez le fichier et réessayez.'
    )
  } finally {
    setIsImportingFile(false)
    event.target.value = ''
  }
}

  return (
    <Container fluid className="notes-library-page py-4">
      <Container>
        <div className="notes-library-hero">
          <div>
            <Badge bg="primary-subtle" text="primary" className="mb-3 notes-library-pill">Cahier numerique</Badge>
            <h1 className="notes-library-title">Notes</h1>
            <p className="notes-library-subtitle mb-0">
              Creez des cahiers par cours, prenez des notes au clavier ou au stylet, puis retrouvez-les instantanement.
            </p>
          </div>
          <div className="notes-library-actions">
            <Form.Control
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher un cahier, un cours ou une note"
              className="notes-search-input"
            />
            <Button
              variant="outline-primary"
              className="notes-create-button d-inline-flex align-items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImportingFile}
            >
              <FolderOpen size={16} />
              {isImportingFile ? 'Import en cours...' : 'Importer un fichier'}
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="notes-create-button">Nouveau cahier</Button>
          </div>
          <div className="small text-muted mt-2">
            {selectedFileName
              ? `Fichier selectionne: ${selectedFileName}`
              : importedFiles.length > 0
                ? `Dernier fichier enregistre: ${importedFiles[0].name}`
                : 'Aucun fichier importe'}
          </div>
          {importError && (
            <div className="small text-danger mt-1" role="alert">
              {importError}
            </div>
          )}
        </div>

        <Row className="g-4 mt-1">
          <Col lg={3}>
            <Card className="notes-panel-card notes-sidebar-card shadow-sm">
              <Card.Body className="d-grid gap-2">
                {LIBRARY_SECTIONS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`notes-sidebar-item ${section === item.id ? 'is-active' : ''}`}
                    onClick={() => setSection(item.id)}
                  >
                    <span>{item.label}</span>
                    <Badge bg={section === item.id ? 'primary' : 'secondary'} pill>
                      {sectionCounts[item.id] || 0}
                    </Badge>
                  </button>
                ))}

                <div className="notes-sidebar-divider" />
                <div className="notes-sidebar-heading">Dossiers</div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="notes-folder-manage"
                  onClick={() => openFolderModal()}
                >
                  Gerer les dossiers
                </Button>
                <button
                  type="button"
                  className={`notes-sidebar-item ${selectedFolder === 'all' ? 'is-active' : ''}`}
                  onClick={() => setSelectedFolder('all')}
                >
                  <span>Tous les dossiers</span>
                  <Badge bg={selectedFolder === 'all' ? 'primary' : 'secondary'} pill>
                    {folderCounts.all || 0}
                  </Badge>
                </button>
                {folders.map((folder) => (
                  <button
                    type="button"
                    key={folder}
                    className={`notes-sidebar-item ${selectedFolder === folder ? 'is-active' : ''}`}
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <span>{folder}</span>
                    <Badge bg={selectedFolder === folder ? 'primary' : 'secondary'} pill>
                      {folderCounts[folder] || 0}
                    </Badge>
                  </button>
                ))}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={9}>
            <div className="d-grid gap-4">
              {Object.keys(groupedNotebooks).length === 0 ? (
                <Card className="notes-panel-card shadow-sm">
                  <Card.Body className="py-5 text-center">
                    <h2 className="h4 mb-3">Aucun cahier trouvé.</h2>
                    <p className="text-muted mb-4">
                      {normalizeSearchValue(searchTerm)
                        ? 'Aucun cahier ne correspond a votre recherche.'
                        : 'Creez un nouveau cahier pour commencer a ecrire et organiser vos cours.'}
                    </p>
                    {!normalizeSearchValue(searchTerm) && (
                      <Button onClick={() => setShowCreateModal(true)}>Creer mon premier cahier</Button>
                    )}
                  </Card.Body>
                </Card>
              ) : (
                Object.entries(groupedNotebooks).map(([courseName, items]) => (
                  <section key={courseName} className="d-grid gap-3">
                    <div>
                      <h2 className="h4 mb-1">{courseName}</h2>
                      <div className="text-muted small">{items.length} cahier(s)</div>
                    </div>

                    <Row className="g-4">
                      {items.map((notebook) => {
                        const firstPage = notebook.pages?.[0]
                        return (
                          <Col md={6} xl={4} key={notebook.id}>
                            <Card className="notes-panel-card notes-notebook-card shadow-sm h-100">
                              <div className="notes-notebook-card__header" style={{ '--notebook-color': notebook.color }}>
                                <div className="notes-notebook-chip">{notebook.courseName}</div>
                                <div className="notes-notebook-color" />
                              </div>
                              <Card.Body className="d-flex flex-column gap-3">
                                <NotebookPreview page={firstPage} color={notebook.color} />
                                <div className="d-grid gap-1">
                                  <div className="d-flex justify-content-between gap-3 align-items-start">
                                    <h3 className="h5 mb-0">{notebook.name}</h3>
                                    <div className="d-flex gap-2 align-items-center">
                                      <Badge bg="info" text="dark">{notebook.folderName || 'Sans dossier'}</Badge>
                                      {notebook.isFavorite && <Badge bg="warning" text="dark">Favori</Badge>}
                                    </div>
                                  </div>
                                  <div className="text-muted small">Derniere modification: {formatNoteDate(notebook.updatedAt)}</div>
                                  <div className="text-muted small">{notebook.pages.length} page(s)</div>
                                </div>
                                <div className="mt-auto d-flex flex-wrap gap-2">
                                  <Button variant="primary" onClick={() => navigate(`/notes/${notebook.id}`)}>Ouvrir</Button>
                                  <Button
                                    variant="outline-primary"
                                    onClick={() => openFolderModal(notebook)}
                                  >
                                    Dossier
                                  </Button>
                                  <Button
                                    variant={notebook.isFavorite ? 'warning' : 'outline-secondary'}
                                    onClick={() => handleFavorite(notebook.id, !notebook.isFavorite)}
                                  >
                                    {notebook.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                  </Button>
                                  <Button
                                    variant={notebook.isTrashed ? 'outline-success' : 'outline-danger'}
                                    onClick={() => handleTrash(notebook.id, !notebook.isTrashed)}
                                  >
                                    {notebook.isTrashed ? 'Restaurer' : 'Corbeille'}
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )
                      })}
                    </Row>
                  </section>
                ))
              )}
            </div>
          </Col>
        </Row>
      </Container>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nouveau cahier</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateNotebook}>
          <Modal.Body className="d-grid gap-3">
            <Form.Group>
              <Form.Label>Nom du cahier</Form.Label>
              <Form.Control
                required
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="Ex: Notes de cours"
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Cours associe</Form.Label>
              <Form.Control
                value={form.courseName}
                onChange={(event) => setForm((previous) => ({ ...previous, courseName: event.target.value }))}
                placeholder={fallbackCourse}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Dossier</Form.Label>
              <Form.Control
                value={form.folderName}
                onChange={(event) => setForm((previous) => ({ ...previous, folderName: event.target.value }))}
                placeholder="Ex: Semestre 1"
              />
            </Form.Group>

            <Row className="g-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Couleur</Form.Label>
                  <Form.Control
                    type="color"
                    value={form.color}
                    onChange={(event) => setForm((previous) => ({ ...previous, color: event.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>Type de feuille</Form.Label>
                  <Form.Select
                    value={form.sheetType}
                    onChange={(event) => setForm((previous) => ({ ...previous, sheetType: event.target.value }))}
                  >
                    {SHEET_TYPES.map((sheetType) => (
                      <option key={sheetType.id} value={sheetType.id}>{sheetType.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)}>Annuler</Button>
            <Button type="submit">Creer le cahier</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showFolderModal} onHide={() => setShowFolderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Gerer les dossiers</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-grid gap-3">
          <div className="notes-folder-box">
            <div className="fw-semibold mb-2">Creer un dossier</div>
            <div className="d-flex gap-2">
              <Form.Control
                value={folderDraft}
                onChange={(event) => setFolderDraft(event.target.value)}
                placeholder="Nom du dossier"
              />
              <Button onClick={handleCreateFolder}>Creer</Button>
            </div>
          </div>

          {folderNotebookId && (
            <div className="notes-folder-box">
              <div className="fw-semibold mb-2">Assigner le cahier</div>
              <div className="d-flex gap-2">
                <Form.Select value={folderNotebookTarget} onChange={(event) => setFolderNotebookTarget(event.target.value)}>
                  {folders.map((folder) => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </Form.Select>
                <Button variant="outline-primary" onClick={handleAssignNotebookFolder}>Appliquer</Button>
              </div>
            </div>
          )}

          <div className="notes-folder-box">
            <div className="fw-semibold mb-2">Renommer un dossier</div>
            <div className="d-grid gap-2">
              <Form.Select value={renameSource} onChange={(event) => setRenameSource(event.target.value)}>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </Form.Select>
              <div className="d-flex gap-2">
                <Form.Control
                  value={renameTarget}
                  onChange={(event) => setRenameTarget(event.target.value)}
                  placeholder="Nouveau nom"
                />
                <Button variant="outline-secondary" onClick={handleRenameFolder}>Renommer</Button>
              </div>
            </div>
          </div>

          <div className="notes-folder-box">
            <div className="fw-semibold mb-2">Supprimer un dossier</div>
            <div className="d-grid gap-2">
              <Form.Select value={deleteSource} onChange={(event) => setDeleteSource(event.target.value)}>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </Form.Select>
              <Form.Select value={deleteTarget} onChange={(event) => setDeleteTarget(event.target.value)}>
                {folders.map((folder) => (
                  <option key={folder} value={folder}>{folder}</option>
                ))}
              </Form.Select>
              <Button variant="outline-danger" onClick={handleDeleteFolder}>Supprimer et deplacer les cahiers</Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowFolderModal(false)}>Fermer</Button>
        </Modal.Footer>
      </Modal>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="d-none"
        onChange={handleFileImport}
      />
    </Container>
  )
}