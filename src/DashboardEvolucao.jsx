import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Loader } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export function DashboardEvolucao({ supabaseClient, userId }) {
  const [avaliacoes, setAvaliacoes] = useState([
    {
      id: 1,
      data: '25/03/2026',
      peso: 91.75,
      percentualGordura: 16.8,
      massaLivre: 76.3,
      massaGordura: 15.4,
      cmb: 28.9,
      cintura: 94.5,
      quadril: 105,
      abdomen: 98,
    },
    {
      id: 2,
      data: '22/04/2026',
      peso: 94.8,
      percentualGordura: 16.7,
      massaLivre: 79,
      massaGordura: 15.8,
      cmb: 29.5,
      cintura: 95.8,
      quadril: 107,
      abdomen: 100,
    }
  ]);

  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [novaAvaliacao, setNovaAvaliacao] = useState(null);

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  const carregarAvaliacoes = async () => {
    if (!supabaseClient || !userId) return;
    try {
      const { data, error } = await supabaseClient
        .from('avaliacoes')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: true });
      
      if (error) throw error;
      if (data && data.length > 0) setAvaliacoes(data);
    } catch (err) {
      console.log('Usando dados locais (Supabase não configurado)');
    }
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

    if (supabaseClient && userId) {
      try {
        const { error } = await supabaseClient
          .from('avaliacoes')
          .insert([{ user_id: userId, ...novaAvaliacao }]);
        
        if (error) throw error;
      } catch (err) {
        console.log('Erro ao salvar no Supabase, salvando localmente');
      }
    }

    setAvaliacoes(novasAvaliacoes);
    setNovaAvaliacao(null);
    setArquivo(null);
    setMensagem('✓ Avaliação adicionada!');
    setTimeout(() => setMensagem(''), 2000);
  };

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

  return (
    <div style={{ maxWidth: 1000 }}>
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
    </div>
  );
}
