export function URLParser (URL) {
    // a helper funciton works well in browser
    var url = URL.toString(),
        a = document.createElement('a')
    // set a's href to url so that can also handle relative url
    a.href = url

    return {
        source: url,
        protocol: a.protocol.replace(':', ''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || ['', ''])[1],
        relative: (a.href.match(/tps?:\/{2}[^\/]+(.+)/) || ['', ''])[1],
        segment: a.pathname.replace(/^\//, '').split('/'),
        params: (function() {
            var ret = {}
            
            var seg = a.search.replace(/^\?/, '').split('&').filter(function(v){
                if (v !=='' && v.indexOf('=') > 0) {
                    return true
                }
            })

            seg.forEach( function(element) {
                var idx = element.indexOf('=')
                ret[element.slice(0, idx)] = element.slice(idx + 1)
            })

            return ret
        })()
    }
}