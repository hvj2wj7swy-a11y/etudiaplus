const STORAGE_PREFIX = 'edudia_notes'
const FILE_STORAGE_PREFIX = 'edudia_notes_files'

export const SHEET_TYPES = [
  { id: 'blank', label: 'Blanche' },
  { id: 'lined', label: 'Lignee' },
  { id: 'grid', label: 'Quadrillee' },
  { id: 'dotted', label: 'Pointillee' }
]

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const cloneValue = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

const nowIso = () => new Date().toISOString()

const generateId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`

const getStorageKey = (userId) => `${STORAGE_PREFIX}:${userId || 'guest'}`
const getFilesStorageKey = (userId) => `${FILE_STORAGE_PREFIX}:${userId || 'guest'}`
const DEFAULT_FOLDER = 'Sans dossier'

const extractTextPreview = (page) => {
  if (!page?.elements?.length) return ''
  const textElement = page.elements.find((element) => element.type === 'text' && element.text?.trim())
  if (textElement) return textElement.text.trim().slice(0, 80)
  const counts = page.elements.reduce((accumulator, element) => {
    accumulator[element.type] = (accumulator[element.type] || 0) + 1
    return accumulator
  }, {})
  const summary = []
  if (counts.stroke) summary.push(`${counts.stroke} traits`)
  if (counts.shape) summary.push(`${counts.shape} formes`)
  if (counts.image) summary.push(`${counts.image} images`)
  return summary.join(' • ')
}

export const formatNoteDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('fr-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

export const getSheetClassName = (sheetType) => `note-sheet--${sheetType || 'lined'}`

const createPage = ({ title = 'Page 1', sheetType = 'lined', elements = [], background = null } = {}) => {
  const timestamp = nowIso()
  return {
    id: generateId('page'),
    title,
    sheetType,
    createdAt: timestamp,
    updatedAt: timestamp,
    elements,
    background,
    previewText: extractTextPreview({ elements })
  }
}

const createSampleNotebook = (courseName = 'Mathématiques') => {
  const firstPage = createPage({
    title: 'Page 1',
    sheetType: 'grid',
    elements: [
      {
        id: generateId('text'),
        type: 'text',
        x: 120,
        y: 110,
        width: 580,
        height: 72,
        color: '#102a43',
        fontSize: 28,
        text: 'Chapitre 1 - Suites numeriques'
      },
      {
        id: generateId('stroke'),
        type: 'stroke',
        tool: 'pen',
        color: '#0d6efd',
        width: 5,
        opacity: 1,
        points: [
          { x: 122, y: 210 },
          { x: 210, y: 228 },
          { x: 286, y: 194 },
          { x: 360, y: 252 },
          { x: 458, y: 188 },
          { x: 562, y: 242 }
        ]
      },
      {
        id: generateId('text'),
        type: 'text',
        x: 120,
        y: 290,
        width: 620,
        height: 140,
        color: '#334e68',
        fontSize: 20,
        text: 'Objectif: visualiser les variations, annoter les exercices, puis conserver chaque element sous forme editable.'
      }
    ]
  })

  const secondPage = createPage({
    title: 'Exercices',
    sheetType: 'dotted',
    elements: [
      {
        id: generateId('shape'),
        type: 'shape',
        shape: 'rectangle',
        x: 110,
        y: 120,
        width: 520,
        height: 220,
        color: '#f59f00',
        fill: 'rgba(245, 159, 0, 0.14)',
        strokeWidth: 4
      },
      {
        id: generateId('text'),
        type: 'text',
        x: 138,
        y: 154,
        width: 460,
        height: 120,
        color: '#7c2d12',
        fontSize: 22,
        text: '1. Completer la demonstration\n2. Ajouter une correction manuscrite\n3. Marquer les passages importants au surligneur'
      }
    ]
  })

  const timestamp = nowIso()
  return {
    id: generateId('notebook'),
    name: 'Notes de cours',
    courseName,
    color: '#0d6efd',
    isFavorite: true,
    isTrashed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastOpenedAt: timestamp,
    pages: [firstPage, secondPage]
  }
}

const ensureSeedData = (userId, fallbackCourse = 'General') => {
  const key = getStorageKey(userId)
  const current = safeParse(window.localStorage.getItem(key), null)
  if (Array.isArray(current) && current.length > 0) {
    return current
  }

  const seeded = [createSampleNotebook(fallbackCourse)]
  window.localStorage.setItem(key, JSON.stringify(seeded))
  return seeded
}

const readNotebooks = (userId, fallbackCourse) => {
  const notebooks = ensureSeedData(userId, fallbackCourse)
  if (!Array.isArray(notebooks)) return []
  return notebooks.map((notebook) => ({
    ...cloneValue(notebook),
    folderName: notebook.folderName?.trim() || DEFAULT_FOLDER
  }))
}

const writeNotebooks = (userId, notebooks) => {
  const sorted = [...notebooks].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(sorted))
  return sorted.map((notebook) => cloneValue(notebook))
}

const readImportedFiles = (userId) => {
  const files = safeParse(window.localStorage.getItem(getFilesStorageKey(userId)), [])
  return Array.isArray(files) ? files.map((entry) => cloneValue(entry)) : []
}

const writeImportedFiles = (userId, files) => {
  const sorted = [...files].sort(
    (left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  )
  window.localStorage.setItem(getFilesStorageKey(userId), JSON.stringify(sorted))
  return sorted.map((entry) => cloneValue(entry))
}

const withNotebook = (userId, notebookId, updater, fallbackCourse) => {
  const notebooks = readNotebooks(userId, fallbackCourse)
  const nextNotebooks = notebooks.map((notebook) => {
    if (notebook.id !== notebookId) return notebook
    const nextNotebook = cloneValue(notebook)
    updater(nextNotebook)
    nextNotebook.updatedAt = nowIso()
    return nextNotebook
  })

  return writeNotebooks(userId, nextNotebooks)
}

export const listNotebooks = (userId, fallbackCourse) => readNotebooks(userId, fallbackCourse)

export const getNotebookById = (userId, notebookId, fallbackCourse) => {
  const notebooks = readNotebooks(userId, fallbackCourse)
  return notebooks.find((notebook) => notebook.id === notebookId) || null
}

export const createNotebook = (userId, payload, fallbackCourse) => {
  const notebooks = readNotebooks(userId, fallbackCourse)
  const timestamp = nowIso()
  const notebook = {
    id: generateId('notebook'),
    name: payload.name?.trim() || 'Nouveau cahier',
    courseName: payload.courseName?.trim() || fallbackCourse || 'General',
    folderName: payload.folderName?.trim() || DEFAULT_FOLDER,
    color: payload.color || '#0d6efd',
    isFavorite: false,
    isTrashed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastOpenedAt: timestamp,
    pages: [createPage({ title: 'Page 1', sheetType: payload.sheetType || 'lined' })]
  }

  return writeNotebooks(userId, [notebook, ...notebooks]).find((entry) => entry.id === notebook.id)
}

export const createNotebookFromPdf = (userId, payload, fallbackCourse) => {
  const notebooks = readNotebooks(userId, fallbackCourse)
  const timestamp = nowIso()
  const pages = Array.isArray(payload.pages) && payload.pages.length > 0
    ? payload.pages.map((page, index) =>
      createPage({
        title: page.title || `Page ${index + 1}`,
        sheetType: page.sheetType || 'blank',
        elements: Array.isArray(page.elements) ? page.elements : [],
        background: page.background || null
      })
    )
    : [createPage({ title: 'Page 1', sheetType: 'blank' })]

  const notebook = {
    id: generateId('notebook'),
    name: payload.name?.trim() || `Import PDF - ${timestamp.slice(0, 10)}`,
    courseName: payload.courseName?.trim() || fallbackCourse || 'General',
    folderName: payload.folderName?.trim() || DEFAULT_FOLDER,
    color: payload.color || '#0d6efd',
    isFavorite: false,
    isTrashed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastOpenedAt: timestamp,
    sourcePdf: {
      name: payload.pdfName || null,
      pageCount: pages.length,
      importedAt: timestamp
    },
    pages
  }

  return writeNotebooks(userId, [notebook, ...notebooks]).find((entry) => entry.id === notebook.id)
}

export const listImportedFiles = (userId) => readImportedFiles(userId)

export const saveImportedFile = (userId, payload) => {
  const files = readImportedFiles(userId)
  const timestamp = nowIso()
  const name = String(payload.name || 'Fichier importé')
  const lowerName = name.toLowerCase()
  const record = {
    id: generateId('file'),
    name,
    mimeType: payload.mimeType || 'application/octet-stream',
    size: Number(payload.size || 0),
    lastModified: Number(payload.lastModified || Date.now()),
    createdAt: timestamp,
    fileDataUrl: payload.fileDataUrl || null,
    source: payload.source || 'device',
    futureImportType: lowerName.endsWith('.pdf') ? 'pdf' : 'generic',
    status: 'stored'
  }

  return writeImportedFiles(userId, [record, ...files]).find((entry) => entry.id === record.id)
}

export const saveNotebookSnapshot = (userId, notebook, fallbackCourse) => {
  const notebooks = readNotebooks(userId, fallbackCourse)
  const nextNotebooks = notebooks.map((entry) => (entry.id === notebook.id ? cloneValue(notebook) : entry))
  return writeNotebooks(userId, nextNotebooks)
}

export const updateNotebookMeta = (userId, notebookId, updates, fallbackCourse) => {
  const nextNotebooks = withNotebook(
    userId,
    notebookId,
    (notebook) => {
      const nextUpdates = typeof updates === 'function' ? updates(notebook) : updates
      Object.assign(notebook, nextUpdates)
    },
    fallbackCourse
  )
  return nextNotebooks.find((entry) => entry.id === notebookId) || null
}

export const setNotebookFavorite = (userId, notebookId, isFavorite, fallbackCourse) => {
  return updateNotebookMeta(userId, notebookId, { isFavorite }, fallbackCourse)
}

export const setNotebookTrashState = (userId, notebookId, isTrashed, fallbackCourse) => {
  return updateNotebookMeta(userId, notebookId, { isTrashed }, fallbackCourse)
}

export const setNotebookFolder = (userId, notebookId, folderName, fallbackCourse) => {
  return updateNotebookMeta(userId, notebookId, {
    folderName: folderName?.trim() || DEFAULT_FOLDER
  }, fallbackCourse)
}

export const listNotebookFolders = (userId, fallbackCourse) => {
  const notebooks = readNotebooks(userId, fallbackCourse)
  const unique = new Set()
  notebooks.forEach((notebook) => {
    unique.add(notebook.folderName?.trim() || DEFAULT_FOLDER)
  })
  if (unique.size === 0) unique.add(DEFAULT_FOLDER)
  return Array.from(unique).sort((left, right) => left.localeCompare(right, 'fr'))
}

export const renameNotebookFolder = (userId, sourceFolderName, targetFolderName, fallbackCourse) => {
  const source = sourceFolderName?.trim() || DEFAULT_FOLDER
  const target = targetFolderName?.trim() || DEFAULT_FOLDER
  if (source === target) return listNotebooks(userId, fallbackCourse)

  const notebooks = readNotebooks(userId, fallbackCourse)
  const nextNotebooks = notebooks.map((notebook) => {
    if ((notebook.folderName || DEFAULT_FOLDER) !== source) return notebook
    return {
      ...notebook,
      folderName: target,
      updatedAt: nowIso()
    }
  })

  return writeNotebooks(userId, nextNotebooks)
}

export const deleteNotebookFolder = (userId, folderName, fallbackCourse, fallbackTargetFolder = DEFAULT_FOLDER) => {
  const source = folderName?.trim() || DEFAULT_FOLDER
  const target = fallbackTargetFolder?.trim() || DEFAULT_FOLDER

  const notebooks = readNotebooks(userId, fallbackCourse)
  const nextNotebooks = notebooks.map((notebook) => {
    if ((notebook.folderName || DEFAULT_FOLDER) !== source) return notebook
    return {
      ...notebook,
      folderName: target,
      updatedAt: nowIso()
    }
  })

  return writeNotebooks(userId, nextNotebooks)
}

export const duplicateNotebookPage = (userId, notebookId, pageId, fallbackCourse) => {
  const notebooks = withNotebook(
    userId,
    notebookId,
    (notebook) => {
      const pageIndex = notebook.pages.findIndex((page) => page.id === pageId)
      if (pageIndex === -1) return
      const sourcePage = cloneValue(notebook.pages[pageIndex])
      const duplicatedPage = {
        ...sourcePage,
        id: generateId('page'),
        title: `${sourcePage.title} copie`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        elements: sourcePage.elements.map((element) => ({ ...element, id: generateId(element.type) }))
      }
      notebook.pages.splice(pageIndex + 1, 0, duplicatedPage)
    },
    fallbackCourse
  )
  return notebooks.find((entry) => entry.id === notebookId) || null
}

export const addNotebookPage = (userId, notebookId, payload, fallbackCourse) => {
  const notebooks = withNotebook(
    userId,
    notebookId,
    (notebook) => {
      notebook.pages.push(
        createPage({
          title: payload.title || `Page ${notebook.pages.length + 1}`,
          sheetType: payload.sheetType || notebook.pages[notebook.pages.length - 1]?.sheetType || 'lined'
        })
      )
    },
    fallbackCourse
  )
  return notebooks.find((entry) => entry.id === notebookId) || null
}

export const deleteNotebookPage = (userId, notebookId, pageId, fallbackCourse) => {
  const notebooks = withNotebook(
    userId,
    notebookId,
    (notebook) => {
      if (notebook.pages.length <= 1) return
      notebook.pages = notebook.pages.filter((page) => page.id !== pageId)
    },
    fallbackCourse
  )
  return notebooks.find((entry) => entry.id === notebookId) || null
}

export const refreshNotebookPreview = (notebook) => ({
  ...notebook,
  pages: notebook.pages.map((page) => ({
    ...page,
    updatedAt: page.updatedAt || nowIso(),
    previewText: extractTextPreview(page)
  })),
  updatedAt: nowIso(),
  lastOpenedAt: nowIso()
})