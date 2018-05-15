(function() {

/////////////////////////////
// Delegate
/////////////////////////////

Element.prototype.delegate = function(className, type, fn) {
	var test = new RegExp('\\b' + className + '\\b');
	var $self = this;

	var onfn = function(event) {
		event = event || window.event;

		var $target = event.target || event.srcElement;

		while( $target != $self ) {
			if ( $target.className.match(test) ) {
				event.preventDefault();
				return fn.call($target, event);
			}

			$target = $target.parentNode;
		}
	}

	if ( type === 'focus' || type === 'blur' ) {
		this.addEventListener(type, onfn, true);
	} else {
		this['on' + type] = onfn;
	}
}

/////////////////////////////
// fauxQuery
/////////////////////////////

var _div = document.createElement('div');
window.$ = function(a1) {
	if ( typeof a1 === 'string' ) {
		if ( a1.match(/^<.+>$/) ) {
			_div.innerHTML = a1;
			return _div.firstChild;
		} else if ( a1.match(/^#[^ ]+$/) ) {
			return document.getElementById(a1.substring(1))
		}
	}
}

/////////////////////////////
// Number formatting
/////////////////////////////

var cm_names = ("K M B T Qa Qi Sx Sp Oc No Dc").split(" ");

var pow;
var fnum;
var find_exponent = /(([1-9])(\.([0-9]+))?)e\+([0-9]+)/;
var fmt_parts;
var floor_num;

window.fmt = function(num, places) {
	places = places || null;

	// Math.floor returns exponents quicker for some reason
	floor_num = Math.floor(num).toString();

	if ( places !== null ) {
		pow = Math.floor((floor_num.length - 1)/3) * 3;
		num = Math.round(num / Math.pow(10, pow - places)) * Math.pow(10, pow - places);
	}

	// in case of exponents
	if ( (fmt_parts = floor_num.match(find_exponent)) ) {
		places = places || 3;

		// Out of range of the friendly numbers
		if ( fmt_parts[5] > 35 ) {
			fnum = fmt_parts[2] + (fmt_parts[3]?fmt_parts[3].substring(0, places + 1):'') + 'e' + fmt_parts[5];
		// has a decimal
		} else if ( fmt_parts[3] ) {
			num = fmt_parts[2] + fmt_parts[4] + '00';
			fnum = parseFloat(num.substring(0, fmt_parts[5] % 3 + 1) + '.' + num.substring(fmt_parts[5] % 3 + 1, fmt_parts[5] % 3 + places + 1)) + cm_names[Math.floor(fmt_parts[5]/3) - 1];
		} else {
			num = fmt_parts[2] + '00';
			fnum = num.substring(0, fmt_parts[5] % 3 + 1) + cm_names[Math.floor(fmt_parts[5]/3) - 1];
		}
	} else {
		// http://userscripts-mirror.org/scripts/review/293573
		pow = Math.floor((floor_num.length - 1)/3) * 3;
		fnum = (Math.floor(num / Math.pow(10, pow - 3)) / Math.pow(10, 3)) + (pow === 0 ? "" : cm_names[(pow / 3) - 1]);
	}

	return fnum;
};

/////////////////////////////
// Timing
/////////////////////////////

window.performance = window.performance || {};
performance.now = (function() {
	return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() { return new Date().getTime(); };
})();

/////////////////////////////
// Objects
/////////////////////////////

// Function to add setter, updated and property to object
window.addProperty = function(name, value) {
	this[name] = value;
	this[name + 'Updated'] = true;

	this['set' + name.charAt(0).toUpperCase() + name.slice(1)] = function(value) {
		if ( value !== this[name] ) {
			this[name] = value;
			this[name + 'Updated'] = true;
		}
	};
};

})();
