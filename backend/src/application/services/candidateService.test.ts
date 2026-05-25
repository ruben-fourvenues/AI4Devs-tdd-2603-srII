import { addCandidate } from './candidateService';
import { validateCandidateData } from '../validator';
import { Candidate } from '../../domain/models/Candidate';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';

jest.mock('../validator', () => ({
    validateCandidateData: jest.fn(),
}));

jest.mock('../../domain/models/Candidate');
jest.mock('../../domain/models/Education');
jest.mock('../../domain/models/WorkExperience');
jest.mock('../../domain/models/Resume');

const mockValidateCandidateData = validateCandidateData as jest.MockedFunction<
    typeof validateCandidateData
>;
const MockCandidate = Candidate as jest.MockedClass<typeof Candidate>;
const MockEducation = Education as jest.MockedClass<typeof Education>;
const MockWorkExperience = WorkExperience as jest.MockedClass<typeof WorkExperience>;
const MockResume = Resume as jest.MockedClass<typeof Resume>;

describe('addCandidate', () => {
    const validMinimalData = {
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana@example.com',
    };

    const savedCandidate = {
        id: 42,
        firstName: 'Ana',
        lastName: 'García',
        email: 'ana@example.com',
    };

    let mockCandidateSave: jest.Mock;
    let mockEducationSave: jest.Mock;
    let mockWorkExperienceSave: jest.Mock;
    let mockResumeSave: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockValidateCandidateData.mockImplementation(() => undefined);

        mockCandidateSave = jest.fn().mockResolvedValue(savedCandidate);
        mockEducationSave = jest.fn().mockResolvedValue({});
        mockWorkExperienceSave = jest.fn().mockResolvedValue({});
        mockResumeSave = jest.fn().mockResolvedValue({});

        MockCandidate.mockImplementation(
            (data) =>
                ({
                    ...data,
                    education: [],
                    workExperience: [],
                    resumes: [],
                    save: mockCandidateSave,
                }) as unknown as Candidate
        );

        MockEducation.mockImplementation(
            (data) =>
                ({
                    ...data,
                    save: mockEducationSave,
                }) as unknown as Education
        );

        MockWorkExperience.mockImplementation(
            (data) =>
                ({
                    ...data,
                    save: mockWorkExperienceSave,
                }) as unknown as WorkExperience
        );

        MockResume.mockImplementation(
            (data) =>
                ({
                    ...data,
                    save: mockResumeSave,
                }) as unknown as Resume
        );
    });

    describe('CA-SVC-01: flujo feliz — validación previa', () => {
        it('debe llamar a validateCandidateData antes de persistir', async () => {
            const callOrder: string[] = [];
            mockValidateCandidateData.mockImplementation(() => {
                callOrder.push('validate');
            });
            mockCandidateSave.mockImplementation(async () => {
                callOrder.push('save');
                return savedCandidate;
            });

            await addCandidate(validMinimalData);

            expect(mockValidateCandidateData).toHaveBeenCalledWith(validMinimalData);
            expect(callOrder).toEqual(['validate', 'save']);
        });
    });

    describe('CA-SVC-02: flujo feliz — datos mínimos', () => {
        it('debe crear el candidato y devolver el registro guardado con id', async () => {
            const result = await addCandidate(validMinimalData);

            expect(MockCandidate).toHaveBeenCalledWith(validMinimalData);
            expect(mockCandidateSave).toHaveBeenCalledTimes(1);
            expect(result).toEqual(savedCandidate);
            expect(result.id).toBe(42);
        });
    });

    describe('CA-SVC-03: flujo feliz — educaciones', () => {
        it('debe crear un registro de educación por cada elemento con candidateId', async () => {
            const educations = [
                {
                    institution: 'Universidad Complutense',
                    title: 'Ingeniería',
                    startDate: '2018-09-01',
                    endDate: '2022-06-30',
                },
                {
                    institution: 'IES Madrid',
                    title: 'Bachillerato',
                    startDate: '2016-09-01',
                },
            ];
            const payload = { ...validMinimalData, educations };

            await addCandidate(payload);

            expect(MockEducation).toHaveBeenCalledTimes(2);
            expect(MockEducation).toHaveBeenNthCalledWith(1, educations[0]);
            expect(MockEducation).toHaveBeenNthCalledWith(2, educations[1]);

            const firstEducation = MockEducation.mock.results[0].value as Education;
            const secondEducation = MockEducation.mock.results[1].value as Education;
            expect(firstEducation.candidateId).toBe(savedCandidate.id);
            expect(secondEducation.candidateId).toBe(savedCandidate.id);
            expect(mockEducationSave).toHaveBeenCalledTimes(2);
        });
    });

    describe('CA-SVC-04: flujo feliz — experiencias laborales', () => {
        it('debe crear un registro de experiencia por cada elemento con candidateId', async () => {
            const workExperiences = [
                {
                    company: 'Acme Corp',
                    position: 'Developer',
                    startDate: '2022-01-01',
                    endDate: '2024-01-01',
                },
                {
                    company: 'Beta SL',
                    position: 'Intern',
                    startDate: '2021-06-01',
                },
            ];
            const payload = { ...validMinimalData, workExperiences };

            await addCandidate(payload);

            expect(MockWorkExperience).toHaveBeenCalledTimes(2);
            expect(MockWorkExperience).toHaveBeenNthCalledWith(1, workExperiences[0]);
            expect(MockWorkExperience).toHaveBeenNthCalledWith(2, workExperiences[1]);

            const firstExperience = MockWorkExperience.mock.results[0].value as WorkExperience;
            const secondExperience = MockWorkExperience.mock.results[1].value as WorkExperience;
            expect(firstExperience.candidateId).toBe(savedCandidate.id);
            expect(secondExperience.candidateId).toBe(savedCandidate.id);
            expect(mockWorkExperienceSave).toHaveBeenCalledTimes(2);
        });
    });

    describe('CA-SVC-05: flujo feliz — CV', () => {
        it('debe crear un registro de Resume cuando cv no está vacío', async () => {
            const cv = {
                filePath: '/uploads/cv-123.pdf',
                fileType: 'application/pdf',
            };
            const payload = { ...validMinimalData, cv };

            await addCandidate(payload);

            expect(MockResume).toHaveBeenCalledTimes(1);
            expect(MockResume).toHaveBeenCalledWith(cv);

            const resumeInstance = MockResume.mock.results[0].value as Resume;
            expect(resumeInstance.candidateId).toBe(savedCandidate.id);
            expect(mockResumeSave).toHaveBeenCalledTimes(1);
        });
    });

    describe('CA-SVC-06: errores de validación', () => {
        it('debe propagar el Error de validación sin persistir', async () => {
            mockValidateCandidateData.mockImplementation(() => {
                throw new Error('Invalid email');
            });

            await expect(addCandidate({ ...validMinimalData, email: 'bad' })).rejects.toThrow(
                'Invalid email'
            );

            expect(MockCandidate).not.toHaveBeenCalled();
            expect(mockCandidateSave).not.toHaveBeenCalled();
        });
    });

    describe('CA-SVC-07: restricciones de base de datos — email duplicado', () => {
        it('debe lanzar Error con mensaje de email duplicado ante P2002', async () => {
            mockCandidateSave.mockRejectedValue({ code: 'P2002' });

            await expect(addCandidate(validMinimalData)).rejects.toThrow(
                'The email already exists in the database'
            );
        });
    });

    describe('CA-SVC-08: restricciones de base de datos — otros errores Prisma', () => {
        it('debe relanzar errores Prisma no controlados sin transformarlos', async () => {
            const prismaError = { code: 'P2003', message: 'Foreign key constraint failed' };
            mockCandidateSave.mockRejectedValue(prismaError);

            await expect(addCandidate(validMinimalData)).rejects.toEqual(prismaError);
        });
    });

    describe('CA-SVC-09: casos límite — solo candidato base', () => {
        it('debe persistir solo el candidato base sin entidades relacionadas', async () => {
            await addCandidate(validMinimalData);

            expect(mockCandidateSave).toHaveBeenCalledTimes(1);
            expect(MockEducation).not.toHaveBeenCalled();
            expect(MockWorkExperience).not.toHaveBeenCalled();
            expect(MockResume).not.toHaveBeenCalled();
        });
    });

    describe('CA-SVC-10: casos límite — arrays vacíos', () => {
        it('no debe provocar errores con arrays vacíos de educaciones o experiencias', async () => {
            const payload = {
                ...validMinimalData,
                educations: [],
                workExperiences: [],
            };

            await expect(addCandidate(payload)).resolves.toEqual(savedCandidate);

            expect(mockCandidateSave).toHaveBeenCalledTimes(1);
            expect(MockEducation).not.toHaveBeenCalled();
            expect(MockWorkExperience).not.toHaveBeenCalled();
            expect(mockEducationSave).not.toHaveBeenCalled();
            expect(mockWorkExperienceSave).not.toHaveBeenCalled();
        });
    });
});
