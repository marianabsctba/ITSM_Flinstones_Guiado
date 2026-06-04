"use strict";

const seedTickets = [
{id:"INC000123",type:"Incidente",title:"Internet lenta no setor de Pedrabrasa",requester:"Fred Flintstone",category:"Rede",state:"Em Andamento",priority:"Alta",sla:60,open:"22/05/2024 09:15",owner:"Barney",desc:"Usuários do setor de Pedrabrasa relatam lentidão na navegação e quedas de conexão durante o período da manhã.",activities:["09:20 Barney: atendimento iniciado.","09:35 Barney: teste de conectividade em andamento.","09:50 Barney: identificado uso alto no link principal."]},
{id:"INC000122",type:"Incidente",title:"Impressora da contabilidade não imprime",requester:"Betty Rubble",category:"Equipamentos",state:"Novo",priority:"Média",sla:240,open:"22/05/2024 08:50",owner:"Wilma",desc:"Impressora de lajes contábeis parada desde a abertura do expediente.",activities:["08:52 Wilma: chamado recebido."]},
{id:"REQ000045",type:"Requisição",title:"Solicitação de novo monitor",requester:"Bamm-Bamm",category:"Equipamentos",state:"Aguardando Aprovação",priority:"Baixa",sla:1440,open:"21/05/2024 16:30",owner:"Service Desk N1",desc:"Solicitação de monitor adicional para posto de trabalho.",activities:["16:31 Sistema: aprovação solicitada ao gestor."]},
{id:"CHG000021",type:"Mudança",title:"Atualização de sistema de Folha de Pagamento",requester:"Sr. Pedregulho",category:"Sistemas",state:"Planejado",priority:"Alta",sla:2880,open:"21/05/2024 11:00",owner:"Pedrão",desc:"Mudança planejada com janela, validação e rollback documentado.",activities:["11:15 Pedrão: plano de rollback anexado."]},
{id:"PRB000012",type:"Problema",title:"Falhas intermitentes no sistema de eras",requester:"Dino",category:"Sistemas",state:"Investigação",priority:"Alta",sla:4320,open:"20/05/2024 14:20",owner:"Pedrita",desc:"Incidentes recorrentes indicam possível causa raiz em autenticação.",activities:["14:30 Pedrita: iniciado RCA."]},
{id:"REQ000046",type:"Requisição",title:"Acesso ao portal financeiro",requester:"Wilma Flintstone",category:"Acessos",state:"Em Andamento",priority:"Média",sla:480,open:"20/05/2024 10:10",owner:"Service Desk N1",desc:"Acesso mediante aprovação do gestor.",activities:["10:15 Sistema: fluxo de aprovação iniciado."]},
{id:"INC000124",type:"Incidente",title:"VPN dos caçadores remotos caiu",requester:"Pedrita",category:"Rede",state:"Em Andamento",priority:"Alta",sla:60,open:"22/05/2024 10:05",owner:"Redes",desc:"Usuários remotos perderam acesso ao sistema de vendas.",activities:["10:08 Redes: validando túnel principal."]},
{id:"TSK000034",type:"Tarefa",title:"Validar evidências de mudança",requester:"Pedrão",category:"Governança",state:"Novo",priority:"Baixa",sla:1440,open:"22/05/2024 12:10",owner:"Pedrão",desc:"Tarefa vinculada à mudança CHG000021.",activities:["12:11 Sistema: tarefa gerada pela mudança."]}
];

let tickets;
try { tickets = JSON.parse(localStorage.getItem("pedraTickets") || "null") || seedTickets; } catch(e) { tickets = seedTickets; }
let rules;
try { rules = JSON.parse(localStorage.getItem("pedraRules") || "null") || null; } catch(e) { rules = null; }
rules = rules || [
  {id:1,type:"Incidente",priority:"Alta",action:"assign:Redes",enabled:true,desc:"Incidente alta prioridade → Redes"},
  {id:2,type:"Requisição",priority:"any",action:"state:Aguardando Aprovação",enabled:true,desc:"Requisição → Aguardando aprovação"},
  {id:3,type:"Incidente",priority:"Crítica",action:"sla:30",enabled:true,desc:"Incidente crítico → SLA 30min"}
];
let audit;
try { audit = JSON.parse(localStorage.getItem("pedraAudit") || "null") || ["Sistema iniciado com dados de demonstração."]; } catch(e) { audit = ["Sistema iniciado com dados de demonstração."]; }
let selectedId = localStorage.getItem("pedraSelected") || tickets[0]?.id;
let sortedMode = "none";
let slaFilter = "all";

