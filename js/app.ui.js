;(function($, undefined) {
//'use strict';

function stacktrace() { 
    var err = new Error();
    return err.stack;
}

var UI = function() {
	this.game;

	this.init = function(game) {
		this.game = game;
	}
};

var ui = new UI();
window.ui = ui;

// DOM nodes
var $main = $('#main');
var $all_upgrades = $('#all_upgrades');
var $reactor = $('#reactor');
var $all_parts = $('#all_parts');
var $reactor_section = $('#reactor_section');
var $refund_exotic_particles = $('#refund_exotic_particles');
var $reboot_exotic_particles = $('#reboot_exotic_particles');
var $manual_heat_reduce = $('#manual_heat_reduce');
var $auto_heat_reduce = $('#auto_heat_reduce');
var $power_percentage = $('#power_percentage');
var $heat_percentage = $('#heat_percentage');
var $parts = $('#parts');
var $primary = $('#primary');

// Mark ios since it's an idiot with mouseover events

var is_touch = false;
var is_ios = navigator.userAgent.match(/(iPod|iPhone|iPad)/) ? true : false;

// Only mark as a touch device when the first touch happens

window.addEventListener('touchstart', function setHasTouch () {
	is_touch = true;
	$main.addClass('touch');
	// Remove event listener once fired, otherwise it'll kill scrolling
	// performance
	window.removeEventListener('touchstart', setHasTouch);

	$reactor.undelegate('.tile', 'focus', tile_tooltip_show);
	$reactor.undelegate('.tile', 'blur', tile_tooltip_hide);

	$all_parts.undelegate('.part', 'focus', part_tooltip_show);
	$all_parts.undelegate('.part', 'blur', part_tooltip_hide);
}, false);

// Elements

var rows = [];
var current_vars = {};
var update_vars = {};

var perc = function(numerator, denominator, $dom) {
	var percent = current_vars[numerator] / current_vars[denominator] * 100;
	if ( percent > 100 ) percent = 100;
	$dom[0].style.width = percent + '%';
};

var var_objs = {
	manual_heat_reduce: {
		onupdate: function() {
			$manual_heat_reduce[0].innerHTML = '-' + fmt(current_vars.manual_heat_reduce);
		}
	},
	auto_heat_reduce: {
		onupdate: function() {
			$auto_heat_reduce[0].innerHTML = '-' + fmt(current_vars.auto_heat_reduce);
		}
	},
	// TODO: Bad naming
	current_money: {
		$dom: $('#money'),
		num: true
	},
	current_power: {
		$dom: $('#current_power'),
		num: true,
		instant: true,
		onupdate: function() {
			perc('current_power', 'max_power', $power_percentage);
		}
	},
	max_power: {
		$dom: $('#max_power'),
		num: true,
		// TODO: DRY?
		onupdate: function() {
			perc('current_power', 'max_power', $power_percentage);
		}
	},
	// TODO: Bad naming
	total_power: {
		$dom: $('#stats_power'),
		num: true
	},
	current_heat: {
		$dom: $('#current_heat'),
		num: true,
		onupdate: function() {
			perc('current_heat', 'max_heat', $heat_percentage);

			var current_heat = current_vars.current_heat;
			var max_heat = current_vars.max_heat;

			if ( current_heat <= max_heat ) {
				$reactor[0].style.backgroundColor = 'transparent';
			} else if ( current_heat > max_heat && current_heat <= max_heat * 2 ) {
				$reactor[0].style.backgroundColor = 'rgba(255, 0, 0, ' + ((current_heat - max_heat) / max_heat) + ')';
			} else {
				$reactor[0].style.backgroundColor = 'rgb(255, 0, 0)';
			}
		}
	},
	total_heat: {
		$dom: $('#stats_heat'),
		num: true
	},
	max_heat: {
		$dom: $('#max_heat'),
		num: true,
		onupdate: function() {
			perc('current_heat', 'max_heat', $heat_percentage);
			$auto_heat_reduce[0].innerHTML = '-' + (fmt(current_vars.max_heat/10000));
		}
	},
	exotic_particles: {
		$dom: $('#exotic_particles'),
		num: true,
		// TODO: Have more than one $dom?
		onupdate: function() {
			var exotic_particles = current_vars.exotic_particles;
			$reboot_exotic_particles[0].innerHTML = fmt(exotic_particles);
		}
	},
	current_exotic_particles: {
		$dom: $('#current_exotic_particles'),
		num: true,
		onupdate: function() {
			var total_exotic_particles = current_vars.total_exotic_particles;
			var current_exotic_particles = current_vars.current_exotic_particles;
			$refund_exotic_particles[0].innerHTML = fmt(total_exotic_particles - current_exotic_particles);
		}
	},

	stats_cash: {
		$dom: $('#stats_cash'),
		num: true,
		places: 2
	},
	stats_outlet: {
		$dom: $('#stats_outlet'),
		num: true,
		places: 2
	},
	stats_inlet: {
		$dom: $('#stats_inlet'),
		num: true,
		places: 2
	},
	stats_vent: {
		$dom: $('#stats_vent'),
		num: true,
		places: 2
	},
	stats_heat: {
		$dom: $('#stats_heat'),
		num: true,
		places: 2
	},

	money_add: {
		$dom: $('#money_per_tick'),
		num: true
	},
	power_add: {
		$dom: $('#power_per_tick'),
		num: true
	},
	heat_add: {
		$dom: $('#heat_per_tick'),
		num: true
	}
};

// Update formatted numbers
var update_var = function(key, obj) {
	var value = update_vars[key];

	if ( obj.$dom ) {
		if ( obj.num ) {
			obj.$dom.html(fmt(value, obj.places || null));
		} else {
			obj.$dom.html(value);
		}
	}

	if ( obj.onupdate ) {
		obj.onupdate();
	}

	delete(update_vars[key]);
};

var update_vars = function() {
	var perc;

	for ( var key in update_vars ) {
		// skip loop if the property is from prototype
		if ( !update_vars.hasOwnProperty(key) ) continue;

		var obj = var_objs[key];
		if ( !obj ) continue;

		update_var(key, obj);
	}
};

// Update Interface
var update_interface_interval = 100;
var unaffordable_class = 'unaffordable';
var locked_class = 'locked';
var do_check_upgrades_affordability = false;
var update_interface = function() {
	var start_ui_loop = performance.now();
	update_vars();
	setTimeout(update_interface, update_interface_interval);

	for ( var ri = 0, row, ci, tile; ri < ui.game.max_rows; ri++ ) {
		row = ui.game.tiles[ri];

		for ( ci = 0; ci < ui.game.max_cols; ci++ ) {
			tile = row[ci];
			if ( tile.ticksUpdated ) {
				if ( tile.part ) {
					tile.$percent[0].style.width = tile.ticks / tile.part.ticks * 100 + '%';
				} else {
					tile.$percent[0].style.width = '0';
				}

				tile.ticksUpdated = false;
			}

			if ( tile.heat_containedUpdated ) {
				if ( tile.part && tile.part.containment ) {
					tile.$percent[0].style.width = tile.heat_contained / tile.part.containment * 100 + '%';
				} else {
					tile.$percent[0].style.width = '0';
				}

				tile.heat_containedUpdated = false;
			}
		}
	}

	if ( do_check_upgrades_affordability === true ) {
		window.check_upgrades_affordability();
		for ( var i = 0, l = ui.game.upgrade_objects_array.length, upgrade; i < l; i++ ) {
			upgrade = ui.game.upgrade_objects_array[i];

			if ( upgrade.affordableUpdated === true ) {
				if ( upgrade.affordable === true ) {
					upgrade.$el.removeClass(unaffordable_class);
				} else {
					upgrade.$el.addClass(unaffordable_class);
				}

				upgrade.affordableUpdated = false;
			}
		}
	}

	window.check_affordability();

	for ( var i = 0, l = ui.game.part_objects_array.length, part; i < l; i++ ) {
		part = ui.game.part_objects_array[i];

		if ( part.affordableUpdated === true ) {
			if ( part.affordable === true ) {
				part.$el.removeClass(unaffordable_class);;
			} else {
				part.$el.addClass(unaffordable_class);
			}

			part.affordableUpdated = false;
		}
	}

	//console.log(performance.now() - start_ui_loop);
};

setTimeout(update_interface, update_interface_interval);

  /////////////////////////////
 // Listen to app events
/////////////////////////////

var evts = {};

ui.say = function(type, name, val) {
	if ( type === 'var' ) {
		if ( val === current_vars[name] ) return;
		current_vars[name] = val;
		update_vars[name] = val;

		if ( var_objs[name] && var_objs[name].instant === true ) {
			update_var(name, var_objs[name]);
		}

		if ( name === 'game_loop_speed' ) {
			//console.log(arguments);
			//update_interface_interval = val * 1;
		}
	} else if ( type === 'evt' ) {
		if ( evts[name] ) {
			evts[name](val);
		}
	} else {
	}

	//console.log(arguments);
};

  /////////////////////////////
 // Events
/////////////////////////////

evts.part_unlocked = function(part) {
	part.$el.removeClass(locked_class);
};

evts.meltdown = function() {
	$reactor.css('background-color', 'rgb(255, 0, 0)');
};

var debug_class = 'debug';
var debug = false;
evts.debugging = function() {
	$main.addClass(debug_class);
	debug = true;
};

evts.row_added = function() {
	var row = {
		$dom: $('<div class="row">'),
		tiles: []
	};

	rows.push(row);

	$reactor.append(row.$dom);
};

evts.tile_added = function(val) {
	var row = rows[val.row];
	var tile = val.tile;

	tile.$el = $('<button class="tile">');
	tile.$el.data('tile', tile);

	var $percent_wrapper_wrapper = $('<div class="percent_wrapper_wrapper">');
	var $percent_wrapper = $('<div class="percent_wrapper">');
	tile.$percent = $('<p class="percent">');

	$percent_wrapper_wrapper.append($percent_wrapper);
	$percent_wrapper.append(tile.$percent);
	tile.$el.append($percent_wrapper_wrapper);

	row.$dom.append(tile.$el);
	row.tiles.push(tile);
};

evts.enable_tile = function(tile) {
	tile.$el.removeClass(disabled_class);
};

var spent_class = 'spent';
evts.tile_spent = function(tile) {
	tile.$el.addClass(spent_class);
};

var exploding_class = 'exploding';
evts.tile_exploded = function(tile) {
	tile.$el.addClass(exploding_class);
};

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

evts.upgrade_added = function(upgrade) {
	var u = upgrade.upgrade;
	upgrade.$el = $('<button class="upgrade">');
	upgrade.$el.attr('id', u.id);
	upgrade.$el.data('upgrade', upgrade);

	var $image = $('<div class="image">');
	$image.html('Click to Upgrade');

	upgrade.$levels = $('<span class="levels">');

	$image.append(upgrade.$levels);

	upgrade.$el.append($image);

	upgrade.$el.data('upgrade', upgrade);

	if ( u.className ) {
		upgrade.$el.addClass(u.className);
	}

	upgrade_locations[u.type].append(upgrade.$el);
};

var part_class = 'part';
var category_class = 'category';
var spent_class = 'spent';
var disabled_class = 'disabled';
var exploding_class = 'exploding';

evts.apply_to_tile = function(val) {
	var tile = val.tile;
	var part = val.part;

	tile.$el
		.removeClass(part_class)
		.removeClass(category_class)
		.removeClass(spent_class)
		.removeClass(disabled_class)
		.removeClass(exploding_class)
		.addClass(part.className)
		.addClass('category_' + part.category)
		;

	if ( part.ticks ) {
		if ( !tile.ticks ) {
			tile.$el.addClass(spent_class);
		}
	}

	if ( !tile.activated ) {
		tile.$el.addClass(disabled_class);
	}
};

var part_replace = /[\b\s]part_[a-z0-9_]+\b/;
var category_replace = /[\b\s]category_[a-z_]+\b/;

evts.remove_part = function(remove_tile) {
	if ( tooltip_tile && tooltip_tile.part && tooltip_tile.part == remove_tile.part ) {
		tile_tooltip_hide();
	}

	remove_tile.$el
		.removeClass(spent_class)
		.removeClass(disabled_class)
		;

	remove_tile.$el[0].className = remove_tile.$el[0].className
		.replace(part_replace, '')
		.replace(category_replace, '')
		;
};

var $cells = $('#cells');
var $reflectors = $('#reflectors');
var $capacitors = $('#capacitors');
var $vents = $('#vents');
var $heat_exchangers = $('#heat_exchangers');
var $heat_inlets = $('#heat_inlets');
var $heat_outlets = $('#heat_outlets');
var $coolant_cells = $('#coolant_cells');
var $reactor_platings = $('#reactor_platings');
var $particle_accelerators = $('#particle_accelerators');

evts.part_added = function(val) {
	var part_obj = val;
	var part = part_obj.part;

	part_obj.className = 'part_' + part.id;
	part_obj.$el = $('<button>');
	part_obj.$el.addClass('part locked ' + part_obj.className);
	part_obj.$el.data('part', part_obj);

	var $image = $('<div class="image">');
	$image.html('Click to Select');

	part_obj.$el.append($image);

	if ( part.category === 'cell' ) {
		$cells.append(part_obj.$el);
	} else if ( part.category === 'reflector' ) {
		$reflectors.append(part_obj.$el);
	} else if ( part.category === 'capacitor' ) {
		$capacitors.append(part_obj.$el);
	} else if ( part.category === 'vent' ) {
		$vents.append(part_obj.$el);
	} else if ( part.category === 'heat_exchanger' ) {
		$heat_exchangers.append(part_obj.$el);
	} else if ( part.category === 'heat_inlet' ) {
		$heat_inlets.append(part_obj.$el);
	} else if ( part.category === 'heat_outlet' ) {
		$heat_outlets.append(part_obj.$el);
	} else if ( part.category === 'coolant_cell' ) {
		$coolant_cells.append(part_obj.$el);
	} else if ( part.category === 'reactor_plating' ) {
		$reactor_platings.append(part_obj.$el);
	} else if ( part.category === 'particle_accelerator' ) {
		$particle_accelerators.append(part_obj.$el);
	}
};

// Tile height/width change

var enabled_class = 'enabled';

var adjust_primary_size_timeout;
var adjust_primary_size = function() {
	$primary[0].style.width = $reactor_section[0].offsetWidth + 32 + 'px';
};

evts.tile_disabled = function(tile) {
	tile.$el.removeClass(enabled_class);

	clearTimeout(adjust_primary_size_timeout);
	adjust_primary_size_timeout = setTimeout(adjust_primary_size, 10);
};

evts.tile_enabled = function(tile) {
	tile.$el.addClass(enabled_class);

	clearTimeout(adjust_primary_size_timeout);
	adjust_primary_size_timeout = setTimeout(adjust_primary_size, 10);
};

evts.update_tooltip = function() {
	if ( tooltip_update !== null ) {
		tooltip_update();
	}
};

// Tile tooltips

// TODO: DRY this
var tooltip_tile = null;
var tile_active_class = 'tile_active';
var tooltip_showing_class = 'tooltip_showing';

var tile_tooltip_show = function() {
	var tile = $(this).data('tile');
	var part = tile.part;

	if ( !part ) return;

	$main.addClass(tooltip_showing_class);

	if ( is_touch ) {
		if ( tooltip_tile ) {
			tooltip_tile.$el.removeClass(tile_active_class);
		}

		tile.$el.addClass(tile_active_class);
	}

	part.showTooltip(tile);
	tooltip_showing = true;

	tooltip_tile = tile;
	tooltip_update = (function(tile) {
		return function() {
			part.updateTooltip(tile);
		};
	})(tile);
};

var tile_tooltip_hide = function() {
	if ( is_touch && tooltip_tile ) {
		tooltip_tile.$el.removeClass(tile_active_class);
	}

	tooltip_showing = false;
	tooltip_update = null;
	tooltip_tile = null;
	$main.removeClass(tooltip_showing_class);
};

if ( !is_ios ) {
	$reactor.delegate('.tile', 'mouseover', tile_tooltip_show);
	$reactor.delegate('.tile', 'mouseout', tile_tooltip_hide);
}

if ( !is_touch ) {
	$reactor.delegate('.tile', 'focus', tile_tooltip_show);
	$reactor.delegate('.tile', 'blur', tile_tooltip_hide);
}

// Part tooltips
var tooltip_showing = false;
var tooltip_update = null;
var tooltip_part;
var last_tooltip_part;

var part_tooltip_update = function() {
	tooltip_part.updateTooltip();
};

var part_tooltip_show = function() {
	var part = $(this).data('part');

	if ( !tooltip_showing && !is_touch ) {
		$main.addClass(tooltip_showing_class);
	}

	part.showTooltip();
	tooltip_showing = true;
	tooltip_part = part;
	tooltip_update = part_tooltip_update;
};

var part_tooltip_hide = function() {
	tooltip_showing = false;
	tooltip_update = null;
	last_tooltip_part = tooltip_part;
	tooltip_part = null;
	$main.removeClass(tooltip_showing_class);
};

if ( !is_ios ) {
	$all_parts.delegate('.part', 'mouseover', part_tooltip_show);
	$all_parts.delegate('.part', 'mouseout', part_tooltip_hide);
}

if ( !is_touch ) {
	$all_parts.delegate('.part', 'focus', part_tooltip_show);
	$all_parts.delegate('.part', 'blur', part_tooltip_hide);
}

// Upgrade tooltips

// TODO: DRY this
var tooltip_upgrade = null;
var upgrade_tooltip_show = function() {
	var upgrade = $(this).data('upgrade');

	upgrade.showTooltip();
	if ( !tooltip_showing ) {
		$main.addClass(tooltip_showing_class);
	}

	tooltip_showing = true;
	tooltip_upgrade = upgrade;
	//tooltip_update = upgrade.updateTooltip;
};

var upgrade_tooltip_hide = function() {
	tooltip_showing = false;
	tooltip_upgrade = null;
	//tooltip_update = null;
	$main.removeClass(tooltip_showing_class);
};

if ( !is_ios ) {
	$all_upgrades.delegate('.upgrade', 'mouseover', upgrade_tooltip_show);
	$all_upgrades.delegate('.upgrade', 'mouseout', upgrade_tooltip_hide);
}

if ( is_touch ) {
	$all_upgrades.delegate('.upgrade', 'focus', upgrade_tooltip_show);
	$all_upgrades.delegate('.upgrade', 'blur', upgrade_tooltip_hide);
}

// Upgrade clicks
var clicked_upgrade;
$all_upgrades.delegate('.upgrade', 'click', function(event) {
	var upgrade = $(this).data('upgrade');

	if ( is_touch && clicked_upgrade != upgrade ) {
		upgrade_tooltip_show.apply(this, event);
		clicked_upgrade = upgrade;
		return;
	}

	if ( window.do_upgrade(upgrade) && tooltip_showing ) {
		upgrade.updateTooltip();
	}

	if ( is_touch ) {
		upgrade_tooltip_hide();
		clicked_upgrade = undefined;
	}
});

$all_upgrades.delegate('.upgrade', 'mousedown', function(event) {
	if ( debug && event.which === 3 ) {
		var upgrade = $(this).data('upgrade');
		event.preventDefault();

		if ( window.undo_upgrade(upgrade) && tooltip_showing ) {
			upgrade.updateTooltip();
		}
	}
});

  /////////////////////////////
 // Tile clicks
/////////////////////////////

// Select part
var active_class = 'part_active';
var clicked_part = null;
var tile_mousedown = false;

var deselect_part = function() {
	clicked_part = null;
	$('.' + active_class).removeClass(active_class);
	$main.removeClass(active_class);
	part_tooltip_hide();

	if ( is_touch ) {
		document.body.scrollTop = 0;
	}
};

$all_parts.delegate('.part', 'click', function(e) {
	if ( is_scrolling === true ) {
		is_scrolling = false;
		return;
	}

	var $this = $(this);
	var part = $this.data('part');

	if ( clicked_part && clicked_part === part ) {
		deselect_part();
	} else {
		part_tooltip_show.apply(this, e);

		if ( clicked_part ) {
			clicked_part.$el.removeClass(active_class);
			$main.removeClass(active_class);
		}

		clicked_part = part;
		// TODO: DRY
		$this.addClass(active_class);
		$main.addClass(active_class);
	}
});

var tile_mouseup_fn = function(e) {
	tile_mousedown = false;
};

document.oncontextmenu = function(e) {
	if ( tile_mousedown_right ) {
		e.preventDefault();
		tile_mousedown_right = false;
	}
};

var is_scrolling = false;
window.ontouchmove = function() {
	is_scrolling = true;
};

$reactor.delegate('.tile', 'click', function(e) {
	if ( is_scrolling === true ) {
		is_scrolling = false;
		return;
	}

	var ret;

	if ( !tile_mousedown ) {
		ret = mouse_apply_to_tile.call(this, e);
	}

	if (
		(!tooltip_part || tooltip_showing === true)
	) {
		if ( is_touch ) {
			return;
		}

		tile_tooltip_show.apply(this, e);
	}
});

var double_click_tile = null;
var clear_double_click = function() {
	double_click_tile = null;
};

var tile_mousedown_right = false;
$reactor.delegate('.tile', 'mousedown', function(e) {
	var $this = $(this);
	var this_tile = $this.data('tile');
	tile_mousedown = true;
	tile_mousedown_right = e.which === 3;
	var ret;

	if ( e.shiftKey || double_click_tile === this_tile ) {
		if ( this_tile.part ) {
			var ri, ci, row, tile;
			var level = this_tile.part.part.level;
			var type = this_tile.part.part.type;
			var active = this_tile.part.active;
			var ticks = this_tile.ticks;

			// All matching tiles
			for ( ri = 0; ri < game.rows; ri++ ) {
				row = game.tiles[ri];

				for ( ci = 0; ci < game.cols; ci++ ) {
					tile = row[ci];

					if ( !tile_mousedown_right && tile.part && type === tile.part.part.type ) {
						ret = mouse_apply_to_tile(tile, tile_mousedown_right, clicked_part);
					} else if (
						tile_mousedown_right
						&& tile.part
						&& type === tile.part.part.type
						&& level === tile.part.part.level
						&& ( !tile.part.part.base_ticks || ticks || (!tile.ticks && !this_tile.ticks) )
					) {
						ret = mouse_apply_to_tile(tile, tile_mousedown_right, clicked_part);
					}
				}
			}
		} else {
			ret = mouse_apply_to_tile(this_tile, tile_mousedown_right, clicked_part);
		}
	} else {
		ret = mouse_apply_to_tile(this_tile, tile_mousedown_right, clicked_part);
	}

	if ( is_touch && ret !== true ) {
		tile_tooltip_show.apply(this, e);
	}

	double_click_tile = this_tile;
	setTimeout(clear_double_click, 300);
});

$reactor.bind('mouseup', tile_mouseup_fn);
$reactor.bind('mouseleave', tile_mouseup_fn);

$reactor.delegate('.tile', 'mousemove', function(e) {
	var $this = $(this);
	var tile = $this.data('tile');

	if ( tile_mousedown ) {
		mouse_apply_to_tile(tile, tile_mousedown_right, clicked_part);
	}
});

// Game

evts.game_loaded = function() {
	$parts.scrollTop = $parts.scrollHeight;
};

evts.game_updated = function() {
	_show_page('reactor_upgrades', 'patch_section', true);
};

// Objectives

var $objectives_section = $('#objectives_section');
var objectives_unloading_class = 'unloading';
var objectives_loading_class = 'loading';
var objective_timeout;

var $objective_title = $('#objective_title');
var $objective_reward = $('#objective_reward');

evts.objective_unloaded = function() {
	$objectives_section.addClass(objectives_unloading_class);
};

evts.objective_loaded = function(val) {
	$objectives_section.addClass(objectives_loading_class);
	$objective_title[0].innerHTML = val.title;
	if ( val.reward ) {
		$objective_reward[0].innerHTML = '$' + fmt(val.reward);
	} else if ( val.ep_reward ) {
		$objective_reward[0].innerHTML = fmt(val.ep_reward) + 'EP';
	} else {
		$objective_reward[0].innerHTML = '';
	}
	$objectives_section.removeClass(objectives_unloading_class);

	clearTimeout(objective_timeout);
	objective_timeout = setTimeout(function() {
		$objectives_section.removeClass(objectives_loading_class);
	}, 100);
};

  /////////////////////////////
 // Reboot
/////////////////////////////

var $reboot = $('#reboot');
var $refund = $('#refund');

var reboot_click = function(event) {
	event.preventDefault();

	var response = confirm("Are you sure?");
	if ( !response ) return;

	reboot();
};

$reboot.bind('click', reboot_click);
$reboot.bind('touchend', reboot_click);

var refund = function(event) {
	event.preventDefault();

	var response = confirm("Are you sure?");
	if ( !response ) return;

	reboot(true);
};

$refund.bind('click', refund);
$refund.bind('touchend', refund);

  /////////////////////////////
 // Reduce Heat Manually
/////////////////////////////

var $reduce_heat = $('#reduce_heat');

var reduce_heat = function(event) {
	event.preventDefault();

	window.reduce_heat();
};

$reduce_heat.bind('click', reduce_heat);
$reduce_heat.bind('touchend', reduce_heat);

  /////////////////////////////
 // Tooltip Buttons
/////////////////////////////

// TODO: Handle all the tooltip functionality so the ui.game has no idea what tooltips are

// Mobile show/hide tooltip
var $show_tooltip = $('#show_tooltip');

var toggle_tooltip = function() {
	if ( !$main.hasClass(tooltip_showing_class) ) {
		if ( !tooltip_part ) {
			tooltip_part = last_tooltip_part;
		}

		$main.addClass(tooltip_showing_class);
	} else {
		$main.removeClass(tooltip_showing_class);
	}
};

$show_tooltip.bind('click', toggle_tooltip);

// Delete
var $tooltip_delete = $('#tooltip_delete');

var tooltip_delete = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.tooltip_delete(tooltip_tile);
	tooltip_close();
};

$tooltip_delete.bind('click', tooltip_delete);
$tooltip_delete.bind('touchend', tooltip_delete);

// Delete all
var $tooltip_delete_all = $('#tooltip_delete_all');

var tooltip_delete_all = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.tooltip_delete_all({
		tooltip_tile: tooltip_tile,
		tooltip_part: tooltip_part
	});
	tooltip_close();
};

