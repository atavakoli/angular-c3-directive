(function() {
'use strict';

angular.module('c3', [])

.directive('c3', function() {
  function getKeys(src, includeXs) {
    if (!src) {
      return false;
    }

    var xs = {};
    if (src.hasOwnProperty('x')) {
      xs[src.x] = true;
    } else if (src.xs && src.xs.length) {
      angular.forEach(src.xs, function(x) {
        xs[x] = true;
      });
    }

    var keys;
    if (src.columns && src.columns.length) {
      keys = {};
      src.columns.forEach(function(data) {
        if (!xs[data[0]] || includeXs) {
          keys[data[0]] = true;
        }
      });
      return keys;
    } else if (src.rows && src.rows.length) {
      keys = {};
      src.rows[0].forEach(function(key) {
        if (!xs[key] || includeXs) {
          keys[key] = true;
        }
      });
      return keys;
    } else if (src.keys) {
      keys = {};
      if (src.keys.hasOwnProperty('x') && includeXs) {
        keys[src.keys.x] = true;
      }
      if (src.keys.value && src.keys.value.length) {
        src.keys.value.forEach(function(key) {
          keys[key] = true;
        });
      }
      return keys;
    } else {
      return false;
    }
  }

  function getUnload(prev, curr) {
    var prevKeys = getKeys(prev, true);
    if (!prevKeys) {
      return false;
    }

    var currKeys = getKeys(curr, true);
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
    // TODO: handle boolean data.hide

    var keys = getKeys(data);
    if (!keys) {
      return;
    }

    keys = Object.keys(keys);

    var hidden = [];
    var shown = [];
    if (!data.hide || !data.hide.length) {
      keys.forEach(function(key) { shown.push(key); });
    } else {
      keys.forEach(function(key) {
        if (data.hide.indexOf(key) >= 0) {
          hidden.push(key);
        } else {
          shown.push(key);
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

  function toggleHide(id, data) {
    // TODO: handle boolean data.hide

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

  function hideAllBut(id, data) {
    // TODO: handle boolean data.hide

    var keys = getKeys(data);
    if (!keys) {
      return;
    }

    if (keys.hasOwnProperty(id)) {
      delete keys[id];
    }

    if (data.hide) {
      data.hide.length = 0;
      Object.keys(keys).forEach(function(key) {
        data.hide.push(key);
      });
    } else {
      data.hide = Object.keys(keys);
    }
  }

  // Properties that can be passed into chart.load() API ('hide' is included
  // because we call doHide() in the done callback of load)
  var loadableDataProps = {
    hide: true, url: true, columns: true, rows: true, json: true, classes: true,
    categories: true, axes: true, colors: true, type: true, types: true,
  };

  function partitionConfig(config) {
    var result = { loadableData: {}, unloadableData: {}, nonData: {} };

    if (config) {
      angular.forEach(config, function(value, prop) {
        if (prop !== 'data') {
          result.nonData[prop] = value;
        }
      });

      if (config.data) {
        angular.forEach(config.data, function(value, prop) {
          if (loadableDataProps.hasOwnProperty(prop)) {
            result.loadableData[prop] = value;
          } else {
            result.unloadableData[prop] = value;
          }
        });
      }
    }

    return result;
  }

  // return false if can't/shouldn't update the chart using the load API;
  // otherwise, return an object that can be passed into the .load() call
  function getLoadParam(options, prevConfig, currConfig) {
    if (!!options && !options.useLoadApi) {
      return false;
    } else {
      var prev = partitionConfig(prevConfig);
      var curr = partitionConfig(currConfig);

      // NOTE: no need to compare .loadableData because we're already deep
      // watching the configs, so the loadableData's must be non-equal
      if ( angular.equals(prev.nonData,        curr.nonData) &&
           angular.equals(prev.unloadableData, curr.unloadableData)) {

        var unload = getUnload(prev.loadableData, curr.loadableData);
        if (unload) {
          angular.extend(curr.loadableData, {unload: unload});
        }

        return curr.loadableData;
      } else {
        return false;
      }
    }
  }

  function decoratedConfig(scope, elem, attrs) {
    var config = angular.merge({}, scope.c3, {
      data: {
        onclick: function(d, elem) {
          var event = this.internal.d3.event;
          // use applyAsync to give c3 a chance to finish what it's doing;
          // if we don't, strange things happen, as collections being iterated
          // by d3 get modified mid-iteration
          scope.$applyAsync(function() {
            if (scope.dataClick) {
              scope.dataClick({ datum: d, event: event });
            }
          });
        }
      },
      legend: {
        item: {
          onclick: function(id) {
            var event = this.d3.event;
            // use applyAsync to give c3 a chance to finish what it's doing;
            // if we don't, strange things happen, as collections being iterated
            // by d3 get modified mid-iteration
            scope.$applyAsync(function() {
              function defaultClick() {
                if (event.altKey) {
                  hideAllBut(id, scope.c3.data);
                } else {
                  toggleHide(id, scope.c3.data);
                }
              }

              if (angular.isDefined(attrs.c3LegendClick)) {
                scope.legendClick({ id: id, event: event, default: defaultClick });
              } else {
                defaultClick();
              }
            });
          }
        }
      }
    });

    // angular.merge doesn't work well with HTMLElement so we need to set it
    // by reference ourselves.
    config.bindto = elem;
    return config;
  }

  return {
    restrict: 'A',
    scope: {
      c3: '=c3',
      options: '=?c3Options',
      dataClick: '&c3DataClick',
      legendClick: '&c3LegendClick'
    },
    link: function(scope, elem, attrs) {
      var chart;

      scope.$watch('c3', function(value, prevValue) {
        if (value) {
          var loadParam;
          if (!chart) {
            chart = c3.generate(decoratedConfig(scope, elem[0], attrs));
          } else if (loadParam = getLoadParam(scope.options, prevValue, value)) {
            angular.extend(loadParam, {
              done: function() {
                doHide(chart, scope.c3.data);
              }
            });
            chart.load(loadParam);
          } else {
            chart.destroy();
            chart = c3.generate(decoratedConfig(scope, elem[0], attrs));
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
