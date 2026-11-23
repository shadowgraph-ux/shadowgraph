const GraphLayout65=(()=>{
 const source=n=>['document','image','filehash'].includes(n.type),rank={person:0,organization:1,phone:2,email:3,username:4,address:5,employment:6,education:7,income:8,date:9};
 function groups(nodes,edges){const map=new Map(nodes.map(n=>[n.id,n])),adj=new Map(nodes.map(n=>[n.id,[]]));for(const e of edges){const a=map.get(e.from),b=map.get(e.to);if(a&&b&&!source(a)&&!source(b)&&a.id!==b.id){adj.get(a.id).push(b.id);adj.get(b.id).push(a.id)}}const people=nodes.filter(n=>n.type==='person').sort((a,b)=>adj.get(b.id).length-adj.get(a.id).length||a.id.localeCompare(b.id)),owners=new Map,shared=[];for(const n of nodes.filter(n=>!source(n)&&n.type!=='person')){const direct=[...new Set(adj.get(n.id).filter(id=>map.get(id).type==='person'))];if(direct.length===1)owners.set(n.id,direct[0]);else if(direct.length>1)shared.push(n.id)}for(let pass=0;pass<4;pass++){let changed=false;for(const n of nodes){if(source(n)||n.type==='person'||owners.has(n.id)||shared.includes(n.id))continue;const candidates=new Set(adj.get(n.id).map(id=>owners.get(id)).filter(Boolean));if(candidates.size===1){owners.set(n.id,[...candidates][0]);changed=true}}if(!changed)break}const result=people.map(p=>({id:p.id,title:p.label,root:p.id,ids:[p.id,...nodes.filter(n=>owners.get(n.id)===p.id).map(n=>n.id)]})),used=new Set(result.flatMap(g=>g.ids));if(shared.length)result.push({id:'shared65',title:'Общие объекты',ids:shared});const remaining=nodes.filter(n=>!source(n)&&!used.has(n.id)&&!shared.includes(n.id));if(remaining.length)result.push({id:'other65',title:people.length?'Другие сведения':'Карта связей',ids:remaining.map(n=>n.id)});const materials=nodes.filter(source);if(materials.length)result.push({id:'sources65',title:'Материалы и контрольные суммы',ids:materials.map(n=>n.id)});return{groups:result,map,adj,people}}
 function cards(nodes,edges,aspect=1.6){const model=groups(nodes,edges),positions={},panels=[];for(const group of model.groups){const content=group.ids.filter(id=>id!==group.root).sort((a,b)=>(rank[model.map.get(a).type]??12)-(rank[model.map.get(b).type]??12)||String(model.map.get(a).label).localeCompare(String(model.map.get(b).label),'ru'));const cols=Math.min(6,Math.max(1,Math.ceil(Math.sqrt(Math.max(1,content.length)*1.25)))),rows=Math.max(1,Math.ceil(content.length/cols)),hasRoot=!!group.root,w=(cols+(hasRoot?1:0))*382+70,h=rows*198+120,local={};if(group.root)local[group.root]={x:185,y:90+(rows-1)*99};content.forEach((id,i)=>local[id]={x:185+(hasRoot?1:0)*382+(i%cols)*382,y:90+Math.floor(i/cols)*198});panels.push({...group,w,h,local})}const area=panels.reduce((a,p)=>a+(p.w+120)*(p.h+120),0),target=Math.max(...panels.map(p=>p.w),Math.sqrt(area*Math.max(.8,aspect)));let x=0,y=0,rowH=0;for(const p of panels){if(x&&x+p.w>target){x=0;y+=rowH+140;rowH=0}for(const id of p.ids)positions[id]={x:x+p.local[id].x,y:y+p.local[id].y};p.x=x;p.y=y;p.ids=[...p.ids];delete p.local;x+=p.w+140;rowH=Math.max(rowH,p.h)}const occupied=[];for(const n of nodes.filter(n=>n.pinned)){positions[n.id]={x:Number(n.x)||0,y:Number(n.y)||0};occupied.push(positions[n.id])}for(const n of nodes.filter(n=>!n.pinned)){let p=positions[n.id]||{x:0,y:0},i=0;while(occupied.some(q=>Math.abs(p.x-q.x)<326&&Math.abs(p.y-q.y)<162)&&i++<1000)p={x:p.x+382,y:p.y+(i%7===0?198:0)};positions[n.id]=p;occupied.push(p)}for(const p of panels){const all=p.ids.map(id=>positions[id]);p.x=Math.min(...all.map(n=>n.x))-170;p.y=Math.min(...all.map(n=>n.y))-100;p.w=Math.max(...all.map(n=>n.x))+170-p.x;p.h=Math.max(...all.map(n=>n.y))+100-p.y}return{positions,panels}}
 function network(nodes,edges){const model=groups(nodes,edges),positions={},panels=model.groups,centers=new Map,normal=panels.filter(g=>g.id!=='sources65'),count=Math.max(1,normal.length);normal.forEach((g,i)=>{const angle=(i-1)*2.39996323,r=i?Math.max(400,210*Math.sqrt(i)):0;centers.set(g.id,{x:Math.cos(angle)*r,y:Math.sin(angle)*r,z:i?Math.sin(i*1.8)*160:0})});let radius=500;for(const g of normal){const c=centers.get(g.id),ids=g.ids.filter(id=>id!==g.root),ringR=Math.max(95,30*Math.sqrt(ids.length));if(g.root)positions[g.root]={...c};ids.sort((a,b)=>(rank[model.map.get(a).type]??12)-(rank[model.map.get(b).type]??12)||a.localeCompare(b));ids.forEach((id,i)=>{const a=i*2.39996323,r=ringR*.4+35*Math.sqrt(i+1);positions[id]={x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r,z:c.z+Math.sin(a*1.7)*Math.min(110,ringR*.7)}});radius=Math.max(radius,Math.hypot(c.x,c.y)+ringR+120)}const materials=panels.find(g=>g.id==='sources65');if(materials)materials.ids.forEach((id,i)=>{const a=2*Math.PI*i/Math.max(1,materials.ids.length);positions[id]={x:Math.cos(a)*(radius+160),y:Math.sin(a)*(radius+160),z:-200}});return{positions,groups:panels.map(g=>({id:g.id,title:g.title,ids:g.ids}))}}
 return{cards,network,source,groups};
})();


