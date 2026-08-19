const produtos = [
    {
        id: 1,
        nome: "Mouse",
        categoria: "Periféricos",
        preco: 80,
        quantidade: 10
    },
    {
        id: 2,
        nome: "Teclado",
        categoria: "Periféricos",
        preco: 150,
        quantidade: 5
    }
]


//cadastrar produto
function cadastrarProduto(lista, produto) {
    lista.push(produto)
}

cadastrarProduto(produtos, {
    id: 3,
    nome: "Monitor",
    categoria: "Monitores",
    preco: 900,
    quantidade: 4
})

// console.log(produtos)


//procurar produto
function procurarProduto(lista, nome) {
    
    for(let i = 0; i < lista.length; i++) {
        if(lista[i].nome === nome) {
            return lista[i]
        }
    }

    return null
}

// console.log(procurarProduto(produtos, "Mouse"))
// console.log(procurarProduto(produtos, "Cabo"))


//entrada no estoque
function entradaEstoque(lista, nome, quantidade) {
    let produto = procurarProduto(lista, nome)

    if(produto){
        produto.quantidade += quantidade
        return produto
    } else {
        return null
    }
}

entradaEstoque(produtos, "Mouse", 5)
// console.log(produtos)


//saida do estoque
function saidaEstoque(lista, nome, quantidade) {
    let produto = procurarProduto(lista, nome) 

    if(produto) {
        if(quantidade > produto.quantidade) {
            return null
        }
        produto.quantidade -= quantidade
        return produto
    }
    return null
}

// console.log(saidaEstoque(produtos, "Mouse", 5))
// console.log(produtos)


//resumo estoque
function resumoEstoque(lista) {
    let resumo = {
        totalProdutos: 0,
        quantidadeTotal: 0,
        valorTotalEstoque: 0,
        produtoMaisCaro: null
    }

    for(let i = 0; i < lista.length; i++) {
        let nome = lista[i].nome
        let preco = lista[i].preco
        let quantidade = lista[i].quantidade
        resumo.totalProdutos++
        resumo.quantidadeTotal += quantidade
        resumo.valorTotalEstoque += preco * quantidade

        if(resumo.produtoMaisCaro === null) {
            resumo.produtoMaisCaro = {
                nome: nome,
                preco: preco
            }
        }

        if(preco > resumo.produtoMaisCaro.preco) {
            resumo.produtoMaisCaro = {
                nome: nome,
                preco: preco
            }
        }
    }

    return resumo
}

// console.log(resumoEstoque(produtos))


//listar produtos
function listarProdutos(lista) {

    for(let i = 0; i < lista.length; i++) {
        console.log(`ID: ${lista[i].id} | ${lista[i].nome} | R$ ${lista[i].preco} | Estoque: ${lista[i].quantidade}`)
    }
}

listarProdutos(produtos)


//menu
function menu() {
    let continuar = true
    while(continuar) {
        console.log("===== SISTEMA DE ESTOQUE =====")
        console.log("1 - Cadastrar produto")
        console.log("2 - Buscar produto")
        console.log("3 - Entrada de estoque")
        console.log("4 - Saída de estoque")
        console.log("5 - Listar produtos")
        console.log("6 - Resumo do estoque")
        console.log("0 - Sair")

        let opcao = prompt("Escolha uma opção")

        switch (opcao) {
            case "1":
                let nome = prompt("Nome do produto: ")
                let categoria = prompt("Categoria do produto: ")
                let preco = Number(prompt("Preço do produto: "))
                let quantidade = Number(prompt("Quantidade do produto: "))

                let produto = {
                    id: produtos.length + 1,
                    nome: nome,
                    categoria: categoria,
                    preco: preco,
                    quantidade: quantidade
                }

                cadastrarProduto(produtos, produto)
                break

            case "2":
                procurarProduto()
                break

            case "3":
                entradaEstoque()
                break

            case "4":
                saidaEstoque()
                break
        
            case "5":
                listarProdutos()
                break

            case "6":
                resumoEstoque()
                break

            case "0":
                continuar = false
                break
        }
    }
}

menu()