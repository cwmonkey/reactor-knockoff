/*

TODO:

Bugs:
stats display issue on mobile
Replace All doesn't work as expected on depleted cells on mobile

Ongoing:
adjust ui
mobile ui
parts ui adjust
browser testing

when placed, change tooltip/focus to tile
Add "purchase" to tooltip for upgrades?
Add "sell all of type" button
saving/loading indicator, cancel save/load button
unshift vents - vent6 power issue?
figure out reflector experiment upgrade
finish help section
Statistics
idle countdown timer & upgrades
Hotkeys for place part, delete/sell all, close tooltip, focus navs, pages, pause, etc
multiple reactors
make stats unlockable
header buttons
fix close/delete buttons on tooltip
fix upgrade/experiment display
"story" objectives
new cells
tooltip
modal messages
Bundling cells to 9+
towns with different power needs and compensation
Options page - exponential formatting
test speed of loops
try big int library
ui.js - put purely ui control stuff in there
Alert user when there is an update available

Make an auto-updater that updates without reloading
shift + right click on spent cells also gets rid of unspent cells
document part/upgrade keys
right click to sell upgrades?
decouple tooltip code
achievement system
save layouts
Scrounge

console.log
*/


(function() {
'use strict';

/////////////////////////////
// General
/////////////////////////////

var ui = window.ui;
window.ui = null;

var Game = class {
	constructor() {
		this.ui;

		// settings
		this.version = '1.3.0';
		this.base_cols = 14;
		this.base_rows = 11;
		this.max_cols = 35;
		this.max_rows = 32;
		this.debug = false;
		this.save_debug = false;
		this.base_loop_wait = 1000;
		this.base_power_multiplier = 1;
		this.base_heat_multiplier = 4;
		this.base_manual_heat_reduce = 1;
		this.upgrade_max_level = 32;
		this.base_max_heat = 1000;
		this.base_max_power = 100;
		this.base_money = 10;
		this.save_interval = 60000;

		// Current
		this.current_heat;
		this.tiles = [];
		this.tiles_2d = [];
		this.active_tiles = [];
		this.active_tiles_2d = [];
		this.loop_wait;
		this.heat_power_multiplier;
		this.heat_controlled;
		this.manual_heat_reduce;
		this.auto_sell_multiplier;
		this.transfer_plating_multiplier;
		this.transfer_capacitor_multiplier;
		this.vent_plating_multiplier;
		this.vent_capacitor_multiplier;
		this.altered_max_power;
		this.altered_max_heat;
		this.stats_power;
		this.stats_cash = 0;
		this.paused = false;
		this.auto_sell_disabled = false;
		this.auto_buy_disabled = false;
		this.has_melted_down = false;
		this.current_money = 0;
		this.exotic_particles = 0;
		this.current_exotic_particles = 0;

		// Displayed


		this.part_objects_array = [];
		this.part_objects = {};
		this.upgrade_objects_array = [];
		this.upgrade_objects = {};

		// Objectives
		this.sold_power = false;
		this.sold_heat = false;
	}

	update_active_tiles() {
		var arow;
		this.active_tiles.length = 0;
		this.active_tiles_2d.length = 0;
		for ( ri = 0; ri < this.rows; ri++ ) {
			row = this.tiles[ri]
			arow = [];

			for ( ci = 0; ci < this.cols; ci++ ) {
				tile = row[ci];
				arow.push(tile);
				this.active_tiles_2d.push(tile);
			}
			this.active_tiles.push(row);
		}
	}

	set_active_tiles(row, col) {
		this._rows = row;
		this._cols = col;
		this.update_active_tiles();
	}

	get rows() {
		return this._rows;
	}
	set rows(length) {
		this._rows = length;
		this.update_active_tiles();
	}

	get cols() {
		return this._cols;
	}
	set cols(length) {
		this._cols = length;
		this.update_active_tiles();
	}
};

Game.prototype.addProperty = addProperty;

var game = new Game();
ui.init(game);
game.ui = ui;

// Current
var current_power;
var max_heat;
var max_power;
var power_multiplier;
var heat_multiplier;
var protium_particles;

var total_exotic_particles = 0;

var set_defaults = function() {
	game.current_heat = 0;
	current_power = 0;
	game.current_money = game.base_money;
	game.cols = game.base_cols;
	game.rows = game.base_rows;
	max_heat = game.base_max_heat;
	game.auto_sell_multiplier = 0;
	max_power = game.base_max_power;
	game.loop_wait = game.base_loop_wait;
	power_multiplier = game.base_power_multiplier;
	heat_multiplier = game.base_heat_multiplier;
	game.manual_heat_reduce = game.base_manual_heat_reduce;
	game.vent_capacitor_multiplier = 0;
	game.vent_plating_multiplier = 0;
	game.transfer_capacitor_multiplier = 0;
	game.transfer_plating_multiplier = 0;
	game.heat_power_multiplier = 0;
	game.heat_controlled = 0;
	game.heat_outlet_controlled = 0;
	game.altered_max_heat = game.base_max_heat;
	game.altered_max_power = game.base_max_power;
	protium_particles = 0;
};

set_defaults();

/////////////////////////////
// Online Saves and related functions
/////////////////////////////
var save_manager = window.save_manager;
window.save_manager = null;

save_manager.init(game);
game.save_manager = save_manager;

var $enable_google_drive_save = $('#enable_google_drive_save');
var $enable_local_save = $('#enable_local_save');

var local_saver = new save_manager.LocalSaver();
var google_saver = new save_manager.GoogleSaver();

var save_game = local_saver;

// Local
var enable_local_save = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	save_game = local_saver;
	$enable_local_save.style.display = 'none';
	$enable_google_drive_save.style.display = null;
	save_game.enable();
};

$enable_local_save.onclick = enable_local_save;

// Google Drive
var enable_google_drive_save = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	if ( google_saver.loadfailed ) {
		alert("google drive script failed to load, unable to enable feature, try reloading the page")
		return
	}

	save_game = google_saver;
	$enable_google_drive_save.style.display = 'none';
	$enable_local_save.style.display = null;

	save_game.enable(function() {
		// If a saved game is found
		if ( confirm("Save file found. Use Google Drive save file?")
			|| !confirm("Really delete the Google Drive save file? This action cannot be undone.")
		) {
			document.location.reload();
		} else {
			save();
		}
	}, event);
};

$enable_google_drive_save.onclick = enable_google_drive_save;

// Save handler
var save_timeout;
var save = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	clearTimeout(save_timeout);

	save_game.save(
		game.saves(),
		function() {
			game.save_debug && console.log('saved');
			if ( game.debug === false ) {
				save_timeout = setTimeout(save, game.save_interval);
			}
		}
	);
};

var srows;
var spart;
var sstring;
var squeue;
var supgrades;
var save_timeout;

var saves = function() {
	srows = [];

	// Tiles
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];
		srow = [];

		for ( ci = 0; ci < game.cols; ci++ ) {
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
	for ( i = 0, l = game.upgrade_objects_array.length; i < l; i++ ) {
		upgrade = game.upgrade_objects_array[i];
		supgrades.push({
			id: upgrade.upgrade.id,
			level: upgrade.level
		});
	}

	return window.btoa(JSON.stringify({
			tiles: srows,
			tile_queue: squeue,
			upgrades: supgrades,
			current_power: current_power,
			current_money: game.current_money,
			current_heat: game.current_heat,
			exotic_particles: game.exotic_particles,
			current_exotic_particles: game.current_exotic_particles,
			total_exotic_particles: total_exotic_particles,
			buttons_state: game.ui.toggle_buttons_saves(),
			protium_particles: protium_particles,
			current_objective: current_objective,
			version: game.version
		}))
};

game.saves = saves;

var stile;
var supgrade;
var srow;
var supgrade_object;

var loads = function(rks) {
	game.save_debug && console.log('save_game.load', rks);

	if ( rks ) {
		try {
			rks = JSON.parse(window.atob(rks));
		} catch (err) {
			rks = {};
		}

		// Current values
		game.current_heat = rks.current_heat || game.current_heat;
		current_power = rks.current_power || current_power;
		game.current_money = rks.current_money || 0;
		game.exotic_particles = rks.exotic_particles || game.exotic_particles;
		game.current_exotic_particles = rks.current_exotic_particles || game.current_exotic_particles;
		total_exotic_particles = rks.total_exotic_particles || total_exotic_particles;
		ui.say('var', 'total_exotic_particles', total_exotic_particles);

		max_heat = rks.max_heat || max_heat;
		game.manual_heat_reduce = rks.manual_heat_reduce || game.manual_heat_reduce;
		game.paused = rks.paused || game.paused;
		current_objective = rks.current_objective || current_objective;

		protium_particles = rks.protium_particles || protium_particles;

		var save_version = rks.version || null;

		if ( rks.buttons_state ) {
			ui.toggle_buttons_loads(rks.buttons_state)
		}

		ui.say('var', 'manual_heat_reduce', game.manual_heat_reduce);
		ui.say('var', 'auto_heat_reduce', max_heat/10000);

		// Tiles
		if ( rks.tiles ) {
			for ( ri = 0; ri < game.max_rows; ri++ ) {
				row = game.tiles[ri];
				srow = rks.tiles[ri];

				if ( srow ) {
					for ( ci = 0; ci < game.max_cols; ci++ ) {
						stile = srow[ci];

						if ( stile ) {
							tile = row[ci];
							tile.setTicks(stile.ticks);
							tile.activated = stile.activated;
							tile.setHeat_contained(stile.heat_contained);
							part = game.part_objects[stile.id];
							apply_to_tile(tile, part, true);
						}
					}
				}
			}
		}

		// Tile queue
		if ( rks.tile_queue ) {
			for ( i = 0, l = rks.tile_queue.length; i < l; i++ ) {
				stile = rks.tile_queue[i];
				tile_queue.push(game.tiles[stile.row][stile.col]);
			}
		}

		// Upgrades
		if ( rks.upgrades ) {
			for ( i = 0, l = rks.upgrades.length; i < l; i++ ) {
				supgrade = rks.upgrades[i];
				supgrade_object = game.upgrade_objects[supgrade.id];

				if ( supgrade_object ) {
					game.upgrade_objects[supgrade.id].setLevel(supgrade.level);
				}
			}
		}

		update_nodes();
		update_tiles();
		update_heat_and_power();

		// Show the patch notes if this is a new version
		if ( save_version !== game.version ) {
			ui.say('evt', 'game_updated');
		}
	}

	game.update_cell_power();
	update_nodes();
	update_tiles();
	update_heat_and_power();

	if ( !game.paused ) {
		clearTimeout(loop_timeout);
		loop_timeout = setTimeout(game_loop, game.loop_wait);
	}

	set_objective(current_objective, true);

	ui.say('evt', 'game_loaded');

	if ( game.debug === false ) {
		save_timeout = setTimeout(save, game.save_interval);
	}
}

