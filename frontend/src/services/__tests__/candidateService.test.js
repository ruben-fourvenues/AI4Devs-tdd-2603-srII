jest.mock(
  'axios',
  () => ({
    __esModule: true,
    default: {
      post: jest.fn(),
    },
  }),
  { virtual: true }
);
import axios from 'axios';
import { uploadCV, sendCandidateData } from '../candidateService';

describe('candidateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CA-S01 — uploadCV éxito', () => {
    it('devuelve los datos y envía multipart/form-data con el archivo', async () => {
      const mockFile = new File(['cv content'], 'cv.pdf', { type: 'application/pdf' });
      const mockData = { filePath: '/uploads/cv.pdf', fileType: 'application/pdf' };
      axios.post.mockResolvedValue({ data: mockData });

      const result = await uploadCV(mockFile);

      expect(result).toEqual(mockData);
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3010/upload',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const formData = axios.post.mock.calls[0][1];
      expect(formData.get('file')).toBe(mockFile);
    });
  });

  describe('CA-S02 — uploadCV error', () => {
    it('lanza un error con mensaje "Error al subir el archivo:"', async () => {
      const mockFile = new File(['cv content'], 'cv.pdf', { type: 'application/pdf' });
      axios.post.mockRejectedValue({ response: { data: 'Upload failed' } });

      await expect(uploadCV(mockFile)).rejects.toThrow('Error al subir el archivo:');
    });
  });

  describe('CA-S03 — sendCandidateData éxito', () => {
    it('devuelve la respuesta del servidor', async () => {
      const candidateData = {
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana@example.com',
      };
      const mockData = { id: 1, ...candidateData };
      axios.post.mockResolvedValue({ data: mockData });

      const result = await sendCandidateData(candidateData);

      expect(result).toEqual(mockData);
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:3010/candidates',
        candidateData
      );
    });
  });

  describe('CA-S04 — sendCandidateData error', () => {
    it('lanza un error con mensaje "Error al enviar datos del candidato:"', async () => {
      const candidateData = { firstName: 'Ana' };
      axios.post.mockRejectedValue({ response: { data: 'Server error' } });

      await expect(sendCandidateData(candidateData)).rejects.toThrow(
        'Error al enviar datos del candidato:'
      );
    });
  });
});