$tooltip_delete_all.bind('click', tooltip_delete_all);
$tooltip_delete_all.bind('touchend', tooltip_delete_all);

// Replace all
var $tooltip_replace_all = $('#tooltip_replace_all');

var tooltip_replace_all = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.tooltip_replace_all({
		tooltip_tile: tooltip_tile,
		tooltip_part: tooltip_part
	});
	tooltip_close();
};

$tooltip_replace_all.bind('click', tooltip_replace_all);
$tooltip_replace_all.bind('touchend', tooltip_replace_all);

// Upgrade all
var $tooltip_upgrade_all = $('#tooltip_upgrade_all');

var tooltip_upgrade_all = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.tooltip_upgrade_all({
		tooltip_tile: tooltip_tile,
		tooltip_part: tooltip_part
	});
	tooltip_close();
};

$tooltip_upgrade_all.bind('click', tooltip_upgrade_all);
$tooltip_upgrade_all.bind('touchend', tooltip_upgrade_all);

// Close
var $tooltip_close = $('#tooltip_close');

var tooltip_close = function() {
	if ( tooltip_tile ) {
		tile_tooltip_hide();
	} else if ( tooltip_part ) {
		part_tooltip_hide();
	} else if ( tooltip_upgrade ) {
		upgrade_tooltip_hide();
	}

	//window.tooltip_close();
};