const GraphLayout66=(()=>{
 const rank={phone:1,email:2,username:3,address:4,date:5,profilefact:6,organization:7,employment:8,income:9,education:10};
 function cards(nodes,edges,aspect=1.6){if(!nodes.length)return{positions:{},panels:[]};const model=GraphLayout65.groups(nodes,edges),positions={},panels=[];
 for(const group of model.groups){const ids=group.ids.filter(id=>id!==group.root),available=new Set(ids),branches=[];while(available.size){const seed=[...available].sort((a,b)=>(rank[model.map.get(a).type]??15)-(rank[model.map.get(b).type]??15)||String(model.map.get(a).label).localeCompare(String(model.map.get(b).label),'ru'))[0],queue=[seed],branch=[];available.delete(seed);for(let q=0;q<queue.length;q++){const id=queue[q];branch.push(id);for(const other of model.adj.get(id)||[])if(available.has(other)){available.delete(other);queue.push(other)}}branches.push(branch)}
 const total=ids.length,cols=group.root?(total<=8?2:4):Math.min(5,Math.max(1,Math.ceil(Math.sqrt(total*1.4)))),columns=Array.from({length:cols},()=>[]),capacity=Math.max(1,Math.ceil(total/cols));for(const branch of branches)for(let start=0;start<branch.length;start+=capacity){const target=columns.reduce((best,c,i)=>c.length<columns[best].length?i:best,0);columns[target].push(...branch.slice(start,start+capacity))}
 const rows=Math.max(1,...columns.map(c=>c.length)),stepX=426,stepY=222,hasRoot=!!group.root,centerCol=cols/2,rootX=185+centerCol*stepX,rootY=115+(rows-1)*stepY/2,local={};if(hasRoot)local[group.root]={x:rootX,y:rootY};for(let col=0;col<cols;col++){const x=185+(hasRoot&&col>=centerCol?col+1:col)*stepX,column=columns[col];column.forEach((id,row)=>local[id]={x,y:115+(row+(rows-column.length)/2)*stepY})}const w=(cols+(hasRoot?1:0)-1)*stepX+370,h=(rows-1)*stepY+230;panels.push({...group,w,h,local})}
 const area=panels.reduce((a,p)=>a+(p.w+150)*(p.h+150),0),target=Math.max(...panels.map(p=>p.w),Math.sqrt(area*Math.max(.85,aspect)));let x=0,y=0,rowH=0;for(const p of panels){if(x&&x+p.w>target){x=0;y+=rowH+170;rowH=0}for(const id of p.ids)positions[id]={x:x+p.local[id].x,y:y+p.local[id].y};p.x=x;p.y=y;delete p.local;x+=p.w+170;rowH=Math.max(rowH,p.h)}
 const occupied=[];for(const n of nodes.filter(n=>n.pinned)){positions[n.id]={x:Number(n.x)||0,y:Number(n.y)||0};occupied.push(positions[n.id])}for(const n of nodes.filter(n=>!n.pinned)){let p=positions[n.id],i=0;while(occupied.some(q=>Math.abs(p.x-q.x)<326&&Math.abs(p.y-q.y)<168)&&i++<3000)p={x:p.x+426,y:p.y+(i%7===0?222:0)};positions[n.id]=p;occupied.push(p)}for(const p of panels){const all=p.ids.map(id=>positions[id]);p.x=Math.min(...all.map(n=>n.x))-174;p.y=Math.min(...all.map(n=>n.y))-110;p.w=Math.max(...all.map(n=>n.x))+174-p.x;p.h=Math.max(...all.map(n=>n.y))+110-p.y}return{positions,panels}}
 return{cards};
})();

