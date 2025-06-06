/**
 * Highcharts plugin for rotating a 3D chart by dragging.
 *
 * Author: Paulo Costa
 *
 * Usage: Set options3d.drag.enabled = true
 */
/*global module, Highcharts, document*/

(function (factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory;
  } else {
    factory(Highcharts);
  }
})(function (H) {
  "use strict";

  H.getOptions().chart.options3d.drag = {
    enabled: false,
    minAlpha: -90,
    maxAlpha: 90,
    minBeta: -90,
    maxBeta: 90,
    snap: 0,
    animateSnap: false,
    speed: null, // Dragging speed, in º/pixel. A good speed will be calculate on the fly if not specified
    flipAxes: false, // Automatically change axis positions according to the angles
    beforeDrag: null, //Callback invoked when the drag starts
    afterDrag: null, //Callback invoked when the drag ends
  };

  H.wrap(H.Chart.prototype, "init", function (proceed) {
    proceed.apply(this, Array.prototype.slice.call(arguments, 1));

    var chart = this;
    if (!chart.is3d || !chart.is3d()) {
      return;
    }

    // Add mouse events for rotation
    var mouseDown = function (e) {
      //Only drag with left button
      if (H.defined(e.button) && e.button !== 0) {
        return;
      }

      //Don't perform dragging from a menu
      if (
        chart.pointer.inClass(e.target, "highcharts-contextbutton") ||
        chart.pointer.inClass(e.target, "highcharts-contextmenu")
      ) {
        return;
      }

      var options3d = chart.options.chart.options3d,
        dragOptions = options3d.drag,
        eStart = chart.pointer.normalize(e),
        startAlpha = options3d.alpha,
        startBeta = options3d.beta,
        speed = H.pick(
          // degree/pixel - higher is more sensitive
          dragOptions.speed,
          (H.pick(dragOptions.speedScale, 1) * 360) /
            (Math.PI *
              Math.max(chart.plotWidth, chart.plotHeight, options3d.depth)),
        ); // Calculate a "natural" speed, proportional to the chart's biggest dimension

      if (!dragOptions.enabled) {
        return;
      }
      if (startAlpha > 180) {
        startAlpha -= 360;
      }
      if (startBeta > 180) {
        startBeta -= 360;
      }

      chart.container.setPointerCapture(e.pointerId);

      var setOrientation = function (newAlpha, newBeta, animate) {
        newAlpha = Math.min(
          dragOptions.maxAlpha,
          Math.max(dragOptions.minAlpha, newAlpha),
        );
        newBeta = Math.min(
          dragOptions.maxBeta,
          Math.max(dragOptions.minBeta, newBeta),
        );
        options3d.alpha = newAlpha;
        options3d.beta = newBeta;

        if (dragOptions.flipAxes) {
          chart.xAxis.forEach(function (axis) {
            var opposite = newAlpha < 0;
            if (opposite !== axis.opposite) {
              axis.update(
                {
                  opposite: opposite,
                },
                animate,
              );
            }
          });
          // chart.yAxis.forEach(function (axis) {
          //   var opposite = newBeta < 0;
          //   if (opposite !== axis.opposite) {
          //     axis.update(
          //       {
          //         opposite: opposite,
          //       },
          //       animate,
          //     );
          //   }
          // });
          chart.zAxis.forEach(function (axis) {
            var opposite = newAlpha < 0;
            if (opposite !== axis.opposite) {
              axis.update(
                {
                  opposite: opposite,
                },
                animate,
              );
            }
          });
        }

        //Tooltips get misplaced after rotation, so it's better to just get rid of it.
        chart.tooltip.hide(0);

        chart.redraw(animate);
      };

      var pointerMoved, pointerReleased;

      pointerMoved = function (e) {
        //Calculate new angle
        e = chart.pointer.normalize(e);
        var newAlpha = startAlpha + (e.chartY - eStart.chartY) * speed;
        var newBeta = startBeta + (eStart.chartX - e.chartX) * speed;
        setOrientation(newAlpha, newBeta, false);
      };

      pointerReleased = function (e) {
        chart.container.removeEventListener("pointermove", pointerMoved);
        chart.container.removeEventListener("pointerup", pointerReleased);
        chart.container.releasePointerCapture(e.pointerId);

        e = chart.pointer.normalize(e);
        var newAlpha = startAlpha + (e.chartY - eStart.chartY) * speed;
        var newBeta = startBeta + (eStart.chartX - e.chartX) * speed;

        if (dragOptions.snap) {
          newAlpha = Math.round(newAlpha / dragOptions.snap) * dragOptions.snap;
          newBeta = Math.round(newBeta / dragOptions.snap) * dragOptions.snap;
        }

        if (dragOptions.animateSnap) {
          var callbackCalled = false;
          setOrientation(newAlpha, newBeta, {
            complete: function () {
              //https://github.com/highcharts/highcharts/issues/7146
              if (!this.element)
                // Skip no-animation callbacks
                return;
              if (callbackCalled)
                //No double-callbacks
                return;

              callbackCalled = true;
              if (dragOptions.afterDrag) {
                dragOptions.afterDrag();
              }
            },
          });
        } else {
          setOrientation(newAlpha, newBeta, false);
          if (dragOptions.afterDrag) {
            dragOptions.afterDrag();
          }
        }
      };

      if (dragOptions.beforeDrag) {
        dragOptions.beforeDrag();
      }
      chart.container.addEventListener("pointermove", pointerMoved);
      chart.container.addEventListener("pointerup", pointerReleased);
    };
    chart.container.addEventListener("pointerdown", mouseDown);
  });
});