const prefixMap={Incidente:"INC",Requisição:"REQ",Mudança:"CHG",Problema:"PRB",Tarefa:"TSK"};
const titleMap={home:"Todos os chamados",calls:"Central de chamados",catalog:"Catálogo de serviços",knowledge:"Base de conhecimento",reports:"Relatórios e indicadores",automation:"Automações e regras",admin:"Administração",class:"Aulinha guiada",certificate:"Certificado"};

function save(){
  localStorage.setItem("pedraTickets", JSON.stringify(tickets));
  localStorage.setItem("pedraRules", JSON.stringify(rules));
  localStorage.setItem("pedraAudit", JSON.stringify(audit.slice(-80)));
  localStorage.setItem("pedraSelected", selectedId || "");
}
function toast(msg){ const t=document.getElementById("toast"); t.textContent=msg; t.style.display="block"; clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>t.style.display="none",2800); }
function log(msg){ audit.unshift(new Date().toLocaleTimeString("pt-BR")+" · "+msg); save(); renderAudit(); }
function toggleMenu(){ document.getElementById("mainMenu").classList.toggle("open"); }
function focusSearch(){ document.getElementById("searchInput").focus(); }
function showNotifications(){ toast(`${tickets.filter(t=>t.priority==="Alta"||t.priority==="Crítica").length} chamados de alta criticidade exigem atenção.`); }

function openModal(id){ document.getElementById(id).style.display="flex"; }
function closeModal(id){ document.getElementById(id).style.display="none"; }
document.addEventListener("keydown", e=>{ if(e.key==="Escape") document.querySelectorAll(".modal").forEach(m=>m.style.display="none"); });

function stateClass(s){ return s.includes("Andamento")?"dotBlue":s.includes("Novo")?"dotGreen":s.includes("Aguardando")?"dotYellow":s.includes("Planejado")?"dotGray":s.includes("Investigação")?"dotRed":s.includes("Resolvido")?"dotGreen":"dotGray"; }
function prClass(p){ return p==="Crítica"||p==="Alta"?"p1":p==="Média"?"p2":p==="Baixa"?"low":"p3"; }
function slaText(min){ if(min<60) return `${min}min`; if(min<1440) return `${Math.round(min/60)}h`; return `${Math.round(min/1440)}d`; }
function isSlaRisk(t){ return (t.priority==="Alta"||t.priority==="Crítica") && !["Resolvido","Fechado"].includes(t.state); }

function getFilteredTickets(){
  const q=(document.getElementById("searchInput")?.value||"").toLowerCase();
  const f=document.getElementById("typeFilter")?.value||"all";
  let rows=tickets.filter(t=>(f==="all"||t.type===f)&&Object.values(t).join(" ").toLowerCase().includes(q));
  if(slaFilter==="risk") rows=rows.filter(isSlaRisk);
  if(slaFilter==="ok") rows=rows.filter(t=>!isSlaRisk(t));
  if(sortedMode==="priority"){
    const rank={Crítica:0,Alta:1,Média:2,Baixa:3};
    rows.sort((a,b)=>(rank[a.priority]??9)-(rank[b.priority]??9));
  }
  if(sortedMode==="newest") rows.sort((a,b)=>String(b.open).localeCompare(String(a.open)));
  return rows;
}
function renderTickets(){
  const rows=getFilteredTickets();
  const html=rows.map(t=>`<tr onclick="selectTicket('${t.id}')"><td><span class="statusDot ${stateClass(t.state)}"></span></td><td><b style="color:#0b5e9d">${t.id}</b></td><td><b>${t.title}</b></td><td>${t.requester}</td><td>${t.category}</td><td><span class="statusDot ${stateClass(t.state)}"></span>${t.state}</td><td><span class="pill ${prClass(t.priority)}">${t.priority}</span></td><td>${slaText(t.sla)}</td><td>${t.open}</td><td>${t.owner}</td></tr>`).join("");
  ["ticketRows","ticketRows2"].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
  const cards=rows.map(t=>`<div class="ticketCard" onclick="selectTicket('${t.id}')"><b>${t.id}</b><h4>${t.title}</h4><div>${t.requester} · ${t.category}</div><div class="ticketMeta"><span class="pill ${prClass(t.priority)}">${t.priority}</span><span class="pill gray">${t.type}</span><span class="pill ${isSlaRisk(t)?"p1":"low"}">SLA ${slaText(t.sla)}</span><span>${t.owner}</span></div></div>`).join("");
  ["mobileCards","mobileCards2"].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=cards; });
  updateMetrics(); renderDetail(); save();
}
function updateMetrics(){
  const open=tickets.filter(t=>!["Resolvido","Fechado"].includes(t.state)).length;
  const closed=tickets.length-open;
  const slaOk=tickets.length?Math.round((tickets.filter(t=>!isSlaRisk(t)).length/tickets.length)*100):100;
  const p1=tickets.filter(t=>t.priority==="Alta"||t.priority==="Crítica").length;
  const ids={mOpen:open,mClosed:closed,repTotal:tickets.length,repBacklog:open,repP1:p1};
  Object.entries(ids).forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.textContent=val; });
  ["mSla","repSla"].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=slaOk+"%"; });
  const avg=tickets.length?Math.round(tickets.reduce((a,t)=>a+t.sla,0)/tickets.length/60):0;
  const mAvg=document.getElementById("mAvg"); if(mAvg) mAvg.textContent=avg+"h";
  renderHomeRules(); drawCharts();
}