game.loads = loads;

/////////////////////////////
// Reboot (Decoupled)
/////////////////////////////

window.reboot = function(refund) {
	clearTimeout(loop_timeout);

	set_defaults();

	for ( ri = 0; ri < game.max_rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.max_cols; ci++ ) {
			tile = row[ci];
			remove_part(tile, true);

			if ( ri >= game.rows || ci >= game.cols ) {
				tile.disable();
			}
		}
	}

	total_exotic_particles += game.exotic_particles;
	ui.say('var', 'total_exotic_particles', total_exotic_particles);

	if ( refund === true ) {
		for ( i = 0, l = game.upgrade_objects_array.length; i < l; i++ ) {
			upgrade = game.upgrade_objects_array[i];
			upgrade.setLevel(0);
		}

		game.current_exotic_particles = total_exotic_particles;
	} else {
		for ( i = 0, l = game.upgrade_objects_array.length; i < l; i++ ) {
			upgrade = game.upgrade_objects_array[i];

			if ( !upgrade.ecost ) {
				upgrade.setLevel(0);
			} else {
				upgrade.setLevel(upgrade.level);
			}
		}

		game.current_exotic_particles += game.exotic_particles;
	}

	update_tiles();

	game.exotic_particles = 0;

	ui.say('var', 'exotic_particles', game.exotic_particles);
	ui.say('var', 'current_exotic_particles', game.current_exotic_particles);

	update_nodes();

	clearTimeout(loop_timeout);
	loop_timeout = setTimeout(game_loop, game.loop_wait);
};

// For iteration
var i;
var l;
var ri;
var pi;
var pl;
var ci;
var row;
var tile;
var upgrade;

// Other vars
var single_cell_description = 'Produces %power power and %heat heat per tick. Lasts for %ticks ticks.';
var multi_cell_description = 'Acts as %count %type cells. Produces %power power and %heat heat per tick.';

/////////////////////////////
// Tiles
/////////////////////////////

var Tile = class {
	constructor(row, col) {
		this.part = null;
		this.heat = 0;
		this.display_power = null;
		this.display_heat = null;
		this.power = 0;
		this.containments = [];
		this.cells = [];
		this.reflectors = [];
		this.activated = false;
		this.row = row;
		this.col = col;
		this.enabled = false;
		this.updated = false;

		this.display_chance = 0;
		this.display_chance_percent_of_total = 0;

		this.addProperty('heat_contained', 0);
		this.addProperty('ticks', 0);
	}

	get vent() {
		if ( this.part.vent ) {
			return this.part.vent * (1 + vent_multiplier / 100);
		}
	}

	get transfer() {
		if ( this.part.transfer ) {
			return this.part.transfer * (1 + transfer_multiplier / 100);
		}
	}
};

Tile.prototype.addProperty = addProperty;

Tile.prototype.disable = function() {
	this.enabled = false;
	ui.say('evt', 'tile_disabled', this);
};

Tile.prototype.enable = function() {
	this.enabled = true;
	ui.say('evt', 'tile_enabled', this);
};

// Operations
var tile_containment;
var tile_cell;
var tile_part;
var tile_reflector;
var heat_remove;
var transfer_multiplier = 0;
var vent_multiplier = 0;
var ri2;
var ci2;
var tile2;
var tile_part2;
var range;
var pulses;

var stat_vent;
var stat_inlet;
var stat_outlet;
var total_heat;

var tile_power_mult;
var tile_heat_mult;
var pack_multipliers = [1, 4, 12];

var part_count;

var update_tiles = function() {
	transfer_multiplier = 0;
	vent_multiplier = 0;
	max_power = game.altered_max_power;
	max_heat = game.altered_max_heat;
	total_heat = 0;
	game.stats_power = 0;

	stat_vent = 0;
	stat_inlet = 0;
	stat_outlet = 0;

	part_count = 0;

	for ( ri = 0; ri < game.max_rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.max_cols; ci++ ) {
			tile = row[ci];

			if ( tile.enabled === false && ci < game.cols && ri < game.rows ) {
				tile.enable();
			}
		}
	}

	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			tile_part = tile.part;

			// Zero out heat and power
			tile.heat = 0;
			tile.power = 0;

			// collect stats
			if ( tile_part && tile.activated ) {
				part_count++;

				if ( tile_part.vent ) {
					stat_vent += tile_part.vent;
				}
			}
		}
	}

	// Alter counts
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			tile_part = tile.part;
			tile.containments.length = 0;
			tile.cells.length = 0;
			tile.reflectors.length = 0;

			if ( tile_part && tile.activated && (tile_part.category !== 'cell' || tile.ticks) ) {
				range = tile.part.range || 1;

				// Find containment parts and cells within range
				for ( ri2 = 0; ri2 < game.rows; ri2++ ) {
					for ( ci2 = 0; ci2 < game.cols; ci2++ ) {
						if ( (Math.abs(ri2 - ri) + Math.abs(ci2 - ci)) <= range ) {
							if ( ri2 === ri && ci2 === ci ) {
								continue;
							}

							tile2 = game.tiles[ri2][ci2];

							if ( tile2.part && tile2.activated && tile2.part.containment ) {
								if ( tile.part.category === 'vent' || tile.part.id === 'coolant_cell6' ) {
									tile.containments.unshift(tile2);
								} else {
									tile.containments.push(tile2);
								}
							} else if ( tile2.part && tile2.activated && tile2.part.category === 'cell' && tile2.ticks !== 0 ) {
								tile.cells.push(tile2);
							} else if ( tile2.part && tile2.activated && tile2.part.category === 'reflector' ) {
								tile.reflectors.push(tile2);
							}
						} else if ( tile_part.id === 'heat_exchanger6' && ri2 === ri ) {
							// TODO: repeated code from above
							if ( ri2 === ri && ci2 === ci ) {
								continue;
							}

							tile2 = game.tiles[ri2][ci2];

							if ( tile2.part && tile2.activated && tile2.part.containment ) {
								tile.containments.push(tile2);
							}
						}
					}
				}
			}

			if ( tile_part && tile.activated ) {
				if ( tile_part.category === 'capacitor' ) {
					transfer_multiplier += tile_part.part.level * game.transfer_capacitor_multiplier;
					vent_multiplier += tile_part.part.level * game.vent_capacitor_multiplier;
				} else if ( tile_part.category === 'reactor_plating' ) {
					transfer_multiplier += tile_part.part.level * game.transfer_plating_multiplier;
					vent_multiplier += tile_part.part.level * game.vent_plating_multiplier;
				}

				if ( tile_part.category === 'heat_inlet' ) {
					stat_inlet += tile_part.transfer * tile.containments.length;
				}

				if ( tile_part.category === 'heat_outlet' ) {
					stat_outlet += tile_part.transfer * tile.containments.length;
				}
			}
		}
	}

	// Heat and power generators
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			tile_part = tile.part;

			if ( tile_part && tile.activated ) {
				if ( tile_part.category === 'cell' && tile.ticks ) {
					if ( tile.cells.length ) {
						// Neighbor Cells
						pulses = 0;
						for ( i = 0, l = tile.cells.length; i < l; i++ ) {
							tile2 = tile.cells[i];
							pulses += tile2.part.cell_count * tile2.part.pulse_multiplier;
						}

						tile.heat += game.part_objects[tile_part.part.type + '1'].heat * (Math.pow((pack_multipliers[tile_part.part.level - 1] + pulses), 2)) / tile_part.cell_count;
						tile.power += game.part_objects[tile_part.part.type + '1'].power * (pack_multipliers[tile_part.part.level - 1] + pulses);
					} else {
						tile.heat += tile_part.heat;
						tile.power += tile_part.power;
					}

					tile.display_heat = tile.heat;
					tile.display_power = tile.power;
				}
			}

		}
	}

	// Reflectors
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			tile_part = tile.part;

			if ( tile_part && tile.activated ) {
				if ( tile_part.category === 'cell' ) {
					l = tile.reflectors.length;

					if ( l ) {
						tile_power_mult = 0;
						tile_heat_mult = 0;

						for ( i = 0; i < l; i++ ) {
							tile_reflector = tile.reflectors[i];
							tile_power_mult += tile_reflector.part.power_increase;

							if ( tile_reflector.part.heat_increase ) {
								tile_heat_mult += tile_reflector.part.heat_increase;
							}
						}

						tile.power += tile.power * ( tile_power_mult / 100 );
						tile.heat += tile.heat * ( tile_heat_mult / 100 );
						tile.display_power = tile.power;
						tile.display_heat = tile.heat;
					}
				}
			}
		}
	}

	// Containments
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			tile_part = tile.part;

			if ( tile_part && tile.activated ) {
				if ( tile_part.category === 'cell' ) {
					l = tile.containments.length;

					if ( l ) {
						heat_remove = Math.ceil(tile.heat / l);

						for ( i = 0; i < l; i++ ) {
							tile_containment = tile.containments[i];
							tile.heat -= heat_remove;
							tile_containment.heat += heat_remove;
						}
					}
				}
			}
		}
	}

	// Capacitors/Plating
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			tile_part = tile.part;

			if ( tile_part && tile.activated && tile_part.reactor_power ) {
				max_power += tile_part.reactor_power;
			}

			if ( tile_part && tile.activated && tile_part.reactor_heat ) {
				max_heat += tile_part.reactor_heat;
			}

			if ( tile_part && tile.activated && tile_part.id === 'reactor_plating6' ) {
				max_power += tile_part.reactor_heat;
			}
		}
	}

	ui.say('var', 'max_power', max_power);
	ui.say('var', 'max_heat', max_heat);

	ui.say('var', 'stats_vent', stat_vent * (1 + vent_multiplier / 100));
	ui.say('var', 'stats_inlet', stat_inlet * (1 + transfer_multiplier / 100));
	ui.say('var', 'stats_outlet', stat_outlet * (1 + transfer_multiplier / 100));

	// heat and power stats
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			total_heat += tile.heat;
			game.stats_power += tile.power;
		}
	}

	// Scrounge
	if ( part_count === 0 && current_power + game.current_money < game.base_money ) {
		game.current_money = game.base_money - current_power;
		ui.say('var', 'current_money', game.current_money);
	}

	ui.say('var', 'stats_heat', total_heat);
	ui.say('var', 'total_power', game.stats_power);
	game.stats_cash = Math.ceil(max_power * game.auto_sell_multiplier);
	ui.say('var', 'stats_cash', game.stats_cash);
};

