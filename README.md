POC of source releasing using Zonejs and proxy
================================================

On `npm start` two instances of express will run. First with a page that includes a js file that add listeners, run an interval and add an onrezise function to the window object. The second is a proxy that wraps the script file to gain control over it, also adding a button for cleaning up.

What is missing here in order to make the original instance behave as a single page application is replacing the body element to a div and moving the css and js files from the header to that div.
      
# Proxy the window object #

The idea is to override the setter of properties on the window object so all manipulations of the window object will be known for later releasing.

The original script file set the onresize property

    window.onresize = function () {
        console.log("Yay");
    };

We want to wrap it and replace the window object

    (function (window) {
        window.onresize = function () {
            console.log("Yay");
        };
    })(proxyWindow);

So on the server proxy we'll look for a header of `content-type application/javascript` and wrap the the js file

      var wr = '(function(window){';
      var ap= '})(proxyWindow)';
      res.write = function (data) {
        _write.call(res, wr+data+ap);
      };

The `proxyWindow` keeps a record of used properties

    var proxinator= {
      set: function(obj, prop, value) {
        window.zoneProps[prop] = value;
        obj[prop] = value;
        return true;
      }
    };
    var proxyWindow = new Proxy(window, proxinator);

# Run within a zonde to control async operations #

Creating the zone controller and add a cleanup method to cancel tasks on demand.

    var proxyPageZoneSpec = (function () {
      return {
        name: 'proxyPage',
        onScheduleTask: function (parentZoneDelegate, currentZone, targetZone, task) {
          ..Do stuff 
          return parentZoneDelegate.scheduleTask(targetZone, task);
        },
        cleanup: function () {
          while(eventTasks.length) {
            Zone.current.cancelTask(eventTasks.pop());
          }
        },
        onInvokeTask: function (delegate, current, target, task, applyThis, applyArgs) {
          //Do stuff, like timing :)
          this.start = timer();
          delegate.invokeTask(target, task, applyThis, applyArgs);
          time += timer() - this.start;
        }
      };
    }());

We wrap the js file as we did with the window proxy

    var wr = '(function(window){\nZone.current.fork(proxyPageZoneSpec).run(function(){\n';
    var ap= '\n})\n})(proxyWindow)';
    res.write = function (data) {
      _write.call(res, wr+data+ap);
    };
    
Now we can have a cleanup method for both the window and the zone

    function cleanProxyPage() {
      proxyPageZoneSpec.cleanup();
      for (var prop in zoneProps) {
        window[prop] = null;
      }
    }
