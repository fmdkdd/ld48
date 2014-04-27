var u = utils;
var v = u.vec;
var c = u.collisions;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Game

var game = {
	objects: [],
	newObjects: [],
	waveDifficulty: 0,
	sprites: {},
	sounds: {},
	viewRadius: 1800,
	offCanvas: document.createElement('canvas'),

	add: function(obj) {
		this.newObjects.push(obj);
	},

	init: function(ctxt) {
		this.add(hero);
		hero.init();

		// Load sprites
		this.sprites.hero = [
			loadSprite('art/hero1.png'),
			loadSprite('art/hero1.png'),
			loadSprite('art/hero1.png'),
			loadSprite('art/hero1.png'),
			loadSprite('art/hero1.png'),
			loadSprite('art/hero1.png'),

			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),

			loadSprite('art/hero3.png'),
			loadSprite('art/hero3.png'),
			loadSprite('art/hero3.png'),
			loadSprite('art/hero3.png'),
			loadSprite('art/hero3.png'),
			loadSprite('art/hero3.png'),

			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),
			loadSprite('art/hero2.png'),

			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),

			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),

			loadSprite('art/hero6.png'),
			loadSprite('art/hero6.png'),
			loadSprite('art/hero6.png'),
			loadSprite('art/hero6.png'),
			loadSprite('art/hero6.png'),
			loadSprite('art/hero6.png'),

			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),
			loadSprite('art/hero5.png'),

			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
			loadSprite('art/hero4.png'),
		]
		this.sprites.heroHit = loadSprite('art/heroHit.png');
		this.sprites.heroDead = loadSprite('art/heroDead.png');
		this.sprites.mob = loadSprite('art/mob.png');
		this.sprites.hitMob = loadSprite('art/hitMob.png');
		this.sprites.deadMob = loadSprite('art/deadMob.png');
		this.sprites.lightMask = loadSprite('art/light.png');
		this.sprites.light = loadSprite('art/light2.png');
		this.sprites.boostIcon = loadSprite('art/boost-icon.png');
		this.sprites.rayIcon = loadSprite('art/ray-icon.png');
		this.sprites.doomIcon = loadSprite('art/boost-icon.png');
		this.sprites.floor = [
			loadSprite('art/floor.png'),
			loadSprite('art/floor2.png'),
			loadSprite('art/floor3.png'),
			loadSprite('art/floor.png'),
			loadSprite('art/floor2.png'),
			loadSprite('art/floor.png'),
			loadSprite('art/floor4.png'),
			loadSprite('art/floor4.png'),
		];
		this.sprites.rayStart = loadSprite('art/rayStart.png');
		this.sprites.rayEnd = loadSprite('art/rayEnd.png');
		this.sprites.ray = [
			loadSprite('art/ray1.png'),
			loadSprite('art/ray1.png'),
			loadSprite('art/ray1.png'),
			loadSprite('art/ray1.png'),

			loadSprite('art/ray2.png'),
			loadSprite('art/ray2.png'),
			loadSprite('art/ray2.png'),
			loadSprite('art/ray2.png'),

			loadSprite('art/ray3.png'),
			loadSprite('art/ray3.png'),
			loadSprite('art/ray3.png'),
			loadSprite('art/ray3.png'),
		];

		// Load sounds
		this.sounds.growl = new Audio("sound/growl.wav");
		this.sounds.growl.volume = 0.1;

		this.sounds.hit = new Audio("sound/hit.wav");
		this.sounds.hit.volume = 0.05;
	},

	resize: function(w, h) {
		this.width = this.offCanvas.width = w;
		this.height = this.offCanvas.height = h;
		this.offCanvas.getContext('2d').mozImageSmoothingEnabled = false;
	},

	update: function() {
		if (this.over) return;

		// No more mobs, time to add more!
		if (this.noMoreMobs()) {
			this.waveDifficulty += 5;
			makeMobWave(this.waveDifficulty).forEach(function(m) {
				this.add(m);
			}.bind(this));

			game.sounds.growl.play();
		}

		var keep = [];
		this.objects.forEach(function(o) {
			if (o.update() !== 'garbage')
				keep.push(o);
		});
		this.objects = keep.concat(this.newObjects);
		this.newObjects.length = 0;

		this.checkCollisions();
	},

	checkCollisions: function() {
		for (var i=0; i < this.objects.length; ++i) {
			for (var j = i+1; j < this.objects.length; ++j) {
				var o1 = this.objects[i];
				var o2 = this.objects[j];
				checkCollision(o1, o2);
			}
		}
	},

	render: function(ctxt) {
		this.drawFloor(ctxt);
		// ctxt.fillStyle = 'white';
		// ctxt.fillRect(0, 0, game.width, game.height);

		// Skip hero, to draw her on top
		for (var i = 1; i < this.objects.length; ++i) {
			var o = this.objects[i];
			this.drawObject(ctxt, o);
		}

		this.drawObject(ctxt, hero);

		this.drawEffects(ctxt);

		this.drawUI(ctxt);

		if (this.over)
			this.viewRadius -= 20;
		if (this.viewRadius <= 200) {
			this.viewRadius = 200;
			this.drawGameOver(ctxt);
		}
	},

	drawFloor: function(ctxt) {
		var i = 0;
		for (var y = 0; y < game.height; y += 64) {
			for (var x = 0; x < game.width; x += 64) {
				ctxt.save();
				ctxt.translate(x, y);
				ctxt.drawImage(this.sprites.floor[i], 0, 0, 64, 64);
				ctxt.restore();

				i = (i + 1) % this.sprites.floor.length;
			}
		}
	},

	drawObject: function(ctxt, o) {
		o.draw(ctxt);
		if (debug.drawHitBoxes)
			debug.drawHitBox(ctxt, o);
	},

	drawEffects: function(ctxt) {
		var center = hero.pos;
		var radius = this.viewRadius;

		var c = this.offCanvas.getContext('2d');
		c.save();
		c.clearRect(0, 0, game.width, game.height);
		c.fillStyle = 'black';
		c.fillRect(0, 0, game.width, game.height);
		c.globalCompositeOperation = 'destination-out';
		c.translate(center.x, center.y);
		c.drawImage(this.sprites.lightMask, -radius/2, -radius/2,
								radius, radius);
		c.globalCompositeOperation = 'source-over';
		c.drawImage(this.sprites.light, -radius/2, -radius/2,
								radius + u.random(5), radius + u.random(5));
		c.restore();

		ctxt.drawImage(this.offCanvas, 0, 0);
	},

	drawUI: function(ctxt) {
		var x = game.width/3;

		// Draw life
		var size = 64;
		var lifep = hero.life / 100;
		ctxt.lineWidth = 4;
		ctxt.strokeStyle = '#a35';
		ctxt.strokeRect(x, game.height - size, size, size);

		ctxt.fillStyle = '#d35';
		ctxt.fillRect(x, game.height - (size * lifep),
									size, size * lifep);

		x += 100;

		// Draw skill bar

		// Boost icon
		ctxt.drawImage(this.sprites.boostIcon, x, game.height - 64, 64, 64);
		if (hero.beforeNextBoost > 0) {
			var timep = hero.beforeNextBoost / hero.boostCooldown;
			ctxt.fillStyle = 'rgba(0,0,0,0.8)';
			ctxt.fillRect(x, game.height - 64, 64, 64 * timep);
		}

		x += 64;

		// Ray of death icon
		ctxt.drawImage(this.sprites.rayIcon, x, game.height - 64, 64, 64);
		if (hero.power < hero.deathRayCost) {
			ctxt.fillStyle = 'rgba(0,0,0,0.8)';
			ctxt.fillRect(x, game.height - 64, 64, 64);
		}

		//x += 64;

		// Circle of doom icon
		// ctxt.drawImage(this.sprites.doomIcon, x, game.height - 64, 64, 64);
		// if (hero.power < hero.doomCost) {
		// 	ctxt.fillStyle = 'rgba(0,0,0,0.8)';
		// 	ctxt.fillRect(x, game.height - 64, 64, 64);
		// }

		x += 100;

		// Draw power bar
		size = 64;
		var herop = hero.power / 100;
		ctxt.strokeStyle = '#9ad';
		ctxt.strokeRect(x, game.height - size, size, size);

		ctxt.fillStyle = '#9af';
		ctxt.fillRect(x, game.height - (size * herop),
									size, size * herop);
	},

	drawGameOver: function(ctxt) {
		var score = hero.mobKilled;
		var off = v.point(-60, -100);
		var center = hero.pos;

		ctxt.font = '30px Monospace';
		ctxt.fillStyle = '#a00';
		ctxt.fillText('You died.', center.x + off.x, center.y + off.y);
		off.y += 30;
		ctxt.fillText('Score: ' + score, center.x + off.x, center.y + off.y);
	},

	noMoreMobs: function() {
		return !this.objects.some(function(o) {
			return o.type === 'mob' && !o.dead;
		});
	}
};