// get dom nodes cached
var $reactor = $('#reactor');
var $all_parts = $('#all_parts');

var $main = $('#main');
var $all_upgrades = $('#all_upgrades');

// Tooltip
var $tooltip = $('#tooltip');
var $tooltip_name = $('#tooltip_name');
var $tooltip_description = $('#tooltip_description');
var $tooltip_cost = $('#tooltip_cost');
var $tooltip_sells_wrapper = $('#tooltip_sells_wrapper');
var $tooltip_sells = $('#tooltip_sells');
var $tooltip_heat_per = $('#tooltip_heat_per');
var $tooltip_power_per = $('#tooltip_power_per');
var $tooltip_heat_per_wrapper = $('#tooltip_heat_per_wrapper');
var $tooltip_power_per_wrapper = $('#tooltip_power_per_wrapper');
var $tooltip_heat_wrapper = $('#tooltip_heat_wrapper');
var $tooltip_heat = $('#tooltip_heat');
var $tooltip_max_heat = $('#tooltip_max_heat');
var $tooltip_ticks_wrapper = $('#tooltip_ticks_wrapper');
var $tooltip_ticks = $('#tooltip_ticks');
var $tooltip_max_ticks = $('#tooltip_max_ticks');

var $tooltip_chance_wrapper = $('#tooltip_chance_wrapper');
var $tooltip_chance = $('#tooltip_chance');
var $tooltip_chance_percent_of_total = $('#tooltip_chance_percent_of_total');

if ( game.debug ) {
	$main.className += ' debug';
}

ui.say('var', 'max_heat', max_heat);
ui.say('var', 'max_power', max_power);

// create tiles
for ( ri = 0; ri < game.max_rows; ri++ ) {
	ui.say('evt', 'row_added', ri);
	row = [];

	for ( ci = 0; ci < game.max_cols; ci++ ) {
		tile = new Tile(ri, ci);
		row.push(tile);
		ui.say('evt', 'tile_added', {
			row: ri,
			column: ci,
			tile: tile
		});

		if ( ci <= game.cols || ri <= game.rows ) {
			tile.disable();
		}
	}

	game.tiles.push(row);
}

/////////////////////////////
// Tooltip
/////////////////////////////
var tooltip_task;
var tooltip_update = null;
var tooltip_showing;

var tooltip_show = function(part, tile, update) {
	if ( !part ) return;

	clearTimeout(tooltip_task);
	if ( !tooltip_showing )	{
		$main.classList.add('tooltip_showing');
		tooltip_showing = true;
		part.showTooltip(tile);
	} else {
		part.updateTooltip(tile)
	}
	
	tooltip_update = update;
}

var _tooltip_hide = function() {
	tooltip_update = null;
	$main.classList.remove('tooltip_showing');
	tooltip_showing = false;
}

var tooltip_hide = function() {
	tooltip_task = setTimeout(_tooltip_hide, 200);
}

// Tile tooltips
var tile_tooltip_show = function(e) {
	tooltip_show(this.tile.part, this.tile, ()=>{if ( this.tile.part ){this.tile.part.updateTooltip(this.tile)}});
}

$reactor.delegate('tile', 'mouseover', tile_tooltip_show);
$reactor.delegate('tile', 'mouseout', tooltip_hide);
$reactor.delegate('tile', 'focus', tile_tooltip_show);
$reactor.delegate('tile', 'blur', tooltip_hide);

// Part tooltips
var part_tooltip_show = function(e) {
	tooltip_show(this.part, undefined, ()=>{this.part.updateTooltip()});
}

$all_parts.delegate('part', 'mouseover', part_tooltip_show);
$all_parts.delegate('part', 'mouseout', tooltip_hide);
$all_parts.delegate('part', 'focus', part_tooltip_show);
$all_parts.delegate('part', 'blur', tooltip_hide);

// Upgrade tooltips

window.Upgrade.prototype.showTooltip = function() {
	$tooltip_name.textContent = this.upgrade.title;

	$tooltip_cost.style.display = null;
	$tooltip_ticks_wrapper.style.display = 'none';
	$tooltip_sells_wrapper.style.display = 'none';
	$tooltip_heat_per_wrapper.style.display = 'none';
	$tooltip_power_per_wrapper.style.display = 'none';
	$tooltip_heat_wrapper.style.display = 'none';
	$tooltip_chance_wrapper.style.display = 'none';

	this.updateTooltip();
};

Upgrade.prototype.updateTooltip = function(tile) {
	$tooltip_description.textContent = this.upgrade.description;

	if ( this.ecost ) {
		$tooltip_cost.textContent = this.display_cost + ' EP';
	} else {
		$tooltip_cost.textContent = this.display_cost;
	}
};

var upgrade_tooltip_show = function(e) {
	tooltip_show(this.upgrade, undefined, null)
}

$all_upgrades.delegate('upgrade', 'mouseover', upgrade_tooltip_show);
$all_upgrades.delegate('upgrade', 'mouseout', tooltip_hide);
$all_upgrades.delegate('upgrade', 'focus', upgrade_tooltip_show);
$all_upgrades.delegate('upgrade', 'blur', tooltip_hide);

/////////////////////////////
// Parts
/////////////////////////////

var parts = window.parts();
window.parts = null;

game.parts = parts;

