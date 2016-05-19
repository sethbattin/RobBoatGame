var WorldMapCamera = function() {
    this.zoomIsland = null;
    
    var zoomTarget = function(cam, canvas){
        if (!cam.zoomIsland){
            return;
        }
        var wZoom = canvas.width / cam.zoomIsland.w;
        var hZoom = canvas.height / cam.zoomIsland.h;
        
        cam.position = cam.zoomIsland.center();
        cam.zoom = Math.min(wZoom, hZoom);
    };
    var zoomWide = function(cam) {
        cam.position = {x: 0, y: 0};
        cam.zoom = 1;
    };
    
    this.update = function(context, timediff, timestamp){
        if (this.zoomIsland){
            zoomTarget(this, context.canvas);
        } else {
            zoomWide(this);
        }
        WorldMapCamera.prototype.update.call(this, context, timediff, timestamp);
    };
};
WorldMapCamera.prototype = new Camera();

