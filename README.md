# Suafruti — Cardápio Digital

Site de cardápio estático, responsivo e com identidade exclusiva da **Suafruti**, construído a partir da logo oficial e do encarte enviados pela cliente.

## Identidade visual

- **Logo oficial Suafruti em alta definição, sem fundo.** A arte do link enviado (`https://i.imgur.com/iHVVTHH.jpeg`) foi reconstruída em **Full HD** (1920 × 1633 px) com canal alpha em `assets/logo-suafruti-transparente.webp`: frutas, brilhos, letras e a faixa "O melhor sabor da natureza." nítidos, sem fundo preto, sem contorno branco e sem mancha. Como o link do Imgur hoje redireciona para uma página HTML em vez de entregar o arquivo, a versão local é a fonte usada em tempo de execução — o site nunca depende de imagem externa.
- **Enquadramento por campo, sem moldura.** No canto superior esquerdo a logo aparece **inteira e diretamente sobre o cabeçalho** (sem cartão creme, sem `object-fit: cover`, sem recorte): a altura acompanha `--header-h` e a largura é proporcional. No hero ela flutua sobre o brilho circular com sombra suave; o selo "2 tamanhos de pote" foi reposicionado abaixo da faixa, sem cobrir o texto. No rodapé aparece completa, sem cartão ou moldura. Nenhum campo de logo usa `mix-blend-mode` ou moldura creme.
- `assets/favicon.png` e `assets/logo-social.jpg` (1200×630 para `og:image` / `twitter:image`) foram gerados a partir do mesmo master Full HD, com fundo creme da marca; `assets/logo-oficial-quadrada.jpg` e `assets/logo-oficial-original.jpg` seguem como referência do material original.
- `styles.css` e `app.js` são carregados com versionamento (`?v=9`) para evitar que o navegador use uma folha de estilo antiga em cache.
- Fotos reais dos potes extraídas do encarte oficial + imagem exclusiva da caixa com 4 bandejas de morango.
- Paleta verde/vermelho/amarelo, tipografias locais (Fredoka, Nunito Sans e Pacifico), folhas, ondas e detalhes inspirados no material da cliente. **Nenhuma dependência externa em tempo de execução.**

## Cardápio configurado

| Produto | Opções | Preço |
| --- | --- | --- |
| Salada de Frutas Tradicional | 250 ml / 300 ml | R$ 12,00 / R$ 15,00 |
| Salada Overnight | 250 ml / 300 ml | R$ 18,00 / R$ 20,00 |
| Fruta Cortada | 1 fruta (morango, manga **ou** mamão) + 250 ml / 300 ml | R$ 8,00 / R$ 10,00 |
| Caixa de Morango | 4 bandejas · morango médio / graúdo | R$ 40,00 / R$ 45,00 |

**Frutas das saladas:** uva verde, uva preta, morango, kiwi, manga, banana, maçã e mamão.

**Adicionais da Salada de Frutas:** leite condensado, leite em pó, mel, granola, mousse de maracujá e mousse de morango.

**Adicionais do Overnight:** iogurte natural, chia, granola, mel e aveia.

> Interpretação de *"Fruta cortada — somente uma opção"*: o cliente escolhe **uma única fruta por pote** (morango, manga ou mamão), podendo escolher entre os tamanhos de 250 ml e 300 ml informados.

## Taxa de entrega

| Região | Taxa |
| --- | --- |
| Jesus de Nazareth (Vitória) | Grátis |
| Demais bairros de Vitória | R$ 3,00 |
| Vila Velha, Serra e Cariacica | R$ 5,00 |
| Outras localidades | A combinar no WhatsApp |

## Pedidos pelo WhatsApp

- Cada produto tem um botão **Pedir este**, que abre o WhatsApp com a mensagem já personalizada para a opção selecionada (tamanho, fruta ou tipo de morango).
- **Sacolinha de pedidos**: vários itens e quantidades, nome, entrega/retirada, região, endereço e observações.
- A sacolinha calcula automaticamente a **taxa de entrega** e o **total estimado** conforme a região escolhida.
- A mensagem final enviada ao WhatsApp inclui o resumo dos itens, subtotal, taxa, total, região, endereço e observações.
- Número configurado: `+55 27 99282-2534`.

## Experiência mobile

- Layout testado a partir de **320 px**, sem rolagem horizontal.
- Menu mobile, filtros do cardápio, seletores de tamanho/fruta/toque amplo, barra fixa da sacolinha e painel de pedido em bottom sheet.
- Foco visível, `aria-pressed`, `aria-live`, navegação por teclado e suporte a `prefers-reduced-motion`.

## Como executar

O site é estático. Na raiz do projeto:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Ou:

```bash
npm start
```

Abra `http://localhost:4173` no navegador.

## Estrutura

```text
index.html               Estrutura e conteúdo do cardápio
styles.css               Identidade visual, layout e responsividade
app.js                   Catálogo, seletores, filtros, sacolinha, taxas e WhatsApp
assets/                  Logos oficiais, fotos dos produtos, favicon e fontes
assets/fonts/            Fredoka, Nunito Sans e Pacifico (locais)
```

## Onde alterar

- **Produtos, preços e mensagens:** `CATALOG` no início de `app.js`.
- **Taxas de entrega:** `DELIVERY_ZONES` em `app.js` e a seção `#entrega` em `index.html`.
- **Número do WhatsApp:** `WHATSAPP_NUMBER` em `app.js` e os links `wa.me` em `index.html` (fallback sem JavaScript).
- **Contato:** telefone, site e Instagram no rodapé de `index.html`.

> Observação: adicionais, disponibilidade, prazo e valores finais são confirmados pela equipe no WhatsApp; o site não processa pagamento.