var Part = class {
	constructor(part) {
		this.part = part;
		this.id = part.id;
		this.category = part.category;
		this.heat = part.heat;
		this.power = part.power;
		this.base_heat = part.base_heat;
		this.base_power = part.base_power;
		this.heat_multiplier = part.base_heat_multiplier;
		this.power_multiplier = part.base_power_multiplier;
		this.power_increase = part.base_power_increase;
		this.heat_increase = part.base_heat_increase;
		this.ticks = part.base_ticks;
		this.containment = part.base_containment;
		this.vent = part.base_vent;
		this.reactor_power = part.base_reactor_power;
		this.reactor_heat = part.base_reactor_heat;
		this.transfer = part.base_transfer;
		this.range = part.base_range;
		this.ep_heat = part.base_ep_heat;
		this.erequires = part.erequires || null;
		this.cost = part.base_cost;
		this.perpetual = false;
		this.description = '';
		this.sells = 0;
		this.auto_sell = 0;
		this.cell_count = part.cell_count || 0;
		this.cell_multiplier = part.cell_multiplier || 0;
		this.pulse_multiplier = part.pulse_multiplier || 0;
		this.pulses = part.cell_count * part.pulse_multiplier;

		this.addProperty('affordable', false);
	}

	updateDescription(tile) {
		var description = this.part.base_description
			.replace(/%single_cell_description/, single_cell_description)
			.replace(/%multi_cell_description/, multi_cell_description)
			.replace(/%power_increase/, fmt(this.power_increase))
			.replace(/%heat_increase/, fmt(this.heat_increase))
			.replace(/%reactor_power/, fmt(this.reactor_power))
			.replace(/%reactor_heat/, fmt(this.reactor_heat))
			.replace(/%ticks/, fmt(this.ticks))
			.replace(/%containment/, fmt(this.containment))
			.replace(/%ep_heat/, fmt(this.ep_heat))
			.replace(/%range/, fmt(this.range))
			.replace(/%count/, [1, 2, 4][this.part.level - 1])
			.replace(/%power/, fmt(this.power))
			.replace(/%heat/, fmt(this.heat))
			;

		if ( tile ) {
			description = description
				.replace(/%transfer/, fmt(this.transfer * (1 + transfer_multiplier / 100)))
				.replace(/%vent/, fmt(this.vent * (1 + vent_multiplier / 100) ))
				;
		} else {
			description = description
				.replace(/%transfer/, fmt(this.transfer))
				.replace(/%vent/, fmt(this.vent))
				;
		}

		if ( this.part.level > 1 ) {
			description = description.replace(/%type/, game.part_objects[this.part.type + 1].part.title);
		}

		this.description = description;
	}

	showTooltip(tile) {
		$tooltip_name.textContent = this.part.title;

		if ( tile ) {
			this.updateDescription(tile);
			$tooltip_cost.style.display = 'none';

			if ( tile.activated && tile.part.containment ) {
				$tooltip_heat_wrapper.style.display = null;
			} else {
				$tooltip_heat_wrapper.style.display = 'none';
			}

			if ( tile.activated && tile.part.ticks ) {
				$tooltip_ticks_wrapper.style.display = null;
			} else {
				$tooltip_ticks_wrapper.style.display = 'none';
			}

			if ( tile.activated && tile.part.heat ) {
				$tooltip_heat_per_wrapper.style.display = null;
			} else {
				$tooltip_heat_per_wrapper.style.display = 'none';
			}

			if ( tile.activated && tile.part.power ) {
				$tooltip_power_per_wrapper.style.display = null;
			} else {
				$tooltip_power_per_wrapper.style.display = 'none';
			}

			if ( tile.activated && tile.part.power ) {
				$tooltip_power_per_wrapper.style.display = null;
			} else {
				$tooltip_power_per_wrapper.style.display = 'none';
			}

			if ( tile.activated && tile.part.category === 'cell' ) {
				$tooltip_sells_wrapper.style.display = 'none';
			} else {
				$tooltip_sells_wrapper.style.display = null;
			}

			if ( tile.activated && tile.part.category === 'particle_accelerator' ) {
				$tooltip_chance_wrapper.style.display = null;
			} else {
				$tooltip_chance_wrapper.style.display = 'none';
			}
		} else {

			this.updateDescription();
			$tooltip_cost.style.display = null;
			$tooltip_sells_wrapper.style.display = 'none';

			$tooltip_heat_wrapper.style.display = 'none';
			$tooltip_ticks_wrapper.style.display = 'none';

			$tooltip_heat_per_wrapper.style.display = 'none';
			$tooltip_power_per_wrapper.style.display = 'none';

			$tooltip_chance_wrapper.style.display = 'none';
		}

		this.updateTooltip(tile);
	}

	updateTooltip(tile) {
		if ( tile ) {
			if ( $tooltip_description.textContent !== tile.part.description ) {
				$tooltip_description.textContent = tile.part.description;
			}

			if ( tile.activated && tile.part.containment ) {
				$tooltip_heat.textContent = fmt(tile.heat_contained);
				$tooltip_max_heat.textContent = fmt(tile.part.containment);
			}

			if ( tile.activated && tile.part.ticks ) {
				$tooltip_ticks.textContent = fmt(tile.ticks);
				$tooltip_max_ticks.textContent = fmt(tile.part.ticks);
			}

			if ( tile.activated && tile.part.heat ) {
				$tooltip_heat_per.textContent = fmt(tile.display_heat);
			}

			if ( tile.activated && tile.part.power ) {
				$tooltip_power_per.textContent = fmt(tile.display_power);
			}

			if ( tile.activated && tile.part.category !== 'cell' ) {
				if ( tile.part.ticks ) {
					$tooltip_sells.textContent = fmt(Math.ceil(tile.ticks / tile.part.ticks * tile.part.cost));
				} else if ( tile.part.containment ) {
					$tooltip_sells.textContent = fmt(tile.part.cost - Math.ceil(tile.heat_contained / tile.part.containment * tile.part.cost));
				} else {
					$tooltip_sells.textContent = fmt(tile.part.cost);
				}
			}

			if ( tile.activated && tile.part.category === 'particle_accelerator' ) {
				$tooltip_chance.textContent = fmt(tile.display_chance);
				$tooltip_chance_percent_of_total.textContent = fmt(tile.display_chance_percent_of_total);
			}
		} else {
			$tooltip_description.textContent = this.description;

			if ( this.erequires && !game.upgrade_objects[this.erequires].level ) {
				$tooltip_cost.textContent = 'LOCKED';
			} else {
				$tooltip_cost.textContent = fmt(this.cost);
			}
		}
	}
}

Part.prototype.addProperty = addProperty;

var part_obj;
var part_settings;
var part;
var cell_prefixes = ['', 'Dual ', 'Quad '];
var prefixes = ['Basic ', 'Advanced ', 'Super ', 'Wonderous ', 'Ultimate '];
var cell_power_multipliers = [1, 4, 12];
var cell_heat_multipliers = [1, 8, 36];
var cell_counts = [1, 2, 4, 9, 16];

var create_part = function(part, level) {
	if ( level ) {
		part = JSON.parse(JSON.stringify(part));
		part.level = level;

		if ( part.category === 'cell' ) {
			part.id = part.type + level;
			part.title = cell_prefixes[level -1] + part.title;
			part.base_cost = part.base_cost
			if ( level > 1 ) {
				part.base_cost *= Math.pow(2.2, level - 1);
				part.base_description = multi_cell_description;
			}
			part.base_power = part.base_power * cell_power_multipliers[level - 1];
			part.base_heat = part.base_heat * cell_heat_multipliers[level - 1];

			part.cell_count = cell_counts[level - 1];
			part.pulse_multiplier = 1;
		} else {
			part.id = part.category + level;
			part.title = prefixes[level -1] + part.title;
			part.base_cost = part.base_cost * Math.pow(part.cost_multiplier, level -1);

			if ( part.base_ticks && part.ticks_multiplier ) {
				part.base_ticks = part.base_ticks * Math.pow(part.ticks_multiplier, level - 1);
			}

			if ( part.base_containment && part.containment_multiplier ) {
				part.base_containment = part.base_containment * Math.pow(part.containment_multiplier, level - 1);
			}

			if ( part.base_reactor_power && part.reactor_power_multiplier ) {
				part.base_reactor_power = part.base_reactor_power * Math.pow(part.reactor_power_multiplier, level - 1);
			}

			if ( part.base_reactor_heat && part.reactor_heat_multiplier ) {
				part.base_reactor_heat = part.base_reactor_heat * Math.pow(part.reactor_heat_multiplier, level - 1);
			}

			if ( part.base_transfer && part.transfer_multiplier ) {
				part.base_transfer = part.base_transfer * Math.pow(part.transfer_multiplier, level - 1);
			}

			if ( part.base_vent && part.vent_multiplier ) {
				part.base_vent = part.base_vent * Math.pow(part.vent_multiplier, level - 1);
			}

			if ( part.base_ep_heat && part.ep_heat_multiplier ) {
				part.base_ep_heat = part.base_ep_heat * Math.pow(part.ep_heat_multiplier, level - 1);
			}

			if ( part.base_power_increase && part.power_increase_add ) {
				part.base_power_increase = part.base_power_increase + part.power_increase_add * level - 1;
			}

			if ( part.base_heat_increase ) {
				part.base_heat_increase = part.base_heat_increase;
			}

		}
	}

	part_obj = new Part(part);

	game.part_objects[part.id] = part_obj;
	game.part_objects_array.push(part_obj);

	part_obj.updateDescription();
	ui.say('evt', 'part_added', part_obj);

	return part_obj;
}

for ( pi = 0, pl = parts.length; pi < pl; pi++ ) {
	part_settings = parts[pi];
	if ( part_settings.levels ) {
		for ( i = 0, l = part_settings.levels; i < l; i++ ) {
			create_part(part_settings, i + 1);
		}
	} else {
		create_part(part_settings);
	}
}

game.update_cell_power = function() {
	var part;

	for ( var i = 0, l = game.part_objects_array.length; i < l; i++ ) {
		part = game.part_objects_array[i];

		if ( part.category === 'cell' ) {
			if ( game.upgrade_objects['cell_power_' + part.part.type] ) {
				part.power = part.part.base_power * (game.upgrade_objects['cell_power_' + part.part.type].level + game.upgrade_objects['infused_cells'].level + 1) * Math.pow(2, game.upgrade_objects['unleashed_cells'].level);
			} else {
				part.power = part.part.base_power * (game.upgrade_objects['infused_cells'].level + 1) * Math.pow(2, game.upgrade_objects['unleashed_cells'].level);
			}

			if ( part.part.type === 'protium' ) {
				// TODO: DRY this
				part.power = part.part.base_power * (game.upgrade_objects['infused_cells'].level + 1) * Math.pow(2, game.upgrade_objects['unstable_protium'].level) * Math.pow(2, game.upgrade_objects['unleashed_cells'].level);
				part.power *= 1 + protium_particles / 10;
			}
		}
	}
};

/////////////////////////////
// Reduce Heat Manually (Decoupled)
/////////////////////////////

window.reduce_heat = function() {
	if ( game.current_heat ) {
		game.current_heat -= game.manual_heat_reduce;

		if ( game.current_heat < 0 ) {
			game.current_heat = 0;
		}

		if ( game.current_heat === 0 ) {
			game.sold_heat = true;
		}

		ui.say('var', 'current_heat', game.current_heat);
	}
};

/////////////////////////////
// Upgrades
/////////////////////////////

game.epart_onclick = function(upgrade) {
	var eparts_count = 0;

	for ( var i = 0, l = game.upgrade_objects_array.length; i < l; i++) {
		if ( game.upgrade_objects_array[i].upgrade.type === 'experimental_parts' && game.upgrade_objects_array[i].level ) {
			eparts_count++;
		}
	}

	for ( var i = 0, l = game.upgrade_objects_array.length; i < l; i++) {
		if ( game.upgrade_objects_array[i].upgrade.type === 'experimental_parts' && !game.upgrade_objects_array[i].level ) {
			game.upgrade_objects_array[i].ecost = game.upgrade_objects_array[i].upgrade.ecost * (eparts_count + 1);
			// TODO: Maybe find a better way to do this
			game.upgrade_objects_array[i].display_cost = fmt(game.upgrade_objects_array[i].ecost);
		}
	}
};

