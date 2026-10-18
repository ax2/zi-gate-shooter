import{it,expect}from'vitest';import{bossTacticalStatus}from'../src/game/boss-tactical-status';
it('distinguishes pending, active, depleted and rejected waves without inventing kill rewards',()=>{
 const pending={bossReserveAt:4},accepted={...pending,bossReserveSpent:true,bossReserveSpawns:2};
 expect(bossTacticalStatus(5,{},[])).toBe('');expect(bossTacticalStatus(5,pending,[])).toBe('回援准备');
 const troops=[{active:true,bossReserve:true},{active:true,bossReserve:true},{active:true,escort:true}];
 expect(bossTacticalStatus(5,accepted,troops)).toBe('双哨回援×2');troops[0].active=false;expect(bossTacticalStatus(5,accepted,troops)).toBe('双哨回援×1');troops[1].active=false;expect(bossTacticalStatus(5,accepted,troops)).toBe('反扑结束');
 expect(bossTacticalStatus(5,{...pending,bossReserveSpent:true},troops)).toBe('');expect(bossTacticalStatus(3,accepted,troops)).toBe('');
});
