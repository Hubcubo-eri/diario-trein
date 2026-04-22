import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Loader } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { WORKOUTS } from './data';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Criar mapa de ID -> Nome do exercício
const criarMapaExercicios = () => {
  const mapa = {};
  Object.values(WORKOUTS).forEach(workout => {
    workout.sections.forEach(section => {
      section.exercises.forEach(ex => {
        mapa[ex.id] = ex.name;
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
  const [tab, setTab] = useState('composicao'); // 'composicao', 'exercicios', 'refeicoes'
  const [exercicioSelecionado, setExercicioSelecionado] = useState(null);
  
  // Extrair histórico de exercícios do allData
  const [exerciciosHistorico, setExerciciosHistorico] = useState(() => {
    const historico = {};
    
    // Iterar por todas as datas no allData
    Object.entries(allData || {}).forEach(([dataISO, dayData]) => {
      if (!dayData || !dayData.ex) return;
      
      // Converter ISO date pra formato BR (2026-04-22 -> 22/04/2026)
      const [ano, mes, dia] = dataISO.split('-');
      const dataBR = `${dia}/${mes}/${ano}`;
      
      // Iterar por cada exercício do dia
      Object.entries(dayData.ex).forEach(([exId, exData]) => {
        if (!exData.w || exData.w === '') return; // Pula se não tem peso
        
        // Inicializa array se não existe
        if (!historico[exId]) {
          historico[exId] = [];
        }
        
        // Adiciona ao histórico
        historico[exId].push({
          data: dataBR,
          dataISO: dataISO,
          peso: parseFloat(exData.w),
          done: exData.done || false
        });
      });
    });
    
    // Ordenar cada exercício por data
    Object.keys(historico).forEach(exId => {
      historico[exId].sort((a, b) => {
        const [da, ma, aa] = a.dataISO.split('-').map(Number);
        const [db, mb, ab] = b.dataISO.split('-').map(Number);
        return new Date(aa, ma - 1, da) - new Date(ab, mb - 1, db);
      });
    });
    
    return historico;
  });

  // Tracker de refeições (por dia)
  const [refeicoesTracker, setRefeicoesTracker] = useState(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    return {
      [hoje]: {
        'cafe': { feita: true },
        'colacao': { feita: true },
        'almoco': { feita: true },
        'lanche': { feita: false },
        'janta': { feita: true },
      }
    };
  });

  const calcularEstatisticas = () => {
    if (avaliacoes.length < 2) return null;
    const primeira = avaliacoes[0];
    const ultima = avaliacoes[avaliacoes.length - 1];
    const parseData = (str) => {
      const [d, m, a] = str.split('/').map(Number);
      return new Date(a, m - 1, d);
    };
    const dias = Math.round((parseData(ultima.data) - parseData(primeira.data)) / (1000 * 60 * 60 * 24));
    return {
      pesoGanho: (ultima.peso - primeira.peso).toFixed(2),
      gorduraGanha: (ultima.massaGordura - primeira.massaGordura).toFixed(2),
      musculoGanho: (ultima.massaLivre - primeira.massaLivre).toFixed(2),
      percentualGorduraVariacao: (ultima.percentualGordura - primeira.percentualGordura).toFixed(2),
      dias,
    };
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

  const confirmarAvaliacao = async () => {
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

  const toggleRefeicao = (data, refeicao) => {
    setRefeicoesTracker(prev => ({
      ...prev,
      [data]: {
        ...prev[data],
        [refeicao]: { ...prev[data]?.[refeicao], feita: !prev[data]?.[refeicao]?.feita }
      }
    }));
  };

  const stats = calcularEstatisticas();
  const dadosGrafico = avaliacoes.map(av => ({
    data: av.data,
    peso: av.peso,
    gordura: av.percentualGordura,
    muscular: av.massaLivre,
    massaGordura: av.massaGordura,
  }));

  const csCard = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    color: '#e5e7eb',
  };

  const refeicoes = [
    { id: 'cafe', label: 'Café', emoji: '☕' },
    { id: 'colacao', label: 'Colação', emoji: '🥤' },
    { id: 'almoco', label: 'Almoço', emoji: '🍽️' },
    { id: 'lanche', label: 'Lanche', emoji: '🥗' },
    { id: 'janta', label: 'Janta', emoji: '🍜' },
  ];

  const hoje = new Date().toISOString().slice(0, 10);
  const refeicoesHoje = refeicoesTracker[hoje] || {};

  return (
    <div style={{ maxWidth: 1000 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
        {[
          { id: 'composicao', label: '📊 Composição', icon: '📊' },
          { id: 'exercicios', label: '💪 Exercícios', icon: '💪' },
          { id: 'refeicoes', label: '🥗 Refeições', icon: '🥗' }
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
              transition: 'all 0.2s'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: COMPOSIÇÃO CORPORAL */}
      {tab === 'composicao' && (
        <>
          {/* Upload */}
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

          {/* Mensagem */}
          {mensagem && (
            <div style={{ ...csCard, marginBottom: 20, color: mensagem.includes('✓') ? '#10b981' : '#ef4444', borderColor: mensagem.includes('✓') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}>
              {mensagem}
            </div>
          )}

          {/* Preview de Nova Avaliação */}
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

          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Peso Ganho', value: `${stats.pesoGanho} kg`, color: '#6b7280' },
                { label: 'Músculo', value: `${stats.musculoGanho} kg`, color: '#10b981' },
                { label: 'Gordura', value: `${stats.gorduraGanha} kg`, color: '#f97316' },
                { label: '% BF', value: `${avaliacoes[avaliacoes.length - 1].percentualGordura}%`, color: '#0ea5e9' },
              ].map((s, i) => (
                <div key={i} style={{ ...csCard }}>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>em {stats.dias} dias</div>
                </div>
              ))}
            </div>
          )}

          {/* Gráficos */}
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

          {/* Tabela */}
          <div style={{ ...csCard, overflowX: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Histórico</div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Data', 'Peso', '% Gordura', 'Massa Livre', 'CMB', 'Cintura'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 0', color: '#6b7280', fontWeight: 500, borderRight: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {avaliacoes.map(av => (
                  <tr key={av.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 0', borderRight: '1px solid rgba(255,255,255,0.06)' }}>{av.data}</td>
                    <td style={{ padding: '8px 0', borderRight: '1px solid rgba(255,255,255,0.06)', color: '#10b981', fontWeight: 600 }}>{av.peso}</td>
                    <td style={{ padding: '8px 0', borderRight: '1px solid rgba(255,255,255,0.06)', color: '#f97316', fontWeight: 600 }}>{av.percentualGordura}%</td>
                    <td style={{ padding: '8px 0', borderRight: '1px solid rgba(255,255,255,0.06)', color: '#10b981' }}>{av.massaLivre}</td>
                    <td style={{ padding: '8px 0', borderRight: '1px solid rgba(255,255,255,0.06)' }}>{av.cmb}</td>
                    <td style={{ padding: '8px 0' }}>{av.cintura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB: EVOLUÇÃO DE EXERCÍCIOS */}
      {tab === 'exercicios' && (
        <>
          {Object.keys(exerciciosHistorico).length === 0 ? (
            <div style={{ ...csCard, textAlign: 'center', padding: 30 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>📊 Nenhum exercício com peso registrado</div>
              <div style={{ fontSize: 12, color: '#4b5563' }}>Preencha o peso dos exercícios no tab "Treino" para ver a evolução aqui!</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Selecione um exercício:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                  {Object.entries(exerciciosHistorico).map(([exId, historico]) => (
                    <button key={exId}
                      onClick={() => setExercicioSelecionado(exId)}
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

      {/* TAB: TRACKER DE REFEIÇÕES */}
      {tab === 'refeicoes' && (
        <>
          <div style={{ ...csCard, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Refeições de Hoje ({hoje})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {refeicoes.map(ref => {
                const feita = refeicoesHoje[ref.id]?.feita || false;
                return (
                  <button key={ref.id}
                    onClick={() => toggleRefeicao(hoje, ref.id)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: 12,
                      border: '2px solid ' + (feita ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'),
                      background: feita ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{ref.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: feita ? '#10b981' : '#9ca3af', marginBottom: 8 }}>{ref.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: feita ? '#10b981' : '#ef4444' }}>
                      {feita ? '✓' : '✕'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ ...csCard }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Resumo do Dia</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {(() => {
                const total = refeicoes.length;
                const feitas = refeicoes.filter(r => refeicoesHoje[r.id]?.feita).length;
                const naoFeitas = refeicoes.filter(r => !refeicoesHoje[r.id]?.feita).length;
                const percentual = Math.round((feitas / total) * 100);
                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Refeições realizadas:</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>{feitas}/{total}</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${percentual}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>{percentual}% completo</div>
                    {naoFeitas > 0 && (
                      <div style={{ padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 8, borderLeft: '3px solid #ef4444', fontSize: 12, color: '#fca5a5' }}>
                        ⚠️ {naoFeitas} refeição{naoFeitas > 1 ? 's' : ''} não realizada{naoFeitas > 1 ? 's' : ''}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
