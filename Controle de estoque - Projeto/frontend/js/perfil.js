// frontend/js/perfil.js

// Protege a página + já carrega o nome e a foto atual
fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (!dados.autenticado) {
            window.location.href = 'index.html';
            return;
        }
        if (dados.foto) {
            document.getElementById('avatarGrande').src = dados.foto;
        }
    });

// --- Trocar foto (envia assim que escolhe o arquivo, sem precisar clicar em nada) ---
const inputFoto = document.getElementById('inputFoto');
const statusFoto = document.getElementById('statusFoto');

inputFoto.addEventListener('change', async () => {
    if (!inputFoto.files.length) return;

    const arquivo = inputFoto.files[0];
    statusFoto.className = 'status-arquivo';
    statusFoto.textContent = `Enviando ${arquivo.name}...`;

    const formData = new FormData();
    formData.append('foto', arquivo);

    try {
        const resposta = await fetch('/api/auth/foto', {
            method: 'POST',
            body: formData
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            statusFoto.className = 'status-arquivo status-erro';
            statusFoto.textContent = dados.erro || 'Não foi possível enviar a foto';
            return;
        }

        document.getElementById('avatarGrande').src = dados.foto;
        statusFoto.className = 'status-arquivo status-ok';
        statusFoto.textContent = 'Foto atualizada!';

    } catch (erro) {
        statusFoto.className = 'status-arquivo status-erro';
        statusFoto.textContent = 'Não foi possível conectar ao servidor';
    }
});

// --- Trocar senha ---
document.getElementById('formSenha').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const mensagemSenha = document.getElementById('mensagemSenha');
    mensagemSenha.textContent = '';
    mensagemSenha.style.color = '';

    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value;

    if (novaSenha !== confirmarNovaSenha) {
        mensagemSenha.textContent = 'A nova senha e a confirmação não são iguais';
        return;
    }

    const botao = document.getElementById('botaoSalvarSenha');
    botao.disabled = true;
    botao.textContent = 'Salvando...';

    try {
        const resposta = await fetch('/api/auth/senha', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senhaAtual, novaSenha })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagemSenha.textContent = dados.erro || 'Não foi possível trocar a senha';
            botao.disabled = false;
            botao.textContent = 'Salvar nova senha';
            return;
        }

        mensagemSenha.style.color = 'var(--cor-destaque)';
        mensagemSenha.textContent = 'Senha alterada com sucesso!';
        document.getElementById('formSenha').reset();

    } catch (erro) {
        mensagemSenha.textContent = 'Não foi possível conectar ao servidor';
    } finally {
        botao.disabled = false;
        botao.textContent = 'Salvar nova senha';
    }
});