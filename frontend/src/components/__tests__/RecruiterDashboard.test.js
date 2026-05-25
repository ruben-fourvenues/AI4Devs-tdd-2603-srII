import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import RecruiterDashboard from '../RecruiterDashboard';

jest.mock('../../assets/lti-logo.png', () => 'test-logo.png');

function LocationDisplay() {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
}

function DashboardWithRoutes() {
    return (
        <MemoryRouter initialEntries={['/']}>
            <LocationDisplay />
            <Routes>
                <Route path="/" element={<RecruiterDashboard />} />
                <Route path="/add-candidate" element={<div>Agregar Candidato</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('RecruiterDashboard', () => {
    describe('CA-D01 — Renderizado básico', () => {
        it('muestra logo, encabezado y tarjeta Añadir Candidato', () => {
            render(
                <MemoryRouter>
                    <RecruiterDashboard />
                </MemoryRouter>
            );

            expect(screen.getByAltText('LTI Logo')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'Dashboard del Reclutador' })).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'Añadir Candidato' })).toBeInTheDocument();
        });
    });

    describe('CA-D02 — Navegación al formulario', () => {
        it('navega a /add-candidate al hacer clic en Añadir Nuevo Candidato', async () => {
            render(<DashboardWithRoutes />);

            expect(screen.getByTestId('location-display')).toHaveTextContent('/');

            await userEvent.click(screen.getByRole('button', { name: 'Añadir Nuevo Candidato' }));

            expect(screen.getByTestId('location-display')).toHaveTextContent('/add-candidate');
            expect(screen.getByText('Agregar Candidato')).toBeInTheDocument();
        });
    });
});
