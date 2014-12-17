/*!
 * jQuery VGrid v0.1.9 - variable grid layout plugin
 *
 * Terms of Use - jQuery VGrid
 * under the MIT (http://www.opensource.org/licenses/mit-license.php) License.
 *
 * Copyright 2009-2012 xlune.com All rights reserved.
 * (http://blog.xlune.com/2009/09/jqueryvgrid.html)
 */
(function($) {
	var matrixTrimWidth = function(a, b) {
		if (a[0] >= b[0] && a[0] < b[1] || a[1] >= b[0] && a[1] < b[1]) {
			if (a[0] >= b[0] && a[0] < b[1]) {
				a[0] = b[1];
			} else {
				a[1] = b[0];
			}
		}
		return a;
	};

	var getSize = function($child) {
		var w = $child.outerWidth(true);
		var h = $child.outerHeight(true);
		return [w, h];
	};

	var heightTo = function($self) {
		var delay = $self.data('_vgchild').length * ($self.data('_vgopt').delay || 0) + $self.data('_vgopt').time || 500;
		$self.stop();
		var height = $self.data('_vgwrapheight');
		if ($self.height() < height) {
			$self.height($self.data('_vgwrapheight'));
		} else {
			clearTimeout($self.data('_vgwraptimeout'));
			$self.data('_vgwraptimeout', setTimeout(function() {
				$self.height(height);
			}, delay));
		}
	};

	var moveTo = function($childs) {
		$childs.each(function(i) {
			var $child = $(this);
			if ($.support.transition) {
				$child.css('x', $child.data('_vgleft') + 'px');
				$child.css('y', $child.data('_vgtop') + 'px');
			} else {
				$child.css('left', $child.data('_vgleft') + 'px');
				$child.css('top', $child.data('_vgtop') + 'px');
			}
		});
	};

	var animateTo = function($childs, easing, time, delay) {
		var $self = $childs.parent();
		var isMove = false;
		var imax = $childs.length;
		var $c;
		var pos;
		for (var i = 0; i < imax; i++) {
			$c = $($childs[i]);
			pos = $c.position();
			if (pos.left != $c.data('_vgleft') || pos.top != $c.data('_vgtop')) {
				isMove = true;
			}
		}
		if (isMove) {
			$self.trigger('vgrid_start');

			$childs.each(function(i) {
				var $child = $(this);
				var opt = {
					duration: time,
					easing: easing
				};
				if ($childs.size() - 1 === i) {
					opt.complete = function() {
						$self.trigger('vgrid_finish');
					};
				}
				clearTimeout($child.data('_vgtimeout'));
				$child.data('_vgtimeout', setTimeout(function() {
					if ($.support.transition) {
						$child.transition($.extend({}, opt, {
							x: $child.data('_vgleft') + 'px',
							y: $child.data('_vgtop') + 'px'
						}));
					} else {
						$child.animate({
							left: $child.data('_vgleft') + 'px',
							top: $child.data('_vgtop') + 'px'
						}, opt);
					}
				}, i * delay));
			});
		}
	};

	var refreshHandler = function($tg) {
		$tg.each(function(num) {
			var $self = $(this);
			clearTimeout($self.data('_vgtimeout'));
			$self.data('_vgtimeout', setTimeout(function() {
				makePos($self);

				var opt = $self.data('_vgopt');
				var easing = opt.easing || 'linear';
				var time = opt.time || 500;
				var delay = opt.delay || 0;
				animateTo($self.data('_vgchild'), easing, time, delay);
			}, 500));
		});
	};

	var makePos = function($self) {
		var $childs = $self.data('_vgchild');
		var width = $self.width();
		var matrix = [
			[0, width, 0]
		];
		var hmax = 0;
		$childs.each(function(i) {
			var $c = $(this);
			var size = getSize($c);
			var point = getAttachPoint(matrix, size[0]);
			matrix = updateAttachArea(matrix, point, size);
			hmax = Math.max(hmax, point[1] + size[1]);
			$c.data('_vgleft', point[0]);
			$c.data('_vgtop', point[1]);
		});
		$self.data('_vgwrapheight', hmax);
		heightTo($self);
	};

	var getAttachPoint = function(mtx, width) {
		var mtx = mtx.concat().sort(matrixSortDepth);
		var max = mtx[mtx.length - 1][2];
		for (var i = 0, imax = mtx.length; i < imax; i++) {
			if (mtx[i][2] >= max) {
				break;
			}
			if (mtx[i][1] - mtx[i][0] >= width) {
				return [mtx[i][0], mtx[i][2]];
			}
		}
		return [0, max];
	};

	var updateAttachArea = function(mtx, point, size) {
		var mtx = mtx.concat().sort(matrixSortDepth);
		var cell = [point[0], point[0] + size[0], point[1] + size[1]];
		for (var i = 0, imax = mtx.length; i < imax; i++) {
			if (cell[0] <= mtx[i][0] && mtx[i][1] <= cell[1]) {
				delete mtx[i];
			} else {
				mtx[i] = matrixTrimWidth(mtx[i], cell);
			}
		}
		return matrixJoin(mtx, cell);
	};
	var matrixSortDepth = function(a, b) {
		if (!a || !b) {
			return 0;
		}
		return ((a[2] == b[2] && a[0] > b[0]) || a[2] > b[2]) ? 1 : -1;
	};

	var matrixSortX = function(a, b) {
		if (!a || !b) {
			return 0;
		}
		return (a[0] > b[0]) ? 1 : -1;
	};

	var matrixJoin = function(mtx, cell) {
		var mtx = mtx.concat([cell]).sort(matrixSortX);
		var mtx_join = [];
		for (var i = 0, imax = mtx.length; i < imax; i++) {
			if (!mtx[i]) {
				continue;
			}
			if (mtx_join.length > 0 && mtx_join[mtx_join.length - 1][1] == mtx[i][0] && mtx_join[mtx_join.length - 1][2] == mtx[i][2]) {
				mtx_join[mtx_join.length - 1][1] = mtx[i][1];
			} else {
				mtx_join.push(mtx[i]);
			}
		}
		return mtx_join;
	};

	var setFontSizeListener = function(self, func) {
		var s = $('<span />').text(' ').prop('id', '_vgridspan').hide().appendTo('body');
		s.data('size', s.css('font-size'));
		s.data('timer', setInterval(function() {
			if (s.css('font-size') != s.data('size')) {
				s.data('size', s.css('font-size'));
				func(self);
			}
		}, 1000));
	};

	var setImgLoadEvent = function($self, func) {
		if (!$self.data('vgrid-image-event-added')) {
			$self.data('vgrid-image-event-added', 1);
			$self.on('vgrid-added', function() {
				$self.find('img').each(function() {
					var $img = $(this);
					if (!$img.data('vgrid-image-handler')) {
						$img.data('vgrid-image-handler', 1);
						$img.on('load', function() {
							func($self);
						});
					}
				});
			});
		}
		$self.triggerHandler('vgrid-added');
		var append = $self.append;
		var prepend = $self.prepend;
		$self.append = function() {
			append.apply($self, arguments);
			$self.triggerHandler('vgrid-added');
		};
		$self.prepend = function() {
			prepend.apply($self, arguments);
			$self.triggerHandler('vgrid-added');
		};
	};

	$.fn.extend({
		vgrid: function(option) {
			var $target = $(this);
			$target.each(function() {
				var opt = $.extend({
					time: 500,
					delay: 0,
					easing: 'linear',
					autoResize: true
				}, option);

				var $self = $(this);
				var $child = $self.find('> *');
				$self.data('_vgopt', opt);
				$self.data('_vgchild', $child);
				$self.data('_vgdefchild', $child);
				$self.css({
					position: 'relative'
				});
				$child.css('position', 'absolute');
				makePos($self);
				moveTo($child);
				if (opt.fadeIn) {
					var $prop = (function() {
						if (typeof(opt.fadeIn) === 'object') {
							return opt.fadeIn;
						} else {
							return {
								time: opt.fadeIn
							};
						}
					})();

					$child.each(function(i) {
						var $c = $(this);
						$c.css({
							opacity: 0
						}).show().stop();
						setTimeout(function() {
							if ($.support.transition) {
								$c.show().transition({
									opacity: 1
								}, $prop.time || 250);
							} else {
								$c.stop().fadeTo($prop.time || 250, 1);
							}
						}, i * ($prop.delay || 0));
					});
				} else {
					$child.show();
				}
				$(window).resize(function(e) {
					if (opt.autoResize !== true) {
						return;
					}
					refreshHandler($self);
				});
				if (opt.useLoadImageEvent) {
					setImgLoadEvent($self, refreshHandler);
				}
				if (opt.useFontSizeListener) {
					setFontSizeListener($self, refreshHandler);
				}

				$self.triggerHandler('vgrid_init');
			});
			return $target;
		},
		vgrefresh: function(easing, time, delay, func) {
			var $target = $(this);
			$target.each(function() {
				var $obj = $(this);
				var opt = $obj.data('_vgopt') || {};
				if ($obj.data('_vgchild')) {
					var $child = $obj.find('> *');
					$obj.data('_vgchild', $child);
					$child.css('position', 'absolute');
					makePos($obj);
					time = typeof(time) === 'number' ? time : opt.time;
					delay = typeof(delay) === 'number' ? delay : opt.delay;
					easing = easing || opt.easing;
					animateTo($child, easing, time, delay);
					if (typeof(func) === 'function') {
						setTimeout(func, ($child.length * delay) + time);
					}
				}
				if (opt.useLoadImageEvent) {
					setImgLoadEvent($obj, refreshHandler);
				}
			});
			return $target;
		},
		vgsort: function(func, easing, time, delay) {
			var $target = $(this);
			$target.each(function() {
				var $obj = $(this);
				if ($obj.data('_vgchild')) {
					var opt = $obj.data('_vgopt') || {};
					var $child = $obj.data('_vgchild');

					$obj.data('_vgchild', $child.sort(func));
					$child.each(function(num) {
						$(this).appendTo($obj);
					});
					makePos($obj);

					easing = easing || opt.easing;
					time = typeof(time) === 'number' ? time : opt.time;
					delay = typeof(delay) === 'number' ? delay : opt.delay;
					animateTo($child, easing, time, delay);
				}
			});
			return $target;
		},
		vgheight: function() {
			var $target = $(this);
			return $target.data('_vgwrapheight');
		},
		vgoption: function() {
			var option = {};
			if ($.isPlainObject(arguments[0])) {
				option = arguments[0];
			} else {
				option[arguments[0]] = arguments[1];
			}

			var $target = $(this);
			$target.each(function() {
				var $self = $(this);
				var data = $self.data('_vgopt');
				if (data == null) {
					return;
				}

				data = $.extend(data, option);
				$self.data('_vgopt', data);
			});
		}
	});
})(jQuery);
