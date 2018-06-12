(function() {
'use strict';

var Hotkeys = function() {
	this.game;

	this.init = function(game) {
		this.game = game;
	}
};

// For iteration
var ri;
var ci;
var row;
var tile;

var hotkeys = new Hotkeys();
window.hotkeys = hotkeys;

var equal_filter = function (tile) {
	var part = tile.part;
	return function* (g) {
		for (var tile of g) {
			if (part === tile.part) {
				yield tile;
			}
		}
	}
}

var replacer = function* (part) {
	for ( ri = 0; ri < hotkeys.game.rows; ri++ ) {
		row = hotkeys.game.tiles[ri];
		for ( ci = 0; ci < hotkeys.game.cols; ci++ ) {
			tile = row[ci];
			if ( part === tile.part ) {
				yield tile;
			}
		}
	}
};

hotkeys.replacer = replacer;

var remover = function* (part, ticks) {
	for ( ri = 0; ri < hotkeys.game.rows; ri++ ) {
		row = hotkeys.game.tiles[ri];
		for ( ci = 0; ci < hotkeys.game.cols; ci++ ) {
			tile = row[ci];
			if ( part === tile.part && ( !tile.part.part.base_ticks || ticks || !tile.ticks ) ) {
				yield tile;
			}
		}
	}
};

hotkeys.remover = remover;

var checker = function* (tile) {
	// Figure out whether to place on the first tile of the row
	// ie: if it's an even or odd tile pattern
	var placement, toggle;
	placement = !((tile.row%2)^(tile.col%2));
	for ( ri = 0; ri < hotkeys.game.rows; ri++ ) {
		// TODO: better name?
		toggle = placement;
		row = hotkeys.game.tiles[ri];
		for ( ci = 0; ci < hotkeys.game.cols; ci++ ) {
			if (toggle){
				yield row[ci];
			}
			toggle = !toggle;
		}
		// for next row first tile
		placement = !placement;
	}
};

hotkeys.checker = checker;

var skip = 1;

var _row = function* (tile, start, i) {
	row = hotkeys.game.tiles[tile.row];
	for ( ci = start; ci < hotkeys.game.cols; ci+=i ) {
		yield row[ci];
	}
};

hotkeys.row = (tile) => equal_filter(tile)(_row(tile, tile.col%skip ,skip));
hotkeys.shift_row = (tile) => _row(tile, tile.col%skip ,skip)

var _column = function* (tile, start, i) {
	for ( ri = start; ri < hotkeys.game.rows; ri+=i ) {
		row = hotkeys.game.tiles[ri];
		yield row[tile.col];
	}
}

hotkeys.column = (tile) => equal_filter(tile)(_column(tile, tile.row%skip ,skip));
hotkeys.shift_column = (tile) => _column(tile, tile.row%skip ,skip)

window.addEventListener("keydown", function(event) {
	var key;
	var r = /Digit([2-9])/.exec(event.code);
	if ( !event.repeat && r && (key = r[1]) ) {
		if ( event.ctrlKey || event.altKey ) {
			event.preventDefault();
		}

		skip = parseInt(key);
	}
});

window.addEventListener("keyup", function(event) {
	var key;
	var r = /Digit([2-9])/.exec(event.code);
	if ( !event.repeat && r && (key = r[1]) ) {
		if ( event.ctrlKey || event.altKey ) {
			event.preventDefault();
		}

		if ( parseInt(key) === skip ){
			skip = 1;
		}
	}
});

})();
