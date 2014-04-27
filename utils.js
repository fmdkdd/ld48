(function(){

var u = {};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Functional~ly utils

u.m2f = Function.prototype.bind.bind(Function.prototype.call);
u.slice = u.m2f([].slice);

u.flip = function(f) {
	if (f) {
		return function(a, b) {
			return f(b, a);
		}
	} else
		return f;
};

u.exists = function(x) { return x != null; }
u.isObject = function(x) { return x != null && typeof x === 'object'; }
u.isArray = function(x) { return u.isObject(x) && u.isNum(+x.length); }
u.isNum = function(x) { return x === +x; }
u.num = function(x) { return +x || 0; }

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Graphic utils

u.strokeCircle = function(ctxt, x, y, r) {
	ctxt.beginPath();
	ctxt.arc(x, y, r, 2*Math.PI, false);
	ctxt.stroke();
};

u.color = function(hsl, alpha) {
	alpha = alpha || 1;
	return 'hsla(' + hsl[0] + ',' + hsl[1] + '%,'
		+ hsl[2] + '%,' + alpha + ')';
};

u.randomColor = function() {
	return [u.randomInt(360),
					u.randomInt(30, 70),
					u.randomInt(30, 70),
					u.randomInt(20, 70)];
};

u.capitalize = function(word) {
	return word[0].toUpperCase() + word.substring(1);
};

u.downcase = function(word) {
	return word[0].toLowerCase() + word.substring(1);
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Math and geometry utils

u.random = function(b, a) {
	a = u.num(a);
	b = u.num(b);
	return a + Math.random() * (b - a);
}

u.randomInt = function(b, a) {
	return Math.round(u.random(b, a));
}

// Stupid % operator
u.mod = function(x, n) {
	if (isNaN(x)) return x;
	else if (x >= 0) return x % n;
	else return n - (x % n);
}

// Vector utils
u.vec = {

	// A point [x,y]
	point: function(a, b) {
		if (u.isArray(a) && +a.length >= 2)
			return { x: u.num(a[0]), y: u.num(a[1]) };
		else if (u.isObject(a) && !u.isArray(a))
			return { x: u.num(a.x), y: u.num(a.y) };
		else
			return { x: u.num(a), y: u.num(b) };
	},

	isPointy: function(x) {
		if (u.isArray(x))
			return +x.length >= 2;
		else
			return u.isObject(x);
	},

	points: function(a, b) {
		var first, rest;

		if (u.vec.isPointy(a)) {
			first = u.vec.point(a);
			rest = u.slice(arguments, 1);
		} else {
			first = u.vec.point(a, b);
			rest = u.slice(arguments, 2);
		}

		if (rest.length > 0)
			rest = u.vec.points.apply(null, rest);
		return [first].concat(rest);
	},

	// A vector from [x1,y1] to [x2,y2]
	vector: function(/* point, point */) {
		var vw = u.vec.points.apply(null, arguments);
		var v = vw[0];
		var w = vw[1];
		return u.vec.point(w.x-v.x, w.y-v.y);
	},

	// Euclidean distance between two points
	distance: function(/* point, point */) {
		var vw = u.vec.points.apply(null, arguments);
		var v = vw[0];
		var w = vw[1];
		return Math.sqrt((v.x-w.x)*(v.x-w.x) + (v.y-w.y)*(v.y-w.y));
	},

	// The length of the vector
	length: function(/* point */) {
		var v = u.vec.points.apply(null, arguments)[0];
		return u.vec.distance([0, 0], v);
	},

	// Give the unit vector of v
	unit: function(/* point */) {
		var v = u.vec.points.apply(null, arguments)[0];
		var l = u.vec.length(v);
		return u.vec.point(v.x / l, v.y / l);
	},

	// Give the dot product of u and v.
	dot: function(u, v) {
		return u.x*v.x+u.y*v.y;
	},

	// Give v scaled by a scalar.
	times: function(v, k) {
		return {x: v.x*k, y: v.y*k};
	},

	// Give the sum of u and v
	plus: function(/* point, point */) {
		var vw = u.vec.points.apply(null, arguments);
		var v = vw[0];
		var w = vw[1];
		return u.vec.point(v.x + w.x, v.y + w.y);
	},

	// Give the difference of u and v
	minus: function(u, v) {
		return {x: u.x-v.x, y: u.y-v.y}
	},

	// Give the perpendicular vector of v
	perp: function(v) {
		return {x: -v.y, y: v.x};
	},

	// Give the vector v rotated by angle a
	rotate: function(v, a) {
		var cos = Math.cos(a);
		var sin = Math.sin(a);
		return {x: v.x*cos - v.y*sin, y: v.x*sin + v.y*cos};
	},

	fromPolar: function(theta, l) {
		var v = u.vec.vector(0, 0, 1, 0);
		v = u.vec.rotate(v, theta);
		v = u.vec.times(v, l);
		return v;
	},

	reflect: function(v) {
		var alpha;

		// Incident angle
		if (v.x === 0)
			alpha = 0;
		else
			alpha = Math.tan(v.y / v.x);

		// Reflected angle
		alpha = Math.PI - alpha;
		var length = u.vec.length(v);

		// Reflected vector
		return u.vec.fromPolar(alpha, length);
	},
};

// Transform a zero-width [A,B] segment to a polygon with given width
u.segmentToPoly = function(A, B, width) {
	// We need four points: translate [A,B] twice.
	// Once along its normal, once along its normal's opposite.
	var N = u.vec.times(u.vec.unit(u.vec.perp(u.vec.minus(B, A))), width / 2);
	var oN = u.vec.times(N, -1);

	return [
		u.vec.plus(A, N),
		u.vec.plus(B, N),
		u.vec.plus(B, oN),
		u.vec.plus(A, oN) ];
};

// Ensure 0 <= pos.{x,y} < s.
u.warp = function(pos, s) {
	pos.x = u.mod(pos.x, s);
	pos.y = u.mod(pos.y, s);
	return pos;
}

// Transform `pos2` so that it lies in the same frame of reference as
// `pos1`.
u.unwarp = function(pos1, pos2, s) {
	var hs = s/2;
	var dx = pos2.x - pos1.x;
	var dy = pos2.y - pos1.y;

	if (dx < -hs) pos2.x += s;
	if (dx > hs) pos2.x -= s;
	if (dy < -hs) pos2.y += s;
	if (dy > hs) pos2.y -= s;

	return pos2;
}

// Normalize angle between -pi and +pi.
u.relativeAngle = function(a) {
	a = u.mod(a, 2*Math.PI);

	if (a > Math.PI)
		return a - 2*Math.PI;
	else if (a < -Math.PI)
		return a + 2*Math.PI;
	else
		return a;
}

// Cubic Bézier curves going from a to b with control points c and d.
// Returns a function of time in [0,1] giving a vector.
u.cubicBezier = function(a, b, c, d) {
	return function(t) {
		var u = (1 - t);
		var u2 = u * u;
		var u3 = u2 * u;
		var t2 = t * t;
		var t3 = t2 * t;

		var r = u.vec.times(a, u3);
		r = u.vec.plus(r, u.vec.times(c, 3 * u2 * t));
		r = u.vec.plus(r, u.vec.times(d, 3 * u * t2));
		r = u.vec.plus(r, u.vec.times(b, t3));

		return r;
	};
};

// Return acceleration vector from all gravity-emitting `objects',
// having center `source' and force `force'.
u.gravityField = function(pos, objects, source, force) {
	var x1 = pos.x;
	var y1 = pos.y;

	// Apply gravity formula.
	var gravity = function(pos, g) {
		var x2 = pos.x;
		var y2 = pos.y;
		var xt = x2-x1;
		var yt = y2-y1;
		var dist = xt*xt + yt*yt;
		var pull = g / (dist * Math.sqrt(dist));

		return {x: xt * pull, y: yt * pull};
	}

	var vx = 0;
	var vy = 0;
	// for (id, obj of objects)
	// 	f = force(obj)

	// 	unless f is 0
	// 		pull = gravity(source(obj), f)

	// 		# Increase field vector.
	// 		vx += pull.x
	// 		vy += pull.y

	// return {x: vx, y: vy}
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

u.collisions = {
	  convexHitboxes: function(box) {
    var i, polys, segments, _i, _ref;
    switch (box.type) {
      case 'circle':
        return [box];
      case 'segments':
        segments = [];
        if (box.points.length >= 2) {
          for (i = _i = 0, _ref = box.points.length - 1; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            segments.push({
              type: 'segments',
              points: [box.points[i], box.points[i + 1]]
            });
          }
        }
        return segments;
      case 'polygon':
        polys = [];
        if (box.points.length >= 2) {
          polys.push(box);
        }
        return polys;
      default:
        return null;
    }
  },

  validHitbox: function(box) {
    var a, b;
    switch (box.type) {
      case 'circle':
        if (box.radius <= 0) {
          return false;
        }
        break;
      case 'segments':
        if (box.points.length !== 2) {
          return false;
        }
        a = box.points[0];
        b = box.points[1];
        if (a.x === b.x && a.y === b.y) {
          return false;
        }
        break;
      case 'polygon':
        if (box.points.length < 2) {
          return false;
        }
        break;
      default:
        return false;
    }
    return true;
  },

  projectHitBox: function(box, axis) {
    var center, p, proj, x, _i, _len, _ref;
    proj = {
      min: +Infinity,
      max: -Infinity
    };
    switch (box.type) {
      case 'circle':
        center = {
          x: box.x,
          y: box.y
        };
        x = u.vec.dot(axis, center);
        proj.min = x - box.radius;
        proj.max = x + box.radius;
        break;
      case 'segments':
      case 'polygon':
        _ref = box.points;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          p = _ref[_i];
          x = u.vec.dot(axis, p);
          if (x < proj.min) {
            proj.min = x;
          }
          if (x > proj.max) {
            proj.max = x;
          }
        }
    }
    return proj;
  },

  projectionsOverlap: function(proj1, proj2) {
    var _ref, _ref1, _ref2, _ref3;
    return (proj1.min <= (_ref = proj2.min) && _ref <= proj1.max) || (proj1.min <= (_ref1 = proj2.max) && _ref1 <= proj1.max) || (proj2.min <= (_ref2 = proj1.min) && _ref2 <= proj2.max) || (proj2.min <= (_ref3 = proj1.max) && _ref3 <= proj2.max);
  },

  countSeparatingAxes: function(box) {
    switch (box.type) {
      case 'circle':
        return 1;
      case 'segments':
        return box.points.length - 1;
      case 'polygon':
        return box.points.length;
      default:
        return 0;
    }
  },

  separatingAxis: function(box1, box2, i) {
    var box, center, closest, dist, distClosest, e1, e2, edge, j, offset, other, _i, _ref;
    box = i < box1.count ? box1 : box2;
    switch (box.type) {
      case 'circle':
        center = {
          x: box.x,
          y: box.y
        };
        other = (box === box1 ? box2 : box1);
        if (other.type === 'circle') {
          closest = {
            x: other.x,
            y: other.y
          };
        } else {
          closest = other.points[0];
          distClosest = u.vec.distance(closest.x, closest.y, center.x, center.y);
          for (j = _i = 1, _ref = other.points.length; 1 <= _ref ? _i < _ref : _i > _ref; j = 1 <= _ref ? ++_i : --_i) {
            dist = u.vec.distance(other.points[j].x, other.points[j].y, center.x, center.y);
            if (dist < distClosest) {
              closest = other.points[j];
              distClosest = dist;
            }
          }
        }
        if (closest.x !== center.x || closest.y !== center.y) {
          return u.vec.unit(u.vec.minus(closest, center));
        }
        break;
      case 'segments':
        edge = u.vec.minus(box.points[1], box.points[0]);
        return u.vec.unit(u.vec.perp(edge));
      case 'polygon':
        offset = i < box1.count ? 0 : box1.count;
        e1 = box.points[i - offset];
        e2 = box.points[(i + 1 - offset) % box.points.length];
        edge = u.vec.minus(e2, e1);
        return u.vec.unit(u.vec.perp(edge));
    }
  },

  checkIntersection: function(box1, box2) {
    var axis, i, p1, p2, _i, _ref;
    if (!u.collisions.validHitbox(box1) || !u.collisions.validHitbox(box2)) {
      return false;
    }
    box1.count = u.collisions.countSeparatingAxes(box1);
    box2.count = u.collisions.countSeparatingAxes(box2);
    for (i = _i = 0, _ref = box1.count + box2.count; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      axis = u.collisions.separatingAxis(box1, box2, i);
      if (!(axis != null)) {
        continue;
      }
      p1 = u.collisions.projectHitBox(box1, axis);
      p2 = u.collisions.projectHitBox(box2, axis);
      if (!u.collisions.projectionsOverlap(p1, p2)) {
        return false;
      }
    }
    return true;
  },

  test :function(box1, box2) {
    var b1, b2, boxes1, boxes2, _i, _j, _len, _len1;
    boxes1 = u.collisions.convexHitboxes(box1);
    boxes2 = u.collisions.convexHitboxes(box2);
    if (!(boxes1 != null) || !(boxes2 != null)) {
      return null;
    }
    for (_i = 0, _len = boxes1.length; _i < _len; _i++) {
      b1 = boxes1[_i];
      for (_j = 0, _len1 = boxes2.length; _j < _len1; _j++) {
        b2 = boxes2[_j];
        if (u.collisions.checkIntersection(b1, b2)) {
          return true;
        }
      }
    }
    return false;
  },

};

if (this.module)
	module.exports = u;
else
	this.utils = u;

}())
