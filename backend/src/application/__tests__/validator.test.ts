import { validateCandidateData } from '../validator';

const validMinimalCandidate = () => ({
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@example.com',
});

const validEducation = () => ({
    institution: 'Universidad Complutense',
    title: 'Ingeniería Informática',
    startDate: '2018-09-01',
});

const validWorkExperience = () => ({
    company: 'Acme Corp',
    position: 'Desarrollador',
    startDate: '2020-01-15',
});

describe('validateCandidateData', () => {
    describe('1.1 Datos obligatorios del candidato', () => {
        describe('CA-VAL-01: firstName', () => {
            it('CA-VAL-01: lanza Invalid name si firstName está vacío', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), firstName: '' }),
                ).toThrow('Invalid name');
            });

            it('CA-VAL-01: lanza Invalid name si firstName tiene menos de 2 caracteres', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), firstName: 'A' }),
                ).toThrow('Invalid name');
            });

            it('CA-VAL-01: lanza Invalid name si firstName supera 100 caracteres', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        firstName: 'A'.repeat(101),
                    }),
                ).toThrow('Invalid name');
            });

            it('CA-VAL-01: lanza Invalid name si firstName contiene caracteres no permitidos', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), firstName: 'Ana123' }),
                ).toThrow('Invalid name');
            });
        });

        describe('CA-VAL-02: lastName', () => {
            it('CA-VAL-02: lanza Invalid name si lastName está vacío', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), lastName: '' }),
                ).toThrow('Invalid name');
            });

            it('CA-VAL-02: lanza Invalid name si lastName tiene menos de 2 caracteres', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), lastName: 'G' }),
                ).toThrow('Invalid name');
            });

            it('CA-VAL-02: lanza Invalid name si lastName supera 100 caracteres', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        lastName: 'G'.repeat(101),
                    }),
                ).toThrow('Invalid name');
            });

            it('CA-VAL-02: lanza Invalid name si lastName contiene caracteres no permitidos', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), lastName: 'García@' }),
                ).toThrow('Invalid name');
            });
        });

        describe('CA-VAL-03: email', () => {
            it('CA-VAL-03: lanza Invalid email si email está vacío', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), email: '' }),
                ).toThrow('Invalid email');
            });

            it('CA-VAL-03: lanza Invalid email si el formato no es válido', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), email: 'no-es-email' }),
                ).toThrow('Invalid email');
            });
        });

        describe('CA-VAL-04: phone presente inválido', () => {
            it('CA-VAL-04: lanza Invalid phone si no cumple el patrón español', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), phone: '123456789' }),
                ).toThrow('Invalid phone');
            });
        });

        describe('CA-VAL-05: phone opcional', () => {
            it('CA-VAL-05: pasa la validación si phone está ausente', () => {
                expect(() => validateCandidateData(validMinimalCandidate())).not.toThrow();
            });

            it('CA-VAL-05: pasa la validación si phone está vacío', () => {
                expect(() =>
                    validateCandidateData({ ...validMinimalCandidate(), phone: '' }),
                ).not.toThrow();
            });
        });

        describe('CA-VAL-06: address demasiado larga', () => {
            it('CA-VAL-06: lanza Invalid address si supera 100 caracteres', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        address: 'A'.repeat(101),
                    }),
                ).toThrow('Invalid address');
            });
        });

        describe('CA-VAL-07: address opcional', () => {
            it('CA-VAL-07: pasa la validación si address está ausente', () => {
                expect(() => validateCandidateData(validMinimalCandidate())).not.toThrow();
            });
        });
    });

    describe('1.2 Edición de candidato existente', () => {
        describe('CA-VAL-08: retorno temprano con id', () => {
            it('CA-VAL-08: no valida campos si el payload incluye id', () => {
                expect(() =>
                    validateCandidateData({
                        id: 1,
                        firstName: '',
                        lastName: '',
                        email: 'invalido',
                        phone: '000',
                    }),
                ).not.toThrow();
            });
        });
    });

    describe('1.3 Educación', () => {
        describe('CA-VAL-09: institution', () => {
            it('CA-VAL-09: lanza Invalid institution si institution está vacía', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        educations: [{ ...validEducation(), institution: '' }],
                    }),
                ).toThrow('Invalid institution');
            });

            it('CA-VAL-09: lanza Invalid institution si supera 100 caracteres', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        educations: [{ ...validEducation(), institution: 'U'.repeat(101) }],
                    }),
                ).toThrow('Invalid institution');
            });
        });

        describe('CA-VAL-10: title', () => {
            it('CA-VAL-10: lanza Invalid title si title está vacío', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        educations: [{ ...validEducation(), title: '' }],
                    }),
                ).toThrow('Invalid title');
            });

            it('CA-VAL-10: lanza Invalid title si supera 100 caracteres', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        educations: [{ ...validEducation(), title: 'T'.repeat(101) }],
                    }),
                ).toThrow('Invalid title');
            });
        });

        describe('CA-VAL-11: startDate educación', () => {
            it('CA-VAL-11: lanza Invalid date si startDate está vacía', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        educations: [{ ...validEducation(), startDate: '' }],
                    }),
                ).toThrow('Invalid date');
            });

            it('CA-VAL-11: lanza Invalid date si startDate no tiene formato YYYY-MM-DD', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        educations: [{ ...validEducation(), startDate: '01-09-2018' }],
                    }),
                ).toThrow('Invalid date');
            });
        });

        describe('CA-VAL-12: endDate educación presente inválida', () => {
            it('CA-VAL-12: lanza Invalid end date si endDate no tiene formato YYYY-MM-DD', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        educations: [{ ...validEducation(), endDate: '2022/06/30' }],
                    }),
                ).toThrow('Invalid end date');
            });
        });

        describe('CA-VAL-13: endDate educación ausente', () => {
            it('CA-VAL-13: pasa la validación si endDate está ausente', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        educations: [validEducation()],
                    }),
                ).not.toThrow();
            });
        });
    });

    describe('1.4 Experiencia laboral', () => {
        describe('CA-VAL-14: company', () => {
            it('CA-VAL-14: lanza Invalid company si company está vacía', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        workExperiences: [{ ...validWorkExperience(), company: '' }],
                    }),
                ).toThrow('Invalid company');
            });

            it('CA-VAL-14: lanza Invalid company si supera 100 caracteres', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        workExperiences: [{ ...validWorkExperience(), company: 'C'.repeat(101) }],
                    }),
                ).toThrow('Invalid company');
            });
        });

        describe('CA-VAL-15: position', () => {
            it('CA-VAL-15: lanza Invalid position si position está vacía', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        workExperiences: [{ ...validWorkExperience(), position: '' }],
                    }),
                ).toThrow('Invalid position');
            });

            it('CA-VAL-15: lanza Invalid position si supera 100 caracteres', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        workExperiences: [{ ...validWorkExperience(), position: 'P'.repeat(101) }],
                    }),
                ).toThrow('Invalid position');
            });
        });

        describe('CA-VAL-16: description', () => {
            it('CA-VAL-16: lanza Invalid description si supera 200 caracteres', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        workExperiences: [
                            { ...validWorkExperience(), description: 'D'.repeat(201) },
                        ],
                    }),
                ).toThrow('Invalid description');
            });
        });

        describe('CA-VAL-17: startDate experiencia', () => {
            it('CA-VAL-17: lanza Invalid date si startDate es inválida', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        workExperiences: [{ ...validWorkExperience(), startDate: 'invalid' }],
                    }),
                ).toThrow('Invalid date');
            });
        });

        describe('CA-VAL-18: endDate experiencia presente inválida', () => {
            it('CA-VAL-18: lanza Invalid end date si endDate es inválida', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        workExperiences: [{ ...validWorkExperience(), endDate: '2023/12/31' }],
                    }),
                ).toThrow('Invalid end date');
            });
        });
    });

    describe('1.5 CV', () => {
        describe('CA-VAL-19: cv no vacío inválido', () => {
            it('CA-VAL-19: lanza Invalid CV data si falta filePath', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        cv: { fileType: 'application/pdf' },
                    }),
                ).toThrow('Invalid CV data');
            });

            it('CA-VAL-19: lanza Invalid CV data si falta fileType', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        cv: { filePath: '/uploads/cv.pdf' },
                    }),
                ).toThrow('Invalid CV data');
            });

            it('CA-VAL-19: lanza Invalid CV data si filePath no es string', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        cv: { filePath: 123, fileType: 'application/pdf' },
                    }),
                ).toThrow('Invalid CV data');
            });
        });

        describe('CA-VAL-20: cv vacío', () => {
            it('CA-VAL-20: no valida CV si cv es un objeto vacío', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        cv: {},
                    }),
                ).not.toThrow();
            });
        });

        describe('CA-VAL-21: cv válido', () => {
            it('CA-VAL-21: pasa la validación con filePath y fileType como strings', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        cv: {
                            filePath: '/uploads/cv.pdf',
                            fileType: 'application/pdf',
                        },
                    }),
                ).not.toThrow();
            });
        });
    });

    describe('1.6 Payload válido completo', () => {
        describe('CA-VAL-22: datos mínimos válidos', () => {
            it('CA-VAL-22: pasa la validación con firstName, lastName y email válidos', () => {
                expect(() => validateCandidateData(validMinimalCandidate())).not.toThrow();
            });
        });

        describe('CA-VAL-23: payload completo válido', () => {
            it('CA-VAL-23: pasa la validación con educaciones, experiencias y CV válidos', () => {
                expect(() =>
                    validateCandidateData({
                        ...validMinimalCandidate(),
                        phone: '612345678',
                        address: 'Calle Mayor 1, Madrid',
                        educations: [
                            {
                                ...validEducation(),
                                endDate: '2022-06-30',
                            },
                        ],
                        workExperiences: [
                            {
                                ...validWorkExperience(),
                                description: 'Desarrollo de APIs REST',
                                endDate: '2023-12-31',
                            },
                        ],
                        cv: {
                            filePath: '/uploads/cv.pdf',
                            fileType: 'application/pdf',
                        },
                    }),
                ).not.toThrow();
            });
        });
    });
});
