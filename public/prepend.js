// creating a proxy for the window object
zoneProps = {};
var proxinator= {
  set: function(obj, prop, value) {
    console.log(prop, value);
    window.zoneProps[prop] = value;
    obj[prop] = value;
    return true;
  }
};
// Object.defineProperty(document, "defaultView", { writable: true } );
var proxyWindow = new Proxy(window, proxinator);


// creating a zone wrapper
var proxyPageZoneSpec = (function () {
  var eventTasks = [];
  var time = 0,
  // use the high-res timer if available
  timer = performance ?
    performance.now.bind(performance) :
    Date.now.bind(Date);
  return {
    name: 'proxyPage',
    onScheduleTask: function (parentZoneDelegate, currentZone, targetZone, task) {
      /* console.log(currentZone.name, targetZone.name, task.name);*/
      console.log('task: ', task);
      /* if (task.type == 'eventTask') {*/
      eventTasks.push(task);
      /* }*/
      return parentZoneDelegate.scheduleTask(targetZone, task);
    },
    cleanup: function () {
      console.log(eventTasks.length);
      while(eventTasks.length) {
        Zone.current.cancelTask(eventTasks.pop());
      }
    },
    onInvokeTask: function (delegate, current, target, task, applyThis, applyArgs) {
      /* console.log(current.name, target.name, task.type);*/
      console.log('task: ', task);
      this.start = timer();
      delegate.invokeTask(target, task, applyThis, applyArgs);
      time += timer() - this.start;
    },
    onHasTask(parent, current, target, hasTask) {
      /* console.log('hasTask: ', hasTask);*/
      if (hasTask.macroTask) {
        console.log("There are outstanding MacroTasks.");
      } else {
        console.log("All MacroTasks have been completed.");
      }
    },
    time: function () {
      return Math.floor(time*100) / 100 + 'ms';
    },
    reset: function () {
      time = 0;
    }
  };
}());

function cleanProxyPage() {
  proxyPageZoneSpec.cleanup();
  for (var prop in zoneProps) {
    window[prop] = null;
  }
}

b3.addEventListener('click', cleanProxyPage);
// Zone.current.fork(proxyPageZoneSpec).run(main);
