angular-c3-directive
====================

Dead simple AngularJS directive for the C3.js chart library

Installation
------------

Installation is performed using [Bower](http://bower.io). The only dependencies
are [AngularJS][] and [C3.js][].

```
bower install angular-c3-directive
```

Usage
-----

In your HTML:

```html
<html ng-app="myApp">

  ...

  <script src="angular.js"></script>
  <script src="d3.js"></script> <!-- Required by C3.js -->
  <script src="c3.js"></script>
  <script src="angular-c3.js"></script>

  ...

  <div c3="chart"></div>

  ...

</html>
```

In your JavaScript, you need to inject `c3` as a dependency.

```javascript
angular.module('myApp', ['c3'])
```

In your controller, the object passed into the `c3` attribute is the same as
that passed into [`c3.generate()`][c3.generate], except without the `bindto`
property.

```javascript
$scope.chart = {
  data: {
    columns: [
      ['data1', 30, 200, 100, 400, 150, 250],
      ['data2', 50, 20, 10, 40, 15, 25]
    ]
  }
};
```

The chart is updated whenever the object or any of its properties are modified.
If the `chart.load()` API can be used, it will be (unless disabled; see Options
below).

The model can also be watched to catch interactions that change it (e.g.
clicking legend items to show/hide data).

```javascript
$scope.$watchCollection('chart.data.hide', function(value, prevValue) {
  console.log('data.hide changed!');
});
```

### Options

Advanced options can also be passed in via the `c3-options` attribute. This
attribute is optional and specific to the operation

```html
<div c3="chart" c3-options="options"></div>
```

```javascript
$scope.options = {
  /* If true (default), detect changes to data and use the the load() API
   * whenever possible to make updates; if false, regenerate the chart on every
   * change.
   *
   * NOTE: because of the additional processing needed to detect loadable vs
   *       unloadable changes, you may want to set this to false if you have a
   *       high update rate or very large datasets.
   */
  useLoadApi: true
};
```

Other options to come as needed.


[AngularJS]: https://github.com/angular/bower-angular
[C3.js]: https://github.com/masayuki0812/c3
[c3.generate]: http://c3js.org/gettingstarted.html#generate
