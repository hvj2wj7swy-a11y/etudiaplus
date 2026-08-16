import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap'

const createEvaluation = () => ({
  id: crypto.randomUUID(),
  name: '',
  weight: '',
  grade: ''
})

export default function CalculateurNotes() {
  const [evaluations, setEvaluations] = useState(() => {
  const saved = localStorage.getItem('etudiaplus_grade_evaluations')

  if (!saved) {
    return [createEvaluation()]
  }

  try {
    const parsed = JSON.parse(saved)

    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [createEvaluation()]
  } catch {
    return [createEvaluation()]
  }
})

const [targetGrade, setTargetGrade] = useState(() => {
  return localStorage.getItem('etudiaplus_grade_target') || '80'
})

useEffect(() => {
  localStorage.setItem(
    'etudiaplus_grade_evaluations',
    JSON.stringify(evaluations)
  )
}, [evaluations])

useEffect(() => {
  localStorage.setItem(
    'etudiaplus_grade_target',
    targetGrade
  )
}, [targetGrade])

  const currentAverage = useMemo(() => {
    let totalWeightedGrades = 0
    let totalWeight = 0

    evaluations.forEach((evaluation) => {
      const weight = Number(evaluation.weight)
      const grade = Number(evaluation.grade)

      if (
        Number.isFinite(weight) &&
        Number.isFinite(grade) &&
        weight > 0
      ) {
        totalWeightedGrades += grade * weight
        totalWeight += weight
      }
    })

    if (totalWeight === 0) return null

    return totalWeightedGrades / totalWeight
  }, [evaluations])

    const targetCalculation = useMemo(() => {
    let completedWeight = 0
    let earnedPoints = 0

    evaluations.forEach((evaluation) => {
      const weight = Number(evaluation.weight)
      const grade = Number(evaluation.grade)

      if (
        Number.isFinite(weight) &&
        Number.isFinite(grade) &&
        weight > 0
      ) {
        completedWeight += weight
        earnedPoints += (grade * weight) / 100
      }
    })

    const target = Number(targetGrade)
    const remainingWeight = 100 - completedWeight

    if (
      !Number.isFinite(target) ||
      remainingWeight <= 0
    ) {
      return null
    }

    const requiredGrade =
      ((target - earnedPoints) / remainingWeight) * 100

    return {
      completedWeight,
      remainingWeight,
      requiredGrade
    }
  }, [evaluations, targetGrade])

  return (
    <Container className="py-4">
      <h1>Calculateur de notes</h1>

      <p className="text-muted">
        Ajoute tes évaluations pour calculer automatiquement ta moyenne.
      </p>

      <Card className="mt-4">
        <Card.Body>
          <h2 className="h5 mb-3">Mes évaluations</h2>

          {evaluations.map((evaluation) => (
            <Row key={evaluation.id} className="g-3 mb-3">
              <Col md={5}>
                <Form.Control
                  type="text"
                  placeholder="Examen 1"
                  value={evaluation.name}
                  onChange={(e) => {
  setEvaluations((current) =>
    current.map((item) =>
      item.id === evaluation.id
        ? { ...item, name: e.target.value }
        : item
    )
  )
}}
                />
              </Col>

              <Col md={3}>
                <Form.Control
                  type="number"
                  placeholder="Pondération %"
                  value={evaluation.weight}
                  onChange={(e) => {
  setEvaluations((current) =>
    current.map((item) =>
      item.id === evaluation.id
        ? { ...item, weight: e.target.value }
        : item
    )
  )
}}
                />
              </Col>

              <Col md={3}>
                <Form.Control
                  type="number"
                  placeholder="Note %"
                  value={evaluation.grade}
                  onChange={(e) => {
  setEvaluations((current) =>
    current.map((item) =>
      item.id === evaluation.id
        ? { ...item, grade: e.target.value }
        : item
    )
  )
}}
                />
                            </Col>

              <Col md={1}>
                <Button
                  variant="outline-danger"
                  className="w-100"
                  onClick={() => {
                    setEvaluations((current) =>
                      current.filter(
                        (item) => item.id !== evaluation.id
                      )
                    )
                  }}
                  disabled={evaluations.length === 1}
                >
                  ×
                </Button>
              </Col>
            </Row>
          ))}

          <Button
  variant="primary"
  onClick={() => {
    setEvaluations((current) => [
      ...current,
      createEvaluation()
    ])
  }}
>
  + Ajouter une évaluation
</Button>
        </Card.Body>
      </Card>
            <Card className="mt-4">
        <Card.Body>
          <h2 className="h5">Moyenne actuelle</h2>

          {currentAverage === null ? (
            <p className="text-muted mb-0">
              Entre tes notes et leurs pondérations pour voir ta moyenne.
            </p>
          ) : (
            <div className="display-4 fw-bold">
              {currentAverage.toFixed(1)} %
            </div>
          )}
        </Card.Body>
      </Card>
            <Card className="mt-4">
        <Card.Body>
          <h2 className="h5 mb-3">Objectif de note</h2>

          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label>Objectif final (%)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                max="100"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
              />
            </Col>

            <Col md={8}>
              {targetCalculation ? (
                <div>
                  <p className="mb-1">
                    Pondération complétée :{' '}
                    <strong>
                      {targetCalculation.completedWeight.toFixed(1)} %
                    </strong>
                  </p>

                  <p className="mb-1">
                    Pondération restante :{' '}
                    <strong>
                      {targetCalculation.remainingWeight.toFixed(1)} %
                    </strong>
                  </p>

                  {targetCalculation.requiredGrade > 100 ? (
  <p className="mb-0 text-danger fw-bold">
    Objectif impossible avec les évaluations restantes.
  </p>
) : targetCalculation.requiredGrade <= 0 ? (
  <p className="mb-0 text-success fw-bold">
    🎉 Ton objectif est déjà atteint !
  </p>
) : (
  <p className="mb-0">
    Moyenne nécessaire sur le reste :{' '}
    <strong>
      {targetCalculation.requiredGrade.toFixed(1)} %
    </strong>
  </p>
)}
                </div>
              ) : (
                <p className="text-muted mb-0">
                  Entre tes évaluations pour calculer ton objectif.
                </p>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  )
}