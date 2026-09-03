// frontend/js/saida.js
// Fluxo de saída com carrinho: adiciona quantos produtos quiser antes de finalizar.

fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (!dados.autenticado) window.location.href = 'index.html';
    });

let todosOsProdutos = [];
let produtoSelecionado = null;
let itensVenda = [];
let aPrazo = null;
let numeroParcelasVenda = null;

function carregarProdutosDoServidor() {
    fetch('/api/produtos')
        .then(resposta => resposta.json())
        .then(produtos => { todosOsProdutos = produtos; });
}
carregarProdutosDoServidor();

window.addEventListener('pageshow', (evento) => {
    if (evento.persisted) carregarProdutosDoServidor();
});

const buscaInput = document.getElementById('buscaProdutoSaida');
const resultadosBusca = document.getElementById('resultadosBusca');
const mensagemErroSaida = document.getElementById('mensagemErroSaida');

buscaInput.addEventListener('input', () => {
    const termo = buscaInput.value.toLowerCase().trim();
    resultadosBusca.innerHTML = '';
    if (!termo) return;

    const encontrados = todosOsProdutos.filter(p => (p.nome || '').toLowerCase().includes(termo));

    encontrados.forEach(produto => {
        const item = document.createElement('div');
        item.className = 'resultado-item';
        item.innerHTML = `
            <span>${produto.nome}</span>
            <span class="resultado-item-estoque">${produto.quantidade} em estoque</span>
        `;
        item.addEventListener('click', () => selecionarProduto(produto));
        resultadosBusca.appendChild(item);
    });
});

function selecionarProduto(produto) {
    produtoSelecionado = produto;
    buscaInput.value = '';
    resultadosBusca.innerHTML = '';
    mensagemErroSaida.textContent = '';

    document.getElementById('nomeProdutoSelecionado').textContent = produto.nome;
    document.getElementById('estoqueDisponivel').textContent = produto.quantidade;
    document.getElementById('custoUnitario').textContent = formatarReais(produto.valorUnitario);
    document.getElementById('quantidadeSaida').value = '';
    document.getElementById('quantidadeSaida').max = produto.quantidade;
    document.getElementById('valorVendaUnitario').value = '';

    document.getElementById('blocoBusca').style.display = 'none';
    document.getElementById('blocoFormulario').style.display = 'block';
}

document.getElementById('botaoTrocarProduto').addEventListener('click', voltarParaBusca);

function voltarParaBusca() {
    produtoSelecionado = null;
    document.getElementById('blocoFormulario').style.display = 'none';
    document.getElementById('blocoBusca').style.display = 'block';
}

document.getElementById('botaoAdicionarCarrinho').addEventListener('click', () => {
    mensagemErroSaida.textContent = '';

    const quantidade = Number(document.getElementById('quantidadeSaida').value);
    const valorVenda = Number(document.getElementById('valorVendaUnitario').value);

    if (!quantidade || quantidade <= 0) {
        mensagemErroSaida.textContent = 'Informe a quantidade vendida.';
        return;
    }
    if (quantidade > produtoSelecionado.quantidade) {
        mensagemErroSaida.textContent = `Quantidade maior que o estoque disponível (${produtoSelecionado.quantidade}).`;
        return;
    }
    if (!valorVenda || valorVenda <= 0) {
        mensagemErroSaida.textContent = 'Informe o valor de venda.';
        return;
    }

    itensVenda.push({
        codigo: produtoSelecionado.codigo,
        nome: produtoSelecionado.nome,
        quantidade,
        valorVenda,
        custoUnitario: produtoSelecionado.valorUnitario
    });

    renderizarCarrinho();
    voltarParaBusca();
});

function renderizarCarrinho() {
    const listaCarrinho = document.getElementById('listaCarrinho');
    listaCarrinho.innerHTML = '';
    let total = 0;

    itensVenda.forEach((item, indice) => {
        total += item.quantidade * item.valorVenda;

        const linha = document.createElement('div');
        linha.className = 'item-carrinho';
        linha.innerHTML = `
            <span>${item.nome} — ${item.quantidade} un. × ${formatarReais(item.valorVenda)}</span>
            <button type="button" data-indice="${indice}" class="botao-remover-item">Remover</button>
        `;
        listaCarrinho.appendChild(linha);
    });

    listaCarrinho.querySelectorAll('.botao-remover-item').forEach(botao => {
        botao.addEventListener('click', () => {
            itensVenda.splice(Number(botao.dataset.indice), 1);
            renderizarCarrinho();
        });
    });

    document.getElementById('totalCarrinho').textContent = formatarReais(total);

    const temItens = itensVenda.length > 0;
    document.getElementById('blocoCarrinho').style.display = temItens ? 'block' : 'none';
    document.getElementById('blocoFinalizar').style.display = temItens ? 'block' : 'none';
}

// --- Parcelamento da venda (uma vez só, pra venda inteira) ---
document.querySelectorAll('.botao-opcao[data-grupo="aPrazo"]').forEach(botao => {
    botao.addEventListener('click', () => {
        const valor = botao.dataset.valor === 'sim';
        document.querySelectorAll('.botao-opcao[data-grupo="aPrazo"]').forEach(b => b.classList.remove('selecionado'));
        botao.classList.add('selecionado');

        aPrazo = valor;
        document.getElementById('perguntaParcelasVenda').style.display = valor ? 'block' : 'none';
        if (!valor) numeroParcelasVenda = null;
    });
});

document.getElementById('numeroParcelasVenda').addEventListener('input', (e) => {
    numeroParcelasVenda = Number(e.target.value);
});

// --- Finalizar venda ---
document.getElementById('botaoFinalizarVenda').addEventListener('click', () => {
    finalizarVenda(false);
});

async function finalizarVenda(confirmarMesmoComPrejuizo) {
    mensagemErroSaida.textContent = '';

    if (aPrazo === null) {
        mensagemErroSaida.textContent = 'Informe se a venda foi a prazo.';
        return;
    }
    if (aPrazo && (!numeroParcelasVenda || numeroParcelasVenda < 2)) {
        mensagemErroSaida.textContent = 'Informe em quantas vezes a venda foi parcelada.';
        return;
    }

    const botao = document.getElementById('botaoFinalizarVenda');
    botao.disabled = true;
    botao.textContent = 'Registrando...';

    try {
        const resposta = await fetch('/api/movimentacoes/saida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                itens: itensVenda,
                aPrazo,
                numeroParcelas: aPrazo ? numeroParcelasVenda : 1,
                confirmarMesmoComPrejuizo
            })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagemErroSaida.textContent = dados.erro || 'Não foi possível registrar a venda.';
            botao.disabled = false;
            botao.textContent = 'Finalizar venda';
            return;
        }

        if (dados.alerta) {
            const confirmou = confirm(`${dados.mensagem}\n\nDeseja continuar mesmo assim?`);
            botao.disabled = false;
            botao.textContent = 'Finalizar venda';
            if (confirmou) await finalizarVenda(true);
            return;
        }

        window.location.href = 'dashboard.html';

    } catch (erro) {
        mensagemErroSaida.textContent = 'Não foi possível conectar ao servidor.';
        botao.disabled = false;
        botao.textContent = 'Finalizar venda';
    }
}

function formatarReais(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}