function loadSprite(url) {
	var s = document.createElement('img');
	s.src = url;
	return s;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Debug

var debug = {
	drawHitBoxes: false,

	drawHitBox: function(ctxt, o) {
		if (o.hitBox && o.hitBox.points.length) {
			var ps = o.hitBox.points;

			ctxt.strokeStyle = 'pink';
			ctxt.lineWidth = 2;
			ctxt.beginPath();
			ctxt.moveTo(ps[0].x, ps[0].y);
			for (var i = 1; i < ps.length; ++i) {
				ctxt.lineTo(ps[i].x, ps[i].y);
			}
			ctxt.lineTo(ps[0].x, ps[0].y);
			ctxt.stroke();
		}
	},
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Game objects

var gameObj = {
	update: function() {},
	draw: function() {},
};

function makeObj(type) {
	var o = Object.create(gameObj);
	o.type = type;
	return o;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Hero

var hero = {
	type: 'hero',
	pos: v.point(0, 0),
	vel: v.point(0, 0),
	dir: 0,
	speed: 3,
	boostCooldown: 5 * 60,
	beforeNextBoost: 0,
	deathRayCost: 2,
	doomCost: 50,
	size: 64,
	power: 100,
	life: 100,
	mobKilled: 0,
	hitBox: {
		type: 'polygon',
		points: [],
	},

	init: function() {
		this.pos = v.point(game.width / 2, game.height / 2);
	},

	update: function() {
		if (this.life <= 0) {
			this.dead = true;
			game.over = true;
			return;
		}

		// Regain power and life
		if (this.power < 100) this.power += 1;
		if (this.life < 100) this.life += .1;

		if (this.beforeNextBoost > 0)
			this.beforeNextBoost--;

		this.hit = false;

		// Movement
		if (!this.attacking && this.goal) {
			if (v.distance(this.pos, this.goal) > this.speed) {
				this.vel = v.unit(v.vector(this.pos, this.goal));
				this.vel = v.times(this.vel, this.speed);
				this.pos = v.plus(this.pos, this.vel);
				this.dir = Math.atan2(this.vel.y, this.vel.x);

				this.spriteIndex = (this.spriteIndex + 1) % game.sprites.hero.length;
				if (this.boosting)
					this.spriteIndex = (this.spriteIndex + 1) % game.sprites.hero.length;
			} else {
				this.goal = null;
				this.spriteIndex = 0;
			}
		}

		// Update hitbox
		var s = this.size/2;
		var hitBoxPoints = [
			v.point([-s/3, -s/1.3]),
			v.point([+s/2, -s/1.3]),
			v.point([+s/1.3, +s/1.3]),
			v.point([-s/3, +s/1.3]),
		];

		this.hitBox.points = hitBoxPoints.map(function(p) {
			p = v.rotate(p, this.dir);
			return v.plus(this.pos, p);
		}.bind(this));
	},

	spriteIndex: 0,

	draw: function(ctxt) {
		// Draw hero

		var sprite = game.sprites.hero[this.spriteIndex];
		if (this.dead)
			sprite = game.sprites.heroDead;
		else if (this.hit)
			sprite = game.sprites.heroHit;

		var off = this.size / 2;
		ctxt.save();
		ctxt.translate(this.pos.x, this.pos.y);
		ctxt.rotate(this.dir);
		ctxt.drawImage(sprite, -off, -off, this.size, this.size);
		ctxt.restore();
	},

	goTo: function(p) {
		this.goal = v.point(p);
	},

	beginAttack: function() {
		this.attacking = true;

		// Stop current movement
		this.goal = null;
	},

	stopAttack: function() {
		this.attacking = false;
	},

	//~~~~~~~~~~~~~~~~~~~~
	// Skills

	// Increased speed for a short time
	boost: function() {
		if (this.boosting || this.beforeNextBoost > 0) return;

		this.boosting = true;
		var oldSpeed = this.speed;
		this.speed = 6;
		this.boostDuration = 2 * 60;
		this.beforeNextBoost = this.boostCooldown;

		boost = makeObj('boost');
		boost.update = function() {
			if (this.boostDuration > 0) {
				this.boostDuration--;
			} else {
				this.speed = oldSpeed;
				this.boosting = false;
				return 'garbage';
			}
		}.bind(this);

		game.add(boost);
	},

	// A line that chips away the life of all enemies that touch it
	beginDeathRay: function(direction) {
		var cost = this.deathRayCost;

		if (this.power < cost) return;
		this.power -= cost;

		if (this.ray) return;
		this.beginAttack();

		this.ray = makeObj('ray');
		var size = 190;
		var width = 16;
		var end = v.times(v.unit(v.vector(this.pos, direction)), size);
		this.dir = Math.atan2(end.y, end.x);

		this.ray.hitBox = {
			type: 'polygon',
			points: []
		};

		var raySpriteIndex = 0;

		var sound = new Audio("sound/ray.wav");
		sound.volume = 0.1;
		sound.play();

		function stopSound() {
			if (sound) {
				sound.pause();
				sound = null;
			}
		}

		this.ray.draw = function(ctxt) {
			// ctxt.strokeStyle = 'blue';
			// ctxt.lineWidth = width;
			// ctxt.beginPath();
			// ctxt.moveTo(this.pos.x, this.pos.y);
			// ctxt.lineTo(this.pos.x + end.x, this.pos.y + end.y);
			// ctxt.stroke();

			var x = 18;

			ctxt.save();
			ctxt.translate(this.pos.x, this.pos.y);
			ctxt.rotate(this.dir + 0.1);
			ctxt.translate(x, -53);
			ctxt.drawImage(game.sprites.rayStart, 0, 0, 20, 64);
			ctxt.restore();

			x += 20;

			while (x < size) {
				ctxt.save();
				ctxt.translate(this.pos.x, this.pos.y);
				ctxt.rotate(this.dir + 0.1);
				ctxt.translate(x, -53);
				ctxt.drawImage(game.sprites.ray[raySpriteIndex], 0, 0, 12, 64);
				ctxt.restore();

				x += 12;

				ctxt.save();
				ctxt.translate(this.pos.x, this.pos.y);
				ctxt.rotate(this.dir + 0.1);
				ctxt.translate(x, -53);
				ctxt.drawImage(game.sprites.ray[raySpriteIndex], 0, 0, 12, 64);
				ctxt.restore();

				x += 12;
			}

			ctxt.save();
			ctxt.translate(this.pos.x, this.pos.y);
			ctxt.rotate(this.dir + 0.1);
			ctxt.translate(x, -53);
			ctxt.drawImage(game.sprites.rayEnd, 0, 0, 12, 64);
			ctxt.restore();

			raySpriteIndex = (raySpriteIndex + 1) % game.sprites.ray.length;

		}.bind(this);

		this.ray.update = function() {
			if (this.ray) {
				if (this.power < cost) {
					stopSound();
					return 'garbage';
				}
				this.power -= cost;

				var start = v.plus(this.pos, 0, 0);

				// Update direction
				end = v.times(v.unit(v.vector(start, mousePos)), size);
				this.dir = Math.atan2(end.y, end.x);

				// Update hitbox
				this.ray.hitBox.points = u.segmentToPoly(start, v.plus(start, end), width);

			} else {
				stopSound();
				return 'garbage';
			}
		}.bind(this);

		this.ray.stop = function() {
			this.ray = null;
			stopSound();
		}.bind(this);

		game.add(this.ray);
	},

	stopDeathRay: function() {
		this.stopAttack();
		this.ray.stop();
	},

	// A circle that eats the lives of all enemies in its radius
	circleOfDoom: function(pos) {
		var cost = this.doomCost;
		if (this.power < cost) return;
		this.power -= cost;

		if (this.circle) return;

		this.circle = makeObj('circle');
		var radius = 100;

		this.circle.hitBox = {
			type: 'circle',
			radius: radius,
			x: pos.x,
			y: pos.y,
		};

		this.circle.draw = function(ctxt) {
			ctxt.fillStyle = 'hsla(0, 70%, 70%, 0.5)';
			ctxt.beginPath();
			ctxt.arc(pos.x, pos.y, radius, 2*Math.PI, false);
			ctxt.fill();
		}.bind(this);

		var frames = 10;

		this.circle.update = function() {
			if (frames > 0) {
				frames--;
			} else {
				this.circle = null;
				return 'garbage';
			}
		}.bind(this);

		game.add(this.circle);
	},
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Mob

var mobProto = {
	type: 'mob',
	pos: v.point(0,0),
	vel: v.point(0,0),
	dir: 0,
	size: 15,
	speed: 1,

	update: function() {
		if (this.dead) {
			this.hitBox = null;
			return;
		}

		if (this.life <= 0) {
			hero.mobKilled++;
			this.dead = true;
		}

		if (!this.hit) {
			// Go towards Hero
			this.goal = hero.pos;

			if (this.goal && v.distance(this.pos, this.goal) > this.speed) {
				this.vel = v.unit(v.vector(this.pos, this.goal));
				this.vel = v.times(this.vel, this.speed);
				this.pos = v.plus(this.pos, this.vel);
				this.dir = Math.atan2(this.vel.y, this.vel.x);
			}

			var s = this.size/2;
			var hitBoxPoints = [
				v.point([-s, -s]),
				v.point([+s, -s]),
				v.point([+s, +s]),
				v.point([-s, +s]),
			];

			// Update hitbox
			this.hitBox.points = hitBoxPoints.map(function(p) {
				return v.plus(this.pos, p);
			}.bind(this));
		}

		this.hit = false;
	},

	draw: function(ctxt) {
		var off = this.size / 2;

		var sprite = game.sprites.mob;
		if (this.dead)
			sprite = game.sprites.deadMob;
		else if (this.hit)
			sprite = game.sprites.hitMob;

		ctxt.save();
		ctxt.translate(this.pos.x, this.pos.y);
		ctxt.rotate(this.dir);
		ctxt.drawImage(sprite, -off, -off, this.size, this.size);
		ctxt.restore();

		// Draw enemy
		// ctxt.lineWidth = 2;
		// ctxt.strokeStyle = this.hit ? '#666' : 'black';
		// ctxt.strokeRect(this.pos.x - off, this.pos.y - off, this.size, this.size);

		// Draw life inside
		// var lifep = this.life / this.size;
		// ctxt.fillStyle = ctxt.strokeStyle;
		// ctxt.fillRect(this.pos.x - off, this.pos.y - off + this.size * (1-lifep),
		// 							this.size, this.size * lifep);
	},

};

function makeMob() {
	var m = Object.create(mobProto);
	m.size = u.random(40, 80);
	m.life = m.size;
	m.speed = 65 / m.size;
	m.pos = v.plus(game.width/2, game.height/2,
								 v.fromPolar(u.random(2*Math.PI),
														 Math.max(game.width, game.height)));

	m.hitBox = {
		type: 'polygon',
		points: [],
	};

	return m;
}

function makeMobWave(count) {
	var mobs = [];
	while (count-- > 0) {
		mobs.push(makeMob());
	}
	return mobs;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Collisions

function checkCollision(o1, o2) {
	// Check objects can collide
	if (o1.hitBox && o2.hitBox) {
		// Check we have a registered collision handler in case they do
		// collide
		var sig1 = o1.type + '-' + o2.type;
		var sig2 = o2.type + '-' + o1.type;
		var handler = collisions[sig1] || u.flip(collisions[sig2]);

		if (handler) {
			if (c.test(o1.hitBox, o2.hitBox))
				handler(o1, o2);
		}
	}
}

var collisions = {
	'hero-mob': function(hero, mob) {
		hero.life -= 1;
		hero.hit = true;
	},

	'ray-mob': function(ray, mob) {
		mob.life -= 4;
		mob.hit = true;

		game.sounds.hit.play();
	},

	'circle-mob': function(circle, mob) {
		mob.life -= 10;
		mob.hit = true;
	},
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Main

// Globals
mousePos = v.point(0,0);

function init() {
	// Canvas

  var canvas = document.querySelector('canvas');
  var ctxt = canvas.getContext('2d');

  window.addEventListener('resize', function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
		ctxt.mozImageSmoothingEnabled = false;
		game.resize(window.innerWidth, window.innerHeight);
  });
  window.dispatchEvent(new Event('resize'));

	// Listeners

	window.addEventListener('mousemove', function(e) {
		if (game.over) return;

		mousePos = v.point(e.clientX, e.clientY);
	});

	window.addEventListener('click', function(e) {
		if (game.over) return;

		hero.goTo(v.point(e.clientX, e.clientY));
	});

	window.addEventListener('keydown', function(e) {
		if (game.over) return;

		switch (e.which) {
		case 49:
			hero.boost();
			break;

		case 50:
			hero.beginDeathRay(mousePos);
			break;

		case 51:
			//hero.circleOfDoom(mousePos);
			break;
		}
	});

	window.addEventListener('keyup', function(e) {
		if (game.over) return;

		switch (e.which) {
		case 50:
			hero.stopDeathRay();
			break;
		}
	});

	// window.addEventListener('keypress', function(e) {
	// 	//console.log(e.which);
	// 	if (e.which == 97) {
	// 		game.add(makeMob());
	// 	}
	// });

	// Game

  game.init(ctxt);

  requestAnimationFrame(function doFrame() {
    var loop = requestAnimationFrame(doFrame);

		game.update();
    game.render(ctxt);

		// if (game.over)
		//   cancelAnimationFrame(loop);
  });
}

// When loaded,
init();