$tooltip_close.bind('click', tooltip_close);
$tooltip_close.bind('touchend', tooltip_close);

  /////////////////////////////
 // Misc UI
/////////////////////////////

// Pause
var $pause = $('#pause');

var pause = function(event) {
	event.preventDefault();

	window.pause();
};

$pause.bind('click', pause);
$pause.bind('touchend', pause);

evts.paused = function() {
	$main.className += ' paused';
};

// Unpause
var $unpause = $('#unpause');

var unpause = function(event) {
	event.preventDefault();

	window.unpause();
};

$unpause.bind('click', unpause);
$unpause.bind('touchend', unpause);

var pause_class = 'paused';

evts.unpaused = function() {
	$main.removeClass(pause_class);
};

// Enable/Disable auto sell
var $disable_auto_sell = $('#disable_auto_sell');
var $enable_auto_sell = $('#enable_auto_sell');
var auto_sell_disabled_class = 'auto_sell_disabled';

var disable_auto_sell = function(event) {
	event.preventDefault();
	window.disable_auto_sell();
};

evts.auto_sell_disabled = function() {
	$main.addClass(auto_sell_disabled_class);
};

var enable_auto_sell = function(event) {
	event.preventDefault();
	window.enable_auto_sell();
};

evts.auto_sell_enabled = function() {
	$main.removeClass(auto_sell_disabled_class);
};

