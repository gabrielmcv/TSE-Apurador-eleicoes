export type MapViewport={zoom:number;center:[number,number]};
export const initialViewport:MapViewport={zoom:1,center:[630,605]};
export function clampViewport(zoom:number,center:[number,number]):MapViewport{
 const z=Math.max(1,Math.min(12,zoom));
 return {zoom:z,center:[Math.max(630/z,Math.min(1260-630/z,center[0])),Math.max(605/z,Math.min(1210-605/z,center[1]))]};
}
export function zoomViewport(view:MapViewport,factor:number,point:{x:number;y:number},rect:{left:number;top:number;width:number;height:number}):MapViewport{
 const z=Math.max(1,Math.min(12,view.zoom*factor));
 const unit=Math.max(1260/Math.max(1,rect.width),1210/Math.max(1,rect.height));
 const dx=(point.x-rect.left-rect.width/2)*unit,dy=(point.y-rect.top-rect.height/2)*unit;
 return clampViewport(z,[view.center[0]+dx/view.zoom-dx/z,view.center[1]+dy/view.zoom-dy/z]);
}
export function panViewport(view:MapViewport,dx:number,dy:number,rect:{width:number;height:number}){
 const unit=Math.max(1260/Math.max(1,rect.width),1210/Math.max(1,rect.height))/view.zoom;
 return clampViewport(view.zoom,[view.center[0]-dx*unit,view.center[1]-dy*unit]);
}