const DossierLayout=(()=>{
const isSource=n=>n.type==='document'||n.type==='image';
function arrange(nodes,edges,{aspect=1.4,mode='dossier'}={}){
 const map=new Map(nodes.map(n=>[n.id,n])),sources=nodes.filter(isSource),owners=new Map(nodes.map(n=>[n.id,new Set]));
 for(const e of edges){const a=map.get(e.from),b=map.get(e.to);if(!a||!b)continue;if(isSource(a)&&!isSource(b))owners.get(b.id).add(a.id);if(isSource(b)&&!isSource(a))owners.get(a.id).add(b.id)}
 for(const n of nodes)for(const ev of n.evidence||[]){const source=sources.find(s=>s.fileId===ev.fileId);if(source&&!isSource(n))owners.get(n.id).add(source.id)}
 const definitions=sources.map(n=>({id:n.id,title:n.label,subtitle:'Материалы этого источника',source:n.id,ids:[n.id]})),shared={id:'shared',title:'Общие находки',subtitle:'Упоминаются в нескольких источниках',ids:[]},manual={id:'other',title:sources.length?'Другие объекты':'Карта связей',subtitle:'Ручные объекты и связи',ids:[]};
 for(const n of nodes.filter(n=>!isSource(n))){const ids=[...owners.get(n.id)];if(ids.length>1)shared.ids.push(n.id);else if(ids.length===1)(definitions.find(g=>g.id===ids[0])||manual).ids.push(n.id);else manual.ids.push(n.id)}
 // Relate unassigned manual objects to a source only when directly linked to a sourced object.
 const groups=[...definitions,...(shared.ids.length?[shared]:[]),...(manual.ids.length?[manual]:[])],points=new Map,panelData=[];
 const rank={person:0,phone:1,email:2,username:3,address:4,organization:5,document:-1,image:-1};
 for(const group of groups){const content=group.ids.filter(id=>id!==group.source).sort((a,b)=>(rank[map.get(a).type]??6)-(rank[map.get(b).type]??6)||map.get(a).label.localeCompare(map.get(b).label,'ru'));const counts=new Map;for(const id of content){const type=map.get(id).type;counts.set(type,(counts.get(type)||0)+1)}let columns=1,bestShape=Infinity;const shapeAspect=Math.max(.85,Math.min(aspect,1.9));for(let c=1;c<=Math.min(12,Math.max(1,content.length));c++){const rows=[...counts.values()].reduce((sum,n)=>sum+Math.ceil(n/c),0),width=c*420+48,height=(group.source?300:116)+rows*216+100,score=Math.max(width/shapeAspect,height)+(c*rows-content.length)*2.5;if(score<bestShape){bestShape=score;columns=c}}const w=columns*420+48;let nextY=116;
 if(group.source){points.set(group.source,{x:w/2,y:116});nextY=350}
 // Type headings divide large lists without implying ownership of contacts.
 let row=0;const byType=new Map;for(const id of content){const t=map.get(id).type;if(!byType.has(t))byType.set(t,[]);byType.get(t).push(id)}for(const ids of byType.values()){ids.forEach((id,i)=>points.set(id,{x:194+(i%columns)*420,y:nextY+(row+Math.floor(i/columns) )*216}));row+=Math.ceil(ids.length/columns)}
 const h=Math.max(group.source?226:110,...group.ids.map(id=>(points.get(id)?.y||116)+105));panelData.push({...group,w,h});
 }
 const totalArea=panelData.reduce((sum,p)=>sum+(p.w+120)*(p.h+110),0),result=new Map,common=null,others=panelData.slice().sort((a,b)=>(b.w*b.h)-(a.w*a.h));
 function pack(width){const placed=[];let x=0,y=0,rowHeight=0;for(const p of others){if(x&&x+p.w>width){x=0;y+=rowHeight+100;rowHeight=0}placed.push({...p,x,y});x+=p.w+100;rowHeight=Math.max(rowHeight,p.h)}const w=Math.max(1,...placed.map(p=>p.x+p.w)),h=Math.max(1,...placed.map(p=>p.y+p.h));return{placed,w,h}}
 const widths=new Set([Math.max(1,...others.map(p=>p.w)),Math.sqrt(totalArea*Math.max(.5,aspect))]);for(let i=1;i<=Math.min(8,others.length);i++)widths.add(others.slice(0,i).reduce((s,p)=>s+p.w+100,0));let best=null;for(const width of widths){const candidate=pack(width),w=Math.max(candidate.w,common?.w||0),h=candidate.h+(common?common.h+90:0),score=Math.max(w/Math.max(.5,aspect),h);if(!best||score<best.score)best={...candidate,score}}
 const panels=best?.placed||[];if(common){const w=Math.max(best.w,common.w);for(const p of panels){p.x+=(w-best.w)/2;p.y+=common.h+90}panels.unshift({...common,x:(w-common.w)/2,y:0})}
 for(const p of panels)for(const id of p.ids){const local=points.get(id);result.set(id,{x:p.x+local.x,y:p.y+local.y})}
 // Preserve pinned objects, and move other cards away from all existing card rectangles.
 const occupied=[];for(const n of nodes.filter(n=>n.pinned)){const p={x:Number(n.x)||0,y:Number(n.y)||0};result.set(n.id,p);occupied.push(p)}
 const collision=p=>occupied.some(q=>Math.abs(p.x-q.x)<320&&Math.abs(p.y-q.y)<166);
 for(const n of nodes.filter(n=>!n.pinned)){const base=result.get(n.id)||{x:0,y:0};let p=base,i=0;while(collision(p)){i++;p={x:base.x+(i%2)*338,y:base.y+Math.ceil(i/2 )*216}}result.set(n.id,p);occupied.push(p)}
 for(const p of panels){const ps=p.ids.map(id=>result.get(id));p.x=Math.min(...ps.map(n=>n.x))-170;p.y=Math.min(...ps.map(n=>n.y))-112;p.w=Math.max(...ps.map(n=>n.x))+170-p.x;p.h=Math.max(...ps.map(n=>n.y))+100-p.y}
 return{positions:result,panels:mode==='plain'?[]:panels};
}
return{arrange,isSource};
})();

