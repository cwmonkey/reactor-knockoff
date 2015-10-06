;(function() {
'use strict';

  /////////////////////////////
 // Number formatting
/////////////////////////////

var cm_names = ("K M B T Qa Qi Sx Sp Oc No Dc").split(" ");

var pow;
var fnum;
// http://userscripts-mirror.org/scripts/review/293573
var fmt = function(num) {
  /*var len = Math.floor(num).toString().length - 1;
  var pow = Math.floor(len/3) * 3;
  var manlen = 2 - len % 3;
  return (Math.floor(num / Math.pow(10, pow - manlen)) / Math.pow(10, manlen)) + (pow == 0 ? "" : cm_names[(pow / 3) - 1]);*/
  pow = Math.floor((Math.floor(num).toString().length - 1)/3) * 3;
  fnum = (Math.floor(num / Math.pow(10, pow - 3)) / Math.pow(10, 3)) + (pow == 0 ? "" : cm_names[(pow / 3) - 1]);

  return fnum;
};

// settings
var cols = 19;
var rows = 16;
var debug = true;
var base_loop_wait = 1000;
var base_power_multiplier = 1;
var base_heat_multiplier = 4;

// Current
var current_heat = 0;
var current_power = 0;
var current_money = 0;
var max_heat = 1000;
var max_power = 100;
var loop_wait = base_loop_wait;
var power_multiplier = base_power_multiplier;
var heat_multiplier = base_heat_multiplier;

// For iteration
var i;
var l;
var ri;
var pi;
var ci;
var row;
var tile;
var upgrade;

// Other vars
var tiles = [];
var parts = {
	uranium: {
		id: 'uranium',
		type: 'uranium',
		level: 1,
		title: 'Uranium Cell',
		category: 'cell',
		base_cost: 10,
		base_ticks: 15,
		base_power: 1,
		base_heat: 1,
		enriched_upgrade_cost: 100,
		enriched_upgrade_multiplier: 10,
		potent_upgrade_cost: 500,
		potent_upgrade_multiplier: 10,
		perpetual_upgrade_cost: 10000
	},
	uranium2: {
		id: 'uranium2',
		type: 'uranium',
		level: 2,
		title: 'Dual Uranium Cell',
		category: 'cell',
		base_cost: 25,
		base_ticks: 15,
		base_power: 4,
		base_heat: 8
	},
	uranium3: {
		id: 'uranium3',
		type: 'uranium',
		level: 3,
		title: 'Quad Uranium Cell',
		category: 'cell',
		base_cost: 60,
		base_ticks: 15,
		base_power: 12,
		base_heat: 36
	},
	plutonium: {
		id: 'plutonium',
		type: 'plutonium',
		levels: 3,
		title: 'Plutonium Cell',
		category: 'cell',
		base_cost: 6000,
		base_ticks: 60,
		base_power: 150,
		base_heat: 150
	},
	thorium: {
		id: 'thorium',
		type: 'thorium',
		levels: 3,
		title: 'Thorium Cell',
		category: 'cell',
		base_cost: 4737000,
		base_ticks: 900,
		base_power: 7400,
		base_heat: 7400
	},
	seaborgium: {
		id: 'seaborgium',
		type: 'seaborgium',
		levels: 3,
		title: 'Seaborgium Cell',
		category: 'cell',
		base_cost: 3939000000,
		base_ticks: 3600,
		base_power: 1582000,
		base_heat: 1582000
	},
	dolorium: {
		id: 'dolorium',
		type: 'dolorium',
		levels: 3,
		title: 'Dolorium Cell',
		category: 'cell',
		base_cost: 3922000000000,
		base_ticks: 21600,
		base_power: 226966000,
		base_heat: 226966000
	},
	nefastium: {
		id: 'nefastium',
		type: 'nefastium',
		levels: 3,
		title: 'Nefastium Cell',
		category: 'cell',
		base_cost: 3586000000000000,
		base_ticks: 86400,
		base_power: 51871000000,
		base_heat: 51871000000
	},
	vent: {
		id: 'vent',
		title: 'Heat Vent',
		levels: 5,
		category: 'vent',
		level: 1,
		base_cost: 50,
		cost_multiplier: 250,
		base_containment: 80,
		base_vent: 8,
		location: 'cooling'
	}
};

// Classes
var Tile = function(row, col) {
	this.$el = document.createElement('BUTTON');
	this.$el.className = 'tile';
	this.$el.tile = this;
	this.part = null;
	this.heat = 0;
	this.heat_contained = 0;
	this.power = 0;
	this.ticks = 0;
	this.vents = [];
	this.activated = false;
	this.row = row;
	this.col = col;

	if ( debug ) {
		this.$heat = document.createElement('SPAN');
		this.$heat.className = 'heat';
		this.$heat.innerHTML = fmt(this.heat);
		this.$el.appendChild(this.$heat);

		this.$power = document.createElement('SPAN');
		this.$power.className = 'power';
		this.$power.innerHTML = fmt(this.power);
		this.$el.appendChild(this.$power);
	}
};

var Part = function(part) {
	this.className = 'part_' + part.id;
	this.$el = document.createElement('BUTTON');
	this.$el.className = 'part ' + this.className;
	this.$el.part = this;

	this.part = part;
	this.id = part.id;
	this.category = part.category;
	this.heat = part.base_heat;
	this.power = part.base_power;
	this.heat_multiplier = part.base_heat_multiplier;
	this.power_multiplier = part.base_power_multiplier;
	this.ticks = part.base_ticks;
	this.containment = part.base_containment;
	this.vent = part.base_vent;
	this.cost = part.base_cost;
	this.affordable = true;

	var $image = document.createElement('DIV');
	$image.className = 'image';
	$image.innerHTML = 'Click to Select';

	//this.$levels = document.createElement('SPAN');
	//this.$levels.className = 'levels';

	var $description = document.createElement('DIV');
	$description.className = 'description info';

	var $headline = document.createElement('DIV');
	$headline.className = 'headline';
	$headline.innerHTML = part.title;

	//var $p = document.createElement('P');
	//$p.className = 'text';
	//$p.id = upgrade.id + 'text';
	//$p.innerHTML = upgrade.description;*/

	this.$cost = document.createElement('P');
	this.$cost.className = 'cost';
	this.$cost.innerHTML = fmt(this.cost);

	//$image.appendChild(this.$levels);

	$description.appendChild($headline);
	//$description.appendChild($p);
	$description.appendChild(this.$cost);

	this.$el.appendChild($image);
	this.$el.appendChild($description);
};

// Operations
var tiler;
var tileu;
var tilel;
var tiled;
var tile_vent;
var heat_remove;
var update_tiles = function() {
	for ( ri = 0; ri < rows; ri++ ) {
		row = tiles[ri];

		for ( ci = 0; ci < cols; ci++ ) {
			tile = row[ci];
			tile.heat = 0;
			tile.power = 0;
		}
	}

	// Alter counts
	for ( ri = 0; ri < rows; ri++ ) {
		row = tiles[ri];
		tileu = null;
		tiler = null;
		tiled = null;
		tilel = null;

		for ( ci = 0; ci < cols; ci++ ) {
			tile = row[ci];
			tile.vents.length = 0;

			if ( tile.part && tile.activated ) {
				if ( ci < cols - 1 ) {
					tiler = row[ci + 1];
					if ( tiler.part && tiler.part.category === 'vent' ) {
						tile.vents.push(tiler);
					}
				}

				// left
				if ( ci > 0 ) {
					tilel = row[ci - 1];
					if ( tilel.part && tilel.part.category === 'vent' ) {
						tile.vents.push(tilel);
					}
				}

				// down
				if ( ri < rows - 1 ) {
					tiled = tiles[ri + 1][ci];
					if ( tiled.part && tiled.part.category === 'vent' ) {
						tile.vents.push(tiled);
					}
				}

				// up
				if ( ri > 0 ) {
					tileu = tiles[ri - 1][ci];
					if ( tileu.part && tileu.part.category === 'vent' ) {
						tile.vents.push(tileu);
					}
				}
			}
		}
	}

	// heat and power generators
	for ( ri = 0; ri < rows; ri++ ) {
		row = tiles[ri];
		tileu = null;
		tiler = null;
		tiled = null;
		tilel = null;

		for ( ci = 0; ci < cols; ci++ ) {
			tile = row[ci];

			if ( tile.part && tile.activated ) {
				// right
				if ( ci < cols - 1 ) {
					tiler = row[ci + 1];
				}

				// left
				if ( ci > 0 ) {
					tilel = row[ci - 1];
				}

				// down
				if ( ri < rows - 1 ) {
					tiled = tiles[ri + 1][ci];
				}

				// up
				if ( ri > 0 ) {
					tileu = tiles[ri - 1][ci];
				}

				if ( tile.part.category === 'cell' && tile.ticks ) {
					tile.heat += tile.part.heat;
					tile.power += tile.part.power;

					// neighbors
					// right
					if ( tiler && tiler.part && tiler.part.category === 'cell' && tiler.activated && tiler.ticks ) {
						tiler.heat += tile.part.heat * heat_multiplier;
						tiler.power += tile.part.power * power_multiplier;
					}

					// left
					if ( tilel && tilel.part && tilel.part.category === 'cell' && tilel.activated && tilel.ticks ) {
						tilel.heat += tile.part.heat * heat_multiplier;
						tilel.power += tile.part.power * power_multiplier;
					}

					// down
					if ( tiled && tiled.part && tiled.part.category === 'cell' && tiled.activated && tiled.ticks ) {
						tiled.heat += tile.part.heat * heat_multiplier;
						tiled.power += tile.part.power * power_multiplier;
					}

					// up
					if ( tileu && tileu.part && tileu.part.category === 'cell' && tileu.activated && tileu.ticks ) {
						tileu.heat += tile.part.heat * heat_multiplier;
						tileu.power += tile.part.power * power_multiplier;
					}
				}
			}
		}
	}

	// alters
	for ( ri = 0; ri < rows; ri++ ) {
		row = tiles[ri];
		tileu = null;
		tiler = null;
		tiled = null;
		tilel = null;

		for ( ci = 0; ci < cols; ci++ ) {
			tile = row[ci];

			if ( tile.part && tile.activated ) {
				if ( tile.part.category === 'cell' ) {
					l = tile.vents.length;

					if ( l ) {
						heat_remove = Math.ceil(tile.heat / l);

						for ( i = 0; i < l; i++ ) {
							tile_vent = tile.vents[i];
							tile.heat -= heat_remove;
							tile_vent.heat += heat_remove - tile_vent.part.vent;
						}
					}
				}
			}
		}
	}

	if ( debug ) {
		for ( ri = 0; ri < rows; ri++ ) {
			row = tiles[ri];

			for ( ci = 0; ci < cols; ci++ ) {
				tile = row[ci];
				tile.$heat.innerHTML = fmt(tile.heat);
				tile.$power.innerHTML = fmt(tile.power);
			}
		}
	}
};

// get dom nodes cached
var $reactor = document.getElementById('reactor');
var $parts = document.getElementById('parts');
var $cells = document.getElementById('cells');
var $sell = document.getElementById('sell');
var $money = document.getElementById('money');
var $scrounge = document.getElementById('scrounge');
var $cooling = document.getElementById('cooling');
var $current_heat = document.getElementById('current_heat');
var $current_power = document.getElementById('current_power');
var $max_heat = document.getElementById('max_heat');
var $max_power = document.getElementById('max_power');
var $save = document.getElementById('save');
var $main = document.getElementById('main');
var $upgrades = document.getElementById('upgrades');

if ( debug ) {
	$main.className += ' debug';
}

$max_heat.innerHTML = fmt(max_heat);
$max_power.innerHTML = fmt(max_power);

// create tiles
var $row;
for ( ri = 0; ri < rows; ri++ ) {
	$row = document.createElement('DIV');
	$row.className = 'row';
	$reactor.appendChild($row);
	row = [];

	for ( ci = 0; ci < cols; ci++ ) {
		tile = new Tile(ri, ci);
		row.push(tile);
		$row.appendChild(tile.$el);
	}

	tiles.push(row);
}

  /////////////////////////////
 // Create Parts
/////////////////////////////

var part_obj;
var part_settings;
var part;
var part_objects = {};
var part_objects_array = [];
var cell_prefixes = ['', 'Dual ', 'Quad '];
var prefixes = ['Basic ', 'Advanced ', 'Super ', 'Wonderous ', 'Ultimate '];
var cell_power_multipliers = [1, 4, 12];
var cell_heat_multipliers = [1, 8, 36];

var create_part = function(part, level) {
	if ( level ) {
		part = JSON.parse(JSON.stringify(part));
		part.level = level;

		if ( part.category === 'cell' ) {
			part.id = part.type + level;
			part.title = cell_prefixes[level -1] + part.title;
			part.base_cost = part.base_cost
			if ( level > 1 ) {
				part.base_cost *= Math.pow(22, level - 1) / 10;
			}
			part.base_power = part.base_power * cell_power_multipliers[level];
			part.base_heat = part.base_heat * cell_heat_multipliers[level];
		} else {
			part.id = part.category + level;
			part.title = prefixes[level -1] + part.title;
			part.base_cost = part.base_cost * Math.pow(part.cost_multiplier, level -1);
		}
	}

	part_obj = new Part(part);

	part_objects[part.id] = part_obj;
	part_objects_array.push(part_obj);

	if ( part.category === 'cell' ) {
		$cells.appendChild(part_obj.$el);
	} else if ( part.category === 'vent' ) {
		$cooling.appendChild(part_obj.$el);
	}

	return part_obj;
}

for ( pi in parts ) {
	part_settings = parts[pi];
	if ( part_settings.levels ) {
		for ( i = 0, l = part_settings.levels; i < l; i++ ) {
			create_part(part_settings, i + 1);
		}
	} else {
		create_part(part_settings);
	}
}

  /////////////////////////////
 // Upgrades
/////////////////////////////

var upgrades = [
	{
		id: 'chronometer',
		type: 'other',
		title: 'Improved Chronometers',
		description: '+1 tick per second per level of upgrade.',
		cost: 10000,
		multiplier: 100,
		onclick: function(upgrade) {
			loop_wait = base_loop_wait / ( upgrade.level + 1 );
		}
	},
	{
		id: 'forceful_fusion',
		type: 'other',
		title: 'Forceful Fusion',
		description: 'Cells produce 1% more power at 1k heat, 2% power at 2m heat etc. per level of upgrade.',
		cost: 10000,
		multiplier: 100,
		onclick: function(upgrade) {

		}
	},
	{
		id: 'improved_piping',
		type: 'other',
		title: 'Improved Piping',
		description: 'Venting manually is 10x as effective per level of upgrade.',
		cost: 100,
		multiplier: 20,
		onclick: function(upgrade) {
			
		}
	},
	{
		id: 'improved_alloys',
		type: 'other',
		title: 'Improved Alloys',
		description: 'Plating holds 100% more heat per level of upgrade.',
		cost: 5000,
		multiplier: 5,
		onclick: function(upgrade) {
			
		}
	},
	{
		id: 'improved_power_lines',
		type: 'other',
		title: 'Improved Power Lines',
		description: 'Sells 1% of your power each tick per level of upgrade.',
		cost: 100,
		multiplier: 10,
		onclick: function(upgrade) {
			
		}
	},
	{
		id: 'improved_wiring',
		type: 'other',
		title: 'Improved Wiring',
		description: 'Capacitors hld +100% power and heat per level of upgrade.',
		cost: 5000,
		multiplier: 5,
		onclick: function(upgrade) {
			
		}
	},

	{
		id: 'improved_coolant_cells',
		type: 'other',
		title: 'Improved Coolant Cells',
		description: 'Coolant cells hold 100% more heat per level of upgrade.',
		cost: 5000,
		multiplier: 100,
		onclick: function(upgrade) {
			
		}
	},

	{
		id: 'improved_reflectors',
		type: 'other',
		title: 'Improved Reflectors',
		description: 'Reflectors last 100% longer per level of upgrade.',
		cost: 5000,
		multiplier: 100,
		onclick: function(upgrade) {
			
		}
	},

	// Exchangers
	{
		id: 'improved_heat_exchangers',
		type: 'exchangers',
		title: 'Improved Heat Exchangers',
		description: 'Heat Exchangers hold and exchange 100% more heat per level of upgrade',
		cost: 600,
		multiplier: 100,
		onclick: function(upgrade) {
			
		}
	},
	{
		id: 'reinforced_heat_exchangers',
		type: 'exchangers',
		title: 'Reinforced Heat Exchangers',
		description: 'Each plating increases the effectiveness of exchangers by 1% per level of upgrade per level of plating.',
		cost: 1000,
		multiplier: 100,
		onclick: function(upgrade) {
			
		}
	},
	{
		id: 'active_exchangers',
		type: 'exchangers',
		title: 'Active Exchangers',
		description: 'Each capacitor increases the effectiveness of exchangers by 1% per level of upgrade per level of capacitor.',
		cost: 1000,
		multiplier: 100,
		onclick: function(upgrade) {
			
		}
	},

	// Vents
	{
		id: 'improved_heat_vents',
		type: 'vents',
		title: 'Improved Heat Vents',
		description: 'Vents hold and vent 100% more heat per level of upgrade.',
		cost: 250,
		multiplier: 100,
		onclick: function(upgrade) {
			
		}
	},
	{
		id: 'improved_heatsinks',
		type: 'vents',
		title: 'Improved Heatsinks',
		description: 'Each plating increases the effectiveness of vents by 1% per level of upgrade per level of plating.',
		cost: 1000,
		multiplier: 100,
		onclick: function(upgrade) {
			
		}
	},
	{
		id: 'active_venting',
		type: 'vents',
		title: 'Active Venting',
		description: 'Each capacitor increases the effectiveness of vents by 1% per level of upgrade per level of capacitor.',
		cost: 1000,
		multiplier: 100,
		onclick: function(upgrade) {
			
		}
	}
];

var Upgrade = function(upgrade) {
	var me = this;
	this.upgrade = upgrade;
	this.level = null;
	this.cost = null;
	this.$el = document.createElement('BUTTON');
	this.$el.className = 'upgrade';
	this.$el.id = upgrade.id;

	var $image = document.createElement('DIV');
	$image.className = 'image';
	$image.innerHTML = 'Click to Upgrade';

	this.$levels = document.createElement('SPAN');
	this.$levels.className = 'levels';

	var $description = document.createElement('DIV');
	$description.className = 'description info';

	var $headline = document.createElement('DIV');
	$headline.className = 'headline';
	$headline.id = upgrade.id + 'headline';
	$headline.innerHTML = upgrade.title;

	var $p = document.createElement('P');
	$p.className = 'text';
	$p.id = upgrade.id + 'text';
	$p.innerHTML = upgrade.description;

	this.$cost = document.createElement('P');
	this.$cost.className = 'cost';

	$image.appendChild(this.$levels);

	$description.appendChild($headline);
	$description.appendChild($p);
	$description.appendChild(this.$cost);

	this.$el.appendChild($image);
	this.$el.appendChild($description);

	this.setLevel(0);
};

Upgrade.prototype.setLevel = function(level) {
	this.level = level;
	this.$levels.innerHTML = level;
	this.cost = this.upgrade.cost * Math.pow(this.upgrade.multiplier, this.level);
	this.$cost.innerHTML = fmt(this.cost);
	this.upgrade.onclick(this);
}

var upgrade_locations = {
	ticks: document.getElementById('cell_tick_upgrades'),
	powers: document.getElementById('cell_power_upgrades'),
	perpetuals: document.getElementById('cell_perpetual_upgrades'),
	other: document.getElementById('other_upgrades'),
	vents: document.getElementById('vent_upgrades'),
	exchangers: document.getElementById('exchanger_upgrades')
};

var upgrade_objects = {};
var upgrade_objects_array = [];
var create_upgrade = function(u) {
	var upgrade = new Upgrade(u);
	upgrade.$el.upgrade = upgrade;
	upgrade_locations[u.type].appendChild(upgrade.$el);
	upgrade_objects_array.push(upgrade);
	upgrade_objects[upgrade.upgrade.id] = upgrade;
};

for ( var i = 0, l = upgrades.length; i < l; i++ ) {
	create_upgrade(upgrades[i]);
}

// Upgrade event
var upgrade_test = /^upgrade/;
$upgrades.onclick = function(e) {
	if ( e.target.className.match(upgrade) ) {
		var upgrade = e.target.upgrade;

		if ( upgrade && current_money >= upgrade.cost ) {
			current_money -= upgrade.cost;
			$money.innerHTML = fmt(current_money);
			upgrade.setLevel(upgrade.level + 1);
		}
	}
};

  /////////////////////////////
 // Save game
/////////////////////////////

var srows;
var spart;
var sstring;
var squeue;
var supgrades;
var save = function() {
	srows = [];

	// Tiles
	for ( ri = 0; ri < rows; ri++ ) {
		row = tiles[ri];
		srow = [];

		for ( ci = 0; ci < cols; ci++ ) {
			tile = row[ci];

			if ( tile.part ) {
				srow.push({
					id: tile.part.id,
					ticks: tile.ticks,
					activated: tile.activated,
					heat_contained: tile.heat_contained
				});
			} else {
				srow.push(null);
			}
		}

		srows.push(srow);
	}

	// Tile queue
	squeue = [];
	for ( i = 0, l = tile_queue.length; i < l; i++ ) {
		tile = tile_queue[i];
		squeue.push({
			row: tile.row,
			col: tile.col
		});
	}

	// Upgrades
	supgrades = [];
	for ( i = 0, l = upgrade_objects_array.length; i < l; i++ ) {
		upgrade = upgrade_objects_array[i];
		supgrades.push({
			id: upgrade.upgrade.id,
			level: upgrade.level
		});
	}

	window.localStorage.setItem('rks', window.btoa(JSON.stringify({
		tiles: srows,
		tile_queue: squeue,
		upgrades: supgrades,
		current_power: current_power,
		current_money: current_money,
		current_heat: current_heat
	})));
};

$save.onclick = save;

// Select part
var part_test = /^part/;
var active_replace = /[\b\s]active\b/;
var clicked_part = null;
$parts.onclick = function(e) {
	if ( e.target.className.match(part_test) ) {
		if ( clicked_part && clicked_part === e.target.part ) {
			clicked_part = null;
			e.target.className = e.target.className.replace(active_replace, '');
		} else {
			if ( clicked_part ) {
				clicked_part.$el.className = clicked_part.$el.className.replace(active_replace, '');
			}
			clicked_part = e.target.part;
			e.target.className += ' active';
		}
	}
};

// Add part to tile
var tile_test = /^tile/;
var part_replace = /[\b\s]part_[a-z0-9]+\b/;
var spent_replace = /[\b\s]spent\b/;
var disabled_replace = /[\b\s]disabled\b/;
var tile_mousedown = false;
var tile_mousedown_right = false;
var tile_queue = [];
var qi;
var tile2;

var apply_to_tile = function(tile, part) {
	tile.part = part;
	tile.$el.className = tile.$el.className
		.replace(part_replace, '')
		.replace(spent_replace, '')
		.replace(disabled_replace, '')
		+ ' ' + part.className
		;

	if ( part.ticks && !tile.ticks ) {
		tile.$el.className += ' spent';
	}

	if ( !tile.activated ) {
		tile.$el.className += ' disabled';
	}
};

var mouse_apply_to_tile = function(e) {
	if ( e.target.className.match(tile_test) ) {
		tile = e.target.tile;

		if ( tile_mousedown_right ) {
			tile.part = null;
			tile.ticks = 0;
			e.target.className = e.target.className
				.replace(part_replace, '')
				.replace(spent_replace, '')
				.replace(disabled_replace, '')
				;
			update_tiles();

			l = tile_queue.length;
			if ( l ) { 
				for ( qi = 0; qi < l; qi++ ) {
					tile2 = tile_queue[qi];
					if ( !tile2.part ) {
						tile_queue.splice(qi, 1);
						qi--;
						l--;
					}
				}
			}
		} else if (
			clicked_part
			&& (
				!tile.part
				|| (tile.part === clicked_part && tile.ticks === 0)
				|| (tile.part && tile.part.type === clicked_part.type && tile.part.part.level < clicked_part.part.level && current_money >= clicked_part.cost )
			)
		) {
			if ( current_money < clicked_part.cost ) {
				tile.activated = false;
				tile_queue.push(tile);
			} else {
				tile.activated = true;
				$money.innerHTML = fmt(current_money -= clicked_part.cost);
			}

			tile.ticks = clicked_part.ticks;

			apply_to_tile(tile, clicked_part);

			update_tiles();
		}
	}
};

  /////////////////////////////
 // Load
/////////////////////////////

var stile;
var supgrade;
var rks = window.localStorage.getItem('rks');
var srow;
if ( rks ) {
	rks = JSON.parse(window.atob(rks));

	// Current values
	$current_heat.innerHTML = fmt(current_heat = rks.current_heat || current_heat);
	$current_power.innerHTML = fmt(current_power = rks.current_power || current_power);
	$money.innerHTML = fmt(current_money = rks.current_money || current_money);

	// Tiles
	for ( ri = 0; ri < rows; ri++ ) {
		row = tiles[ri];
		srow = rks.tiles[ri];

		if ( srow ) {
			for ( ci = 0; ci < cols; ci++ ) {
				stile = srow[ci];

				if ( stile ) {
					tile = row[ci];
					tile.ticks = stile.ticks;
					tile.activated = stile.activated;
					tile.heat_contained = stile.heat_contained;
					apply_to_tile(tile, part_objects[stile.id]);
				}
			}
		}
	}

	// Tile queue
	for ( i = 0, l = rks.tile_queue.length; i < l; i++ ) {
		stile = rks.tile_queue[i];
		tile_queue.push(tiles[stile.row][stile.col]);
	}

	update_tiles();

	// Upgrades
	for ( i = 0, l = rks.upgrades.length; i < l; i++ ) {
		supgrade = rks.upgrades[i];
		upgrade_objects[supgrade.id].setLevel(supgrade.level);
	}
}

  /////////////////////////////
 // Tile clicks
/////////////////////////////

var tile_mouseup_fn = function(e) {
	tile_mousedown = false;
};

document.oncontextmenu = function(e) {
	if ( tile_mousedown_right ) {
		e.preventDefault();
		tile_mousedown_right = false;
	}
};

$reactor.onclick = mouse_apply_to_tile;

$reactor.onmousedown = function(e) {
	tile_mousedown = true;
	tile_mousedown_right = e.which === 3;
	e.preventDefault();
	mouse_apply_to_tile(e);
};

$reactor.onmouseup = tile_mouseup_fn;
$reactor.onmouseleave = tile_mouseup_fn;

$reactor.onmousemove = function(e) {
	if ( tile_mousedown ) {
		mouse_apply_to_tile(e);
	}
};

// Sell power
$sell.onclick = function() {
	if ( current_power ) {
		current_money += current_power;
		current_power = 0;

		$money.innerHTML = fmt(current_money);
		$current_power.innerHTML = 0;
	}
};

// Scrounge
$scrounge.onclick = function() {
	if ( current_money < 10 && current_power === 0 ) {
		current_money += 1;

		$money.innerHTML = fmt(current_money);
	}
};

  /////////////////////////////
 // Game Loop
/////////////////////////////
var loop_timeout;

var game_loop = function() {
	for ( ri = 0; ri < rows; ri++ ) {
		row = tiles[ri];

		for ( ci = 0; ci < cols; ci++ ) {
			tile = row[ci];
			if ( tile.activated && tile.part ) {
				if ( tile.part.category === 'cell' && tile.ticks !== 0 ) {
					current_power += tile.power;
					current_heat += tile.heat;
					tile.ticks--;

					if ( tile.ticks === 0 ) {
						tile.$el.className += ' spent';
						update_tiles();
					}
				}
			}
		}
	}

	if ( tile_queue.length ) {
		tile = tile_queue[0];

		if ( !tile.part || tile.activated ) {
			tile_queue.splice(0, 1);
		} else if ( tile.part && current_money >= tile.part.cost ) {
			current_money -= tile.part.cost;
			$money.innerHTML = fmt(current_money);
			tile.activated = true;
			tile.$el.className = tile.$el.className.replace(disabled_replace, '');
			tile_queue.splice(0, 1);
			update_tiles();
		}
	}

	$current_heat.innerHTML = fmt(current_heat);
	$current_power.innerHTML = fmt(current_power);

	loop_timeout = setTimeout(game_loop, loop_wait);
};

// affordability loop
var unaffordable_replace = /[\s\b]unaffordable\b/;
var check_affordability = function() {
	for ( i = 0, l = part_objects_array.length; i < l; i++ ) {
		part = part_objects_array[i];
		if ( part.affordable && part.cost > current_money ) {
			part.affordable = false;
			part.$el.className += ' unaffordable';
		} else if ( !part.affordable && part.cost <= current_money ) {
			part.affordable = true;
			part.$el.className = part.$el.className.replace(unaffordable_replace, '');
		}
	}
};

check_affordability();
game_loop();

setInterval(check_affordability, 1000);

})();