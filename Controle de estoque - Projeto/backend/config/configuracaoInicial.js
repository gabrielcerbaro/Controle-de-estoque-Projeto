// backend/config/configuracaoInicial.js
// Roda toda vez que o servidor sobe. Se ainda não existir nenhum usuário
// cadastrado, cria o usuário padrão automaticamente — assim você não
// precisa rodar nenhum comando extra pra "instalar" o login.

const bcrypt = require('bcryptjs');
const armazenamento = require('../data/armazenamento');

function garantirUsuarioPadrao() {
    const usuarios = armazenamento.ler('usuarios');

    if (usuarios.length === 0) {
        const senhaHash = bcrypt.hashSync('gab123', 10);

        usuarios.push({
            usuario: 'gabrielcerbaro',
            senhaHash: senhaHash,
            foto: null
        });

        armazenamento.salvar('usuarios', usuarios);
        console.log('Usuário padrão criado: gabrielcerbaro');
    }
}

module.exports = { garantirUsuarioPadrao };
