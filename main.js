const form = document.getElementById("produtoForm");
const nomeInput = document.getElementById("nomeProduto");
const precoInput = document.getElementById("precoPoduto");
const tabela = document.getElementById("tabelaProdutos");
const gerarBtn = document.getElementById("gerarBtn");
const gerarPDFBtn = document.getElementById("gerarPDF");

let produtos = JSON.parse(localStorage.getItem("produtos")) || [];

// === Renderizar Tabela ===
function renderTabela() {
    tabela.innerHTML = produtos.map(produto => ` 
        <tr>                               
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>${produto.preco}</td>
            <td><img src="${produto.barcode}" alt="Código de Barras"></td>
            <td><img src="${produto.qrcode}" alt="QR Code"></td>
            <td>
                <button class="edit" onclick="editarProduto(${produto.id})">Editar</button>
                <button class="delete" onclick="deletarProduto(${produto.id})">Excluir</button>
            </td>
        </tr>
    `).join("");
    localStorage.setItem("produtos", JSON.stringify(produtos));
} 

// === Gerar Código de Barras e QR Code ===
function gerarCodigo(nome, preco) {             
    const id = Date.now();

    const inicio = performance.now();

    // Código de barras
    const canvasBar = document.createElement("canvas");
    JsBarcode(canvasBar, id.toString(), { format: "CODE128" });
    const barcode = canvasBar.toDataURL("image/png");

    // QR Code
    const qrDiv = document.createElement("div");
    new QRCode(qrDiv, { text: id.toString(), width: 100, height: 100 });

    setTimeout(() => {
        const qrImg = qrDiv.querySelector("img").src;
        produtos.push({ id, nome, preco, barcode, qrcode: qrImg });
        renderTabela();

        const fim = performance.now();
        const tempoTotal = (fim - inicio).toFixed(2);
        console.log(`⏱️ Tempo para adicionar e renderizar o produto: ${tempoTotal} ms`);
        alert(`Produto adicionado em ${tempoTotal} milissegundos.`);
    }, 100);
}

// === Adicionar Produto ===
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = nomeInput.value.trim();
    const preco = precoInput.value.trim();

    if (!nome || !preco) {
        return alert("Preencha todos os campos!");
    }

    const produtoJaExiste = produtos.some(
        produto => produto.nome.toLowerCase() === nome.toLowerCase()
    );

    if (produtoJaExiste) {
        return alert("Este produto já está cadastrado no sistema!");
    }

    gerarCodigo(nome, preco);

    nomeInput.value = "";
    precoInput.value = "";
});

// === Editar Produto ===
function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    const novoNome = prompt("Digite o novo nome:", produto.nome);
    if (novoNome === null) return; // cancelou
    if (!novoNome.trim()) return alert("O nome não pode ficar vazio!");

    const novoPreco = prompt("Digite o novo preço:", produto.preco);
    if (novoPreco === null) return; // cancelou
    if (!novoPreco.trim()) return alert("O preço não pode ficar vazio!");

    const jaExiste = produtos.some(
        p => p.nome.toLowerCase() === novoNome.toLowerCase() && p.id !== id
    );
    if (jaExiste) return alert("Já existe um produto com esse nome!");

    // Atualiza nome e preço
    produto.nome = novoNome.trim();
    produto.preco = novoPreco.trim();

    // === REGERAR CÓDIGO DE BARRAS E QR CODE ===
    const canvasBar = document.createElement("canvas");
    JsBarcode(canvasBar, produto.id.toString(), { format: "CODE128" });
    produto.barcode = canvasBar.toDataURL("image/png");

    const qrDiv = document.createElement("div");
    new QRCode(qrDiv, { text: produto.id.toString(), width: 100, height: 100 });

    setTimeout(() => {
        const qrImg = qrDiv.querySelector("img").src;
        produto.qrcode = qrImg;
        renderTabela();
        alert("Produto atualizado com sucesso!");
    }, 100);
}

// === Excluir Produto ===
function deletarProduto(id) {
    if (!confirm("Deseja realmente excluir este produto?")) return;
    produtos = produtos.filter(p => p.id !== id);
    renderTabela();
}

// === Gerar PDF ===
async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório de Equipamentos", 60, 15);   

    let y = 30;
    for (const produto of produtos) {
        doc.text(`ID: ${produto.id}`, 10, y);
        doc.text(`Nome: ${produto.nome}`, 10, y + 6);
        doc.text(`Preço: ${produto.preco}`, 10, y + 12);

        const imgBar = new Image();
        imgBar.src = produto.barcode;
        const imgQR = new Image();
        imgQR.src = produto.qrcode;

        await Promise.all([  
            new Promise(res => imgBar.onload = res),
            new Promise(res => imgQR.onload = res)
        ]);

        doc.addImage(imgBar, "PNG", 10, y + 18, 60, 20);
        doc.addImage(imgQR, "PNG", 80, y + 15, 25, 25);
        y += 50;
    }

    doc.save("equipamentos.pdf");
}

// === Botões ===
gerarBtn.addEventListener("click", () => {
    form.dispatchEvent(new Event("submit"));
});

gerarPDFBtn.addEventListener("click", gerarPDF);

// === Render inicial ===
renderTabela();