GraphLayout65.network=function(nodes,edges){
 const model=GraphLayout65.groups(nodes,edges),positions={},normal=model.groups.filter(g=>g.id!=='sources65'),panels=[],step=155;
 for(const g of normal){const ids=g.ids.filter(id=>id!==g.root).sort((a,b)=>String(model.map.get(a).type).localeCompare(String(model.map.get(b).type))||a.localeCompare(b)),r=Math.max(180,step*.67*Math.sqrt(ids.length+1));panels.push({g,ids,r,w:r*2+240,h:r*2+240})}
 const area=panels.reduce((s,p)=>s+p.w*p.h,0),target=Math.max(800,...panels.map(p=>p.w),Math.sqrt(area*1.65));let x=0,y=0,rowH=0;
 for(const p of panels){if(x&&x+p.w>target){x=0;y+=rowH+130;rowH=0}const cx=x+p.w/2,cy=y+p.h/2,cz=Math.sin(panels.indexOf(p)*1.9)*180;if(p.g.root)positions[p.g.root]={x:cx,y:cy,z:cz};p.ids.forEach((id,i)=>{const angle=i*2.39996323,rr=p.g.root?Math.sqrt(i+2)*step*.63:Math.sqrt(i)*step*.63;positions[id]={x:cx+Math.cos(angle)*rr,y:cy+Math.sin(angle)*rr,z:cz+Math.sin(angle*1.17)*Math.min(300,90+rr*.48)}});x+=p.w+130;rowH=Math.max(rowH,p.h)}
 const materials=model.groups.find(g=>g.id==='sources65');if(materials)materials.ids.forEach((id,i)=>{positions[id]={x:(i%8)*step,y:y+rowH+250+Math.floor(i/8)*step,z:-260}});
 return{positions,groups:model.groups.map(g=>({id:g.id,title:g.title,ids:g.ids}))}
};

