// server.js
// Ponto de entrada do sistema. Aqui a gente liga o servidor,
// diz pra ele servir os arquivos do front-end, e (nos próximos blocos)
// vamos "plugar" as rotas de login, produtos, entrada/saída, financeiro etc.

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

const { garantirUsuarioPadrao } = require('./config/configuracaoInicial');
const { router: authRouter, exigirLogin } = require('./routes/auth');
const produtosRouter = require('./routes/produtos');
const movimentacoesRouter = require('./routes/movimentacoes');
const financeiroRouter = require('./routes/financeiro');

const app = express();
const PORTA = 3000;

// Cria o usuário padrão (gabrielcerbaro) se ainda não existir nenhum usuário
garantirUsuarioPadrao();

// Permite que outros dispositivos da rede (celular, outro PC) acessem o servidor
app.use(cors({
    origin: true,
    credentials: true
}));

// Permite que o servidor entenda dados JSON enviados pelo front-end
app.use(express.json());

// Controle de sessão — é isso que "lembra" que você já fez login
app.use(session({
    secret: 'estoque-sistema-chave-local', // ok ficar simples: uso só na rede interna da loja
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 12 // sessão dura 12 horas
    }
}));

// Serve os arquivos do front-end (HTML, CSS, JS) que estão na pasta /frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rota simples só pra testar se o servidor está de pé
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', mensagem: 'Servidor do sistema de estoque rodando' });
});

app.use('/api/auth', authRouter);
app.use('/api/produtos', exigirLogin, produtosRouter);
app.use('/api/movimentacoes', exigirLogin, movimentacoesRouter);
app.use('/api/financeiro', exigirLogin, financeiroRouter);

app.listen(PORTA, '0.0.0.0', () => {
    console.log(`Servidor rodando! Acesse http://localhost:${PORTA} neste computador`);
    console.log('Para acessar de outro dispositivo na mesma rede, use o IP local deste computador em vez de "localhost"');
});
