// frontend/js/financeiro.js
// Carrega o resumo do mês selecionado, o gráfico dos últimos 6 meses,
// o relatório detalhado, e cuida do botão "Fechar mês".

fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (!dados.autenticado) window.location.href = 'index.html';
    });

const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const seletorMes = document.getElementById('seletorMes');
const seletorAno = document.getElementById('seletorAno');

// Popula os seletores de mês/ano (ano atual e anterior, só pra ter opções)
const hoje = new Date();
nomesMeses.forEach((nome, indice) => {
    const opcao = document.createElement('option');
    opcao.value = indice + 1;
    opcao.textContent = nome;
    seletorMes.appendChild(opcao);
});
seletorMes.value = hoje.getMonth() + 1;

[hoje.getFullYear() - 1, hoje.getFullYear()].forEach(ano => {
    const opcao = document.createElement('option');
    opcao.value = ano;
    opcao.textContent = ano;
    seletorAno.appendChild(opcao);
});
seletorAno.value = hoje.getFullYear();

seletorMes.addEventListener('change', carregarTudo);
seletorAno.addEventListener('change', carregarTudo);

function carregarTudo() {
    carregarResumoMes();
    carregarHistoricoFechamentos();
}

let grafico = null;

function carregarResumoMes() {
    const ano = seletorAno.value;
    const mes = seletorMes.value;

    fetch(`/api/financeiro/resumo-mes?ano=${ano}&mes=${mes}`)
        .then(resposta => resposta.json())
        .then(resumo => {
            document.getElementById('numeroTotalComprado').textContent = formatarReais(resumo.totalComprado);
            document.getElementById('numeroTotalVendido').textContent = formatarReais(resumo.totalVendido);
            document.getElementById('numeroLucro').textContent = formatarReais(resumo.lucro);
            document.getElementById('numeroMargem').textContent = `${resumo.margemPercentual}%`;

            document.getElementById('insightMes').textContent = resumo.insight;

            const listaMaisVendidos = document.getElementById('listaMaisVendidos');
            listaMaisVendidos.innerHTML = '';
            if (resumo.produtosMaisVendidos.length === 0) {
                listaMaisVendidos.innerHTML = '<li>Nenhuma venda registrada nesse mês.</li>';
            } else {
                resumo.produtosMaisVendidos.forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = `${p.nome} — ${p.quantidade} unidades`;
                    listaMaisVendidos.appendChild(li);
                });
            }

            document.getElementById('produtoMaiorLucro').textContent = resumo.produtoMaiorLucroPercentual
                ? `${resumo.produtoMaiorLucroPercentual.nome} — ${resumo.produtoMaiorLucroPercentual.percentual}% de margem`
                : 'Nenhum dado disponível para esse mês.';
        });
}

function carregarGrafico() {
    fetch('/api/financeiro/historico-grafico?meses=6')
        .then(resposta => resposta.json())
        .then(historico => {
            const ctx = document.getElementById('graficoBarras');

            if (grafico) grafico.destroy();

            grafico = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: historico.map(h => h.rotulo),
                    datasets: [
                        {
                            label: 'Gastos',
                            data: historico.map(h => h.totalComprado),
                            backgroundColor: '#C0392B'
                        },
                        {
                            label: 'Recebido',
                            data: historico.map(h => h.totalVendido),
                            backgroundColor: '#2E7D52'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        });
}

function carregarHistoricoFechamentos() {
    fetch('/api/financeiro/fechamentos')
        .then(resposta => resposta.json())
        .then(fechamentos => {
            const container = document.getElementById('listaFechamentos');
            container.innerHTML = '';

            if (fechamentos.length === 0) {
                container.innerHTML = '<p>Nenhum mês fechado ainda.</p>';
                return;
            }

            fechamentos.forEach(f => {
                const linha = document.createElement('div');
                linha.className = 'item-fechamento';
                linha.innerHTML = `
                    <span class="item-fechamento-mes">${nomesMeses[f.mes - 1]}/${f.ano}</span>
                    <span>Comprado: ${formatarReais(f.resumo.totalComprado)} · Vendido: ${formatarReais(f.resumo.totalVendido)} · Lucro: ${formatarReais(f.resumo.lucro)}</span>
                `;
                container.appendChild(linha);
            });
        });
}

document.getElementById('botaoFecharMes').addEventListener('click', async () => {
    const ano = Number(seletorAno.value);
    const mes = Number(seletorMes.value);

    const confirmou = confirm(`Fechar ${nomesMeses[mes - 1]}/${ano}? Isso salva o relatório desse mês no histórico.`);
    if (!confirmou) return;

    const botao = document.getElementById('botaoFecharMes');
    botao.disabled = true;
    botao.textContent = 'Fechando...';

    try {
        await fetch('/api/financeiro/fechar-mes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ano, mes })
        });
        carregarHistoricoFechamentos();
    } finally {
        botao.disabled = false;
        botao.textContent = 'Fechar mês';
    }
});

function formatarReais(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- Inicialização ---
carregarResumoMes();
carregarGrafico();
carregarHistoricoFechamentos();
