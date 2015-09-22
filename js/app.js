;(function() {
'use strict';

// settings
var rows = 5;
var cols = 5;
var tiles = [];

// Classes
var Tile = function() {
	this.$el = document.createElement('BUTTON');
	this.$el.className = 'tile';
};

// get dom nodes cached
var $reactor = document.getElementById('reactor');

// create tiles
var $row;
var ri;
var ci;
var row;
var tile;
for ( ri = 0; ri < rows; ri++ ) {
	$row = document.createElement('DIV');
	$row.className = 'row';
	$reactor.appendChild($row);
	row = [];

	for ( ci = 0; ci < cols; ci++ ) {
		tile = new Tile();
		row.push(tile);
		$row.appendChild(tile.$el);
	}

	tiles.push(row);
}

})();