var upgrades = window.upgrades(game);
window.upgrades = null;


// More stuff I guess

var upgrade_locations = {
	cell_tick_upgrades: $('#cell_tick_upgrades'),
	cell_power_upgrades: $('#cell_power_upgrades'),
	cell_perpetual_upgrades: $('#cell_perpetual_upgrades'),
	other: $('#other_upgrades'),
	vents: $('#vent_upgrades'),
	exchangers: $('#exchanger_upgrades'),
	experimental_laboratory: $('#experimental_laboratory'),
	experimental_boost: $('#experimental_boost'),
	experimental_cells: $('#experimental_cells'),
	experimental_cells_boost: $('#experimental_cell_boost'),
	experimental_parts: $('#experimental_parts'),
	experimental_particle_accelerators: $('#experimental_particle_accelerators')
};

var create_upgrade = function(u) {
	u.levels = u.levels || game.upgrade_max_level;
	var upgrade = new window.Upgrade(u);
	upgrade.$el.upgrade = upgrade;

	if ( u.className ) {
		upgrade.$el.className += ' ' + u.className;
	}

	upgrade_locations[u.type].appendChild(upgrade.$el);
	game.upgrade_objects_array.push(upgrade);
	game.upgrade_objects[upgrade.upgrade.id] = upgrade;
};

var types = [
	{
		type: 'cell_power',
		title: 'Potent ',
		description: ' cells produce 100% more power per level of upgrade.',
		onclick: function(upgrade) {
			var part;
			for ( var i = 1; i <= 3; i++ ) {
				part = game.part_objects[upgrade.part.type + i];
				part.power = (
					part.part.base_power * (upgrade.level + 1)
					+ part.part.base_power * (game.upgrade_objects['infused_cells'].level + 1)
				) * Math.pow(2, game.upgrade_objects['unleashed_cells'].level);
				part.updateDescription();
			}
		}
	},
	{
		type: 'cell_tick',
		title: 'Enriched ',
		description: ' cells last twice as long per level of upgrade.',
		onclick: function(upgrade) {
			var part;
			for ( var i = 1; i <= 3; i++ ) {
				part = game.part_objects[upgrade.part.type + i];
				part.ticks = part.part.base_ticks * Math.pow(2, upgrade.level);
				part.updateDescription();
			}
		}
	},
	{
		type: 'cell_perpetual',
		title: 'Perpetual ',
		description: ' cells are automatically replaced when they become depleted. The replacement cell will cost 1.5 times the normal cost.',
		levels: 1,
		onclick: function(upgrade) {
			var part;
			for ( var i = 1; i <= 3; i++ ) {
				part = game.part_objects[upgrade.part.type + i];
				if ( upgrade.level ) {
					part.perpetual = true;
				} else {
					part.perpetual = false;
				}
				part.updateDescription();
			}
		}
	}
];

var type;
var part;

for ( var i = 0, l = types.length; i < l; i++ ) {
	type = types[i];

	for ( var pi = 0, pl = parts.length; pi < pl; pi++ ) {
		part = parts[pi];

		if ( part.cell_tick_upgrade_cost ) {
			upgrade = {
				id: type.type + '_' + part.type,
				type: type.type + '_upgrades',
				title: type.title + ' ' + part.title,
				description: part.title + ' ' + type.description,
				levels: type.levels,
				cost: part[type.type + '_upgrade_cost'],
				multiplier: part[type.type + '_upgrade_multiplier'],
				onclick: type.onclick,
				className: part.type + ' ' + type.type,
				part: part
			};

			create_upgrade(upgrade);
		}
	}
}

for ( var i = 0, l = upgrades.length; i < l; i++ ) {
	create_upgrade(upgrades[i]);
}

for ( var i = 0, l = game.upgrade_objects_array.length; i < l; i++ ) {
	game.upgrade_objects_array[i].setLevel(0);
}

// Upgrade delegate event
$all_upgrades.delegate('upgrade', 'click', function(event) {
	var upgrade = this.upgrade;

	if ( upgrade.level >= upgrade.upgrade.levels ) {
		return;
	} else if (
		upgrade.ecost
		&& (!upgrade.erequires || game.upgrade_objects[upgrade.erequires].level)
		&& game.current_exotic_particles >= upgrade.ecost
	) {
		game.current_exotic_particles -= upgrade.ecost;
		ui.say('var', 'current_exotic_particles', game.current_exotic_particles);
		upgrade.setLevel(upgrade.level + 1);
		if ( tooltip_showing ) {
			upgrade.updateTooltip();
		}
	} else if ( upgrade.cost && game.current_money >= upgrade.cost ) {
		game.current_money -= upgrade.cost;
		ui.say('var', 'current_money', game.current_money);
		upgrade.setLevel(upgrade.level + 1);
		if ( tooltip_showing ) {
			upgrade.updateTooltip();
		}
	} else {
		return;
	}

	update_tiles();
});

if ( game.debug ) {
	$all_upgrades.delegate('upgrade', 'mousedown', function(event) {
		if ( event.which === 3 ) {
			var upgrade = this.upgrade;
			event.preventDefault();

			if ( upgrade.level > 0 ) {
				upgrade.setLevel(upgrade.level - 1);
				if ( tooltip_showing ) {
					upgrade.updateTooltip();
				}
				game.current_exotic_particles += upgrade.ecost;
				ui.say('var', 'current_exotic_particles', game.current_exotic_particles);
				update_tiles();
			}
		}
	});
}

var check_upgrades_affordability_timeout;
window.check_upgrades_affordability = function( /* do_timeout */ ) {
	for ( var i = 0, l = game.upgrade_objects_array.length, upgrade; i < l; i++ ) {
		upgrade = game.upgrade_objects_array[i];

		if (
			upgrade.level < upgrade.upgrade.levels
			&& (
				(
					upgrade.cost
					&& game.current_money >= upgrade.cost
				)
				||
				(
					upgrade.ecost
					&& (!upgrade.erequires || game.upgrade_objects[upgrade.erequires].level)
					&& (game.current_exotic_particles > upgrade.ecost)
				)
			)
		) {
			if ( upgrade.affordable === false ) {
				upgrade.setAffordable(true);
			}
		} else if ( upgrade.affordable === true ) {
			upgrade.setAffordable(false);
		}
	}

	/*if ( do_timeout === true ) {
		check_upgrades_affordability_timeout = setTimeout(function() {
			check_upgrades_affordability(true);
		}, 200);
	}*/
};

/* window.start_check_upgrades_affordability = function() {
	check_upgrades_affordability(true);
};

window.stop_check_upgrades_affordability = function() {
	clearTimeout(check_upgrades_affordability_timeout);
}; */

// Select part
var active_replace = /[\b\s]part_active\b/;
var clicked_part = null;

$all_parts.delegate('part', 'click', function(e) {
	if ( clicked_part && clicked_part === this.part ) {
		clicked_part = null;
		this.className = this.className.replace(active_replace, '');
		$main.className = $main.className.replace(active_replace, '');
		part_tooltip_hide();
	} else {
		part_tooltip_show.apply(this, e);

		if ( clicked_part ) {
			clicked_part.$el.className = clicked_part.$el.className.replace(active_replace, '');
			$main.className = $main.className.replace(active_replace, '');
		}

		clicked_part = this.part;
		// TODO: DRY
		this.className += ' part_active';
		$main.className += ' part_active';
	}
});

// Add part to tile
var part_replace = /[\b\s]part_[a-z0-9_]+\b/;
var category_replace = /[\b\s]category_[a-z_]+\b/;
var spent_replace = /[\b\s]spent\b/;
var disabled_replace = /[\b\s]disabled\b/;
var exploding_replace = /[\b\s]exploding\b/;
var tile_mousedown = false;
var tile_mousedown_right = false;
var tile_queue = [];
var qi;
var tile2;

var apply_to_tile = function(tile, part, force) {
	if ( !tile.enabled && !force ) {
		return;
	}

	tile.part = part;
	tile.$el.className = tile.$el.className
		.replace(part_replace, '')
		.replace(category_replace, '')
		.replace(spent_replace, '')
		.replace(disabled_replace, '')
		.replace(exploding_replace, '')
		+ ' ' + part.className
		+ ' category_' + part.category
		;

	if ( part.ticks ) {
		if ( !tile.ticks ) {
			tile.$el.className += ' spent';
		}

		//tile.$percent.style.width = tile.ticks / part.ticks * 100 + '%';
		tile.updated = true;
	}

	if ( !tile.activated ) {
		tile.$el.className += ' disabled';
	}
};

