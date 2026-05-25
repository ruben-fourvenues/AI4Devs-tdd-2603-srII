jest.mock('../presentation/controllers/candidateController', () => ({
    addCandidate: jest.fn(),
}));

import express from 'express';
import request from 'supertest';
import candidateRoutes from '../routes/candidateRoutes';
import { addCandidate } from '../presentation/controllers/candidateController';

const mockAddCandidate = jest.mocked(addCandidate);

const app = express();
app.use(express.json());
app.use('/candidates', candidateRoutes);

describe('POST /candidates', () => {
    afterEach(() => {
        mockAddCandidate.mockReset();
    });

    const validPayload = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
    };

    const fullPayload = {
        firstName: 'María',
        lastName: 'García',
        email: 'maria.garcia@example.com',
        phone: '612345678',
        address: 'Calle Mayor 1',
        educations: [
            {
                institution: 'Universidad Complutense',
                title: 'Ingeniería Informática',
                startDate: '2018-09-01',
                endDate: '2022-06-30',
            },
        ],
        workExperiences: [
            {
                company: 'Tech Corp',
                position: 'Desarrollador',
                description: 'Desarrollo backend',
                startDate: '2022-07-01',
            },
        ],
        cv: {
            filePath: '/uploads/cv.pdf',
            fileType: 'application/pdf',
        },
    };

    describe('CA-API-01', () => {
        it('con payload válido y persistencia exitosa responde 201 con el candidato creado', async () => {
            const createdCandidate = {
                id: 1,
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com',
                phone: null,
                address: null,
            };
            mockAddCandidate.mockResolvedValue(createdCandidate);

            const response = await request(app).post('/candidates').send(validPayload);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(createdCandidate);
        });
    });

    describe('CA-API-02', () => {
        it('con datos inválidos responde 400 con el mensaje de error', async () => {
            mockAddCandidate.mockRejectedValue(new Error('Invalid email'));

            const response = await request(app)
                .post('/candidates')
                .send({ ...validPayload, email: 'correo-invalido' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Invalid email' });
        });
    });

    describe('CA-API-03', () => {
        it('con email duplicado responde 400 con mensaje de email existente', async () => {
            mockAddCandidate.mockRejectedValue(new Error('The email already exists in the database'));

            const response = await request(app).post('/candidates').send(validPayload);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'The email already exists in the database' });
        });
    });

    describe('CA-API-04', () => {
        it('con error no instancia de Error responde 500 con mensaje genérico', async () => {
            mockAddCandidate.mockRejectedValue('unexpected failure');

            const response = await request(app).post('/candidates').send(validPayload);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'An unexpected error occurred' });
        });
    });

    describe('CA-API-05', () => {
        it('acepta JSON con todos los campos del contrato de entrada', async () => {
            const createdCandidate = {
                id: 2,
                firstName: fullPayload.firstName,
                lastName: fullPayload.lastName,
                email: fullPayload.email,
                phone: fullPayload.phone,
                address: fullPayload.address,
            };
            mockAddCandidate.mockResolvedValue(createdCandidate);

            const response = await request(app).post('/candidates').send(fullPayload);

            expect(response.status).toBe(201);
            expect(mockAddCandidate).toHaveBeenCalledWith(fullPayload);
        });
    });

    describe('CA-API-06', () => {
        it('el candidato creado incluye id, firstName, lastName y email en la respuesta', async () => {
            const createdCandidate = {
                id: 3,
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
                phone: null,
                address: null,
            };
            mockAddCandidate.mockResolvedValue(createdCandidate);

            const response = await request(app).post('/candidates').send({
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
            });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                id: expect.any(Number),
                firstName: 'Ana',
                lastName: 'López',
                email: 'ana.lopez@example.com',
            });
        });
    });
});
