/**
 * Highcharts plugin for rotating a 3D chart by dragging.
 *
 * Author: Paulo Costa
 * Version: 1.0.0
 *
 * Usage: Set options3d.drag.enabled = true
 */
(function (H) {
    var addEvent = H.addEvent;
    
    var defaultDragOptions = {
        enabled: false,
        minAlpha: -90,
        maxAlpha: +90,
        minBeta: -90,
        maxBeta: +90,
        snap: 0,
        speed: null,     // Dragging speed, in º/pixel. A good speed will be calculate on the fly if not specified
        flipAxes: false  // Automatically change axis positions according to the angles
    };

    H.wrap(H.Chart.prototype, 'init', function (proceed) {
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));
        
        var chart = this;
        if (!chart.is3d || !chart.is3d()) {
          return;
        }
        
        // Add mouse events for rotation
        var mouseDown = function (e) {
            var options3d = chart.options.chart.options3d,
                dragOptions = H.merge(defaultDragOptions, options3d.drag),
                eStart = chart.pointer.normalize(e),
                startAlpha = options3d.alpha,
                startBeta = options3d.beta,
                speed = H.pick(  // degree/pixel - higher is more sensitive
                    dragOptions.speed, 
                    360 / (Math.PI * Math.max(chart.plotWidth, chart.plotHeight, options3d.depth)));  // Calculate a "natural" speed, proportional to the chart's biggest dimension

            if (dragOptions.enabled) {
                setOrientation = function(newAlpha, newBeta) {
                    newAlpha = Math.min(dragOptions.maxAlpha, Math.max(dragOptions.minAlpha, newAlpha));
                    newBeta  = Math.min(dragOptions.maxBeta,  Math.max(dragOptions.minBeta,  newBeta ));
                    options3d.alpha = newAlpha;
                    options3d.beta  = newBeta;
                    
                    if (dragOptions.flipAxes) {
                        H.each(chart.xAxis, function(xAxis) {
                            xAxis.update({
                                opposite: newAlpha < 0
                            }, false);
                        });
                        H.each(chart.yAxis, function(yAxis) {
                            yAxis.update({
                                opposite: newBeta  < 0
                            }, false);
                        });
                        H.each(chart.zAxis, function(zAxis) {
                            zAxis.update({
                                opposite: newAlpha < 0
                            }, false);
                        });
                    }
                    chart.redraw(false);
                }
                
                var mouseMoved = function (e) {
                    //Calculate new angle
                    var newAlpha = startAlpha + (e.pageY - eStart.pageY) * speed;
                    var newBeta = startBeta + (eStart.pageX - e.pageX) * speed;
                    setOrientation(newAlpha, newBeta);
                };
                
                var mouseReleased = function (e) {
                    H.removeEvent(document, 'mousemove', mouseMoved);
                    H.removeEvent(document, 'touchdrag', mouseMoved);
                    H.removeEvent(document, 'mouseup',   mouseReleased);
                    H.removeEvent(document, 'touchend',  mouseReleased);
                    
                    debugger;
                    if (dragOptions.snap) {
                        var snapAlpha = Math.round(options3d.alpha / dragOptions.snap) * dragOptions.snap;
                        var snapBeta  = Math.round(options3d.beta / dragOptions.snap) * dragOptions.snap;
                        setOrientation(snapAlpha, snapBeta);
                    }
                };
                
                H.addEvent(document, 'mousemove', mouseMoved);
                H.addEvent(document, 'touchdrag', mouseMoved);
                H.addEvent(document, 'mouseup',   mouseReleased);
                H.addEvent(document, 'touchend',  mouseReleased);
            }
        }
        H.addEvent(document, 'mousedown', mouseDown);
        H.addEvent(document, 'touchstart', mouseDown);
    });
}(Highcharts));