function MaltegoLayout697(nodes,edges){
 const model=GraphLayout65.groups(nodes,edges),rank={person:0,date:1,phone:2,email:3,username:4,account:4,organization:5,employment:6,education:7,income:8,address:9,profilefact:10},panels=[],positions={};
 for(const group of model.groups){const ids=group.ids.filter(id=>id!==group.root).sort((a,b)=>(rank[model.map.get(a).type]??20)-(rank[model.map.get(b).type]??20)||String(model.map.get(a).label).localeCompare(String(model.map.get(b).label),'ru')),local={},count=ids.length,rings=Math.max(1,Math.ceil(count/12));let used=0,outer=0;if(group.root)local[group.root]={x:0,y:0,z:0};
  for(let ring=0;ring<rings;ring++){const remaining=count-used,size=Math.ceil(remaining/(rings-ring)),radius=group.root||rings>1?Math.max(280,size*215/(2*Math.PI))+ring*285:Math.max(230,size*215/(2*Math.PI));outer=Math.max(outer,radius);for(let i=0;i<size;i++){const angle=-Math.PI/2+i*Math.PI*2/size+(ring%2?Math.PI/Math.max(1,size):0);local[ids[used++]]={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius,z:0}}}
  const radius=count?outer:50;panels.push({group,local,w:radius*2+420,h:radius*2+260})
 }
 const area=panels.reduce((s,p)=>s+(p.w+120)*(p.h+120),0),target=Math.max(900,...panels.map(p=>p.w),Math.sqrt(area*1.6));let x=0,y=0,rowH=0;for(const panel of panels){if(x&&x+panel.w>target){x=0;y+=rowH+170;rowH=0}for(const id of panel.group.ids){const p=panel.local[id];if(p)positions[id]={x:x+panel.w/2+p.x,y:y+panel.h/2+p.y,z:0}}x+=panel.w+170;rowH=Math.max(rowH,panel.h)}return{positions,groups:model.groups.map(g=>({id:g.id,title:g.title,ids:g.ids}))}
}

function CirclesLayout698(nodes,edges){const result=MaltegoLayout697(nodes,edges);for(const p of Object.values(result.positions))p.z=0;return result}
function SpaceLayout698(nodes,edges){const model=GraphLayout65.groups(nodes,edges),groups=model.groups.filter(g=>g.id!=='sources65'),positions={},gold=Math.PI*(3-Math.sqrt(5));for(const [index,g]of groups.entries()){const ids=g.ids.filter(id=>id!==g.root).sort(),radius=Math.max(260,92*Math.sqrt(Math.max(1,ids.length))),shell=Math.floor(Math.max(0,index-1)/12),slot=Math.max(0,index-1)%12,u=(slot+.5)/Math.min(12,Math.max(1,groups.length-1)),v=1-2*u,rr=Math.sqrt(Math.max(0,1-v*v)),angle=(slot+shell*.7)*gold,dist=(Math.max(700,92*Math.sqrt(groups[0]?.ids.length||1))+radius+360)+shell*740,center=index?{x:Math.cos(angle)*rr*dist,y:v*dist,z:Math.sin(angle)*rr*dist}:{x:0,y:0,z:0};if(g.root)positions[g.root]={...center};ids.forEach((id,i)=>{const y=1-2*(i+.5)/Math.max(1,ids.length),r=Math.sqrt(Math.max(0,1-y*y)),a=i*gold+.8,range=radius*(.82+.18*(i%3)/2);positions[id]={x:center.x+Math.cos(a)*r*range,y:center.y+y*range,z:center.z+Math.sin(a)*r*range}})}const sources=model.groups.find(g=>g.id==='sources65');sources?.ids.forEach((id,i)=>positions[id]={x:(i%10)*230,y:Math.floor(i/10)*230,z:-1500});return{positions,groups:model.groups.map(g=>({id:g.id,title:g.title,ids:g.ids}))}}

