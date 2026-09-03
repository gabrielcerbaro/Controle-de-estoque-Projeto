// frontend/js/historico.js

fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (!dados.autenticado) window.location.href = 'index.html';
    });

const filtroTipo = document.getElementById('filtroTipo');
const filtroProduto = document.getElementById('filtroProduto');
const filtroDataInicio = document.getElementById('filtroDataInicio');
const filtroDataFim = document.getElementById('filtroDataFim');

[filtroTipo, filtroProduto, filtroDataInicio, filtroDataFim].forEach(campo => {
    campo.addEventListener('input', carregarHistorico);
    campo.addEventListener('change', carregarHistorico);
});

document.getElementById('botaoLimparFiltros').addEventListener('click', () => {
    filtroTipo.value = '';
    filtroProduto.value = '';
    filtroDataInicio.value = '';
    filtroDataFim.value = '';
    carregarHistorico();
});

function carregarHistorico() {
    const parametros = new URLSearchParams();
    if (filtroTipo.value) parametros.set('tipo', filtroTipo.value);
    if (filtroProduto.value) parametros.set('produto', filtroProduto.value);
    if (filtroDataInicio.value) parametros.set('dataInicio', filtroDataInicio.value);
    if (filtroDataFim.value) parametros.set('dataFim', filtroDataFim.value);

    fetch(`/api/movimentacoes/historico?${parametros.toString()}`)
        .then(resposta => resposta.json())
        .then(renderizarHistorico);
}

function renderizarHistorico(linhas) {
    const container = document.getElementById('listaHistorico');
    const estadoVazio = document.getElementById('estadoVazioHistorico');
    container.innerHTML = '';

    if (linhas.length === 0) {
        estadoVazio.style.display = 'block';
        return;
    }
    estadoVazio.style.display = 'none';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'linha-historico cabecalho';
    cabecalho.innerHTML = `
        <span>Data</span><span>Tipo</span><span>Produto</span>
        <span>Qtd.</span><span>Valor unit.</span><span>Valor total</span>
    `;
    container.appendChild(cabecalho);

    linhas.forEach(linha => {
        const linhaEl = document.createElement('div');
        linhaEl.className = 'linha-historico';

        const dataFormatada = new Date(linha.data).toLocaleDateString('pt-BR');
        const detalheParcela = linha.tipo === 'entrada'
            ? (linha.parcelado ? ` (${linha.numeroParcelas}x)` : '')
            : (linha.aPrazo ? ` (${linha.numeroParcelas}x)` : '');
        const avisoPrejuizo = linha.houvePrejuizo ? ' ⚠️' : '';

        linhaEl.innerHTML = `
            <span>${dataFormatada}</span>
            <span><span class="tag-tipo ${linha.tipo}">${linha.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></span>
            <span>${linha.nome}${detalheParcela}${avisoPrejuizo}</span>
            <span>${linha.quantidade}</span>
            <span>${formatarReais(linha.valorUnitario)}</span>
            <span>${formatarReais(linha.valorTotal)}</span>
        `;
        container.appendChild(linhaEl);
    });
}

function formatarReais(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

carregarHistorico();