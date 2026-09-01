// backend/data/armazenamento.js
// Funções pequenas e reutilizáveis pra ler e salvar qualquer um dos nossos
// arquivos JSON (usuarios, produtos, movimentacoes, fechamentos).
// Centralizar isso aqui facilita trocar por um banco SQL no futuro:
// quando esse dia chegar, só mudamos o que tem dentro dessas duas funções,
// o resto do sistema nem percebe a troca.

const fs = require('fs');
const path = require('path');

function caminhoDoArquivo(nomeArquivo) {
    return path.join(__dirname, `${nomeArquivo}.json`);
}

function ler(nomeArquivo) {
    const caminho = caminhoDoArquivo(nomeArquivo);
    const conteudo = fs.readFileSync(caminho, 'utf-8');
    return JSON.parse(conteudo);
}

function salvar(nomeArquivo, dados) {
    const caminho = caminhoDoArquivo(nomeArquivo);
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

module.exports = { ler, salvar };
