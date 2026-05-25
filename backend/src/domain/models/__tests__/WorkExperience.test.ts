const mockWorkExperienceCreate = jest.fn();
const mockWorkExperienceUpdate = jest.fn();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        workExperience: {
            create: mockWorkExperienceCreate,
            update: mockWorkExperienceUpdate,
        },
    })),
}));

import { WorkExperience } from '../WorkExperience';

describe('WorkExperience', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('CA-MOD-WE-01: save() sin id crea registro', () => {
        it('CA-MOD-WE-01: invoca prisma.workExperience.create con campos obligatorios y opcionales', async () => {
            const createdRecord = {
                id: 1,
                company: 'Acme Corp',
                position: 'Desarrollador Senior',
                description: 'Desarrollo de APIs REST',
                startDate: new Date('2020-01-15'),
                endDate: new Date('2023-12-31'),
                candidateId: 7,
            };
            mockWorkExperienceCreate.mockResolvedValue(createdRecord);

            const workExperience = new WorkExperience({
                company: 'Acme Corp',
                position: 'Desarrollador Senior',
                description: 'Desarrollo de APIs REST',
                startDate: '2020-01-15',
                endDate: '2023-12-31',
                candidateId: 7,
            });

            const result = await workExperience.save();

            expect(mockWorkExperienceCreate).toHaveBeenCalledWith({
                data: {
                    company: 'Acme Corp',
                    position: 'Desarrollador Senior',
                    description: 'Desarrollo de APIs REST',
                    startDate: workExperience.startDate,
                    endDate: workExperience.endDate,
                    candidateId: 7,
                },
            });
            expect(mockWorkExperienceUpdate).not.toHaveBeenCalled();
            expect(result).toEqual(createdRecord);
        });

        it('CA-MOD-WE-01: omite candidateId si no está definido', async () => {
            mockWorkExperienceCreate.mockResolvedValue({ id: 2 });

            const workExperience = new WorkExperience({
                company: 'Tech Solutions',
                position: 'Analista',
                startDate: '2021-03-01',
            });

            await workExperience.save();

            expect(mockWorkExperienceCreate).toHaveBeenCalledWith({
                data: {
                    company: 'Tech Solutions',
                    position: 'Analista',
                    description: undefined,
                    startDate: workExperience.startDate,
                    endDate: undefined,
                },
            });
        });
    });

    describe('CA-MOD-WE-02: save() con id actualiza registro', () => {
        it('CA-MOD-WE-02: invoca prisma.workExperience.update con where id y datos actualizados', async () => {
            const updatedRecord = {
                id: 4,
                company: 'Global Inc',
                position: 'Tech Lead',
                description: 'Liderazgo de equipo',
                startDate: new Date('2018-06-01'),
                endDate: new Date('2024-01-31'),
                candidateId: 2,
            };
            mockWorkExperienceUpdate.mockResolvedValue(updatedRecord);

            const workExperience = new WorkExperience({
                id: 4,
                company: 'Global Inc',
                position: 'Tech Lead',
                description: 'Liderazgo de equipo',
                startDate: '2018-06-01',
                endDate: '2024-01-31',
                candidateId: 2,
            });

            const result = await workExperience.save();

            expect(mockWorkExperienceUpdate).toHaveBeenCalledWith({
                where: { id: 4 },
                data: {
                    company: 'Global Inc',
                    position: 'Tech Lead',
                    description: 'Liderazgo de equipo',
                    startDate: workExperience.startDate,
                    endDate: workExperience.endDate,
                    candidateId: 2,
                },
            });
            expect(mockWorkExperienceCreate).not.toHaveBeenCalled();
            expect(result).toEqual(updatedRecord);
        });
    });
});
