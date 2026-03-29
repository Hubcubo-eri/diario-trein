export const WORKOUTS = {
  treino1: {
    name: 'Treino 1 — Peito, Perna & Tríceps',
    sections: [
      { name: 'Core', exercises: [
        { id: 'c1_1', name: 'Prancha Alta', sets: 1, reps: '30"', hw: false },
        { id: 'c1_2', name: 'Prancha Baixa', sets: 1, reps: '30"', hw: false },
        { id: 'c1_3', name: 'Elev. Pélvica Unilateral', sets: 2, reps: '15', hw: false },
        { id: 'c1_4', name: 'Perdigueiro', sets: 2, reps: '15', hw: false },
      ]},
      { name: 'Musculação', exercises: [
        { id: 'm1_1', name: 'Supino Reto', sets: 4, reps: '8-12', hw: true },
        { id: 'm1_2', name: 'Afundo sem peso', sets: 3, reps: '10', hw: false },
        { id: 'm1_3', name: 'Crucifixo', sets: 4, reps: '8-12', hw: true },
        { id: 'm1_4', name: 'Extensora Unilateral', sets: 3, reps: '10 cada', hw: true },
        { id: 'm1_5', name: 'Tríceps Cross c/ Corda', sets: 4, reps: '8', hw: true },
        { id: 'm1_6', name: 'Panturrilha inclinado', sets: 4, reps: '15', hw: true },
      ]},
    ],
  },
  treino2: {
    name: 'Treino 2 — Costas, Perna & Bíceps',
    sections: [
      { name: 'Core', exercises: [
        { id: 'c2_1', name: 'Prancha Baixa', sets: 1, reps: '30"', hw: false },
        { id: 'c2_2', name: 'Prancha Lateral', sets: 2, reps: '20" cada', hw: false },
        { id: 'c2_3', name: 'Elevação Pélvica', sets: 2, reps: '20', hw: false },
      ]},
      { name: 'Musculação', exercises: [
        { id: 'm2_1', name: 'Remada Baixa Peg. Aberta', sets: 4, reps: '8-12', hw: true },
        { id: 'm2_2', name: 'Agachamento Livre', sets: 4, reps: '6-8', hw: true },
        { id: 'm2_3', name: 'Pulldown', sets: 4, reps: '8-12', hw: true },
        { id: 'm2_4', name: 'Flexora', sets: 3, reps: '6-8', hw: true },
        { id: 'm2_5', name: 'Rosca c/ Halteres', sets: 4, reps: '12', hw: true },
        { id: 'm2_6', name: 'Desenv. Ombro c/ Halteres', sets: 3, reps: '8-12', hw: true },
      ]},
    ],
  },
};

export const MEALS = {
  cafe: { name: 'Café da Manhã', icon: '☀️', items: [
    { id: 'cf1', name: 'Banana prata', qty: '1 unid. média (65g)', subs: 'Uva 15 unid. (120g) ou Tangerina 1 unid. (135g)' },
    { id: 'cf2', name: 'Mandioca cozida', qty: '4 pedaços peq. (200g)', subs: 'Batata doce 280g ou Inhame 220g ou Cuscuz 200g ou Pão francês 2 unid. ou Tapioca 90g' },
    { id: 'cf3', name: 'Ovo de galinha', qty: '1 unid. (50g)', subs: 'Frango desfiado 50g ou Carne moída 30g' },
    { id: 'cf4', name: 'Queijo coalho', qty: '1 fatia (45g)', subs: 'Mussarela 3 fatias (45g)' },
    { id: 'cf5', name: 'Whey protein', qty: '40g', subs: '' },
  ], obs: 'Energético só de manhã.' },
  almoco: { name: 'Almoço', icon: '🍽️', items: [
    { id: 'al1', name: 'Salada crua', qty: 'À vontade', subs: '' },
    { id: 'al2', name: 'Legumes cozidos', qty: '150g', subs: '' },
    { id: 'al3', name: 'Arroz branco', qty: '6 colheres (150g)', subs: '' },
    { id: 'al4', name: 'Feijão verde', qty: '2 conchas (130g)', subs: 'Feijão carioca ou preto' },
    { id: 'al5', name: 'Filé de frango', qty: '150g', subs: 'Porco 100g, Camarão 300g, Contrafilé 120g, Salmão 120g, Tilápia 200g, Carne moída 150g' },
  ], obs: 'Tempero: mostarda zero + mel + limão. Máx 1 Coca Zero/dia.' },
  sobremesa: { name: 'Sobremesa', icon: '🍫', items: [
    { id: 'sb1', name: 'Doce de Leite Hey!Mu', qty: '1 colher (20g)', subs: 'Lacta 60% 2 quadradinhos ou Pasta Dr. Peanut 1 colher' },
  ], obs: '' },
  preTreino: { name: 'Pré-Treino', icon: '⚡', items: [
    { id: 'pt1', name: 'Banana', qty: '1 grande (100g)', subs: 'Uva 1 cacho (170g)' },
    { id: 'pt2', name: 'Pasta de amendoim', qty: '20g', subs: '' },
    { id: 'pt3', name: 'Mel', qty: '1 colher rasa (15g)', subs: '' },
  ], obs: '' },
  jantar: { name: 'Jantar', icon: '🌙', items: [
    { id: 'jn1', name: 'Mandioca cozida', qty: '4 pedaços (200g)', subs: 'Batata doce 280g ou Inhame 220g ou Cuscuz 200g ou Pão 2 unid. ou Tapioca 90g' },
    { id: 'jn2', name: 'Charque', qty: '100g', subs: 'Frango 150g, 3 Ovos, Carne de sol 90g, Moela 200g, Fígado 110g' },
    { id: 'jn3', name: 'Queijo coalho', qty: '1 fatia (45g)', subs: '' },
  ], obs: '1ª hora pós-treino!' },
};

export const SUPPLEMENTS = [
  { id: 'sup1', name: 'Creatina', qty: '7g', period: 'manhã' },
  { id: 'sup2', name: 'Beta-Alanina', qty: '4g', period: 'manhã' },
  { id: 'sup3', name: 'Night Calm Serenus', qty: '2 cáps.', period: 'pós jantar' },
  { id: 'sup4', name: 'Magnésio', qty: '2 cáps.', period: 'pós jantar' },
];

export const ACTIVITIES = [
  { id: 'surf', label: 'Surf', icon: '🏄' },
  { id: 'natacao', label: 'Natação', icon: '🏊' },
  { id: 'jiujitsu', label: 'Jiu-Jitsu', icon: '🥋' },
  { id: 'academia', label: 'Academia', icon: '🏋️' },
  { id: 'corrida', label: 'Corrida', icon: '🏃' },
  { id: 'alongamento', label: 'Alongamento', icon: '🧘' },
];

export function emptyDay() {
  return { wk: 'treino1', ex: {}, mc: {}, sub: {}, sp: {}, act: {}, water: 0, notes: '', cal: { a: '', b: '', t: '' } };
}

export const TOTAL_MEALS = Object.values(MEALS).reduce((a, m) => a + m.items.length, 0);
