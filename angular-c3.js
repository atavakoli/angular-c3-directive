(function() {
'use strict';

angular.module('c3', [])

.directive('c3', function() {
  console.log('loading directive');

  function getUnload(prev, curr) {
    var prevKeys;
    if (prev && prev.columns && prev.columns.length) {
      prevKeys = {};
      prev.columns.forEach(function(data) {
        prevKeys[data[0]] = true;
      });
    } else if (prev && prev.rows && prev.rows.length) {
      prevKeys = {};
      prev.rows[0].forEach(function(key) {
        prevKeys[key] = true;
      });
    } else {
      return false;
    }

    var currKeys;
    if (curr && curr.columns && curr.columns.length) {
      currKeys = {};
      curr.columns.forEach(function(data) {
        currKeys[data[0]] = true;
      });
    } else if (curr && curr.rows && curr.rows.length) {
      currKeys = {};
      curr.rows[0].forEach(function(key) {
        currKeys[key] = true;
      });
    } else {
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

  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var chart;
      var unwatchFcn = scope.$watch(attrs.c3, function(value, prevValue) {
        if (value) {
          var config = angular.extend({}, value, { bindto: elem[0] });

          if (!!chart && !!config.data) {
            var unload = getUnload(prevValue.data, config.data);
            if (unload) {
              angular.extend(config.data, {unload: unload});
            }
            chart.load(config.data);
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
