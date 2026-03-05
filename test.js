const { Object: FabricObject, Canvas, Rect, Group } = require('fabric');
FabricObject.customProperties = ['id', 'name', 'isAiBorderGroup'];

const c = new Canvas();
const r = new Rect({ isAiBorderGroup: true, width: 100, height: 100 });
const g = new Group([r]);
g.isAiBorderGroup = true;
c.add(g);
console.log(JSON.stringify(c.toJSON()));
