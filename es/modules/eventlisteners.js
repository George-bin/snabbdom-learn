// 调用事件处理
function invokeHandler(handler, vnode, event) {
    if (typeof handler === 'function') {
        // call function handler
        // 函数情况下直接调用
        handler.call(vnode, event, vnode);
    }
    else if (typeof handler === 'object') {
        // call handler with arguments
        if (typeof handler[0] === 'function') {
            // handler为数组的情况。 eg : handler = [fn,arg1,arg2]
            // 第一项为函数说明后面的项为想要传的参数
            // special case for single argument for performance
            if (handler.length === 2) {
                // 当长度为2的时候，用call，优化性能
                handler[0].call(vnode, handler[1], event, vnode);
            }
            else {
                // 组装参数，用 apply 调用
                var args = handler.slice(1);
                args.push(event);
                args.push(vnode);
                handler[0].apply(vnode, args);
            }
        }
        else {
            // call multiple handlers
            // 处理多个handler的情况
            for (var i = 0; i < handler.length; i++) {
                invokeHandler(handler[i], vnode, event);
            }
        }
    }
}
// 处理事件
// 主要负责转发，去除 on 里面对应的事件处理函数，进行调用
function handleEvent(event, vnode) {
    var name = event.type;
    var on = vnode.data.on;
    // call event handler(s) if exists
    if (on && on[name]) {
        // 如果存在回调函数，则调用对应的函数
        invokeHandler(on[name], vnode, event);
    }
}
// 创建一个事件监听器 => return fun
function createListener() {
    // 事件处理器
    return function handler(event) {
        handleEvent(event, handler.vnode);
    };
}
// 对比oldVnode和vnode，更新事件监听器
function updateEventListeners(oldVnode, vnode) {
    var oldOn = oldVnode.data.on;
    var oldListener = oldVnode.listener;
    var oldElm = oldVnode.elm;
    var on = vnode && vnode.data.on;
    var elm = (vnode && vnode.elm);
    var name;
    // optimization for reused immutable handlers
    if (oldOn === on) {
        return;
    }
    // remove existing listeners which no longer used
    // 删除多余的事件
    if (oldOn && oldListener) {
        // if element changed or deleted we remove all existing listeners unconditionally
        if (!on) {
            // 如果新的节点没有绑定事件，则删除所有的事件
            for (name in oldOn) {
                // remove listener if element was changed or existing listeners removed
                // 删除监听器
                oldElm.removeEventListener(name, oldListener, false);
            }
        }
        else {
            for (name in oldOn) {
                // remove listener if existing listener removed
                if (!on[name]) {
                    // 删除在新事件列表上不存在的监听器
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
        }
    }
    // add new listeners which has not already attached
    if (on) {
        // reuse existing listener or create new
        // 重用老的监听器
        var listener = vnode.listener = oldVnode.listener || createListener();
        // update vnode for listener
        listener.vnode = vnode;
        // if element changed or added we add all needed listeners unconditionally
        if (!oldOn) {
            for (name in on) {
                // add listener if element was changed or new listeners added
                elm.addEventListener(name, listener, false);
            }
        }
        else {
            for (name in on) {
                // add listener if new listener added
                // 添加新增的监听器
                if (!oldOn[name]) {
                    elm.addEventListener(name, listener, false);
                }
            }
        }
    }
}
export var eventListenersModule = {
    create: updateEventListeners,
    update: updateEventListeners,
    destroy: updateEventListeners
};
export default eventListenersModule;
//# sourceMappingURL=eventlisteners.js.map