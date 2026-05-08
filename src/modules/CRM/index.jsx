import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://debexbvujauikjosmtqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYmV4YnZ1amF1aWtqb3NtdHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMjIzNjQsImV4cCI6MjA2MDU5ODM2NH0.D1yDHNFFiFMy6DkNFhLiUWMFMJAFJKFJ0B3fxGEOWK0'
);

function haptic(s='light'){if(window.navigator?.vibrate)window.navigator.vibrate(s==='light'?10:20);}
function fmt(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function fmtPhone(p){if(!p)return '';const d=p.replace(/\D/g,'');if(d.length===11)return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;if(d.length===10)return`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return p;}

const STAGE_COLORS = {
  lead:'#6b7280', contato:'#0ea5e9', proposta:'#f59e0b',
  negociacao:'#8b5cf6', fechado:'#10b981', perdido:'#ef4444',
};
const STAGE_LABELS = {
  lead:'Lead', contato:'Contato', proposta:'Proposta',
  negociacao:'Negociação', fechado:'Fechado', perdido:'Perdido',
};
const ORIGENS = ['ligacao','indicacao','instagram','outro'];
const ORIGEM_LABELS = {ligacao:'Ligação',indicacao:'Indicação',instagram:'Instagram',outro:'Outro'};
const SERVICOS = ['BPO Financeiro','Contabilidade','Departamento Pessoal','Planejamento Tributário','Consultoria'];
const ATIV_TIPOS = {ligacao:'📞 Ligação',reuniao:'🤝 Reunião',whatsapp:'💬 WhatsApp',email:'📧 E-mail',followup:'🔁 Follow-up'};
const ATIV_RESULTADOS = {sem_resposta:'Sem resposta',interessado:'Interessado',nao_interessado:'Não interessado',agendou_reuniao:'Agendou reunião',proposta_enviada:'Proposta enviada',fechado:'Fechado',outro:'Outro'};

const cs={background:'rgba(255,255,255,0.03)',borderRadius:14,padding:'14px 16px',border:'1px solid rgba(255,255,255,0.05)'};
const inputStyle={width:'100%',padding:'11px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,color:'#f9fafb',fontSize:14,outline:'none',boxSizing:'border-box'};

// ─── Sheet base ──────────────────────────────────────────────────────────
function Sheet({title,onClose,children}){
  return(
    <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'flex-end'}} onClick={onClose}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)'}}/>
      <div style={{position:'relative',width:'100%',maxWidth:480,margin:'0 auto',background:'#111118',borderRadius:'24px 24px 0 0',padding:'24px 20px 48px',border:'1px solid rgba(255,255,255,0.08)',maxHeight:'92vh',overflowY:'auto'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:'rgba(255,255,255,0.15)',borderRadius:2,margin:'0 auto 20px'}}/>
        {title&&<div style={{fontSize:16,fontWeight:700,color:'#f9fafb',marginBottom:20}}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

function SaveBtn({label,disabled,onClick}){
  return(
    <button onClick={onClick} disabled={disabled}
      style={{width:'100%',padding:'14px 0',borderRadius:12,border:'none',background:disabled?'rgba(255,255,255,0.06)':'linear-gradient(135deg,#10b981,#059669)',color:disabled?'#4b5563':'#fff',fontSize:14,fontWeight:700,cursor:disabled?'default':'pointer',marginTop:8,boxShadow:disabled?'none':'0 4px 20px rgba(16,185,129,0.3)'}}>
      {label}
    </button>
  );
}

// ─── Modal Lead ──────────────────────────────────────────────────────────
function LeadModal({lead,funis,onSave,onClose,onDelete}){
  const[form,setForm]=useState(lead||{nome:'',clinica:'',telefone:'',email:'',cidade:'Maceió',especialidade:'',servico:'Contabilidade',status:'lead',valor_mensal:'',origem:'ligacao',observacoes:'',funil_id:funis[0]?.id||''});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <Sheet title={lead?'Editar lead':'Novo lead'} onClose={onClose}>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <input placeholder="Nome do contato" value={form.nome} onChange={e=>set('nome',e.target.value)} style={inputStyle}/>
        <input placeholder="Clínica / Empresa" value={form.clinica} onChange={e=>set('clinica',e.target.value)} style={inputStyle}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <input placeholder="Telefone" value={form.telefone||''} onChange={e=>set('telefone',e.target.value)} style={inputStyle}/>
          <input placeholder="Cidade" value={form.cidade||''} onChange={e=>set('cidade',e.target.value)} style={inputStyle}/>
        </div>
        <input placeholder="Email" value={form.email||''} onChange={e=>set('email',e.target.value)} style={inputStyle}/>
        <input placeholder="Especialidade" value={form.especialidade||''} onChange={e=>set('especialidade',e.target.value)} style={inputStyle}/>

        <div>
          <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>Serviço</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {SERVICOS.map(s=>(
              <button key={s} onClick={()=>set('servico',s)}
                style={{padding:'6px 10px',borderRadius:16,border:`1px solid ${form.servico===s?'#10b981':'rgba(255,255,255,0.08)'}`,background:form.servico===s?'rgba(16,185,129,0.1)':'transparent',color:form.servico===s?'#10b981':'#9ca3af',fontSize:11,fontWeight:500,cursor:'pointer'}}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Etapa</div>
            <select value={form.status} onChange={e=>set('status',e.target.value)}
              style={{...inputStyle,fontSize:13}}>
              {Object.entries(STAGE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Origem</div>
            <select value={form.origem||'ligacao'} onChange={e=>set('origem',e.target.value)}
              style={{...inputStyle,fontSize:13}}>
              {ORIGENS.map(o=><option key={o} value={o}>{ORIGEM_LABELS[o]}</option>)}
            </select>
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Funil</div>
            <select value={form.funil_id||''} onChange={e=>set('funil_id',e.target.value)}
              style={{...inputStyle,fontSize:13}}>
              <option value=''>Sem funil</option>
              {funis.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Valor mensal</div>
            <input type="number" placeholder="R$" value={form.valor_mensal||''} onChange={e=>set('valor_mensal',e.target.value)} style={inputStyle}/>
          </div>
        </div>

        <textarea placeholder="Observações..." value={form.observacoes||''} onChange={e=>set('observacoes',e.target.value)} rows={2}
          style={{...inputStyle,resize:'none',lineHeight:1.5}}/>

        <div style={{display:'flex',gap:8,marginTop:4}}>
          {lead&&<button onClick={()=>onDelete(lead.id)} style={{width:44,height:44,borderRadius:12,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',color:'#ef4444',fontSize:16,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>🗑</button>}
          <button onClick={onClose} style={{flex:1,padding:'13px 0',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'#9ca3af',fontSize:14,fontWeight:600,cursor:'pointer'}}>Cancelar</button>
          <button onClick={()=>{if(form.nome.trim()){haptic('medium');onSave(form);}}}
            style={{flex:2,padding:'13px 0',borderRadius:12,border:'none',background:form.nome.trim()?'linear-gradient(135deg,#10b981,#059669)':'rgba(255,255,255,0.06)',color:form.nome.trim()?'#fff':'#4b5563',fontSize:14,fontWeight:700,cursor:form.nome.trim()?'pointer':'default'}}>
            {lead?'Salvar':'Criar lead'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

// ─── Modal Atividade ──────────────────────────────────────────────────────
function AtivModal({leadId,onSave,onClose}){
  const[form,setForm]=useState({lead_id:leadId,tipo:'ligacao',descricao:'',resultado:'sem_resposta',data_hora:new Date().toISOString().slice(0,16),duracao_min:0});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <Sheet title="Registrar atividade" onClose={onClose}>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div>
          <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>Tipo</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {Object.entries(ATIV_TIPOS).map(([k,v])=>(
              <button key={k} onClick={()=>set('tipo',k)}
                style={{padding:'6px 12px',borderRadius:16,border:`1px solid ${form.tipo===k?'#10b981':'rgba(255,255,255,0.08)'}`,background:form.tipo===k?'rgba(16,185,129,0.1)':'transparent',color:form.tipo===k?'#10b981':'#9ca3af',fontSize:12,cursor:'pointer'}}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <textarea placeholder="Descrição do contato..." value={form.descricao} onChange={e=>set('descricao',e.target.value)} rows={3}
          style={{...inputStyle,resize:'none',lineHeight:1.5}}/>
        <div>
          <div style={{fontSize:11,color:'#6b7280',marginBottom:6}}>Resultado</div>
          <select value={form.resultado} onChange={e=>set('resultado',e.target.value)} style={{...inputStyle,fontSize:13}}>
            {Object.entries(ATIV_RESULTADOS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Data/hora</div>
            <input type="datetime-local" value={form.data_hora} onChange={e=>set('data_hora',e.target.value)} style={{...inputStyle,fontSize:12}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Duração (min)</div>
            <input type="number" value={form.duracao_min} onChange={e=>set('duracao_min',parseInt(e.target.value)||0)} style={inputStyle}/>
          </div>
        </div>
        <SaveBtn label="Registrar" disabled={!form.descricao.trim()} onClick={()=>{haptic('medium');onSave(form);}}/>
      </div>
    </Sheet>
  );
}

// ─── Perfil do Lead ───────────────────────────────────────────────────────
function LeadProfile({lead,funis,onBack,onUpdate,onDelete}){
  const[atividades,setAtividades]=useState([]);
  const[tarefas,setTarefas]=useState([]);
  const[showAtivModal,setShowAtivModal]=useState(false);
  const[showEditModal,setShowEditModal]=useState(false);
  const[novaTarefa,setNovaTarefa]=useState('');
  const[loading,setLoading]=useState(true);

  useEffect(()=>{loadData();},[lead.id]);

  async function loadData(){
    setLoading(true);
    const[{data:a},{data:t}]=await Promise.all([
      supabase.from('atividades').select('*').eq('lead_id',lead.id).order('data_hora',{ascending:false}),
      supabase.from('tarefas').select('*').eq('lead_id',lead.id).order('created_at',{ascending:false}),
    ]);
    setAtividades(a||[]);
    setTarefas(t||[]);
    setLoading(false);
  }

  async function saveAtiv(form){
    await supabase.from('atividades').insert(form);
    setShowAtivModal(false);
    loadData();
  }

  async function criarTarefa(){
    if(!novaTarefa.trim())return;
    haptic('medium');
    await supabase.from('tarefas').insert({lead_id:lead.id,descricao:novaTarefa.trim(),concluida:false});
    setNovaTarefa('');
    loadData();
  }

  async function toggleTarefa(t){
    haptic('light');
    await supabase.from('tarefas').update({concluida:!t.concluida}).eq('id',t.id);
    loadData();
  }

  async function moverEtapa(novoStatus){
    haptic('medium');
    await supabase.from('leads').update({status:novoStatus,updated_at:new Date()}).eq('id',lead.id);
    onUpdate({...lead,status:novoStatus});
  }

  const funil=funis.find(f=>f.id===lead.funil_id);
  const stageColor=STAGE_COLORS[lead.status]||'#6b7280';

  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(145deg,#0a0a0f,#111118,#0d1117)',color:'#e5e7eb',fontFamily:"'DM Sans',sans-serif"}}>
      {showAtivModal&&<AtivModal leadId={lead.id} onSave={saveAtiv} onClose={()=>setShowAtivModal(false)}/>}
      {showEditModal&&<LeadModal lead={lead} funis={funis} onSave={async(f)=>{await supabase.from('leads').update({...f,updated_at:new Date()}).eq('id',f.id);setShowEditModal(false);onUpdate(f);}} onClose={()=>setShowEditModal(false)} onDelete={onDelete}/>}

      {/* Header */}
      <div style={{padding:'20px 20px 0',position:'sticky',top:0,zIndex:10,background:'rgba(10,10,15,0.95)',backdropFilter:'blur(16px)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <button onClick={onBack} style={{background:'none',border:'none',color:'#10b981',fontSize:20,cursor:'pointer',padding:'0 4px 0 0'}}>←</button>
          <div style={{display:'flex',gap:8}}>
            {lead.telefone&&(
              <a href={`https://wa.me/55${lead.telefone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                style={{width:36,height:36,borderRadius:10,background:'rgba(37,211,102,0.15)',border:'1px solid rgba(37,211,102,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,textDecoration:'none'}}>💬</a>
            )}
            <button onClick={()=>setShowEditModal(true)}
              style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,0.06)',border:'none',color:'#9ca3af',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✏️</button>
          </div>
        </div>
      </div>

      <div style={{padding:'0 20px 100px'}}>
        {/* Info principal */}
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <div style={{fontSize:22,fontWeight:700,color:'#f9fafb'}}>{lead.nome}</div>
            <span style={{fontSize:11,fontWeight:700,color:stageColor,background:`${stageColor}20`,padding:'2px 10px',borderRadius:20,border:`1px solid ${stageColor}40`}}>{STAGE_LABELS[lead.status]}</span>
          </div>
          <div style={{fontSize:14,color:'#9ca3af',marginBottom:8}}>{lead.clinica}</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {lead.servico&&<span style={{fontSize:11,background:'rgba(16,185,129,0.1)',color:'#10b981',padding:'3px 10px',borderRadius:12}}>{lead.servico}</span>}
            {funil&&<span style={{fontSize:11,background:'rgba(255,255,255,0.06)',color:'#9ca3af',padding:'3px 10px',borderRadius:12}}>📊 {funil.nome}</span>}
            {lead.valor_mensal>0&&<span style={{fontSize:11,background:'rgba(245,158,11,0.1)',color:'#f59e0b',padding:'3px 10px',borderRadius:12}}>💰 {fmt(lead.valor_mensal)}/mês</span>}
          </div>
        </div>

        {/* Contato */}
        <div style={{...cs,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:'#10b981',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Contato</div>
          {lead.telefone&&<div style={{fontSize:13,color:'#e5e7eb',marginBottom:6}}>📱 {fmtPhone(lead.telefone)}</div>}
          {lead.email&&<div style={{fontSize:13,color:'#e5e7eb',marginBottom:6}}>📧 {lead.email}</div>}
          {lead.cidade&&<div style={{fontSize:13,color:'#9ca3af'}}>📍 {lead.cidade}</div>}
        </div>

        {/* Mover etapa */}
        <div style={{...cs,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:'#10b981',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>Mover etapa</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {Object.entries(STAGE_LABELS).map(([k,v])=>(
              <button key={k} onClick={()=>moverEtapa(k)}
                style={{padding:'6px 12px',borderRadius:16,border:`1px solid ${lead.status===k?STAGE_COLORS[k]:'rgba(255,255,255,0.08)'}`,background:lead.status===k?`${STAGE_COLORS[k]}20`:'transparent',color:lead.status===k?STAGE_COLORS[k]:'#6b7280',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Observações */}
        {lead.observacoes&&(
          <div style={{...cs,marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:'#10b981',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Observações</div>
            <div style={{fontSize:13,color:'#9ca3af',lineHeight:1.6}}>{lead.observacoes}</div>
          </div>
        )}

        {/* Tarefas */}
        <div style={{...cs,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:'#10b981',textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>Tarefas</div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <input placeholder="Nova tarefa..." value={novaTarefa} onChange={e=>setNovaTarefa(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')criarTarefa();}}
              style={{flex:1,padding:'8px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,color:'#f9fafb',fontSize:13,outline:'none'}}/>
            <button onClick={criarTarefa}
              style={{width:34,height:34,borderRadius:8,border:'none',background:'#10b981',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
          </div>
          {tarefas.map(t=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <button onClick={()=>toggleTarefa(t)}
                style={{width:20,height:20,borderRadius:6,border:`2px solid ${t.concluida?'#10b981':'rgba(255,255,255,0.2)'}`,background:t.concluida?'#10b981':'transparent',color:'#fff',fontSize:11,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {t.concluida?'✓':''}
              </button>
              <span style={{fontSize:13,color:t.concluida?'#4b5563':'#e5e7eb',textDecoration:t.concluida?'line-through':'none'}}>{t.descricao}</span>
            </div>
          ))}
          {tarefas.length===0&&<div style={{fontSize:12,color:'#4b5563'}}>Nenhuma tarefa</div>}
        </div>

        {/* Atividades */}
        <div style={{...cs}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:700,color:'#10b981',textTransform:'uppercase',letterSpacing:1}}>Atividades</div>
            <button onClick={()=>setShowAtivModal(true)}
              style={{padding:'5px 12px',borderRadius:16,border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.08)',color:'#10b981',fontSize:11,fontWeight:600,cursor:'pointer'}}>+ Registrar</button>
          </div>
          {loading&&<div style={{fontSize:12,color:'#4b5563'}}>Carregando...</div>}
          {!loading&&atividades.length===0&&<div style={{fontSize:12,color:'#4b5563'}}>Nenhuma atividade registrada</div>}
          {atividades.map(a=>(
            <div key={a.id} style={{padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:13,fontWeight:600,color:'#e5e7eb'}}>{ATIV_TIPOS[a.tipo]||a.tipo}</span>
                <span style={{fontSize:10,color:'#4b5563'}}>{new Date(a.data_hora).toLocaleDateString('pt-BR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
              {a.descricao&&<div style={{fontSize:12,color:'#9ca3af',lineHeight:1.4,marginBottom:4}}>{a.descricao}</div>}
              <span style={{fontSize:10,background:'rgba(255,255,255,0.06)',color:'#6b7280',padding:'2px 8px',borderRadius:10}}>{ATIV_RESULTADOS[a.resultado]||a.resultado}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Meta ───────────────────────────────────────────────────────────
function MetaModal({meta,onSave,onClose}){
  const now=new Date();
  const[form,setForm]=useState(meta||{mes:now.getMonth()+1,ano:now.getFullYear(),bpo_fechados:0,cont_fechados:0,ligacoes_feitas:0});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <Sheet title="Registrar realizado" onClose={onClose}>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Mês</div>
            <select value={form.mes} onChange={e=>set('mes',parseInt(e.target.value))} style={{...inputStyle,fontSize:13}}>
              {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m,i)=><option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Ano</div>
            <input type="number" value={form.ano} onChange={e=>set('ano',parseInt(e.target.value))} style={inputStyle}/>
          </div>
        </div>
        {[{k:'bpo_fechados',l:'BPO fechados'},{k:'cont_fechados',l:'Contabilidade fechados'},{k:'ligacoes_feitas',l:'Ligações feitas'}].map(f=>(
          <div key={f.k}>
            <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{f.l}</div>
            <input type="number" value={form[f.k]} onChange={e=>set(f.k,parseInt(e.target.value)||0)} style={inputStyle}/>
          </div>
        ))}
        <SaveBtn label="Salvar realizado" disabled={false} onClick={()=>{haptic('medium');onSave(form);}}/>
      </div>
    </Sheet>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────
export default function CRM({onBack}){
  const[tab,setTab]=useState('dashboard');
  const[leads,setLeads]=useState([]);
  const[funis,setFunis]=useState([]);
  const[etapas,setEtapas]=useState([]);
  const[realizado,setRealizado]=useState([]);
  const[loading,setLoading]=useState(true);
  const[selectedFunil,setSelectedFunil]=useState(null);
  const[modal,setModal]=useState(null);
  const[selectedLead,setSelectedLead]=useState(null);
  const[leadsFilter,setLeadsFilter]=useState('all');
  const[searchQuery,setSearchQuery]=useState('');
  const now=new Date();
  const[currentMonth,setCurrentMonth]=useState({mes:now.getMonth()+1,ano:now.getFullYear()});

  useEffect(()=>{loadAll();},[]);

  async function loadAll(){
    setLoading(true);
    const[{data:l},{data:f},{data:e},{data:r}]=await Promise.all([
      supabase.from('leads').select('*').order('created_at',{ascending:false}),
      supabase.from('funis').select('*').order('ordem'),
      supabase.from('funil_etapas').select('*').order('ordem'),
      supabase.from('realizado_mensal').select('*').order('ano').order('mes'),
    ]);
    setLeads(l||[]);
    setFunis(f||[]);
    setEtapas(e||[]);
    setRealizado(r||[]);
    if(f?.length&&!selectedFunil)setSelectedFunil(f[0].id);
    setLoading(false);
  }

  async function saveLead(form){
    if(form.id)await supabase.from('leads').update({...form,updated_at:new Date()}).eq('id',form.id);
    else await supabase.from('leads').insert(form);
    setModal(null);
    loadAll();
  }

  async function deleteLead(id){
    await supabase.from('leads').delete().eq('id',id);
    setModal(null);
    setSelectedLead(null);
    loadAll();
  }

  async function saveRealizado(form){
    const existing=realizado.find(r=>r.mes===form.mes&&r.ano===form.ano);
    if(existing)await supabase.from('realizado_mensal').update(form).eq('id',existing.id);
    else await supabase.from('realizado_mensal').insert(form);
    setModal(null);
    loadAll();
  }

  // Métricas gerais
  const ativos=leads.filter(l=>l.status!=='perdido');
  const fechados=leads.filter(l=>l.status==='fechado');
  const mrrTotal=fechados.reduce((a,l)=>a+Number(l.valor_mensal||0),0);
  const thisMonthLeads=leads.filter(l=>l.created_at?.slice(0,7)===`${currentMonth.ano}-${String(currentMonth.mes).padStart(2,'0')}`);
  const thisMonthFechados=thisMonthLeads.filter(l=>l.status==='fechado');
  const realizadoMes=realizado.find(r=>r.mes===currentMonth.mes&&r.ano===currentMonth.ano);
  const taxaConversao=ativos.length>0?Math.round((fechados.length/leads.length)*100):0;

  // Pipeline do funil selecionado
  const funilAtual=funis.find(f=>f.id===selectedFunil);
  const etapasFunil=etapas.filter(e=>e.funil_id===selectedFunil).sort((a,b)=>a.ordem-b.ordem);
  const leadsFunil=leads.filter(l=>l.funil_id===selectedFunil);

  // Leads filtrados na listagem
  const filteredLeads=leads.filter(l=>{
    const matchFilter=leadsFilter==='all'||(leadsFilter==='active'?l.status!=='perdido'&&l.status!=='fechado':l.status===leadsFilter);
    const matchSearch=!searchQuery||(l.nome+l.clinica+l.especialidade).toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter&&matchSearch;
  });

  const MONTHS_PT=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  if(selectedLead)return(
    <LeadProfile
      lead={selectedLead}
      funis={funis}
      onBack={()=>setSelectedLead(null)}
      onUpdate={(updated)=>{setSelectedLead(updated);loadAll();}}
      onDelete={async(id)=>{await deleteLead(id);setSelectedLead(null);}}
    />
  );

  if(loading)return(
    <div style={{minHeight:'100vh',background:'#0a0a0f',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3}}>
        {[0,1,2,3].map(i=><div key={i} style={{width:14,height:14,borderRadius:3,background:'#10b981',animation:'pulse 1.5s infinite',animationDelay:`${i*0.15}s`}}/>)}
      </div>
      <div style={{color:'#10b981',fontSize:14,fontFamily:"'DM Sans',sans-serif"}}>Carregando CRM...</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );

  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(145deg,#0a0a0f,#111118,#0d1117)',color:'#e5e7eb',fontFamily:"'DM Sans',sans-serif"}}>
      {modal?.type==='lead'&&<LeadModal lead={modal.data} funis={funis} onSave={saveLead} onClose={()=>setModal(null)} onDelete={deleteLead}/>}
      {modal?.type==='meta'&&<MetaModal meta={modal.data} onSave={saveRealizado} onClose={()=>setModal(null)}/>}

      {/* Header */}
      <div style={{padding:'20px 20px 0',position:'sticky',top:0,zIndex:10,background:'rgba(10,10,15,0.95)',backdropFilter:'blur(16px)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={onBack} style={{background:'none',border:'none',color:'#10b981',fontSize:20,cursor:'pointer',padding:'0 4px 0 0'}}>←</button>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>
              {[0,1,2,3].map(i=><div key={i} style={{width:9,height:9,borderRadius:2,background:'#10b981'}}/>)}
            </div>
            <span style={{fontSize:17,fontWeight:700,color:'#f9fafb'}}>cubo<span style={{color:'#10b981'}}>.</span></span>
          </div>
          <button onClick={()=>{haptic('light');setModal({type:'lead'});}}
            style={{width:38,height:38,borderRadius:10,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(16,185,129,0.3)'}}>+</button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:3,paddingBottom:14,overflowX:'auto'}}>
          {[{id:'dashboard',l:'📊 Resumo'},{id:'pipeline',l:'🎯 Pipeline'},{id:'leads',l:'👥 Leads'},{id:'metas',l:'🏆 Metas'}].map(t=>(
            <button key={t.id} onClick={()=>{haptic('light');setTab(t.id);}}
              style={{flexShrink:0,padding:'8px 12px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',background:tab===t.id?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.03)',color:tab===t.id?'#10b981':'#6b7280',border:tab===t.id?'1px solid rgba(16,185,129,0.25)':'1px solid transparent',whiteSpace:'nowrap'}}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'0 20px 100px'}}>

        {/* ══ DASHBOARD ══ */}
        {tab==='dashboard'&&(
          <div>
            {/* Navegação mês */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,marginTop:4}}>
              <button onClick={()=>setCurrentMonth(m=>{const d=new Date(m.ano,m.mes-2,1);return{mes:d.getMonth()+1,ano:d.getFullYear()};})}
                style={{width:32,height:32,borderRadius:8,border:'none',background:'rgba(255,255,255,0.06)',color:'#9ca3af',fontSize:16,cursor:'pointer'}}>‹</button>
              <div style={{fontSize:15,fontWeight:700,color:'#f9fafb'}}>{MONTHS_PT[currentMonth.mes-1]} {currentMonth.ano}</div>
              <button onClick={()=>setCurrentMonth(m=>{const d=new Date(m.ano,m.mes,1);return{mes:d.getMonth()+1,ano:d.getFullYear()};})}
                style={{width:32,height:32,borderRadius:8,border:'none',background:'rgba(255,255,255,0.06)',color:'#9ca3af',fontSize:16,cursor:'pointer'}}>›</button>
            </div>

            {/* MRR */}
            <div style={{...cs,marginBottom:12,background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.15)',textAlign:'center',padding:'20px'}}>
              <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>MRR Total (clientes ativos)</div>
              <div style={{fontSize:32,fontWeight:700,color:'#10b981'}}>{fmt(mrrTotal)}</div>
              <div style={{fontSize:12,color:'#6b7280',marginTop:4}}>{fechados.length} clientes fechados</div>
            </div>

            {/* Cards métricas */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              {[
                {l:'Leads ativos',v:ativos.length,c:'#0ea5e9',i:'👥'},
                {l:'Taxa conversão',v:`${taxaConversao}%`,c:'#f59e0b',i:'📈'},
                {l:'Novos este mês',v:thisMonthLeads.length,c:'#8b5cf6',i:'🆕'},
                {l:'Fechados este mês',v:thisMonthFechados.length,c:'#10b981',i:'🏆'},
              ].map((m,i)=>(
                <div key={i} style={{...cs,padding:'14px'}}>
                  <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{m.i} {m.l}</div>
                  <div style={{fontSize:22,fontWeight:700,color:m.c}}>{m.v}</div>
                </div>
              ))}
            </div>

            {/* Por etapa */}
            <div style={{...cs,marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:'#10b981',textTransform:'uppercase',letterSpacing:1,marginBottom:12}}>Leads por etapa</div>
              {Object.entries(STAGE_LABELS).map(([k,v])=>{
                const count=leads.filter(l=>l.status===k).length;
                const pct=leads.length>0?Math.round((count/leads.length)*100):0;
                return(
                  <div key={k} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:13,color:'#e5e7eb'}}>{v}</span>
                      <span style={{fontSize:13,fontWeight:600,color:STAGE_COLORS[k]}}>{count}</span>
                    </div>
                    <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                      <div style={{height:'100%',width:`${pct}%`,background:STAGE_COLORS[k],borderRadius:2,transition:'width 0.4s'}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Realizados do mês */}
            {realizadoMes&&(
              <div style={{...cs}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#10b981',textTransform:'uppercase',letterSpacing:1}}>Realizado do mês</div>
                  <button onClick={()=>setModal({type:'meta',data:realizadoMes})}
                    style={{background:'none',border:'none',color:'#6b7280',fontSize:12,cursor:'pointer'}}>editar</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  {[{l:'BPO',v:realizadoMes.bpo_fechados},{l:'Cont.',v:realizadoMes.cont_fechados},{l:'Ligações',v:realizadoMes.ligacoes_feitas}].map(m=>(
                    <div key={m.l} style={{textAlign:'center',padding:'10px',background:'rgba(255,255,255,0.03)',borderRadius:10}}>
                      <div style={{fontSize:22,fontWeight:700,color:'#10b981'}}>{m.v}</div>
                      <div style={{fontSize:10,color:'#6b7280',marginTop:2}}>{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!realizadoMes&&(
              <button onClick={()=>setModal({type:'meta'})}
                style={{width:'100%',padding:'14px',borderRadius:14,border:'1px dashed rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.04)',color:'#10b981',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                + Registrar realizado do mês
              </button>
            )}
          </div>
        )}

        {/* ══ PIPELINE ══ */}
        {tab==='pipeline'&&(
          <div>
            {/* Seletor de funil */}
            {funis.length>0&&(
              <div style={{display:'flex',gap:6,marginBottom:16,marginTop:4,overflowX:'auto',paddingBottom:4}}>
                {funis.map(f=>(
                  <button key={f.id} onClick={()=>{haptic('light');setSelectedFunil(f.id);}}
                    style={{flexShrink:0,padding:'7px 14px',borderRadius:16,border:`1px solid ${selectedFunil===f.id?(f.cor||'#10b981'):'rgba(255,255,255,0.08)'}`,background:selectedFunil===f.id?`${f.cor||'#10b981'}18`:'transparent',color:selectedFunil===f.id?(f.cor||'#10b981'):'#9ca3af',fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
                    {f.nome}
                  </button>
                ))}
              </div>
            )}

            {/* Colunas do pipeline */}
            {etapasFunil.length===0&&(
              <div style={{textAlign:'center',color:'#4b5563',paddingTop:40}}>
                <div style={{fontSize:36,marginBottom:10}}>🎯</div>
                <div>Nenhuma etapa neste funil</div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {etapasFunil.map(etapa=>{
                const etapaLeads=leadsFunil.filter(l=>l.status===etapa.key);
                const etapaColor=etapa.cor||STAGE_COLORS[etapa.key]||'#6b7280';
                return(
                  <div key={etapa.id}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:etapaColor,flexShrink:0}}/>
                      <span style={{fontSize:12,fontWeight:700,color:etapaColor,textTransform:'uppercase',letterSpacing:1}}>{etapa.label}</span>
                      <span style={{fontSize:11,color:'#4b5563',marginLeft:4}}>{etapaLeads.length}</span>
                    </div>
                    {etapaLeads.length===0&&(
                      <div style={{padding:'12px 14px',background:'rgba(255,255,255,0.02)',borderRadius:10,border:'1px dashed rgba(255,255,255,0.06)',fontSize:12,color:'#4b5563',textAlign:'center'}}>
                        Nenhum lead
                      </div>
                    )}
                    {etapaLeads.map(lead=>(
                      <div key={lead.id} onClick={()=>{haptic('light');setSelectedLead(lead);}}
                        style={{...cs,marginBottom:8,cursor:'pointer',borderLeft:`3px solid ${etapaColor}`}}>
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:600,color:'#f9fafb',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lead.nome}</div>
                            <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{lead.clinica}</div>
                            <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                              {lead.servico&&<span style={{fontSize:10,color:'#10b981',background:'rgba(16,185,129,0.08)',padding:'2px 8px',borderRadius:10}}>{lead.servico}</span>}
                              {lead.valor_mensal>0&&<span style={{fontSize:10,color:'#f59e0b'}}>{fmt(lead.valor_mensal)}/mês</span>}
                            </div>
                          </div>
                          <span style={{fontSize:14,color:'#2a2a3a',marginLeft:8}}>›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ LEADS ══ */}
        {tab==='leads'&&(
          <div>
            {/* Busca */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.07)',marginBottom:12,marginTop:4}}>
              <span style={{fontSize:14,color:'#4b5563'}}>🔍</span>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Buscar lead..."
                style={{flex:1,background:'transparent',border:'none',color:'#f9fafb',fontSize:14,outline:'none'}}/>
            </div>

            {/* Filtros */}
            <div style={{display:'flex',gap:6,marginBottom:14,overflowX:'auto',paddingBottom:2}}>
              {[{id:'all',l:'Todos'},{id:'active',l:'Ativos'},{id:'lead',l:'Lead'},{id:'contato',l:'Contato'},{id:'proposta',l:'Proposta'},{id:'fechado',l:'Fechado'},{id:'perdido',l:'Perdido'}].map(f=>(
                <button key={f.id} onClick={()=>setLeadsFilter(f.id)}
                  style={{flexShrink:0,padding:'5px 12px',borderRadius:16,fontSize:11,fontWeight:600,cursor:'pointer',border:'none',background:leadsFilter===f.id?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.04)',color:leadsFilter===f.id?'#10b981':'#6b7280'}}>
                  {f.l}
                </button>
              ))}
            </div>

            {filteredLeads.length===0&&(
              <div style={{textAlign:'center',color:'#4b5563',paddingTop:40}}>
                <div style={{fontSize:36,marginBottom:10}}>👥</div>
                <div>Nenhum lead encontrado</div>
              </div>
            )}

            {filteredLeads.map(lead=>{
              const stageColor=STAGE_COLORS[lead.status]||'#6b7280';
              const funil=funis.find(f=>f.id===lead.funil_id);
              return(
                <div key={lead.id} onClick={()=>{haptic('light');setSelectedLead(lead);}}
                  style={{...cs,marginBottom:8,cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${stageColor}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:stageColor,flexShrink:0}}>
                      {lead.nome.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <div style={{fontSize:14,fontWeight:600,color:'#f9fafb',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{lead.nome}</div>
                        <span style={{fontSize:10,fontWeight:600,color:stageColor,background:`${stageColor}18`,padding:'1px 7px',borderRadius:10,flexShrink:0}}>{STAGE_LABELS[lead.status]}</span>
                      </div>
                      <div style={{fontSize:12,color:'#6b7280',marginBottom:4}}>{lead.clinica}</div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                        {lead.servico&&<span style={{fontSize:10,color:'#10b981'}}>{lead.servico}</span>}
                        {funil&&<span style={{fontSize:10,color:'#4b5563'}}>📊 {funil.nome}</span>}
                        {lead.valor_mensal>0&&<span style={{fontSize:10,color:'#f59e0b'}}>{fmt(lead.valor_mensal)}/mês</span>}
                      </div>
                    </div>
                    <span style={{fontSize:14,color:'#2a2a3a',flexShrink:0}}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ METAS ══ */}
        {tab==='metas'&&(
          <div style={{marginTop:4}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:700,color:'#f9fafb'}}>Histórico de resultados</div>
              <button onClick={()=>setModal({type:'meta'})}
                style={{padding:'7px 14px',borderRadius:10,border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.08)',color:'#10b981',fontSize:12,fontWeight:600,cursor:'pointer'}}>+ Registrar</button>
            </div>

            {realizado.length===0&&(
              <div style={{textAlign:'center',color:'#4b5563',paddingTop:40}}>
                <div style={{fontSize:36,marginBottom:10}}>🏆</div>
                <div>Nenhum resultado registrado ainda</div>
              </div>
            )}

            {[...realizado].reverse().map(r=>{
              const totalFechados=r.bpo_fechados+r.cont_fechados;
              return(
                <div key={r.id} style={{...cs,marginBottom:10,cursor:'pointer'}} onClick={()=>setModal({type:'meta',data:r})}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                    <div style={{fontSize:15,fontWeight:700,color:'#f9fafb'}}>{MONTHS_PT[r.mes-1]} {r.ano}</div>
                    <span style={{fontSize:13,fontWeight:700,color:'#10b981'}}>{totalFechados} fechamentos</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                    {[{l:'BPO',v:r.bpo_fechados,c:'#6366f1'},{l:'Contabilidade',v:r.cont_fechados,c:'#0ea5e9'},{l:'Ligações',v:r.ligacoes_feitas,c:'#f59e0b'}].map(m=>(
                      <div key={m.l} style={{textAlign:'center',padding:'8px',background:'rgba(255,255,255,0.03)',borderRadius:8}}>
                        <div style={{fontSize:20,fontWeight:700,color:m.c}}>{m.v}</div>
                        <div style={{fontSize:10,color:'#6b7280',marginTop:2}}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