function selectTicket(id){
  selectedId=id;
  renderDetail();
  if(window.innerWidth<1350) openModal("detailModal");
  save();
}
function selectedTicket(){ return tickets.find(t=>t.id===selectedId) || tickets[0]; }
function renderDetail(){
  const t=selectedTicket(); if(!t) return;
  selectedId=t.id;
  const set=(id,html)=>{const el=document.getElementById(id); if(el) el.innerHTML=html;};
  set("detailNum",t.id); set("detailTitle",t.title);
  set("detailState",`<span class="statusDot ${stateClass(t.state)}"></span>${t.state}`);
  set("detailPrio",`<span class="statusDot ${t.priority==="Alta"||t.priority==="Crítica"?"dotRed":t.priority==="Média"?"dotYellow":"dotGreen"}"></span>${t.priority}`);
  set("detailSla",`${slaText(t.sla)} ${isSlaRisk(t)?"· Em risco":"· OK"}`);
  set("detailOwner",t.owner); set("detailOpen",t.open);
  set("detailRequester",`${t.requester}<br><small>${t.requester.toLowerCase().replaceAll(" ",".")}@pedrabrasa.com</small>`);
  set("detailCat",t.category); set("detailDesc",t.desc);
  const acts=(t.activities||[]).map(a=>`<div class="event"><b>${a.split(" ")[0]}</b><span>${a}</span></div>`).join("");
  set("activityList",acts || "<div class='event'><b>--</b><span>Sem atividades.</span></div>");
  const body=document.getElementById("detailModalBody");
  if(body){
    body.innerHTML=`<div class="detail" style="display:block;position:static;box-shadow:none"><h2>${t.id}</h2><h3>${t.title}</h3>
    <div class="field"><b>Estado</b><span><span class="statusDot ${stateClass(t.state)}"></span>${t.state}</span></div>
    <div class="field"><b>Prioridade</b><span>${t.priority}</span></div><div class="field"><b>SLA</b><span>${slaText(t.sla)}</span></div>
    <div class="field"><b>Atribuído a</b><span>${t.owner}</span></div><div class="field"><b>Solicitante</b><span>${t.requester}</span></div>
    <div class="field"><b>Descrição</b><span>${t.desc}</span></div><div class="timeline"><h3>Atividades</h3>${acts}</div>
    <button class="btn" onclick="addActivity()">Adicionar atividade</button> <button class="btn green" onclick="resolveSelected()">Resolver</button></div>`;
  }
}
function addActivity(){
  const t=selectedTicket(); if(!t) return;
  const msg=prompt("Descreva a atividade:", "Atualização registrada no chamado.");
  if(!msg) return;
  t.activities=t.activities||[];
  t.activities.unshift(new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+" Pedrão: "+msg);
  log(`Atividade adicionada em ${t.id}.`);
  renderTickets();
}
function resolveSelected(){
  const t=selectedTicket(); if(!t) return;
  t.state="Resolvido"; t.activities=t.activities||[]; t.activities.unshift(new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+" Sistema: chamado resolvido.");
  log(`${t.id} resolvido.`);
  renderTickets();
}