var rpl;
var rpqi;
var remove_part = function(remove_tile, skip_update, sell) {
	skip_update = skip_update || false;
	sell = sell || false;

	if ( sell ) {
		if ( remove_tile.activated && remove_tile.part && remove_tile.part.category !== 'cell' ) {
			if ( remove_tile.part.ticks ) {
				game.current_money += Math.ceil(remove_tile.part.ticks / remove_tile.ticks * remove_tile.part.cost);
				ui.say('var', 'current_money', game.current_money);
			} else if ( remove_tile.part.containment ) {
				game.current_money += remove_tile.part.cost - Math.ceil(remove_tile.heat_contained / remove_tile.part.containment * remove_tile.part.cost);
				ui.say('var', 'current_money', game.current_money);
			} else {
				game.current_money += remove_tile.part.cost;
				ui.say('var', 'current_money', game.current_money);
			}
		}
	}

	remove_tile.part = null;
	remove_tile.setTicks(0);
	remove_tile.setHeat_contained(0);
	//remove_tile.$percent.style.width = 0;
	remove_tile.updated = true;
	remove_tile.$el.className = remove_tile.$el.className
		.replace(part_replace, '')
		.replace(category_replace, '')
		.replace(spent_replace, '')
		.replace(disabled_replace, '')
		;

	if ( !skip_update ) {
		update_tiles();
	}

	rpl = tile_queue.length;
	if ( rpl ) { 
		for ( rpqi = 0; rpqi < rpl; rpqi++ ) {
			tile2 = tile_queue[rpqi];
			if ( !tile2.part ) {
				tile_queue.splice(rpqi, 1);
				rpqi--;
				rpl--;
			}
		}
	}
};

// Check if tile part is replaceable with clicked/selected part
// return values:
//    0 = tile can't be replace with the selected part
//    1 = empty tile, can be safely removed or queued
//    2 = same parts, should check ticks before replacing if needed, ie: check cell empty before replacing
//    3 = different parts but same category, should check amount of money for replacement if needed
var part_replaceable = function(part, tile) {
	if ( clicked_part ){
		if ( !part ) return 1;
		else if ( part === clicked_part ) return 2;
		else if ( part.part.category === clicked_part.part.category) return 3;
	}
	return 0;
}

var tile_replaceable = function(tile) {
	return part_replaceable(tile.part, tile);
}

// Tile click
var mouse_apply_to_tile = function(e, skip_update, part_replacement_result) {
	skip_update = skip_update || false;
	var skip_replaceable_check = part_replacement_result !== undefined;
	tile = this.tile;

	if ( tile_mousedown_right ) {
		remove_part(tile, skip_update, true);
	} else if (
	     clicked_part
	     && (skip_replaceable_check || (part_replacement_result=tile_replaceable(tile)))
	     && (part_replacement_result !== 2 || tile.activated === false || tile.ticks === 0)
	     && (part_replacement_result !== 3 || game.current_money >= clicked_part.cost)
	     ) {
		// Reclaim money when replacing tile
		remove_part(tile, true, true);
		if ( game.current_money < clicked_part.cost ) {
			tile.activated = false;
			tile_queue.push(tile);
		} else {
			tile.activated = true;
			game.current_money -= clicked_part.cost;
			ui.say('var', 'current_money', game.current_money);
		}

		tile.setTicks(clicked_part.ticks);

		apply_to_tile(tile, clicked_part);

		if ( !skip_update ) {
			update_tiles();
		}
	}
};

// Pause (Decoupled)
window.pause = function() {
	clearTimeout(loop_timeout);

	game.paused = true;
	ui.say('evt', 'paused');
};

// Unpause (Decoupled)
window.unpause = function() {
	clearTimeout(loop_timeout);
	loop_timeout = setTimeout(game_loop, game.loop_wait);

	game.paused = false;
	ui.say('evt', 'unpaused');
};

// Enable/Disable auto sell (Decoupled)
window.disable_auto_sell = function() {
	game.auto_sell_disabled = true;
	ui.say('evt', 'auto_sell_disabled');
};

window.enable_auto_sell = function() {
	game.auto_sell_disabled = false;
	ui.say('evt', 'auto_sell_enabled');
};

// Enable/Disable auto buy
window.disable_auto_buy = function() {
	game.auto_buy_disabled = true;
	ui.say('evt', 'auto_buy_disabled');
};

window.enable_auto_buy = function() {
	game.auto_buy_disabled = false;
	ui.say('evt', 'auto_buy_enabled');
};

// Enable/Disable heat control operator
window.disable_heat_control = function() {
	game.heat_controlled = false;
	ui.say('evt', 'heat_control_disabled');
};

window.enable_heat_control = function() {
	game.heat_controlled = true;
	ui.say('evt', 'heat_control_enabled');
};

/////////////////////////////
// Tile clicks
/////////////////////////////

var tile_mouseup_fn = function(e) {
	tile_mousedown = false;
	tile_mousedown_right = false;
};

document.oncontextmenu = function(e) {
	if ( tile_mousedown_right ) {
		e.preventDefault();
	}
};

$reactor.delegate('tile', 'click', function(e) {
	if ( !tile_mousedown ) {
		mouse_apply_to_tile.call(this, e);
	}
});

var hotkeys = window.hotkeys;
window.hotkeys = null;

hotkeys.init(game);
game.hotkeys = hotkeys;

var last_click = null;
var double_click_tile = null;
var double_click_tile_part = null;
var double_click_tile_ticks = null;
var clear_double_click_task = null;
var clear_double_click = function() {
	double_click_tile = null;
	double_click_tile_part = null;
};

var part_replacement_result;
var tiles;

var click_func = function(e) {
	part_replacement_result = undefined;

	if ( e.shiftKey && e.ctrlKey && e.altKey ) {
		return hotkeys.checker(this.tile);
	} else if ( e.shiftKey && e.ctrlKey ) {
		return hotkeys.shift_row(this.tile);
	} else if ( e.shiftKey && e.altKey ) {
		return hotkeys.shift_column(this.tile);
	} else if ( e.ctrlKey ) {
		return hotkeys.row(this.tile);
	} else if ( e.altKey ) {
		return hotkeys.column(this.tile);
	} else if ( e.shiftKey || ( double_click_tile && last_click === e.which && double_click_tile === this.tile ) ) {
		if ( e.shiftKey ){
			var part = this.tile.part;
			var ticks = this.tile.ticks;
		} else {
			// Use the stored (last) tile for comparing
			var part = double_click_tile_part;
			var ticks = double_click_tile_ticks;
		}

		if ( tile_mousedown_right && part ) {
			return hotkeys.remover.call(this, part, ticks);

		} else if ( !tile_mousedown_right ) {
			part_replacement_result = part_replaceable(part);
			return hotkeys.replacer.call(this, part);
		}

	}
};

$reactor.delegate('tile', 'mousedown', function(e) {
	tile_mousedown = true;
	tile_mousedown_right = e.which === 3;

	if ( tiles = click_func.call(this, e) ) {
		for ( const tile of tiles ) {
			mouse_apply_to_tile.call(tile.$el, e, true, part_replacement_result);
		}
		update_tiles();
	} else {
		// Store tile part for finding matching tiles in double click
		double_click_tile_part = this.tile.part;
		double_click_tile_ticks = this.tile.ticks;
		mouse_apply_to_tile.call(this, e);
		double_click_tile = this.tile;
	}

	last_click = e.which;

	if (clear_double_click_task){
		clearTimeout(clear_double_click_task)
	}
	clear_double_click_task = setTimeout(clear_double_click, 300);
});

$reactor.onmouseup = tile_mouseup_fn;
$reactor.onmouseleave = tile_mouseup_fn;

$reactor.delegate('tile', 'mousemove', function(e) {
	if ( tile_mousedown && double_click_tile != this.tile ) {
		if ( tiles = click_func.call(this, e) ) {
			for ( const tile of tiles ) {
				mouse_apply_to_tile.call(tile.$el, e, true, part_replacement_result);
			}
			update_tiles();
		} else {
			mouse_apply_to_tile.call(this, e);
		}
	}
});

// Sell (Decoupled)
window.sell = function() {
	if ( current_power ) {
		game.current_money += current_power;
		current_power = 0;

		ui.say('var', 'current_money', game.current_money);
		ui.say('var', 'current_power', current_power);

		game.sold_power = true;
	}
};

/////////////////////////////
// Scrounge
/////////////////////////////

/* var $scrounge = $('#scrounge');

$scrounge.onclick = function() {
	if ( current_money < 10 && current_power === 0 ) {
		current_money += 1;

		ui.say('var', 'current_money', current_money);
	}
}; */

/////////////////////////////
// Game Loop
/////////////////////////////

var loop_timeout;
var do_update;
var reduce_heat;
var shared_heat;
var max_shared_heat;
var sell_amount;
var power_add;
var heat_add;
var heat_remove;
var meltdown;
var melting_down;
var was_melting_down = false;
var transfer_heat;
var ep_chance;
var lower_heat;
var power_sell_percent;
var heat_add_next_loop = 0;
var vent_reduce;
var max_heat_transfer;

var tile_percent;
var tile_containment_percent;
var total_containment;
var tile_containment_containment;
var total_containment_heat;
var target_percent;

var ep_chance_percent;
var ep_gain;