$disable_auto_sell.bind('click', disable_auto_sell);
$disable_auto_sell.bind('touchend', disable_auto_sell);

$enable_auto_sell.bind('click', enable_auto_sell);
$enable_auto_sell.bind('touchend', enable_auto_sell);

// Enable/Disable auto buy
var $disable_auto_buy = $('#disable_auto_buy');
var $enable_auto_buy = $('#enable_auto_buy');
var auto_buy_disabled_class = 'auto_buy_disabled';

var disable_auto_buy = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.disable_auto_buy();
};

evts.auto_buy_disabled = function() {
	$main.addClass(auto_buy_disabled_class);
};

var enable_auto_buy = function() {
	window.enable_auto_buy();
};

evts.auto_buy_enabled = function() {
	$main.removeClass(auto_buy_disabled_class);
};

$disable_auto_buy.bind('click', disable_auto_buy);
$disable_auto_buy.bind('touchend', disable_auto_buy);

$enable_auto_buy.bind('click', enable_auto_buy);
$enable_auto_buy.bind('touchend', enable_auto_buy);

//Sell
var $sell = $('#sell');

var sell = function(event) {
	event.preventDefault();

	window.sell();
};

$sell.bind('click', sell);
$sell.bind('touchend', sell);

  /////////////////////////////
 // Pure UI
