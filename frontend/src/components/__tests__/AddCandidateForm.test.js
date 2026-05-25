import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCandidateForm from '../AddCandidateForm';

jest.mock('../FileUploader', () => {
  return function MockFileUploader({ onUpload }) {
    return (
      <button
        type="button"
        data-testid="mock-upload-cv"
        onClick={() =>
          onUpload?.({
            filePath: '/uploads/cv.pdf',
            fileType: 'application/pdf',
          })
        }
      >
        Mock Upload CV
      </button>
    );
  };
});

jest.mock('react-datepicker', () => {
  return function MockDatePicker({ selected, onChange, placeholderText, className }) {
    return (
      <input
        placeholder={placeholderText}
        className={className}
        value={selected instanceof Date ? selected.toISOString().slice(0, 10) : ''}
        onChange={(e) => {
          if (e.target.value) {
            const [year, month, day] = e.target.value.split('-').map(Number);
            onChange(new Date(year, month - 1, day));
          } else {
            onChange('');
          }
        }}
      />
    );
  };
});

const fillRequiredFields = async () => {
  await userEvent.type(screen.getByLabelText(/nombre/i), 'John');
  await userEvent.type(screen.getByLabelText(/apellido/i), 'Doe');
  await userEvent.type(screen.getByLabelText(/correo/i), 'john@example.com');
};

const fillRequiredFieldsAndSubmit = async () => {
  await fillRequiredFields();
  await userEvent.click(screen.getByRole('button', { name: /enviar/i }));
};

const getLastFetchBody = () => {
  const [, options] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
  return JSON.parse(options.body);
};

