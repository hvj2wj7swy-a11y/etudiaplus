import React from 'react'
import { getSheetClassName } from '../services/noteStore.js'

const buildPath = (points = []) => {
  if (!points.length) return ''
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

export default function NotebookPreview({ page, color = '#0d6efd', compact = false }) {
  const elements = Array.isArray(page?.elements) ? page.elements.slice(0, 8) : []
  const hasBackground = Boolean(page?.background?.src)

  return (
    <div className={`notebook-preview ${compact ? 'notebook-preview--compact' : ''}`}>
      <div className={`notebook-preview__sheet ${getSheetClassName(page?.sheetType)} ${hasBackground ? 'has-page-background' : ''}`} style={{ '--notebook-preview-accent': color }}>
        {hasBackground && (
          <img
            src={page.background.src}
            alt={`Fond PDF ${page?.title || ''}`}
            className="notebook-preview__background"
            draggable="false"
          />
        )}
        <div className="notebook-preview__margin" />
        <svg className="notebook-preview__svg" viewBox="0 0 900 1200" aria-hidden="true">
          {elements.map((element) => {
            if (element.type === 'stroke') {
              return (
                <path
                  key={element.id}
                  d={buildPath(element.points)}
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
                return (
                  <ellipse
                    key={element.id}
                    cx={element.x + Math.abs(element.width) / 2}
                    cy={element.y + Math.abs(element.height) / 2}
                    rx={Math.abs(element.width) / 2}
                    ry={Math.abs(element.height) / 2}
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

              return (
                <rect
                  key={element.id}
                  x={element.x}
                  y={element.y}
                  width={Math.abs(element.width)}
                  height={Math.abs(element.height)}
                  stroke={element.color}
                  strokeWidth={element.strokeWidth || 3}
                  fill={element.fill || 'transparent'}
                  rx="18"
                />
              )
            }

            if (element.type === 'text') {
              return (
                <text
                  key={element.id}
                  x={element.x}
                  y={element.y + (element.fontSize || 18)}
                  fill={element.color}
                  fontSize={element.fontSize || 18}
                  fontWeight="600"
                >
                  {String(element.text || '').slice(0, 48)}
                </text>
              )
            }

            if (element.type === 'image') {
              return (
                <rect
                  key={element.id}
                  x={element.x}
                  y={element.y}
                  width={element.width}
                  height={element.height}
                  fill="rgba(15, 23, 42, 0.08)"
                  stroke="rgba(15, 23, 42, 0.18)"
                  rx="18"
                />
              )
            }

            return null
          })}
        </svg>
      </div>
    </div>
  )
}