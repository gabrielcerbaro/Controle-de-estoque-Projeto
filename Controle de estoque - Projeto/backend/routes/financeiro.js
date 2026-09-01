// backend/routes/financeiro.js
// Tudo relacionado à tela financeira: resumo de um mês, gráfico dos últimos
// meses, e o "fechamento" mensal que a pessoa aciona manualmente.
//
// Regra importante sobre parcelamento (definida pelo usuário):
// compras parceladas NÃO contam no mês em que foram feitas — o valor é
// dividido pelo número de parcelas e cada parcela cai num dos meses
// seguintes (1ª parcela no mês seguinte à compra, e assim por diante).

const express = require('express');
const router = express.Router();
const armazenamento = require('../data/armazenamento');

function calcularResumoDoMes(ano, mes) {
    const movimentacoes = armazenamento.ler('movimentacoes');

    let totalComprado = 0;
    let totalVendido = 0;
    const vendasPorProduto = {}; // codigo -> { nome, quantidade, totalVenda, totalCusto }
    let quantidadeVendasComPrejuizo = 0;

    movimentacoes.forEach(mov => {
        const dataMov = new Date(mov.data);

        if (mov.tipo === 'entrada') {
            if (!mov.parcelado) {
                if (dataMov.getFullYear() === ano && (dataMov.getMonth() + 1) === mes) {
                    totalComprado += mov.valorTotalConsiderado;
                }
            } else {
                const valorParcela = mov.valorTotalConsiderado / mov.numeroParcelas;
                for (let i = 1; i <= mov.numeroParcelas; i++) {
                    const dataParcela = new Date(dataMov.getFullYear(), dataMov.getMonth() + i, 1);
                    if (dataParcela.getFullYear() === ano && (dataParcela.getMonth() + 1) === mes) {
                        totalComprado += valorParcela;
                    }
                }
            }
        }

        if (mov.tipo === 'saida') {
            if (dataMov.getFullYear() === ano && (dataMov.getMonth() + 1) === mes) {
                totalVendido += mov.valorVendaTotal;

                if (!vendasPorProduto[mov.codigo]) {
                    vendasPorProduto[mov.codigo] = { nome: mov.nome, quantidade: 0, totalVenda: 0, totalCusto: 0 };
                }
                vendasPorProduto[mov.codigo].quantidade += mov.quantidade;
                vendasPorProduto[mov.codigo].totalVenda += mov.valorVendaTotal;
                vendasPorProduto[mov.codigo].totalCusto += mov.valorCustoUnitario * mov.quantidade;

                if (mov.houvePrejuizo) quantidadeVendasComPrejuizo++;
            }
        }
    });

    totalComprado = Number(totalComprado.toFixed(2));
    totalVendido = Number(totalVendido.toFixed(2));
    const lucro = Number((totalVendido - totalComprado).toFixed(2));
    const margemPercentual = totalVendido > 0 ? Number(((lucro / totalVendido) * 100).toFixed(1)) : 0;

    const listaProdutos = Object.values(vendasPorProduto);

    const produtosMaisVendidos = [...listaProdutos]
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5)
        .map(p => ({ nome: p.nome, quantidade: p.quantidade }));

    let produtoMaiorLucroPercentual = null;
    listaProdutos.forEach(p => {
        if (p.totalCusto <= 0) return;
        const percentual = Number((((p.totalVenda - p.totalCusto) / p.totalCusto) * 100).toFixed(1));
        if (!produtoMaiorLucroPercentual || percentual > produtoMaiorLucroPercentual.percentual) {
            produtoMaiorLucroPercentual = { nome: p.nome, percentual };
        }
    });

    const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    let insight = `Em ${nomeMes}, o total comprado (considerando parcelas do mês) foi de ${formatarReais(totalComprado)} e o total vendido foi de ${formatarReais(totalVendido)}, resultando em um lucro bruto de ${formatarReais(lucro)} (${margemPercentual}% de margem sobre o faturamento). `;

    if (produtosMaisVendidos.length > 0) {
        insight += `O produto mais vendido foi "${produtosMaisVendidos[0].nome}", com ${produtosMaisVendidos[0].quantidade} unidades vendidas. `;
    } else {
        insight += `Nenhuma venda foi registrada nesse mês. `;
    }

    if (produtoMaiorLucroPercentual) {
        insight += `O produto com maior percentual de lucro foi "${produtoMaiorLucroPercentual.nome}", com ${produtoMaiorLucroPercentual.percentual}% de margem sobre o custo. `;
    }

    if (quantidadeVendasComPrejuizo > 0) {
        insight += `Atenção: ${quantidadeVendasComPrejuizo} venda(s) desse mês foram feitas abaixo do valor de custo.`;
    }

    return {
        ano, mes,
        totalComprado, totalVendido, lucro, margemPercentual,
        produtosMaisVendidos, produtoMaiorLucroPercentual,
        quantidadeVendasComPrejuizo,
        insight
    };
}

function formatarReais(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// GET /api/financeiro/resumo-mes?ano=2026&mes=9
router.get('/resumo-mes', (req, res) => {
    const ano = Number(req.query.ano);
    const mes = Number(req.query.mes);
    if (!ano || !mes) {
        return res.status(400).json({ erro: 'Informe ano e mes' });
    }
    res.json(calcularResumoDoMes(ano, mes));
});

// GET /api/financeiro/historico-grafico?meses=6
// Últimos N meses (incluindo o atual), pra alimentar o gráfico de barras
router.get('/historico-grafico', (req, res) => {
    const quantidadeMeses = Number(req.query.meses) || 6;
    const hoje = new Date();
    const historico = [];

    for (let i = quantidadeMeses - 1; i >= 0; i--) {
        const dataReferencia = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const resumo = calcularResumoDoMes(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1);
        historico.push({
            rotulo: dataReferencia.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            totalComprado: resumo.totalComprado,
            totalVendido: resumo.totalVendido
        });
    }

    res.json(historico);
});

// POST /api/financeiro/fechar-mes  { ano, mes }
router.post('/fechar-mes', (req, res) => {
    const { ano, mes } = req.body;
    if (!ano || !mes) {
        return res.status(400).json({ erro: 'Informe ano e mes' });
    }

    const resumo = calcularResumoDoMes(ano, mes);

    const fechamentos = armazenamento.ler('fechamentos');
    const indiceExistente = fechamentos.findIndex(f => f.ano === ano && f.mes === mes);

    const registroFechamento = {
        ano, mes,
        dataFechamento: new Date().toISOString(),
        resumo
    };

    if (indiceExistente >= 0) {
        fechamentos[indiceExistente] = registroFechamento;
    } else {
        fechamentos.push(registroFechamento);
    }

    armazenamento.salvar('fechamentos', fechamentos);
    res.json(registroFechamento);
});

// GET /api/financeiro/fechamentos
router.get('/fechamentos', (req, res) => {
    const fechamentos = armazenamento.ler('fechamentos');
    const ordenados = [...fechamentos].sort((a, b) => (b.ano - a.ano) || (b.mes - a.mes));
    res.json(ordenados);
});

module.exports = router;
