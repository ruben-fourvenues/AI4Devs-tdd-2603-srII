const mockResumeCreate = jest.fn();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        resume: {
            create: mockResumeCreate,
        },
    })),
}));

import { Resume } from '../Resume';

describe('Resume', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('CA-MOD-RES-01: save() sin id crea registro', () => {
        it('CA-MOD-RES-01: invoca prisma.resume.create con filePath, fileType, uploadDate y candidateId', async () => {
            const createdRecord = {
                id: 1,
                candidateId: 5,
                filePath: '/uploads/cv.pdf',
                fileType: 'application/pdf',
                uploadDate: new Date('2024-05-25T10:00:00.000Z'),
            };
            mockResumeCreate.mockResolvedValue(createdRecord);

            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-05-25T10:00:00.000Z'));

            const resume = new Resume({
                candidateId: 5,
                filePath: '/uploads/cv.pdf',
                fileType: 'application/pdf',
            });

            const result = await resume.save();

            expect(mockResumeCreate).toHaveBeenCalledWith({
                data: {
                    candidateId: 5,
                    filePath: '/uploads/cv.pdf',
                    fileType: 'application/pdf',
                    uploadDate: resume.uploadDate,
                },
            });
            expect(result).toBeInstanceOf(Resume);
            expect(result.id).toBe(1);
            expect(result.candidateId).toBe(5);
            expect(result.filePath).toBe('/uploads/cv.pdf');
            expect(result.fileType).toBe('application/pdf');

            jest.useRealTimers();
        });
    });

    describe('CA-MOD-RES-02: save() con id existente lanza Error', () => {
        it('CA-MOD-RES-02: no permite actualizar un currículum existente', async () => {
            const resume = new Resume({
                id: 3,
                candidateId: 5,
                filePath: '/uploads/cv.pdf',
                fileType: 'application/pdf',
            });

            await expect(resume.save()).rejects.toThrow(
                'No se permite la actualización de un currículum existente.',
            );
            expect(mockResumeCreate).not.toHaveBeenCalled();
        });
    });

    describe('CA-MOD-RES-03: uploadDate se establece automáticamente', () => {
        it('CA-MOD-RES-03: uploadDate se asigna en el constructor al momento de creación', () => {
            jest.useFakeTimers();
            const fixedDate = new Date('2024-05-25T12:30:00.000Z');
            jest.setSystemTime(fixedDate);

            const resume = new Resume({
                candidateId: 1,
                filePath: '/uploads/cv.docx',
                fileType:
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            expect(resume.uploadDate).toBeInstanceOf(Date);
            expect(resume.uploadDate.getTime()).toBe(fixedDate.getTime());

            jest.useRealTimers();
        });
    });
});
