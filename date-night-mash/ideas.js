(function(root){
  const categories = [
    {id:'dinner',name:'Dinner',icon:'♨',caption:'First, something delicious.',items:[['Cook pasta together',12,'home'],['Taco night at home',14,'home'],['Pizza for two',20,'indoor'],['Picnic sandwiches',12,'outdoor'],['Use what’s in the pantry',0,'home']]},
    {id:'activity',name:'Activity',icon:'✳',caption:'A little shared adventure.',items:[['Thrift store challenge',10,'indoor'],['Sunset walk',0,'outdoor'],['Paint together',8,'home'],['Explore a local park',0,'outdoor'],['Living room dance party',0,'home']]},
    {id:'treat',name:'Treat',icon:'♧',caption:'Because sweet is a love language.',items:[['Ice cream for two',10,'indoor'],['Bake mug cakes',4,'home'],['Coffee & a pastry',12,'indoor'],['Fruit in the park',5,'outdoor'],['Homemade sweet tea',0,'home']]},
    {id:'entertainment',name:'Entertainment',icon:'♫',caption:'End on a good note.',items:[['Movie from your library',0,'home'],['Board game showdown',0,'home'],['Stargazing',0,'outdoor'],['Free local exhibit',0,'indoor'],['Build a shared playlist',0,'home']]}
  ];
  function generate(budget,setting='all',selected){
    if(!Number.isFinite(budget)||budget<0||budget>10000)throw new Error('Enter a budget between $0 and $10,000.');
    if(!['all','indoor','outdoor','home'].includes(setting))throw new Error('Choose a valid setting.');
    const groups=categories.map(c=>c.items.map((item,i)=>({id:c.id+'-'+i,category:c.name,name:item[0],cost:item[1],setting:item[2]})).filter(item=>(!selected||selected.includes(item.id))&&(setting==='all'||item.setting===setting)));
    if(groups.some(g=>!g.length))throw new Error('Select at least one matching option in every category, or try “Anything goes.”');
    let chosen=null,count=0;
    function visit(i,picks,total){if(i===groups.length){if(total<=budget){count++;if(Math.random()<1/count)chosen={picks,total,budget,setting};}return;}for(const item of groups[i])if(total+item.cost<=budget)visit(i+1,[...picks,item],total+item.cost);}
    visit(0,[],0);if(!chosen)throw new Error('No complete date fits this budget. Try a higher budget, include free options, or change the setting.');return chosen;
  }
  const api={categories,generate};if(typeof module!=='undefined')module.exports=api;else root.Mash=api;
})(typeof window!=='undefined'?window:globalThis);
