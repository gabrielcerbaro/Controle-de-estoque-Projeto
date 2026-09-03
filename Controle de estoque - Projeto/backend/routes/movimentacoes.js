// backend/routes/movimentacoes.js
// Fluxo de entrada de produto via XML da NF-e.
// Duas etapas no backend:
//  1) /entrada/importar-xml — só LÊ o XML e devolve os dados pro front-end
//     mostrar na tela de confirmação. NADA é salvo ainda nessa etapa.
//  2) /entrada/confirmar — recebe os dados já confirmados (e com peso/categoria/
//     parcelamento preenchidos) e SÓ AÍ grava no estoque e no histórico.

const express = require('express');
const router = express.Router();
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');
const { uploadXml } = require('../config/upload');
const armazenamento = require('../data/armazenamento');

// POST /api/movimentacoes/entrada/importar-xml
router.post('/entrada/importar-xml', uploadXml.single('arquivoXml'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ erro: 'Nenhum arquivo XML enviado' });
    }

    try {
        const conteudoXml = fs.readFileSync(req.file.path, 'utf-8');
        const resultado = await xml2js.parseStringPromise(conteudoXml, { explicitArray: false });

        // O XML da NF-e pode vir com ou sem o envelope "nfeProc" dependendo de onde foi baixado
        const infNFe = (resultado.nfeProc && resultado.nfeProc.NFe && resultado.nfeProc.NFe.infNFe)
            || (resultado.NFe && resultado.NFe.infNFe);

        if (!infNFe) {
            return res.status(400).json({ erro: 'Não foi possível reconhecer esse arquivo como uma NF-e válida.' });
        }

        // Quando a nota tem só 1 produto, o xml2js entrega um objeto em vez de lista.
        // Normalizamos pra sempre trabalhar com uma lista (array).
        const detalhes = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

        const itens = detalhes.map(det => {
            const prod = det.prod;
            return {
                codigo: prod.cProd,
                nome: prod.xProd,
                quantidade: Number(prod.qCom),
                valorUnitarioOriginal: Number(prod.vUnCom),
                valorTotalItemOriginal: Number(prod.vProd)
            };
        });

        const valorTotalNota = Number(itens.reduce((soma, item) => soma + item.valorTotalItemOriginal, 0).toFixed(2));
        const quantidadeTotalNota = itens.reduce((soma, item) => soma + item.quantidade, 0);

        // Peso bruto normalmente vem um valor só pra nota inteira (em transp/vol/pesoB)
        let pesoTotalNota = 0;
        if (infNFe.transp && infNFe.transp.vol) {
            const volume = Array.isArray(infNFe.transp.vol) ? infNFe.transp.vol[0] : infNFe.transp.vol;
            pesoTotalNota = Number(volume.pesoB) || 0;
        }

        // Divide o peso total proporcionalmente pela quantidade de cada item
        const itensComPeso = itens.map(item => ({
            ...item,
            pesoBruto: quantidadeTotalNota > 0
                ? Number(((item.quantidade / quantidadeTotalNota) * pesoTotalNota).toFixed(3))
                : 0
        }));

        res.json({
            itens: itensComPeso,
            valorTotalNota,
            pesoTotalNota
        });

    } catch (erro) {
        console.error(erro);
        res.status(400).json({ erro: 'Não foi possível ler esse arquivo XML. Confira se é um XML de NF-e válido.' });
    }
});

