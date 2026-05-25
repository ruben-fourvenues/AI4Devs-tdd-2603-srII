import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RecruiterDashboard from '../components/RecruiterDashboard';
import AddCandidateForm from '../components/AddCandidateForm';

jest.mock('../assets/lti-logo.png', () => 'test-logo.png');

function renderRoutesAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<RecruiterDashboard />} />
        <Route path="/add-candidate" element={<AddCandidateForm />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('App routing (Section 1)', () => {
  it('CA-R01: MemoryRouter at / shows "Dashboard del Reclutador"', () => {
    renderRoutesAt('/');
    expect(screen.getByText('Dashboard del Reclutador')).toBeInTheDocument();
  });

  it('CA-R02: MemoryRouter at /add-candidate shows "Agregar Candidato"', () => {
    renderRoutesAt('/add-candidate');
    expect(screen.getByText('Agregar Candidato')).toBeInTheDocument();
  });
});
