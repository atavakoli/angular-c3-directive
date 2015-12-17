(function() {
'use strict';

angular.module('c3', [])

.directive('c3', function() {
  console.log('loading directive');

  function getUnload(prev, curr) {
    function getKeys(src) {
      var keys;
      if (src && src.columns && src.columns.length) {
        keys = {};
        src.columns.forEach(function(data) {
          keys[data[0]] = true;
        });
        return keys;
      } else if (src && src.rows && src.rows.length) {
        keys = {};
        src.rows[0].forEach(function(key) {
          keys[key] = true;
        });
        return keys;
      } else if (src && src.keys & src.keys.value && src.keys.value.length) {
        keys = {};
        if (src.keys.hasOwnProperty('x')) {
          keys[src.keys.x] = true;
        }
        src.keys.value.forEach(function(key) {
          keys[key] = true;
        });
      } else {
        return false;
      }
    }

    var prevKeys = getKeys(prev);
    if (!prevKeys) {
      return false;
    }

    var currKeys = getKeys(curr);
    if (!currKeys) {
      return Object.keys(prevKeys);
    }

    var delta = [];
    Object.keys(prevKeys).forEach(function(key) {
      if (!currKeys.hasOwnProperty(key)) {
        delta.push(key);
      }
    });

    return (delta.length ? delta : false);
  }

  function doHide(chart, data) {
    var ids;
    if (data.columns) {
      ids = data.columns.map(function(d) { return d[0]; });
    } else if (data.rows) {
      ids = data.rows[0];
    } else if (data.keys && data.keys.value) {
      ids = data.keys.value;
    }

    var hidden = [];
    var shown = [];
    if (!data.hide || !data.hide.length) {
      ids.forEach(function(id) { shown.push(id); });
    } else {
      ids.forEach(function(id) {
        if (data.hide.indexOf(id) >= 0) {
          hidden.push(id);
        } else {
          shown.push(id);
        }
      });
    }

    if (hidden.length > 0) {
      chart.hide(hidden);
    }
    if (shown.length > 0) {
      chart.show(shown);
    }

    // Not exactly sure why this is needed, but without it,
    // you have legend items stay focused after a hover
    chart.revert();
  }

  function toggleData(id, data) {
    if (data.hide) {
      var idx = data.hide.indexOf(id);
      if (idx >= 0) {
        data.hide.splice(idx, 1);
      } else {
        data.hide.push(id);
      }
    } else {
      data.hide = [id];
    }
  }

  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var chart;
      var unwatchFcn = scope.$watch(attrs.c3, function(value, prevValue) {
        if (value) {
          var config = angular.extend({}, value, {
            bindto: elem[0],
            legend: {
              item: {
                onclick: function(id) {
                  if (config.data) {
                    scope.$apply(function() { toggleData(id, config.data); });
                  }
                }
              }
            }
          });

          if (!!chart && !!config.data) {
            // TODO check if data is the only thing changed; if not, then
            // regenerate the chart rather than call load()
            var unload = getUnload(prevValue.data, config.data);
            if (unload) {
              angular.extend(config.data, {unload: unload});
            }
            chart.load(config.data);
            doHide(chart, config.data);
          } else {
            chart = c3.generate(config);
          }
        } else {
          if (chart && typeof chart.destroy === 'function') {
            chart = chart.destroy();
          }
        }
      }, true);

      elem.on('$destroy', function() {
        if (chart && typeof chart.destroy === 'function') {
          chart = chart.destroy();
        }
      });

      scope.$on('$destroy', function() {
        if (chart && typeof chart.destroy === 'function') {
          chart = chart.destroy();
        }
      });
    }
  };
});

}());
