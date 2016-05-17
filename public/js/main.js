
(function(global, io, doc){
    var canvas;
    global.canvas = canvas = doc.getElementById('game');
    canvas.addEventListener('contextmenu', function(ev) {
        ev.preventDefault();
    });
    var loop = new GameLoop(canvas);
    GLInput.mouse.setViewPort(canvas);
    
    manager.loadAssets();
    
    var worldMap = (function(){        
        var img = Sprite.fromAsset('map');
        img.rotation = 0;

        var camera = new Camera(canvas);
        camera.debug = true;
        camera.tracking = true;
        camera.viewables.push(camera.makeTrackable((canvas.width - 100) / -2, (canvas.height - 100) / -2));
        camera.viewables.push(camera.makeTrackable((canvas.width - 100) / 2, (canvas.height - 100) / 2));
        
        var clear = new Clear();
        
        var input = new Input();

        var activeIsland = null;
        
        var activateIsland = function(island){
            activeIsland = island;
            camera.viewables = [];
            camera.viewables.push(camera.makeTrackable(island.x, island.y));
            //camera.viewables.push(camera.makeTrackable(island.x + island.w, island.y + island.h));
        };

        this.Island = function(name, x, y, w, h){
            this.name = name;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.contains = function(o){
                if (!o.hasOwnProperty('x') || !o.hasOwnProperty('y')){
                    return false;
                }
                var o_w = camera.getWorldCoords(o.x, o.y);

                return (
                    (o_w.x > this.x) && (o_w.x < (this.x + this.w)) &&
                    (o_w.y > this.y) && (o_w.y < (this.y + this.h))
                );
            };
            this.highlight = function(context){
                context.fillRect(this.x, this.y, this.w, this.h);
            };
            
        };
        
        var islands = [];
        input.setButtonId('lclick', 'mouse', 1);
        this.addIsland = function(island){
            islands.push(island);
            input.setUI(island.name, island, ['lclick']);
        };
        
        this.update = function(context, timediff, timestamp){
            input.update(context);
        };
        
        this.draw = function(context, timediff, timestamp){
            context.save();
            clear.draw(context);
            camera.update(context, timediff, timestamp);
            img.draw(context, timediff, timestamp);

            if (activeIsland){
                this.drawActiveIsland();
            } else {
                context.save();
                context.fillStyle = "rgba(255, 255, 255, 0.5)";
                for (var i = 0; i < islands.length; ++i) {
                    if (input.isUIPush(islands[i].name)) {
                        activateIsland(islands[i]);
                    } else if (input.isUIOver(islands[i].name)) {
                        islands[i].highlight(context);
                    }
                }
                context.restore();
            }
            camera.draw(context, timediff, timestamp);
            
            context.restore();
        };
        
        this.drawActiveIsland = function(context, timediff, timestamp){
            
        };
        
        
        return this;
    })();
    
    worldMap.addIsland(new worldMap.Island('island1', -215, 280, 65, 70));
    worldMap.addIsland(new worldMap.Island('island2', -25, 265, 70, 50));
    worldMap.addIsland(new worldMap.Island('island3', 180, 290, 70, 55));
    

    loop.addItem(worldMap);

})(window, console, document);