// POST /api/movimentacoes/entrada/confirmar
router.post('/entrada/confirmar', (req, res) => {
    const { itens, valorTotalNota, parcelamento } = req.body;

    // --- Validações obrigatórias — nada é salvo se alguma etapa não foi respondida ---
    if (!itens || itens.length === 0) {
        return res.status(400).json({ erro: 'Nenhum item para confirmar' });
    }
    if (!parcelamento || typeof parcelamento.parcelado !== 'boolean') {
        return res.status(400).json({ erro: 'É obrigatório informar se a compra foi parcelada' });
    }
    if (parcelamento.parcelado && (!parcelamento.numeroParcelas || parcelamento.numeroParcelas < 2)) {
        return res.status(400).json({ erro: 'Informe em quantas vezes a compra foi parcelada' });
    }
    if (parcelamento.parcelado && typeof parcelamento.teveJuros !== 'boolean') {
        return res.status(400).json({ erro: 'É obrigatório informar se houve incidência de juros' });
    }
    if (parcelamento.parcelado && parcelamento.teveJuros && (!parcelamento.valorTotalComJuros || parcelamento.valorTotalComJuros <= 0)) {
        return res.status(400).json({ erro: 'Informe o valor total da compra com juros' });
    }
    for (const item of itens) {
        if (!item.categoria || item.categoria.trim() === '') {
            return res.status(400).json({ erro: `Informe a categoria do produto "${item.nome}"` });
        }
    }

    const teveJuros = parcelamento.parcelado && parcelamento.teveJuros;
    const valorTotalConsiderado = teveJuros ? parcelamento.valorTotalComJuros : valorTotalNota;
    const fatorJuros = valorTotalConsiderado / valorTotalNota;

    const produtos = armazenamento.ler('produtos');
    const itensFinais = [];

    itens.forEach(item => {
        const valorTotalItemFinal = Number((item.valorTotalItemOriginal * fatorJuros).toFixed(2));
        const valorUnitarioFinal = Number((valorTotalItemFinal / item.quantidade).toFixed(2));

        const produtoExistente = produtos.find(p => p.codigo === item.codigo);

        if (produtoExistente) {
            // Produto já existia (mesmo código) — soma a quantidade e atualiza
            // pro custo mais recente dessa entrada
            produtoExistente.quantidade += item.quantidade;
            produtoExistente.valorUnitario = valorUnitarioFinal;
            produtoExistente.valorTotalCompra = valorTotalItemFinal;
            produtoExistente.pesoBruto = item.pesoBruto;
            produtoExistente.categoria = item.categoria;
        } else {
            produtos.push({
                id: crypto.randomUUID(),
                codigo: item.codigo,
                nome: item.nome,
                categoria: item.categoria,
                valorTotalCompra: valorTotalItemFinal,
                valorUnitario: valorUnitarioFinal,
                pesoBruto: item.pesoBruto,
                quantidade: item.quantidade
            });
        }

        itensFinais.push({
            codigo: item.codigo,
            nome: item.nome,
            quantidade: item.quantidade,
            valorUnitario: valorUnitarioFinal,
            valorTotalItem: valorTotalItemFinal
        });
    });

    armazenamento.salvar('produtos', produtos);

    // Guarda o histórico dessa entrada — vai alimentar a tela financeira no Bloco 6
    const movimentacoes = armazenamento.ler('movimentacoes');
    movimentacoes.push({
        id: crypto.randomUUID(),
        tipo: 'entrada',
        data: new Date().toISOString(),
        parcelado: parcelamento.parcelado,
        numeroParcelas: parcelamento.parcelado ? parcelamento.numeroParcelas : 1,
        teveJuros: teveJuros,
        valorTotalOriginal: valorTotalNota,
        valorTotalConsiderado: valorTotalConsiderado,
        itens: itensFinais
    });
    armazenamento.salvar('movimentacoes', movimentacoes);

    res.json({ mensagem: 'Entrada registrada com sucesso', itens: itensFinais });
});

