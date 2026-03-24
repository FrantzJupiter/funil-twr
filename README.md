# 🐇 TWR - Criador de Funil de Campanhas

Um construtor visual interativo para funis de tráfego pago, desenvolvido como desafio técnico para a vaga de estágio em Frontend na The White Rabbit (TWR).

## 🚀 Demonstração

**Acesse a aplicação aqui:** [funil-twr-tawny.vercel.app](https://funil-twr-tawny.vercel.app/)

**Repositório:** [github.com/FrantzJupiter/funil-twr](https://github.com/FrantzJupiter/funil-twr)

---

## 💡 Sobre o Projeto e Minha Abordagem

Olá, equipe da TWR! 

Aceitei este desafio com o objetivo de ir além do básico. Mais do que uma ferramenta de desenho, procurei construir uma **experiência de usuário (UX)** que fosse fluida e uma **arquitetura de código** preparada para o mundo real.

### O que diferencia esta implementação:

* **Física de Colisão e Inserção Inteligente:** Implementei um sistema matemático (`processInsertion`) que gerencia a sobreposição de etapas. Se soltar um card entre dois nós já conectados, o sistema abre espaço e ajusta o fluxo automaticamente para evitar desordem visual.
* **Criação Magnética e Ágil:** Desenvolvi a função `onConnectEnd` que permite criar uma nova etapa apenas arrastando uma linha para um espaço vazio. Além disso, o `connectionRadius` de 80px funciona como um "ímã", facilitando conexões rápidas.
* **Integridade de Dados em Tempo Real:** A edição inline utiliza um componente `NumericInput` customizado que garante que as conversões nunca ultrapassem o número de visitantes, mantendo a integridade matemática da taxa de conversão.
* **Vanguarda Tecnológica:** Utilizei o **Tailwind CSS v4** e o **React Flow v12 (@xyflow/react)**, demonstrando proatividade em trabalhar com as versões mais recentes das ferramentas de mercado.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** Next.js 14 (App Router)
* **Linguagem:** TypeScript 5
* **Core do Funil:** @xyflow/react (React Flow)
* **Estilização:** Tailwind CSS v4
* **Componentes:** shadcn/ui + Radix UI
* **Gestão de Temas:** next-themes (Dark/Light mode nativo)

---

## ✨ Funcionalidades Principais

* **Drag & Drop:** Adição de etapas pré-configuradas (Anúncio, Landing Page, etc.) via sidebar lateral.
* **Edição Inline:** Alteração de títulos e métricas diretamente no card.
* **Persistência:** O funil é salvo automaticamente no `localStorage`.
* **Interface Glassmorphism:** Design moderno com blur de fundo e transparências.
* **Navegação Avançada:** Minimapa interativo, pan e zoom para lidar com funis de grande escala.

---

## ⚙️ Como rodar o projeto localmente

1.  **Clone o repositório:** `git clone https://github.com/FrantzJupiter/funil-twr`
2.  **Instale as dependências:** `npm install`
3.  **Inicie o servidor:** `npm run dev`
4.  **Acesse em:** `http://localhost:3000`

---

**Luis Frantz Granado Junior** — Juiz de Fora, MG.
📧 [luisfrantzjr@gmail.com](mailto:luisfrantzjr@gmail.com)
📱 (32) 99951-7315
🔗 [LinkedIn](https://www.linkedin.com/in/frantzjunior/)