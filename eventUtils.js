/**
 * Created by admin on 2016/4/25.
 */

var eventUtils = (function () {
    var eventUtils = {};
    eventUtils.fixEvent = function (event) {

        function returnTrue() {
            return true;
        }

        function returnFalse() {
            return false;
        }

        if (!event || !event.stopPropagation) {
            var old = event || window.event;

            // Clone the old object so that we can modify the values
            event = {};

            for (var prop in old) {
                event[prop] = old[prop];
            }

            // The event occurred on this element
            if (!event.target) {
                event.target = event.srcElement || document;
            }

            // Handle which other element the event is related to
            event.relatedTarget = event.fromElement === event.target ?
                event.toElement :
                event.fromElement;

            // Stop the default browser action
            event.preventDefault = function () {
                event.returnValue = false;
                event.isDefaultPrevented = returnTrue;
            };

            event.isDefaultPrevented = returnFalse;

            // Stop the event from bubbling
            event.stopPropagation = function () {
                event.cancelBubble = true;
                event.isPropagationStopped = returnTrue;
            };

            event.isPropagationStopped = returnFalse;

            // Stop the event from bubbling and executing other handlers
            event.stopImmediatePropagation = function () {
                this.isImmediatePropagationStopped = returnTrue;
                this.stopPropagation();
            };

            event.isImmediatePropagationStopped = returnFalse;

            // Handle mouse position
            if (event.clientX != null) {
                var doc = document.documentElement, body = document.body;

                event.pageX = event.clientX +
                    (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                    (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY +
                    (doc && doc.scrollTop || body && body.scrollTop || 0) -
                    (doc && doc.clientTop || body && body.clientTop || 0);
            }

            // Handle key presses
            event.which = event.charCode || event.keyCode;

            // Fix button for mouse clicks:
            // 0 == left; 1 == middle; 2 == right
            if (event.button != null) {
                event.button = (event.button & 1 ? 0 :
                    (event.button & 4 ? 1 :
                        (event.button & 2 ? 2 : 0)));
            }
        }

        return event;
    };
    var nextGuid = 1;
    var cache = {},
        guidCounter = 1,
        expando = "data" + (new Date()).getTime();
    eventUtils.getData = function (elem) {
        var guid = elem[expando];
        if (!guid) {
            guid = elem[expando] = guidCounter++;
            cache[guid] = {};
        }
        return cache[guid];
    };
    eventUtils.removeData = function (elem) {
        var guid = elem[expando];
        if (!guid) return;
        delete cache[guid];
        try {
            delete elem[expando];
        }
        catch (e) {
            if (elem.removeAttribute) {
                elem.removeAttribute(expando);
            }
        }
    };
    eventUtils.addEvent = function (elem, type, fn) {

        var data = this.getData(elem);                           

        if (!data.handlers) data.handlers = {};             

        if (!data.handlers[type])                           
            data.handlers[type] = [];                         

        if (!fn.guid) fn.guid = nextGuid++;                 

        data.handlers[type].push(fn);                       

        if (!data.dispatcher) {                             
            data.disabled = false;
            data.dispatcher = function (event) {

                if (data.disabled) return;
                event = eventUtils.fixEvent(event);

                var handlers = data.handlers[event.type];       
                if (handlers) {
                    for (var n = 0; n < handlers.length; n++) {   
                        handlers[n].call(elem, event);              
                    }
                }
            };
        }

        if (data.handlers[type].length == 1) {              
            if (document.addEventListener) {
                elem.addEventListener(type, data.dispatcher, false);
            }
            else if (document.attachEvent) {
                elem.attachEvent("on" + type, data.dispatcher);
            }
        }

    };

    function tidyUp(elem, type) {

        function isEmpty(object) {                          //#1
            for (var prop in object) {
                return false;
            }
            return true;
        }

        var data = eventUtils.getData(elem);

        if (data.handlers[type].length === 0) {             

            delete data.handlers[type];

            if (document.removeEventListener) {
                elem.removeEventListener(type, data.dispatcher, false);
            }
            else if (document.detachEvent) {
                elem.detachEvent("on" + type, data.dispatcher);
            }
        }

        if (isEmpty(data.handlers)) {                        
            delete data.handlers;
            delete data.dispatcher;
        }

        if (isEmpty(data)) {                                 
            eventUtils.removeData(elem);
        }
    }

    eventUtils.removeEvent = function (elem, type, fn) {       

        var data = this.getData(elem);                         

        if (!data.handlers) return;                      

        var removeType = function (t) {                      
            data.handlers[t] = [];
            tidyUp(elem, t);
        };

        if (!type) {                                       
            for (var t in data.handlers) removeType(t);
            return;
        }

        var handlers = data.handlers[type];                 
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
        tidyUp(elem, type);

    };


    eventUtils.triggerEvent = function (elem, event) {

        var elemData = this.getData(elem),                       
            parent = elem.parentNode || elem.ownerDocument;

        if (typeof event === "string") {                      
            event = {type: event, target: elem};
        }
        event = this.fixEvent(event);                            

        if (elemData.dispatcher) {                             
            elemData.dispatcher.call(elem, event);
        }

        if (parent && !event.isPropagationStopped()) {       
            this.triggerEvent(parent, event);
        }

        else if (!parent && !event.isDefaultPrevented()) {     

            var targetData = this.getData(event.target);

            if (event.target[event.type]) {                     
                targetData.disabled = true;                    

                event.target[event.type]();                       

                targetData.disabled = false;                      

            }
        }
    };
    return eventUtils;
})();