// frontend/js/entrada.js
// Controla o fluxo de 4 etapas da entrada de produto via XML.
// Regra de ouro desse arquivo: NENHUMA etapa pode ser pulada — cada botão
// "Avançar" valida tudo antes de deixar seguir em frente.

// --- Proteção de login ---
fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (!dados.autenticado) window.location.href = 'index.html';
    });

// --- Estado da entrada, guardado em memória durante o fluxo ---
let itens = [];
let valorTotalNota = 0;
let parcelamento = {
    parcelado: null,
    numeroParcelas: null,
    teveJuros: null,
    valorTotalComJuros: null
};

const mensagemErroGeral = document.getElementById('mensagemErroGeral');

function mostrarErro(texto) {
    mensagemErroGeral.textContent = texto;
}
function limparErro() {
    mensagemErroGeral.textContent = '';
}

function irParaEtapa(numero) {
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`etapa${i}`).style.display = (i === numero) ? 'block' : 'none';
    }
    document.querySelectorAll('.passo').forEach(el => {
        const passoNumero = Number(el.dataset.passo);
        el.classList.remove('ativo', 'concluido');
        if (passoNumero === numero) el.classList.add('ativo');
        else if (passoNumero < numero) el.classList.add('concluido');
    });
    limparErro();
}

// ===================== ETAPA 1 — Upload do XML =====================
const inputXml = document.getElementById('inputXml');
const statusArquivoXml = document.getElementById('statusArquivoXml');

inputXml.addEventListener('change', () => {
    if (inputXml.files.length) {
        processarArquivoXml(inputXml.files[0]);
    }
});

