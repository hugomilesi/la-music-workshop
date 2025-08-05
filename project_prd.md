
  1. Introdução e Visão Geral

  O "La Music Week" é uma plataforma web completa projetada para gerenciar as inscrições e a organização de um evento musical. O sistema atende a dois públicos
  principais: os participantes (e/ou seus responsáveis), que se inscrevem nas oficinas, e os administradores, que gerenciam todo o evento através de um painel de
  controle dedicado.

  A aplicação utiliza uma arquitetura moderna com Next.js para o frontend e backend (API routes), TypeScript para segurança de tipos, Tailwind CSS e shadcn/ui para
  uma interface de usuário rica e responsiva, e Supabase como backend de banco de dados e autenticação.

  2. Objetivos do Produto

   * Para Participantes: Oferecer um processo de inscrição online simples, intuitivo e informativo, permitindo a visualização clara das oficinas disponíveis.
   * Para Administradores: Centralizar e simplificar a gestão de inscrições, oficinas e comunicação, fornecendo dados e estatísticas para tomada de decisão.
   * Para o Negócio: Automatizar tarefas manuais (como envio de lembretes), garantir a integridade dos dados e projetar uma imagem profissional e organizada do
     evento.

  3. Personas de Usuário

   1. Participante / Responsável (Usuário Externo):
       * Necessidades: Quer inscrever a si mesmo ou um aluno em uma ou mais oficinas de música. Precisa ver detalhes como nome da oficina, descrição e talvez
         pré-requisitos. O processo deve ser claro e confirmar a inscrição ao final.
       * Jornada: Acessa a página inicial, explora as oficinas, preenche o formulário de inscrição com dados do aluno e do responsável, seleciona as oficinas
         desejadas e finaliza a inscrição.

   2. Administrador do Evento (Usuário Interno):
       * Necessidades: Precisa de uma visão completa de todas as inscrições. Deve ser capaz de adicionar, editar ou remover oficinas. Quer visualizar estatísticas
         (ex: total de inscritos, inscritos por oficina). Precisa de ferramentas para gerenciar o sistema e se comunicar com os inscritos.
       * Jornada: Faz login em uma área de acesso restrito, visualiza o dashboard com estatísticas, gerencia a lista de inscritos (podendo ver detalhes de cada um),
         gerencia as oficinas oferecidas e utiliza as ferramentas de comunicação (teste de WhatsApp, lembretes).

  4. Requisitos Funcionais (Features)

  Módulo 1: Website Público e Inscrições

   * 1.1. Página Inicial (`/`):
       * Hero Section: Apresentação principal do evento.
       * Features Section: Destaques e benefícios do "La Music Week".
       * Workshops Preview: Uma prévia das oficinas disponíveis para atrair interesse.
       * Contact Section: Informações de contato.
   * 1.2. Página de Oficinas (`/oficinas`):
       * Listagem completa de todas as oficinas disponíveis com descrições detalhadas.
   * 1.3. Fluxo de Inscrição (`/inscricao`):
       * Formulário multi-etapas para uma experiência de usuário fluida.
       * Seleção de Oficina: O usuário escolhe as oficinas de interesse.
       * Formulário do Aluno: Coleta de dados pessoais do participante.
       * Formulário do Responsável: Coleta de dados do guardião legal (indica foco em menores de idade).
       * Resumo da Inscrição: Tela de revisão com todos os dados antes do envio final.

  Módulo 2: Painel Administrativo

   * 2.1. Autenticação (`/admin/login`):
       * Página de login segura para acesso ao painel de controle.
       * APIs para login, logout e verificação de sessão.
   * 2.2. Dashboard Principal (`/admin/dashboard`):
       * Exibição de estatísticas chave sobre o evento (ex: número total de inscrições).
       * Acesso rápido às principais áreas de gerenciamento.
   * 2.3. Gerenciamento de Inscrições:
       * Visualização de todas as inscrições em formato de tabela.
       * Modal para exibir detalhes completos de uma inscrição específica.
       * Funcionalidade para exportar os dados das inscrições.
   * 2.4. Gerenciamento de Oficinas:
       * Interface para Criar, Ler, Atualizar e Deletar (CRUD) as oficinas.
       * Formulário em modal para adicionar ou editar uma oficina.
   * 2.5. Configurações do Sistema:
       * Página para ajustar configurações gerais da aplicação.

  Módulo 3: Automação e Comunicação

   * 3.1. Integração com WhatsApp:
       * Serviço dedicado (whatsappService.js) para interagir com a API do WhatsApp.
       * Ferramenta de teste no painel admin para validar o envio de mensagens.
       * APIs para consultar status e enviar mensagens de teste.
   * 3.2. Agendador de Tarefas (`scheduler.js`):
       * Serviço de backend para executar tarefas agendadas, como o envio de lembretes automáticos aos inscritos (inferido pela coluna reminder_sent no SQL e o
         reminder-test.tsx).

  5. Requisitos Não-Funcionais

   * Stack de Tecnologia: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL), Playwright (Testes E2E), PM2 (Process Manager).
   * Usabilidade: A interface deve ser moderna, limpa, responsiva e acessível em diferentes dispositivos (desktop e mobile).
   * Segurança: Acesso ao painel administrativo estritamente controlado por autenticação. Senhas e dados sensíveis devem ser tratados de forma segura.
   * Desempenho: O site deve carregar rapidamente, e as operações no painel administrativo devem ser ágeis.
   * Testabilidade: A existência de testes E2E com Playwright indica um requisito de alta qualidade e robustez, garantindo que os fluxos críticos (como inscrição)
     funcionem como esperado.

  6. Escopo Futuro e Melhorias (Potenciais)

   * Integração de Pagamentos: Adicionar um gateway de pagamento ao fluxo de inscrição.
   * Portal do Usuário: Uma área onde o participante pode fazer login para ver o status de sua inscrição, materiais da oficina, etc.
   * Notificações por E-mail: Como alternativa ou complemento às notificações via WhatsApp.
   * Gestão de Vagas: Controle de limite de vagas por oficina.
   * Relatórios Avançados: Geração de relatórios customizáveis no painel administrativo.