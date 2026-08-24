const produtos = [
    {
        id: crypto.randomUUID(),
        nome: "Mouse",
        categoria: "Periféricos",
        preco: 80,
        quantidade: 10
    },
    {
        id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
    nome: "Monitor",
    categoria: "Monitores",
    preco: 900,
    quantidade: 4
})

// console.log(produtos)


//procurar produto
function procurarProduto(lista, nome) {
    
    for(let i = 0; i < lista.length; i++) {
        let nomeLista = lista[i].nome.toLowerCase()
        let nomeProcurar = nome.toLowerCase()

        if(nomeLista === nomeProcurar) {
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
            return "Quantidade de saída maior que quantidade em estoque"
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

        if(resumo.produtoMaisCaro === null || preco > resumo.produtoMaisCaro.preco) {
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


// editar produto
function editarProduto(lista, nome) {
    let produto = procurarProduto(lista, nome)

    if(produto) {
        if(quantidade > 0) {
            lista.produto + quantidade
        } else {
            lista.produto - quantidade
        }
    } else {
        return null
    }
}


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
                let preco = NaN
                let quantidade = NaN

                while(Number.isNaN(preco) || preco <= 0) {
                    preco = Number(prompt("Preco do produto: "))
                }

                while(Number.isNaN(quantidade) || quantidade <= 0) {
                    quantidade = Number(prompt("Quantidade do produto: "))
                }

                let produto = {
                    id: crypto.randomUUID(),
                    nome: nome,
                    categoria: categoria,
                    preco: preco,
                    quantidade: quantidade
                }

                cadastrarProduto(produtos, produto)
                break

            case "2":
                let nomeProcura = prompt("Qual produto quer encontrar?")
                let resultadoProcura = procurarProduto(produtos, nomeProcura)

                if(resultadoProcura) {
                    console.log(resultadoProcura) 
                } else {
                    console.log("Produto não encontrado") 
                }
                break

            case "3":
                let nomeEntrada = prompt("Qual é o nome do produto?")
                let quantidadeEntrada = NaN

                while(Number.isNaN(quantidadeEntrada) || quantidadeEntrada <= 0) {
                    quantidadeEntrada = Number(prompt("Qual a quantidade de entrada?"))
                }

                let resultadoEntrada = entradaEstoque(produtos, nomeEntrada, quantidadeEntrada)

                if(resultadoEntrada) {
                    console.log(resultadoEntrada)
                } else {
                    console.log("O produto não foi encontrado")
                }
                break

            case "4":
                let nomeSaida = prompt("Qual o nome do produto?")
                let quantidadeSaida = NaN

                while(Number.isNaN(quantidadeSaida) || quantidadeSaida <= 0) {
                    quantidadeSaida = Number(prompt("Qual a quantidade de saída?"))
                }

                let resultadoSaida = saidaEstoque(produtos, nomeSaida, quantidadeSaida)

                if(resultadoSaida) {
                    console.log(resultadoSaida)
                } else {
                    console.log("Produto não encontrado ou quantidade de saída maior que quantidade em estoque")
                }
                break
        
            case "5":
                listarProdutos(produtos)
                break

            case "6":
                console.log(resumoEstoque(produtos))
                break

            case "0":
                continuar = false
                break
        }
    }
}

menu()