var start_game_loop;
var start_game_loop;
var game_loop = function() {
	power_add = 0;
	heat_add = 0;
	heat_remove = 0;
	meltdown = false;
	do_update = false;
	melting_down = false;

	if ( heat_add_next_loop > 0 ) {
		heat_add = heat_add_next_loop;
		heat_add_next_loop = 0;
	}

	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			if ( tile.activated && tile.part ) {
				if ( tile.part.category === 'cell' ) {
					if ( tile.ticks !== 0 ) {
						power_add += tile.power;
						heat_add += tile.heat;
						tile.setTicks(tile.ticks - 1);

						l = tile.reflectors.length;

						if ( l ) {
							for ( i = 0; i < l; i++ ) {
								tile_reflector = tile.reflectors[i];
								tile_reflector.setTicks(tile_reflector.ticks - 1);

								// TODO: dedupe this and cell ticks
								if ( tile_reflector.ticks === 0 ) {
									if ( game.auto_buy_disabled !== true && tile_reflector.part.perpetual && game.current_money >= tile_reflector.part.cost ) {
										// auto replenish reflector
										game.current_money -= tile_reflector.part.cost;
										ui.say('var', 'current_money', game.current_money);
										tile_reflector.setTicks(tile_reflector.part.ticks);
										//tile_reflector.$percent.style.width = '100%';
									} else {
										tile_reflector.$el.className += ' exploding';
										remove_part(tile_reflector, true);
									}
								} else if ( tile_reflector.part ) {
									//tile_reflector.$percent.style.width = tile_reflector.ticks / tile_reflector.part.ticks * 100 + '%';
								}
							}
						}

						if ( tile.ticks === 0 ) {
							if ( game.auto_buy_disabled !== true && tile.part.perpetual && game.current_money >= tile.part.cost * 1.5 ) {
								// auto replenish cell
								game.current_money -= tile.part.cost * 1.5;
								ui.say('var', 'current_money', game.current_money);
								tile.setTicks(tile.part.ticks);
								//tile.$percent.style.width = '100%';
								tile.updated = true;
							} else {
								if ( tile.part.part.type === 'protium' ) {
									protium_particles += tile.part.cell_count;
									game.update_cell_power();
								}

								//tile.$percent.style.width = '0';
								tile.updated = true;
								tile.$el.className += ' spent';
								do_update = true;
							}
						} else {
							//tile.$percent.style.width = tile.ticks / tile.part.ticks * 100 + '%';
							tile.updated = true;
						}
					}
				}

				// TODO: Find a better place/logic for this?
				// Add heat to containment part
				if ( tile.activated && tile.part && tile.part.containment ) {
					if ( tile.part.id === 'coolant_cell6' ) {
						tile.setHeat_contained(tile.heat_contained + (tile.heat / 2));
						power_add += tile.heat / 2;
					} else {
						tile.setHeat_contained(tile.heat_contained + tile.heat);
					}
				}

				if ( tile.activated && tile.part && tile.part.category === 'particle_accelerator' ) {
					if ( tile.heat_contained ) {
						// Which more, tile heat or max heat, get the lesser
						lower_heat = tile.heat_contained > tile.part.ep_heat ? tile.part.ep_heat : tile.heat_contained;
						ep_chance_percent = lower_heat / tile.part.part.base_ep_heat;
						ep_chance = Math.log(lower_heat) / Math.pow(10, 5 - tile.part.part.level) * ep_chance_percent;
						ep_gain = 0;
						tile.display_chance = ep_chance * 100;
						tile.display_chance_percent_of_total = lower_heat / tile.part.ep_heat * 100;

						if ( ep_chance > 1 ) {
							ep_gain = Math.floor(ep_chance);
							ep_chance -= ep_gain;
						}

						if ( ep_chance > Math.random() ) {
							ep_gain++;
						}

						if ( ep_gain > 0 ) {
							game.exotic_particles += ep_gain;
							ui.say('var', 'exotic_particles', game.exotic_particles);
						}
					}
				}

			}
		}
	}

	// Inlets
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			tile_part = tile.part;
			l = tile.containments.length;

			if ( tile.activated && tile_part && tile_part.transfer && tile_part.category === 'heat_inlet' && l > 0 ) {
				// Figure out the maximum amount the part can transfer
				if ( transfer_multiplier ) {
					max_heat_transfer = tile_part.transfer * (1 + transfer_multiplier / 100);
				} else {
					max_heat_transfer = tile_part.transfer;
				}

				for ( pi = 0; pi < l; pi++ ) {
					tile_containment = tile.containments[pi];
					transfer_heat = max_heat_transfer;

					if ( tile_containment.heat_contained < max_heat_transfer ) {
						transfer_heat = tile_containment.heat_contained;
					}

					tile_containment.setHeat_contained(tile_containment.heat_contained - transfer_heat);
					heat_add += transfer_heat;
				}
			}
		}
	}

	game.current_heat += heat_add;

	ui.say('var', 'heat_add', heat_add);

	// Reduce reactor heat parts
	if ( game.heat_controlled ) {
		if (game.current_heat > max_heat) {
			max_shared_heat = (game.current_heat - max_heat) / stat_outlet;
		} else {
			// Don't remove any heat when not in danger of overheating
			max_shared_heat = 0;
		}
	} else {
		max_shared_heat = game.current_heat / stat_outlet;
	}

	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			tile_part = tile.part;

			if ( tile.activated && tile_part && tile_part.transfer && tile.containments && tile_part.category !== 'heat_inlet' ) {
				l = tile.containments.length;

				// Figure out the maximum amount the part can transfer
				if ( transfer_multiplier ) {
					max_heat_transfer = tile_part.transfer * (1 + transfer_multiplier / 100);
				} else {
					max_heat_transfer = tile_part.transfer;
				}

				// This algo seems pretty sketchy ;p
				if ( tile_part.category === 'heat_exchanger' ) {
					total_containment = tile.part.containment;
					total_containment_heat = tile.heat_contained;

					// Figure out total heat and containment
					for ( pi = 0; pi < l; pi++ ) {
						tile_containment = tile.containments[pi];

						// Lie about coolant_cell6's max containment since half will be converted to power
						if ( tile_containment.part.id === 'coolant_cell6' ) {
							total_containment += (tile_containment.part.containment - tile_containment.heat_contained) * 2;
						// Lie about vent's max containment vented heat goes away
						} else if ( tile_containment.part.part.category === 'vent' ) {
							total_containment += tile_containment.part.containment + tile_containment.part.vent;
						} else {
							total_containment += tile_containment.part.containment;
						}

						total_containment_heat += tile_containment.heat_contained;
					}

					target_percent = total_containment_heat / total_containment;

					// First try to remove heat
					for ( pi = 0; pi < l; pi++ ) {
						tile_containment = tile.containments[pi];

						// Lie about coolant_cell6's max containment since half will be converted to power
						if ( tile_containment.part.id === 'coolant_cell6' ) {
							tile_containment_containment = (tile_containment.part.containment - tile_containment.heat_contained) * 2;
						// Lie about vent's max containment vented heat goes away
						} else if ( tile_containment.part.part.category === 'vent' ) {
							tile_containment_containment = tile_containment.part.containment + tile_containment.part.vent;
						} else {
							tile_containment_containment = tile_containment.part.containment;
						}

						tile_containment_percent = tile_containment.heat_contained / tile_containment_containment;

						if ( tile_containment_percent > target_percent ) {
							transfer_heat = (tile_containment_percent - target_percent) * total_containment_heat;

							if ( transfer_heat > max_heat_transfer ) {
								transfer_heat = max_heat_transfer;
							}

							if ( transfer_heat >  tile_containment.heat_contained ) {
								transfer_heat =  tile_containment.heat_contained;
							}

							// TODO: skip if vents can handle the heat
							if ( transfer_heat >= 1 ) {
								tile_containment.setHeat_contained(tile_containment.heat_contained - transfer_heat);
								tile.setHeat_contained(tile.heat_contained + transfer_heat);
							}
						}
					}

					// Then try to add heat
					for ( pi = 0; pi < l; pi++ ) {
						tile_percent = tile.heat_contained / tile.part.containment;
						transfer_heat = 0;

						tile_containment = tile.containments[pi];

						// Lie about coolant_cell6's max containment since half will be converted to power
						if ( tile_containment.part.id === 'coolant_cell6' ) {
							tile_containment_containment = (tile_containment.part.containment - tile_containment.heat_contained) * 2;
						// Lie about vent's max containment vented heat goes away
						} else if ( tile_containment.part.part.category === 'vent' ) {
							tile_containment_containment = tile_containment.part.containment + tile_containment.part.vent;
						} else {
							tile_containment_containment = tile_containment.part.containment;
						}

						tile_containment_percent = tile_containment.heat_contained / tile_containment_containment;

						if ( tile_containment_percent < target_percent ) {
							transfer_heat = (target_percent - tile_containment_percent) * tile_containment_containment;
						} else if ( tile_containment_percent < tile_percent ) {
							transfer_heat = (tile_percent - tile_containment_percent) * tile_containment_containment;
						}

						// Not sure if the lies above are useful with this
						if ( tile_containment.part.part.category === 'vent' && transfer_heat < tile_containment.part.vent - tile_containment.heat_contained ) {
							transfer_heat = tile_containment.part.vent - tile_containment.heat_contained;
						}

						if ( transfer_heat > max_heat_transfer ) {
							transfer_heat = max_heat_transfer;
						}

						if ( transfer_heat > tile.heat_contained ) {
							transfer_heat = tile.heat_contained;
						}

						if ( transfer_heat >= 1 ) {
							if ( tile_containment.part.id === 'coolant_cell6' ) {
								tile_containment.setHeat_contained(tile_containment.heat_contained + (transfer_heat / 2));
								power_add += transfer_heat / 2;
							} else {
								tile_containment.setHeat_contained(tile_containment.heat_contained + transfer_heat);
							}

							tile.setHeat_contained(tile.heat_contained - transfer_heat);
						}
					}
				} else if ( tile_part.category === 'heat_outlet' ) {
					shared_heat = max_heat_transfer;

					// Distribute evenly
					if ( game.current_heat < max_heat_transfer * tile.containments.length ) {
						shared_heat = game.current_heat / stat_outlet * tile_part.transfer;
					}

					// If the heat in the reactor is less than transfer
					if ( shared_heat > max_shared_heat * tile_part.transfer ) {
						shared_heat = max_shared_heat * tile_part.transfer;
					}

					for ( pi = 0; pi < l; pi++ ) {
						tile_containment = tile.containments[pi];

						if ( tile_containment.part.id === 'coolant_cell6' ) {
							tile_containment.setHeat_contained(tile_containment.heat_contained + (shared_heat / 2));
							power_add += shared_heat / 2;
						} else {
							if ( game.heat_outlet_controlled && tile_containment.vent ) {
								shared_heat = Math.min(shared_heat, tile_containment.vent-tile_containment.heat_contained)
							}
							tile_containment.setHeat_contained(tile_containment.heat_contained + shared_heat);
						}

						heat_remove += shared_heat;
					}
				}
			}
		}
	}

	game.current_heat -= heat_remove;

	// Auto heat reduction
	if ( game.current_heat > 0 ) {
		// TODO: Set these variables up in update tiles
		if ( game.current_heat <= max_heat ) {
			// Heat Control Operator should not interfere with passive heat loss
			reduce_heat = max_heat / 10000;
		} else {
			reduce_heat = (game.current_heat - max_heat) / 20;
			if ( reduce_heat < max_heat / 10000 ) {
				reduce_heat = max_heat / 10000;
			}

			for ( ri = 0; ri < game.rows; ri++ ) {
				row = game.tiles[ri];
				for ( ci = 0; ci < game.cols; ci++ ) {
					tile = row[ci];

					if ( tile.activated && tile.part && tile.part.containment ) {

						if ( tile.part.id === 'coolant_cell6' ) {
							tile.setHeat_contained(tile.heat_contained + (reduce_heat / game.tiles.length / 2));
							power_add += reduce_heat / game.tiles.length / 2;
						} else {
							tile.setHeat_contained(tile.heat_contained + (reduce_heat / game.tiles.length));
						}
					}
				}
			}
		}

		ui.say('var', 'auto_heat_reduce', reduce_heat);
		game.current_heat -= reduce_heat;
	}

	// Forceful Fusion
	if ( game.heat_power_multiplier && game.current_heat > 1000 ) {
		power_add *= 1 + (game.heat_power_multiplier * (Math.log(game.current_heat) / Math.log(1000) / 100));
	}

	// Add power
	current_power += power_add;

	ui.say('var', 'power_add', power_add);

	// Try to place parts in the queue
	if ( tile_queue.length ) {
		tile = tile_queue[0];

		if ( !tile.part || tile.activated ) {
			tile_queue.splice(0, 1);
		} else if ( tile.part && game.current_money >= tile.part.cost ) {
			game.current_money -= tile.part.cost;
			ui.say('var', 'current_money', game.current_money);
			tile.activated = true;
			tile.$el.className = tile.$el.className.replace(disabled_replace, '');
			tile_queue.splice(0, 1);
			do_update = true;
		}
	}

	// Apply heat to containment parts
	for ( ri = 0; ri < game.rows; ri++ ) {
		row = game.tiles[ri];

		for ( ci = 0; ci < game.cols; ci++ ) {
			tile = row[ci];
			if ( tile.activated && tile.part && tile.part.containment ) {
				if ( tile.part.vent ) {

					if ( vent_multiplier ) {
						vent_reduce = tile.part.vent * (1 + vent_multiplier / 100);
					} else {
						vent_reduce = tile.part.vent;
					}

					if ( vent_reduce > tile.heat_contained ) {
						vent_reduce = tile.heat_contained;
					}

					if ( tile.part.id === 'vent6' ) {
						if ( current_power < vent_reduce ) {
							vent_reduce = current_power;
						}

						current_power -= vent_reduce;
					}

					tile.setHeat_contained(tile.heat_contained - vent_reduce);

					if ( tile.heat_contained < 0 ) {
						tile.setHeat_contained(0);
					}
				}

				if ( tile.heat_contained > tile.part.containment ) {
					if ( game.auto_buy_disabled !== true && tile.heat <= 0 && tile.part.category === 'capacitor' && game.upgrade_objects['perpetual_capacitors'].level > 0 && game.current_money >= tile.part.cost * 10 ) {
						game.current_money -= tile.part.cost * 10;
						heat_add_next_loop += tile.heat_contained;
						tile.setHeat_contained(0);
					} else {
						tile.$el.className += ' exploding';
						if ( tile.part.category === 'particle_accelerator' ) {
							meltdown = true;
						}

						do_update = true;
						remove_part(tile, true);
					}
				}

				if ( tile.part ) {
					//tile.$percent.style.width = tile.heat_contained / tile.part.containment * 100 + '%';
					tile.updated = true;
				}
			}
		}
	}

	// Auto Sell
	if ( !game.auto_sell_disabled ) {
		sell_amount = Math.ceil(max_power * game.auto_sell_multiplier);
		if ( sell_amount ) {
			if ( sell_amount > current_power ) {
				power_sell_percent = current_power / sell_amount;
				sell_amount = current_power;
			} else {
				power_sell_percent = 1;
			}

			current_power -= sell_amount;
			game.current_money += sell_amount;
			ui.say('var', 'money_add', sell_amount);
			ui.say('var', 'current_money', game.current_money);

			// Extreme capacitors frying themselves
			for ( ri = 0; ri < game.rows; ri++ ) {
				row = game.tiles[ri];

				for ( ci = 0; ci < game.cols; ci++ ) {
					tile = row[ci];

					if ( tile.activated && tile.part && tile.part.id === 'capacitor6' ) {
						tile.setHeat_contained(tile.heat_contained + (sell_amount * game.auto_sell_multiplier * power_sell_percent * .5));
					}
				}
			}
		}
	}

	if ( current_power > max_power ) {
		current_power = max_power;
	}

	if ( game.current_heat < 0 ) {
		game.current_heat = 0;
	}

	if ( meltdown ) {
		game.current_heat = max_heat * 2 + 1;
	}

	if ( meltdown || game.current_heat > max_heat * 2 ) {
		melting_down = true;
		game.has_melted_down = true;
		$reactor.style.backgroundColor = 'rgb(255, 0, 0)';

		for ( ri = 0; ri < game.rows; ri++ ) {
			row = game.tiles[ri];

			for ( ci = 0; ci < game.cols; ci++ ) {
				tile = row[ci];

				if ( tile.part ) {
					do_update = true;
					tile.$el.className += ' exploding';
					remove_part(tile, true);
				}
			}
		}
	}

	if ( do_update ) {
		update_tiles();
	}

	update_heat_and_power();

	if ( tooltip_update !== null ) {
		tooltip_update();
	}

	if ( !was_melting_down && melting_down ) {
		save();
		ui.say('var', 'melting_down', true);
	} else if ( was_melting_down && !melting_down ) {
		ui.say('var', 'melting_down', false);
	}

	if ( melting_down ) {
		was_melting_down = true;
	} else {
		was_melting_down = false;
	}

	if ( start_game_loop ) {
		ui.say('var', 'game_loop_speed', performance.now() - start_game_loop);
	}
	start_game_loop = performance.now();

	if ( !game.paused ) {
		clearTimeout(loop_timeout);
		loop_timeout = setTimeout(game_loop, game.loop_wait);
	}
};

