// ─────────────────────────────────────────────
//  PROGRAMS — estrutura multi-mês
//  Cada programa tem treino A e treino B.
//  Exercícios compartilhados entre meses usam
//  o mesmo ID base (ex: 'c_prancha_alta') para
//  que o histórico de carga seja contínuo.
// ─────────────────────────────────────────────

export const PROGRAMS = {

  // ══════════════════════════════════════════
  //  MÊS 1 — arquivado
  // ══════════════════════════════════════════
  mes1: {
    label: 'Mês 1',
    status: 'archived', // 'active' | 'archived'
    treinos: {

      treinoA: {
        name: 'Treino A — Peito, Perna & Tríceps',
        sections: [
          { name: 'Core', exercises: [
            { id: 'c_prancha_alta',       name: 'Prancha Alta',              sets: 1, reps: '30"',       hw: false },
            { id: 'c_prancha_baixa',      name: 'Prancha Baixa',             sets: 1, reps: '30"',       hw: false },
            { id: 'c_elev_pelvica_uni',   name: 'Elev. Pélvica Unilateral',  sets: 2, reps: '15',        hw: false },
            { id: 'c_perdigueiro',        name: 'Perdigueiro',               sets: 2, reps: '15',        hw: false },
          ]},
          { name: 'Musculação', exercises: [
            { id: 'c_supino_reto',        name: 'Supino Reto',               sets: 4, reps: '8-12',      hw: true  },
            { id: 'm1a_afundo',           name: 'Afundo sem peso',           sets: 3, reps: '10',        hw: false },
            { id: 'm1a_crucifixo',        name: 'Crucifixo',                 sets: 4, reps: '8-12',      hw: true  },
            { id: 'c_extensora_uni',      name: 'Extensora Unilateral',      sets: 3, reps: '10 cada',   hw: true  },
            { id: 'c_triceps_cross',      name: 'Tríceps Cross c/ Corda',    sets: 4, reps: '8',         hw: true  },
            { id: 'm1a_panturrilha',      name: 'Panturrilha Inclinado',     sets: 4, reps: '15',        hw: true  },
          ]},
        ],
      },

      treinoB: {
        name: 'Treino B — Costas, Perna & Bíceps',
        sections: [
          { name: 'Core', exercises: [
            { id: 'c_prancha_baixa',      name: 'Prancha Baixa',             sets: 1, reps: '30"',       hw: false },
            { id: 'c_prancha_lateral',    name: 'Prancha Lateral',           sets: 2, reps: '20" cada',  hw: false },
            { id: 'c_elev_pelvica',       name: 'Elevação Pélvica',          sets: 2, reps: '20',        hw: false },
          ]},
          { name: 'Musculação', exercises: [
            { id: 'm1b_remada_baixa',     name: 'Remada Baixa Peg. Aberta',  sets: 4, reps: '8-12',      hw: true  },
            { id: 'm1b_agachamento',      name: 'Agachamento Livre',         sets: 4, reps: '6-8',       hw: true  },
            { id: 'm1b_pulldown',         name: 'Pulldown',                  sets: 4, reps: '8-12',      hw: true  },
            { id: 'c_flexora',            name: 'Flexora',                   sets: 3, reps: '6-8',       hw: true  },
            { id: 'm1b_rosca_halt',       name: 'Rosca c/ Halteres',         sets: 4, reps: '12',        hw: true  },
            { id: 'm1b_desenv_ombro',     name: 'Desenv. Ombro c/ Halteres', sets: 3, reps: '8-12',      hw: true  },
          ]},
        ],
      },
    },
  },

  // ══════════════════════════════════════════
  //  MÊS 2 — ativo
  // ══════════════════════════════════════════
  mes2: {
    label: 'Mês 2',
    status: 'active',
    treinos: {

      treinoA: {
        name: 'Treino A — Peito, Perna & Tríceps',
        sections: [
          { name: 'Core', exercises: [
            { id: 'c_perdigueiro',        name: 'Perdigueiro',               sets: 2, reps: '15',        hw: false },
            { id: 'c_elev_pelvica_uni',   name: 'Elev. Pélvica Unilateral',  sets: 2, reps: '15',        hw: false },
            { id: 'c_prancha_alta',       name: 'Prancha Alta',              sets: 1, reps: '40"',       hw: false },
            { id: 'c_prancha_lateral',    name: 'Prancha Lateral',           sets: 2, reps: '10 cada',   hw: false,
              obs: 'Com movimentação. 2kg na mão.' },
          ]},
          { name: 'Esteira', exercises: [
            { id: 'm2a_esteira',          name: 'Esteira — Intervalado',     sets: 2, reps: '~7\'30"',   hw: false,
              obs: '2\' 5km/h → 1\' 10km/h → 1\'30" 5km/h → 1\' 10km/h → 1\' 5km/h → 1\' 10km/h' },
          ]},
          { name: 'Musculação', exercises: [
            { id: 'c_flexora',            name: 'Flexora',                   sets: 4, reps: '6-8',       hw: true  },
            { id: 'm2a_subida_banco',     name: 'Subida no Banco c/ Peso',   sets: 4, reps: '6',         hw: true  },
            { id: 'c_supino_reto',        name: 'Supino Reto',               sets: 4, reps: '8',         hw: true,
              paired: { name: 'Flexão de Braço', reps: '8', hw: false } },
            { id: 'c_triceps_cross',      name: 'Tríceps Cross c/ Corda',    sets: 4, reps: '6-8',       hw: true  },
            { id: 'm2a_triceps_banco',    name: 'Tríceps no Banco',          sets: 3, reps: '15',        hw: false },
          ]},
        ],
      },

      treinoB: {
        name: 'Treino B — Costas, Quadríceps & Bíceps',
        sections: [
          { name: 'Core', exercises: [
            { id: 'c_perdigueiro',        name: 'Perdigueiro',               sets: 2, reps: '15',        hw: false },
            { id: 'c_elev_pelvica_uni',   name: 'Elev. Pélvica Unilateral',  sets: 2, reps: '15',        hw: false },
            { id: 'c_prancha_alta',       name: 'Prancha Alta',              sets: 1, reps: '40"',       hw: false },
            { id: 'c_prancha_lateral',    name: 'Prancha Lateral',           sets: 2, reps: '10 cada',   hw: false,
              obs: 'Com movimentação. 2kg na mão.' },
          ]},
          { name: 'Bicicleta', exercises: [
            { id: 'm2b_bicicleta',        name: 'Bicicleta — Aeróbico',      sets: 1, reps: '15\'',      hw: false,
              obs: 'Manter acima de 140 RPM. 5\' de intervalo após.' },
          ]},
          { name: 'Musculação', exercises: [
            { id: 'm2b_puxada_aberta',    name: 'Puxada Alta Peg. Aberta',   sets: 4, reps: '8-12',      hw: true  },
            { id: 'c_extensora_uni',      name: 'Extensora Unilateral',      sets: 3, reps: '8 cada',    hw: true  },
            { id: 'm2b_extensora_bi',     name: 'Extensora Bilateral',       sets: 4, reps: '6-8',       hw: true  },
            { id: 'm2b_remada_hts',       name: 'Remada Curvada c/ HTS',     sets: 4, reps: '6-8',       hw: true  },
            { id: 'm2b_rosca_w',          name: 'Rosca c/ Barra W',          sets: 4, reps: '8-12',      hw: true  },
            { id: 'm2b_lev_terra',        name: 'Levantamento Terra',        sets: 3, reps: '6',         hw: true,
              paired: { name: '2 Saltos Verticais', reps: '2', hw: false } },
          ]},
        ],
      },
    },
  },
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

export const ACTIVE_PROGRAM_ID = Object.keys(PROGRAMS).find(
  k => PROGRAMS[k].status === 'active'
);

export const ACTIVE_PROGRAM = PROGRAMS[ACTIVE_PROGRAM_ID];

// Compatibilidade com código legado que usava WORKOUTS
// (histórico salvo com wk: 'treino1' | 'treino2' mapeia para mes1)
export const LEGACY_WORKOUT_MAP = {
  treino1: { program: 'mes1', treino: 'treinoA' },
  treino2: { program: 'mes1', treino: 'treinoB' },
};

// ─────────────────────────────────────────────
//  Alimentação, suplementos e atividades
//  (sem alterações)
// ─────────────────────────────────────────────

export const MEALS = {
  cafe: { name: 'Café da Manhã', icon: '☀️', items: [
    { id: 'cf1', name: 'Banana prata',    qty: '1 unid. média (65g)',  subs: 'Uva 15 unid. (120g) ou Tangerina 1 unid. (135g)' },
    { id: 'cf2', name: 'Mandioca cozida', qty: '4 pedaços peq. (200g)', subs: 'Batata doce 280g ou Inhame 220g ou Cuscuz 200g ou Pão francês 2 unid. ou Tapioca 90g' },
    { id: 'cf3', name: 'Ovo de galinha',  qty: '1 unid. (50g)',        subs: 'Frango desfiado 50g ou Carne moída 30g' },
    { id: 'cf4', name: 'Queijo coalho',   qty: '1 fatia (45g)',        subs: 'Mussarela 3 fatias (45g)' },
    { id: 'cf5', name: 'Whey protein',    qty: '40g',                  subs: '' },
  ], obs: 'Energético só de manhã.' },

  almoco: { name: 'Almoço', icon: '🍽️', items: [
    { id: 'al1', name: 'Salada crua',    qty: 'À vontade',           subs: '' },
    { id: 'al2', name: 'Legumes cozidos', qty: '150g',               subs: '' },
    { id: 'al3', name: 'Arroz branco',   qty: '6 colheres (150g)',   subs: '' },
    { id: 'al4', name: 'Feijão verde',   qty: '2 conchas (130g)',    subs: 'Feijão carioca ou preto' },
    { id: 'al5', name: 'Filé de frango', qty: '150g',                subs: 'Porco 100g, Camarão 300g, Contrafilé 120g, Salmão 120g, Tilápia 200g, Carne moída 150g' },
  ], obs: 'Tempero: mostarda zero + mel + limão. Máx 1 Coca Zero/dia.' },

  sobremesa: { name: 'Sobremesa', icon: '🍫', items: [
    { id: 'sb1', name: 'Doce de Leite Hey!Mu', qty: '1 colher (20g)', subs: 'Lacta 60% 2 quadradinhos ou Pasta Dr. Peanut 1 colher' },
  ], obs: '' },

  preTreino: { name: 'Pré-Treino', icon: '⚡', items: [
    { id: 'pt1', name: 'Banana',           qty: '1 grande (100g)', subs: 'Uva 1 cacho (170g)' },
    { id: 'pt2', name: 'Pasta de amendoim', qty: '20g',            subs: '' },
    { id: 'pt3', name: 'Mel',              qty: '1 colher rasa (15g)', subs: '' },
  ], obs: '' },

  jantar: { name: 'Jantar', icon: '🌙', items: [
    { id: 'jn1', name: 'Mandioca cozida', qty: '4 pedaços (200g)',  subs: 'Batata doce 280g ou Inhame 220g ou Cuscuz 200g ou Pão 2 unid. ou Tapioca 90g' },
    { id: 'jn2', name: 'Charque',         qty: '100g',              subs: 'Frango 150g, 3 Ovos, Carne de sol 90g, Moela 200g, Fígado 110g' },
    { id: 'jn3', name: 'Queijo coalho',   qty: '1 fatia (45g)',     subs: '' },
  ], obs: '1ª hora pós-treino!' },
};

export const SUPPLEMENTS = [
  { id: 'sup1', name: 'Creatina',          qty: '7g',      period: 'manhã' },
  { id: 'sup2', name: 'Beta-Alanina',      qty: '4g',      period: 'manhã' },
  { id: 'sup3', name: 'Night Calm Serenus', qty: '2 cáps.', period: 'pós jantar' },
  { id: 'sup4', name: 'Magnésio',          qty: '2 cáps.', period: 'pós jantar' },
];

export const ACTIVITIES = [
  { id: 'surf',        label: 'Surf',        icon: '🏄' },
  { id: 'natacao',     label: 'Natação',     icon: '🏊' },
  { id: 'jiujitsu',   label: 'Jiu-Jitsu',   icon: '🥋' },
  { id: 'academia',   label: 'Academia',     icon: '🏋️' },
  { id: 'corrida',    label: 'Corrida',      icon: '🏃' },
  { id: 'alongamento', label: 'Alongamento', icon: '🧘' },
];

export function emptyDay() {
  return {
    program: ACTIVE_PROGRAM_ID, // 'mes2'
    wk: 'treinoA',              // 'treinoA' | 'treinoB'
    ex: {}, mc: {}, sub: {}, sp: {}, act: {},
    water: 0, notes: '',
    cal: { a: '', b: '', t: '' },
  };
}

export const TOTAL_MEALS = Object.values(MEALS).reduce((a, m) => a + m.items.length, 0);
