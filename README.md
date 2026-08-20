# 📦 Sistema de Controle de Estoque

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B-yellow?logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-orange">
  <img src="https://img.shields.io/badge/Projeto-Prático-brightgreen">
  <img src="https://img.shields.io/badge/Interface-Em%20Desenvolvimento-blue">
</p>

---

## 👤 Sobre o Projeto

Este projeto consiste no desenvolvimento de um **Sistema de Controle de Estoque**, criado para praticar conceitos de programação e desenvolver uma aplicação baseada em regras de negócio utilizando JavaScript.

Atualmente, o sistema está em sua **fase inicial de implementação**, com o desenvolvimento concentrado na lógica das funcionalidades e no controle dos dados.

A aplicação será posteriormente transformada em uma interface web completa, permitindo utilizar o sistema de forma visual e mais intuitiva.

---

## 🎯 Objetivo

O objetivo do projeto é desenvolver um sistema capaz de realizar o **controle básico de produtos e estoque**, permitindo cadastrar produtos, consultar informações e controlar entradas e saídas.

Como evolução do projeto, será implementado também um módulo para **controle financeiro básico**, utilizando valores de compra e venda para possibilitar uma apuração simples dos resultados.

---

## 🛠️ Tecnologias

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/HTML5-Futuro-orange?logo=html5">
  <img src="https://img.shields.io/badge/CSS3-Futuro-blue?logo=css3">
</p>

### Atualmente

* JavaScript
* Estruturas de dados
* Funções
* Loops
* Condicionais
* Objetos
* Manipulação de arrays
* Validação de dados
* Regras de negócio

### Planejado

* HTML5
* CSS3
* Interface web
* Dashboard
* Armazenamento persistente
* Controle financeiro básico

---

## 🚀 Funcionalidades Implementadas

### 📦 Cadastro de Produtos

O sistema permite cadastrar produtos contendo:

* ID
* Nome
* Categoria
* Preço
* Quantidade em estoque

---

### 🔎 Busca de Produtos

É possível pesquisar produtos pelo nome.

A busca não diferencia letras maiúsculas e minúsculas, facilitando a consulta.

---

### 📥 Entrada de Estoque

A funcionalidade de entrada permite adicionar determinada quantidade ao estoque de um produto já cadastrado.

---

### 📤 Saída de Estoque

O sistema permite realizar a saída de produtos do estoque.

Também existe uma validação para impedir que seja retirada uma quantidade maior do que a disponível.

---

### 📋 Listagem de Produtos

O sistema possui uma função para listar os produtos cadastrados, apresentando informações como:

```text
ID | Produto | Preço | Estoque
```

---

### 📊 Resumo do Estoque

A aplicação já possui uma função responsável por gerar um resumo do estoque, contendo:

* Quantidade total de produtos cadastrados
* Quantidade total de itens em estoque
* Valor total do estoque
* Produto com maior preço

O valor total do estoque é calculado considerando o preço do produto multiplicado pela quantidade disponível.

---

## 🧠 Estrutura Atual

Atualmente, a aplicação está concentrada em um arquivo JavaScript, responsável pela estrutura dos dados e pelas principais funções do sistema.

```text
📦 Sistema de Controle de Estoque
│
└── app.js
    │
    ├── Cadastro de produtos
    ├── Busca de produtos
    ├── Entrada de estoque
    ├── Saída de estoque
    ├── Listagem de produtos
    ├── Resumo do estoque
    └── Menu de interação
```

---

## 💻 Exemplo de Produto

Os produtos são estruturados utilizando objetos JavaScript:

```javascript
{
    id: 1,
    nome: "Mouse",
    categoria: "Periféricos",
    preco: 80,
    quantidade: 10
}
```

Essa estrutura será utilizada como base para a futura implementação da interface e das demais funcionalidades.

---

## 🔮 Próximas Etapas

O projeto continuará evoluindo gradualmente.

### Interface

* [ ] Criar estrutura HTML
* [ ] Desenvolver layout com CSS
* [ ] Criar tela de cadastro de produtos
* [ ] Criar tela de consulta de estoque
* [ ] Criar área para entradas e saídas
* [ ] Criar dashboard

### Controle de Estoque

* [x] Cadastro de produtos
* [x] Busca de produtos
* [x] Entrada de estoque
* [x] Saída de estoque
* [x] Listagem de produtos
* [x] Resumo do estoque
* [ ] Melhorar validações
* [ ] Aprimorar identificação dos produtos

### Controle Financeiro

* [ ] Separar valor de compra e valor de venda
* [ ] Calcular valor investido no estoque
* [ ] Calcular valor potencial de venda
* [ ] Calcular resultado bruto
* [ ] Calcular margem de lucro
* [ ] Criar resumo financeiro

### Persistência

* [ ] Implementar armazenamento dos dados
* [ ] Evitar perda dos produtos ao reiniciar a aplicação

---

## 📚 Objetivo de Aprendizado

Este projeto está sendo desenvolvido como parte do meu processo de evolução como **desenvolvedor em formação**.

Através dele, estou colocando em prática conceitos de JavaScript e, principalmente, trabalhando na construção de **regras de negócio e lógica de uma aplicação real**.

O projeto também representa uma oportunidade de evoluir gradualmente de uma aplicação executada através do console para uma aplicação web com interface completa.

---

## 📈 Evolução do Projeto

O projeto está em desenvolvimento e será expandido conforme novos conceitos forem estudados.

A ideia é começar pela construção da **lógica do sistema**, evoluir para uma **interface web completa** e posteriormente adicionar recursos de **controle financeiro e apuração básica de resultados**.

---

## 👨‍💻 Desenvolvedor

**Gabriel Cerbaro**

📈 Desenvolvedor em formação | ADS | Full Stack em construção | JavaScript • Node.js | Técnico em Informática

<p>
  <a href="https://github.com/gabrielcerbaro">
    <img src="https://img.shields.io/badge/GitHub-Perfil-black?logo=github">
  </a>
  <a href="https://www.linkedin.com/in/gabriel-cerbaro-4703b4239/">
    <img src="https://img.shields.io/badge/LinkedIn-Conectar-blue?logo=linkedin">
  </a>
</p>
