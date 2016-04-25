

var Observable = {
    initObservable: function () {
        this.subscribers = {}
    },
    subscribe: (function () {
        var nextGuid = 1;
        return function (type, cb) {
            var subscribers = this.subscribers;
            if (!subscribers[type]) {
                subscribers[type] = [];
            }
            subscribers[type].push(cb);
            if (!cb.guid) {
                cb.guid = nextGuid++;
                console.log(cb.guid);
            }
        }
    })(),
    unSubscribe: function (type, fn) {
        function isEmpty(object) {                          //#1
            for (var prop in object) {
                return false;
            }
            return true;
        }

        function tidyUp(type) {
            var subscribers = self.subscribers;
            if (subscribers[type].length === 0) {
                delete subscribers[type];
            }
        }

        function removeType(t) {
            subscribers[t] = [];
            tidyUp(self, t);
        }

        var subscribers = this.subscribers, self = this;
        if (isEmpty(subscribers)) return;
        if (!type) {
            for (var t in subscribers) removeType(t);
            return;
        }

        var handlers = subscribers[type];
        if (!handlers) return;

        if (!fn) {
            removeType(type);
            return;
        }

        if (fn.guid) {
            for (var n = 0; n < handlers.length; n++) {
                if (handlers[n].guid === fn.guid) {
                    handlers.splice(n--, 1);
                }
            }
        }
        tidyUp(type);
    },
    publish: function (type) {
        var data = Array.prototype.slice.call(arguments, 1),
            i, t,
            subscribers = this.subscribers;
        if (!type) {
            for (t in subscribers) {
                for (i = 0; i < subscribers[t].length; i++) {
                    subscribers[t][i](data);
                }
            }
        } else {
            for (i = 0; i < subscribers[type].length; i++) {
                subscribers[type][i](data);
            }
        }
    }
};








