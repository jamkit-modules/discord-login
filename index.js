var module = (function() {
    var _id = "", _dir_path = "";
    var _redirect_url = "";
    var _redirect_handlers = [];

    function _on_web_start(data) {
        if (_redirect_url && data["url"].startsWith(_redirect_url)) {
            var { "access_token": token } = _parse_redirect_url(data["url"]);

            _redirect_handlers.forEach(function(handler) {
                handler(token);
            });

            _redirect_handlers = [];

            return;
        }
    }

    function _parse_redirect_url(url) {
        return url.split("#")[1].split("&").reduce(function(dict, tuple) {
            var [ key, value ] = tuple.split("=");

            return Object.assign(dict, {
                [key]: decodeURIComponent(value)
            });
        }, {});
    }

    function _load_url(url, params) {
        _get_object(_id + ".web", function(object) {
            object.property({ 
                "url": url + "?" + _build_query(params)
            });
        });
    }

    function _build_query(params) {
        var query = "";

        for (var key in params) {
            query += (query.length > 0) ? "&" : "";
            query += key + "=" + encodeURIComponent(params[key]);
        }
    
        return query;
    }


    function _get_object(id, handler) {
        const object = view.object(id);

        if (!object) {
            timeout(0.1, function() {
                _get_object(id, handler);
            });
        } else {
            handler(object);
        }
    }

    return {
        initialize: function(id) {
            var web_prefix = id.replace(".", "_");
            var dir_path = this.__ENV__["dir-path"];

            global[web_prefix + "__on_web_start"] = function (data) {
                _on_web_start(data);
            }

            view.object(id).action("load", { 
                "filename": dir_path + "/web.sbml",
                "web-id": id, 
                "web-prefix": web_prefix
            });

            _id = id, _dir_path = dir_path;

            return this;
        },

        login: function(client_id, redirect_url, scope=[ 'identify', 'email' ]) {
            return new Promise(function(resolve, reject) {
                _redirect_url = redirect_url;
                _redirect_handlers.push(function(token) {
                    resolve(token);
                });

                _load_url("https://discord.com/oauth2/authorize", {
                    "response_type": "token",
                    "client_id": client_id,
                    "redirect_uri": redirect_url,
                    "scope": scope.join(" ")
                });
            });
        },
    }
})();

__MODULE__ = module;
