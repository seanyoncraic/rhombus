var Turret = function(){
    // custom events
    var killedEvent = new createjs.Event("gameEvent", true);
    killedEvent.id = "turretKilled";
    killedEvent.points = 0;

    // set references to globals
    var stage = Globals.stage;
    var assetManager = Globals.assetManager;
    var objectPool = Globals.objectPool;
    var gameConstants = Globals.gameConstants;
    var randomMe = Globals.randomMe;

    // property variables
    var state = ShapeState.ATTACKING;

    // private game variables
    var _this = this;
    var type = "";
    var points = 0;
    var hitPoints = 0;
    var halfHitPoints = 0;
    var owner = null;
    var shootFreq = 0;
    var bulletType = "";
    var frameCounter = 0;
    var accuracy = 0;
    var spawnMax = 10;
    var spawnCount = 0;
    // reference to Player object (the target!)
    var player = objectPool.playerPool[0];    
    // get shape's sprite
    var sprite = assetManager.getSprite("assets");

    // make sprite public for easy access
    this.sprite = sprite;
    this.radius = 0;

    // ----------------------------------------------- get/set methods
    this.getState = function() {
        return state;
    };

    // ----------------------------------------------- public methods
    this.startMe = function(myType, startX, startY, freq, myBulletType, myOwner) {
        // shape initialization
        frameCounter = 0;
        type = myType;
        state = ShapeState.ATTACKING;
        owner = myOwner;
        shootFreq = freq;
        hitPoints = gameConstants.SHAPES[type].hp;
        this.radius = gameConstants.SHAPES[type].radius;
        spawnCount = 0;
        // turrets get a bonus accuracy
        accuracy = gameConstants.SHAPES[type].accuracy + gameConstants.TURRET_BONUS_ACCURACY;
        halfHitPoints = hitPoints/2;
        bulletType = myBulletType;

        // jump to frame
        sprite.gotoAndStop(type);

        // position sprite
        sprite.x = startX;
        sprite.y = startY;
        sprite.rotation = 0;

        // add turret to big boss' body
        owner.sprite.addChild(sprite);
    };

    this.stopMe = function() {
        // remove Shape
		sprite.stop();
		owner.sprite.removeChild(sprite);    
		// return this object to the object pool
		objectPool.dispose(this);
    };

    this.killMe = function(damage) {
        // remove hitpoints according to bullet damage
        hitPoints-=damage;

        // show damage if not done already?
        if ((hitPoints <= halfHitPoints) && (sprite.currentAnimation.indexOf("Damage") === -1)) {
            type = type + "Damage";
            sprite.gotoAndStop(type);
        }

        if (hitPoints <= 0) {
            state = ShapeState.KILLED;
            sprite.gotoAndPlay("explosionNoPoints");
            createjs.Sound.play("explosion3");
            sprite.addEventListener("animationend",function(e){
                e.remove();
                _this.stopMe();
                // a turret has been destroyed - notify its owner
                owner.turretKilled();
            });
            // was destroyed
            return true;
        } else {
            // play damage explosion
            if (sprite.currentAnimation != (type + "Hit")) sprite.gotoAndPlay(type + "Hit");
            sprite.addEventListener("animationend", function(e) {
                e.remove();
                sprite.gotoAndStop(type);
            });
            createjs.Sound.play("enemyHit");
            // was not destroyed
            return false;
        }
    }

    this.fireMe = function() {
        // put cap on number of shapes spawn
        if (spawnCount > spawnMax) return;
        // play firing animation
        sprite.gotoAndPlay(type + "Fire");
        sprite.addEventListener("animationend",function(e){
            e.remove();
            sprite.gotoAndStop(type);
        });

        // switch coords to stage from container of bigboss
        var turretPoint = owner.sprite.localToGlobal(sprite.x,sprite.y);
        if (bulletType.indexOf("bullet") === -1) {
            // release a shape instead of a bullet
            var shootData = null;
            // drop shape into the game
            var shape = objectPool.getShape();
            // start the shape and pass along required data
            shape.startMe(bulletType, 
                          turretPoint.x,turretPoint.y, "", 
                          {index:0, freq:60, bulletType:"bullet1"}, 
                          {type:"kamikaze", speed:3, rotate:true});

            spawnCount++;
            createjs.Sound.play("enemyReleaseShape");
        } else {
            // fire regular bullet!
            var randomNum = randomMe(0,99);
            var targetX = player.sprite.x;
            var targetY = player.sprite.y;
            if (randomNum >= accuracy) {
                if (randomMe(1,2) == 1) targetX += randomMe(-50,-20);
                else targetX += randomMe(20,50);
            }

            // get targetAngle of target relative to shape's sprite
            var targetAngle = Math.floor(180 + (Math.atan2(turretPoint.y - targetY, turretPoint.x - targetX) * 57.2957795));

            // release the bullet!
            var bullet = objectPool.getBullet();
            var bulletSpeed = 6;
            var bulletDamage = 1;
            var bulletRadius = 5;
            if (bulletType === "bullet2") {
                bulletSpeed = 8;
                bulletDamage = 2;
                bulletRadius = 10;
            } else if (bulletType === "bullet3") {
                bulletSpeed = 10;
                bulletDamage = 3;
                bulletRadius = 15;
            }

            // myType, myOwner, spriteFrame, mySpeed, myDamage, myInvincible, x, y, r
            bullet.startMe(bulletType, owner, bulletType, bulletSpeed, bulletDamage, false, turretPoint.x, turretPoint.y, targetAngle, bulletRadius);
            createjs.Sound.play("enemyShoot");
        }
    };

    this.updateMe = function() {
        if (state === ShapeState.KILLED) return;

        // Step II : Attacking
        if (frameCounter >= shootFreq) {
            if (player.getState() != PlayerState.KILLED) {    
                this.fireMe();
                frameCounter = 0;
            }
        }

        frameCounter++;
    };

};