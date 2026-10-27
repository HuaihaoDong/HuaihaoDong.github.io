const test=require('node:test');
const assert=require('node:assert/strict');
const {advance,brake,frameAt,clamp}=require('../tiger.js');
const limits={speed:205,acceleration:420,brake:650};
function travel(fps,target={x:600,y:250}){
 let p={x:0,y:0,vx:0,vy:0},t=0;
 for(let i=0;i<fps*15;i++){
   const before=p;p=advance(p,target,1/fps,limits);t+=1/fps;
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
   assert.ok(Math.hypot(p.vx,p.vy)<=limits.speed+1e-6);
   assert.ok(Math.hypot(p.vx-before.vx,p.vy-before.vy)<=limits.brake/fps+1e-6);
   if(p.arrived)return {p,t};
 }
 assert.fail('Did not arrive');
}
test('完整循环播放最后一帧，之后才回到第一帧',()=>{
 const frames=[0,1,2,3,4,5,6,7],times=frames.map(()=>100);
 assert.deepEqual(frames.map((_,i)=>frameAt(frames,times,i*100+50)),frames);
 assert.equal(frameAt(frames,times,800),0);
});
test('30、60、144Hz 的移动时间一致，速度与加速度有上限',()=>{
 const values=[30,60,144].map(f=>travel(f));
 assert.ok(Math.max(...values.map(v=>v.t))-Math.min(...values.map(v=>v.t))<.1);
 for(const value of values)assert.deepEqual([value.p.x,value.p.y,value.p.vx,value.p.vy],[600,250,0,0]);
});
test('短距离到达不来回抖动或跨过目标',()=>{
 for(const distance of [0,.5,2,5,20,70]){
   const {p}=travel(60,{x:distance,y:0});assert.equal(p.x,distance);assert.equal(p.y,0);
 }
});
test('反向之前逐步刹车，保持原来的行进方向',()=>{
 let p={x:300,y:200,vx:205,vy:0},last=p.vx;
 for(let i=0;i<30;i++){p=brake(p,1/60,650);assert.ok(p.vx>=0&&p.vx<=last);last=p.vx;}
 assert.equal(p.vx,0);assert.ok(p.x>300&&p.x<335);
});
test('偏斜目标以有限加速度转向，没有瞬间改写速度',()=>{
 const before={x:200,y:200,vx:180,vy:0};
 const after=advance(before,{x:200,y:500},1/60,limits);
 assert.ok(after.vx>170);assert.ok(after.vy>0&&after.vy<12);
});
test('定格与睡眠使用各帧的独立停留时间',()=>{
 assert.equal(frameAt([0,1,0],[2300,110,1700],2299),0);
 assert.equal(frameAt([0,1,0],[2300,110,1700],2350),1);
 assert.equal(frameAt([0,1],[1700,1700],2200),1);
});
test('屏幕边界限制不产生超界坐标',()=>{
 assert.equal(clamp(-99,8,300),8);assert.equal(clamp(900,8,300),300);
});
const {runPose}=require('../tiger.js');
test('跑步相邻帧连续混合，循环接缝保持亮度权重',()=>{
 for(const phase of [0,.125,.5,1.9,7.999,8,16.5]){
  const pose=runPose(phase);assert.ok(pose.frame>=0&&pose.frame<8);assert.equal(pose.next,(pose.frame+1)%8);assert.ok(pose.mix>=0&&pose.mix<1);
  assert.ok(Math.abs((1-pose.mix)+pose.mix-1)<1e-12);
 }
 assert.deepEqual(runPose(7.5),{frame:7,next:0,mix:.5});assert.deepEqual(runPose(8.5),runPose(.5));
});
