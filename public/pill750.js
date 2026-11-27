(() => {
  'use strict';

  const groups = [
    ['.auth744 .login-form738 nav', 'auth'],
    ['.sg-home-side67 nav', 'portal', 'vertical'],
    ['.sg-settings67 aside nav', 'settings', 'vertical'],
    ['.sg-policy-tabs67', 'policy'],
    ['.guide-layout739 nav', 'guide', 'vertical'],
    ['.case-tabs708', 'pdf'],
    ['.fw-scope736', 'framework'],
    ['.camera-mode720', 'camera'],
    ['.tabs747', 'stats']
  ];
  const selector = groups.map(([match]) => match).join(',');
  const selected = 'button:is([aria-current="page"],[aria-selected="true"],[aria-pressed="true"],.active)';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lead = [620, 36], trail = [190, 19];
  const mounted = new Map(), queued = new Set(), moving = new Set(), origins = new Map();
  let measureFrame = 0, animateFrame = 0, previousTime = 0;

  function paint(state) {
    const {pill, edges} = state;
    const [left, right, top, bottom] = edges.map(edge => edge.position);
    // The 1px element is scaled to the desired size. This leaves layout untouched.
    pill.style.transform = 'translate3d('+left+'px,'+top+'px,0)';
    state.fill.style.transform = 'scale3d('+Math.max(right-left,1)+','+Math.max(bottom-top,1)+',1)';
    // Keep rounded corners at a constant size while the edges stretch.
    state.fill.style.borderRadius = 'calc(var(--sg-pill-radius, 9px) / '+Math.max(right-left,1)+') / calc(var(--sg-pill-radius, 9px) / '+Math.max(bottom-top,1)+')';
  }

  function advance(time) {
    animateFrame = 0;
    const step = Math.min((time-previousTime)/1000 || 1/60, 1/30)/4;
    previousTime = time;
    for (const state of moving) {
      if (!state.group.isConnected) { moving.delete(state); continue; }
      let settled = true;
      for (const edge of state.edges) {
        const [stiffness,damping] = edge.spring;
        for (let i=0; i<4; i++) {
          edge.velocity += (stiffness*(edge.target-edge.position)-damping*edge.velocity)*step;
          edge.position += edge.velocity*step;
        }
        if (Math.abs(edge.position-edge.target)<.12 && Math.abs(edge.velocity)<2) {
          edge.position = edge.target;
          edge.velocity = 0;
        } else settled = false;
      }
      paint(state);
      if (settled) moving.delete(state);
    }
    if (moving.size) animateFrame = requestAnimationFrame(advance);
  }

  function update(state) {
    const active = [...state.group.children].find(el => el.matches(selected) && !el.disabled && el.getClientRects().length);
    state.pill.hidden = !active;
    state.group.classList.toggle('has-pill750',Boolean(active));
    if (!active) { moving.delete(state); return; }
    const box = [active.offsetLeft,active.offsetLeft+active.offsetWidth,active.offsetTop,active.offsetTop+active.offsetHeight];
    const last = state.edges?.map(edge => edge.target);
    const link = origins.get(state.key);
    const origin = link && performance.now()-link.time<500 && link.item===active.id+active.textContent ? link.box : null;
    if (!state.edges && link) origins.delete(state.key);
    const before = state.edges?.map(edge => edge.position) || origin || box;
    const changed = last ? last.some((value,i) => value!==box[i]) : Boolean(origin);
    const snap = reduced.matches || document.body.dataset.motion67==='reduced';
    if (!changed && state.edges && !snap) return;
    const axis = state.axis==='vertical'?2:0;
    const leading = box[axis]+box[axis+1]>=before[axis]+before[axis+1]?axis+1:axis;
    state.edges = box.map((target,i) => ({
      target,position:snap?target:before[i],velocity:snap?0:state.edges?.[i].velocity || 0,
      spring: i===leading || i<axis || i>axis+1 ? lead : trail
    }));
    paint(state);
    if (!changed || snap) { moving.delete(state); return; }
    moving.add(state);
    if (!animateFrame) { previousTime = performance.now(); animateFrame = requestAnimationFrame(advance); }
  }

  function queue(state) {
    queued.add(state);
    if (measureFrame) return;
    measureFrame = requestAnimationFrame(() => {
      measureFrame = 0;
      for (const item of queued) if (item.group.isConnected) update(item);
      queued.clear();
    });
  }

  const sizes = new ResizeObserver(records => {
    for (const {target} of records) {
      const state = mounted.get(target);
      if (state) queue(state);
    }
  });
  const attributes = new MutationObserver(records => {
    for (const {target} of records) {
      if (target===document.body) mounted.forEach(queue);
      else if (target.tagName==='BUTTON') {
        const state = stateFor(target);
        if (state) queue(state);
      }
    }
  });
  attributes.observe(document.body,{attributes:true,attributeFilter:['data-motion67']});

  function mount(group) {
    if (mounted.has(group)) return;
    const [,key,axis] = groups.find(([match]) => group.matches(match));
    const pill = document.createElement('span'), fill = document.createElement('span');
    pill.className = 'sg-pill750';
    pill.setAttribute('aria-hidden','true');
    pill.hidden = true;
    pill.append(fill);
    group.classList.add('sg-pill-group750');
    group.prepend(pill);
    const state = {group,pill,fill,key,axis,edges:null};
    mounted.set(group,state);
    sizes.observe(group);
    attributes.observe(group,{attributes:true,subtree:true,
      attributeFilter:['class','aria-current','aria-selected','aria-pressed','disabled']});
    queue(state);
  }

  function scan(root) {
    if (root.matches(selector)) mount(root);
    if (root.firstElementChild) root.querySelectorAll(selector).forEach(mount);
  }

  function stateFor(button) {
    return button?.parentElement ? mounted.get(button.parentElement) : null;
  }

  document.addEventListener('click',event => {
    const button = event.target.closest('button');
    const state = stateFor(button);
    if (!state?.edges || button.matches(selected) || button.disabled) return;
    origins.set(state.key,{item:button.id+button.textContent, time:performance.now(),box:state.edges.map(edge=>edge.position)});
  },true);

  document.addEventListener('keydown',event => {
    const button = event.target.closest('button'), state = stateFor(button);
    if (!state || (state.key!=='auth' && state.key!=='pdf')) return;
    const tabs = [...state.group.querySelectorAll('button:not(:disabled)')];
    const index = tabs.indexOf(button);
    const next = {Home:0,End:tabs.length-1,ArrowLeft:(index+tabs.length-1)%tabs.length,ArrowRight:(index+1)%tabs.length}[event.key];
    if (next===undefined || next===index) return;
    event.preventDefault();
    const target = tabs[next];
    target.click();
    const replacement = target.isConnected?target:document.querySelector(groups.find(([,key])=>key===state.key)[0])?.querySelectorAll('button')[next];
    replacement?.focus();
  });

  const tree = new MutationObserver(records => {
    let removed = false;
    for (const record of records) {
      if (record.target.namespaceURI!=='http://www.w3.org/1999/xhtml') continue;
      const state = mounted.get(record.target);
      if (state) queue(state);
      if (record.removedNodes.length) removed = true;
      for (const child of record.addedNodes) if (child.namespaceURI==='http://www.w3.org/1999/xhtml') scan(child);
    }
    if (removed) for (const [group,state] of mounted) {
      if (group.isConnected) continue;
      mounted.delete(group);
      moving.delete(state);
      sizes.unobserve(group);
    }
  });

  scan(document.body);
  tree.observe(document.body,{childList:true,subtree:true});
  reduced.addEventListener('change',()=>mounted.forEach(queue));
})();
