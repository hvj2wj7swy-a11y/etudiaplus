import { jsPDF } from 'jspdf'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const PAPER_WIDTH = 900
const PAPER_HEIGHT = 1200
const DEFAULT_FONT = "'Segoe UI', system-ui, -apple-system, sans-serif"

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const fitRect = (sourceWidth, sourceHeight, targetWidth, targetHeight) => {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const drawX = (targetWidth - drawWidth) / 2
  const drawY = (targetHeight - drawHeight) / 2

  return { drawX, drawY, drawWidth, drawHeight }
}

const normalizeRect = (shape) => {
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

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

const drawSheetBackground = (context, page) => {
  context.fillStyle = '#fffefc'
  context.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT)

  const sheetType = page?.sheetType || 'lined'
  if (sheetType === 'blank') return

  context.save()

  if (sheetType === 'lined') {
    context.strokeStyle = 'rgba(37, 99, 235, 0.18)'
    context.lineWidth = 2
    for (let y = 36; y <= PAPER_HEIGHT; y += 44) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(PAPER_WIDTH, y)
      context.stroke()
    }
  }

  if (sheetType === 'grid') {
    context.strokeStyle = 'rgba(37, 99, 235, 0.12)'
    context.lineWidth = 1
    for (let x = 0; x <= PAPER_WIDTH; x += 42) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, PAPER_HEIGHT)
      context.stroke()
    }
    for (let y = 0; y <= PAPER_HEIGHT; y += 42) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(PAPER_WIDTH, y)
      context.stroke()
    }
  }

  if (sheetType === 'dotted') {
    context.fillStyle = 'rgba(37, 99, 235, 0.25)'
    for (let x = 0; x <= PAPER_WIDTH; x += 24) {
      for (let y = 0; y <= PAPER_HEIGHT; y += 24) {
        context.beginPath()
        context.arc(x, y, 1.2, 0, Math.PI * 2)
        context.fill()
      }
    }
  }

  context.restore()
}

const drawTextBlock = (context, element) => {
  const fontSize = Number(element.fontSize || 20)
  const fontFamily = element.fontFamily || DEFAULT_FONT
  const maxWidth = Number(element.maxWidth || element.width || 320)
  const lineHeight = Math.round(fontSize * 1.3)
  const text = String(element.text || '')

  context.fillStyle = element.color || '#111827'
  context.textAlign = element.align || 'left'
  context.textBaseline = 'top'
  context.font = `${fontSize}px ${fontFamily}`

  const paragraphs = text.split('\n')
  let y = Number(element.y || 0)

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    const lines = []

    if (words.length === 0) {
      lines.push('')
    } else {
      let currentLine = words[0]
      for (let index = 1; index < words.length; index += 1) {
        const nextCandidate = `${currentLine} ${words[index]}`
        if (context.measureText(nextCandidate).width <= maxWidth) {
          currentLine = nextCandidate
        } else {
          lines.push(currentLine)
          currentLine = words[index]
        }
      }
      lines.push(currentLine)
    }

    for (const line of lines) {
      const x = clamp(Number(element.x || 0), 0, PAPER_WIDTH)
      const drawX = element.align === 'center' ? x + maxWidth / 2 : element.align === 'right' ? x + maxWidth : x
      context.fillText(line, drawX, y)
      y += lineHeight
    }
  }
}

const drawElement = async (context, element) => {
  if (element.type === 'stroke') {
    if (!Array.isArray(element.points) || element.points.length < 2) return
    context.save()
    context.beginPath()
    context.moveTo(element.points[0].x, element.points[0].y)
    for (let index = 1; index < element.points.length; index += 1) {
      context.lineTo(element.points[index].x, element.points[index].y)
    }
    context.strokeStyle = element.color || '#111827'
    context.lineWidth = Number(element.width || 1)
    context.lineJoin = 'round'
    context.lineCap = 'round'
    context.globalAlpha = Number(element.opacity ?? 1)
    context.stroke()
    context.restore()
    return
  }

  if (element.type === 'shape') {
    context.save()
    const strokeWidth = Number(element.strokeWidth || 3)
    context.lineWidth = strokeWidth
    context.strokeStyle = element.color || '#111827'

    if (element.shape === 'line') {
      context.beginPath()
      context.moveTo(Number(element.x || 0), Number(element.y || 0))
      context.lineTo(Number(element.x2 || 0), Number(element.y2 || 0))
      context.lineCap = 'round'
      context.stroke()
      context.restore()
      return
    }

    const bounds = normalizeRect(element)
    context.fillStyle = element.fill || 'transparent'

    if (element.shape === 'ellipse') {
      context.beginPath()
      context.ellipse(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
        Math.max(bounds.width / 2, 0),
        Math.max(bounds.height / 2, 0),
        0,
        0,
        Math.PI * 2
      )
      if (element.fill && element.fill !== 'transparent') context.fill()
      context.stroke()
      context.restore()
      return
    }

    const radius = 18
    context.beginPath()
    context.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, radius)
    if (element.fill && element.fill !== 'transparent') context.fill()
    context.stroke()
    context.restore()
    return
  }

  if (element.type === 'text') {
    drawTextBlock(context, element)
    return
  }

  if (element.type === 'image' && element.src) {
    try {
      const image = await loadImage(element.src)
      context.drawImage(image, Number(element.x || 0), Number(element.y || 0), Number(element.width || 0), Number(element.height || 0))
    } catch {
      // Ignore image decoding failures and continue export.
    }
  }
}

