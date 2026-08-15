/**
 * Page d'upload de documents
 */

import React, { useState } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';

const UploadPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    school: '',
    program: '',
    courseCode: '',
    courseName: ''
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    if (!formData.title || !formData.school || !formData.program || !formData.courseCode) {
      setError('Tous les champs requis doivent être remplis');
      return;
    }

    try {
      setLoading(true);
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      Object.keys(formData).forEach(key => {
        uploadFormData.append(key, formData[key]);
      });

      const response = await documentAPI.uploadDocument(uploadFormData);
      
      setSuccess('Document téléversé avec succès!');
      
      setTimeout(() => {
        navigate('/documents');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du téléversement');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4" style={{ maxWidth: '600px' }}>
      <h1 className="mb-4">📤 Téléverser un document</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Titre du document *</Form.Label>
          <Form.Control
            type="text"
            name="title"
            placeholder="Ex: Notes de cours - Calcul 101"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            placeholder="Décrivez le contenu du document..."
            value={formData.description}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Établissement *</Form.Label>
          <Form.Control
            type="text"
            name="school"
            placeholder="Ex: Université de Montréal"
            value={formData.school}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Programme *</Form.Label>
          <Form.Select
            name="program"
            value={formData.program}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez un programme</option>
            <option value="Informatique">Informatique</option>
            <option value="Génie">Génie</option>
            <option value="Sciences">Sciences</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Code du cours *</Form.Label>
          <Form.Control
            type="text"
            name="courseCode"
            placeholder="Ex: IFT1025"
            value={formData.courseCode}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Nom du cours</Form.Label>
          <Form.Control
            type="text"
            name="courseName"
            placeholder="Ex: Introduction à l'informatique"
            value={formData.courseName}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Fichier (PDF, Word, PowerPoint) *</Form.Label>
          <Form.Control
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            required
          />
          <Form.Text className="text-muted">
            Maximum 10MB. Formats acceptés: PDF, Word, PowerPoint
          </Form.Text>
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
          {loading ? 'Téléversement...' : 'Téléverser le document'}
        </Button>
      </Form>
    </Container>
  );
};

export default UploadPage;