function sortTickets(){
  sortedMode = sortedMode==="none" ? "priority" : sortedMode==="priority" ? "newest" : "none";
  toast("Ordenação: "+(sortedMode==="priority"?"prioridade":sortedMode==="newest"?"mais recentes":"padrão"));
  renderTickets();
}
function cycleSlaFilter(){
  slaFilter = slaFilter==="all" ? "risk" : slaFilter==="risk" ? "ok" : "all";
  document.getElementById("slaFilterLabel").textContent = slaFilter==="all"?"Todos":slaFilter==="risk"?"Risco":"OK";
  renderTickets();
}
function setType(t){ document.getElementById("typeFilter").value=t; showSection("calls"); renderTickets(); }
function setOwner(owner){
  document.getElementById("searchInput").value = owner==="me" ? "Pedrão" : "";
  renderTickets();
}
function showSection(id,btn){
  document.querySelectorAll(".content").forEach(c=>c.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".menu button").forEach(b=>b.classList.remove("active"));
  if(btn) btn.classList.add("active"); else {
    [...document.querySelectorAll(".menu button")].find(b=>b.textContent.toLowerCase().includes((titleMap[id]||id).split(" ")[0].toLowerCase()))?.classList.add("active");
  }
  document.getElementById("sectionTitle").innerText=titleMap[id]||"Pedra Service";
  document.getElementById("mainMenu").classList.remove("open");
  if(id==="reports") drawCharts();
  if(id==="automation") renderRules();
  if(id==="calls" || id==="home") renderTickets();
}
function createTicket(){
  const type=document.getElementById("newType").value, priority=document.getElementById("newPrio").value, requester=document.getElementById("newReq").value||"Solicitante", category=document.getElementById("newCat").value, owner=document.getElementById("newOwner").value;
  const title=document.getElementById("newTitle").value||"Chamado criado pelo laboratório";
  const desc=document.getElementById("newDesc").value||"Descrição registrada pelo portal.";
  const defaultSla={Crítica:30,Alta:60,Média:240,Baixa:1440}[priority]||240;
  const id=prefixMap[type]+String(Math.floor(Math.random()*900000)+100000);
  const ticket={id,type,title,requester,category,state:"Novo",priority,sla:defaultSla,open:new Date().toLocaleString("pt-BR"),owner,desc,activities:[new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+" Sistema: chamado criado."]};
  applyRules(ticket);
  tickets.unshift(ticket);
  selectedId=id;
  closeModal("ticketModal");
  log(`${id} criado. ${ticket.activities.length>1?"Regras aplicadas.":""}`);
  renderTickets();
  selectTicket(id);
  toast("Chamado criado, regras aplicadas e SLA definido.");
}

