// backend/config/uploadFoto.js
const multer = require('multer');
const path = require('path');

const armazenamentoFoto = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'perfil'));
    },
    filename: (req, file, cb) => {
        const extensao = path.extname(file.originalname);
        cb(null, `foto-${Date.now()}${extensao}`);
    }
});

const uploadFoto = multer({
    storage: armazenamentoFoto,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Envie um arquivo de imagem válido'));
        }
    }
});

module.exports = { uploadFoto };