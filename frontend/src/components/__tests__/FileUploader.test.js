import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from '../FileUploader';

describe('FileUploader', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test('CA-U01 — selección de archivo muestra nombre e invoca onChange', async () => {
    const onChange = jest.fn();
    render(<FileUploader onChange={onChange} onUpload={jest.fn()} />);

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('File');

    await userEvent.upload(input, file);

    expect(screen.getByText('Selected file: test.pdf')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(file);
  });

  test('CA-U02 — subida exitosa envía FormData, muestra éxito e invoca onUpload', async () => {
    const onUpload = jest.fn();
    const responseData = {
      filePath: '/uploads/test.pdf',
      fileType: 'application/pdf',
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    render(<FileUploader onChange={jest.fn()} onUpload={onUpload} />);

    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText('File'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Subir Archivo' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3010/upload', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });

    const formData = global.fetch.mock.calls[0][1].body;
    expect(formData.get('file')).toBe(file);

    await waitFor(() => {
      expect(screen.getByText('Archivo subido con éxito')).toBeInTheDocument();
    });
    expect(onUpload).toHaveBeenCalledWith(responseData);
  });

  test('CA-U03 — muestra spinner durante la subida y vuelve a Subir Archivo', async () => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    global.fetch.mockReturnValue(fetchPromise);

    render(<FileUploader onChange={jest.fn()} onUpload={jest.fn()} />);

    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText('File'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Subir Archivo' }));

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subir Archivo' })).not.toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => ({ filePath: '/path', fileType: 'application/pdf' }),
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Subir Archivo' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('CA-U04 — fetch no OK no muestra éxito y oculta spinner', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<FileUploader onChange={jest.fn()} onUpload={jest.fn()} />);

    const file = new File(['content'], 'bad.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText('File'), file);
    await userEvent.click(screen.getByRole('button', { name: 'Subir Archivo' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Subir Archivo' })).toBeInTheDocument();
    });

    expect(screen.queryByText('Archivo subido con éxito')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('CA-U05 — sin archivo no llama fetch ni muestra spinner', async () => {
    render(<FileUploader onChange={jest.fn()} onUpload={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Subir Archivo' }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subir Archivo' })).toBeInTheDocument();
  });
});
