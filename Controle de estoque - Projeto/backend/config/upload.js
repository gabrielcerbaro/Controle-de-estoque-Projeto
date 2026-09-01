// backend/config/upload.js
// Configura como o multer recebe e salva o arquivo XML enviado pelo navegador.

const multer = require('multer');
const path = require('path');

const armazenamentoXml = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'xml'));
    },
    filename: (req, file, cb) => {
        const nomeUnico = `${Date.now()}-${file.originalname}`;
        cb(null, nomeUnico);
    }
});

const uploadXml = multer({
    storage: armazenamentoXml,
    fileFilter: (req, file, cb) => {
        const pareceXml = file.mimetype.includes('xml') || file.originalname.toLowerCase().endsWith('.xml');
        if (pareceXml) {
            cb(null, true);
        } else {
            cb(new Error('Envie um arquivo XML válido'));
        }
    }
});

module.exports = { uploadXml };
