// frontend/js/editar-produto.js

fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (!dados.autenticado) window.location.href = 'index.html';
    });

// Pega o código do produto que veio na URL (ex: editar-produto.html?codigo=MOU-001)
const parametros = new URLSearchParams(window.location.search);
const codigo = parametros.get('codigo');

if (!codigo) {
    window.location.href = 'dashboard.html';
}

// Carrega os dados atuais do produto e preenche o formulário
fetch(`/api/produtos/${encodeURIComponent(codigo)}`)
    .then(resposta => resposta.json())
    .then(produto => {
        document.getElementById('codigoProduto').textContent = `Código: ${produto.codigo}`;
        document.getElementById('nome').value = produto.nome;
        document.getElementById('categoria').value = produto.categoria;
        document.getElementById('quantidade').value = produto.quantidade;
        document.getElementById('valorUnitario').value = produto.valorUnitario;
        document.getElementById('valorTotalCompra').value = produto.valorTotalCompra;
        document.getElementById('pesoBruto').value = produto.pesoBruto;
    });

document.getElementById('formEditarProduto').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const mensagemEdicao = document.getElementById('mensagemEdicao');
    mensagemEdicao.textContent = '';

    const botao = document.getElementById('botaoSalvarEdicao');
    botao.disabled = true;
    botao.textContent = 'Salvando...';

    try {
        const resposta = await fetch(`/api/produtos/${encodeURIComponent(codigo)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: document.getElementById('nome').value,
                categoria: document.getElementById('categoria').value,
                quantidade: Number(document.getElementById('quantidade').value),
                valorUnitario: Number(document.getElementById('valorUnitario').value),
                valorTotalCompra: Number(document.getElementById('valorTotalCompra').value),
                pesoBruto: Number(document.getElementById('pesoBruto').value)
            })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagemEdicao.textContent = dados.erro || 'Não foi possível salvar';
            botao.disabled = false;
            botao.textContent = 'Salvar alterações';
            return;
        }

        window.location.href = 'dashboard.html';

    } catch (erro) {
        mensagemEdicao.textContent = 'Não foi possível conectar ao servidor';
        botao.disabled = false;
        botao.textContent = 'Salvar alterações';
    }
});

document.getElementById('botaoExcluirProduto').addEventListener('click', async () => {
    const botaoExcluirProduto = document.getElementById('botaoExcluirProduto');
    const caixaConfirmacaoExclusao = document.getElementById('caixaConfirmacaoExclusao');
    const confirmarNomeExclusao = document.getElementById('confirmarNomeExclusao');
    const botaoConfirmarExclusaoDefinitiva = document.getElementById('botaoConfirmarExclusaoDefinitiva');

    botaoExcluirProduto.addEventListener('click', () => {
        document.getElementById('nomeParaConfirmar').textContent = document.getElementById('nome').value;
        caixaConfirmacaoExclusao.style.display = 'block';
        botaoExcluirProduto.style.display = 'none';
    });

    confirmarNomeExclusao.addEventListener('input', () => {
        const nomeAtual = document.getElementById('nome').value.trim();
        botaoConfirmarExclusaoDefinitiva.disabled = confirmarNomeExclusao.value.trim() !== nomeAtual;
    });

    botaoConfirmarExclusaoDefinitiva.addEventListener('click', async () => {
        try {
            const resposta = await fetch(`/api/produtos/${encodeURIComponent(codigo)}`, {
                method: 'DELETE'
            });

            if (!resposta.ok) {
                const dados = await resposta.json();
                alert(dados.erro || 'Não foi possível excluir o produto');
                return;
            }

            window.location.href = 'dashboard.html';

        } catch (erro) {
            alert('Não foi possível conectar ao servidor');
        }
    });
});