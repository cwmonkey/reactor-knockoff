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
						if ( tile.part && tile.activated ) {
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
			reward: 10,
			check: function() {
				for ( var ri = 0; ri < game.max_rows; ri++ ) {
					var row = game.tiles[ri];

					for ( var ci = 0; ci < game.max_cols; ci++ ) {
						var tile = row[ci];
						var tile_part = tile.part;

						if ( tile_part && tile.activated && tile_part.category === 'cell' && tile.ticks ) {
							var range = 1;

							// Find containment parts and cells within range
							for ( var ri2 = ri - 1; ri2 < game.rows && ri2 <= ri + 1; ri2++ ) {
								for ( ci2 = ci - 1; ci2 < game.cols && ci2 <= ci + 1; ci2++ ) {
									if ( ri2 === -1 || ci2 === -1 || ri2 === ri && ci2 === ci || (Math.abs(ri2 - ri) + Math.abs(ci2 - ci)) > range ) {
										continue;
									}

									var tile2 = game.tiles[ri2][ci2];

									if ( tile2.part && tile2.part.category === 'vent' ) {
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
			title: 'All objectives completed!',
			check: function() {
				return false;
			}
		}
	];
};

})();