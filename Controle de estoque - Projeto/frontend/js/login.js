// frontend/js/login.js
// Controla o envio do formulário de login e a transição suave
// pra tela principal quando dá certo.

const formLogin = document.getElementById('formLogin');
const mensagemErro = document.getElementById('mensagemErro');
const botaoEntrar = document.getElementById('botaoEntrar');
const cardLogin = document.getElementById('cardLogin');

// Se a pessoa já estiver logada (ex: voltou pra essa página sem querer),
// manda direto pra tela principal.
fetch('/api/auth/status')
    .then(resposta => resposta.json())
    .then(dados => {
        if (dados.autenticado) {
            window.location.href = 'dashboard.html';
        }
    });

formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mensagemErro.textContent = '';
    botaoEntrar.disabled = true;
    botaoEntrar.textContent = 'Entrando...';

    const usuario = document.getElementById('usuario').value.trim();
    const senha = document.getElementById('senha').value;

    try {
        const resposta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ usuario, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mensagemErro.textContent = dados.erro || 'Não foi possível entrar';
            botaoEntrar.disabled = false;
            botaoEntrar.textContent = 'Entrar';
            return;
        }

        // Transição suave: o card "some" antes de trocar de página
        cardLogin.classList.add('saindo');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 350);

    } catch (erro) {
        mensagemErro.textContent = 'Não foi possível conectar ao servidor';
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = 'Entrar';
    }
});