const Geometry712=(()=>{
  const compare=(first,second)=>String(first).localeCompare(String(second),'ru');
  const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  function pack(panels,aspect,gap){
    if(!panels.length)return [];
    const ordered=[...panels].sort((a,b)=>b.h-a.h||b.w-a.w);
    const maxWidth=ordered.reduce((max,p)=>Math.max(max,p.w),1);
    const area=ordered.reduce((sum,p)=>sum+(p.w+gap)*(p.h+gap),0);
    const ideal=Math.sqrt(area*aspect);
    let best=null;
    for(const limit of new Set([maxWidth,...[.75,.95,1,1.18,1.4,1.7].map(weight=>Math.max(maxWidth,ideal*weight))])){
      const rows=[];
      for(const panel of ordered){
        let row=rows.find(candidate=>candidate.w+gap+panel.w<=limit);
        if(!row){row={w:0,h:panel.h,items:[]};rows.push(row)}
        const x=row.w?row.w+gap:0;
        row.items.push({...panel,x});
        row.w=x+panel.w;
      }
      const w=rows.reduce((max,row)=>Math.max(max,row.w),1);
      const h=rows.reduce((sum,row)=>sum+row.h+gap,-gap);
      const score=Math.max(w/aspect,h)+.12*(w/aspect+h);
      if(best&&score>=best.score)continue;
      let y=0;
      const placed=[];
      for(const row of rows){
        for(const panel of row.items)placed.push({...panel,x:panel.x+(w-row.w)/2,y});
        y+=row.h+gap;
      }
      best={score,placed};
    }
    return best.placed;
  }
  function cardGroups735(model){
    return model.groups.flatMap(group=>{
      if(!['other65','shared65'].includes(group.id)||group.ids.length<2)return [group];
      const remaining=new Set(group.ids),components=[],isolated=[];
      for(const seed of group.ids){
        if(!remaining.delete(seed))continue;
        const ids=[seed];
        for(let i=0;i<ids.length;i++){
          for(const neighbor of model.adj.get(ids[i]))if(remaining.delete(neighbor))ids.push(neighbor);
        }
        if(ids.length===1)isolated.push(seed);
        else components.push({id:group.id+'-'+seed,title:model.map.get(seed).label,ids});
      }
      if(!components.length)return [group];
      if(isolated.length)components.push({id:group.id+'-isolated',title:group.title,ids:isolated});
      return components;
    });
  }

  function cards(nodes,edges,aspect=1.6){
    const model=GraphLayout65.groups(nodes,edges),positions=Object.create(null);
    const dense=nodes.length>=180,stepX=dense?350:394,stepY=dense?174:204;
    aspect=Math.min(2.3,Math.max(.65,aspect||1.6));
    const raw=cardGroups735(model).map(group=>{
      const ids=group.ids.filter(id=>id!==group.root);
      const keys=new Set(ids);
      const sorted=ids.sort((a,b)=>compare(model.map.get(a).type,model.map.get(b).type)||compare(model.map.get(a).label,model.map.get(b).label)||compare(a,b));
      const visited=new Set(),ordered=[];
      for(const seed of sorted){
        if(visited.has(seed))continue;
        const queue=[seed];
        visited.add(seed);
        for(let index=0;index<queue.length;index++){
          const id=queue[index];
          ordered.push(id);
          for(const other of model.adj.get(id)||[])if(keys.has(other)&&!visited.has(other)){visited.add(other);queue.push(other)}
        }
      }
      if(dense){
        const orderedIds=group.root?[group.root,...ordered]:ordered;
        const cols=Math.min(13,Math.max(1,Math.round(Math.sqrt(orderedIds.length*aspect*stepY/stepX))));
        const rows=Math.max(1,Math.ceil(orderedIds.length/cols)),local=Object.create(null);
        orderedIds.forEach((id,index)=>{local[id]={x:184+(index%cols)*stepX,y:114+Math.floor(index/cols)*stepY}});
        return {...group,local,w:368+(cols-1)*stepX,h:222+(rows-1)*stepY};
      }
      const cols=Math.min(8,Math.max(1,Math.round(Math.sqrt((ordered.length+(group.root?1:0))*aspect*stepY/stepX))));
      const columns=Array.from({length:cols},(_,index)=>{
        const start=Math.round(index*ordered.length/cols),end=Math.round((index+1)*ordered.length/cols);
        return ordered.slice(start,end);
      });
      const rows=columns.reduce((max,column)=>Math.max(max,column.length),1);
      const anchor=Math.floor(cols/2),local=Object.create(null);
      if(group.root)local[group.root]={x:184+anchor*stepX,y:124+(rows-1)*stepY/2};
      for(const [index,column] of columns.entries()){
        const x=184+(index+(group.root&&index>=anchor?1:0))*stepX;
        column.forEach((id,row)=>{local[id]={x,y:124+(row+(rows-column.length)/2)*stepY}});
      }
      if(!ordered.length)return{...group,local,w:368,h:226};
      return{...group,local,w:368+(cols+(group.root?1:0)-1)*stepX,h:226+(rows-1)*stepY};
    });
    const panels=pack(raw,aspect,dense?76:128);
    for(const panel of panels)for(const id of panel.ids)positions[id]={x:panel.x+panel.local[id].x,y:panel.y+panel.local[id].y};
    const cells=new Map(),clearX=334,clearY=166;
    const cell=(x,y)=>x+','+y;
    function occupy(p){
      const key=cell(Math.floor(p.x/clearX),Math.floor(p.y/clearY));
      if(!cells.has(key))cells.set(key,[]);
      cells.get(key).push(p);
    }
    function blocked(p){
      const x=Math.floor(p.x/clearX),y=Math.floor(p.y/clearY);
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)
        if(cells.get(cell(x+dx,y+dy))?.some(other=>Math.abs(other.x-p.x)<clearX&&Math.abs(other.y-p.y)<clearY))return true;
      return false;
    }
    for(const node of nodes)if(node.pinned){
      positions[node.id]={x:Number.isFinite(node.x)?node.x:0,y:Number.isFinite(node.y)?node.y:0};
      occupy(positions[node.id]);
    }
    for(const node of nodes)if(!node.pinned){
      const origin=positions[node.id];
      let p=origin;
      for(let distance=1;blocked(p);distance++){
        const row=Math.ceil(distance/2);
        p={x:origin.x,y:origin.y+(distance%2?1:-1)*row*stepY};
      }
      positions[node.id]=p;
      occupy(p);
    }
    return{positions,panels:panels.map(({local,...panel})=>{
      const bounds=panel.ids.reduce((acc,id)=>{
        const p=positions[id];
        return{left:Math.min(acc.left,p.x-180),right:Math.max(acc.right,p.x+180),top:Math.min(acc.top,p.y-116),bottom:Math.max(acc.bottom,p.y+98)};
      },{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});
      return{...panel,x:bounds.left,y:bounds.top,w:bounds.right-bounds.left,h:bounds.bottom-bounds.top};
    })};
  }
  function space(nodes,edges){
    const model=GraphLayout65.groups(nodes,edges),positions=Object.create(null),gold=Math.PI*(3-Math.sqrt(5));
    const raw=model.groups.map(group=>{
      const ids=group.ids.filter(id=>id!==group.root).sort((a,b)=>compare(model.map.get(a).type,model.map.get(b).type)||compare(a,b));
      const radius=ids.length>1?Math.max(142,76*Math.sqrt(ids.length)):group.root&&ids.length?148:0;
      return{...group,ids, radius,w:2*radius+180,h:2*radius+154};
    });
    for(const [index,panel] of pack(raw,1.45,94).entries()){
      const center={x:panel.x+panel.w/2,y:panel.y+panel.h/2,z:Math.sin(index*gold)*110};
      if(panel.root)positions[panel.root]=center;
      panel.ids.forEach((id,slot)=>{
        const fraction=(slot+.5)/panel.ids.length,vertical=1-2*fraction;
        const radial=Math.sqrt(Math.max(0,1-vertical*vertical)),angle=slot*gold+.82;
        positions[id]={x:center.x+Math.cos(angle)*radial*panel.radius,y:center.y+vertical*panel.radius,z:center.z+Math.sin(angle)*radial*panel.radius*.88};
      });
    }
    return{positions,groups:model.groups.map(({id,title,ids})=>({id,title,ids}))};
  }
  function parallel(edges){
    const lists=new Map(),offsets=new Map();
    for(const edge of edges){
      const key=JSON.stringify(edge.from<edge.to?[edge.from,edge.to]:[edge.to,edge.from]);
      if(!lists.has(key))lists.set(key,[]);
      lists.get(key).push(edge);
    }
    for(const list of lists.values()){
      list.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
      const step=Math.min(24,156/Math.max(1,list.length-1));
      list.forEach((edge,index)=>offsets.set(edge.id,edge.from===edge.to?index:(index-(list.length-1)/2)*step*(edge.from<edge.to?1:-1)));
    }
    return offsets;
  }
  function curve(a,b,offset,three,rectangular,self,direction){
    let start,end,first,second;
    if(self){
      const r=a.r,reach=22+Math.min(offset,12)*9+r;
      start={x:a.x-r*.74,y:a.y-r*.72};end={x:a.x+r*.86,y:a.y-r*.72};
      first={x:a.x-reach,y:a.y-reach*1.7};second={x:a.x+reach,y:a.y-reach*1.7};
    }else{
      const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
      if(length<a.r+b.r+4)return null;
      const ux=dx/length,uy=dy/length,nx=-uy,ny=ux;
      const radius=p=>rectangular&&p.n.type!=='person'?p.r/Math.max(Math.abs(ux),Math.abs(uy)):p.r;
      const gapA=radius(a)+2,gapB=radius(b)+4;
      if(length<=gapA+gapB)return null;
      start={x:a.x+ux*gapA,y:a.y+uy*gapA};
      end={x:b.x-ux*gapB,y:b.y-uy*gapB};
      const mid=midpoint(start,end),swing=offset+direction*(three?Math.min(24,length*.08):Math.min(12,length*.05));
      first={x:(start.x+mid.x)/2+nx*swing,y:(start.y+mid.y)/2+ny*swing};
      second={x:(end.x+mid.x)/2+nx*swing,y:(end.y+mid.y)/2+ny*swing};
    }
    function point(t){
      const u=1-t;
      return{x:u*u*u*start.x+3*u*u*t*first.x+3*u*t*t*second.x+t*t*t*end.x,y:u*u*u*start.y+3*u*u*t*first.y+3*u*t*t*second.y+t*t*t*end.y};
    }
    return{start,end,first,second,point};
  }
  return{cards,space,parallel,curve,pack716:pack};
})();

