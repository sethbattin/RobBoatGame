
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

        var camera = new WorldMapCamera();
        camera.debug = true;
        
        var clear = new Clear();
        
        var input = new Input();
        input.setButtonId('lclick', 'mouse', 1);

        var activeIsland = null;
        var currentNode = null;
        
        var activateIsland = function(island){
            camera.zoomIsland = island;
            activeIsland = island;
            if (island) {
                currentNode = worldMap.getIslandNode(island.name);
            }
        };
        
        this.GraphNode = function(island){
            this.island = island;
            this.destinations = [];
            this.addDestination = function(node){
                if (!(node instanceof worldMap.GraphNode)){
                    return;
                }
                this.destinations.push(node);
            };
        };

        var islandGraph = {};
        this.initGraph = function(island){
            islandGraph.root = new worldMap.GraphNode(island);
            currentNode = islandGraph.root;
            return islandGraph.root;
        };
        this.getIslandNode = function(name, node){
            if (typeof(node) == 'undefined'){
                node = islandGraph.root;
            }
            if (node.island.name == name){
                return node;
            } else {
                var _node;
                for (var i = 0; i < node.destinations.length; ++i){
                    _node = this.getIslandNode(name, node.destinations[i]);
                    if (_node){
                        return _node;
                    }
                }
            }
            return null;
        };
        this.addIslandPath = function(from, to){
            var startNode = this.getIslandNode(from);
            var island = null;
            if (!startNode){
                island = this.getIsland(from);
                if (!island){
                    return;
                }
                startNode = new worldMap.GraphNode(island);
            }
            var endNode = this.getIslandNode(to);
            if (!endNode){
                island = this.getIsland(to);
                if (!island){
                    return;
                }
                endNode = new worldMap.GraphNode(island);
            }
            startNode.addDestination(endNode);
        };
        
        var boat_img = Sprite.fromAsset('boat');
        var boat = {
            boat_img : boat_img,
            position: {x: 0, y: 0},
            _position: {x: 0, y: 400},
            lerpRate: 0.07,
            counter: 0,
            period: 4,
            update: function(context, timediff, timestamp){
                this.counter += timediff / 1000 / this.period * 2 * Math.PI;
                if (this.counter > Math.PI) { this.counter -= (2 * Math.PI);}
                this.boat_img.offset.y = (0.5 + 0.05 * Math.sin(this.counter));
                this.boat_img.rotation = Math.PI / 32 * Math.sin(this.counter + Math.PI / 4);
                this.position = currentNode.island.center();
                this._position.x += (this.position.x - this._position.x) * this.lerpRate;
                this._position.y += (this.position.y - this._position.y) * this.lerpRate;
                this.boat_img.setPosition(this._position);
            },
            draw: function(context, timediff, timestamp){
                this.boat_img.draw(context, timediff, timestamp);
            }
        };
        
        var islandUI = {
            setSailRegion: {
                x: 40,
                y: 40,
                w: 140,
                h: 40,
                contains: function(o){
                    return (
                        (o.x > this.x) && (o.x < (this.x + this.w)) &&
                        (o.y > this.y) && (o.y < (this.y + this.h))
                    );
                }
            },
            update:function(context, timediff, timestamp){
                if (input.isUIPush('setsail')){
                    activateIsland(null);
                }
            },
            draw: function(context, timediff, timestamp){
                context.save();
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.font = "bolder 32px arial";
                if (input.isUIOver('setsail')){
                    context.fillStyle = "white";
                    context.fillText('Set Sail', 91, 51);
                }
                context.fillStyle = "black";
                context.fillText('Set Sail', 90, 50);
                
                context.restore();
            }
        };
        input.setUI('setsail', islandUI.setSailRegion, ['lclick']);

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
                var o_w = camera.getWorldCoords(o.x, o.y, canvas);

                return (
                    (o_w.x > this.x) && (o_w.x < (this.x + this.w)) &&
                    (o_w.y > this.y) && (o_w.y < (this.y + this.h))
                );
            };
            this.highlight = function(context){
                context.fillRect(this.x, this.y, this.w, this.h);
                
            };
            this.center = function(){
                return {x: this.x + this.w / 2, y: this.y + this.h / 2}
            };
            this.drawUI = function(context){
                islandUI.draw(context);
            };
            
        };
        
        var islands = [];
        this.addIsland = function(name, x, y, w, h){
            var island = new this.Island(name, x, y, w, h);
            islands.push(island);
            input.setUI(island.name, island, ['lclick']);
        };
        this.getIsland = function(name){
            for (var i in islands){
                if (islands[i].name == name){
                    return islands[i];
                }
            }
            return null;
        };
        
        this.update = function(context, timediff, timestamp){
            input.update(context);
            boat.update(context, timediff, timestamp);
            if (activeIsland){
                islandUI.update(context, timediff, timestamp);
            } else {
                var dests = currentNode.destinations;
                for (var i = 0; i < dests.length; ++i) {
                    if (input.isUIPush(dests[i].island.name)) {
                        activateIsland(dests[i].island);
                    }
                }
            }
        };
        
        this.draw = function(context, timediff, timestamp){
            context.save();
            clear.draw(context);
            camera.update(context, timediff, timestamp);
            img.draw(context, timediff, timestamp);

            if (!activeIsland){
                this.drawBoat(context, timediff, timestamp);
                this.drawWorld(context);
            } else {
                this.drawActiveIsland(context);
            }
            camera.draw(context, timediff, timestamp);
            
            context.restore();
        };
        this.drawBoat = function(context, timediff, timestamp){
            boat.draw(context, timediff, timestamp);
        };
        this.drawWorld = function(context){
            context.save();
            context.fillStyle = "rgba(255, 255, 255, 0.5)";
            var dests = currentNode.destinations;
            for (var i = 0; i < dests.length; ++i) {
               if (input.isUIOver(dests[i].island.name)) {
                    dests[i].island.highlight(context);
                }
            }
            context.restore();
        };
        
        this.drawActiveIsland = function(context){
            context.save();
            context.textAlign = "center";
            var c = activeIsland.center();
            context.fillText(activeIsland.name, c.x, c.y);
            context.restore();
            activeIsland.drawUI(context);
        };
        
        
        return this;
    })();
    
    worldMap.addIsland('island1', -215, 280, 65, 70);
    worldMap.addIsland('island2', -30, 265, 75, 50);
    worldMap.addIsland('island3', 180, 290, 70, 55);
    worldMap.addIsland('island4', -395, 240, 85, 70);
    worldMap.addIsland('island5', -250, 180, 75, 60);
    worldMap.addIsland('island6', -115, 165, 75, 60);
    worldMap.addIsland('island7', 5, 170, 150, 75);
    worldMap.addIsland('tree isle', 195, 165, 80, 95);
    worldMap.addIsland('runt island', 320, 240, 55, 45);
    
    var mapRoot = worldMap.initGraph(
        new worldMap.Island('start', 0, 350, 1, 1));
    worldMap.addIslandPath('start', 'island1');
    worldMap.addIslandPath('start', 'island2');
    worldMap.addIslandPath('start', 'island3');
    
    worldMap.addIslandPath('island1', 'island4');
    worldMap.addIslandPath('island1', 'island5');
    worldMap.addIslandPath('island1', 'island6');
    
    worldMap.addIslandPath('island2', 'island6');
    worldMap.addIslandPath('island2', 'island7');
    
    worldMap.addIslandPath('island3', 'island7');
    worldMap.addIslandPath('island3', 'tree isle');
    worldMap.addIslandPath('island3', 'runt island');

    loop.addItem(worldMap);

})(window, console, document);