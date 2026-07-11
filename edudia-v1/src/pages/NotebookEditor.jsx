import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, ButtonGroup, Card, Container, Form } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  PenTool,
  Highlighter,
  Eraser,
  Type,
  FolderOpen,
  Plus,
  Undo2,
  Redo2,
  Image as ImageIcon,
  RectangleHorizontal,
  Circle,
  Slash,
  ArrowRight,
  ChevronLeft,
  Search,
  Share2,
  Settings,
  FileDown,
  PanelsTopLeft,
  Minus,
  Check
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import NotebookPreview from '../components/NotebookPreview.jsx'
import {
  SHEET_TYPES,
  addNotebookPage,
  deleteNotebookPage,
  duplicateNotebookPage,
  formatNoteDate,
  getNotebookById,
  getSheetClassName,
  refreshNotebookPreview,
  saveNotebookSnapshot,
  updateNotebookMeta
} from '../services/noteStore.js'
import { exportNotebookToPdf, importPdfAsNotebookPages } from '../services/pdfNotebook.js'

const PAPER_WIDTH = 900
const PAPER_HEIGHT = 1200
const DEFAULT_TEXT_FONT = "'Segoe UI', system-ui, -apple-system, sans-serif"
const COLOR_PRESETS = ['#111827', '#1f2937', '#4b5563', '#6b7280', '#2563eb', '#0ea5e9', '#10b981', '#f97316', '#ef4444']
const TOOL_OPTIONS = [
  { id: 'pen', label: 'Stylo' },
  { id: 'highlighter', label: 'Surligneur' },
  { id: 'eraser', label: 'Gomme' },
  { id: 'text', label: 'Texte' },
  { id: 'import-pdf', label: 'Importer' },
  { id: 'shape-rectangle', label: 'Rectangle' },
  { id: 'shape-ellipse', label: 'Ellipse' },
  { id: 'shape-line', label: 'Ligne' }
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const buildStrokePath = (points = []) => {
  if (!points.length) return ''
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

const normalizeShapeBounds = (shape) => {
  if (shape.shape === 'line') {
    return {
      x: Math.min(shape.x, shape.x2),
      y: Math.min(shape.y, shape.y2),
      width: Math.abs(shape.x2 - shape.x),
      height: Math.abs(shape.y2 - shape.y)
    }
  }

  return {
    x: shape.width >= 0 ? shape.x : shape.x + shape.width,
    y: shape.height >= 0 ? shape.y : shape.y + shape.height,
    width: Math.abs(shape.width),
    height: Math.abs(shape.height)
  }
}

const getElementBounds = (element) => {
  if (element.type === 'stroke') {
    const xs = element.points.map((point) => point.x)
    const ys = element.points.map((point) => point.y)
    const padding = Math.max(12, (element.width || 1) * 2)
    return {
      x: Math.min(...xs) - padding,
      y: Math.min(...ys) - padding,
      width: Math.max(...xs) - Math.min(...xs) + padding * 2,
      height: Math.max(...ys) - Math.min(...ys) + padding * 2
    }
  }

  if (element.type === 'text' || element.type === 'image') {
    return {
      x: element.x,
      y: element.y,
      width: element.width || 120,
      height: element.height || 48
    }
  }

  if (element.type === 'shape') {
    return normalizeShapeBounds(element)
  }

  return { x: 0, y: 0, width: 0, height: 0 }
}

const pointInBounds = (point, bounds) => {
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height
}

const cloneNotebook = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value))
}

const createShapeDraft = (tool, point, color, strokeWidth) => ({
  id: `draft_${tool}`,
  type: 'shape',
  shape: tool.replace('shape-', ''),
  x: point.x,
  y: point.y,
  x2: point.x,
  y2: point.y,
  width: 0,
  height: 0,
  color,
  fill: tool === 'shape-line' ? 'transparent' : 'rgba(13, 110, 253, 0.06)',
  strokeWidth
})