GraphLayout66.cards=Geometry712.cards;
SpaceLayout698=Geometry712.space;
function Maltego716(nodes,edges){
  const map=new Map(nodes.map(n=>[n.id,n])),adj=new Map(nodes.map(n=>[n.id,new Set()])),positions=Object.create(null);
  for(const e of edges)if(e.from!==e.to&&adj.has(e.from)&&adj.has(e.to)){adj.get(e.from).add(e.to);adj.get(e.to).add(e.from)}
  const primary=n=>n.type==='person'?5:n.type==='organization'?3:0;
  const rank=(a,b)=>adj.get(b.id).size-adj.get(a.id).size||primary(b)-primary(a)||String(a.label).localeCompare(String(b.label),'ru')||String(a.id).localeCompare(String(b.id));
  const seen=new Set(),panels=[];
  for(const root of [...nodes].sort(rank)){
    if(seen.has(root.id))continue;
    const queue=[root.id],depth=new Map([[root.id,0]]);
    seen.add(root.id);
    for(let index=0;index<queue.length;index++){
      const id=queue[index],neighbours=[...adj.get(id)].sort((a,b)=>rank(map.get(a),map.get(b)));
      for(const other of neighbours)if(!seen.has(other)){seen.add(other);depth.set(other,depth.get(id)+1);queue.push(other)}
    }
    const local=new Map([[root.id,{x:0,y:0}]]),angles=new Map([[root.id,0]]);
    let offset=1,radius=0,ring=0;
    while(offset<queue.length){
      const ids=queue.slice(offset,offset+12+ring*8);
      const parents=id=>[...adj.get(id)].find(link=>angles.has(link)&&depth.get(link)<depth.get(id))||root.id;
      const anchors=new Map(ids.map(id=>[id,angles.get(parents(id))]));
      ids.sort((a,b)=>anchors.get(a)-anchors.get(b)||rank(map.get(a),map.get(b)));
      radius=Math.max(radius+210,ids.length*155/(Math.PI*2));
      const slots=ids.map((_,index)=>{
        const angle=-Math.PI*.64+(index+.36+ring*.22)*Math.PI*2/ids.length;
        return{angle,x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*.83};
      });
      const live=new Map(ids.map((id,index)=>[id,slots[index]]));
      const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
      const loss=(id,sibling,at)=>{let sum=0;for(const other of adj.get(id)){if(other===sibling)continue;const target=live.get(other)||local.get(other);if(target)sum+=distance(at,target)}return sum};
      for(let pass=0;pass<4;pass++){
        for(let i=0;i<ids.length;i++){
          const j=(i+(pass%2===0?1:2))%ids.length;
          if(j===i)continue;
          const x=ids[i],y=ids[j],a=slots[i],b=slots[j];
          if(loss(x,y,b)+loss(y,x,a)+.5<loss(x,y,a)+loss(y,x,b)){
            [ids[i],ids[j]]=[y,x];live.set(x,b);live.set(y,a);
          }
        }
      }
      for(const [index,id] of ids.entries()){
        const {angle,x,y}=slots[index];angles.set(id,angle);local.set(id,{x,y});
      }
      offset+=ids.length;ring++;
    }
    panels.push({root,local,w:radius*2+312,h:radius*1.66+200});
  }
  const arranged=Geometry712.pack716(panels,1.55,72);
  for(const panel of arranged)for(const [id,p] of panel.local){
    positions[id]={x:panel.x+panel.w/2+p.x,y:panel.y+panel.h/2+p.y,z:0};
  }
  return{positions,groups:arranged.map(({root,local})=>({id:root.id,title:root.label,ids:[...local.keys()]}))};
}


self.onmessage=({data})=>{try{let result;if(data.mode==='space698')result=SpaceLayout698(data.nodes,data.edges);else if(data.mode==='circles698')result=CirclesLayout698(data.nodes,data.edges);else if(data.mode==='maltego')result=Maltego716(data.nodes,data.edges);else if(data.mode==='network')result=GraphLayout65.network(data.nodes,data.edges);else if(data.mode==='sources'){const r=DossierLayout.arrange(data.nodes,data.edges,{aspect:data.aspect||1.5,mode:'dossier'});result={positions:Object.fromEntries(r.positions),panels:r.panels}}else result=GraphLayout66.cards(data.nodes,data.edges,data.aspect||1.5);self.postMessage({id:data.id,...result})}catch(e){self.postMessage({id:data.id,error:String(e.message)})}};