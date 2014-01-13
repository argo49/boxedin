/*
 * BoxedIn.js v 0.1.0
 *
 * Tyler Argo, 2014
 */

var BoxedIn = $B = function() {

    _addCSS('boxedin');

	/* A Box 
	 *
	 * color: String
     * title: String, a fixed title
	 * backgroundImage: {src:String - path to image, fixed: Boolean}
	 * id: String
	 * addClass: String
	 * appendTo: String - sizzle selector to attach box to
	 * shadow: String - top, bottom, none - default is bottom
     * theme: String - light, dark
     *
     * TODO: theme, textBg
	 */
	function createLayer(options) {

		// Validate the provided options
		var layerColor     = _validateColor(options.color);
		var layerShadow    = _validateShadow(options.shadow);
		var layerImage     = _validateBackgroundImage(options.backgroundImage);
        var layerScroll    = _validateString(options.scrollbar);
        var layerTitle     = _validateString(options.title);
        var layerTextColor = _validateColor(options.textColor);
        var layerTitleColor= _validateColor(options.titleColor);
        var layerId        = _validateString(options.id);
        var layerClasses   = _validateString(options.addClass);
        var layerHook      = _validateSelector(options.appendTo);
        var layerTheme     = _validateString(options.theme);

		// Create the html for the layer and add classes
		var layer = $('<div/>')
    		.addClass('boxedIn boxedIn-layer boxedIn-shadow' + layerShadow)
    		.css({
    			backgroundColor: layerColor
    		});

        // Create fixed title if one is specified
        if (layerTitle) {
            layer.append($('<h1/>')
                .addClass('boxedIn-layerTitle')
                .append($('<span/>').text(layerTitle)));
        }
		
        // Create the layer content container (think of it as the viewport)
        var layerContainer = $('<div/>')
            .addClass('boxedIn-contentContainer')
            .append($('<div/>')
                .addClass('boxedIn-slide'))
            .appendTo(layer);
            
        // If there is no title, make the container take up all the height of the layer
        if (!layerTitle) {
            layerContainer.css('height', '90%');
        }

		// Apply background image
		if (layerImage.src != "none") {
			layer.css('background-image', 'url(' + layerImage.src + ')');
		}

        // Set the fixed nature of the layer background image
        if (typeof layerImage.fixed === "boolean" && !layerImage.fixed) {
            layer.css('background-attachment', 'scroll');
        }

        // Set the theme
        if (layerTheme) {
            layer.addClass("boxedIn-" + layerTheme);
            if (layerTextColor != _defaultColor) {
                layer.css('color', layerTextColor);
            }
        } else {
            layer.css('color', layerTextColor);
        }

        // Set title color
        if (layerTitleColor != _defaultColor && layerTitle) {
            layer.find('h1').css('color', layerTitleColor);
        }

        // Add id
        if (layerId) {
            layer.attr('id') = layerId;
        }

        // Add classes
        if (layerClasses) {
            layer.addClass(layerClasses);
        }

        // Add navigation box
        var layerDots = $('<div/>')
            .addClass('boxedIn-dotContainer')
                .append($('<div/>').addClass('boxedIn-dotBar'))
            .appendTo(layer);

		// Insert into DOM
		if (layerHook) {
			layer.appendTo(layerHook);
		} else {
			layer.appendTo('body');
		}

        // Set the current pane index
        layer.data('currPane', 0);

		return layer;
	}

    /*
     * title: String
     * content: Array of jQuery objects
     * scrollbar: String: light, dark
     */
    function addPane(layer, options) {
        var pane;
        var baseLayer = _validateSelector(layer);

        if (baseLayer && baseLayer.hasClass('boxedIn-layer')) {
            pane = $('<div/>').addClass('boxedIn-pane');
            var paneTitle   = _validateString(options.title);
            var paneContent = _validateArray(options.content);
            var paneScroll  = _validateString(options.scrollbar);

            // Set pane title
            if (paneTitle) {
                var title = $('<h2/>').text(paneTitle);
                title.appendTo(pane);
            }

            // Add pane content
            if (paneContent) {
                for (var i = 0; i < paneContent.length; i++) {
                    var jqSelector = _validateSelector(paneContent[i])

                    if (jqSelector) {
                           jqSelector.appendTo(pane);
                    }
                }
            }

            // Set scrollbar type
            if (paneScroll) {
                pane.addClass('boxedIn-' + paneScroll.toLowerCase() + 'Scrollbar');
            } else {
                pane.addClass('boxedIn-lightScrollbar');
            }

            // Create atomic pane container 
            var paneContainer = $('<div/>').addClass('boxedIn-paneContainer');
            pane.appendTo(paneContainer);

            // Add to the number of panes in the layer
            if (!baseLayer.data('panes')) {
                baseLayer.data('panes', 1);

                // Insert pane into DOM
                paneContainer.appendTo(baseLayer.find('.boxedIn-slide'));

            } else {
                
                // add nav dot for first pane
                if (baseLayer.data('panes') == 1) {
                    _addNavDot(baseLayer);
                    _addNavArrows(baseLayer);
                }

                baseLayer.data('panes', baseLayer.data('panes') + 1);

                // Insert pane into DOM
                paneContainer.appendTo(baseLayer.find('.boxedIn-slide'));

                _addNavDot(baseLayer);
                _activateNavDot(baseLayer, baseLayer.data('currPane'));

            }

            // Probably shouldnt do this with javascript but oh well
            window.setTimeout(function(){update(baseLayer)}, 200);

        } else {
            console.warn('Layer provided for pane with selector "', layer, '" is not a valid layer.');
        }

        return pane;
    }

    function update(layer) {
        var slide          = layer.find('.boxedIn-slide');
        var paneContainers = slide.children();
        var layerWidth     = layer.width();
        var layerHeight    = layer.height();
        var numOfPanes     = paneContainers.length;

        slide.width(numOfPanes * layerWidth);
        paneContainers.width(layerWidth);

        // Vertially center the paneContainers
        paneContainers.each(function(){
            var pane                = $(this).children().first();
            var paneHeight          = pane.height();
            var paneContainerHeight = pane.parent().height();
            var middle              = (paneContainerHeight / 2);
            var paneTwoThirdsHeight = paneHeight * (2 / 3);
            var newTop              = middle - paneTwoThirdsHeight;

            if (newTop > 0 && paneHeight < paneContainerHeight) {
                pane.css('top', newTop);
            } else {
                pane.css('top', 0);
            }
        });
    }

    function _addNavDot(layer) {
        // Get title of the pane
        var tooltip = layer.find('.boxedIn-pane h2').last().text();

        // Create nav dot
        var newNavDot = $('<div/>')
            .addClass('boxedIn-dot')
            .attr('title', tooltip);
        
        // Append to DOM
        newNavDot.appendTo(layer.find('.boxedIn-dotBar'));

        newNavDot.data('index', layer.data('panes') - 1);

        newNavDot.on('click', function() {
            var curr = layer.data('currPane');
            var idx  = $(this).data('index');
            var step = Math.abs(curr - idx);
            var dir;

            if (curr > idx) {
                dir = 'left'
            } else {
                dir = 'right';
            }

            _slide(layer, dir, step);
        });

        return newNavDot;
    }

    function _addNavArrows(layer) {
        var leftArrow  = $('<div/>').addClass('boxedIn-navArrow boxedIn-leftArrow');
        var rightArrow = $('<div/>').addClass('boxedIn-navArrow boxedIn-rightArrow');

        leftArrow.on('click', function(){
            var step = (layer.data('currPane') == 0)? 0 : 1;
            _slide(layer, "left", step);
        });

        rightArrow.on('click', function(){
            var numOfPanes = layer.data('panes');
            var step = (layer.data('currPane') == (numOfPanes-1))? 0 : 1;
            _slide(layer, "right", step);
        });

        var arrows = leftArrow.add(rightArrow);

        arrows.prependTo(layer.find('.boxedIn-contentContainer'));
        return arrows;
    }

    // dir: "left" || "right"
    function _slide(layer, dir, steps) {
        var unit   = layer.width();
        var slide  = layer.find('.boxedIn-slide');
        var dirMod = (dir == "left")? 1 : -1;
        //var arrows         = layer.find('.boxedIn-navArrow');

        var dist = (dirMod * unit * steps);
        slide.animate({left: '+=' + dist + 'px'});
        //arrows.animate({left: '+=' + (-dist) + 'px'});

        layer.data('currPane', (layer.data('currPane') + steps * -dirMod));
        _activateNavDot(layer, layer.data('currPane'));
    }

    function _activateNavDot(layer, idx) {
        if (layer.data('panes') > 1) {
            var dots = layer.find('.boxedIn-dot');
            dots.removeClass('boxedIn-dotActive');
            $(dots[idx]).addClass('boxedIn-dotActive');
        }
    }

    // Returns a jquery handle on the layer. Add a selector if layers are nested inside an element
	function getLayer(index, selector) {
		var layer;

		if (_validateSelector(selector)) {
			layer = $($(selector).find('.boxedIn-layer')[index]);
			layer = checklayer(layer);
		} else {
			layer = $($('.boxedIn-layer')[index]);
			layer = checkLayer(layer);
		}

		function checkLayer(layer){
			if (!layer || layer.length == 0) {
				console.warn('No boxes were found with the selector', selector, 'at index', index);
			} else {
				return layer;
			}
		}

		return layer;
	}

    function setDefaultColor(color) {
        _defaultColor = _validateColor(color);
    }

    function getDefaultColor() {
        return _defaultColor;
    }

	var _colors = {
        blue:   "#009DFF",
        violet: "#6A02E8",
        red:    "#FF0000",
        orange: "#E88600",
        yellow: "#FFFA0D",
        green:  "#52B700",
        black:  "#000000"
    };

    var _defaultColor = _colors.black;

    function _validateString(str) {
        if (typeof str === "string") {
            return str;
        } 
    }

    function _validateBoolean(bool) {
        if (typeof bool === "boolean") {
            return bool;
        } 
    }

    function _validateBackgroundImage(bg) {
    	var imgSrc = "none";
        var fixed;

    	if (!bg || typeof bg.src !== "string") {
    		// Do nothing
    	} else {
    		var imgRegex = /\.\w{3}$/;
    		if (imgRegex.test(bg.src)) {
    			imgSrc = bg.src;
    		} else {
    			console.warn("Invalid image path: ", bg.src);
    		}

            fixed = _validateBoolean(bg.fixed);
    	}

    	return {src:imgSrc, fixed:fixed};
    }

    function _validateShadow(shadow) {
    	var boxShadow = "Bottom";

    	if (shadow && typeof shadow === "string") {
    		var lowerShadow = shadow.toLowerCase();

    		if (lowerShadow == "top") {
    			boxShadow = "Top";
    		} else if (lowerShadow == "none") {
    			boxShadow = "None";
    		}
    	}

    	return boxShadow;
    }

    function _validateSelector(selector){
    	var jqHandle = $(selector);

    	if (jqHandle.length > 0) {
    		return jqHandle;
    	}
    }

	function _validateColor(color) {
    	var defaultColor = _defaultColor;
    	var hexColorRegex = /^#(?:[0-9a-f]{3}){1,2}$/i;
    	var boxColor;

        // If color is a hex code, is good
        if (hexColorRegex.test(color)) {
        	boxColor = color;
        } else  {
        	var colorNames = [];

	     	for (specificColor in _colors){
	     		colorNames.push(String(specificColor));
        	}
        	
        	// If it's a predefined color, is good
        	if ($.inArray(color, colorNames) > -1) {
        		boxColor = _colors[color];
        	}

        }

        if (!boxColor) {
        	boxColor = defaultColor;
            if (color) {
        	   console.warn('"', color, '" is a not valid color. Default color (' + defaultColor + ') was chosen.');
            }
        }

        return boxColor;
    }

    function _validateArray(arr) {
        if ($.isArray(arr)) {
            return arr;
        }
    }


    function _addCSS(id) {
        if (!document.getElementById(id)) {
            var head   = document.getElementsByTagName('head')[0];
            var link   = document.createElement('link');
            link.id    = id;
            link.rel   = 'stylesheet';
            link.type  = 'text/css';
            link.href  = 'css/' + id + '.css';
            link.media = 'all';
            head.appendChild(link);
        }
    }

    function _removeCSS(id) {
        var linkElement = document.getElementById(id)
        if (linkElement) {
            linkElement.parentElement.removeChild(linkElement);
        }
    }

    $(window).resize(function(){
        var layers = $('.boxedIn-layer');
        // Probably shouldnt do this with javascript but oh well
        update(layers);
    });

	return {
		createLayer: createLayer,
        getLayer: getLayer,
        setDefaultColor: setDefaultColor,
        getDefaultColor: getDefaultColor,
        addPane: addPane,
        update: update
	};
}();