// frontend/js/dashboard.js
// Protege a página (exige login), carrega o resumo do estoque e a lista
// de produtos, e cuida da busca simples por nome.

let todosOsProdutos = [];

// --- Proteção de login ---
fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (!dados.autenticado) {
            window.location.href = 'index.html';
            return;
        }
        document.getElementById('nomeUsuarioLogado').textContent = dados.usuario;
        if (dados.foto) {
            document.getElementById('avatarPerfil').src = dados.foto;
        }
        carregarResumo();
        carregarProdutos();
    });

document.getElementById('botaoSair').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
});

// Corrige uma falha comum: se a pessoa volta pra essa tela usando o botão
// "voltar" do navegador, ele às vezes mostra uma versão salva em cache da
// página (com os números antigos). Isso força recarregar os dados nesse caso.
window.addEventListener('pageshow', (evento) => {
    if (evento.persisted) {
        carregarResumo();
        carregarProdutos();
    }
});

// --- Cards de resumo ---
function carregarResumo() {
    fetch('/api/produtos/resumo')
        .then(resposta => resposta.json())
        .then(resumo => {
            document.getElementById('numeroTotalProdutos').textContent = resumo.totalProdutos;
            document.getElementById('numeroQuantidadeTotal').textContent = resumo.quantidadeTotal;
            document.getElementById('numeroValorEstoque').textContent = formatarReais(resumo.valorTotalEstoque);
        });
}

// --- Lista de produtos ---
function carregarProdutos() {
    fetch('/api/produtos')
        .then(resposta => resposta.json())
        .then(produtos => {
            todosOsProdutos = produtos;
            renderizarProdutos(produtos);
        });
}

function renderizarProdutos(produtos) {
    const lista = document.getElementById('listaProdutos');
    const estadoVazio = document.getElementById('estadoVazio');

    lista.innerHTML = '';

    if (produtos.length === 0) {
        estadoVazio.style.display = 'block';
        return;
    }
    estadoVazio.style.display = 'none';

    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'card-produto';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            window.location.href = `editar-produto.html?codigo=${encodeURIComponent(produto.codigo)}`;
        });

        const quantidadeBaixa = produto.quantidade > 0 && produto.quantidade <= 3;
        const semEstoque = produto.quantidade === 0;

        card.innerHTML = `
            <span class="card-produto-categoria">${produto.categoria || 'Sem categoria'}</span>
            ${semEstoque ? '<span class="card-produto-sem-estoque">Sem estoque</span>' : ''}
            <p class="card-produto-nome">${produto.nome}</p>
            <p class="card-produto-codigo">Código: ${produto.codigo}</p>
            <div class="card-produto-linha">
                <span>Quantidade</span>
                <strong class="${quantidadeBaixa || semEstoque ? 'card-produto-quantidade-baixa' : ''}">${produto.quantidade}</strong>
            </div>
            <div class="card-produto-linha">
                <span>Valor unitário</span>
                <strong>${formatarReais(produto.valorUnitario)}</strong>
            </div>
            <div class="card-produto-linha">
                <span>Peso bruto</span>
                <strong>${produto.pesoBruto ? produto.pesoBruto + ' kg' : '-'}</strong>
            </div>
        `;

        lista.appendChild(card);
    });
}

document.getElementById('buscaProduto').addEventListener('input', (evento) => {
    const termo = evento.target.value.toLowerCase();
    const filtrados = todosOsProdutos.filter(produto =>
        produto.nome.toLowerCase().includes(termo)
    );
    renderizarProdutos(filtrados);
});

// --- Botões de ação (Entrada e Saída chegam no Bloco 4 e 5) ---
document.getElementById('botaoEntrada').addEventListener('click', () => {
    window.location.href = 'entrada.html';
});

document.getElementById('botaoSaida').addEventListener('click', () => {
    window.location.href = 'saida.html';
});

// --- Utilitário ---
function formatarReais(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