async function processarArquivoXml(arquivo) {
    limparErro();
    statusArquivoXml.className = 'status-arquivo';
    statusArquivoXml.textContent = `Arquivo selecionado: ${arquivo.name} — lendo...`;

    const formData = new FormData();
    formData.append('arquivoXml', arquivo);

    try {
        const resposta = await fetch('/api/movimentacoes/entrada/importar-xml', {
            method: 'POST',
            body: formData
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            statusArquivoXml.className = 'status-arquivo status-erro';
            statusArquivoXml.textContent = `Não foi possível ler "${arquivo.name}": ${dados.erro || 'arquivo inválido'}. Escolha o arquivo novamente.`;
            return;
        }

        statusArquivoXml.className = 'status-arquivo status-ok';
        statusArquivoXml.textContent = `Arquivo "${arquivo.name}" lido com sucesso! Avançando...`;

        itens = dados.itens.map(item => ({ ...item, categoria: '' }));
        valorTotalNota = dados.valorTotalNota;

        renderizarEtapa2();
        setTimeout(() => irParaEtapa(2), 500);

    } catch (erro) {
        statusArquivoXml.className = 'status-arquivo status-erro';
        statusArquivoXml.textContent = 'Não foi possível conectar ao servidor. Tente novamente.';
    }
}

// ===================== ETAPA 2 — Conferência dos itens =====================
function renderizarEtapa2() {
    const container = document.getElementById('tabelaItens');
    container.innerHTML = '';

    itens.forEach((item, indice) => {
        const bloco = document.createElement('div');
        bloco.className = 'tabela-item';
        bloco.innerHTML = `
            <p class="tabela-item-titulo">${item.nome} <span style="font-weight:400;color:#5A6B7A;">(código ${item.codigo})</span></p>
            <div class="tabela-item-campo">
                <label>Quantidade</label>
                <input type="text" value="${item.quantidade}" disabled>
            </div>
            <div class="tabela-item-campo">
                <label>Valor unitário (da nota)</label>
                <input type="text" value="${formatarReais(item.valorUnitarioOriginal)}" disabled>
            </div>
            <div class="tabela-item-campo">
                <label>Peso bruto (kg)</label>
                <input type="number" step="0.001" min="0" value="${item.pesoBruto}" data-indice="${indice}" data-campo="pesoBruto" class="campo-peso">
            </div>
            <div class="tabela-item-campo">
                <label>Categoria *</label>
                <input type="text" placeholder="Ex: Periféricos" data-indice="${indice}" data-campo="categoria" class="campo-categoria">
            </div>
        `;
        container.appendChild(bloco);
    });

    container.querySelectorAll('.campo-peso').forEach(campo => {
        campo.addEventListener('input', (e) => {
            itens[e.target.dataset.indice].pesoBruto = Number(e.target.value);
        });
    });
    container.querySelectorAll('.campo-categoria').forEach(campo => {
        campo.addEventListener('input', (e) => {
            itens[e.target.dataset.indice].categoria = e.target.value;
            e.target.classList.remove('campo-invalido');
        });
    });
}

document.getElementById('botaoVoltarEtapa1').addEventListener('click', () => irParaEtapa(1));

document.getElementById('botaoAvancarEtapa2').addEventListener('click', () => {
    let tudoValido = true;
    document.querySelectorAll('.campo-categoria').forEach(campo => {
        if (!campo.value.trim()) {
            campo.classList.add('campo-invalido');
            tudoValido = false;
        }
    });
    if (!tudoValido) {
        mostrarErro('Preencha a categoria de todos os produtos antes de avançar.');
        return;
    }
    irParaEtapa(3);
});

// ===================== ETAPA 3 — Parcelamento e juros =====================
document.querySelectorAll('.botao-opcao').forEach(botao => {
    botao.addEventListener('click', () => {
        const grupo = botao.dataset.grupo;
        const valor = botao.dataset.valor === 'sim';

        document.querySelectorAll(`.botao-opcao[data-grupo="${grupo}"]`).forEach(b => b.classList.remove('selecionado'));
        botao.classList.add('selecionado');

        if (grupo === 'parcelado') {
            parcelamento.parcelado = valor;
            document.getElementById('perguntaNumeroParcelas').style.display = valor ? 'block' : 'none';
            document.getElementById('perguntaJuros').style.display = valor ? 'block' : 'none';
            document.getElementById('perguntaValorComJuros').style.display = 'none';
            if (!valor) {
                parcelamento.teveJuros = false;
                parcelamento.numeroParcelas = null;
                parcelamento.valorTotalComJuros = null;
            }
        }

        if (grupo === 'juros') {
            parcelamento.teveJuros = valor;
            document.getElementById('perguntaValorComJuros').style.display = valor ? 'block' : 'none';
            if (!valor) parcelamento.valorTotalComJuros = null;
        }
    });
});

document.getElementById('numeroParcelas').addEventListener('input', (e) => {
    parcelamento.numeroParcelas = Number(e.target.value);
});
document.getElementById('valorComJuros').addEventListener('input', (e) => {
    parcelamento.valorTotalComJuros = Number(e.target.value);
});

document.getElementById('botaoVoltarEtapa2').addEventListener('click', () => irParaEtapa(2));

document.getElementById('botaoAvancarEtapa3').addEventListener('click', () => {
    if (parcelamento.parcelado === null) {
        mostrarErro('Informe se a compra foi parcelada.');
        return;
    }
    if (parcelamento.parcelado) {
        if (!parcelamento.numeroParcelas || parcelamento.numeroParcelas < 2) {
            mostrarErro('Informe em quantas vezes a compra foi parcelada (mínimo 2).');
            return;
        }
        if (parcelamento.teveJuros === null) {
            mostrarErro('Informe se houve incidência de juros.');
            return;
        }
        if (parcelamento.teveJuros && (!parcelamento.valorTotalComJuros || parcelamento.valorTotalComJuros <= 0)) {
            mostrarErro('Informe o valor total da compra já com os juros.');
            return;
        }
    }

    renderizarEtapa4();
    irParaEtapa(4);
});

// ===================== ETAPA 4 — Confirmação final =====================
function renderizarEtapa4() {
    const valorConsiderado = parcelamento.teveJuros ? parcelamento.valorTotalComJuros : valorTotalNota;
    const fator = valorConsiderado / valorTotalNota;

    const container = document.getElementById('resumoFinal');
    container.innerHTML = '';

    itens.forEach(item => {
        const valorTotalItemFinal = item.valorTotalItemOriginal * fator;
        const valorUnitarioFinal = valorTotalItemFinal / item.quantidade;

        const bloco = document.createElement('div');
        bloco.className = 'tabela-item';
        bloco.innerHTML = `
            <p class="tabela-item-titulo">${item.nome}</p>
            <div class="tabela-item-campo"><label>Categoria</label><span>${item.categoria}</span></div>
            <div class="tabela-item-campo"><label>Quantidade</label><span>${item.quantidade}</span></div>
            <div class="tabela-item-campo"><label>Valor unitário final</label><span>${formatarReais(valorUnitarioFinal)}</span></div>
            <div class="tabela-item-campo"><label>Valor total final</label><span>${formatarReais(valorTotalItemFinal)}</span></div>
            <div class="tabela-item-campo"><label>Peso bruto</label><span>${item.pesoBruto} kg</span></div>
        `;
        container.appendChild(bloco);
    });

    const resumoGeral = document.createElement('p');
    resumoGeral.innerHTML = `<strong>Valor total considerado da compra: ${formatarReais(valorConsiderado)}</strong>` +
        (parcelamento.parcelado ? ` — parcelado em ${parcelamento.numeroParcelas}x` : '');
    container.appendChild(resumoGeral);
}

document.getElementById('botaoVoltarEtapa3').addEventListener('click', () => irParaEtapa(3));

document.getElementById('botaoConfirmarEntrada').addEventListener('click', async () => {
    const botao = document.getElementById('botaoConfirmarEntrada');
    botao.disabled = true;
    botao.textContent = 'Salvando...';
    limparErro();

    try {
        const resposta = await fetch('/api/movimentacoes/entrada/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itens, valorTotalNota, parcelamento })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            mostrarErro(dados.erro || 'Não foi possível salvar a entrada.');
            botao.disabled = false;
            botao.textContent = 'Confirmar entrada';
            return;
        }

        window.location.href = 'dashboard.html';

    } catch (erro) {
        mostrarErro('Não foi possível conectar ao servidor');
        botao.disabled = false;
        botao.textContent = 'Confirmar entrada';
    }
});

// --- Utilitário ---
function formatarReais(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
