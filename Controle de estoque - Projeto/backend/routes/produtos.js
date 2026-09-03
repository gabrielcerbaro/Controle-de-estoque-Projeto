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

// GET /api/produtos/:codigo — busca um produto específico (pra tela de edição)
router.get('/:codigo', (req, res) => {
    const produtos = armazenamento.ler('produtos');
    const produto = produtos.find(p => p.codigo === req.params.codigo);

    if (!produto) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    res.json(produto);
});

// PUT /api/produtos/:codigo — salva as alterações feitas na edição
router.put('/:codigo', (req, res) => {
    const { nome, categoria, valorUnitario, valorTotalCompra, pesoBruto, quantidade } = req.body;

    if (!nome || !categoria || valorUnitario == null || quantidade == null) {
        return res.status(400).json({ erro: 'Preencha nome, categoria, valor unitário e quantidade' });
    }
    if (valorUnitario < 0 || quantidade < 0) {
        return res.status(400).json({ erro: 'Valores e quantidade não podem ser negativos' });
    }

    const produtos = armazenamento.ler('produtos');
    const produto = produtos.find(p => p.codigo === req.params.codigo);

    if (!produto) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    produto.nome = nome;
    produto.categoria = categoria;
    produto.valorUnitario = Number(valorUnitario);
    produto.valorTotalCompra = Number(valorTotalCompra) || 0;
    produto.pesoBruto = Number(pesoBruto) || 0;
    produto.quantidade = Number(quantidade);

    armazenamento.salvar('produtos', produtos);
    res.json({ mensagem: 'Produto atualizado com sucesso', produto });
});

// DELETE /api/produtos/:codigo — remove o produto do estoque atual.
// O histórico de entradas/saídas dele NÃO é apagado, porque cada
// movimentação já guarda sua própria cópia dos dados (nome, código,
// valores) — ela não depende do produto continuar existindo.
router.delete('/:codigo', (req, res) => {
    const produtos = armazenamento.ler('produtos');
    const produtoExiste = produtos.some(p => p.codigo === req.params.codigo);

    if (!produtoExiste) {
        return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const produtosRestantes = produtos.filter(p => p.codigo !== req.params.codigo);
    armazenamento.salvar('produtos', produtosRestantes);

    // Remove o histórico desse produto. Precisa tratar entrada e saída
    // diferente: saída tem "codigo" direto na movimentação, mas entrada
    // guarda o código dentro da lista de itens (uma nota pode ter vários
    // produtos), então precisamos olhar dentro dela.
    const movimentacoes = armazenamento.ler('movimentacoes');
    const movimentacoesRestantes = [];

    movimentacoes.forEach(mov => {
        if (mov.tipo === 'saida') {
            if (mov.codigo !== req.params.codigo) {
                movimentacoesRestantes.push(mov);
            }
            return;
        }

        if (mov.tipo === 'entrada') {
            const itemDoProduto = (mov.itens || []).find(item => item.codigo === req.params.codigo);

            if (!itemDoProduto) {
                movimentacoesRestantes.push(mov);
                return;
            }

            const itensRestantesDaNota = mov.itens.filter(item => item.codigo !== req.params.codigo);

            // Se a nota era só desse produto, a movimentação inteira some.
            // Se tinha outros produtos junto, mantém a nota, só tira esse item
            // e desconta o valor dele do total considerado da compra.
            if (itensRestantesDaNota.length === 0) {
                return;
            }

            mov.itens = itensRestantesDaNota;
            mov.valorTotalConsiderado = Number((mov.valorTotalConsiderado - itemDoProduto.valorTotalItem).toFixed(2));
            mov.valorTotalOriginal = Number((mov.valorTotalOriginal - itemDoProduto.valorTotalItem).toFixed(2));
            movimentacoesRestantes.push(mov);
            return;
        }

        movimentacoesRestantes.push(mov);
    });

    armazenamento.salvar('movimentacoes', movimentacoesRestantes);

    res.json({ mensagem: 'Produto e todo o seu histórico foram excluídos' });
});

module.exports = router;