var prev_part;
// affordability loop
window.check_affordability = function() {
	prev_part = null;

	for ( i = 0, l = game.part_objects_array.length; i < l; i++ ) {
		part = game.part_objects_array[i];

		if (
			part.affordable === true
			&&
				(
					part.cost > game.current_money
					|| (part.erequires && !game.upgrade_objects[part.erequires].level)
				)
		) {
			part.setAffordable(false);
		} else if ( !part.affordable ) {
			if ( 
				part.cost <= game.current_money
				&& (!part.erequires || game.upgrade_objects[part.erequires].level)
			) {
				part.setAffordable(true);
			} else if ( prev_part && prev_part.affordable ) {
				part.$el.className = part.$el.className.replace(locked_find, '');
			}
		}
	}
};

/////////////////////////////
// Objectives
/////////////////////////////

var objectives = window.objectives(game);
var current_objective = 0;
var objective_unloading = false;
var objective;
var objective_interval = 2000;
var objective_wait = 3000;
var objective_timeout;

var check_objectives = function() {
	if ( !game.paused && objective && objective.check() ) {
		current_objective++;
		if ( objective.reward ) {
			game.current_money += objective.reward;
			ui.say('var', 'current_money', game.current_money);
		} else if ( objective.ep_reward ) {
			game.exotic_particles += objective.ep_reward;
			ui.say('var', 'exotic_particles', game.exotic_particles);
		}

		set_objective(current_objective);
	} else {
		clearTimeout(objective_timeout);
		objective_timeout = setTimeout(check_objectives, objective_interval);
	}
};

var set_objective = function(objective_key, skip_wait) {
	skip_wait = skip_wait || false;
	var wait = skip_wait ? 0 : objective_wait;

	if ( objectives[current_objective] ) {
		objective_unloading = true;
		ui.say('evt', 'objective_unloaded');

		clearTimeout(objective_timeout);
		objective_timeout = setTimeout(function() {
			objective = objectives[current_objective];
			ui.say('evt', 'objective_loaded', objective);
			if ( objective.start ) {
				objective.start();
			}

			clearTimeout(objective_timeout);
			objective_timeout = setTimeout(check_objectives, objective_interval);
		}, wait);
	}
};

/////////////////////////////
// Load
/////////////////////////////

var update_heat_and_power = function() {
	ui.say('var', 'current_heat', game.current_heat);
	ui.say('var', 'current_power', current_power);
};

var update_nodes = function() {
	ui.say('var', 'current_heat', game.current_heat);
	ui.say('var', 'current_power', current_power);
	ui.say('var', 'current_money', game.current_money);
	ui.say('var', 'exotic_particles', game.exotic_particles);
	ui.say('var', 'current_exotic_particles', game.current_exotic_particles);
};

// Do stuff

if ( localStorage.getItem('google_drive_save') ) {
	save_game = google_saver;
	$enable_google_drive_save.style.display = 'none';
} else {
	$enable_local_save.style.display = 'none';
}

save_game.enable();

save_game.load(game.loads);

})();