function applyAction(ticket, action){
  const [kind,value]=action.split(":");
  if(kind==="assign"){ ticket.owner=value; ticket.activities.unshift(`${new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} Automação: atribuído para ${value}.`); }
  if(kind==="state"){ ticket.state=value; ticket.activities.unshift(`${new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} Automação: estado alterado para ${value}.`); }
  if(kind==="priority"){ ticket.priority=value; ticket.activities.unshift(`${new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} Automação: prioridade alterada para ${value}.`); }
  if(kind==="sla"){ ticket.sla=Number(value); ticket.activities.unshift(`${new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})} Automação: SLA definido para ${slaText(Number(value))}.`); }
}
function ruleMatches(ticket, rule){ return rule.enabled && (rule.type==="all"||ticket.type===rule.type) && (rule.priority==="any"||ticket.priority===rule.priority); }
function applyRules(ticket){
  rules.forEach(rule=>{ if(ruleMatches(ticket,rule)) applyAction(ticket,rule.action); });
}
function createRule(){
  const type=document.getElementById("ruleType").value, priority=document.getElementById("rulePrio").value, action=document.getElementById("ruleAction").value;
  const actionText=action.replace("assign:","Atribuir para ").replace("state:","Mudar estado para ").replace("priority:","Elevar prioridade para ").replace("sla:","Definir SLA ");
  const desc=`${type==="all"?"Qualquer tipo":type} + ${priority==="any"?"qualquer prioridade":priority} → ${actionText}`;
  rules.unshift({id:Date.now(),type,priority,action,enabled:true,desc});
  log("Regra criada: "+desc);
  renderRules(); renderHomeRules(); save(); toast("Regra criada e ativa.");
}
function toggleRule(id){
  const r=rules.find(x=>x.id===id); if(!r) return;
  r.enabled=!r.enabled; log(`Regra ${r.enabled?"ativada":"desativada"}: ${r.desc}`); renderRules(); renderHomeRules(); save();
}
function deleteRule(id){ rules=rules.filter(r=>r.id!==id); log("Regra removida."); renderRules(); renderHomeRules(); save(); }
function runRulesOnAll(){
  tickets.forEach(t=>{ t.activities=t.activities||[]; applyRules(t); });
  log("Regras executadas em todos os chamados existentes.");
  renderTickets(); renderRules(); toast("Automações executadas nos chamados.");
}
function resetRules(){
  rules=[
    {id:1,type:"Incidente",priority:"Alta",action:"assign:Redes",enabled:true,desc:"Incidente alta prioridade → Redes"},
    {id:2,type:"Requisição",priority:"any",action:"state:Aguardando Aprovação",enabled:true,desc:"Requisição → Aguardando aprovação"},
    {id:3,type:"Incidente",priority:"Crítica",action:"sla:30",enabled:true,desc:"Incidente crítico → SLA 30min"}
  ];
  log("Regras padrão restauradas."); renderRules(); renderHomeRules(); save(); toast("Regras padrão restauradas.");
}
function renderRules(){
  const grid=document.getElementById("rulesGrid"); if(!grid) return;
  grid.innerHTML=rules.map(r=>`<div class="miniCard"><b>${r.enabled?"🟢":"⚪"} ${r.desc}</b><p>Tipo: ${r.type} · Prioridade: ${r.priority} · Ação: ${r.action}</p><button class="btn green" onclick="toggleRule(${r.id})">${r.enabled?"Desativar":"Ativar"}</button> <button class="btn red" onclick="deleteRule(${r.id})">Excluir</button></div>`).join("");
  renderAudit();
}
function renderHomeRules(){
  const el=document.getElementById("activeRulesHome"); if(!el) return;
  el.innerHTML=rules.filter(r=>r.enabled).slice(0,3).map(r=>`<div class="miniCard"><b>${r.desc}</b><p>Regra ativa e aplicada automaticamente.</p></div>`).join("") || "<div class='miniCard'><b>Sem regras ativas</b><p>Crie uma automação para iniciar.</p></div>";
}
function renderAudit(){ const el=document.getElementById("auditLog"); if(el) el.innerHTML=audit.map(a=>`<div>🦴 ${a}</div>`).join(""); }

function drawBars(id,labels,vals){
  const el=document.getElementById(id); if(!el) return;
  const max=Math.max(...vals,1);
  el.innerHTML=labels.map((l,i)=>`<div class="bar" style="height:${30+(vals[i]/max)*135}px"><i>${vals[i]}</i><span>${l}</span></div>`).join("");
}
function drawDonut(id,counts){
  const el=document.getElementById(id); if(!el) return;
  const vals=Object.values(counts); const total=vals.reduce((a,b)=>a+b,0)||1;
  let acc=0; const colors=["#e21e25","#f2bd27","#227bbf","#2ca66d","#8a56cc"];
  const parts=vals.map((v,i)=>{ const start=acc/total*100; acc+=v; const end=acc/total*100; return `${colors[i%colors.length]} ${start}% ${end}%`; });
  el.style.background=`conic-gradient(${parts.join(",")})`;
}
function drawCharts(){
  const byType=countBy("type"), byCat=countBy("category"), byPr=countBy("priority");
  drawBars("miniBars",["Seg","Ter","Qua","Qui","Sex","Hoje"],[18,25,31,44,38,tickets.length+35]);
  drawBars("barsDaily",["15/05","16/05","17/05","18/05","19/05","20/05","Hoje"],[18,24,31,45,39,52,tickets.length]);
  drawBars("barsSla",["N1","Redes","Sist","Seg","Infra"],[96,91,88,93,89]);
  drawBars("barsPrio",["Baixa","Média","Alta","Crít"],[byPr.Baixa||0,byPr.Média||0,byPr.Alta||0,byPr.Crítica||0]);
  drawDonut("donutType",{Incidente:byType.Incidente||0,Req:byType.Requisição||0,Mud:byType.Mudança||0,Prob:byType.Problema||0});
  drawDonut("donutCat",{Rede:byCat.Rede||0,Sistemas:byCat.Sistemas||0,Acessos:byCat.Acessos||0,Outros:tickets.filter(t=>!["Rede","Sistemas","Acessos"].includes(t.category)).length});
}
function countBy(key){ return tickets.reduce((a,t)=>{ a[t[key]]=(a[t[key]]||0)+1; return a; },{}); }

