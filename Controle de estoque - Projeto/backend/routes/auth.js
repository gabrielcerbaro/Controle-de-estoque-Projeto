// backend/routes/auth.js
// Tudo relacionado a login fica aqui: entrar, sair, checar se está logado,
// e (usado depois na tela de perfil) trocar a senha.

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const armazenamento = require('../data/armazenamento');

// POST /api/auth/login
// Recebe { usuario, senha }, confere contra o que está salvo em usuarios.json
router.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
    }

    const usuarios = armazenamento.ler('usuarios');
    const usuarioEncontrado = usuarios.find(u => u.usuario === usuario);

    if (!usuarioEncontrado) {
        return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
    }

    const senhaConfere = bcrypt.compareSync(senha, usuarioEncontrado.senhaHash);
    if (!senhaConfere) {
        return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
    }

    // Guarda na sessão que esse navegador está autenticado
    req.session.usuarioLogado = usuarioEncontrado.usuario;

    res.json({
        mensagem: 'Login realizado com sucesso',
        usuario: usuarioEncontrado.usuario,
        foto: usuarioEncontrado.foto || null
    });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ mensagem: 'Sessão encerrada' });
    });
});

// GET /api/auth/status
// O front-end chama isso pra saber se o usuário já está logado
// (por exemplo, ao abrir a tela principal direto pela URL)
router.get('/status', (req, res) => {
    if (req.session.usuarioLogado) {
        const usuarios = armazenamento.ler('usuarios');
        const usuarioAtual = usuarios.find(u => u.usuario === req.session.usuarioLogado);
        return res.json({
            autenticado: true,
            usuario: req.session.usuarioLogado,
            foto: usuarioAtual ? usuarioAtual.foto : null
        });
    }
    res.json({ autenticado: false });
});

// Middleware que vamos usar pra proteger outras rotas (produtos, financeiro...)
// nos próximos blocos: só deixa passar se estiver logado.
function exigirLogin(req, res, next) {
    if (!req.session.usuarioLogado) {
        return res.status(401).json({ erro: 'É preciso fazer login' });
    }
    next();
}

module.exports = { router, exigirLogin };
