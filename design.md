# Guia de Design de Componentes Frontend Modernos

Este guia apresenta uma lista de componentes de UI (User Interface) modernos, suas finalidades e exemplos de sites que os utilizam de forma exemplar. O objetivo é servir como referência para a criação de interfaces ricas, intuitivas e esteticamente agradáveis.

---

### 1. Hero Section (Seção Herói)

- **O que é:** A primeira área visual de destaque que um usuário vê ao acessar uma página. Geralmente contém um título impactante, um subtítulo, uma imagem ou vídeo de fundo e um **Call-to-Action (CTA)** principal.
- **Quando usar:** Essencial na página inicial (Homepage) para capturar a atenção do usuário e comunicar a proposta de valor do produto ou serviço instantaneamente.
- **Exemplos em Produção:**
  - [Apple](https://www.apple.com/): Mestre em hero sections minimalistas e focadas no produto.
  - [Stripe](https://stripe.com/): Usa gráficos e animações sutis para apresentar um produto complexo de forma clara.
  - [Notion](https://www.notion.so/): Simples, direto e com um CTA claro para o cadastro.

---

### 2. Command Palette (Paleta de Comandos)

- **O que é:** Uma caixa de diálogo ativada por atalho (geralmente `Ctrl/Cmd + K`) que permite ao usuário pesquisar e executar ações rapidamente, como navegar para outras páginas, alterar configurações ou executar comandos específicos da aplicação.
- **Quando usar:** Em aplicações complexas (SAAS, painéis de admin, ferramentas de produtividade) para oferecer uma experiência de "power user", agilizando a navegação e a execução de tarefas.
- **Exemplos em Produção:**
  - [Vercel](https://vercel.com/): Um dos melhores exemplos, permitindo navegar por projetos, times e configurações.
  - [Linear](https://linear.app/): A navegação e a criação de tarefas são centradas na paleta de comandos.
  - [Slack](https://slack.com/): Permite buscar conversas, arquivos e executar comandos rapidamente.

---

### 3. Cards (Cartões)

- **O que é:** Contêineres de conteúdo flexíveis e modulares que agrupam informações relacionadas, como imagem, título, descrição e ações.
- **Quando usar:** Ideal para exibir uma coleção de itens de forma organizada e escaneável, como posts de blog, produtos, perfis de usuário ou cursos.
- **Exemplos em Produção:**
  - [Airbnb](https://www.airbnb.com/): Usa cards para listar acomodações de forma visual e informativa.
  - [Pinterest](https://www.pinterest.com/): A interface inteira é baseada em um grid de cards.
  - [Trello](https://trello.com/): Usa cards para representar tarefas em um fluxo de trabalho (Kanban).

---

### 4. Toast / Snackbar

- **O que é:** Uma notificação não intrusiva e temporária que aparece geralmente no canto da tela para fornecer feedback sobre uma ação realizada pelo usuário (ex: "Item salvo com sucesso", "E-mail enviado").
- **Quando usar:** Para confirmar ações sem interromper o fluxo do usuário. Não deve ser usado para mensagens críticas que exigem uma ação.
- **Exemplos em Produção:**
  - [Google (Gmail, Drive)](https://mail.google.com/): O "snackbar" no canto inferior esquerdo é um padrão clássico.
  - [GitHub](https://github.com/): Usa toasts para confirmar ações como "branch criada".

---

### 5. Skeleton Loader (Carregamento Esqueleto)

- **O que é:** Uma versão "vazia" da interface que é exibida enquanto o conteúdo real está sendo carregado. Ele mostra a estrutura da página (caixas cinzas onde estarão imagens, texto, etc.), melhorando a percepção de velocidade.
- **Quando usar:** Em qualquer lugar onde os dados demoram um pouco para carregar (dashboards, feeds de notícias, listas de produtos). Evita "saltos" na tela (layout shift) e informa ao usuário que algo está acontecendo.
- **Exemplos em Produção:**
  - [LinkedIn](https://www.linkedin.com/): Usa skeleton loaders extensivamente no feed e nos perfis.
  - [YouTube](https://www.youtube.com/): Mostra esqueletos dos vídeos na home e nas páginas de canal.
  - [Facebook](https://www.facebook.com/): Um dos pioneiros no uso em feeds de notícias.

---

### 6. Accordion (Acordeão)

- **O que é:** Um componente de lista onde cada item pode ser "aberto" ou "fechado" para revelar ou ocultar seu conteúdo.
- **Quando usar:** Perfeito para seções de FAQ (Perguntas Frequentes), menus de navegação aninhados ou para dividir conteúdo longo em seções digeríveis sem poluir a tela.
- **Exemplos em Produção:**
  - Quase todas as seções de FAQ em sites de produtos e serviços.
  - [Apple (página de especificações)](https://www.apple.com/br/iphone-15-pro/specs/): Usa para agrupar e organizar as especificações técnicas.

---

### 7. Modal / Dialog (Janela Modal)

- **O que é:** Uma janela de diálogo que aparece sobre o conteúdo da página, exigindo que o usuário interaja com ela antes de poder retornar à página principal.
- **Quando usar:** Para ações críticas que precisam de foco total, como confirmações de exclusão ("Você tem certeza?"), formulários de login/cadastro, ou para exibir informações detalhadas (como uma galeria de imagens) sem sair do contexto atual.
- **Exemplos em Produção:**
  - [Stripe (Checkout)](https://stripe.com/payments/checkout): O fluxo de pagamento geralmente ocorre em um modal para manter o usuário focado.
  - [Instagram](https://www.instagram.com/): Ao clicar em uma foto no feed de um perfil, ela abre em um modal.

---

### 8. Toggle / Switch (Interruptor)

- **O que é:** Um controle que permite ao usuário alternar entre dois estados, como "ligado" ou "desligado".
- **Quando usar:** Ideal para configurações binárias, como ativar/desativar notificações, mudar para o modo escuro (Dark Mode) ou aceitar termos de serviço. É mais visual e imediato que um checkbox para essas ações.
- **Exemplos em Produção:**
  - Configurações de qualquer sistema operacional (iOS, Android).
  - [Twitter / X](https://twitter.com/settings): Usado para controlar diversas preferências de conta e notificações.