const catalog=[
["💻","Equipamentos","Solicitação de notebook, monitor, celular e periféricos.","Solicitar equipamento","Equipamentos"],
["🔑","Acessos","Pedido de acesso com aprovação, perfil e validade.","Solicitar acesso","Acessos"],
["⚙️","Serviços de TI","Instalação, configuração, suporte e orientação.","Solicitar serviço","Sistemas"],
["💿","Software","Instalação, licença, atualização ou remoção.","Solicitar software","Sistemas"],
["🧑‍💼","Onboarding","Pacote completo para novo colaborador.","Iniciar onboarding","Acessos"],
["🚪","Offboarding","Revogação de acessos e devolução de ativos.","Iniciar offboarding","Acessos"],
["🛡️","Segurança","MFA, bloqueio, análise e acesso emergencial.","Abrir solicitação","Segurança"],
["🌴","Facilities","Demandas internas não técnicas integradas ao portal.","Solicitar facilities","Facilities"],
["📊","Relatórios","Exportações, dashboards e indicadores.","Solicitar relatório","Governança"]
];
function renderCatalog(){
  const html=catalog.map(c=>`<div class="serviceTile"><div class="ico">${c[0]}</div><b>${c[1]}</b><p>${c[2]}</p><button class="btn green" onclick="quickReq('${c[3]}','${c[4]}')">${c[3]}</button></div>`).join("");
  document.getElementById("catalogGrid").innerHTML=html;
  document.getElementById("catalogHome").innerHTML=catalog.slice(0,6).map(c=>`<div class="serviceTile"><div class="ico">${c[0]}</div><b>${c[1]}</b><p>${c[2]}</p><button class="btn green" onclick="quickReq('${c[3]}','${c[4]}')">Solicitar</button></div>`).join("");
}
function quickReq(title,category){
  const id="REQ"+Math.floor(Math.random()*900000+100000);
  const t={id,type:"Requisição",title,requester:"Fred Flintstone",category,state:"Novo",priority:"Baixa",sla:1440,open:new Date().toLocaleString("pt-BR"),owner:"Service Desk N1",desc:"Solicitação aberta pelo catálogo de serviços.",activities:[new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+" Sistema: solicitação aberta pelo catálogo."]};
  applyRules(t); tickets.unshift(t); selectedId=id; log(`${id} criado pelo catálogo.`); renderTickets(); selectTicket(id); toast("Solicitação criada pelo catálogo.");
}

const kb=[["Prioridade correta","Use impacto x urgência. Usuário irritado não é prioridade automática."],["SLA sem fantasia","Prazo precisa refletir criticidade e capacidade real da equipe."],["Reset seguro","Valide identidade e nunca envie senha por canal inseguro."],["Mudança saudável","Tenha risco, janela, rollback, aprovação e validação."],["Incidente recorrente","Se repete, vira problema e precisa de causa raiz."],["CMDB útil","Relacione ativo, serviço, dono, criticidade e impacto."],["Comunicação","Atualize usuário durante o ciclo do chamado."],["Automação","Automatize tarefas repetitivas sem perder auditoria."],["Métricas","Meça volume, backlog, SLA, MTTR, satisfação e reincidência."]];
function renderKb(){ document.getElementById("kbGrid").innerHTML=kb.map(k=>`<div class="miniCard"><b>${k[0]}</b><p>${k[1]}</p><button class="btn" onclick="toast('Artigo aberto: ${k[0]}')">Ler artigo</button></div>`).join(""); }

