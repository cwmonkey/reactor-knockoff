(function() {

window.upgrades = function(game) {
	var upgrades = [
		{
			id: 'chronometer',
			type: 'other',
			title: 'Improved Chronometers',
			description: '+1 tick per second per level of upgrade.',
			cost: 10000,
			multiplier: 100,
			onclick: function(upgrade) {
				game.loop_wait = game.base_loop_wait / ( upgrade.level + 1 );
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
				game.heat_power_multiplier = upgrade.level;
			}
		},
		{
			id: 'heat_control_operator',
			type: 'other',
			title: 'Heat Control Operator',
			description: 'Your reactor no longer automatically removes heat from itself when it is below its maximum heat capacity. This makes Forceful Fusion easier to maintain.',
			// TODO: Figure out a good price for this
			cost: 1000000,
			levels: 1,
			onclick: function(upgrade) {
			}
		},
		{
			id: 'heat_outlet_control_operator',
			type: 'other',
			title: 'Better Heat Control Operator',
			description: 'Your reactor outlets no longer output more heat than what the connected vents can handle.',
			erequires: 'heat_control_operator',
			// TODO: Figure out a good price for this
			cost: 10000000,
			levels: 1,
			onclick: function(upgrade) {
				game.heat_outlet_controlled = upgrade.level;
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
				game.manual_heat_reduce = game.base_manual_heat_reduce * Math.pow(10, upgrade.level);
				game.ui.say('var', 'manual_heat_reduce', game.manual_heat_reduce);
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
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['reactor_plating' + i];
					part.reactor_heat = part.part.base_reactor_heat * ( upgrade.level + 1 ) * Math.pow(2, game.upgrade_objects['quantum_buffering'].level);
					part.updateDescription();
				}
			}
		},

		// Capacitors
		{
			id: 'improved_power_lines',
			type: 'other',
			title: 'Improved Power Lines',
			description: 'Sells 1% of your power each tick per level of upgrade.',
			cost: 100,
			multiplier: 10,
			onclick: function(upgrade) {
				game.auto_sell_multiplier = .01 * upgrade.level;
			}
		},
		{
			id: 'improved_wiring',
			type: 'other',
			title: 'Improved Wiring',
			description: 'Capacitors hold +100% power and heat per level of upgrade.',
			cost: 5000,
			multiplier: 5,
			onclick: function(upgrade) {
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['capacitor' + i];
					part.reactor_power = part.part.base_reactor_power * ( upgrade.level + 1 ) * Math.pow(2, game.upgrade_objects['quantum_buffering'].level);
					part.containment = part.part.base_containment * ( upgrade.level + 1 ) * Math.pow(2, game.upgrade_objects['quantum_buffering'].level);
					part.updateDescription();
				}
			}
		},
		{
			id: 'perpetual_capacitors',
			type: 'other',
			title: 'Perpetual Capacitors',
			description: 'If capacitors are on a cool surface when they go over their maximum heat containment, the heat is vented directly into the reactor and the capacitor is replaced. The capacitor costs 10 times the normal cost.',
			cost: 1000000000000000000,
			multiplier: 5,
			levels: 1,
			onclick: function(upgrade) {
				/* TODO: ponder this - it's part-wide so it's basically just a setting
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['capacitor' + i];
					part.perpetual = upgrade.level > 0 ? true : false;
					part.updateDescription();
				}*/
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
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['coolant_cell' + i];
					part.containment = part.part.base_containment * ( upgrade.level + 1 ) * Math.pow(2, game.upgrade_objects['ultracryonics'].level);
					part.updateDescription();
				}
			}
		},

		// Reflectors
		{
			id: 'improved_reflector_density',
			type: 'other',
			title: 'Improved Reflector Density',
			description: 'Reflectors last 100% longer per level of upgrade.',
			cost: 5000,
			multiplier: 100,
			onclick: function(upgrade) {
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['reflector' + i];
					part.ticks = part.part.base_ticks * ( upgrade.level + 1 );
					part.updateDescription();
				}
			}
		},
		{
			id: 'improved_neutron_reflection',
			type: 'other',
			title: 'Improved Neutron Reflection',
			description: 'Reflectors generate an additional 1% power per level of upgrade.',
			cost: 5000,
			multiplier: 100,
			onclick: function(upgrade) {
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['reflector' + i];
					part.power_increase = part.part.base_power_increase * (1 + (upgrade.level / 100)) + (part.part.base_power_increase * (game.upgrade_objects['full_spectrum_reflectors'].level));
					part.updateDescription();
				}
			}
		},
		{
			id: 'perpetual_reflectors',
			type: 'other',
			title: 'Perpetual Reflectors',
			description: 'Reflectors are automtically replaced after being destroyed if they are on a cool surface. The replacement part will cost 1.5 times the normal cost.',
			cost: 1000000000,
			levels: 1,
			onclick: function(upgrade) {
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['reflector' + i];
					part.perpetual = upgrade.level ? true : false;
					part.updateDescription();
				}
			}
		},

		// Exchangers
		{
			id: 'improved_heat_exchangers',
			type: 'exchangers',
			title: 'Improved Heat Exchangers',
			description: 'Heat Exchangers, Inlets and Outlets hold and exchange 100% more heat per level of upgrade',
			cost: 600,
			multiplier: 100,
			onclick: function(upgrade) {
				var part;

				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['heat_inlet' + i];
					part.transfer = part.part.base_transfer * (upgrade.level + 1) * Math.pow(2, game.upgrade_objects['fluid_hyperdynamics'].level);
					part.updateDescription();

					part = game.part_objects['heat_outlet' + i];
					part.transfer = part.part.base_transfer * (upgrade.level + 1) * Math.pow(2, game.upgrade_objects['fluid_hyperdynamics'].level);
					part.updateDescription();

					part = game.part_objects['heat_exchanger' + i];
					part.transfer = part.part.base_transfer * ( upgrade.level + 1 ) * Math.pow(2, game.upgrade_objects['fluid_hyperdynamics'].level);
					part.containment = part.part.base_containment * (upgrade.level + 1) * Math.pow(2, game.upgrade_objects['fractal_piping'].level);
					part.updateDescription();
				}
			}
		},
		{
			id: 'reinforced_heat_exchangers',
			type: 'exchangers',
			title: 'Reinforced Heat Exchangers',
			description: 'Each plating increases the amout of heat that exchangers can exchange by 1% per level of upgrade per level of plating.',
			cost: 1000,
			multiplier: 100,
			onclick: function(upgrade) {
				game.transfer_plating_multiplier = upgrade.level;
			}
		},
		{
			id: 'active_exchangers',
			type: 'exchangers',
			title: 'Active Exchangers',
			description: 'Each capacitor increases the amout of heat that exchangers can exchange by 1% per level of upgrade per level of capacitor.',
			cost: 1000,
			multiplier: 100,
			onclick: function(upgrade) {
				game.transfer_capacitor_multiplier = upgrade.level;
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
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['vent' + i];
					part.vent = part.part.base_vent * (upgrade.level + 1) * Math.pow(2, game.upgrade_objects['fluid_hyperdynamics'].level);
					part.containment = part.part.base_containment * (upgrade.level + 1) * Math.pow(2, game.upgrade_objects['fractal_piping'].level);
					part.updateDescription();
				}
			}
		},
		{
			id: 'improved_heatsinks',
			type: 'vents',
			title: 'Improved Heatsinks',
			description: 'Each plating increases the amount of heat that vents can vent by 1% per level of upgrade per level of plating.',
			cost: 1000,
			multiplier: 100,
			onclick: function(upgrade) {
				game.vent_plating_multiplier = upgrade.level;
			}
		},
		{
			id: 'active_venting',
			type: 'vents',
			title: 'Active Venting',
			description: 'Each capacitor increases the effectiveness of heat that vents can vent by 1% per level of upgrade per level of capacitor.',
			cost: 1000,
			multiplier: 100,
			onclick: function(upgrade) {
				game.vent_capacitor_multiplier = upgrade.level;
			}
		},
		/* Killing these for now
		{
			id: 'improved_particle_accelerators',
			type: 'other',
			title: 'Improved Particle Accelerators',
			description: 'Increase the maximum heat the Particle Accelerators can use to create Exotic Particles by 100% per level of upgrade.',
			cost: 1000000000000000,
			multiplier: 100,
			onclick: function(upgrade) {
				var part;

				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['particle_accelerator' + i];
					part.ep_heat = part.part.base_ep_heat * (upgrade.level + 1) * Math.pow(2, game.upgrade_objects['force_particle_research'].level);
					part.updateDescription();
				}
			}
		},*/

		// Expanding
		{
			id: 'expand_reactor_rows',
			type: 'other',
			title: 'Expand Reactor Rows',
			description: 'Add one row to the reactor for each level of the upgrade.',
			cost: 100,
			levels: 20,
			multiplier: 100,
			onclick: function(upgrade) {
				game.rows = game.base_rows + upgrade.level;
			}
		},
		{
			id: 'expand_reactor_cols',
			type: 'other',
			title: 'Expand Reactor Cols',
			description: 'Add one column to the reactor for each level of the upgrade.',
			cost: 100,
			levels: 20,
			multiplier: 100,
			onclick: function(upgrade) {
				game.cols = game.base_cols + upgrade.level;
			}
		},

		/////////////////////////////
		// Experimental Upgrades
		/////////////////////////////

		{
			id: 'laboratory',
			type: 'experimental_laboratory',
			title: 'Laboratory',
			description: 'Enables experimental upgrades.',
			ecost: 1,
			levels: 1,
			onclick: function(upgrade) {
				// Nothing, used to unlock other upgrades
			}
		},
		{
			id: 'infused_cells',
			type: 'experimental_boost',
			title: 'Infused Cells',
			description: 'Each fuel cell produces an additional 100% base power per level of upgrade.',
			erequires: 'laboratory',
			ecost: 50,
			multiplier: 2,
			onclick: function(upgrade) {
				game.update_cell_power();
			}
		},
		{
			id: 'unleashed_cells',
			type: 'experimental_boost',
			title: 'Unleashed Cells',
			description: 'Each fuel cell produces two times their base heat and power per level of upgrade.',
			erequires: 'laboratory',
			ecost: 100,
			multiplier: 2,
			onclick: function(upgrade) {
				var part;

				for ( var i = 0, l = game.part_objects_array.length; i < l; i++ ) {
					part = game.part_objects_array[i];
					if ( part.category === 'cell' ) {
						part.base_heat = part.part.base_heat * Math.pow(2, upgrade.level);
						part.heat = part.part.heat * Math.pow(2, upgrade.level);
					}
				}

				game.update_cell_power();
			}
		},
		{
			id: 'quantum_buffering',
			type: 'experimental_boost',
			title: 'Quantum Buffering',
			description: 'Capacitors and platings provide twice as much reactor power and heat capacity, and capacitors can contain twice as much heat per level of upgrade.',
			erequires: 'laboratory',
			ecost: 50,
			multiplier: 2,
			onclick: function(upgrade) {
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['capacitor' + i];
					part.reactor_power = part.part.base_reactor_power * (game.upgrade_objects['improved_wiring'].level + 1) * Math.pow(2, upgrade.level);
					part.containment = part.part.base_containment * (game.upgrade_objects['improved_wiring'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();

					part = game.part_objects['reactor_plating' + i];
					part.reactor_heat = part.part.base_reactor_heat * (game.upgrade_objects['improved_alloys'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();
				}
			}
		},
		{
			id: 'full_spectrum_reflectors',
			type: 'experimental_boost',
			title: 'Full Spectrum Reflectors',
			description: 'Reflectors gain an additional 100% of their base power reflection per level of upgrade.',
			erequires: 'laboratory',
			ecost: 50,
			multiplier: 2,
			onclick: function(upgrade) {
				var part;
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['reflector' + i];
					part.power_increase = part.part.base_power_increase * (1 + (game.upgrade_objects['improved_neutron_reflection'].level / 100)) + (part.part.base_power_increase * (upgrade.level));
					part.updateDescription();
				}
			}
		},
		{
			id: 'fluid_hyperdynamics',
			type: 'experimental_boost',
			title: 'Fluid Hyperdynamics',
			description: 'Heat vents, exchangers, inlets and outlets are two times as effective per level of upgrade.',
			erequires: 'laboratory',
			ecost: 50,
			multiplier: 2,
			onclick: function(upgrade) {
				var part;

				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['heat_inlet' + i];
					part.transfer = part.part.base_transfer * (game.upgrade_objects['improved_heat_exchangers'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();

					part = game.part_objects['heat_outlet' + i];
					part.transfer = part.part.base_transfer * (game.upgrade_objects['improved_heat_exchangers'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();

					part = game.part_objects['heat_exchanger' + i];
					part.transfer = part.part.base_transfer * (game.upgrade_objects['improved_heat_exchangers'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();

					part = game.part_objects['vent' + i];
					part.vent = part.part.base_vent * (game.upgrade_objects['improved_heat_vents'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();
				}
			}
		},
		{
			id: 'fractal_piping',
			type: 'experimental_boost',
			title: 'Fractal Piping',
			description: 'Heat vents and exchangers hold two times their base heat per level of upgrade.',
			erequires: 'laboratory',
			ecost: 50,
			multiplier: 2,
			onclick: function(upgrade) {
				var part;

				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['vent' + i];
					part.containment = part.part.base_containment * (game.upgrade_objects['improved_heat_vents'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();

					part = game.part_objects['heat_exchanger' + i];
					part.containment = part.part.base_containment * (game.upgrade_objects['improved_heat_exchangers'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();
				}
			}
		},
		{
			id: 'ultracryonics',
			type: 'experimental_boost',
			title: 'Ultracryonics',
			description: 'Coolant cells hold two times their base heat per level of upgrade.',
			erequires: 'laboratory',
			ecost: 50,
			multiplier: 2,
			onclick: function(upgrade) {
				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['coolant_cell' + i];
					part.containment = part.part.base_containment * ( game.upgrade_objects['improved_coolant_cells'].level + 1 ) * Math.pow(2, upgrade.level);
					part.updateDescription();
				}
			}
		},
		{
			id: 'phlembotinum_core',
			type: 'experimental_boost',
			title: 'Phlembotinum Core',
			description: 'Increase the base heat and power storage of the reactor by four times per level of upgrade.',
			erequires: 'laboratory',
			ecost: 50,
			multiplier: 2,
			onclick: function(upgrade) {
				game.altered_max_power = game.base_max_power * Math.pow(4, upgrade.level);
				game.altered_max_heat = game.base_max_heat * Math.pow(4, upgrade.level);
			}
		},
		/* Killing these since they are OP
		{
			id: 'force_particle_research',
			type: 'experimental_boost',
			title: 'Force Particle Research',
			description: 'Increase the maximum heat Particle Accelerators can use to create Exotic Particles by two times per level of upgrade.',
			erequires: 'laboratory',
			ecost: 500,
			multiplier: 2,
			onclick: function(upgrade) {
				var part;

				for ( var i = 1; i <= 6; i++ ) {
					part = game.part_objects['particle_accelerator' + i];
					part.ep_heat = part.part.base_ep_heat * (game.upgrade_objects['improved_particle_accelerators'].level + 1) * Math.pow(2, upgrade.level);
					part.updateDescription();
				}
			}
		},*/
		{
			id: 'protium_cells',
			type: 'experimental_cells',
			title: 'Protium Cells',
			description: 'Allows you to use protium cells.',
			erequires: 'laboratory',
			ecost: 50,
			levels: 1,
			onclick: function(upgrade) {
				// Nothing, just required for placing parts
			}
		},
		{
			id: 'unstable_protium',
			type: 'experimental_cells_boost',
			title: 'Unstable Protium',
			description: 'Protium cells last half as long and product twice as much power and heat per level.',
			erequires: 'protium_cells',
			ecost: 500,
			multiplier: 2,
			onclick: function(upgrade) {
				for ( var i = 1; i <= 3; i++ ) {
					part = game.part_objects['protium' + i];
					part.base_heat = part.part.base_heat * Math.pow(2, upgrade.level) * Math.pow(2, game.upgrade_objects['unleashed_cells'].level);
					part.heat = part.part.heat * Math.pow(2, upgrade.level) * Math.pow(2, game.upgrade_objects['unleashed_cells'].level);
					part.base_power = part.part.base_power * (game.upgrade_objects['infused_cells'].level + 1) * Math.pow(2, upgrade.level) * Math.pow(2, game.upgrade_objects['unleashed_cells'].level);
					part.power = part.part.power * (game.upgrade_objects['infused_cells'].level + 1) * Math.pow(2, upgrade.level) * Math.pow(2, game.upgrade_objects['unleashed_cells'].level);
					part.ticks = Math.ceil(part.part.base_ticks / Math.pow(2, upgrade.level));
					part.updateDescription();
				}
			}
		},
		{
			id: 'heat_reflection',
			type: 'experimental_parts',
			title: 'Heat Reflection',
			description: 'Allows you to use Thermal Neutron Reflectors. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		},
		{
			id: 'experimental_capacitance',
			type: 'experimental_parts',
			title: 'Experimental Capacitance',
			description: 'Allows you to use Extreme Capacitors. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		},
		{
			id: 'vortex_cooling',
			type: 'experimental_parts',
			title: 'Vortex Cooling',
			description: 'Allows you to use Extreme Vents. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		},
		{
			id: 'underground_heat_extraction',
			type: 'experimental_parts',
			title: 'Underground Heat Extraction',
			description: 'Allows you to use Extreme Heat Exchangers. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		},
		{
			id: 'vortex_extraction',
			type: 'experimental_parts',
			title: 'Vortex Extraction',
			description: 'Allows you to use Extreme Heat Inlets. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		},
		{
			id: 'explosive_ejection',
			type: 'experimental_parts',
			title: 'Explosive Ejection',
			description: 'Allows you to use Extreme Heat Outlets. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		},
		{
			id: 'thermionic_conversion',
			type: 'experimental_parts',
			title: 'Thermionic Conversion',
			description: 'Allows you to use Thermionic Coolant Cells. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		},
		{
			id: 'micro_capacitance',
			type: 'experimental_parts',
			title: 'Micro Capacitance',
			description: 'Allows you to use Charged Reactor Plating. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		},
		{
			id: 'singularity_harnessing',
			type: 'experimental_parts',
			title: 'Singularity Harnessing',
			description: 'Allows you to use Black Hole Particle Accelerators. When purchased, the EP cost of other experimental part upgrades increases.',
			erequires: 'laboratory',
			ecost: 10000,
			levels: 1,
			onclick: function(upgrade) {
				game.epart_onclick(upgrade);
			}
		}
	];

	for ( var i = 1; i <= 6; i++ ) {
		upgrades.push({
			id: 'improved_particle_accelerators' + i,
			type: 'experimental_particle_accelerators',
			title: 'Improved ' + game.part_objects['particle_accelerator' + i].part.title,
			description: 'Increase the maximum heat that ' + game.part_objects['particle_accelerator' + i].part.title + 's can use to create Exotic Particles by 100% per level of upgrade.',
			erequires: 'laboratory',
			ecost: 200 * i,
			multiplier: 2,
			onclick: (function(i) {
				return function(upgrade) {
					var part;

					part = game.part_objects['particle_accelerator' + i];
					part.ep_heat = part.part.base_ep_heat * (upgrade.level + 1);
					part.updateDescription();
				}
			})(i)
		});
	}

	var types = [
		{
			type: 'cell_power',
			title: 'Potent ',
			description: ' cells produce 100% more power per level of upgrade.',
			onclick: function(upgrade) {
				game.update_cell_power();
				var part;
				for ( var i = 1; i <= 3; i++ ) {
					part = game.part_objects[upgrade.part.type + i];
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

		for ( var pi = 0, pl = game.parts.length; pi < pl; pi++ ) {
			part = game.parts[pi];

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
					classList: [part.type, type.type],
					part: part
				};

				upgrades.push(upgrade);
			}
		}
	}

	return upgrades;
};

})();
