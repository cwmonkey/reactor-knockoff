(function() {
'use strict';

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
var $reactor = $('#reactor');
var $reactor_section = $('#reactor_section');
var $refund_exotic_particles = $('#refund_exotic_particles');
var $reboot_exotic_particles = $('#reboot_exotic_particles');
var $manual_heat_reduce = $('#manual_heat_reduce');
var $auto_heat_reduce = $('#auto_heat_reduce');
var $power_percentage = $('#power_percentage');
var $heat_percentage = $('#heat_percentage');
var $parts = $('#parts');
var $primary = $('#primary');

var rows = [];
var current_vars = {};
var update_vars = {};

var perc = function(numerator, denominator, dom) {
	var percent = current_vars[numerator] / current_vars[denominator] * 100;
	if ( percent > 100 ) percent = 100;
	dom.style.width = percent + '%';
};

var update_heat_background = function (current_heat, max_heat) {
	if ( current_heat <= max_heat ) {
		$reactor.style.backgroundColor = 'transparent';
	} else if ( current_heat > max_heat && current_heat <= max_heat * 2 ) {
		$reactor.style.backgroundColor = 'rgba(255, 0, 0, ' + ((current_heat - max_heat) / max_heat) + ')';
	} else {
		$reactor.style.backgroundColor = 'rgb(255, 0, 0)';
	}
}

var var_objs = {
	manual_heat_reduce: {
		onupdate: function() {
			$manual_heat_reduce.innerHTML = '-' + fmt(current_vars.manual_heat_reduce);
		}
	},
	auto_heat_reduce: {
		onupdate: function() {
			$auto_heat_reduce.innerHTML = '-' + fmt(current_vars.auto_heat_reduce);
		}
	},
	// TODO: Bad naming
	current_money: {
		dom: $('#money'),
		num: true
	},
	current_power: {
		dom: $('#current_power'),
		num: true,
		instant: true,
		onupdate: function() {
			perc('current_power', 'max_power', $power_percentage);
		}
	},
	max_power: {
		dom: $('#max_power'),
		num: true,
		// TODO: DRY?
		onupdate: function() {
			perc('current_power', 'max_power', $power_percentage);
		}
	},
	// TODO: Bad naming
	total_power: {
		dom: $('#stats_power'),
		num: true
	},
	current_heat: {
		dom: $('#current_heat'),
		num: true,
		onupdate: function() {
			perc('current_heat', 'max_heat', $heat_percentage);

			var current_heat = current_vars.current_heat;
			var max_heat = current_vars.max_heat;

			update_heat_background(current_heat, max_heat)
		}
	},
	total_heat: {
		dom: $('#stats_heat'),
		num: true
	},
	max_heat: {
		dom: $('#max_heat'),
		num: true,
		onupdate: function() {
			var current_heat = current_vars.current_heat;
			var max_heat = current_vars.max_heat;

			perc('current_heat', 'max_heat', $heat_percentage);
			$auto_heat_reduce.innerHTML = '-' + (fmt(current_vars.max_heat/10000));

			update_heat_background(current_heat, max_heat)
		}
	},
	exotic_particles: {
		dom: $('#exotic_particles'),
		num: true,
		// TODO: Have more than one dom?
		onupdate: function() {
			var exotic_particles = current_vars.exotic_particles;
			$reboot_exotic_particles.innerHTML = fmt(exotic_particles);
		}
	},
	current_exotic_particles: {
		dom: $('#current_exotic_particles'),
		num: true,
		onupdate: function() {
			var total_exotic_particles = current_vars.total_exotic_particles;
			var current_exotic_particles = current_vars.current_exotic_particles;
			$refund_exotic_particles.innerHTML = fmt(total_exotic_particles - current_exotic_particles);
		}
	},

	stats_cash: {
		dom: $('#stats_cash'),
		num: true,
		places: 2
	},
	stats_outlet: {
		dom: $('#stats_outlet'),
		num: true,
		places: 2
	},
	stats_inlet: {
		dom: $('#stats_inlet'),
		num: true,
		places: 2
	},
	stats_vent: {
		dom: $('#stats_vent'),
		num: true,
		places: 2
	},
	stats_heat: {
		dom: $('#stats_heat'),
		num: true,
		places: 2
	},

	money_add: {
		dom: $('#money_per_tick'),
		num: true
	},
	power_add: {
		dom: $('#power_per_tick'),
		num: true
	},
	heat_add: {
		dom: $('#heat_per_tick'),
		num: true
	}
};

// Update formatted numbers
var update_var = function(key, obj) {
	var value = update_vars[key];

	if ( obj.dom ) {
		if ( obj.num ) {
			obj.dom.innerHTML = fmt(value, obj.places || null);
		} else {
			obj.dom.innerHTML = value;
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
// TODO: configurable interval
var update_interface_interval = 100;
var unaffordable_replace = /[\s\b]unaffordable\b/;
var locked_find = /[\b\s]locked\b/;
var do_check_upgrades_affordability = false;
var update_interface = function() {
	var start_ui_loop = performance.now();
	update_vars();
	setTimeout(update_interface, update_interface_interval);

	if ( $reactor_section.classList.contains('showing') ) {
		for ( var ri = 0, row, ci, tile; ri < ui.game.max_rows; ri++ ) {
			row = ui.game.tiles[ri];

			for ( ci = 0; ci < ui.game.max_cols; ci++ ) {
				tile = row[ci];
				if ( tile.ticksUpdated ) {
					if ( tile.part ) {
						tile.$percent.style.width = tile.ticks / tile.part.ticks * 100 + '%';
					} else {
						tile.$percent.style.width = '0';
					}

					tile.ticksUpdated = false;
				}

				if ( tile.heat_containedUpdated ) {
					if ( tile.part && tile.part.containment ) {
						tile.$percent.style.width = tile.heat_contained / tile.part.containment * 100 + '%';
					} else {
						tile.$percent.style.width = '0';
					}

					tile.heat_containedUpdated = false;
				}
			}
		}
	}

	if ( do_check_upgrades_affordability === true ) {
		window.check_upgrades_affordability();
		for ( var i = 0, l = ui.game.upgrade_objects_array.length, upgrade; i < l; i++ ) {
			upgrade = ui.game.upgrade_objects_array[i];

			if ( upgrade.affordableUpdated === true ) {
				if ( upgrade.affordable === true ) {
					upgrade.$el.className = upgrade.$el.className.replace(unaffordable_replace, '');
				} else {
					upgrade.$el.className += ' unaffordable';
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
				part.$el.className = part.$el.className.replace(unaffordable_replace, '').replace(locked_find, '');
			} else {
				part.$el.className += ' unaffordable';
			}

			part.affordableUpdated = false;
		}
	}

	//console.log(performance.now() - start_ui_loop);
};
ui.update_interface = update_interface;

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

evts.row_added = function() {
	var row = {
		dom: $('<div class="row">'),
		tiles: []
	};

	rows.push(row);

	$reactor.appendChild(row.dom);
};

evts.tile_added = function(val) {
	var row = rows[val.row];
	var tile = val.tile;

	tile.$el = $('<button class="tile">');
	tile.$el.tile = tile;

	// remove exploding class after the exploding animation is completed
	// so it doesn't play again when toggling css display object when switching between pages/panels
	tile.$el.addEventListener("animationend", function(){this.classList.remove('exploding')})

	var $percent_wrapper_wrapper = $('<div class="percent_wrapper_wrapper">');
	var $percent_wrapper = $('<div class="percent_wrapper">');
	tile.$percent = $('<p class="percent">');

	$percent_wrapper_wrapper.appendChild($percent_wrapper);
	$percent_wrapper.appendChild(tile.$percent);
	tile.$el.appendChild($percent_wrapper_wrapper);

	row.dom.appendChild(tile.$el);
	row.tiles.push(tile);
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
	part_obj.$el = document.createElement('BUTTON');
	part_obj.$el.className = 'part locked ' + part_obj.className;
	part_obj.$el.part = part_obj;

	var $image = $('<div class="image">');
	$image.innerHTML = 'Click to Select';

	part_obj.$el.appendChild($image);

	if ( part.category === 'cell' ) {
		$cells.appendChild(part_obj.$el);
	} else if ( part.category === 'reflector' ) {
		$reflectors.appendChild(part_obj.$el);
	} else if ( part.category === 'capacitor' ) {
		$capacitors.appendChild(part_obj.$el);
	} else if ( part.category === 'vent' ) {
		$vents.appendChild(part_obj.$el);
	} else if ( part.category === 'heat_exchanger' ) {
		$heat_exchangers.appendChild(part_obj.$el);
	} else if ( part.category === 'heat_inlet' ) {
		$heat_inlets.appendChild(part_obj.$el);
	} else if ( part.category === 'heat_outlet' ) {
		$heat_outlets.appendChild(part_obj.$el);
	} else if ( part.category === 'coolant_cell' ) {
		$coolant_cells.appendChild(part_obj.$el);
	} else if ( part.category === 'reactor_plating' ) {
		$reactor_platings.appendChild(part_obj.$el);
	} else if ( part.category === 'particle_accelerator' ) {
		$particle_accelerators.appendChild(part_obj.$el);
	}
};

// Tile height/width change

var enabled_class = 'enabled';
var enabled_find = new RegExp('[\\s\\b]' + enabled_class + '\\b');

var adjust_primary_size_timeout;
var adjust_primary_size = function() {
	// If an element has display:none, it's offsetWidth would be 0
	// so we have to temporary restore the display to get it's real offsetWidth
	var original_display = $reactor_section.style.display;
	$reactor_section.style.display = 'inherit';
	$primary.style.width = $reactor_section.offsetWidth + 32 + 'px';
	$reactor_section.style.display = original_display;
};

evts.tile_disabled = function(tile) {
	tile.$el.className = tile.$el.className.replace(enabled_find, '');

	clearTimeout(adjust_primary_size_timeout);
	adjust_primary_size_timeout = setTimeout(adjust_primary_size, 10);
};

evts.tile_enabled = function(tile) {
	tile.$el.className += ' ' + enabled_class;

	clearTimeout(adjust_primary_size_timeout);
	adjust_primary_size_timeout = setTimeout(adjust_primary_size, 10);
};

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
var objectives_unloading_find = new RegExp('[\\s\\b]' + objectives_unloading_class + '\\b');
var objectives_loading_class = 'loading';
var objectives_loading_find = new RegExp('[\\s\\b]' + objectives_loading_class + '\\b');
var objective_timeout;

var $objective_title = $('#objective_title');
var $objective_reward = $('#objective_reward');

evts.objective_unloaded = function() {
	$objectives_section.className += ' ' + objectives_unloading_class;
};

evts.objective_loaded = function(val) {
	$objectives_section.className += ' ' + objectives_loading_class;
	$objective_title.innerHTML = val.title;
	if ( val.reward ) {
		$objective_reward.innerHTML = '$' + fmt(val.reward);
	} else if ( val.ep_reward ) {
		$objective_reward.innerHTML = fmt(val.ep_reward) + 'EP';
	} else {
		$objective_reward.innerHTML = '';
	}
	$objectives_section.className = $objectives_section.className.replace(objectives_unloading_find, '');

	clearTimeout(objective_timeout);
	objective_timeout = setTimeout(function() {
		$objectives_section.className = $objectives_section.className.replace(objectives_loading_find, '');
	}, 100);
};

/////////////////////////////
// Reboot
/////////////////////////////

$('#reboot').onclick = function(event) {
	event.preventDefault();

	var response = confirm("Are you sure?");
	if ( !response ) return;

	reboot();
};

$('#refund').onclick = function(event) {
	event.preventDefault();

	var response = confirm("Are you sure?");
	if ( !response ) return;

	reboot(true);
};

/////////////////////////////
// Reduce Heat Manually
/////////////////////////////

$('#reduce_heat').onclick = function(event) {
	event.preventDefault();

	window.reduce_heat();
};

/////////////////////////////
// Tooltip Buttons
/////////////////////////////

// TODO: Handle all the tooltip functionality so the ui.game has no idea what tooltips are

// Delete
$('#tooltip_delete').onclick = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.tooltip_delete();
};

// Delete all
$('#tooltip_delete_all').onclick = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.tooltip_delete_all();
};

// Replace all
$('#tooltip_replace_all').onclick = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.tooltip_replace_all();
};

// Upgrade all
$('#tooltip_upgrade_all').onclick = function(event) {
	if ( event ) {
		event.preventDefault();
	}

	window.tooltip_upgrade_all();
};

// Close
$('#tooltip_close').onclick = function() {
	window.tooltip_close();
};

/////////////////////////////
// Toggle UI
/////////////////////////////

var toggle_buttons = {};

var create_toggle_button = function(button, enable_text, disable_text) {
	var $button = $(button)
	return (disabled, enable_callback, disable_callback) => {
		var update_text = () => $button.textContent = !disabled() ? enable_text : disable_text;
		toggle_buttons[button] = update_text
		$button.onclick = (event) => {
			disabled() ? enable_callback(event) : disable_callback(event);
		};
	};
};

// Pause/Unpause
create_toggle_button('#pause_toggle', 'Pause', 'Unpause')(
	()=>ui.game.paused,
	function(event) {
		event.preventDefault();
		window.unpause();
	},
	function(event) {
		event.preventDefault();
		window.pause();
	}
);

evts.paused = toggle_buttons['#pause_toggle'];

evts.unpaused = toggle_buttons['#pause_toggle'];

// Enable/Disable auto sell
create_toggle_button('#auto_sell_toggle', 'Disable Auto Sell', 'Enable Auto Sell')(
	()=>ui.game.auto_sell_disabled,
	function(event) {
		event.preventDefault();
		window.enable_auto_sell();
	},
	function(event) {
		event.preventDefault();
		window.disable_auto_sell();
	}
);

evts.auto_sell_disabled = toggle_buttons['#auto_sell_toggle'];

evts.auto_sell_enabled = toggle_buttons['#auto_sell_toggle'];

// Enable/Disable auto buy
create_toggle_button('#auto_buy_toggle', 'Disable Auto Buy', 'Enable Auto Buy')(
	()=>ui.game.auto_buy_disabled,
	function(event) {
		event.preventDefault();
		window.enable_auto_buy();
	},
	function(event) {
		event.preventDefault();
		window.disable_auto_buy();
	}
);

evts.auto_buy_disabled = toggle_buttons['#auto_buy_toggle'];

evts.auto_buy_enabled = toggle_buttons['#auto_buy_toggle'];

/////////////////////////////
// Misc UI
/////////////////////////////

//Sell
$('#sell').onclick = function(event) {
	event.preventDefault();

	window.sell();
};

// Save
$('#trigger_save').onclick = function() {
	ui.game.save_manager.active_saver.save(ui.game.saves());

	// TODO: replace with a nice tooltip/notification
	alert("Game saved")
}

$('#download_save').onclick = function() {
	var save_data = ui.game.saves();
	ui.game.save_manager.active_saver.save(save_data);
	var saveAsBlob = new Blob([ save_data ], { type: 'text/plain' });
	var downloadLink = document.createElement("a");
	downloadLink.download = "reactor_knockoff_save.base64";
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL != null) {
		// Chrome allows the link to be clicked without actually adding it to the DOM.
		downloadLink.href = window.webkitURL.createObjectURL(saveAsBlob);
	} else {
		// Firefox requires the link to be added to the DOM before it can be clicked.
		downloadLink.href = window.URL.createObjectURL(saveAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}

	downloadLink.click();
};

$('#export_save').onclick = function() {
	var save_data = ui.game.saves();
	ui.game.save_manager.active_saver.save(save_data);
	$('#import_button').style.display = "none";
	$("#txtImportExport").value = save_data;
	$("#txtImportExport").select();
	$("#Import_Export_dialog").showModal();
};

$('#import_save').onclick = function() {
	$('#import_button').style.display = null;
	$("#txtImportExport").value = "";
	$("#Import_Export_dialog").showModal();
};

$('#import_button').onclick = function() {
	ui.game.loads($("#txtImportExport").value);
	$("#txtImportExport").value = "";
};

$('#reset_game').onclick = function() {
	if (confirm("confirm reset game?")){
		ui.game.save_manager.active_saver.save("");
		document.location.reload();
	}
}

$('#Import_Export_close_button').onclick = function() {
	$('#Import_Export_dialog').close()
}

/////////////////////////////
// Pure UI
/////////////////////////////

// Show Pages
var showing_find = /[\b\s]showing\b/;

var _show_page = function(section, id, notrack) {
	notrack = notrack || false;
	var $page = $('#' + id);
	var $section = $('#' + section);
	var pages = $section.getElementsByClassName('page');

	for ( var i = 0, length = pages.length, $p; i < length; i++ ) {
		$p = pages[i];
		$p.className = $p.className.replace(showing_find, '');
	}

	$page.className += ' showing';

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

$main.delegate('nav', 'click', function(event) {
	if ( event ) {
		event.preventDefault();
	}

	var id = this.getAttribute('data-page');
	var section = this.getAttribute('data-section');
	_show_page(section, id);
});

// TODO: Save preference
// Nav more/less
create_toggle_button('#nav_toggle', '[+]', '[-]')(
	()=>$main.classList.contains('nav_more'),
	function(event) {
		event.preventDefault();
		$main.classList.remove('nav_more');
		toggle_buttons['#nav_toggle']()
	},
	function(event) {
		event.preventDefault();
		$main.classList.add('nav_more');
		toggle_buttons['#nav_toggle']()
	}
);
toggle_buttons['#nav_toggle']()

// TODO: Save preference
// Stats more/less
create_toggle_button('#more_stats_toggle', '[+]', '[-]')(
	()=>$main.classList.contains('show_more_stats'),
	function(event) {
		event.preventDefault();
		$main.classList.remove('show_more_stats');
		toggle_buttons['#more_stats_toggle']()
	},
	function(event) {
		event.preventDefault();
		$main.classList.add('show_more_stats');
		toggle_buttons['#more_stats_toggle']()
	}
);
toggle_buttons['#more_stats_toggle']()

// Show spoilers
var has_spoiler_find = /\bhas_spoiler\b/;
var show_find = /[\s\b]show\b/;
$('#help_section').delegate('show_spoiler', 'click', function() {
	var has_spoiler = this;
	var found = false;

	while ( has_spoiler ) {
		if ( has_spoiler.className.match(has_spoiler_find) ) {
			found = true;
			break;
		} else {
			has_spoiler = has_spoiler.parentNode;
		}
	}

	if ( !found ) {
		return;
	}

	if ( has_spoiler.className.match(show_find) ) {
		has_spoiler.className = has_spoiler.className.replace(' show', '');
	} else {
		has_spoiler.className += ' show';
	}
});

})();
