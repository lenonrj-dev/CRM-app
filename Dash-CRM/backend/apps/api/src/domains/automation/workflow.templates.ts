export const workflowTemplates = [
  {
    id: "lead-first-contact",
    name: "Potencial novo - primeiro contato",
    description: "Criar um acompanhamento rápido e notificar Vendas.",
    trigger: { type: "LEAD_CREATED" },
    conditions: [],
    actions: [
      {
        type: "CREATE_ACTIVITY",
        payload: {
          subject: "Primeiro contato em 15 minutos",
          dueInMinutes: 15,
          notes: "Automação: priorizar o primeiro contato",
          ownerRole: "USER",
        },
      },
      {
        type: "NOTIFY_IN_APP",
        payload: {
          title: "Novo potencial",
          message: "Um novo potencial precisa do primeiro contato.",
          role: "USER",
        },
      },
    ],
  },
  {
    id: "deal-stale-reminder",
    name: "Oportunidade parada - acompanhamento",
    description: "Criar acompanhamento para oportunidades após mudança de etapa.",
    trigger: { type: "DEAL_STAGE_CHANGED" },
    conditions: [{ field: "stage", op: "neq", value: "WON" }],
    actions: [
      {
        type: "CREATE_ACTIVITY",
        payload: {
          subject: "Acompanhamento da oportunidade",
          dueInDays: 7,
          notes: "Automação: verificar se a oportunidade está parada.",
          ownerRole: "USER",
        },
      },
      {
        type: "NOTIFY_IN_APP",
        payload: {
          title: "Acompanhamento de oportunidade",
          message: "A oportunidade mudou de etapa. Agende um acompanhamento em 7 dias.",
          role: "USER",
        },
      },
    ],
  },
  {
    id: "ticket-urgent-assignment",
    name: "Chamado urgente - atribuir e notificar",
    description: "Atribuir chamados urgentes e alertar o gerente.",
    trigger: { type: "TICKET_CREATED" },
    conditions: [{ field: "priority", op: "eq", value: "URGENT" }],
    actions: [
      {
        type: "ASSIGN_OWNER",
        payload: { entity: "ticket", ownerRole: "USER" },
      },
      {
        type: "NOTIFY_IN_APP",
        payload: {
          title: "Chamado urgente",
          message: "Um chamado urgente foi criado e atribuído.",
          role: "MANAGER",
        },
      },
    ],
  },
  {
    id: "health-drop",
    name: "Saúde caiu - alerta CS",
    description: "Criar atividade de CS e alertar o gerente quando a saúde cair.",
    trigger: { type: "HEALTH_SCORE_DROPPED" },
    conditions: [{ field: "score", op: "lt", value: 60 }],
    actions: [
      {
        type: "CREATE_ACTIVITY",
        payload: {
          subject: "Check-in de saúde",
          dueInDays: 1,
          notes: "Automação: pontuação de saúde caiu abaixo de 60.",
          ownerRole: "MANAGER",
        },
      },
      {
        type: "NOTIFY_IN_APP",
        payload: {
          title: "Alerta de pontuação de saúde",
          message: "A pontuação de saúde do cliente caiu abaixo de 60.",
          role: "MANAGER",
        },
      },
    ],
  },
  {
    id: "renewal-30-days",
    name: "Renovação em 30 dias",
    description: "Preparar atividades e alertas de renovação.",
    trigger: { type: "RENEWAL_DUE_SOON" },
    conditions: [],
    actions: [
      {
        type: "CREATE_ACTIVITY",
        payload: {
          subject: "Contato de renovação",
          dueInDays: 2,
          notes: "Automação: renovação próxima.",
          ownerRole: "MANAGER",
        },
      },
      {
        type: "NOTIFY_IN_APP",
        payload: {
          title: "Renovação próxima",
          message: "Uma renovação vence em 30 dias.",
          role: "MANAGER",
        },
      },
    ],
  },
];
