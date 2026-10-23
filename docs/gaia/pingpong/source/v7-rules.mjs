// GAIA PINGPONG v7. The table-tennis route is the backbone of the tour.
// Training never takes over an existing match, shop, rest or tournament node.
// All IDs and paths are retained for older save-file compatibility.
export const V7_FREE_TRAINING={
  0:['25','26','28','30'],
  1:['4','18','34','39'],
  2:['4','14','25','34','40','54']
};
export const V7_NEW_MATCHES={
  0:['10','17','24'],
  1:['11','26','35'],
  2:['11','26','36','55']
};
export function balanceTourBoard(base,region,preserveTrainingId=null){
  for(const id of V7_FREE_TRAINING[region]){
    const node=base[id];
    if(!node||node.kind!=='train'||!node.training)throw Error('Invalid training slot '+region+'/'+id);
    // A saved game may already be inside this training node. Let it finish.
    if(id===preserveTrainingId)continue;
    node.kind='blank';
    delete node.training;
  }
  for(const id of V7_NEW_MATCHES[region]){
    const node=base[id];
    if(!node||node.kind!=='blank')throw Error('Cannot add table tennis on '+region+'/'+id);
    node.kind='match';
  }
  return base;
}
