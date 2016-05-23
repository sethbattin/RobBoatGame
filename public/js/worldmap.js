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

var WorldMap = function(){
    var img = Sprite.fromAsset('map');
    img.rotation = 0;

    var camera = new WorldMapCamera();
    camera.debug = true;

    var clear = new Clear();

    var input = new Input();
    input.setButtonId('lclick', 'mouse', 1);

    var activeIsland = null;
    var currentNode = null;
    
    var activeListeners = [];
    this.addActivateListener = function(listener){
        if (!(typeof listener == 'function')){
            return;
        }
        activeListeners.push(listener);
    };
    this.removeActivateListener = function(listener){
        for (var i = 0; i < activeListeners.length; ++i){
            if (activeListeners[i] == listener){
                activeListeners.splice(i, 1);
            }
        }
    };

    this.activateIsland = function(island){
        camera.zoomIsland = island;
        activeIsland = island;
        if (island) {
            currentNode = this.getIslandNode(island.name);
        }
        for (var i = 0; i < activeListeners.length; ++i){
            activeListeners[i](island);
        }
    };

    var GraphNode = function(island){
        this.island = island;
        this.destinations = [];
        this.addDestination = function(node){
            if (!(node instanceof (GraphNode))){
                return;
            }
            this.destinations.push(node);
        };
    };

    var islandGraph = {};
    this.initGraph = function(island){
        islandGraph.root = new GraphNode(island);
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
            startNode = new GraphNode(island);
        }
        var endNode = this.getIslandNode(to);
        if (!endNode){
            island = this.getIsland(to);
            if (!island){
                return;
            }
            endNode = new GraphNode(island);
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


    var Island = this.Island = function(name, x, y, w, h){
        this.name = name;
        Island.prototype.constructor.call(this, x, y, w, h);
        this.contains = function(o){
            if (!o.hasOwnProperty('x') || !o.hasOwnProperty('y')){
                return false;
            }
            var o_w = camera.getWorldCoords(o.x, o.y);

            return Island.prototype.contains.call(this, o_w);
        };
        this.highlight = function(context){
            context.fillRect(this.x, this.y, this.w, this.h);

        };

    };
    this.Island.prototype  = new UIRegion();

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
        if (!activeIsland){
            var dests = currentNode.destinations;
            for (var i = 0; i < dests.length; ++i) {
                if (input.isUIPush(dests[i].island.name)) {
                    this.activateIsland(dests[i].island);
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
    };


    return this;
}