import vnode from './vnode.js';
import * as is from './is.js';
import htmlDomApi from './htmldomapi.js';
// 值等于undefined
function isUndef(s) {
    return s === undefined;
}

// 值不等于undefined
function isDef(s) {
    return s !== undefined;
}
var emptyNode = vnode('', {}, [], undefined, undefined);
// 判断是否是相同的虚拟节点
function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}
function isVnode(vnode) {
    return vnode.sel !== undefined;
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
    var _a;
    var map = {};
    for (var i = beginIdx; i <= endIdx; ++i) {
        var key = (_a = children[i]) === null || _a === void 0 ? void 0 : _a.key;
        if (key !== undefined) {
            map[key] = i;
        }
    }
    return map;
}
// 钩子
var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
export { h } from './h.js';
export { thunk } from './thunk.js';
export function init(modules, domApi) {
    var i;
    var j;
    var cbs = {
        create: [],
        update: [],
        remove: [],
        destroy: [],
        pre: [],
        post: []
    };
    var api = domApi !== undefined ? domApi : htmlDomApi;
    // 循环hooks，将每个module下的所有的hook方法 => 存放到cbs对应的钩子中，方便在程序运行期间统一调用
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = [];
        for (j = 0; j < modules.length; ++j) {
            var hook = modules[j][hooks[i]];
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook);
            }
        }
    }
    // 创建一个空的vnode
    function emptyNodeAt(elm) {
        var id = elm.id ? '#' + elm.id : '';
        var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
        return vnode(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
    }
    // 创建一个删除的回调，多次调用这个回调，直到监听器都没了，就删除元素
    function createRmCb(childElm, listeners) {
        return function rmCb() {
            if (--listeners === 0) {
                var parent_1 = api.parentNode(childElm);
                api.removeChild(parent_1, childElm);
            }
        };
    }
    // 将Vnode转换成真实的DOM
    function createElm(vnode, insertedVnodeQueue) {
        var _a, _b;
        var i;
        var data = vnode.data;
        if (data !== undefined) {
            // 如果存在 data.hook.init ，则调用该钩子
            var init_1 = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
            if (isDef(init_1)) {
                init_1(vnode);
                data = vnode.data;
            }
        }
        var children = vnode.children;
        var sel = vnode.sel;
        // ！来代表注释
        if (sel === '!') {
            if (isUndef(vnode.text)) {
                vnode.text = '';
            }
            vnode.elm = api.createComment(vnode.text);
        }
        else if (sel !== undefined) {
            // Parse selector
            // 解析选择器
            var hashIdx = sel.indexOf('#');
            var dotIdx = sel.indexOf('.', hashIdx);
            var hash = hashIdx > 0 ? hashIdx : sel.length;
            var dot = dotIdx > 0 ? dotIdx : sel.length;
            var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
            // 根据 tag 创建元素
            var elm = vnode.elm = isDef(data) && isDef(i = data.ns)
                ? api.createElementNS(i, tag)
                : api.createElement(tag);
            // 设置 id
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            // 设置 className
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
            // 执行所有模块的 create 钩子，创建对应的内容
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            // 如果存在 children ，则创建children
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    var ch = children[i];
                    if (ch != null) {
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            else if (is.primitive(vnode.text)) {
                // 追加文本节点
                api.appendChild(elm, api.createTextNode(vnode.text));
            }
            // 执行 vnode.data.hook 中的 create 钩子
            var hook = vnode.data.hook;
            if (isDef(hook)) {
                (_b = hook.create) === null || _b === void 0 ? void 0 : _b.call(hook, emptyNode, vnode);
                if (hook.insert) {
                    insertedVnodeQueue.push(vnode);
                }
            }
        }
        else {
            // sel 不存在的情况， 即为文本节点
            vnode.elm = api.createTextNode(vnode.text);
        }
        return vnode.elm;
    }
    // 添加Vnodes到真实DOM中
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    function invokeDestroyHook(vnode) {
        var _a, _b;
        var data = vnode.data;
        if (data !== undefined) {
            (_b = (_a = data === null || data === void 0 ? void 0 : data.hook) === null || _a === void 0 ? void 0 : _a.destroy) === null || _b === void 0 ? void 0 : _b.call(_a, vnode);
            for (var i_1 = 0; i_1 < cbs.destroy.length; ++i_1)
                cbs.destroy[i_1](vnode);
            if (vnode.children !== undefined) {
                for (var j_1 = 0; j_1 < vnode.children.length; ++j_1) {
                    var child = vnode.children[j_1];
                    if (child != null && typeof child !== 'string') {
                        invokeDestroyHook(child);
                    }
                }
            }
        }
    }

    // 删除Vnodes
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
        var _a, _b;
        for (; startIdx <= endIdx; ++startIdx) {
            var listeners = void 0;
            var rm = void 0;
            var ch = vnodes[startIdx];
            if (ch != null) {
                if (isDef(ch.sel)) {
                    invokeDestroyHook(ch);
                    listeners = cbs.remove.length + 1;
                    // 所有监听删除
                    rm = createRmCb(ch.elm, listeners);
                    for (var i_2 = 0; i_2 < cbs.remove.length; ++i_2)
                        cbs.remove[i_2](ch, rm);
                    var removeHook = (_b = (_a = ch === null || ch === void 0 ? void 0 : ch.data) === null || _a === void 0 ? void 0 : _a.hook) === null || _b === void 0 ? void 0 : _b.remove;
                    // 如果有钩子则调用钩子后再调删除回调，如果没，则直接调用回调
                    if (isDef(removeHook)) {
                        removeHook(ch, rm);
                    }
                    else {
                        rm();
                    }
                }
                else { // Text node
                    api.removeChild(parentElm, ch.elm);
                }
            }
        }
    }

    // 更新子节点
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        var oldStartIdx = 0;
        var newStartIdx = 0;
        var oldEndIdx = oldCh.length - 1;
        var oldStartVnode = oldCh[0];
        var oldEndVnode = oldCh[oldEndIdx];
        var newEndIdx = newCh.length - 1;
        var newStartVnode = newCh[0];
        var newEndVnode = newCh[newEndIdx];
        var oldKeyToIdx;
        var idxInOld;
        var elmToMove;
        var before;
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            if (oldStartVnode == null) {
                // 移动索引，因为节点处理过了会置空，所以这里向右移
                oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
            }
            else if (oldEndVnode == null) {
                // 原理同上
                oldEndVnode = oldCh[--oldEndIdx];
            }
            else if (newStartVnode == null) {
                // 原理同上
                newStartVnode = newCh[++newStartIdx];
            }
            else if (newEndVnode == null) {
                // 原理同上
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldStartVnode, newStartVnode)) {
                // 从左对比
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                oldStartVnode = oldCh[++oldStartIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else if (sameVnode(oldEndVnode, newEndVnode)) {
                // 从右对比
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                oldEndVnode = oldCh[--oldEndIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
                // 最左侧 对比 最右侧
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                // 移动元素到右侧指针的后面
                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                oldStartVnode = oldCh[++oldStartIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
                // 最右侧对比最左侧
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                // 移动元素到左侧指针的后面
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                oldEndVnode = oldCh[--oldEndIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else {
                // 首尾都不一样的情况，寻找相同 key 的节点，所以使用的时候加上key可以调高效率
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                }
                idxInOld = oldKeyToIdx[newStartVnode.key];
                if (isUndef(idxInOld)) { // New element
                    // 如果找不到 key 对应的元素，就新建元素
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                }
                else {
                    // 如果找到 key 对应的元素，就移动元素
                    elmToMove = oldCh[idxInOld];
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        oldCh[idxInOld] = undefined;
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                }
                newStartVnode = newCh[++newStartIdx];
            }
        }
        // 新老数组其中一个到达末尾
        if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
            if (oldStartIdx > oldEndIdx) {
                // 如果老数组先到达末尾，说明新数组还有更多的元素，这些元素都是新增的，说以一次性插入
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            else {
                // 如果新数组先到达末尾，说明新数组比老数组少了一些元素，所以一次性删除
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
    }
    // 更新节点（对比两个Vnode）
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var _a, _b, _c, _d, _e;
        var hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
        (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
        // 获取挂载节点elm
        var elm = vnode.elm = oldVnode.elm;
        // 获取老节点中的children
        var oldCh = oldVnode.children;
        var ch = vnode.children;
        if (oldVnode === vnode)
            return;
        /**
         * 调用cbs的所有模块的update方法更新对应的实际内容:
         * 使用vnode中的属性同步oldvnode中的属性 => 调用create钩子中的所有update方法（class, props, style, event）
         */
        if (vnode.data !== undefined) {
            for (var i_3 = 0; i_3 < cbs.update.length; ++i_3)
                cbs.update[i_3](oldVnode, vnode);
            (_d = (_c = vnode.data.hook) === null || _c === void 0 ? void 0 : _c.update) === null || _d === void 0 ? void 0 : _d.call(_c, oldVnode, vnode);
        }
        // text为undefined
        if (isUndef(vnode.text)) {
            if (isDef(oldCh) && isDef(ch)) {
                // 新老子节点都存在的情况下，更新子节点
                if (oldCh !== ch)
                    updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            else if (isDef(ch)) {
                // 老节点不存在子节点，情况下，新建元素
                if (isDef(oldVnode.text))
                    api.setTextContent(elm, '');
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            else if (isDef(oldCh)) {
                // 新节点不存在子节点，情况下，删除元素
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            else if (isDef(oldVnode.text)) {
                // 如果老节点存在文本节点，而新节点不存在，所以清空
                api.setTextContent(elm, '');
            }
        }
        // text不为undefined，并且oldVnode.text !== vnode.text
        else if (oldVnode.text !== vnode.text) {
            if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            // 子节点文本不一样的情况下，更新文本
            api.setTextContent(elm, vnode.text);
        }
        // 调用 postpatch
        (_e = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _e === void 0 ? void 0 : _e.call(hook, oldVnode, vnode);
    }
    // 修补节点
    return function patch(oldVnode, vnode) {
        var i, elm, parent;
        // insertedVnodeQueue存在于整个patch过程
        // 用于收集patch中新插入的Vnode
        var insertedVnodeQueue = [];
        /**
         * 在进行patch之前，我们需要运行prepatch hook:
         * 1、cbs是init函数变量，即patch函数是init的闭包；
         * 2、这里，不必理会lifecycle hook，而只关注vdom diff算法；
         * 3、先调用pre回调。
         */
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        // 如果老节点非vnode，则创建一个空的vnode
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }
        // 如果是同个节点，则进行修补
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        else {
            // 不同的vnode节点则创建
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            createElm(vnode, insertedVnodeQueue);
            // 插入新节点，删除老节点
            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }
        // 遍历所有收集到的插入节点，调用插入的钩子
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }
        // 调用post钩子
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();
        return vnode;
    };
}
//# sourceMappingURL=snabbdom.js.map