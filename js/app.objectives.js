;(function() {

window.objectives = function(game) {
	return [
		{
			title: 'Place your first component in the reactor',
			reward: 10,
			check: function() {
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						if ( tile.activated === true && tile.part && tile.activated ) {
							return true;
						}
					}
				}

				return false;
			}
		},
		{
			title: 'Sell all your power by clicking "Sell"',
			reward: 10,
			check: function() {
				return game.sold_power;
			}
		},
		{
			title: 'Reduce your Current Heat to 0',
			reward: 10,
			check: function() {
				return game.sold_heat;
			}
		},
		{
			title: 'Put a Heat Vent next to a power Cell',
			reward: 50,
			check: function() {
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile.activated && tile_part.category === 'cell' && tile.ticks ) {
							var range = 1;

							// Find containment parts and cells within range
							for ( var ri2 = ri - 1; ri2 < game.rows && ri2 <= ri + 1; ri2++ ) {
								for ( ci2 = ci - 1; ci2 < game.cols && ci2 <= ci + 1; ci2++ ) {
									if ( ri2 === -1 || ci2 === -1 || ri2 === ri && ci2 === ci || (Math.abs(ri2 - ri) + Math.abs(ci2 - ci)) > range ) {
										continue;
									}

									var tile2 = game.tiles[ri2][ci2];

									if ( tile2.activated === true && tile2.part && tile2.part.category === 'vent' ) {
										return true;
									}
								}
							}
						}
					}
				}

				return false;
			}
		},
		{
			title: 'Purchase an Upgrade',
			reward: 100,
			check: function() {
				for ( var i = 0, l = game.upgrade_objects_array.length; i < l; i++ ) {
					var upgrade = game.upgrade_objects_array[i];

					if ( upgrade.level > 0 ) {
						return true;
					}
				}

				return false;
			}
		},
		{
			title: 'Purchase a Dual power Cell',
			reward: 25,
			check: function() {
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile_part.category === 'cell' && tile_part.cell_count === 2 ) {
							return true;
						}
					}
				}

				return false;
			}
		},
		{
			title: 'Have at least 10 active power Cells in your reactor',
			reward: 200,
			check: function() {
				var count = 0;

				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile_part.category === 'cell' && tile.ticks ) {
							count++;
						}
					}
				}

				return count >= 10;
			}
		},
		{
			title: 'Perchase a Perpetual power Cell upgrade',
			reward: 1000,
			check: function() {
				for ( var i = 0, l = game.upgrade_objects_array.length; i < l; i++ ) {
					var upgrade = game.upgrade_objects_array[i];

					if ( upgrade.upgrade.type === 'cell_perpetual_upgrades' && upgrade.level > 0 ) {
						return true;
					}
				}

				return false;
			}
		},
		{
			title: 'Increase your max power with a Capacitor',
			reward: 100,
			check: function() {
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile_part.category === 'capacitor' ) {
							return true;
						}
					}
				}

				return false;
			}
		},
		{
			title: 'Generate at least 200 power per tick',
			reward: 1000,
			check: function() {
				return game.stats_power >= 200 && !game.paused;
			}
		},
		{
			title: 'Purchase one Improved Chronometers upgrade',
			reward: 5000,
			check: function() {
				return game.upgrade_objects['chronometer'].level > 0;
			}
		},
		{
			title: 'Have 5 different kinds of components in your reactor',
			reward: 2000,
			check: function() {
				var count = 0;
				var founds = {};

				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && !founds[tile_part.category] ) {
							count++;
							founds[tile_part.category] = true;
						}
					}
				}

				return count >= 5;
			}
		},
		{
			title: 'Have at least 10 Capacitors your reactor',
			reward: 5000,
			check: function() {
				var count = 0;

				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile_part.category === 'capacitor' ) {
							count++;
						}
					}
				}

				return count >= 10;
			}
		},
		{
			title: 'Generate at least 500 power per tick',
			reward: 5000,
			check: function() {
				return game.stats_power >= 500 && !game.paused;
			}
		},
		{
			title: 'Upgrade Potent Uranium Cell to level 3 or higher',
			reward: 25000,
			check: function() {
				return game.upgrade_objects['cell_power_uranium'].level > 2;
			}
		},
		{
			title: 'Auto-sell at least 500 power per tick',
			reward: 40000,
			check: function() {
				return game.stats_cash >= 500;
			}
		},
		{
			title: 'Have at least 5 active Quad Plutonium Cells in your reactor',
			reward: 1000000,
			check: function() {
				var count = 0;
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile.ticks && tile_part.id === 'plutonium3' ) {
							count++;
						}
					}
				}

				return count >= 5;
			}
		},
		{
			title: 'Expand your reactor 4 times in either direction',
			reward: 100000000,
			check: function() {
				return game.upgrade_objects['expand_reactor_rows'].level >= 4 || game.upgrade_objects['expand_reactor_cols'].level >= 4;
			}
		},
		{
			title: 'Have at least 5 active Quad Thorium Cells in your reactor',
			reward: 100000000,
			check: function() {
				var count = 0;
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile.ticks && tile_part.id === 'thorium3' ) {
							count++;
						}
					}
				}

				return count >= 5;
			}
		},
		{
			title: 'Have at least $' + fmt(10000000000) + ' total',
			reward: 10000000000,
			check: function() {
				return game.current_money >= 10000000000;
			}
		},
		{
			title: 'Have at least 5 active Quad Seaborgium Cells in your reactor',
			reward: 100000000000,
			check: function() {
				var count = 0;
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile.ticks && tile_part.id === 'seaborgium3' ) {
							count++;
						}
					}
				}

				return count >= 5;
			}
		},
		{
			title: 'Generate 10 Exotic Particles with Particle Accelerators',
			reward: 10000000000000,
			check: function() {
				return game.exotic_particles >= 10;
			}
		},
		{
			title: 'Generate 51 Exotic Particles with Particle Accelerators',
			ep_reward: 50,
			check: function() {
				return game.exotic_particles >= 51;
			}
		},
		{
			title: 'Reboot your reactor in the Experiments tab',
			ep_reward: 50,
			check: function() {
				return game.current_exotic_particles > 0;
			}
		},
		{
			title: 'Purchase an Experimental Upgrade',
			ep_reward: 50,
			check: function() {
				for ( var i = 0, l = game.upgrade_objects_array.length; i < l; i++ ) {
					var upgrade = game.upgrade_objects_array[i];

					if ( upgrade.upgrade.id !== 'laboratory' && upgrade.ecost > 0 && upgrade.level > 0 ) {
						return true;
					}
				}

				return false;
			}
		},
		{
			title: 'Have at least 5 active Quad Dolorium Cells in your reactor',
			reward: 1000000000000000,
			check: function() {
				var count = 0;
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile.ticks && tile_part.id === 'dolorium3' ) {
							count++;
						}
					}
				}

				return count >= 5;
			}
		},
		{
			title: 'Generate ' + fmt(1000) + ' Exotic Particles with Particle Accelerators',
			ep_reward: 1000,
			check: function() {
				return game.exotic_particles >= 1000;
			}
		},
		{
			title: 'Have at least 5 active Quad Nefastium Cells in your reactor',
			reward: 100000000000000000,
			check: function() {
				var count = 0;
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile.ticks && tile_part.id === 'nefastium3' ) {
							count++;
						}
					}
				}

				return count >= 5;
			}
		},
		{
			title: 'Place an experimental part in your reactor.',
			ep_reward: 10000,
			check: function() {
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile.activated === true && tile_part && tile_part.part.level === 6 ) {
							return true;
						}
					}
				}

				return false;
			}
		},
		{
			title: 'All objectives completed!',
			check: function() {
				return false;
			}
		}
	];
};

})();