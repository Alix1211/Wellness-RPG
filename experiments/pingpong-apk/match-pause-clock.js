// Keep delayed serves, reactions and animation deadlines on the same paused clock.
(()=>{
 const now=performance.now.bind(performance),schedule=setTimeout.bind(window),cancel=clearTimeout.bind(window);
 let paused=false,started=0,offset=0,serial=0;
 const tasks=new Map();
 const clock=()=> (paused?started:now())-offset;
 Object.defineProperty(performance,'now',{configurable:true,value:clock});
 function arm(task){task.at=now();task.native=schedule(()=>{
  if(paused)return;
  if(!task.repeat)tasks.delete(task.id);
  else task.left=task.delay;
  try{if(typeof task.fn==='function')task.fn(...task.args);else (0,eval)(String(task.fn));}
  finally{if(task.repeat&&tasks.has(task.id)&&!paused)arm(task);}
 },task.left);}
 function timer(fn,delay,repeat,args){
  const task={id:++serial,fn,delay:Math.max(0,Number(delay)||0),repeat,args};task.left=task.delay;
  tasks.set(task.id,task);if(!paused)arm(task);return task.id;
 }
 window.setTimeout=(fn,delay,...args)=>timer(fn,delay,false,args);
 window.setInterval=(fn,delay,...args)=>timer(fn,delay,true,args);
 window.clearTimeout=window.clearInterval=id=>{const task=tasks.get(id);if(task){cancel(task.native);tasks.delete(id);}};
 window.GaiaMatchClock={setPaused(value){
  if(value===paused)return;
  if(value){started=now();paused=true;for(const task of tasks.values()){cancel(task.native);task.left=Math.max(0,task.left-(started-task.at));}}
  else{offset+=now()-started;paused=false;for(const task of tasks.values())arm(task);}
 }};
})();
