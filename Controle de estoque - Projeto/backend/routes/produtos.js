// backend/routes/produtos.js
// Tudo relacionado a consultar produtos do estoque.
// Cadastrar/dar entrada de produto de verdade (via XML) entra no Bloco 4 —
// aqui só deixamos pronto o que a tela principal precisa pra exibir o estoque.

const express = require('express');
const router = express.Router();
const armazenamento = require('../data/armazenamento');

// GET /api/produtos
// Retorna a lista completa de produtos cadastrados
router.get('/', (req, res) => {
    const produtos = armazenamento.ler('produtos');
    res.json(produtos);
});

// GET /api/produtos/resumo
// Números rápidos pra mostrar em cards no topo da tela principal
router.get('/resumo', (req, res) => {
    const produtos = armazenamento.ler('produtos');

    const resumo = {
        totalProdutos: produtos.length,
        quantidadeTotal: 0,
        valorTotalEstoque: 0
    };

    produtos.forEach(produto => {
        resumo.quantidadeTotal += produto.quantidade;
        resumo.valorTotalEstoque += produto.valorUnitario * produto.quantidade;
    });

    res.json(resumo);
});

module.exports = router;