const drawPageToCanvas = async (page) => {
  const canvas = document.createElement('canvas')
  canvas.width = PAPER_WIDTH
  canvas.height = PAPER_HEIGHT
  const context = canvas.getContext('2d')

  drawSheetBackground(context, page)

  if (page?.background?.src) {
    try {
      const image = await loadImage(page.background.src)
      const fit = fitRect(image.width, image.height, PAPER_WIDTH, PAPER_HEIGHT)
      context.drawImage(image, fit.drawX, fit.drawY, fit.drawWidth, fit.drawHeight)
    } catch {
      // Keep export functional even if a background image cannot be loaded.
    }
  }

  const elements = Array.isArray(page?.elements) ? page.elements : []
  for (const element of elements) {
    await drawElement(context, element)
  }

  return canvas
}

const renderPdfPageBackground = async (pdfPage) => {
  const sourceViewport = pdfPage.getViewport({ scale: 1 })
  const canvas = document.createElement('canvas')
  canvas.width = PAPER_WIDTH
  canvas.height = PAPER_HEIGHT
  const context = canvas.getContext('2d')

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, PAPER_WIDTH, PAPER_HEIGHT)

  const fit = fitRect(sourceViewport.width, sourceViewport.height, PAPER_WIDTH, PAPER_HEIGHT)
  const renderScale = fit.drawWidth / sourceViewport.width
  const renderViewport = pdfPage.getViewport({ scale: renderScale })

  await pdfPage.render({
    canvasContext: context,
    viewport: renderViewport,
    transform: [1, 0, 0, 1, fit.drawX, fit.drawY]
  }).promise

  return canvas.toDataURL('image/jpeg', 0.92)
}

export const importPdfAsNotebookPages = async (file) => {
  const buffer = await file.arrayBuffer()
  const loadingTask = getDocument({ data: new Uint8Array(buffer) })
  const pdf = await loadingTask.promise

  const pages = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const pdfPage = await pdf.getPage(pageNumber)
    const backgroundSrc = await renderPdfPageBackground(pdfPage)
    pages.push({
      title: `Page ${pageNumber}`,
      sheetType: 'blank',
      elements: [],
      background: {
        type: 'pdf-page',
        src: backgroundSrc,
        sourcePageNumber: pageNumber,
        fit: 'contain'
      }
    })
  }

  await loadingTask.destroy()

  return {
    pages,
    pageCount: pdf.numPages,
    pdfName: file.name
  }
}

export const exportNotebookToPdf = async (notebook, options = {}) => {
  const pages = Array.isArray(notebook?.pages) ? notebook.pages : []
  if (pages.length === 0) {
    throw new Error('Le cahier ne contient aucune page a exporter.')
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [PAPER_WIDTH, PAPER_HEIGHT],
    compress: true
  })

  for (let index = 0; index < pages.length; index += 1) {
    if (index > 0) {
      doc.addPage([PAPER_WIDTH, PAPER_HEIGHT], 'portrait')
    }

    const canvas = await drawPageToCanvas(pages[index])
    const imageData = canvas.toDataURL('image/jpeg', 0.94)
    doc.addImage(imageData, 'JPEG', 0, 0, PAPER_WIDTH, PAPER_HEIGHT, undefined, 'FAST')
  }

  const rawName = options.fileName || notebook.name || 'cahier-annote'
  const fileName = rawName.toLowerCase().endsWith('.pdf') ? rawName : `${rawName}.pdf`
  doc.save(fileName)
}