const createImportedPage = (page, index) => {
  const timestamp = new Date().toISOString()
  return {
    id: `page_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    title: page.title || `Page ${index + 1}`,
    sheetType: page.sheetType || 'blank',
    createdAt: timestamp,
    updatedAt: timestamp,
    elements: Array.isArray(page.elements) ? page.elements : [],
    background: page.background || null,
    previewText: ''
  }
}

export default function NotebookEditor() {
  const { notebookId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notebook, setNotebook] = useState(null)
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [activeTool, setActiveTool] = useState('pen')
  const [color, setColor] = useState('#0d6efd')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [zoom, setZoom] = useState(1)
  const [draftElement, setDraftElement] = useState(null)
  const [editingText, setEditingText] = useState(null)
  const [textFontSize, setTextFontSize] = useState(20)
  const [textFontFamily, setTextFontFamily] = useState(DEFAULT_TEXT_FONT)
  const [textAlign, setTextAlign] = useState('left')
  const [textMaxWidth, setTextMaxWidth] = useState(320)
  const [showToolPanel, setShowToolPanel] = useState(false)
  const [showExtrasMenu, setShowExtrasMenu] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobilePages, setShowMobilePages] = useState(false)
  const [saveState, setSaveState] = useState('Enregistre automatiquement')
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isPreparingImport, setIsPreparingImport] = useState(false)
  const fileInputRef = useRef(null)
  const pdfImportInputRef = useRef(null)
  const surfaceRef = useRef(null)
  const textEditorRef = useRef(null)
  const toolPanelRef = useRef(null)
  const toolbarToolsRef = useRef(null)
  const extrasMenuRef = useRef(null)
  const extrasButtonRef = useRef(null)
  const settingsPanelRef = useRef(null)
  const settingsButtonRef = useRef(null)
  const historyRef = useRef({ past: [], future: [] })
  const autosaveTimerRef = useRef(null)
  const pointerModeRef = useRef(null)
  const fallbackCourse = user?.programme || 'General'

  useEffect(() => {
    if (!user?.id) return
    const found = getNotebookById(user.id, notebookId, fallbackCourse)
    if (!found) {
      navigate('/notes', { replace: true })
      return
    }

    updateNotebookMeta(user.id, notebookId, { lastOpenedAt: new Date().toISOString() }, fallbackCourse)
    setNotebook(found)
    setSelectedPageId((current) => current || found.pages[0]?.id || null)
  }, [fallbackCourse, navigate, notebookId, user?.id])

  useEffect(() => {
    if (!user?.id || !notebook) return
    window.clearTimeout(autosaveTimerRef.current)
    setSaveState('Sauvegarde...')
    autosaveTimerRef.current = window.setTimeout(() => {
      saveNotebookSnapshot(user.id, refreshNotebookPreview(notebook), fallbackCourse)
      setSaveState('Sauvegarde automatique active')
    }, 250)

    return () => window.clearTimeout(autosaveTimerRef.current)
  }, [fallbackCourse, notebook, user?.id])

  const currentPage = useMemo(() => {
    return notebook?.pages?.find((page) => page.id === selectedPageId) || notebook?.pages?.[0] || null
  }, [notebook, selectedPageId])

  const currentPageIndex = useMemo(() => {
    return notebook?.pages?.findIndex((page) => page.id === selectedPageId) ?? -1
  }, [notebook?.pages, selectedPageId])

  const commitNotebookMutation = (mutator) => {
    setNotebook((previous) => {
      if (!previous) return previous
      historyRef.current.past.push(cloneNotebook(previous))
      if (historyRef.current.past.length > 40) historyRef.current.past.shift()
      historyRef.current.future = []
      const nextNotebook = cloneNotebook(previous)
      mutator(nextNotebook)
      return refreshNotebookPreview(nextNotebook)
    })
  }

  const setNotebookWithoutHistory = (nextNotebook) => {
    setNotebook(refreshNotebookPreview(cloneNotebook(nextNotebook)))
  }

  const handleUndo = () => {
    if (!notebook || historyRef.current.past.length === 0) return
    const previous = historyRef.current.past.pop()
    historyRef.current.future.unshift(cloneNotebook(notebook))
    setNotebookWithoutHistory(previous)
  }

  const handleRedo = () => {
    if (!notebook || historyRef.current.future.length === 0) return
    const next = historyRef.current.future.shift()
    historyRef.current.past.push(cloneNotebook(notebook))
    setNotebookWithoutHistory(next)
  }

  const updateCurrentPage = (updater) => {
    commitNotebookMutation((draftNotebook) => {
      draftNotebook.pages = draftNotebook.pages.map((page) => {
        if (page.id !== selectedPageId) return page
        const nextPage = cloneNotebook(page)
        updater(nextPage)
        nextPage.updatedAt = new Date().toISOString()
        return nextPage
      })
    })
  }

  const getSurfacePoint = (event) => {
    const rect = surfaceRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * PAPER_WIDTH, 0, PAPER_WIDTH),
      y: clamp(((event.clientY - rect.top) / rect.height) * PAPER_HEIGHT, 0, PAPER_HEIGHT)
    }
  }

  useEffect(() => {
    if (!editingText) return
    const focusId = window.requestAnimationFrame(() => {
      const textNode = textEditorRef.current
      if (!textNode) return
      if (document.activeElement !== textNode) {
        textNode.focus()
        const textLength = textNode.value.length
        textNode.setSelectionRange(textLength, textLength)
      }
    })

    return () => window.cancelAnimationFrame(focusId)
  }, [editingText?.sessionId])

  const startTextEditing = (point, existingElement = null) => {
    const source = existingElement || {}
    const nextFontSize = Number(source.fontSize || textFontSize || 20)
    const nextFontFamily = source.fontFamily || textFontFamily || DEFAULT_TEXT_FONT
    const nextAlign = source.align || textAlign || 'left'
    const nextMaxWidth = Number(source.maxWidth || source.width || textMaxWidth || 320)

    setTextFontSize(nextFontSize)
    setTextFontFamily(nextFontFamily)
    setTextAlign(nextAlign)
    setTextMaxWidth(nextMaxWidth)

    setEditingText({
      sessionId: `text_session_${Date.now()}`,
      elementId: source.id || null,
      x: Number(source.x ?? point.x),
      y: Number(source.y ?? point.y),
      text: String(source.text || ''),
      fontSize: nextFontSize,
      fontFamily: nextFontFamily,
      color: source.color || color,
      align: nextAlign,
      maxWidth: nextMaxWidth,
      width: nextMaxWidth,
      minHeight: Number(source.minHeight || 96)
    })
  }

  const eraseAtPoint = (point) => {
    updateCurrentPage((page) => {
      const reversed = [...page.elements].reverse()
      const match = reversed.find((element) => pointInBounds(point, getElementBounds(element)))
      if (!match) return
      page.elements = page.elements.filter((element) => element.id !== match.id)
    })
  }

  const handlePointerDown = (event) => {
    if (!currentPage || editingText) return
    const point = getSurfacePoint(event)

    if (activeTool === 'eraser') {
      surfaceRef.current?.setPointerCapture?.(event.pointerId)
      pointerModeRef.current = 'erase'
      eraseAtPoint(point)
      return
    }

    if (activeTool === 'text') {
      startTextEditing(point)
      return
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      surfaceRef.current?.setPointerCapture?.(event.pointerId)
      pointerModeRef.current = 'draw'
      setDraftElement({
        id: `draft_stroke_${Date.now()}`,
        type: 'stroke',
        tool: activeTool,
        color,
        width: strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.35 : 1,
        pointerType: event.pointerType,
        points: [point]
      })
      return
    }

    if (activeTool.startsWith('shape-')) {
      surfaceRef.current?.setPointerCapture?.(event.pointerId)
      pointerModeRef.current = 'shape'
      setDraftElement(createShapeDraft(activeTool, point, color, strokeWidth))
    }
  }

  const handlePointerMove = (event) => {
    const point = getSurfacePoint(event)

    if (pointerModeRef.current === 'erase') {
      eraseAtPoint(point)
      return
    }

    setDraftElement((previous) => {
      if (!previous) return previous
      if (previous.type === 'stroke') {
        return { ...previous, points: [...previous.points, point] }
      }

      if (previous.type === 'shape') {
        if (previous.shape === 'line') {
          return { ...previous, x2: point.x, y2: point.y }
        }

        return { ...previous, width: point.x - previous.x, height: point.y - previous.y }
      }

      return previous
    })
  }

  const handlePointerUp = () => {
    pointerModeRef.current = null
    if (!draftElement) return

    if (draftElement.type === 'stroke' && draftElement.points.length > 1) {
      updateCurrentPage((page) => {
        page.elements.push({ ...draftElement, id: `stroke_${Date.now()}` })
      })
    }

    if (draftElement.type === 'shape') {
      const bounds = getElementBounds(draftElement)
      if (bounds.width > 6 || bounds.height > 6) {
        updateCurrentPage((page) => {
          page.elements.push({ ...draftElement, id: `shape_${Date.now()}` })
        })
      }
    }

    setDraftElement(null)
  }

  const commitTextElement = ({ shouldSave }) => {
    if (!editingText) return

    if (!shouldSave) {
      setEditingText(null)
      return
    }

    const normalizedText = editingText.text.trim()
    if (!normalizedText) {
      setEditingText(null)
      return
    }

    updateCurrentPage((page) => {
      const payload = {
        type: 'text',
        x: editingText.x,
        y: editingText.y,
        text: normalizedText,
        fontSize: Number(editingText.fontSize || textFontSize || 20),
        fontFamily: editingText.fontFamily || textFontFamily || DEFAULT_TEXT_FONT,
        color: editingText.color || color,
        align: editingText.align || textAlign || 'left',
        maxWidth: Number(editingText.maxWidth || textMaxWidth || 320),
        width: Number(editingText.maxWidth || textMaxWidth || 320),
        minHeight: Number(editingText.minHeight || 96)
      }

      if (editingText.elementId) {
        page.elements = page.elements.map((element) => {
          if (element.id !== editingText.elementId) return element
          return {
            ...element,
            ...payload,
            id: element.id
          }
        })
        return
      }

      page.elements.push({
        id: `text_${Date.now()}`,
        ...payload
      })
    })

    setEditingText(null)
  }

  const handleExistingTextDoubleClick = (event, element) => {
    event.stopPropagation()
    if (editingText) return
    setActiveTool('text')
    startTextEditing({ x: element.x, y: element.y }, element)
  }

  const triggerImageInsertion = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    }).catch(() => '')

    if (!dataUrl) return

    updateCurrentPage((page) => {
      page.elements.push({
        id: `image_${Date.now()}`,
        type: 'image',
        x: 160,
        y: 180,
        width: 340,
        height: 220,
        src: dataUrl,
        fileName: file.name
      })
    })

    event.target.value = ''
  }

  const addPage = () => {
    const updatedNotebook = addNotebookPage(
      user.id,
      notebook.id,
      { title: `Page ${notebook.pages.length + 1}`, sheetType: currentPage?.sheetType || 'lined' },
      fallbackCourse
    )
    setNotebook(updatedNotebook)
    setSelectedPageId(updatedNotebook.pages[updatedNotebook.pages.length - 1].id)
  }

  const duplicatePage = () => {
    const updatedNotebook = duplicateNotebookPage(user.id, notebook.id, selectedPageId, fallbackCourse)
    setNotebook(updatedNotebook)
  }

  const deletePage = () => {
    const updatedNotebook = deleteNotebookPage(user.id, notebook.id, selectedPageId, fallbackCourse)
    setNotebook(updatedNotebook)
    setSelectedPageId(updatedNotebook.pages[Math.max(0, currentPageIndex - 1)]?.id || updatedNotebook.pages[0]?.id)
  }

  const handleSheetTypeChange = (nextSheetType) => {
    updateCurrentPage((page) => {
      page.sheetType = nextSheetType
    })
  }

  const handleToolSelect = (toolId) => {
    setActiveTool(toolId)
    setShowToolPanel(true)
    setShowExtrasMenu(false)
  }

  const handleExtraToolSelect = (toolId) => {
    if (toolId === 'image') {
      triggerImageInsertion()
      setShowExtrasMenu(false)
      return
    }

    if (toolId === 'arrow') {
      setActiveTool('shape-line')
      setShowToolPanel(true)
      setShowExtrasMenu(false)
      return
    }

    handleToolSelect(toolId)
  }

  const handleImportButtonClick = () => {
    pdfImportInputRef.current?.click()
  }

  const handlePdfImportSelection = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const lowerName = file.name.toLowerCase()
    const isPdfByType = file.type === 'application/pdf'
    const isPdfByExtension = lowerName.endsWith('.pdf')
    if (!isPdfByType && !isPdfByExtension) {
      window.alert('Seuls les fichiers PDF (.pdf) sont acceptes.')
      event.target.value = ''
      return
    }

    setIsPreparingImport(true)
    setSaveState('Import PDF...')

    try {
      const imported = await importPdfAsNotebookPages(file)
      if (!Array.isArray(imported.pages) || imported.pages.length === 0) {
        window.alert('Le PDF ne contient aucune page importable.')
        return
      }

      const importedPages = imported.pages.map((page, index) => createImportedPage(page, index))
      const firstImportedPageId = importedPages[0].id

      commitNotebookMutation((draftNotebook) => {
        draftNotebook.pages = [...draftNotebook.pages, ...importedPages]
      })

      setSelectedPageId(firstImportedPageId)
      setShowMobilePages(false)
      setSaveState('PDF importe')
    } catch {
      setSaveState('Import impossible')
      window.alert('Import impossible. Verifiez le fichier PDF et reessayez.')
    } finally {
      window.setTimeout(() => setSaveState('Sauvegarde automatique active'), 1200)
      setIsPreparingImport(false)
    }

    event.target.value = ''
  }

  const handleExportPdf = async () => {
    if (!notebook || isExportingPdf) return

    setIsExportingPdf(true)
    setSaveState('Export PDF...')

    try {
      await exportNotebookToPdf(notebook, { fileName: `${notebook.name || 'cahier'}-annote.pdf` })
      setSaveState('PDF exporte')
    } catch {
      setSaveState('Export impossible')
    } finally {
      window.setTimeout(() => setSaveState('Sauvegarde automatique active'), 1200)
      setIsExportingPdf(false)
    }
  }

  useEffect(() => {
    const handleOutside = (event) => {
      const inPanel = toolPanelRef.current?.contains(event.target)
      const inTools = toolbarToolsRef.current?.contains(event.target)
      const inExtras = extrasMenuRef.current?.contains(event.target)
      const inExtrasButton = extrasButtonRef.current?.contains(event.target)
      const inSettings = settingsPanelRef.current?.contains(event.target)
      const inSettingsButton = settingsButtonRef.current?.contains(event.target)

      if (!inPanel && !inTools) {
        setShowToolPanel(false)
      }

      if (!inExtras && !inExtrasButton) {
        setShowExtrasMenu(false)
      }

      if (!inSettings && !inSettingsButton) {
        setShowSettingsPanel(false)
      }
    }

    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [])

  if (!notebook || !currentPage) {
    return null
  }

  return (
    <Container fluid className="notes-editor-page px-0">
      <div className="notes-editor-toolbar">
        <div className="notes-editor-topbar">
          <div className="notes-editor-topbar__left">
            <Button as={Link} to="/notes" variant="light" className="notes-tool-button" title="Retour" aria-label="Retour">
              <ChevronLeft size={18} />
            </Button>
            <div className="notes-editor-title-wrap">
              <div className="fw-semibold">{notebook.name}</div>
              <div className="text-muted small">{notebook.courseName}</div>
            </div>
          </div>

          <div className="notes-editor-topbar__center">
            <div className="notes-search-shell" role="search">
              <Search size={15} />
              <input
                type="search"
                placeholder="Rechercher dans la note"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Rechercher"
              />
            </div>
          </div>

          <div className="notes-editor-topbar__right">
            <Badge bg="light" text="dark" className="notes-save-badge">{saveState}</Badge>
            <Button
              variant="light"
              className="notes-tool-button"
              title="Exporter le PDF annote"
              aria-label="Exporter le PDF annote"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
            >
              <FileDown size={16} />
            </Button>
            <Button variant="light" className="notes-tool-button" title="Partager" aria-label="Partager">
              <Share2 size={16} />
            </Button>
            <Button
              ref={settingsButtonRef}
              variant="light"
              className="notes-tool-button"
              title="Parametres"
              aria-label="Parametres"
              onClick={() => setShowSettingsPanel((value) => !value)}
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        <div className="notes-editor-toolbar__group notes-editor-toolbar__group--tools notes-primary-tools" ref={toolbarToolsRef}>
          <ButtonGroup className="notes-tool-strip" aria-label="Outils principaux">
            {TOOL_OPTIONS.filter((tool) => ['pen', 'highlighter', 'eraser', 'text', 'import-pdf'].includes(tool.id)).map((tool) => {
              const iconByTool = {
                pen: <PenTool size={16} />,
                highlighter: <Highlighter size={16} />,
                eraser: <Eraser size={16} />,
                text: <Type size={16} />,
                'import-pdf': <FolderOpen size={16} />
              }

              return (
              <Button
                key={tool.id}
                variant="light"
                className={`notes-tool-button ${activeTool === tool.id && tool.id !== 'import-pdf' ? 'is-active' : ''}`}
                onClick={() => {
                  if (tool.id === 'import-pdf') {
                    handleImportButtonClick()
                    return
                  }
                  handleToolSelect(tool.id)
                }}
                title={tool.label}
                aria-label={tool.label}
              >
                {iconByTool[tool.id]}
              </Button>
              )
            })}

            <Button
              ref={extrasButtonRef}
              variant="light"
              className={`notes-tool-button ${showExtrasMenu ? 'is-active' : ''}`}
              title="Outils supplementaires"
              aria-label="Outils supplementaires"
              onClick={() => setShowExtrasMenu((value) => !value)}
            >
              <Plus size={16} />
            </Button>
          </ButtonGroup>

          {showExtrasMenu && (
            <div className="notes-extras-menu" ref={extrasMenuRef}>
              <button type="button" onClick={() => handleExtraToolSelect('shape-rectangle')}>
                <RectangleHorizontal size={15} /> Rectangle
              </button>
              <button type="button" onClick={() => handleExtraToolSelect('shape-ellipse')}>
                <Circle size={15} /> Cercle
              </button>
              <button type="button" onClick={() => handleExtraToolSelect('shape-line')}>
                <Slash size={15} /> Ligne
              </button>
              <button type="button" onClick={() => handleExtraToolSelect('arrow')}>
                <ArrowRight size={15} /> Fleche
              </button>
              <button type="button" onClick={() => handleExtraToolSelect('image')}>
                <ImageIcon size={15} /> Image
              </button>
            </div>
          )}

          <Button variant="light" className="notes-tool-button" onClick={handleUndo} disabled={historyRef.current.past.length === 0} title="Annuler" aria-label="Annuler">
            <Undo2 size={16} />
          </Button>
          <Button variant="light" className="notes-tool-button" onClick={handleRedo} disabled={historyRef.current.future.length === 0} title="Retablir" aria-label="Retablir">
            <Redo2 size={16} />
          </Button>
          <Button variant="light" className="notes-tool-button" onClick={() => setShowMobilePages((current) => !current)} title="Pages" aria-label="Pages">
            <PanelsTopLeft size={16} />
          </Button>

          {showSettingsPanel && (
            <div className="notes-settings-panel" ref={settingsPanelRef}>
              <div className="notes-tool-panel__section">
                <div className="notes-tool-panel__label">Type de feuille</div>
                <Form.Select className="notes-sheet-type-select" value={currentPage.sheetType} onChange={(event) => handleSheetTypeChange(event.target.value)}>
                  {SHEET_TYPES.map((sheetType) => (
                    <option key={sheetType.id} value={sheetType.id}>{sheetType.label}</option>
                  ))}
                </Form.Select>
              </div>

              <div className="notes-tool-panel__section">
                <div className="notes-tool-panel__label">Zoom</div>
                <ButtonGroup className="notes-zoom-group" aria-label="Zoom">
                  <Button variant="light" className="notes-tool-button" onClick={() => setZoom((value) => clamp(Number((value - 0.1).toFixed(2)), 0.6, 2))} title="Reduire">
                    <Minus size={15} />
                  </Button>
                  <Button variant="light" className="notes-zoom-label" disabled>{Math.round(zoom * 100)}%</Button>
                  <Button variant="light" className="notes-tool-button" onClick={() => setZoom((value) => clamp(Number((value + 0.1).toFixed(2)), 0.6, 2))} title="Agrandir">
                    <Plus size={15} />
                  </Button>
                </ButtonGroup>
              </div>

              <div className="notes-tool-panel__section">
                <div className="notes-tool-panel__label">Sauvegarde</div>
                <div className="notes-settings-save"><Check size={14} /> {saveState}</div>
              </div>
            </div>
          )}
        </div>

        {showToolPanel && (
          <div className="notes-tool-panel" ref={toolPanelRef}>
            {(activeTool === 'pen' || activeTool === 'highlighter' || activeTool.startsWith('shape-') || activeTool === 'text' || Boolean(editingText)) && (
              <>
                <div className="notes-tool-panel__section">
                  <div className="notes-tool-panel__label">Couleur</div>
                  <div className="notes-color-palette">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`notes-color-dot ${color === preset ? 'is-active' : ''}`}
                        style={{ '--dot-color': preset }}
                        onClick={() => {
                          setColor(preset)
                          setEditingText((current) => (current ? { ...current, color: preset } : current))
                        }}
                        title={`Couleur ${preset}`}
                        aria-label={`Couleur ${preset}`}
                      />
                    ))}
                    <label className="notes-color-add" title="Couleur personnalisee" aria-label="Couleur personnalisee">
                      +
                      <input
                        type="color"
                        value={color}
                        onChange={(event) => {
                          const nextColor = event.target.value
                          setColor(nextColor)
                          setEditingText((current) => (current ? { ...current, color: nextColor } : current))
                        }}
                      />
                    </label>
                  </div>
                </div>

                {(activeTool === 'pen' || activeTool === 'highlighter' || activeTool.startsWith('shape-')) && (
                  <div className="notes-tool-panel__section">
                    <div className="notes-tool-panel__label">Epaisseur <span>{strokeWidth}px</span></div>
                    <Form.Range className="notes-compact-range" min={2} max={20} value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))} />
                  </div>
                )}

                {(activeTool === 'text' || Boolean(editingText)) && (
                  <>
                    <div className="notes-tool-panel__section">
                      <div className="notes-tool-panel__label">Police</div>
                      <Form.Select
                        className="notes-compact-select"
                        value={textFontFamily}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setTextFontFamily(nextValue)
                          setEditingText((current) => (current ? { ...current, fontFamily: nextValue } : current))
                        }}
                      >
                        <option value={DEFAULT_TEXT_FONT}>Systeme</option>
                        <option value="'Georgia', serif">Georgia</option>
                        <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                        <option value="'Courier New', monospace">Courier</option>
                      </Form.Select>
                    </div>

                    <div className="notes-tool-panel__section">
                      <div className="notes-tool-panel__label">Taille <span>{textFontSize}px</span></div>
                      <Form.Range
                        className="notes-compact-range"
                        min={10}
                        max={72}
                        value={textFontSize}
                        onChange={(event) => {
                          const nextValue = clamp(Number(event.target.value) || 20, 10, 72)
                          setTextFontSize(nextValue)
                          setEditingText((current) => (current ? { ...current, fontSize: nextValue } : current))
                        }}
                      />
                    </div>

                    <div className="notes-tool-panel__section">
                      <div className="notes-tool-panel__label">Alignement</div>
                      <ButtonGroup className="notes-compact-toggle">
                        {[
                          { id: 'left', label: 'G' },
                          { id: 'center', label: 'C' },
                          { id: 'right', label: 'D' }
                        ].map((option) => (
                          <Button
                            key={option.id}
                            variant="light"
                            className={textAlign === option.id ? 'is-active' : ''}
                            onClick={() => {
                              setTextAlign(option.id)
                              setEditingText((current) => (current ? { ...current, align: option.id } : current))
                            }}
                            title={option.id}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </ButtonGroup>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="notes-editor-layout">
        <aside className={`notes-editor-sidebar ${showMobilePages ? 'is-open' : ''}`}>
          <Card className="notes-panel-card shadow-sm h-100 border-0 rounded-0 rounded-lg-4">
            <Card.Body className="d-grid gap-3">
              <div className="d-flex justify-content-between align-items-center gap-2">
                <div>
                  <div className="fw-semibold">Pages</div>
                  <div className="text-muted small">{notebook.pages.length} page(s)</div>
                </div>
                <Button size="sm" onClick={addPage}>Ajouter</Button>
              </div>

              <div className="d-grid gap-3 notes-page-list">
                {notebook.pages.map((page, index) => (
                  <button
                    type="button"
                    key={page.id}
                    className={`notes-page-list__item ${page.id === selectedPageId ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedPageId(page.id)
                      setShowMobilePages(false)
                    }}
                  >
                    <NotebookPreview page={page} color={notebook.color} compact />
                    <div className="text-start">
                      <div className="fw-semibold">Page {index + 1}</div>
                      <div className="small text-muted">{page.title}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="d-grid gap-2 mt-auto">
                <Button variant="outline-secondary" onClick={duplicatePage}>Dupliquer la page</Button>
                <Button variant="outline-danger" onClick={deletePage} disabled={notebook.pages.length === 1}>Supprimer la page</Button>
              </div>
            </Card.Body>
          </Card>
        </aside>

        <main className="notes-editor-workspace">
          <div className="notes-editor-canvas-shell">
            <div
              ref={surfaceRef}
              className={`notes-editor-surface ${getSheetClassName(currentPage.sheetType)}`}
              style={{ '--editor-zoom': zoom, '--paper-color': notebook.color }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className={`notes-editor-surface__paper ${currentPage.background?.src ? 'has-page-background' : ''}`}>
                {currentPage.background?.src && (
                  <img
                    className="notes-editor-surface__background"
                    src={currentPage.background.src}
                    alt={`Fond PDF ${currentPage.title || ''}`}
                    draggable="false"
                  />
                )}
                <div className="notes-editor-surface__margin" />
                <svg className="notes-editor-surface__svg" viewBox={`0 0 ${PAPER_WIDTH} ${PAPER_HEIGHT}`} aria-hidden="true">
                  {currentPage.elements.map((element) => {
                    if (element.type === 'stroke') {
                      return (
                        <path
                          key={element.id}
                          d={buildStrokePath(element.points)}
                          fill="none"
                          stroke={element.color}
                          strokeWidth={element.width}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={element.opacity ?? 1}
                        />
                      )
                    }

                    if (element.type === 'shape') {
                      if (element.shape === 'ellipse') {
                        const bounds = normalizeShapeBounds(element)
                        return (
                          <ellipse
                            key={element.id}
                            cx={bounds.x + bounds.width / 2}
                            cy={bounds.y + bounds.height / 2}
                            rx={bounds.width / 2}
                            ry={bounds.height / 2}
                            stroke={element.color}
                            strokeWidth={element.strokeWidth || 3}
                            fill={element.fill || 'transparent'}
                          />
                        )
                      }

                      if (element.shape === 'line') {
                        return (
                          <line
                            key={element.id}
                            x1={element.x}
                            y1={element.y}
                            x2={element.x2}
                            y2={element.y2}
                            stroke={element.color}
                            strokeWidth={element.strokeWidth || 3}
                            strokeLinecap="round"
                          />
                        )
                      }

                      const bounds = normalizeShapeBounds(element)
                      return (
                        <rect
                          key={element.id}
                          x={bounds.x}
                          y={bounds.y}
                          width={bounds.width}
                          height={bounds.height}
                          stroke={element.color}
                          strokeWidth={element.strokeWidth || 3}
                          fill={element.fill || 'transparent'}
                          rx="18"
                        />
                      )
                    }

                    if (element.type === 'image') {
                      return <image key={element.id} href={element.src} x={element.x} y={element.y} width={element.width} height={element.height} preserveAspectRatio="xMidYMid slice" />
                    }

                    return null
                  })}

                  {draftElement?.type === 'stroke' && (
                    <path
                      d={buildStrokePath(draftElement.points)}
                      fill="none"
                      stroke={draftElement.color}
                      strokeWidth={draftElement.width}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={draftElement.opacity ?? 1}
                    />
                  )}

                  {draftElement?.type === 'shape' && draftElement.shape === 'line' && (
                    <line
                      x1={draftElement.x}
                      y1={draftElement.y}
                      x2={draftElement.x2}
                      y2={draftElement.y2}
                      stroke={draftElement.color}
                      strokeWidth={draftElement.strokeWidth}
                      strokeLinecap="round"
                    />
                  )}

                  {draftElement?.type === 'shape' && draftElement.shape === 'rectangle' && (() => {
                    const bounds = normalizeShapeBounds(draftElement)
                    return (
                      <rect
                        x={bounds.x}
                        y={bounds.y}
                        width={bounds.width}
                        height={bounds.height}
                        stroke={draftElement.color}
                        strokeWidth={draftElement.strokeWidth}
                        fill={draftElement.fill}
                        rx="18"
                      />
                    )
                  })()}

                  {draftElement?.type === 'shape' && draftElement.shape === 'ellipse' && (() => {
                    const bounds = normalizeShapeBounds(draftElement)
                    return (
                      <ellipse
                        cx={bounds.x + bounds.width / 2}
                        cy={bounds.y + bounds.height / 2}
                        rx={bounds.width / 2}
                        ry={bounds.height / 2}
                        stroke={draftElement.color}
                        strokeWidth={draftElement.strokeWidth}
                        fill={draftElement.fill}
                      />
                    )
                  })()}
                </svg>

                {currentPage.elements
                  .filter((element) => element.type === 'text' && element.id !== editingText?.elementId)
                  .map((element) => (
                    <div
                      key={element.id}
                      className="notes-editor-text-element"
                      onDoubleClick={(event) => handleExistingTextDoubleClick(event, element)}
                      title="Double-cliquer pour modifier"
                      style={{
                        left: `${(element.x / PAPER_WIDTH) * 100}%`,
                        top: `${(element.y / PAPER_HEIGHT) * 100}%`,
                        width: `${((element.maxWidth || element.width || 320) / PAPER_WIDTH) * 100}%`,
                        minHeight: `${((element.minHeight || element.height || 96) / PAPER_HEIGHT) * 100}%`,
                        color: element.color,
                        fontSize: `${element.fontSize || 20}px`,
                        fontFamily: element.fontFamily || DEFAULT_TEXT_FONT,
                        textAlign: element.align || 'left'
                      }}
                    >
                      {element.text}
                    </div>
                  ))}

                {editingText && (
                  <textarea
                    ref={textEditorRef}
                    className="notes-editor-textarea"
                    style={{
                      left: `${(editingText.x / PAPER_WIDTH) * 100}%`,
                      top: `${(editingText.y / PAPER_HEIGHT) * 100}%`,
                      width: `${((editingText.maxWidth || editingText.width || 320) / PAPER_WIDTH) * 100}%`,
                      minHeight: `${((editingText.minHeight || 96) / PAPER_HEIGHT) * 100}%`,
                      color: editingText.color,
                      fontSize: `${editingText.fontSize}px`,
                      fontFamily: editingText.fontFamily || DEFAULT_TEXT_FONT,
                      textAlign: editingText.align || 'left'
                    }}
                    value={editingText.text}
                    onChange={(event) => setEditingText((current) => ({ ...current, text: event.target.value }))}
                    onPointerDown={(event) => event.stopPropagation()}
                    onMouseDown={(event) => event.stopPropagation()}
                    onBlur={() => commitTextElement({ shouldSave: true })}
                    onKeyDown={(event) => {
                      event.stopPropagation()
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        event.preventDefault()
                        commitTextElement({ shouldSave: true })
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        commitTextElement({ shouldSave: false })
                      }
                    }}
                    onKeyUp={(event) => event.stopPropagation()}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handleImageUpload} />
      <input ref={pdfImportInputRef} type="file" accept="application/pdf,.pdf" className="d-none" onChange={handlePdfImportSelection} />
    </Container>
  )
}