function openAdmin(kind){
  const out=document.getElementById("adminOutput"); out.style.display="block";
  const data={
    users:["Admin","Gestor de Serviço","Analista N1","Analista N2","Solicitante"],
    forms:["Incidente: impacto, urgência, serviço afetado","Mudança: risco, janela, rollback","Requisição: aprovador, validade, justificativa"],
    sla:["Crítica: 30min","Alta: 1h","Média: 4h","Baixa: 1 dia"],
    integrations:["E-mail inbound","Webhook SIEM","Inventário/CMDB","IdP SSO","Monitoramento"],
    cmdb:["APP-PEDRA-01 → DB-CAVERNA-07","VPN-REMOTA → FW-VULCAO-02","ERP-FIN → DB-CAVERNA-07 → STORAGE-ROCHA"]
  }[kind]||[];
  out.innerHTML=`<h3>${kind.toUpperCase()}</h3><ul>${data.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}
function exportCSV(){
  const header=["id","type","title","requester","category","state","priority","sla","open","owner"];
  const csv=[header.join(",")].concat(tickets.map(t=>header.map(h=>`"${String(t[h]??"").replaceAll('"','""')}"`).join(","))).join("\n");
  downloadFile("pedra_service_chamados.csv",csv,"text/csv");
}
function exportJSON(){ downloadFile("pedra_service_chamados.json",JSON.stringify(tickets,null,2),"application/json"); }
function exportAudit(){ downloadFile("pedra_service_auditoria.txt",audit.join("\n"),"text/plain"); }
function downloadFile(name,content,type){
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
  toast(`${name} exportado.`);
}

const questions=[
{q:"Qual é a definição mais completa de ITSM?",a:1,c:["Um sistema para abrir e fechar tickets com rapidez.","Uma abordagem para planejar, entregar, operar, medir e melhorar serviços de TI com valor, controle, SLA e melhoria contínua.","Um portal visual para centralizar pedidos sem relação com governança.","Um conjunto de filas usado apenas pelo Service Desk N1."]},
{q:"Em incidente crítico, qual é o primeiro objetivo?",a:2,c:["Investigar causa raiz antes de qualquer ação.","Abrir mudança normal e aguardar janela.","Restaurar o serviço ou aplicar contorno seguro, preservando evidências.","Fechar o ticket e criar outro para não vencer SLA."]},
{q:"Qual diferença entre incidente e problema?",a:0,c:["Incidente restaura serviço; problema investiga causa raiz e recorrência.","Incidente é sempre crítico; problema é sempre baixa prioridade.","Incidente é requisição; problema é aprovação.","Incidente é técnico; problema é administrativo."]},
{q:"O que torna uma CMDB útil?",a:3,c:["Ter todos os ativos possíveis, mesmo sem relacionamento.","Ser atualizada uma vez por ano.","Guardar só hardware físico.","Relacionar ativos, serviços, donos, criticidade e impacto."]},
{q:"Mudança bem controlada deve ter:",a:1,c:["Muitas aprovações, mesmo sem plano técnico.","Objetivo, risco, impacto, janela, execução, rollback, aprovação proporcional e validação pós-mudança.","Execução silenciosa para não incomodar usuários.","Tratamento emergencial para toda alteração."]}
];
function renderQuiz(){ document.getElementById("quizBox").innerHTML=questions.map((x,i)=>`<div class="miniCard"><b>${i+1}. ${x.q}</b>${x.c.map((c,j)=>`<label class="choice"><input type="radio" name="q${i}" value="${j}" style="width:auto;margin-right:8px"> ${c}</label>`).join("")}</div>`).join(""); }
async function sha256(t){ const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,"0")).join(""); }


function tour(){
  showSection("home");
  const targets=[document.getElementById("guidePanel"),document.getElementById("sideNav"),document.getElementById("tablePanel"),document.getElementById("detailPanel"),document.getElementById("catalogPanel"),document.getElementById("metricsPanel"),document.getElementById("automationPanel"),document.getElementById("bestPanel")].filter(Boolean);
  const msgs=["Aula guiada: explica cada área do ITSM.","Menu lateral: acesso aos módulos operacionais.","Fila de trabalho: prioriza, filtra e resolve.","Detalhes: histórico, SLA, solicitante e atividades.","Catálogo: cria requisições reais.","Indicadores: métricas e gráficos atualizados.","Automações: regras funcionais aplicadas aos chamados.","Boas práticas: operação madura melhora sempre."];
  let i=0;
  function step(){
    document.querySelectorAll(".redbox").forEach(e=>e.classList.remove("redbox"));
    if(i>=targets.length){ toast("Tour concluído. Vá para Automações, Aula e Certificado."); return; }
    targets[i].classList.add("redbox"); targets[i].scrollIntoView({behavior:"smooth",block:"center"}); toast(msgs[i]); i++; setTimeout(step,2900);
  }
  step();
}