/////////////////////////////

// Show Pages
var showing_class = 'showing';
var default_id = 'reactor_section';
var default_section = 'reactor_upgrades';

var _show_page = function(section, id, notrack) {
	notrack = notrack || false;
	var $page = $('#' + id);
	var $section = $('#' + section);
	var pages = $section.find('.page');

	for ( var i = 0, length = pages.length, $p; i < length; i++ ) {
		$p = pages.eq(i);
		$p.removeClass(showing_class);
		$main.removeClass('showing_page_' + $p.attr('id'));
	}

	$page.addClass(showing_class);
	$main.addClass('showing_page_' + id);

	// Page specific stuff
	if ( id == 'upgrades_section' || id == 'experimental_upgrades_section' ) {
		do_check_upgrades_affordability = true;
	} else {
		do_check_upgrades_affordability = false;
	}

	if ( !notrack ) {
		ga('send', 'event', 'click', 'show_page', 'id');
	}
};

var show_default_page = function() {
	_show_page(default_section, default_id);
};

var show_page = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	var $this = $(this);
	var id = $this.data('page');
	var section = $this.data('section');

	var $current = $('#reactor_upgrades .page.' + showing_class);

	if ( $current.attr('id') === id ) {
		section = default_section;
		id = default_id;
	}

	_show_page(section, id);
	deselect_part();
	close_flyouts();
};

