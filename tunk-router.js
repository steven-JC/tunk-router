(function () {

    // 定义模块 snapshot的作用 ？  定义的模块初始化的时候会自动从缓存加载数据，所有动作都更新缓存数据

    // 定义动作 snapshot的作用 ？  定义的动作，dispatch会强制执行动作，并更新缓存，使用shapshot直接使用缓存数据

    // 起到精准控制的作用
    // this.snapshot('increment');      有缓存数据直接拿数据，没有就跟dispatch一样
    // this.snapshot({count:2});        缓存数据，然后跟 dispatch 一样
    // this.dispatch('increment');      强制执行动作，不更改缓存数据

    var tunk = require('tunk');
    var apply = require('apply.js');

    var storageTypes;

    function snapshot(configs){
        for(var x in configs){
            if(configs[x] && configs[x].setItem && configs[x].getItem)
                storageTypes[x] = configs[x];
        }
    }

    tunk.hook('connectDispatch', function(origin){
        return function(target, name, handle){

            target.snapshot=function(){
                var args = Array.prototype.slice.call(arguments);
                args.push('_SNAPSHOT_');
                return apply(this[name], args, this);
            };

            origin(target, name, handle);
        }
    });


    tunk.hook('callAction', function(origin){
        return function(dispatch, originAction, args, module, moduleName, actionName,  options){

            var result, for_snapshot = args[args.length-1]==='_SNAPSHOT_';

            module.snapshot=snapshot;

            if(for_snapshot) {
                if (result = getFromCache(moduleName, actionName, options.snapshot)) {
                    return dispatch.call(module, result);
                }else {
                    args=Array.prototype.slice.call(args);
                    args.pop();
                }
            }

            return origin(dispatch, originAction, args, module, moduleName, actionName,  options);

            function snapshot(arg){
                if(typeof arg === 'object' && arg.constructor === Object){
                    setToCache(moduleName, actionName, arg, options.snapshot);
                    return dispatch.call(module, arg);
                }else if(typeof arg === 'string' && arg.indexOf('.')>0){
                    var args = Array.prototype.slice.call(arguments);
                    args.push('_SNAPSHOT_');
                    apply(dispatch, args, module);
                }
                return apply(dispatch, arguments, module);
            }
        }
    });

    tunk.hook('callWatcher', function(origin){
        return function(dispatch, watcher, newValue, watchingStatePath, watchingModule, fromAction, module, moduleName, watcherName, options){

            var result;

            module.snapshot=snapshot;

            origin(dispatch, watcher, newValue, watchingStatePath, watchingModule, fromAction, module, moduleName, watcherName, options);

            function snapshot(arg){
                if(typeof arg === 'string' && arg.indexOf('.')>0){
                    var args = Array.prototype.slice.call(arguments);
                    args.push('_SNAPSHOT_');
                    return apply(dispatch, args, module);
                }
                return apply(dispatch, arguments, module);
            }
        }
    });

    tunk.hook('initModule', function(origin){
        return function(module, store, moduleName, options){

            var obj = origin(module, store, moduleName, options);
            // 起到精准控制的作用

            if(options.snapshot) {
                if (obj.state) {
                    Object.assign(store[moduleName], getFromCache(moduleName, null, options.snapshot));
                } else obj.state = getFromCache(moduleName, null, options.snapshot);
            }

            return obj;
        }
    });

    tunk.hook('storeNewState', function(origin){
        return function(obj, moduleName, actionName, options){
            if(options.snapshot){
                setToCache(moduleName, actionName, obj, options.snapshot);
            }
            origin(obj, moduleName, actionName, options);
        }
    });


    function getFromCache(moduleName, actionName, type){
        moduleName = 'snapshot-'+moduleName;
        switch (type){
            case 'session':
            case 'sessionStorage':
                return storage.reset('sessionStorage').getItem(moduleName, actionName);
            case 'local':
            case 'localStorage':
                return storage.reset('localStorage').getItem(moduleName, actionName);
            default :
                return storage.reset(type).getItem(moduleName, actionName);
        }
    }

    function setToCache(moduleName, actionName, data, type){
        moduleName = 'snapshot-'+moduleName;
        switch (type){
            case 'session':
            case 'sessionStorage':
                storage.reset('sessionStorage').setItem(moduleName, actionName, data);
                break;
            case 'local':
            case 'localStorage':
                storage.reset('localStorage').setItem(moduleName, actionName, data);
                break;
            default:
                storage.reset(type).setItem(moduleName, actionName, data);
                break;
        }
    }


    storageTypes = {
        sessionStorage: {
            setItem: function (key, data) {
                window.sessionStorage[key] = JSON.stringify(data);
            },
            getItem: function (key) {
                if (window.sessionStorage[key]) return JSON.parse(window.sessionStorage[key]);
            }
        },
        localStorage:{
            setItem:function(key, data){
                window.localStorage[key] = JSON.stringify(data);
            },
            getItem:function(key){
                if(window.localStorage[key]) return JSON.parse(window.localStorage[key]);
            }
        }

    }

    function Storage(){

        this.storages = storageTypes;
        this.caches = {};
        this.keyss = {};

        this.type
        this.storage=null;
        this.cache=null;
        this.keys=null;
    }
    Storage.prototype={
        constructor:Storage,
        reset:function(type){

            if(this.type === type) return this;

            if(!this.storages[type]) throw 'the action or module was not define snapshot';

            this.type = type;

            this.storage = this.storages[type];

            this.cache = this.caches[type] = this.caches[type] || {};

            this.keys = this.keyss[type] = this.keyss[type] || this.storage.getItem('snapshot-keys') || {};

            return this;

        },
        setItem:function(moduleName, actionName, data){

            this.keys[moduleName] = this.keys[moduleName] || {};
            if(actionName) this.keys[moduleName][actionName] = Object.keys(data);

            this.cache[moduleName] = this.cache[moduleName] || this.storage.getItem(moduleName) || {};

            Object.assign(this.cache[moduleName], data);

            this.storage.setItem(moduleName, this.cache[moduleName]);
            this.storage.setItem('snapshot-keys', this.keys);

        },
        getItem:function(moduleName, actionName){

            this.cache[moduleName] = this.cache[moduleName] || this.storage.getItem(moduleName) || {};

            if(!actionName) return this.cache[moduleName];
            else {
                var keys=this.keys[moduleName][actionName]||[],key,data={},length=keys.length;

                if(!length) return;

                while(key=keys.pop()){
                    if(typeof this.cache[moduleName][key] !== 'undefined') data[key]=this.cache[moduleName][key];
                }

                if(Object.keys(data).length===length ) return data;
            }

        }
    }


    var storage = new Storage();




})();
