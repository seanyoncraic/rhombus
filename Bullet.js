var Bullet = function() {
	// custom events


	// bullet state constants
	var KILLED = BulletState.KILLED;
	var MOVING = BulletState.MOVING;

	// access to globals
    var stage = Globals.stage;
    var assetManager = Globals.assetManager;
	var objectPool = Globals.objectPool;

	// private property variables
	var owner = null;

	// private variables
	// state of bullet
	var state = 0;
	var damage = 0;
	var canvas = Globals.stage.canvas;
	var stageLeft = -10;
	var stageRight = canvas.width + 10;
	var stageTop = -10;
	var stageBottom = canvas.height + 10;
	var xDisplace, yDisplace;
	//var distance;
	// access to this object from callbacks [out of scope issues]
	var _this = this;
	// access to pool objects
	var shapePool = objectPool.shapePool;
	var player = objectPool.playerPool[0];

	// grab clip for bullet
	var sprite = assetManager.getSprite("assets","bullet");


	// ------------------------------------------------------ get/set methods


	// ------------------------------------------------------ private methods
	

	// ------------------------------------------------------ public methods
	this.startMe = function(myOwner, spriteFrame, speed, myDamage, x, y, r) {
		// initialization
		owner = myOwner;
		//ownerType = owner.type;

		state = BulletState.MOVING;
		//distance = 0;
		damage = myDamage;
		xDisplace = Globals.cosTable[r] * speed;
		yDisplace = Globals.sinTable[r] * speed;
		sprite.gotoAndStop(spriteFrame);
		sprite.x = x;
		sprite.y = y;
		sprite.rotation = r;

		/*
		// play bullet sound effect
		if ((ownerType == "RedPlane") || (ownerType == "RedTank") || (ownerType == "RedJeep") || (ownerType == "RedBunker")) createjs.Sound.play("RedFire");
		else createjs.Sound.play("BlueFire");
		*/

		// place bullet on displaylist behind the owner
		var index = stage.getChildIndex(owner.sprite);
		stage.addChildAt(sprite, index);
	};

	this.stopMe = function() {
		// remove bullet
		sprite.stop();
		sprite.y = -2000;
		// return this object to the object pool
		objectPool.dispose(_this);
		stage.removeChild(sprite);
	};

	this.killMe = function(explode) {
		// initialization
		state = BulletState.KILLED;
		// reset variables
		xDisplace = 0;
		yDisplace = 0;
		// memory management
		owner = null;

		if (explode) {
			// explode bullet
			sprite.gotoAndPlay("bulletExplosion");
			sprite.addEventListener("animationend",function(e){
				e.remove();
				_this.stopMe();
			});
		} else {
			this.stopMe();
		}
	};

	this.updateMe = function(){
		// STEP I : Bullet Behaviour
		if (state == BulletState.MOVING) {

			// move bullet x and y position
			sprite.x += xDisplace;
			sprite.y += yDisplace;			

			// check if bullet off the screen
			if ((sprite.y > stageBottom) || ((sprite.x < stageLeft) || (sprite.x > stageRight) || (sprite.y < stageTop))) {
				this.killMe();
				return;
			}

			// STEP II : collision detection
			if (owner.constructor.name == "Player") {
				// Player's bullet
				var length = shapePool.length;
				// has the bullet collided with a shape?
				for (var n=0; n<length; n++) {	
					var shape = shapePool[n];
					if ((shape.used) && (shape.getState() !== ShapeState.KILLED) && (ndgmr.checkPixelCollision(sprite, shape.sprite, 0, true))) {
						shape.killMe();
						this.killMe();
					}
				}
			} else if (owner.constructor.name == "Shape") {
				// Shape's bullet
				if ((player.getState() !== PlayerState.KILLED) && (player.getState() !== PlayerState.HIT) && (ndgmr.checkPixelCollision(sprite, player.sprite, 0, true))) {
					player.hitMe();
					this.killMe(true);
				}

			}

		}
	};
};

var BulletState = {
	"KILLED":-1,
	"MOVING":1
};