$main.delegate('.nav', 'click', show_page);
$main.delegate('.nav', 'touchend', show_page);

/*// TODO: Save preference
// Nav more/less
var $nav_more = $('#nav_more');
var $nav_less = $('#nav_less');
var nav_more_class = 'nav_more';
var nav_more = function(event) {
	event.preventDefault();
	$main.addClass(nav_more_class);
};

$nav_more.bind('click', nav_more);
$nav_more.bind('touchend', nav_more);

var nav_less = function(event) {
	event.preventDefault();
	$main.removeClass(nav_more_class);
};

$nav_less.bind('click', nav_less);
$nav_less.bind('touchend', nav_less);*/

// TODO: Save preference
// Stats more/less
var $show_more_stats = $('#show_more_stats');
var $hide_more_stats = $('#hide_more_stats');
var show_more_stats_class = 'show_more_stats';
var show_more_stats = function(event) {
	event.preventDefault();
	$main.addClass(show_more_stats_class);
};

$show_more_stats.bind('click', show_more_stats);
$show_more_stats.bind('touchend', show_more_stats);

var hide_more_stats = function(event) {
	event.preventDefault();
	$main.removeClass(show_more_stats_class);
};

$hide_more_stats.bind('click', hide_more_stats);
$hide_more_stats.bind('touchend', hide_more_stats);

