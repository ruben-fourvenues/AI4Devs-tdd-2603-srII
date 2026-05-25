import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { uploadFile } from '../services/fileUploadService';

const app = express();
app.post('/upload', uploadFile);

const resolveUploadedPath = (filePath: string) =>
    path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

const uploadedFiles: string[] = [];

const trackUploadedFile = (filePath: string) => {
    uploadedFiles.push(resolveUploadedPath(filePath));
};

afterEach(() => {
    uploadedFiles.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
    uploadedFiles.length = 0;
    jest.restoreAllMocks();
});

describe('POST /upload - fileUploadService', () => {
    describe('4.1 Tipos permitidos', () => {
        it('CA-UPL-01: un archivo PDF debe responder 200 con filePath y fileType', async () => {
            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from('%PDF-1.4 test'), {
                    filename: 'cv.pdf',
                    contentType: 'application/pdf',
                })
                .expect(200);

            expect(response.body).toEqual({
                filePath: expect.any(String),
                fileType: 'application/pdf',
            });
            trackUploadedFile(response.body.filePath);
        });

        it('CA-UPL-02: un archivo DOCX debe responder 200 con filePath y fileType', async () => {
            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from('PK docx test'), {
                    filename: 'cv.docx',
                    contentType:
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                })
                .expect(200);

            expect(response.body).toEqual({
                filePath: expect.any(String),
                fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            trackUploadedFile(response.body.filePath);
        });

        it('CA-UPL-03: un MIME no permitido debe responder 400 con error de tipo inválido', async () => {
            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from('fake png'), {
                    filename: 'image.png',
                    contentType: 'image/png',
                })
                .expect(400);

            expect(response.body).toEqual({
                error: 'Invalid file type, only PDF and DOCX are allowed!',
            });
        });
    });

    describe('4.2 Límites y errores', () => {
        it('CA-UPL-04: un archivo mayor de 10 MB debe responder 500 con mensaje de Multer', async () => {
            const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1, 'a');

            const response = await request(app)
                .post('/upload')
                .attach('file', oversizedBuffer, {
                    filename: 'large.pdf',
                    contentType: 'application/pdf',
                })
                .expect(500);

            expect(response.body).toEqual({
                error: 'File too large',
            });
        });

        it('CA-UPL-05: sin archivo en el campo file debe responder 400 indicando tipo inválido', async () => {
            const response = await request(app).post('/upload').expect(400);

            expect(response.body).toEqual({
                error: 'Invalid file type, only PDF and DOCX are allowed!',
            });
        });
    });

    describe('4.3 Comportamiento de almacenamiento', () => {
        it('CA-UPL-06: el nombre guardado debe incluir timestamp y nombre original', async () => {
            const fixedTimestamp = 1716654321000;
            jest.spyOn(Date, 'now').mockReturnValue(fixedTimestamp);

            const originalName = 'mi-curriculum.pdf';
            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from('%PDF-1.4 test'), {
                    filename: originalName,
                    contentType: 'application/pdf',
                })
                .expect(200);

            const savedFileName = path.basename(response.body.filePath);
            expect(savedFileName).toBe(`${fixedTimestamp}-${originalName}`);
            trackUploadedFile(response.body.filePath);
        });

        it('CA-UPL-07: la respuesta debe incluir filePath y fileType del archivo subido', async () => {
            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from('%PDF-1.4 test'), {
                    filename: 'resume.pdf',
                    contentType: 'application/pdf',
                })
                .expect(200);

            expect(response.body).toHaveProperty('filePath');
            expect(response.body).toHaveProperty('fileType', 'application/pdf');
            expect(response.body.filePath).toMatch(/^\.\.\/uploads\/\d+-resume\.pdf$/);
            expect(fs.existsSync(path.resolve(process.cwd(), response.body.filePath))).toBe(true);
            trackUploadedFile(path.resolve(process.cwd(), response.body.filePath));
        });
    });
});
