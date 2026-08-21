# Sabora — e-commerce de comida (estilo Netflix)

Site de vendas de comida com visual claro e navegação em "prateleiras" horizontais,
inspirado na experiência da Netflix (fileiras de cards, hero em destaque, hover com detalhe).

```
foodflix/
├── frontend/          → HTML, CSS e JS puros
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/
│   └── src/
│       └── Main.java  → API REST em Java puro (sem Maven/Spring)
└── README.md
```

## Como rodar

### Opção 1 — só o front-end (mais simples)
Dê duplo clique em `frontend/index.html` para abrir no navegador.
Sem o backend rodando, o site funciona normalmente usando os dados de exemplo
que já estão no `script.js`.

### Opção 2 — front-end + back-end Java
O back-end usa **apenas a biblioteca padrão do Java** (pacote `com.sun.net.httpserver`),
então não precisa instalar Maven, Spring nem baixar nenhuma dependência.

```bash
cd foodflix/backend/src
javac Main.java
java Main
```

Isso sobe um servidor em `http://localhost:8080` que:
- serve o site (front-end) na raiz `/`
- expõe a API em `/api/*`

Depois é só abrir **http://localhost:8080** no navegador — o `script.js` detecta
o backend automaticamente e passa a usar os dados vindos da API Java.

## Endpoints da API

| Método | Rota                     | Descrição                                   |
|--------|--------------------------|----------------------------------------------|
| GET    | `/api/products`          | Lista todos os produtos                      |
| GET    | `/api/products?category=salgados` | Filtra por categoria                |
| GET    | `/api/categories`        | Lista as categorias existentes               |
| GET    | `/api/cart`              | Retorna o carrinho atual e o total           |
| POST   | `/api/cart`              | Adiciona item: `{"productId":"p1","qty":1}`  |
| DELETE | `/api/cart/{productId}`  | Remove um item do carrinho                   |

## Sobre este projeto

Este é um projeto de **demonstração/estudo**, pensado para ser simples de rodar
sem instalar nada além do Java. Para virar um e-commerce de verdade, os próximos
passos naturais seriam:

- **Banco de dados** (Postgres, MySQL) no lugar da lista em memória
- **Autenticação e sessão por usuário** (hoje o carrinho é global/compartilhado)
- **Framework web** como Spring Boot, se o projeto crescer (rotas, validação,
  tratamento de erros e injeção de dependência ficam mais fáceis)
- **Checkout e pagamento** de verdade (hoje o botão "Fechar pedido" só simula)
- **Imagens reais dos pratos** no lugar dos emojis usados como placeholder

## Paleta e identidade visual

- Fundo: verde-sálvia bem claro `#F3F6EC`
- Acento principal: vinho `#7A2048`
- Acento secundário: mostarda `#E3A857`
- Tipografia: Fraunces (títulos) + Work Sans (texto) + IBM Plex Mono (preços)