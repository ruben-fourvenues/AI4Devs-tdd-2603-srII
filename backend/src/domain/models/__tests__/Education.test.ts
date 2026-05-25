const mockEducationCreate = jest.fn();
const mockEducationUpdate = jest.fn();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        education: {
            create: mockEducationCreate,
            update: mockEducationUpdate,
        },
    })),
}));

import { Education } from '../Education';

describe('Education', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('CA-MOD-EDU-01: save() sin id crea registro', () => {
        it('CA-MOD-EDU-01: invoca prisma.education.create con todos los campos y candidateId', async () => {
            const createdRecord = {
                id: 1,
                institution: 'Universidad Complutense',
                title: 'Ingeniería Informática',
                startDate: new Date('2018-09-01'),
                endDate: new Date('2022-06-30'),
                candidateId: 10,
            };
            mockEducationCreate.mockResolvedValue(createdRecord);

            const education = new Education({
                institution: 'Universidad Complutense',
                title: 'Ingeniería Informática',
                startDate: '2018-09-01',
                endDate: '2022-06-30',
                candidateId: 10,
            });

            const result = await education.save();

            expect(mockEducationCreate).toHaveBeenCalledWith({
                data: {
                    institution: 'Universidad Complutense',
                    title: 'Ingeniería Informática',
                    startDate: education.startDate,
                    endDate: education.endDate,
                    candidateId: 10,
                },
            });
            expect(mockEducationUpdate).not.toHaveBeenCalled();
            expect(result).toEqual(createdRecord);
        });

        it('CA-MOD-EDU-01: omite candidateId si no está definido', async () => {
            mockEducationCreate.mockResolvedValue({ id: 2 });

            const education = new Education({
                institution: 'Universidad Autónoma',
                title: 'Matemáticas',
                startDate: '2019-09-01',
            });

            await education.save();

            expect(mockEducationCreate).toHaveBeenCalledWith({
                data: {
                    institution: 'Universidad Autónoma',
                    title: 'Matemáticas',
                    startDate: education.startDate,
                    endDate: undefined,
                },
            });
        });
    });

    describe('CA-MOD-EDU-02: save() con id actualiza registro', () => {
        it('CA-MOD-EDU-02: invoca prisma.education.update con where id y datos actualizados', async () => {
            const updatedRecord = {
                id: 5,
                institution: 'Universidad Politécnica',
                title: 'Ingeniería de Software',
                startDate: new Date('2017-09-01'),
                endDate: new Date('2021-06-30'),
                candidateId: 3,
            };
            mockEducationUpdate.mockResolvedValue(updatedRecord);

            const education = new Education({
                id: 5,
                institution: 'Universidad Politécnica',
                title: 'Ingeniería de Software',
                startDate: '2017-09-01',
                endDate: '2021-06-30',
                candidateId: 3,
            });

            const result = await education.save();

            expect(mockEducationUpdate).toHaveBeenCalledWith({
                where: { id: 5 },
                data: {
                    institution: 'Universidad Politécnica',
                    title: 'Ingeniería de Software',
                    startDate: education.startDate,
                    endDate: education.endDate,
                    candidateId: 3,
                },
            });
            expect(mockEducationCreate).not.toHaveBeenCalled();
            expect(result).toEqual(updatedRecord);
        });
    });

    describe('CA-MOD-EDU-03: fechas string se convierten a Date', () => {
        it('CA-MOD-EDU-03: startDate y endDate del constructor son instancias de Date', () => {
            const education = new Education({
                institution: 'Universidad de Barcelona',
                title: 'Física',
                startDate: '2015-09-01',
                endDate: '2019-06-30',
            });

            expect(education.startDate).toBeInstanceOf(Date);
            expect(education.endDate).toBeInstanceOf(Date);
            expect(education.startDate.toISOString()).toContain('2015-09-01');
            expect(education.endDate!.toISOString()).toContain('2019-06-30');
        });

        it('CA-MOD-EDU-03: endDate queda undefined si no se proporciona', () => {
            const education = new Education({
                institution: 'Universidad de Valencia',
                title: 'Química',
                startDate: '2020-09-01',
            });

            expect(education.endDate).toBeUndefined();
        });
    });
});
