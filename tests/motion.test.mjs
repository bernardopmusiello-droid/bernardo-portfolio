import test from 'node:test';
import assert from 'node:assert/strict';
import {moonPose, motionConfig as c} from '../dist/motion.js';
const period=c.stance+c.flight;
const near=(actual,expected,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} differs from ${expected}`);
test('every sampled foot position stays on or outside the moon',()=>{
  for(let i=0;i<=20000;i++){
    const p=moonPose(i/20000*period);
    assert.ok([p.x,p.y,p.squash,p.moonAngle].every(Number.isFinite));
    const radius=Math.hypot(p.x-c.cx,p.y-c.cy);
    assert.ok(radius>=c.radius-1e-8);
    if(p.contact)near(radius,c.radius);
    assert.ok(Number.isInteger(p.frame)&&p.frame>=0&&p.frame<6);
  }
});
test('takeoff and landing positions are continuous',()=>{
  for(const t of [c.stance,period,2*period]){
    const before=moonPose(t-1e-8),after=moonPose(t+1e-8);
    near(before.x,after.x,1e-5);near(before.y,after.y,1e-5);
  }
});
test('flight follows constant downward acceleration',()=>{
  const h=.0001,g=8*c.height/c.flight**2;
  for(const u of [.1,.3,.5,.7,.9]){
    const t=c.stance+u*c.flight;
    const acceleration=(moonPose(t+h).y-2*moonPose(t).y+moonPose(t-h).y)/h**2;
    near(acceleration,g,1e-4);
  }
});
test('support foot and rotating moon have the same angular speed during contact',()=>{
  const a=moonPose(.08),b=moonPose(.22);
  const angle=p=>Math.atan2(p.x-c.cx,c.cy-p.y);
  near(angle(b)-angle(a),b.moonAngle-a.moonAngle);
});
test('moon rotation stays continuous across cycle boundaries',()=>{
  const omega=c.stride/(c.radius*period);
  const epsilon=1e-7;
  near(moonPose(period+epsilon).moonAngle-moonPose(period-epsilon).moonAngle,2*epsilon*omega);
});
