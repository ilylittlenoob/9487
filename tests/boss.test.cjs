const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
const el=()=>({style:{},classList:{toggle(){},add(){},remove(){}},append(){},setAttribute(){},getContext:()=>ctx});const els={};
const s={document:{addEventListener(){},body:el(),getElementById:id=>els[id]??=el(),createElement:el},localStorage:{getItem(){return null},setItem(){}},addEventListener(){},requestAnimationFrame(){},structuredClone,console,assert};vm.createContext(s);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1]+`
campaign={intro:true,initial:['adventurer','adventurer'],cleared:[],unlockAll:true};setPlayerCount(1);gameMode='pve';
for(const stage of [12,13]){selected=stage;start();const b=world.boss;assert.equal(enemies.length,1);assert.equal(pendingEnemies.length,0);assert.ok(!exitReady());players[0].x=700;b.timer=0;updateBoss(b,.01);assert.ok(b.attacks.length);assert.ok(b.attacks.every(a=>a.time>0));assert.equal(players[0].hp,16);b.hp=b.maxHp*.2;updateBoss(b,.01);assert.equal(b.phase,stage===13?3:2);const a=b.attacks[0];Object.assign(players[0],{x:a.rect[0]+20,y:400,invulnerable:0});a.time=0;const hp=players[0].hp;updateBoss(b,.01);assert.ok(players[0].hp<hp);hitEnemy(b,9999);assert.ok(exitReady());draw();start();assert.equal(world.boss.hp,world.boss.maxHp);gameMode='coop';start();assert.ok(exitReady());gameMode='pve'}
assert.equal(names.length,14);console.log('PASS: two bosses, telegraphs, damage, phase transitions, mandatory boss defeat, restart and training mode');`,s);