// POST /api/movimentacoes/saida
// Fluxo rápido de saída: dá baixa no estoque. Se o valor de venda for menor
// que o custo (valorUnitario), avisa mas NÃO bloqueia — só bloqueia de verdade
// se a quantidade pedida for maior do que o que tem em estoque.
// POST /api/movimentacoes/saida
// Agora recebe uma LISTA de itens (carrinho), não 1 produto só.
// O parcelamento (a prazo) vale pra venda inteira, não por item.
router.post('/saida', (req, res) => {
    const { itens, aPrazo, numeroParcelas, confirmarMesmoComPrejuizo } = req.body;

    if (!itens || itens.length === 0) {
        return res.status(400).json({ erro: 'Nenhum item na venda' });
    }
    for (const item of itens) {
        if (!item.codigo || !item.quantidade || item.quantidade <= 0 || !item.valorVenda || item.valorVenda <= 0) {
            return res.status(400).json({ erro: 'Todos os itens precisam de quantidade e valor de venda válidos' });
        }
    }

    const produtos = armazenamento.ler('produtos');

    // Confere se todo item existe e tem estoque suficiente ANTES de mexer em qualquer coisa
    for (const item of itens) {
        const produto = produtos.find(p => p.codigo === item.codigo);
        if (!produto) {
            return res.status(404).json({ erro: `Produto "${item.codigo}" não encontrado` });
        }
        if (item.quantidade > produto.quantidade) {
            return res.status(400).json({ erro: `"${produto.nome}": quantidade maior que o estoque disponível (${produto.quantidade})` });
        }
    }

    // Confere se algum item está sendo vendido abaixo do custo
    const itensComPrejuizo = itens
        .map(item => ({ item, produto: produtos.find(p => p.codigo === item.codigo) }))
        .filter(({ item, produto }) => item.valorVenda < produto.valorUnitario);

    if (itensComPrejuizo.length > 0 && !confirmarMesmoComPrejuizo) {
        const nomes = itensComPrejuizo.map(({ produto }) => produto.nome).join(', ');
        return res.json({
            alerta: true,
            mensagem: `Os seguintes produtos estão sendo vendidos abaixo do valor de custo: ${nomes}.`
        });
    }

    // Tudo certo — agora sim aplica de verdade
    const movimentacoes = armazenamento.ler('movimentacoes');
    const parcelasDaVenda = aPrazo ? numeroParcelas : 1;

    itens.forEach(item => {
        const produto = produtos.find(p => p.codigo === item.codigo);
        produto.quantidade -= item.quantidade;

        movimentacoes.push({
            id: crypto.randomUUID(),
            tipo: 'saida',
            data: new Date().toISOString(),
            codigo: produto.codigo,
            nome: produto.nome,
            quantidade: item.quantidade,
            valorVendaUnitario: item.valorVenda,
            valorVendaTotal: Number((item.valorVenda * item.quantidade).toFixed(2)),
            valorCustoUnitario: produto.valorUnitario,
            houvePrejuizo: item.valorVenda < produto.valorUnitario,
            aPrazo: !!aPrazo,
            numeroParcelas: parcelasDaVenda
        });
    });

    armazenamento.salvar('produtos', produtos);
    armazenamento.salvar('movimentacoes', movimentacoes);

    res.json({ mensagem: 'Venda registrada com sucesso' });
});

// GET /api/movimentacoes/historico?tipo=&produto=&dataInicio=&dataFim=
// Junta entradas e saídas numa lista só, já filtrada, pra tela de histórico.
// Nas entradas, cada produto da nota vira uma linha própria (uma entrada
// pode ter vários produtos numa nota só).
router.get('/historico', (req, res) => {
    const { tipo, produto, dataInicio, dataFim } = req.query;
    const movimentacoes = armazenamento.ler('movimentacoes');
    let linhas = [];

    movimentacoes.forEach(mov => {
        if (mov.tipo === 'entrada') {
            (mov.itens || []).forEach(item => {
                linhas.push({
                    data: mov.data,
                    tipo: 'entrada',
                    codigo: item.codigo,
                    nome: item.nome,
                    quantidade: item.quantidade,
                    valorUnitario: item.valorUnitario,
                    valorTotal: item.valorTotalItem,
                    parcelado: mov.parcelado,
                    numeroParcelas: mov.numeroParcelas
                });
            });
        } else if (mov.tipo === 'saida') {
            linhas.push({
                data: mov.data,
                tipo: 'saida',
                codigo: mov.codigo,
                nome: mov.nome,
                quantidade: mov.quantidade,
                valorUnitario: mov.valorVendaUnitario,
                valorTotal: mov.valorVendaTotal,
                aPrazo: mov.aPrazo,
                numeroParcelas: mov.numeroParcelas,
                houvePrejuizo: mov.houvePrejuizo
            });
        }
    });

    if (tipo) {
        linhas = linhas.filter(l => l.tipo === tipo);
    }
    if (produto) {
        const termo = produto.toLowerCase();
        linhas = linhas.filter(l => l.nome.toLowerCase().includes(termo));
    }
    if (dataInicio) {
        linhas = linhas.filter(l => new Date(l.data) >= new Date(dataInicio));
    }
    if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999); // inclui o dia inteiro do "até"
        linhas = linhas.filter(l => new Date(l.data) <= fim);
    }

    linhas.sort((a, b) => new Date(b.data) - new Date(a.data));

    res.json(linhas);
});

module.exports = router;
