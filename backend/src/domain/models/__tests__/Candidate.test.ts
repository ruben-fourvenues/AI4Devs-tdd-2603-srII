const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@prisma/client', () => {
    const actual = jest.requireActual<typeof import('@prisma/client')>('@prisma/client');
    return {
        ...actual,
        PrismaClient: jest.fn().mockImplementation(() => ({
            candidate: {
                create: mockCreate,
                update: mockUpdate,
                findUnique: mockFindUnique,
            },
        })),
    };
});

import { Candidate } from '../Candidate';
import { Education } from '../Education';
import { WorkExperience } from '../WorkExperience';
import { Resume } from '../Resume';
import { Prisma } from '@prisma/client';

const validCandidateData = () => ({
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@example.com',
});

describe('Candidate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('5.1 Creación', () => {
        describe('CA-MOD-CAND-01: save() sin id invoca prisma.candidate.create', () => {
            it('CA-MOD-CAND-01: invoca create con los campos definidos', async () => {
                const data = {
                    ...validCandidateData(),
                    phone: '612345678',
                    address: 'Calle Mayor 1',
                };
                const created = { id: 1, ...data };
                mockCreate.mockResolvedValue(created);

                const candidate = new Candidate(data);
                const result = await candidate.save();

                expect(mockCreate).toHaveBeenCalledTimes(1);
                expect(mockCreate).toHaveBeenCalledWith({
                    data: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        phone: data.phone,
                        address: data.address,
                    },
                });
                expect(mockUpdate).not.toHaveBeenCalled();
                expect(result).toEqual(created);
            });
        });

        describe('CA-MOD-CAND-02: solo campos no undefined en el payload', () => {
            it('CA-MOD-CAND-02: excluye phone y address cuando son undefined', async () => {
                mockCreate.mockResolvedValue({ id: 1, ...validCandidateData() });

                const candidate = new Candidate(validCandidateData());
                await candidate.save();

                expect(mockCreate).toHaveBeenCalledWith({
                    data: {
                        firstName: 'Ana',
                        lastName: 'García',
                        email: 'ana.garcia@example.com',
                    },
                });
                const payload = mockCreate.mock.calls[0][0].data;
                expect(payload).not.toHaveProperty('phone');
                expect(payload).not.toHaveProperty('address');
            });
        });

        describe('CA-MOD-CAND-03: relaciones create anidadas', () => {
            it('CA-MOD-CAND-03: incluye educations, workExperiences y resumes como create anidados', async () => {
                const education = new Education({
                    institution: 'Universidad Complutense',
                    title: 'Ingeniería Informática',
                    startDate: '2018-09-01',
                    endDate: '2022-06-30',
                });
                const workExperience = new WorkExperience({
                    company: 'Acme Corp',
                    position: 'Desarrollador',
                    description: 'Desarrollo backend',
                    startDate: '2022-07-01',
                });
                const resume = new Resume({
                    filePath: '/uploads/cv.pdf',
                    fileType: 'application/pdf',
                });

                mockCreate.mockResolvedValue({ id: 1, ...validCandidateData() });

                const candidate = new Candidate({
                    ...validCandidateData(),
                    education: [education],
                    workExperience: [workExperience],
                    resumes: [resume],
                });
                await candidate.save();

                expect(mockCreate).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        educations: {
                            create: [
                                {
                                    institution: education.institution,
                                    title: education.title,
                                    startDate: education.startDate,
                                    endDate: education.endDate,
                                },
                            ],
                        },
                        workExperiences: {
                            create: [
                                {
                                    company: workExperience.company,
                                    position: workExperience.position,
                                    description: workExperience.description,
                                    startDate: workExperience.startDate,
                                    endDate: workExperience.endDate,
                                },
                            ],
                        },
                        resumes: {
                            create: [
                                {
                                    filePath: resume.filePath,
                                    fileType: resume.fileType,
                                },
                            ],
                        },
                    }),
                });
            });
        });
    });

    describe('5.2 Actualización', () => {
        describe('CA-MOD-CAND-04: save() con id invoca prisma.candidate.update', () => {
            it('CA-MOD-CAND-04: invoca update con where id y datos del candidato', async () => {
                const data = { id: 42, ...validCandidateData(), phone: '698765432' };
                const updated = { ...data };
                mockUpdate.mockResolvedValue(updated);

                const candidate = new Candidate(data);
                const result = await candidate.save();

                expect(mockUpdate).toHaveBeenCalledTimes(1);
                expect(mockUpdate).toHaveBeenCalledWith({
                    where: { id: 42 },
                    data: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        phone: data.phone,
                    },
                });
                expect(mockCreate).not.toHaveBeenCalled();
                expect(result).toEqual(updated);
            });
        });

        describe('CA-MOD-CAND-05: error P2025 al actualizar', () => {
            it('CA-MOD-CAND-05: lanza Error indicando que no se encontró el candidato', async () => {
                const p2025Error = Object.assign(new Error('Record not found'), {
                    code: 'P2025',
                });
                mockUpdate.mockRejectedValue(p2025Error);

                const candidate = new Candidate({ id: 999, ...validCandidateData() });

                await expect(candidate.save()).rejects.toThrow(
                    'No se pudo encontrar el registro del candidato con el ID proporcionado.',
                );
            });
        });
    });

    describe('5.3 Errores de conexión', () => {
        describe('CA-MOD-CAND-06: PrismaClientInitializationError', () => {
            it('CA-MOD-CAND-06: lanza Error de imposibilidad de conectar al crear', async () => {
                mockCreate.mockRejectedValue(
                    new Prisma.PrismaClientInitializationError('Connection failed', '5.13.0'),
                );

                const candidate = new Candidate(validCandidateData());

                await expect(candidate.save()).rejects.toThrow(
                    'No se pudo conectar con la base de datos. Por favor, asegúrese de que el servidor de base de datos esté en ejecución.',
                );
            });

            it('CA-MOD-CAND-06: lanza Error de imposibilidad de conectar al actualizar', async () => {
                mockUpdate.mockRejectedValue(
                    new Prisma.PrismaClientInitializationError('Connection failed', '5.13.0'),
                );

                const candidate = new Candidate({ id: 1, ...validCandidateData() });

                await expect(candidate.save()).rejects.toThrow(
                    'No se pudo conectar con la base de datos. Por favor, asegúrese de que el servidor de base de datos esté en ejecución.',
                );
            });
        });
    });

    describe('5.4 Consulta', () => {
        describe('CA-MOD-CAND-07: findOne devuelve instancia cuando existe', () => {
            it('CA-MOD-CAND-07: devuelve Candidate con los datos del registro', async () => {
                const record = {
                    id: 7,
                    firstName: 'Luis',
                    lastName: 'Pérez',
                    email: 'luis.perez@example.com',
                };
                mockFindUnique.mockResolvedValue(record);

                const result = await Candidate.findOne(7);

                expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 7 } });
                expect(result).toBeInstanceOf(Candidate);
                expect(result).toMatchObject({
                    id: 7,
                    firstName: 'Luis',
                    lastName: 'Pérez',
                    email: 'luis.perez@example.com',
                });
            });
        });

        describe('CA-MOD-CAND-08: findOne devuelve null cuando no existe', () => {
            it('CA-MOD-CAND-08: devuelve null si no hay registro', async () => {
                mockFindUnique.mockResolvedValue(null);

                const result = await Candidate.findOne(404);

                expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 404 } });
                expect(result).toBeNull();
            });
        });
    });
});
