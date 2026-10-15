export type Route = 'ballistic' | 'electric' | 'optical';
export const routes: Route[] = ['ballistic','electric','optical'];
export const tree: Record<Route, {name:string; detail:string}[]> = {
  ballistic: [
    {name:'霰射机构',detail:'安装T1霰射 · 霰射伤害+10%'},
    {name:'重型弹芯',detail:'霰射伤害再+20%'},
    {name:'雷暴霰射',detail:'霰射命中追加一次跳电 · 需雷电路线'},
  ],
  electric: [
    {name:'导电线圈',detail:'安装T1电弧 · 电弧多跳一次'},
    {name:'远距电桥',detail:'跳电范围160→220'},
    {name:'高效传导',detail:'每跳保留80%伤害（原65%）'},
  ],
  optical: [
    {name:'聚焦镜组',detail:'立即解锁激光 · 激光伤害+15%'},
    {name:'循环冷却',detail:'激光发射间隔缩短25%'},
    {name:'深穿光束',detail:'贯穿+2；搭配霰射机构追加棱镜双束'},
  ],
};
export class BuildTree {
  readonly ranks: Record<Route,number> = {ballistic:0,electric:0,optical:0};
  readonly refinements: Record<Route,number> = {ballistic:0,electric:0,optical:0};
  get baseSpent(){return Object.values(this.ranks).reduce((a,b)=>a+b,0);}
  get spent(){return this.baseSpent+Object.values(this.refinements).reduce((a,b)=>a+b,0);}
  next(route:Route){
    if(this.ranks[route]<3)return tree[route][this.ranks[route]];
    const n=this.refinements[route],label={ballistic:'弹道武器',electric:'电弧炮',optical:'激光与棱镜'}[route];
    return {name:`${label}精调 ${n+1}`,detail:`伤害系数 ${100+n*10}% → ${110+n*10}%`};
  }
  available(earned:number){
    if(earned<=this.spent)return [];
    return routes.filter(r=>!(r==='ballistic'&&this.ranks[r]===2&&this.ranks.electric===0));
  }
  choose(route:Route,earned:number){
    if(!this.available(earned).includes(route))return false;
    if(this.ranks[route]<3)this.ranks[route]++;else this.refinements[route]++;return true;
  }
}