renderCatalog(); renderKb(); renderQuiz(); renderRules(); renderTickets(); selectTicket(selectedId);

const CERT_BG_SRC = "assets/img/certificado-pedra-service.png";
let certPayload = null;
const certBg = new Image();
certBg.src = CERT_BG_SRC;

function fitText(ctx, text, x, y, maxWidth, baseSize, minSize, fontFace, color, align="center") {
  let size = baseSize;
  do {
    ctx.font = `900 ${size}px ${fontFace}`;
    if (ctx.measureText(text).width <= maxWidth || size <= minSize) break;
    size -= 2;
  } while(size > minSize);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawCertificateToCanvas(name, date, hash) {
  const canvas = document.getElementById("certCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const draw = () => {
    ctx.drawImage(certBg, 0, 0, canvas.width, canvas.height);

    // Espaço do NOME DO ALUNO: linha grande logo abaixo de "CERTIFICAMOS QUE".
    // Esse é o campo principal do certificado, sem rótulo "Nome" duplicado.
    ctx.save();
    ctx.shadowColor = "rgba(255,246,210,.85)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    fitText(ctx, name, 768, 332, 820, 48, 22, "Trebuchet MS, Arial", "#2a1b10");
    ctx.restore();

    // Data e hash nos espaços inferiores do modelo.
    fitText(ctx, date, 565, 566, 280, 28, 18, "Trebuchet MS, Arial", "#2a1b10");
    fitText(ctx, hash, 930, 566, 455, 19, 10, "Trebuchet MS, Arial", "#2a1b10");

    // Reforço discreto da assinatura/rodapé mantida como no certificado.
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  };
  if (certBg.complete) draw();
  else certBg.onload = draw;
}

async function grade() {
  let ok=0; questions.forEach((x,i)=>{ const el=document.querySelector(`input[name=q${i}]:checked`); if(el&&Number(el.value)===x.a) ok++; });
  const score=Math.round(ok/questions.length*100);
  if(score<70){ toast(`Você fez ${score}%. Revise e tente de novo.`); return; }
  const name=document.getElementById("studentName").value.trim()||"Participante";
  const date=new Date().toLocaleDateString("pt-BR");
  const hash=await sha256(name+"|Pedra Service ITSM funcional|"+date);
  certPayload = {name,date,hash,score};
  document.getElementById("certWrap").style.display="block";
  drawCertificateToCanvas(name,date,hash);
  document.getElementById("certWrap").scrollIntoView({behavior:"smooth"});
  toast(`Aprovado com ${score}%. Certificado PNG liberado.`);
}

function redrawCertificate() {
  if(!certPayload) {
    toast("Finalize a validação primeiro.");
    return;
  }
  drawCertificateToCanvas(certPayload.name, certPayload.date, certPayload.hash);
  toast("Certificado atualizado.");
}

function downloadCertificatePNG() {
  if(!certPayload) {
    toast("Finalize a validação primeiro.");
    return;
  }
  redrawCertificate();
  const canvas = document.getElementById("certCanvas");
  const a = document.createElement("a");
  const safeName = certPayload.name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"_").replace(/^_+|_+$/g,"") || "participante";
  a.href = canvas.toDataURL("image/png");
  a.download = `certificado_pedra_service_${safeName}.png`;
  a.click();
}

function toggleAudioPanel() {
  document.getElementById("audioRock").classList.toggle("min");
}
function togglePlay() {
  const a = document.getElementById("themeAudio");
  const btn = event.currentTarget;
  a.volume = Number(document.getElementById("volRange").value || 0.35);
  if(a.paused) {
    a.play().then(()=>btn.textContent="⏸").catch(()=>toast("Clique novamente para tocar o áudio."));
  } else {
    a.pause(); btn.textContent="▶";
  }
}
function toggleMute() {
  const a = document.getElementById("themeAudio");
  a.muted = !a.muted;
  event.currentTarget.textContent = a.muted ? "🔈" : "🔇";
}
function setVolume(v) {
  const a = document.getElementById("themeAudio");
  a.volume = Number(v);
  if(a.volume > 0) a.muted = false;
}
document.addEventListener("click", function primeAudio() {
  const a = document.getElementById("themeAudio");
  if(a && a.paused) {
    a.volume = Number(document.getElementById("volRange").value || 0.35);
  }
  document.removeEventListener("click", primeAudio);
}, {once:true});