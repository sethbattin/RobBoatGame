
(function(global, io, doc){
    var canvas;
    global.canvas = canvas = doc.getElementById('game');
    canvas.addEventListener('contextmenu', function(ev) {
        ev.preventDefault();
    });
    var loop = new GameLoop(canvas);
    GLInput.mouse.setViewPort(canvas);
    
    manager.loadAssets();
    
    var worldMap = new WorldMap();
    initWorldMap(worldMap);

    var islandUI = {
        input: new Input(),
        activeIsland: null,
        setSailRegion: new UIRegion(40, 40, 140, 60),
        fightRegion: new UIRegion(40, 110, 140, 60),
        update:function(context, timediff, timestamp){
            this.input.update(context);
            if (this.input.isUIPush('setsail')){
                worldMap.activateIsland(null);
            }
        },
        draw: function(context, timediff, timestamp){
            context.save();
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.font = "bolder 32px arial";
            context.testAlign = "left";
            
            // set sail button
            var r = this.setSailRegion;
            if (this.input.isUIOver('setsail')){
                context.fillStyle = "rgba(255, 255, 255, 0.25)";
                context.fillRect(r.x, r.y, r.w, r.h);
                context.fillStyle = "white";
                context.fillText('Set Sail', r.x + 11, r.y + 41);
            }
            context.fillStyle = "black";
            context.fillText('Set Sail', r.x + 10, r.y + 40);

            // fight button
            r = this.fightRegion;
            if (this.input.isUIOver('fight')){
                context.fillStyle = "rgba(255, 255, 255, 0.25)";
                context.fillRect(r.x, r.y, r.w, r.h);
                context.fillStyle = "white";
                context.fillText('Fight!', r.x + 11, r.y + 41);
            }
            context.fillStyle = "black";
            context.fillText('Fight!', r.x + 10, r.y + 40);

            context.restore();
        }
    };
    islandUI.input.setButtonId('lclick', 'mouse', 1);
    islandUI.input.setUI('setsail', islandUI.setSailRegion, ['lclick']);
    islandUI.input.setUI('fight', islandUI.fightRegion, ['lclick']);
        
    var game = new (function Game(){
        this.activeIsland = null;
        this.update = function(context, timediff, timestamp){
            worldMap.update(context, timediff, timestamp);
            if (this.activeIsland){
                islandUI.update(context, timediff, timestamp);
            }
        };
        this.draw = function(context, timediff, timestamp){
            worldMap.draw(context, timediff, timestamp);
            if (this.activeIsland){
                islandUI.draw(context, timediff, timestamp);
            }
        };
    })();
    worldMap.addActivateListener(function(island){
        islandUI.activeIsland = island;
        game.activeIsland = island;
    });

    loop.addItem(game);

})(window, console, document);

function initWorldMap(worldMap){

    var islandData = [

        ['island1', -215, 280, 65, 70, ['island4', 'island5', 'island6']],
        ['island2', -30, 265, 75, 50, ['island6', 'island7']],
        ['island3', 180, 290, 70, 55, ['island7', 'tree isle', 'runt island']],
        ['island4', -395, 240, 85, 70, ['sperm diamond island', 'jacked hylian']],
        ['island5', -250, 180, 75, 60, ['jacked hylian', 'stark banner']],
        ['island6', -115, 165, 75, 60, ['jacked hylian', 'stark banner']],
        ['island7', 5, 170, 150, 75, ['stark banner', 'V for vagina']],
        ['tree isle', 195, 165, 80, 95, ['V for vagina', 'spear island']],
        ['runt island', 320, 240, 55, 45, ['spear island']],
        ['sperm diamond island', -450, 85, 100, 90, ['danger penis']],
        ['jacked hylian', -305, 65, 85, 75, ['danger penis', 'crater bowl']],
        ['stark banner', -115, 50, 130, 60, ['crater bowl', 'i like turtles']],
        ['V for vagina', 100, 55, 80, 70, ['i like turtles', 'egg of doom']],
        ['spear island', 215, 95, 200, 85, ['left mount', 'Chondrichthyes']],
        ['danger penis', -480, -55, 255, 80, ['trapped pacman', 'triforce']],
        ['crater bowl', -165, -55, 65, 70, ['horny island', 'Old God\'s Island \\ Pushishment Isle (disputed)']],
        ['i like turtles', -20, -50, 80, 70, ['Old God\'s Island \\ Pushishment Isle (disputed)', 'Zen Isle']],
        ['egg of doom', 135, -50, 70, 85, ['Zen Isle', 'crappy rocks']],
        ['left mouth', 280, -10, 80, 50, ['crappy rocks', 'dagger island']],
        ['Chondrichthyes', 380, -5, 120, 75, ['crappy rocks', 'dagger island']],
        ['trapped pacman', -480, -160, 100, 95, ['mega plug']],
        ['triforce', -340, -170, 90, 75, ['mega plug']],
        ['horny island', -200, -165, 80, 80, ['mega plug 2']],
        ['Old God\'s Island \\ Pushishment Isle (disputed)',
            -75, -165, 90, 90, ['mega plug 2']],
        ['Zen Isle', 95, -170, 90, 80, ['round land']],
        ['crappy rocks', 290, -115, 70, 50, ['round land', 'the bat, man']],
        ['dagger island', 415, -105, 75, 75, ['the bat, man']],
        ['mega plug', -455, -240, 160, 75, ['round land 2']],
        ['mega plug 2', -180, -240, 180, 65, ['round land 3']],
        ['round land', 175, -225, 65, 50, ['death lizard']],
        ['the bat, man', 325, -230, 165, 75, ['death lizard']],
        ['round land 2', -320, -325, 85, 75, ['the end']],
        ['round land 3', -115, -320, 90, 60, ['the end']],
        ['death lizard', 110, -350, 110, 90, ['the end']],
        ['the end', -100, -380, 80, 80, []]
    ];

    for( var i = 0; i < islandData.length; ++i){
        worldMap.addIsland(
            islandData[i][0],
            islandData[i][1],
            islandData[i][2],
            islandData[i][3],
            islandData[i][4]
        );
    }

    var mapRoot = worldMap.initGraph(
        new worldMap.Island('start', 0, 350, 1, 1));
    worldMap.addIslandPath('start', 'island1');
    worldMap.addIslandPath('start', 'island2');
    worldMap.addIslandPath('start', 'island3');

    for( var i = 0; i < islandData.length; ++i){
        for (var j = 0; j < islandData[i][5].length; ++j){
            worldMap.addIslandPath(islandData[i][0], islandData[i][5][j]);
        }
    }
}
