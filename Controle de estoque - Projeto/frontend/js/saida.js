// frontend/js/saida.js
// Fluxo rápido de saída: buscar produto -> quantidade + valor de venda -> registrar.
// Se o valor de venda for menor que o custo, avisa mas deixa continuar.

fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (!dados.autenticado) window.location.href = 'index.html';
    });

let todosOsProdutos = [];
let produtoSelecionado = null;

fetch('/api/produtos')
    .then(resposta => resposta.json())
    .then(produtos => { todosOsProdutos = produtos; });

window.addEventListener('pageshow', (evento) => {
    if (evento.persisted) {
        fetch('/api/produtos')
            .then(resposta => resposta.json())
            .then(produtos => { todosOsProdutos = produtos; });
    }
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

document.getElementById('botaoTrocarProduto').addEventListener('click', () => {
    produtoSelecionado = null;
    document.getElementById('blocoFormulario').style.display = 'none';
    document.getElementById('blocoBusca').style.display = 'block';
});

document.getElementById('botaoRegistrarSaida').addEventListener('click', () => {
    registrarSaida(false);
});

async function registrarSaida(confirmarMesmoComPrejuizo) {
    mensagemErroSaida.textContent = '';

    const quantidade = Number(document.getElementById('quantidadeSaida').value);
    const valorVenda = Number(document.getElementById('valorVendaUnitario').value);

    if (!quantidade || quantidade <= 0) {
        mensagemErroSaida.textContent = 'Informe a quantidade vendida.';
        return;
    }
    if (!valorVenda || valorVenda <= 0) {
        mensagemErroSaida.textContent = 'Informe o valor de venda.';
        return;
    }

    const botao = document.getElementById('botaoRegistrarSaida');
    botao.disabled = true;
    botao.textContent = 'Registrando...';

    try {
        const resposta = await fetch('/api/movimentacoes/saida', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codigo: produtoSelecionado.codigo,
                quantidade,
                valorVenda,
                confirmarMesmoComPrejuizo
            })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagemErroSaida.textContent = dados.erro || 'Não foi possível registrar a saída.';
            botao.disabled = false;
            botao.textContent = 'Registrar saída';
            return;
        }

        if (dados.alerta) {
            const confirmou = confirm(`${dados.mensagem}\n\nDeseja continuar mesmo assim?`);
            botao.disabled = false;
            botao.textContent = 'Registrar saída';
            if (confirmou) {
                await registrarSaida(true);
            }
            return;
        }

        window.location.href = 'dashboard.html';

    } catch (erro) {
        mensagemErroSaida.textContent = 'Não foi possível conectar ao servidor.';
        botao.disabled = false;
        botao.textContent = 'Registrar saída';
    }
}

function formatarReais(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