describe('AddCandidateForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('CA-F01 — Campos obligatorios visibles', () => {
    it('muestra campos requeridos y botón Enviar', () => {
      render(<AddCandidateForm />);

      expect(screen.getByLabelText(/nombre/i)).toBeRequired();
      expect(screen.getByLabelText(/apellido/i)).toBeRequired();
      expect(screen.getByLabelText(/correo/i)).toBeRequired();
      expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
    });
  });

  describe('CA-F02 — Campos opcionales editables', () => {
    it('refleja los valores escritos en teléfono y dirección', async () => {
      render(<AddCandidateForm />);

      const phoneInput = screen.getByLabelText(/teléfono/i);
      const addressInput = screen.getByLabelText(/dirección/i);

      await userEvent.type(phoneInput, '600123456');
      await userEvent.type(addressInput, 'Calle Mayor 1');

      expect(phoneInput).toHaveValue('600123456');
      expect(addressInput).toHaveValue('Calle Mayor 1');
    });
  });

  describe('CA-F03 — Añadir sección de educación', () => {
    it('muestra inputs de educación y botón Eliminar', async () => {
      render(<AddCandidateForm />);

      await userEvent.click(screen.getByRole('button', { name: /añadir educación/i }));

      expect(screen.getByPlaceholderText(/institución/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/título/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/fecha de inicio/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/fecha de fin/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
    });
  });

  describe('CA-F04 — Eliminar sección de educación', () => {
    it('elimina el bloque de educación al pulsar Eliminar', async () => {
      render(<AddCandidateForm />);

      await userEvent.click(screen.getByRole('button', { name: /añadir educación/i }));
      expect(screen.getByPlaceholderText(/institución/i)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /eliminar/i }));

      expect(screen.queryByPlaceholderText(/institución/i)).not.toBeInTheDocument();
    });
  });

  describe('CA-F05 — Añadir y eliminar experiencia laboral', () => {
    it('muestra y elimina el bloque de experiencia laboral', async () => {
      render(<AddCandidateForm />);

      await userEvent.click(
        screen.getByRole('button', { name: /añadir experiencia laboral/i })
      );

      expect(screen.getByPlaceholderText(/empresa/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/puesto/i)).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/fecha de inicio/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByPlaceholderText(/fecha de fin/i).length).toBeGreaterThanOrEqual(1);

      const experienceBlock = screen.getByPlaceholderText(/empresa/i).closest('.mb-3');
      await userEvent.click(within(experienceBlock).getByRole('button', { name: /eliminar/i }));

      expect(screen.queryByPlaceholderText(/empresa/i)).not.toBeInTheDocument();
    });
  });

  describe('CA-F06 — Envío exitoso (HTTP 201)', () => {
    it('envía POST con JSON y muestra alerta de éxito', async () => {
      global.fetch.mockResolvedValue({ status: 201 });
      render(<AddCandidateForm />);

      await fillRequiredFieldsAndSubmit();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3010/candidates',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      expect(await screen.findByText('Candidato añadido con éxito')).toBeInTheDocument();
      expect(screen.queryByText(/error al añadir candidato/i)).not.toBeInTheDocument();
    });
  });

  describe('CA-F07 — Error de validación del servidor (HTTP 400)', () => {
    it('muestra error de datos inválidos sin mensaje de éxito', async () => {
      global.fetch.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ message: 'Email duplicado' }),
      });
      render(<AddCandidateForm />);

      await fillRequiredFieldsAndSubmit();

      expect(
        await screen.findByText(/datos inválidos: email duplicado/i)
      ).toBeInTheDocument();
      expect(screen.queryByText('Candidato añadido con éxito')).not.toBeInTheDocument();
    });
  });

  describe('CA-F08 — Error interno del servidor (HTTP 500)', () => {
    it('muestra error interno del servidor', async () => {
      global.fetch.mockResolvedValue({ status: 500 });
      render(<AddCandidateForm />);

      await fillRequiredFieldsAndSubmit();

      expect(
        await screen.findByText(/error interno del servidor/i)
      ).toBeInTheDocument();
    });
  });

  describe('CA-F09 — Error de red u otro fallo', () => {
    it('muestra error que comienza con "Error al añadir candidato:"', async () => {
      global.fetch.mockRejectedValue(new Error('Network failure'));
      render(<AddCandidateForm />);

      await fillRequiredFieldsAndSubmit();

      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert.textContent).toMatch(/^Error al añadir candidato:/);
    });
  });

  describe('CA-F10 — Formato de fechas en el payload', () => {
    it('serializa fechas como YYYY-MM-DD y vacías como cadena vacía', async () => {
      global.fetch.mockResolvedValue({ status: 201 });
      render(<AddCandidateForm />);

      await fillRequiredFields();
      await userEvent.click(screen.getByRole('button', { name: /añadir educación/i }));

      await userEvent.type(screen.getByPlaceholderText(/institución/i), 'Universidad');
      fireEvent.change(screen.getByPlaceholderText(/fecha de inicio/i), {
        target: { value: '2020-06-15' },
      });

      await userEvent.click(screen.getByRole('button', { name: /enviar/i }));

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const body = getLastFetchBody();
      const expectedStartDate = new Date(2020, 5, 15).toISOString().slice(0, 10);
      expect(body.educations[0].startDate).toBe(expectedStartDate);
      expect(body.educations[0].endDate).toBe('');
    });
  });

  describe('CA-F11 — Inclusión de CV en el payload', () => {
    it('incluye cv con filePath y fileType cuando hay CV subido', async () => {
      global.fetch.mockResolvedValue({ status: 201 });
      render(<AddCandidateForm />);

      await userEvent.click(screen.getByTestId('mock-upload-cv'));
      await fillRequiredFieldsAndSubmit();

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const body = getLastFetchBody();
      expect(body.cv).toEqual({
        filePath: '/uploads/cv.pdf',
        fileType: 'application/pdf',
      });
    });
  });

  describe('CA-F12 — Envío sin CV', () => {
    it('incluye cv: null cuando no hay CV subido', async () => {
      global.fetch.mockResolvedValue({ status: 201 });
      render(<AddCandidateForm />);

      await fillRequiredFieldsAndSubmit();

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const body = getLastFetchBody();
      expect(body.cv).toBeNull();
    });
  });
});
