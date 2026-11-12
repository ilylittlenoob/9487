// Run: node tests/game.test.cjs. Tests the real, standalone HTML game script.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements={},events={};const gradient=()=>({addColorStop(){}});const context=new Proxy({createLinearGradient:gradient,createRadialGradient:gradient},{get:(t,k)=>t[k]||(()=>{})});
function element(){return {style:{},classList:{toggle(){},add(){},remove(){}},append(){},setAttribute(){},getContext:()=>context}}
const stored={};const sandbox={document:{addEventListener:(type,handler)=>events[type]=handler,body:{classList:{toggle(){}}},getElementById:id=>elements[id]??(elements[id]=element()),createElement:element},localStorage:{getItem:k=>stored[k]||null,setItem:(k,v)=>stored[k]=v},addEventListener:(type,handler)=>events[type]=handler,requestAnimationFrame(){},structuredClone,console,assert,events};vm.createContext(sandbox);
vm.runInContext(code+`
function place(p,x,y){Object.assign(p,{x,y,vy:0,vx:0,ground:true,done:false,invulnerable:0})}
function clearCombat(){for(const e of [...enemies,...pendingEnemies])if(e.hp>0)hitEnemy(e,999);pendingEnemies=[];enemies=enemies.filter(e=>e.hp>0)}
function completeMissions(){for(const r of world.relays||[])r.active=true}
function advance(n){for(let i=0;i<n;i++)update(1/120)}
const press=code=>events.keydown({code,key:code,repeat:false,preventDefault(){}});
assert.equal(gameMode,'pve');assert.equal(showMap,false);assert.ok(levelUnlocked(0));assert.ok(!levelUnlocked(1));assert.ok(!skinUnlocked(1));assert.ok(!skinUnlocked(2));setPlayerCount(1);start();assert.equal(activeScreen,'intro');
for(let i=0;i<4;i++){introTime=3;drawIntro();nextIntro()}nextIntro();assert.equal(activeScreen,'roster');assert.equal(campaign.intro,true);
const originalSoundPlay=Sound.play,heard=[];Sound.play=name=>heard.push(name);introStep=1;introTime=3;introCues.clear();updateIntroAudio();updateIntroAudio();assert.equal(heard.filter(n=>n==='impact').length,1);assert.ok(heard.includes('truckHorn')&&heard.includes('brake'));Sound.play=originalSoundPlay;
rosterJob='frost';rosterSkin=2;$('confirmRole').onclick();assert.equal(campaign.initial[0],null,'locked skin cannot be confirmed');rosterSkin=0;rosterJob='adventurer';$('confirmRole').onclick();assert.equal(campaign.initial[0],'adventurer');assert.equal(unlockedJobs(0).length,1);
openRoster(0);rosterJob='knight';$('confirmRole').onclick();assert.equal(selectedJobs[0],'adventurer','locked job cannot be confirmed');
for(const m of ['coop','pvp']){gameMode=m;selected=0;setPlayerCount(2);campaign.initial[1]='medic';start();finish('test');assert.equal(campaign.cleared.length,0)}
setPlayerCount(1);gameMode='pve';selected=1;start();assert.equal(selected,0,'locked stage cannot start');finish('out of order',false);assert.equal(unlockedJobs(0).length,1);
selected=0;start();finish('lost',false);assert.equal(unlockedJobs(0).length,1);
start();clearCombat();finish('first');assert.equal(unlockedJobs(0).length,6);assert.ok(unlockedJobs(0).includes('adventurer'));
selected=1;start();clearCombat();finish('second');assert.equal(unlockedJobs(0).length,12);
assert.ok(levelUnlocked(2));assert.ok(!levelUnlocked(3));assert.ok(!skinUnlocked(1));assert.ok(!skinUnlocked(2));selected=2;start();clearCombat();completeMissions();finish('third');assert.ok(!skinUnlocked(2));assert.ok(levelUnlocked(3));
selected=0;gameMode='coop';start();const gold=world.blocks[0],beforeGold=wallet.coins;place(players[0],gold.rect[0]+4,444);press(bindings[0].jump);advance(65);assert.equal(wallet.coins,beforeGold+1,'actual head bump grants one coin');assert.ok(gold.spent);claimGoldBlock(gold);assert.equal(wallet.coins,beforeGold+1,'no repeat reward');start();assert.ok(world.blocks[0].spent);assert.equal(claimGoldBlock(world.blocks[0]),false,'restart cannot farm the same block');
rosterPlayer=0;assert.ok(buySkin('frost',1));assert.equal(wallet.coins,beforeGold);assert.ok(skinUnlocked(1,'frost'));assert.ok(!skinUnlocked(1,'mage'));assert.ok(buySkin('frost',1));assert.equal(wallet.coins,beforeGold,'owned skin costs nothing twice');assert.equal(buySkin('frost',2),false,'cannot buy with insufficient coins');claimGoldBlock(world.blocks[1]);assert.ok(buySkin('frost',2));assert.equal(wallet.coins,beforeGold);assert.ok(skinUnlocked(2,'frost'));assert.equal(JSON.parse(localStorage.getItem('mercenary-wallet')).owned.length,2);assert.ok(JSON.parse(localStorage.getItem('mercenary-wallet')).claimed.includes(gold.id));
console.log('PASS: gold blocks pay once across retries; one coin buys one specific permanent shared skin; no double spending');
const savedCampaign=JSON.stringify(campaign);beginIntro();finishIntro();assert.equal(JSON.stringify(campaign),savedCampaign,'replay preserves progress');
$('showMap').onchange({target:{checked:true}});assert.equal(showMap,true);paintMapPreview();$('showMap').onchange({target:{checked:false}});assert.equal(showMap,false);
campaign.cleared=[0,1,2,3,4,5,6,7,8,9,10,11];for(selected=0;selected<12;selected++){gameMode='pve';start();assert.equal(pendingEnemies.length,difficultyInfo[difficulty].total);assert.ok(pendingEnemies.every(e=>safeEnemyFloor(e.floor)));const e=pendingEnemies[0];place(players[0],e.x,e.y);spawnEnemies();assert.ok(!enemies.includes(e),'enemy cannot spawn on player');assert.ok(enemies.every(e=>Math.hypot(players[0].x-e.x,players[0].y-e.y)>=220));players[0].x=world.width-100;spawnEnemies();assert.ok(enemies.length<=difficultyInfo[difficulty].cap)}
console.log('PASS: story/replay, initial choice, guarded 1/6/12 unlocks, map preference and safe monster spawns across 12 maps');
campaign={intro:true,initial:['gunner','medic'],cleared:[0,1,2,3,4,5,6,7,8,9,10,11]};wallet.owned=Object.keys(jobs).flatMap(id=>[id+':1',id+':2']);selectedJobs=['gunner','medic'];setPlayerCount(2);
// Distinct objectives must be completed before the exit accepts the player.
setPlayerCount(1);const objectiveCounts=[0,2,1,2,1,1,1,3,2,2,2,2];
for(selected=0;selected<12;selected++){gameMode='coop';start();assert.equal(world.relays.length,objectiveCounts[selected]);if(selected&&!world.bonusRoom){place(players[0],world.goal[0],world.goal[1]);advance(1);assert.equal(mode,'play');assert.ok(!players[0].done)}}
for(const stage of [1,3]){selected=stage;start();const first=world.relays[0],ledges=world.branches.filter(b=>b[0]<first.rect[0]+20);const p=players[0];place(p,ledges[0][0]+35,stageFloorY(stage,0,stageDesigns[stage].shelves[0][0])-36);
 for(const ledge of ledges){let reached=false;for(let tick=0;tick<700;tick++){keys.clear();const dx=ledge[0]+48-(p.x+14);if(Math.abs(dx)>4)keys.add(dx>0?bindings[0].right:bindings[0].left);if(p.ground&&Math.abs(dx)<155&&(Math.abs(dx)>12||p.y+p.h>ledge[1]+2))press(bindings[0].jump);update(1/120);if(p.ground&&Math.abs(p.x+14-(ledge[0]+48))<15&&p.y+p.h<=ledge[1]+2){reached=true;break}}assert.ok(reached,'branch objective reachable '+stage+' target '+ledge+' actual '+p.x+','+p.y)}keys.clear();assert.ok(first.active);assert.equal(p.lives,10)}
selected=2;start();let relay=world.relays[0],mover=relay.mover;place(players[0],mover.rect[0]+32,mover.rect[1]-36);let oldX=players[0].x;elapsed=.5;updateTerrain(.01);assert.equal(players[0].x,oldX+mover.dx);updateRelays();assert.ok(relay.active);
selected=6;start();relay=world.relays[0];mover=relay.mover;place(players[0],mover.rect[0]+32,mover.rect[1]-36);updateRelays();assert.ok(!relay.active,'must ride to upper stop');elapsed=4.4;updateTerrain(.01);updateRelays();assert.ok(relay.active);assert.ok(world.conveyors.some(b=>b[4]<0));
for(const stage of [6,7]){selected=stage;start();const lift=world.relays.find(r=>r.highOnly),m=lift.mover;elapsed=Math.PI/2/1.1;updateTerrain(0);const sx=m.rect[0]+35,floor=world.platforms.filter(f=>!f.oneWay&&sx>=f[0]&&sx<f[0]+f[2]).sort((a,b)=>b[1]-a[1])[0];place(players[0],sx,floor[1]-36);press(bindings[0].jump);advance(600);keys.clear();assert.ok(lift.active,'board lift from real ground and ride to core '+stage);assert.equal(players[0].lives,10)}
selected=5;start();relay=world.relays[0];const pool=world.water.find(r=>r[3]===240);place(players[0],relay.rect[0],pool[1]+pool[3]-36);keys.add(bindings[0].jump);advance(180);keys.clear();assert.ok(relay.active,'swim up to water crystal');assert.equal(players[0].lives,10);
selected=4;start();const vent=world.vents[0];place(players[0],vent.rect[0],vent.rect[1]+vent.rect[3]-36);elapsed=2.8;const health=players[0].hp;advance(1);assert.equal(players[0].hp,health,'warning is safe');elapsed=3.8;advance(1);assert.equal(players[0].hp,health-1,'active flame deals limited damage');assert.equal(players[0].lives,10);
setPlayerCount(2);console.log('PASS: distinct objectives block premature exits; high-route traversal, horizontal carrying, upper lift stop, swimming and telegraphed flames');
// Regressions: ride complete lift cycles, jump off, and pass underneath without side ejection.
setPlayerCount(1);gameMode='coop';
for(const stage of [1,2,6,7]){selected=stage;start();for(const m of world.movers){const p=players[0];place(p,m.rect[0]+30,m.rect[1]-36);keys.clear();for(let tick=0;tick<1400;tick++){update(1/120);assert.ok(Math.abs(p.y+p.h-m.rect[1])<.01,'stable lift ride '+stage);assert.ok(Math.abs(p.x-(m.rect[0]+30))<.01,'no lateral ejection '+stage+' mover '+m.baseX+','+m.baseY+' tick '+tick+' actual '+p.x+','+p.y+' rect '+m.rect)}press(bindings[0].jump);advance(6);keys.clear();assert.ok(p.y+p.h<m.rect[1]-5,'jump off lift');place(p,m.rect[0]+30,m.rect[1]+3);p.ground=false;const x=p.x;advance(1);assert.ok(Math.abs(p.x-x)<.01,'pass beneath lift without sideways push')}}
// Finishing with both living and queued monsters is allowed; mission requirements remain.
gameMode='pve';selected=0;start();const expected=world.enemyTotal;difficulty='hard';assert.equal(world.enemyTotal,expected);assert.equal(battleRules().total,expected);enemies.push(pendingEnemies.shift());assert.ok(enemies[0].hp>0&&pendingEnemies.length>0);place(players[0],world.goal[0],world.goal[1]);advance(1);assert.equal(mode,'won');assert.equal(kills,0);selected=2;start();place(players[0],world.goal[0],world.goal[1]);advance(1);assert.equal(mode,'play');completeMissions();advance(1);assert.equal(mode,'won');difficulty='normal';
for(const stage of [1,3]){gameMode='coop';selected=stage;start();const room=world.bonusRoom,p=players[0];place(p,room.entrance[0]+10,room.entrance[1]+room.entrance[3]-36);keys.add(bindings[0].down);advance(1);keys.clear();assert.ok(p.x<room.start,'locked portal cannot enter');completeMissions();place(p,room.entrance[0]+10,room.entrance[1]+room.entrance[3]-36);keys.add(bindings[0].down);advance(1);keys.clear();assert.equal(p.x,room.spawn[0]);assert.equal(regionAt(p.x).kind,room.kind);advance(140);assert.equal(p.lives,10);const blocks=world.blocks.filter(b=>b.id.includes(':bonus:'));assert.equal(blocks.length,3);const before=wallet.coins;claimGoldBlock(blocks[0]);assert.equal(wallet.coins,before+1);place(p,room.exit[0]+10,room.floor-36);keys.add(bindings[0].down);advance(1);keys.clear();assert.equal(p.x,room.returnTo[0]);assert.equal(p.lives,10);start();assert.ok(world.blocks.find(b=>b.id===blocks[0].id).spent);assert.ok(!objectivesComplete(),'restart relocks room')}
setPlayerCount(2);console.log('PASS: full lift cycles and jump-off/underside regression, exit without clearing living or queued monsters, locked bonus entrances, rewards and return portals');
assert.equal(Object.keys(jobs).length,12);assert.equal(new Set(Object.values(jobs).map(j=>j.hp)).size,12);
assert.equal(layouts.length,14);assert.ok(new Set(routes.flat()).size>=8);
for(selected=0;selected<12;selected++){
 gameMode='coop';start();assert.equal(enemies.length,0);shoot(0);assert.equal(bullets.length,0);
 assert.ok(world.regions.length>=3);assert.ok(world.platforms.length>0);
 for(const lock of world.locks){
  const holder=players[lock.holder],runner=players[1-lock.holder];
  place(holder,lock.plate[0],lock.floorY-36);place(runner,lock.gate[0]-45,lock.floorY-36);
  updateLocks();assert.ok(lock.open&&!lock.latched);holder.x=lock.plate[0]-50;updateLocks();assert.ok(!lock.open);
  place(holder,lock.plate[0],lock.floorY-36);keys.add(bindings[lock.holder].right);advance(80);keys.clear();assert.ok(holder.x+holder.w<=lock.gate[0]+.01&&!lock.latched,'solo gate bypass');
  place(holder,lock.plate[0],lock.floorY-36);place(runner,lock.gate[0]-40,lock.floorY-36);keys.add(bindings[1-lock.holder].right);advance(54);keys.clear();assert.ok(lock.latched,'partner unlock');
 }
 if(world.pipes.length){const pipe=world.pipes[0];place(players[0],pipe.rect[0]+18,pipe.rect[1]-36);players[0].pipeCooldown=0;keys.add(bindings[0].down);advance(1);keys.clear();assert.equal(players[0].x,pipe.to[0]+18,'pipe transport');}
 if(world.blocks.length){const block=world.blocks[0];place(players[0],block.rect[0]+3,block.rect[1]+block.rect[3]+1);players[0].vy=-510;players[0].ground=false;advance(1);assert.ok(block.spent,'hit question block');assert.ok(!Object.hasOwn(world,'coins'));}
 if(world.springs.length){const pad=world.springs[0];place(players[0],pad[0],pad[1]+pad[3]-36);advance(1);assert.equal(players[0].vy,-700,'spring bounce');}
 if(world.movers.length){const m=world.movers[0],old=m.rect[1];place(players[0],m.rect[0]+20,old-36);elapsed=.5;updateTerrain(1/120);assert.equal(players[0].y,m.rect[1]-36,'lift carries player');}
 completeMissions();players.forEach(p=>place(p,world.goal[0],world.goal[1]));advance(1);assert.equal(mode,'won');endTime=1;draw();
}
console.log('PASS: 12 varied worlds, cooperative gates, pipes, question blocks, springs, lift, victory');
// Autonomous single-jump traversal checks for the required ground route of each region.
for(selected=0;selected<12;selected++){
 gameMode='coop';start();world.locks=[];world.goal=null;
 const p=players[0];let stageDeaths=0;
 for(const r of world.regions){
  place(p,r.x+35,elevationPlans[selected][world.regions.indexOf(r)][0]-36);p.pipeCooldown=1;p.invulnerable=10000;
  const before=p.lives;
  const targets=world.route.filter(q=>q[0]>=r.x&&q[0]<r.x+2688).slice(1);
  for(const target of targets){
   const pipe=world.pipes.find(pipe=>target[0]>=pipe.rect[0]&&target[0]<=pipe.rect[0]+pipe.rect[2]);
   const tx=target[0],ty=pipe?pipe.rect[1]:target[1];let reached=false;
   for(let step=0;step<700&&mode==='play';step++){
    keys.clear();const dx=tx-(p.x+14);
    if(Math.abs(dx)>3)keys.add(dx>0?bindings[0].right:bindings[0].left);
    if(inWater(p)&&p.y+p.h>ty-8)keys.add(bindings[0].jump);else if(p.ground&&(Math.abs(dx)>12||p.y+p.h>ty+2))press(bindings[0].jump);
    update(1/120);
    if((p.ground||inWater(p)||world.springs.some(pad=>Math.abs(p.y+p.h-(pad[1]+10))<2))&&Math.abs(p.x+14-tx)<12&&p.y+p.h<=ty+2){reached=true;break}
   }
   assert.ok(reached&&p.lives===before,'landing '+selected+' '+r.kind+' target '+tx+','+ty+' actual '+p.x+','+p.y);
  }
  keys.add(bindings[0].right);for(let step=0;step<240&&p.x<r.x+3000;step++)update(1/120);
  keys.clear();assert.ok(p.x>=r.x+3000&&p.lives===before,'ground route '+selected+' '+r.kind+' x='+p.x+' y='+p.y+' lives='+p.lives+' before='+before);
 }
}
console.log('PASS: all full-length regions traversable with single jumps, including vertical slopes and lava vents');
for(selected=0;selected<12;selected++){
 gameMode='coop';setPlayerCount(1);start();completeMissions();world.locks.forEach(l=>{l.latched=true;l.open=true});
 assert.ok(world.width>=10000);assert.ok(world.height>=2000);assert.notEqual(world.goal[1],400);
 assert.ok(Math.max(...world.route.map(p=>p[1]))-Math.min(...world.route.map(p=>p[1]))>=300);
 assert.ok(world.enemyFloors.every(f=>world.platforms.includes(f)));
 const base=routes[selected].length*3072,floorY=elevationPlans[selected].at(-1)[2],p=players[0];place(p,base+70,floorY-36);
 const targets=world.route.filter(q=>q[0]>base+100);
 for(const [tx,ty] of targets){
  let reached=false;
  for(let step=0;step<1800&&mode==='play';step++){
   keys.clear();const dx=tx-(p.x+14);if(Math.abs(dx)>4)keys.add(dx>0?bindings[0].right:bindings[0].left);
   if(p.ground&&Math.abs(dx)<125&&ty<p.y+p.h-2)press(bindings[0].jump);
   update(1/120);
   if(mode==='won'||(p.ground&&Math.abs(p.y+p.h-ty)<2&&Math.abs(p.x+14-tx)<12)){reached=true;break}
  }
  assert.ok(reached,'summit path '+selected+' target '+tx+','+ty+' actual '+p.x+','+p.y);
  if(mode==='won')break;
 }
 assert.equal(mode,'won','exit reached through actual movement');assert.equal(p.lives,lifeLimit());
 // A deep player and projectile remain alive below the old 600px cutoff.
 start();const floor=world.enemyFloors.find(f=>f[1]>700);place(players[0],floor[0]+30,floor[1]-36);advance(2);assert.equal(players[0].lives,lifeLimit());
 bullets=[{owner:0,x:floor[0]+40,y:floor[1]-60,w:4,h:4,vx:0,vy:0,life:1}];updateBullets(.01);assert.equal(bullets.length,1);
 const lock=world.locks[0];place(players[0],lock.plate[0],lock.floorY-36);updateLocks();respawn(0);assert.equal(players[0].y,lock.floorY-36);assert.equal(players[0].x,lock.gate[0]+24);
 for(const zoom of [1,1.25,1.5]){viewZoom=zoom;draw()}paintMapPreview();
}
for(selected=0;selected<12;selected++){
 gameMode='coop';start();assert.ok(world.jumpGaps.length<=5);assert.ok(world.branches.length>=9);
 // Every horizontal point has solid ground beneath it; missing an upper ledge is survivable.
 for(let x=0;x<world.width;x+=32)assert.ok(world.platforms.some(f=>!f.oneWay&&x>=f[0]&&x<f[0]+f[2]&&f[1]+f[3]>=world.height),'ground coverage '+selected+' '+x);
 const upper=world.branches[2],p=players[0];place(p,upper[0]+upper[2]+3,upper[1]-36);p.ground=false;advance(480);assert.equal(p.lives,lifeLimit());assert.ok(p.ground||inWater(p)||world.springs.some(s=>Math.abs(p.x-s[0])<50),'missed upper route lands safely '+selected+' '+p.x+','+p.y);
 const ditch=world.jumpGaps[0];if(!ditch)continue;place(p,ditch[0]+8,ditch[1]+70-36);keys.add(bindings[0].right);for(let step=0;step<180;step++){if(p.ground)press(bindings[0].jump);update(1/120)}keys.clear();assert.equal(p.lives,lifeLimit());assert.ok(p.x>ditch[0]+112,'can jump out of shallow ditch');
}
console.log('PASS: all 12 maps have continuous supporting ground, safe upper-route falls and escapable shallow ditches');
setPlayerCount(2);
console.log('PASS: 12 non-horizontal exits reached physically, full-height survival/projectiles, elevated checkpoints and previews');
for(const id of Object.keys(jobs)){
 gameMode='pvp';selected=0;selectedJobs=[id,'knight'];start();assert.equal(players[0].maxHp,jobs[id].hp);
 place(players[0],200,464);place(players[1],id==='alchemist'?420:280,464);players[0].facing=1;
 const hp=players[1].hp;shoot(0);for(let n=0;n<150;n++)updateBullets(1/120);
 assert.ok(players[1].hp<hp,'attack deals damage: '+id);
 start();place(players[0],200,464);place(players[1],280,464);players[0].hp-=3;
 useSkill(0);assert.ok(players[0].skillCooldown>0,id+' skill cooldown');const count=fields.length,cd=players[0].skillCooldown;useSkill(0);assert.equal(fields.length,count);assert.equal(players[0].skillCooldown,cd);
 if(['gunner','archer','rogue'].includes(id))assert.ok(players[0].buff>0);
 if(id==='adventurer'){assert.equal(players[0].hp,players[0].maxHp-1);assert.ok(players[0].shield>0)}
 if(id==='knight'){const hp=players[0].hp;damagePlayer(0,20,1);assert.equal(players[0].hp,hp)}
 if(id==='mage')assert.ok(players[0].float>0);
 if(id==='medic')assert.equal(players[0].hp,players[0].maxHp);
 if(id==='engineer'){updateFields(.01);assert.ok(bullets.length>0)}
 if(id==='berserker')assert.ok(players[0].armor>0);
 if(id==='frost')assert.ok(players[1].frozen>0);
 if(id==='alchemist'){const hp=players[1].hp;updateFields(.01);assert.ok(players[1].hp<hp)}
 draw();
}
for(const id of Object.keys(jobs)){
 selectedJobs=[id,'knight'];gameMode='pvp';selected=0;const damage=[];
 for(let tier=0;tier<3;tier++){skinChoices[0][id]=tier;start();place(players[0],200,464);place(players[1],280,464);players[0].facing=1;const hp=players[1].hp;shoot(0);assert.ok(bullets.every(b=>b.tier===tier));for(let tick=0;tick<150;tick++)updateBullets(1/120);damage.push(hp-players[1].hp);useSkill(0);assert.ok(fields.some(f=>f.kind==='cast'&&f.tier===tier));draw();}
 assert.equal(new Set(damage).size,1);
}
console.log('PASS: sequential map/skin unlocks, all 36 decorated looks and tiered combat/skill visuals');
console.log('PASS: 12 distinct HP values, all 12 attacks deal damage, all skills work and respect cooldowns');
selectedJobs=['gunner','medic'];
for(const diff of Object.keys(difficultyInfo)){
 difficulty=diff;gameMode='pve';selected=2;start();const config=difficultyInfo[diff];assert.equal(pendingEnemies.length,config.total);
 if(diff!=='easy')assert.equal(new Set(pendingEnemies.map(e=>e.type)).size,5);
 players[0].x=world.width-100;spawnEnemies();assert.equal(enemies.length,config.cap);spawnEnemies();assert.equal(enemies.length,config.cap);
 players.forEach(p=>place(p,world.goal[0],world.goal[1]));advance(1);assert.notEqual(mode,'won','unfinished map objective still gates exit');
 while(kills<config.total){players[0].x=world.width-100;spawnEnemies();const e=enemies[0];assert.ok(e);hitEnemy(e,99);updateBullets(0)}
 completeMissions();players.forEach(p=>place(p,world.goal[0],world.goal[1]));advance(1);assert.equal(mode,'won');
}
gameMode='pve';selected=0;start();place(players[0],20,444);place(players[1],85,444);const allyHP=players[1].hp;shoot(0);for(let n=0;n<60;n++)updateBullets(1/120);assert.equal(players[1].hp,allyHP);
console.log('PASS: difficulty spawn limits, all 5 monster types, PVE objective requirement and no friendly fire');
for(const testMode of ['coop','pve']){
 gameMode=testMode;selected=0;start();const startX=players[0].x;
 for(let n=0;n<lifeLimit()-1;n++){respawn(0);assert.equal(players[0].lives,lifeLimit()-1-n);assert.ok(!players[0].eliminated);assert.equal(players[0].hp,players[0].maxHp)}
 respawn(0);assert.equal(players[0].lives,0);assert.ok(players[0].eliminated);assert.equal(mode,'play');assert.equal(watchIndex(0),1);
 const x=players[0].x;keys.add(bindings[0].right);press(bindings[0].jump);shoot(0);useSkill(0);advance(5);keys.clear();assert.equal(players[0].x,x);
 const lock=world.locks[0];place(players[1],lock.plate[0],lock.floorY-36);updateLocks();assert.ok(lock.latched,'solo rescue unlock');
 if(testMode==='pve')clearCombat();
 completeMissions();place(players[1],world.goal[0],world.goal[1]);advance(1);assert.equal(mode,'won','survivor victory');endTime=2;draw();
 $('continue').onclick();if(testMode==='coop'){assert.equal(activeScreen,'lobby');start()}assert.ok(players.every(p=>p.lives===lifeLimit()&&!p.eliminated),'next stage resets lives');
 for(let i=0;i<2;i++)for(let n=0;n<lifeLimit();n++)respawn(i);
 assert.equal(mode,'lost');assert.ok(players.every(p=>p.eliminated&&p.lives===0));const before=elapsed;frame(last+50);assert.ok(endTime>0);assert.equal(elapsed,before);draw();
 $('continue').onclick();assert.equal(mode,'play');assert.ok(players.every(p=>p.lives===lifeLimit()));
}
gameMode='pvp';selected=0;start();for(let n=0;n<lifeLimit();n++)respawn(1);assert.equal(mode,'won');assert.ok(resultLabel.includes('P1'));assert.equal(players[1].lives,0);$('continue').onclick();assert.ok(players.every(p=>p.lives===lifeLimit()));
console.log('PASS: 10-life adventure / 5-life PVP elimination, disabled input, spectator target, solo rescue, survivor victory, team defeat, animated ending, retry/next/rematch');
// Binding migration/skills and zoom remain compatible.
start();openBindings('game');assert.equal(mode,'paused');capturing={i:0,action:'skill'};press('KeyP');assert.ok(capturing);press('KeyT');$('saveBindings').onclick();assert.equal(bindings[0].skill,'KeyT');pause();press('KeyT');advance(1);assert.ok(players[0].skillCooldown>0);
openBindings('game');$('resetBindings').onclick();$('saveBindings').onclick();assert.equal(JSON.stringify(bindings),JSON.stringify(defaultBindings));assert.equal(validBindings(defaultBindings),true);
for(const zoom of [1,1.25,1.5]){viewZoom=zoom;draw()}
for(const t of Object.keys(themes)){theme=t;paintHero();draw()}
console.log('PASS: skill remapping/reset and all zoom/theme rendering');
setPlayerCount(1);assert.equal(playerCount,1);chooseMode('pvp');assert.notEqual(gameMode,'pvp');
for(const soloMode of ['coop','pve']){gameMode=soloMode;selected=0;start();assert.equal(players.length,1);assert.equal(players[0].lives,lifeLimit());assert.ok(!Object.hasOwn(world,'coins'));
 for(const lock of world.locks){place(players[0],lock.plate[0],lock.floorY-36);updateLocks();assert.ok(lock.latched,'solo gate')}
 press(bindings[1].jump);press(bindings[1].shoot);press(bindings[1].skill);draw();
 if(soloMode==='pve')clearCombat();completeMissions();place(players[0],world.goal[0],world.goal[1]);advance(1);assert.equal(mode,'won');draw();$('continue').onclick();if(soloMode==='coop'){assert.equal(activeScreen,'lobby');start()}assert.equal(players.length,1);assert.equal(players[0].lives,lifeLimit());
 for(let n=0;n<lifeLimit();n++)respawn(0);assert.equal(mode,'lost');draw();$('continue').onclick();assert.equal(players[0].lives,lifeLimit());$('home').onclick();assert.equal(activeScreen,'lobby');assert.equal(mode,'menu');
}
for(const job of Object.keys(jobs)){assert.equal(skinCatalog[job].length,3);for(let i=0;i<3;i++){const look=roleLook(job,i);assert.equal(look.job,job);paintCharacter(ctx,{x:0,y:0,w:28,h:36},look)}}
openRoster(0);rosterJob='frost';rosterSkin=2;$('confirmRole').onclick();assert.equal(selectedJobs[0],'frost');assert.equal(looks[0].skinName,'翡翠寒霜');openRoster(0);rosterJob='knight';$('cancelRole').onclick();assert.equal(selectedJobs[0],'frost');
setPlayerCount(2);gameMode='pvp';start();assert.equal(players.length,2);draw();
console.log('PASS: solo COOP/PVE gates, victory/defeat/retry, disabled PVP, return to lobby, 36 fixed skins, roster confirm/cancel, dual-player restore');

// Elf input, timed flight, melee movement and sky-arena physics.
setPlayerCount(2);gameMode='pvp';selected=3;selectedJobs=['elf','gunner'];start();
assert.equal(world.movers.length,2);advance(2);assert.ok(players.every(p=>p.ground),'both sky spawns have support');
let ep=players[0];press(bindings[0].jump);advance(8);press(bindings[0].jump);assert.equal(ep.jumps,2);advance(8);const secondVy=ep.vy;press(bindings[0].jump);assert.equal(ep.vy,secondVy,'no third jump');
keys.clear();place(ep,700,100);ep.ground=false;useSkill(0);assert.equal(ep.flight,10);advance(120);assert.ok(Math.abs(ep.vy)<.01,'flight hovers without gravity drift');let fy=ep.y;keys.add(bindings[0].jump);advance(30);keys.clear();assert.ok(ep.y<fy-20,'flight ascends');fy=ep.y;keys.add(bindings[0].down);advance(30);keys.clear();assert.ok(ep.y>fy+20,'flight descends');advance(1021);assert.equal(ep.flight,0);assert.ok(ep.ground||ep.vy>0,'gravity returns after ten seconds');
useSkill(0);respawn(0);assert.equal(ep.flight,0,'death cancels flight');
for(const id of ['gunner','knight','berserker']){selectedJobs=[id,'gunner'];start();place(players[0],600,784);keys.add(bindings[0].right);advance(12);keys.clear();assert.ok(Math.abs(players[0].x-600-24.5*(id==='gunner'?1:1.2))<.001,'melee speed bonus '+id)}
selectedJobs=['elf','gunner'];start();
for(const m of world.movers){ep=players[0];place(ep,m.rect[0]+30,m.rect[1]-36);for(let tick=0;tick<1500;tick++){update(1/120);assert.ok(Math.abs(ep.y+ep.h-m.rect[1])<.01,'sky lift full cycles')}ep.skillCooldown=0;useSkill(0);keys.add(bindings[0].jump);advance(30);keys.clear();assert.ok(ep.y+ep.h<m.rect[1]-15,'fly away from moving board');ep.flight=0;}
// Recover from the bottom of either side without special abilities.
selectedJobs=['gunner','gunner'];start();ep=players[0];
for(const side of [0,1]){place(ep,side?1320:80,784);const targets=side?[[1300,760],[1180,700],[1060,640],[1070,560]]:[[130,760],[250,700],[370,640],[350,560]];for(const [tx,ty] of targets){let reached=false;for(let tick=0;tick<700;tick++){keys.clear();const dx=tx-(ep.x+14);if(Math.abs(dx)>4)keys.add(dx>0?bindings[0].right:bindings[0].left);if(ep.ground&&(Math.abs(dx)>12||ep.y+ep.h>ty+2))press(bindings[0].jump);update(1/120);if(ep.ground&&Math.abs(ep.x+14-tx)<15&&ep.y+ep.h<=ty+2){reached=true;break}}assert.ok(reached,'sky recovery stair '+side+' '+ty)}keys.clear();assert.equal(ep.lives,5)}
// Unlock is permanent and additive: preserve earned money and actual clears.
campaign={intro:true,initial:['gunner','medic'],cleared:[]};wallet.coins=7;wallet.owned=[];const claimedBefore=JSON.stringify(wallet.claimed);unlockEverything();assert.equal(campaign.cleared.length,0);assert.equal(wallet.coins,7);assert.equal(JSON.stringify(wallet.claimed),claimedBefore);assert.equal(unlockedJobs(0).length,12);assert.equal(wallet.owned.length,24);for(let i=0;i<12;i++)assert.ok(levelUnlocked(i));for(const id of Object.keys(jobs))for(let tier=0;tier<3;tier++)assert.ok(skinUnlocked(tier,id));assert.ok(JSON.parse(localStorage.getItem('mercenary-campaign')).unlockAll);unlockEverything();assert.equal(wallet.owned.length,24);gameMode='coop';selected=1;start();assert.ok(bonusAccessible());assert.ok(!objectivesComplete());
console.log('PASS: elf double-jump/third-jump rejection, hover/ascent/descent/10-second expiry, death reset, exact melee speed, sky lift cycles and ordinary-jump recovery, additive persistent unlock');

// Required upper objectives remain reachable by ordinary single jumps.
selectedJobs=['gunner','medic'];setPlayerCount(1);gameMode='coop';
for(const stage of [1,3,4,7,8,11]){selected=stage;start();for(const relay of world.relays.filter(r=>!r.mover&&!r.label.includes('水晶'))){
 const section=Math.floor(relay.rect[0]/3072),x=section*3072;const path=stageDesigns[stage].shelves.map(([j])=>world.branches.find(b=>b[0]===x+j*112+8)).filter(b=>b&&b[0]<=relay.rect[0]);const p=players[0];place(p,path[0][0]+35,stageFloorY(stage,section,stageDesigns[stage].shelves[0][0])-36);p.invulnerable=10000;
 for(const ledge of path){let reached=false;for(let tick=0;tick<900;tick++){keys.clear();const dx=ledge[0]+48-(p.x+14);if(Math.abs(dx)>4)keys.add(dx>0?bindings[0].right:bindings[0].left);if(p.ground&&Math.abs(dx)<155&&(Math.abs(dx)>12||p.y+p.h>ledge[1]+2))press(bindings[0].jump);update(1/120);if(p.ground&&Math.abs(p.x+14-(ledge[0]+48))<15&&p.y+p.h<=ledge[1]+2){reached=true;break}}assert.ok(reached,'authored objective route '+stage+' '+relay.label+' '+ledge+' actual '+p.x+','+p.y)}keys.clear();assert.ok(relay.active,'objective can be collected '+stage+' '+relay.label);
}}
// All five species traverse real stepped collision geometry, not their spawn rectangle.
gameMode='pve';setPlayerCount(1);selected=0;start();const savedWorld=world;
for(const type of Object.keys(enemyTypes)){
 const ground=[[0,500,180,500],[180,450,180,550],[360,400,400,600]];
 world={width:760,height:1000,platforms:ground,locks:[],spikes:[],enemyFloors:ground,battle:difficultyInfo.normal};
 place(players[0],600,364);players[0].invulnerable=999;players[0].eliminated=false;
 const info=enemyTypes[type],e={id:0,type,x:50,y:470,w:30,h:30,floor:ground[0],vy:0,direction:1,timer:.5,hp:info.hp,maxHp:info.hp};enemies=[e];bullets=[];
 for(let n=0;n<1800;n++)updateEnemies(1/120);
 assert.ok(e.x>400,type+' roams beyond spawn and climbs both stairs: '+e.x+','+e.y);assert.ok(e.y<=370,type+' reaches elevated floor');assert.ok(!ground.some(f=>hit(e,f)),type+' never embeds in solid ground');
 if(type==='spitter')assert.ok(bullets.length>0,'spitter fires while roaming');
 // Chase back down, with actual gravity rather than the original floor clamp.
 place(players[0],30,464);for(let n=0;n<2000;n++)updateEnemies(1/120);assert.ok(e.x<180,type+' can return down stairs');assert.equal(e.floor,ground[0],type+' lands on lower ground before next hop');
 e.frozen=1;const frozenX=e.x;updateEnemies(.1);assert.equal(e.x,frozenX,'freeze still stops roaming');
}
world=savedWorld;
const signatures=layouts.slice(0,12).map(w=>JSON.stringify(w.route.slice(0,24).map(q=>q[1])));assert.equal(new Set(signatures).size,12,'twelve unique authored terrain contours');assert.equal(new Set(layouts.slice(0,12).map(w=>w.design.style)).size,12,'twelve visual identities');assert.ok(layouts[8].crumbles.length>0);assert.ok(layouts[4].firebars.length>0);assert.ok(layouts[9].water.some(r=>r[2]>2000));
gameMode='coop';selected=8;start();const cr=world.crumbles[0];place(players[0],cr.rect[0]+20,cr.rect[1]-36);advance(90);assert.ok(cr.reset>0,'standing on cracked bridge triggers fall');assert.ok(cr.rect[1]>cr.baseY);place(players[0],45,444);advance(400);assert.equal(cr.rect[1],cr.baseY,'bridge returns for retries');
selected=4;start();const bar=world.firebars[0];elapsed=0;const angle=bar.phase;place(players[0],bar.x+Math.cos(angle)*36-14,bar.y+Math.sin(angle)*36-18);const barHP=players[0].hp;advance(1);assert.equal(players[0].hp,barHP-1,'fire wheel collision does damage');
console.log('PASS: 12 unique ground silhouettes and visual identities; cracked bridge fall/reset; fire wheel damage; all 5 monsters roam, climb, descend, chase and respect freeze');

`,sandbox);