// Show spoilers
var has_spoiler_class = 'has_spoiler';
var show_class = 'show';
$('#help_section').delegate('.show_spoiler', 'click', function() {
	var $this = $(this);
	var $has_spoiler = $this.closest('.' + has_spoiler_class);
	var found = false;

	if ( !$has_spoiler.length ) {
		return;
	}

	if ( $has_spoiler.hasClass(show_class) ) {
		$has_spoiler.removeClass(show_class);
	} else {
		$has_spoiler.addClass(show_class);
	}
});

// Mobile stats nav
var parts_open_class = 'parts_open';
var navigation_open_class = 'navigation_open';
var controls_open_class = 'controls_open';
var all_open_classes = [parts_open_class, navigation_open_class, controls_open_class];

var close_flyouts = function() {
	$main.removeClass(all_open_classes.join(' '));
};

$('#stats_nav')
	.delegate('#open_parts', 'click', function() {
		if ( $main.hasClass(parts_open_class) ) {
			$main.removeClass(parts_open_class);
		} else {
			$main
				.removeClass(all_open_classes.join(' '))
				.addClass(parts_open_class)
				;
			show_default_page();
		}
	})
	.delegate('#open_navigation', 'click', function() {
		if ( $main.hasClass(navigation_open_class) ) {
			$main.removeClass(navigation_open_class);
		} else {
			$main
				.removeClass(all_open_classes.join(' '))
				.addClass(navigation_open_class)
				;
		}
	})
	.delegate('#open_controls', 'click', function() {
		if ( $main.hasClass(controls_open_class) ) {
			$main.removeClass(controls_open_class);
		} else {
			$main
				.removeClass(all_open_classes.join(' '))
				.addClass(controls_open_class)
				;
		}
	})
	;

})(window.jQuery);