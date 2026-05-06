import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PROGRAMS } from './data';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const criarMapaExercicios = () => {
  const mapa = {};
  Object.values(PROGRAMS).forEach(program => {
    Object.values(program.treinos).forEach(workout => {
      workout.sections.forEach(section => {
        section.exercises.forEach(ex => {
          mapa[ex.id] = ex.name;
        });
      });
    });
  });
  return mapa;
};

const EXERCICIOS_NOMES = criarMapaExercicios();

export function DashboardEvolucao({ supabaseClient, userId, allData = {} }) {
  const [avaliacoes, setAvaliacoes] = useState([
    { id: 1, data: '25/03/2026', peso: 91.75, percentualGordura: 16.8, massaLivre: 76.3, massaGordura: 15.4, cmb: 28.9, cintura: 94.5, quadril: 105, abdomen: 98 },
    { id: 2, data: '22/04/2026', peso: 94.8, percentualGordura: 16.7, massaLivre: 79, massaGordura: 15.8, cmb: 29.5, cintura: 95.8, quadril: 107, abdomen: 100 }
  ]);

  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [novaAvaliacao, setNovaAvaliacao] = useState(null);
  const [tab, setTab] = useState('composicao');
  const [exercicioSelecionado, setExercicioSelecionado] = useState(null);
  const [metasExercicios, setMetasExercicios] = useState({});
  const [notasTreino, setNotasTreino] = useState({});
  const [novaMetaEx, setNovaMetaEx] = useState(null);
  const [novaMetaValor, setNovaMetaValor] = useState('');

  // Extrair histórico de exercícios do allData
  const [exerciciosHistorico, setExerciciosHistorico] = useState(() => {
    const historico = {};
    Object.entries(allData || {}).forEach(([dataISO, dayData]) => {
      if (!dayData || !dayData.ex) return;
      const [ano, mes, dia] = dataISO.split('-');
      const dataBR = `${dia}/${mes}/${ano}`;
      Object.entries(dayData.ex).forEach(([exId, exData]) => {
        if (!exData.w || exData.w === '') return;
        if (!historico[exId]) historico[exId] = [];
        historico[exId].push({
          data: dataBR,
          dataISO: dataISO,
          peso: parseFloat(exData.w),
          done: exData.done || false
        });
      });
    });
    Object.keys(historico).forEach(exId => {
      historico[exId].sort((a, b) => {
        const [da, ma, aa] = a.dataISO.split('-').map(Number);
        const [db, mb, ab] = b.dataISO.split('-').map(Number);
        return new Date(aa, ma - 1, da) - new Date(ab, mb - 1, db);
      });
    });
    return historico;
  });

  // Calcular PRs (melhor série do mês)
  const calcularPRs = () => {
    const prs = {};
    Object.entries(exerciciosHistorico).forEach(([exId, historico]) => {
      if (historico.length === 0) return;
      const melhor = historico.reduce((prev, current) => 
        current.peso > prev.peso ? current : prev
      );
      prs[exId] = melhor;
    });
    return prs;
  };

  // Calcular progressão geral (média de evolução de todos exercícios)
  const calcularProgressaoGeral = () => {
    const progressoes = [];
    Object.entries(exerciciosHistorico).forEach(([exId, historico]) => {
      if (historico.length < 2) return;
      const primeira = historico[0].peso;
      const ultima = historico[historico.length - 1].peso;
      const pct = ((ultima - primeira) / primeira * 100).toFixed(1);
      progressoes.push({ exId, pct: parseFloat(pct) });
    });
    if (progressoes.length === 0) return 0;
    return (progressoes.reduce((a, b) => a + b.pct, 0) / progressoes.length).toFixed(1);
  };

  // Calcular frequência de treino
  const calcularFrequencia = () => {
    const datasComTreino = Object.entries(allData || {}).filter(([_, dayData]) => {
      return dayData && dayData.ex && Object.values(dayData.ex).some(ex => ex.done);
    }).length;
    return datasComTreino;
  };

  // Extrair notas de treino
  const notasDisponibles = Object.entries(allData || {}).filter(([_, dayData]) => dayData && dayData.notes).map(([dataISO, dayData]) => {
    const [ano, mes, dia] = dataISO.split('-');
    const dataBR = `${dia}/${mes}/${ano}`;
    return { data: dataBR, nota: dayData.notes };
  });

  const prs = calcularPRs();
  const progressaoGeral = calcularProgressaoGeral();
  const frequencia = calcularFrequencia();
  const csCard = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    color: '#e5e7eb',
  };

  const extrairDadosPDF = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textoCompleto = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + '\n';
      }
      const datas = textoCompleto.match(/(\d{2}\/\d{2}\/\d{4})/g);
      const peso = textoCompleto.match(/Peso\s*(?:atual)?\s*\(?Kg\)?\s*(\d+\.?\d*)/i);
      const gordura = textoCompleto.match(/Percentual de Gordura\s*\(%\)\s*(\d+\.?\d*)/i);
      const massaGordura = textoCompleto.match(/Massa de gordura\s*\(Kg\)\s*(\d+\.?\d*)/i);
      const massaLivre = textoCompleto.match(/Massa livre de gordura\s*\(Kg\)\s*(\d+\.?\d*)/i);
      const cmb = textoCompleto.match(/Circ\.\s*Musc\.\s*do Braço.*?\(CMB\).*?\(cm\)\s*(\d+\.?\d*)/is);
      const cintura = textoCompleto.match(/Circunferência da Cintura\s*\(cm\)\s*(\d+\.?\d*)/i);
      const quadril = textoCompleto.match(/Circunferência do Quadril\s*\(cm\)\s*(\d+\.?\d*)/i);
      const abdomen = textoCompleto.match(/Circunferência do Abdomen\s*\(cm\)\s*(\d+\.?\d*)/i);
      return {
        sucesso: true,
        dados: {
          data: datas ? datas[datas.length - 1] : new Date().toLocaleDateString('pt-BR'),
          peso: peso ? parseFloat(peso[1]) : null,
          percentualGordura: gordura ? parseFloat(gordura[1]) : null,
          massaGordura: massaGordura ? parseFloat(massaGordura[1]) : null,
          massaLivre: massaLivre ? parseFloat(massaLivre[1]) : null,
          cmb: cmb ? parseFloat(cmb[1]) : null,
          cintura: cintura ? parseFloat(cintura[1]) : null,
          quadril: quadril ? parseFloat(quadril[1]) : null,
          abdomen: abdomen ? parseFloat(abdomen[1]) : null,
        }
      };
    } catch (erro) {
      return { sucesso: false, erro: erro.message };
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArquivo(file);
    setLoading(true);
    setMensagem('');
    const resultado = await extrairDadosPDF(file);
    if (resultado.sucesso) {
      const novosId = Math.max(...avaliacoes.map(a => a.id), 0) + 1;
      setNovaAvaliacao({ id: novosId, ...resultado.dados });
      setMensagem('✓ Dados extraídos!');
    } else {
      setMensagem('❌ Erro ao extrair: ' + resultado.erro);
    }
    setLoading(false);
  };

  const confirmarAvaliacao = () => {
    if (!novaAvaliacao) return;
    const novasAvaliacoes = [...avaliacoes, novaAvaliacao].sort((a, b) => {
      const [d1, m1, a1] = a.data.split('/').map(Number);
      const [d2, m2, a2] = b.data.split('/').map(Number);
      return new Date(a1, m1 - 1, d1) - new Date(a2, m2 - 1, d2);
    });
    setAvaliacoes(novasAvaliacoes);
    setNovaAvaliacao(null);
    setArquivo(null);
    setMensagem('✓ Avaliação adicionada!');
    setTimeout(() => setMensagem(''), 2000);
  };

  const adicionarMeta = (exId, valor) => {
    setMetasExercicios({ ...metasExercicios, [exId]: parseFloat(valor) });
    setNovaMetaEx(null);
    setNovaMetaValor('');
  };

  const dadosGrafico = avaliacoes.map(av => ({
    data: av.data,
    peso: av.peso,
    gordura: av.percentualGordura,
    muscular: av.massaLivre,
    massaGordura: av.massaGordura,
  }));

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { id: 'composicao', label: '📊 Composição' },
          { id: 'progressao', label: '📈 Progressão' },
          { id: 'exercicios', label: '💪 Exercícios' },
          { id: 'metas', label: '🎯 Metas' },
          { id: 'notas', label: '📝 Notas' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: 'none',
              background: tab === t.id ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: tab === t.id ? '#10b981' : '#6b7280',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: COMPOSIÇÃO */}
      {tab === 'composicao' && (
        <>
          <div style={{ ...csCard, marginBottom: 20, borderColor: 'rgba(16,185,129,0.2)', borderWidth: 2 }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <input type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: 'none' }} disabled={loading} />
              <div style={{ fontSize: 24 }}>{loading ? '⏳' : '📄'}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                {loading ? 'Processando...' : 'Clique para fazer upload de PDF'}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Avaliação de bioimpedância</div>
              {arquivo && <div style={{ fontSize: 11, color: '#10b981' }}>✓ {arquivo.name}</div>}
            </label>
          </div>

          {mensagem && (
            <div style={{ ...csCard, marginBottom: 20, color: mensagem.includes('✓') ? '#10b981' : '#ef4444', borderColor: mensagem.includes('✓') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
              {mensagem}
            </div>
          )}

          {novaAvaliacao && (
            <div style={{ ...csCard, marginBottom: 20, borderColor: 'rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Revisar dados</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
                {[
                  { l: 'Data', v: novaAvaliacao.data },
                  { l: 'Peso', v: `${novaAvaliacao.peso} kg` },
                  { l: '% Gordura', v: `${novaAvaliacao.percentualGordura}%` },
                  { l: 'Massa Livre', v: `${novaAvaliacao.massaLivre} kg` },
                ].map((item, i) => (
                  <div key={i} style={{ ...csCard, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{item.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.v || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={confirmarAvaliacao}
                  style={{ flex: 1, padding: '10px 14px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  ✓ Confirmar
                </button>
                <button onClick={() => { setNovaAvaliacao(null); setArquivo(null); }}
                  style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: '#9ca3af', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  ✕ Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {avaliacoes.length >= 2 && [
              { label: 'Peso Ganho', value: `${(avaliacoes[avaliacoes.length - 1].peso - avaliacoes[0].peso).toFixed(2)} kg`, color: '#6b7280' },
              { label: 'Músculo', value: `${(avaliacoes[avaliacoes.length - 1].massaLivre - avaliacoes[0].massaLivre).toFixed(2)} kg`, color: '#10b981' },
              { label: 'Gordura', value: `${(avaliacoes[avaliacoes.length - 1].massaGordura - avaliacoes[0].massaGordura).toFixed(2)} kg`, color: '#f97316' },
              { label: '% BF', value: `${avaliacoes[avaliacoes.length - 1].percentualGordura}%`, color: '#0ea5e9' },
            ].map((s, i) => (
              <div key={i} style={{ ...csCard }}>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { title: 'Peso', dataKey: 'peso', color: '#10b981' },
              { title: '% Gordura', dataKey: 'gordura', color: '#f97316' },
              { title: 'Composição', isBars: true },
              { title: 'Cintura', dataKey: 'cintura', color: '#6366f1', data: avaliacoes.map(av => ({ data: av.data, cintura: av.cintura })) },
            ].map((chart, i) => (
              <div key={i} style={{ ...csCard }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>{chart.title}</div>
                <ResponsiveContainer width="100%" height={200}>
                  {chart.isBars ? (
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="data" stroke="#6b7280" style={{ fontSize: 11 }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6 }} />
                      <Bar dataKey="muscular" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="massaGordura" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={chart.data || dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="data" stroke="#6b7280" style={{ fontSize: 11 }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6 }} />
                      <Line type="monotone" dataKey={chart.dataKey || 'cintura'} stroke={chart.color} strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TAB: PROGRESSÃO GERAL */}
      {tab === 'progressao' && (
        <>
          <div style={{ ...csCard, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📈 Progressão Geral de Força</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Evolução Média</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>+{progressaoGeral}%</div>
                <div style={{ fontSize: 10, color: '#10b981', marginTop: 4 }}>de todos os exercícios</div>
              </div>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Exercícios Rastreados</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>{Object.keys(exerciciosHistorico).length}</div>
                <div style={{ fontSize: 10, color: '#6366f1', marginTop: 4 }}>com histórico de peso</div>
              </div>
              <div style={{ padding: 16, borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Dias de Treino</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{frequencia}</div>
                <div style={{ fontSize: 10, color: '#3b82f6', marginTop: 4 }}>últimas 8 semanas</div>
              </div>
            </div>
          </div>

          <div style={{ ...csCard }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Progresso de Todos os Exercícios</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(exerciciosHistorico).map(([exId, historico]) => {
                if (historico.length < 2) return null;
                const primeira = historico[0].peso;
                const ultima = historico[historico.length - 1].peso;
                const pct = ((ultima - primeira) / primeira * 100).toFixed(1);
                return (
                  <div key={exId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{EXERCICIOS_NOMES[exId] || exId}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{primeira}kg → {ultima}kg</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: pct > 0 ? '#10b981' : '#ef4444' }}>
                      {pct > 0 ? '+' : ''}{pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* TAB: EXERCÍCIOS */}
      {tab === 'exercicios' && (
        <>
          {Object.keys(exerciciosHistorico).length === 0 ? (
            <div style={{ ...csCard, textAlign: 'center', padding: 30 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>📊 Nenhum exercício com peso registrado</div>
              <div style={{ fontSize: 12, color: '#4b5563' }}>Preencha o peso dos exercícios no tab "Treino"!</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Selecione um exercício:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                  {Object.entries(exerciciosHistorico).map(([exId, historico]) => (
                    <button key={exId} onClick={() => setExercicioSelecionado(exId)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: exercicioSelecionado === exId ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)',
                        color: exercicioSelecionado === exId ? '#fff' : '#9ca3af',
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}>
                      <div style={{ textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {EXERCICIOS_NOMES[exId] || exId}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                        {Math.max(...historico.map(h => h.peso))}kg
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {exercicioSelecionado && exerciciosHistorico[exercicioSelecionado] && (
                <>
                  <div style={{ ...csCard, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Evolução: {(EXERCICIOS_NOMES[exercicioSelecionado] || exercicioSelecionado).toUpperCase()}</div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={exerciciosHistorico[exercicioSelecionado]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="data" stroke="#6b7280" style={{ fontSize: 11 }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: 11 }} label={{ value: 'kg', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6 }} formatter={(value) => `${value} kg`} />
                        <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 6 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...csCard }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Histórico de Pesos</div>
                    <table style={{ width: '100%', fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 0', color: '#6b7280', fontWeight: 500 }}>Data</th>
                          <th style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280', fontWeight: 500 }}>Peso (kg)</th>
                          <th style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280', fontWeight: 500 }}>Evolução</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exerciciosHistorico[exercicioSelecionado].map((hist, idx) => {
                          const anterior = idx > 0 ? exerciciosHistorico[exercicioSelecionado][idx - 1].peso : null;
                          const evolucao = anterior ? `+${(hist.peso - anterior).toFixed(1)} kg` : '—';
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 0' }}>{hist.data}</td>
                              <td style={{ textAlign: 'right', padding: '8px 0', color: '#10b981', fontWeight: 600 }}>{hist.peso}</td>
                              <td style={{ textAlign: 'right', padding: '8px 0', color: evolucao.includes('-') ? '#ef4444' : '#10b981', fontWeight: 600 }}>{evolucao}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* TAB: METAS */}
      {tab === 'metas' && (
        <>
          <div style={{ ...csCard, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>🎯 Suas Metas de Exercícios</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(exerciciosHistorico).map(([exId, historico]) => {
                if (historico.length === 0) return null;
                const atual = historico[historico.length - 1].peso;
                const meta = metasExercicios[exId];
                const progresso = meta ? ((atual / meta) * 100).toFixed(0) : 0;
                return (
                  <div key={exId} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{EXERCICIOS_NOMES[exId] || exId}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Atual: <span style={{ color: '#10b981', fontWeight: 600 }}>{atual}kg</span></div>
                      </div>
                      {meta ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>Meta: {meta}kg</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0ea5e9', marginTop: 2 }}>{progresso}%</div>
                        </div>
                      ) : (
                        <button onClick={() => setNovaMetaEx(exId)}
                          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          + Meta
                        </button>
                      )}
                    </div>
                    {meta && (
                      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
                        <div style={{ width: `${Math.min(progresso, 100)}%`, height: '100%', background: progresso >= 100 ? '#10b981' : '#0ea5e9', transition: 'width 0.3s' }} />
                      </div>
                    )}
                    {novaMetaEx === exId && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <input type="number" placeholder="Meta (kg)" value={novaMetaValor}
                          onChange={(e) => setNovaMetaValor(e.target.value)}
                          style={{ flex: 1, padding: '6px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#e5e7eb', fontSize: 11, outline: 'none' }} />
                        <button onClick={() => adicionarMeta(exId, novaMetaValor)}
                          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          ✓
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...csCard }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>💪 Melhor Série (PRs)</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {Object.entries(prs).map(([exId, pr]) => (
                <div key={exId} style={{ padding: 10, background: 'rgba(251,191,36,0.1)', borderRadius: 8, borderLeft: '3px solid #fbbf24' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>🏆 {EXERCICIOS_NOMES[exId] || exId}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{pr.data}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>{pr.peso}kg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* TAB: NOTAS */}
      {tab === 'notas' && (
        <>
          <div style={{ ...csCard }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>📝 Anotações de Treino</div>
            {notasDisponibles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                <div style={{ fontSize: 14, marginBottom: 8 }}>Nenhuma anotação registrada</div>
                <div style={{ fontSize: 12 }}>Adicione notas no tab "Dia" durante seus treinos!</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {notasDisponibles.slice().reverse().map((item, idx) => (
                  <div key={idx} style={{ padding: 12, background: 'rgba(59,130,246,0.1)', borderRadius: 8, borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>📅 {item.data}</div>
                    <div style={{ fontSize: 12, color: '#e5e7eb', lineHeight: 1.5 }}>{item.nota}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
