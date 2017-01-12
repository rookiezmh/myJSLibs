/**
 * a simple event lib
 * @ author zhumaohua
 * inspired by JS ninja
 */

var eventUtils = (() => {
    var eventUtils = {}
    
    // helper to fix event in different browser
    eventUtils.fixEvent = function (event) {
        
        var returnTrue = function() {
            return true
        }

        var returnFalse = function() {
            return false
        }

        if (!event || !event.stopPropagation) {
            var old = event || window.event
            event = {}

            for (var prop in old) {
                event[prop] = old[prop]
            }

            if (!event.target) {
                event.target = event.srcElement || document
            }

            event.relatedTarget = event.fromElement === event.target ? 
                                    event.toElement : 
                                    event.fromElement
            
            event.preventDefault = function() {
                event.returnValue = false
                event.isDefaultPrevented = returnTrue
            }

            event.isDefaultPrevented = returnFalse

            event.stopPropagation = function() {
                event.cancelBubble = true
                event.isPropagationStopped = returnTrue
            }

            event.isPropagationStopped = returnFalse

            event.stopImmediatePropagation = function() {
                event.cancelBubble = true
                event.isPropagationStopped = returnTrue
            }

            event.isImmediatePropagationStopped = returnFalse

            if (event.clientX != null) {
                var doc = document.documentElement,
                    body = document.body

                event.pageX = event.clientX + 
                                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                                (doc && doc.clientLeft || body && body.clientLeft || 0)
                event.pageY = event.clientY + 
                                (doc && doc.scrollTop || body && body.scrollTop || 0) -
                                (doc && doc.clientTop || body && body.clientTop || 0)                        
            }

            event.which = event.charCode || event.keyCode

            if (event.button != null) {
                event.button = (event.button & 1 ? 0 : 
                                (event.button & 4 ? 1 :
                                    (event.button & 2 ? 2 : 0)))
            }
        }

        return event
    }

    var nextGuid = 1,
        cache = {},
        guidCounter = 1,
        expando = 'data' + (new Date()).getTime()

    var getData = function(elem) {
        var guid = elem[expando]
        if (!guid) {
            guid = elem[expando] = guidCounter++
            cache[guid] = {}
        }
        return cache[guid]
    }

    var removeData = function(elem) {
        var guid = elem[expando]
        if (!guid) return
        delete cache[guid]
        try {
            delete elem[expando]
        } catch (err) {
            if (elem.removeAttribute) {
                elem.removeAttribute(expando)
            }
        }
    }

    var addEvent = function(elem, type, fn) {
        if (document.addEventListener) {
            elem.addEventListener(type, elem, fn)
            addEvent = function(elem, type, fn) {
                elem.addEventListener(type, fn, false)
                return fn
            }
        } else if (document.attachEvent) {
            elem.addEventListener('on' + type, fn)
            addEvent = function(elem, type, fn) {
                elem.attachEvent('on' + type, fn)
                return fn
            }
        }
        return fn
    }

    var removeEvent = function(elem, type, fn) {
        if (document.removeEventListener) {
            elem.removeEventListener(type, fn, false)
            removeData = function(elem, type, fn) {
                elem.removeEventListener(type, fn, false)
            }
        } else if (document.detachEvent) {
            elem.detachEvent('on' + type, fn)
            removeData = function(elem, type, fn) {
                elem.detachEvent('on' + type, fn)
            }
        }
    }

    eventUtils.addEvent = function(elem, type, fn) {
        var data = getData(elem)

        if (!data.handlers) data.handlers = {}

        if (!data.handlers[type]) data.handlers[type] = []

        if (!fn.guid) fn.guid = nextGuid++

        data.handlers[type].push(fn)

        if (!data.dispatcher) {
            data.disabled = false
            data.dispatcher = function(event, customeizedData) {
                if (data.disabled) return
                event = eventUtils.fixEvent(event)

                var handlers = data.handlers[event.type]

                if (handlers) {
                    for (var n = 0, len = handlers.length; n < len; n++) handlers[n].call(elem, event, customeizedData)
                }
            }
        }

        if (data.handlers[type].length === 1) {
            addEvent(elem, type, data.dispatcher)
        }
    }

    function tidyUp (elem, type) {
        function isEmpty (obj) {
            for (var prop in obj) return false
            return true
        }

        var data = eventUtils.getData(elem)

        if (data.handlers[type].length === 0) {
            delete data.handlers[type]
            removeEvent(elem, type, data.dispatcher)
        }

        if (isEmpty(data.handlers)) {
            delete data.handlers
            delete data.dispatcher
        }

        if (isEmpty(data)) {
            removeData(elem)
        }
    }

    eventUtils.removeEvent = function(elem, type, fn) {
        var data = getData(elem)
        if (!data.handlers) return

        var removeType = function(t) {
            data.handlers[t] = []
            tidyUp(elem, t)
        }

        if (!type) {
            for (var t in data.handlers) removeType(t)
            return
        }   

        var handlers = data.handlers[type]

        if (!handlers) return 

        if (!fn) {
            removeType(type)
            return
        }

        if (fn.guid) {
            for (var n = 0, len = handlers.lenght; n < len; n++) {
                if (handlers[n].guid === fn.guid) {
                    handlers.splice(n--, 1)
                }
            }
        }
        tidyUp(elem, type)
    }

    eventUtils.triggerEvent = function(elem, event, data) {
        var elemData = getData(elem),
            parent = elem.parentNode || elem.ownerDocument

        if (typeof event === 'string') event = {type: event, target: elem}

        event = this.fixEvent(event)

        if (elemData.dispatcher) elem.dispatcher.call(elem, event, data)

        if (parent && !event.isPropagationStopped()) {
            this.triggerEvent(parent, event)
        } else if (!parent && !event.isDefaultPrevented) {
            var targetData = getData(event.target)

            if (event.target[event.type]) {
                targetData.disabled = true
                event.target[event.type]()
                targetData.disabled = false
            }
        }   
    }

    return eventUtils
})()