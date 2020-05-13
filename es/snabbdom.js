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

// 创建一个key和oldIdx的映射表
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

    // 将真实dom转换为一个空的vnode
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
            // 如果自定义了init钩子函数（ vnode.data.hook.init ），则调用该钩子函数
            var init_1 = (_a = data.hook) === null || _a === void 0 ? void 0 : _a.init;
            if (isDef(init_1)) {
                init_1(vnode);
                data = vnode.data; // 用户可能通过init钩子会修改vnode数据，所以需要重新对data进行赋值操作
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
            // 解析选择器（Parse selector）
            var hashIdx = sel.indexOf('#'); // id
            var dotIdx = sel.indexOf('.', hashIdx); // class
            var hash = hashIdx > 0 ? hashIdx : sel.length;
            var dot = dotIdx > 0 ? dotIdx : sel.length;
            var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel; // 获取tag
            // 根据 tag 创建元素
            var elm = vnode.elm = isDef(data) && isDef(i = data.ns)
                ? api.createElementNS(i, tag)
                : api.createElement(tag);
            // 设置 id（如果存在）
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            // 设置 className（如果存在）
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));

            // 执行所有模块的 create 钩子，创建对应的内容（全局钩子create）
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            // 如果存在 children ，则创建children
            // 如果存在子元素Vnode节点，则递归将子元素节点插入到当前Vnode节点中，并将已插入的子元素节点在insertedVnodeQueue中作记录
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    var ch = children[i];
                    if (ch != null) {
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            // 如果存在子文本节点，则直接将其插入到当前Vnode节点
            else if (is.primitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text));
            }

            // 如果自定义了create钩子，则调用（执行 vnode.data.hook 中的 create 钩子）
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

    // 添加Vnode到真实DOM中
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    
    // 卸载元素
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

    // 删除vnode
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

    /**
     * 更新vnode children:
     * parentElm: 真实要挂载到的DOM元素
     * oldCh: 老Vnode中的子节点
     * newCh: 新Vnode中的子节点
     * insertedVnodeQueue: 用于收集patch中新插入的Vnode
     */
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        // 首对比位置
        var oldStartIdx = 0;
        var newStartIdx = 0;
        // 尾对比位置
        var oldEndIdx = oldCh.length - 1;
        var newEndIdx = newCh.length - 1;
        // 第一个子vnode
        var oldStartVnode = oldCh[0];
        var newStartVnode = newCh[0];
        // 最后一个子vnode
        var oldEndVnode = oldCh[oldEndIdx];
        var newEndVnode = newCh[newEndIdx];
        var oldKeyToIdx;
        var idxInOld;
        var elmToMove;
        var before;

        // 循环遍历对比oldVnode和vnode，只要有一个遍历结束便退出循环
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
            else if (sameVnode(oldStartVnode, newStartVnode)) { // 如果是同一个 vnode
                // 从左对比
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue); // 更新旧的 vnode。
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
                    // 创造一个 hash 结构，用键映射索引。
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                }
                idxInOld = oldKeyToIdx[newStartVnode.key]; // 通过 key 来获取对应索引
                if (isUndef(idxInOld)) { // New element
                    // 如果找不到 key 对应的元素，就新建元素
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                }
                else {
                    // 如果找到 key 对应的元素，就移动元素
                    elmToMove = oldCh[idxInOld];
                    if (elmToMove.sel !== newStartVnode.sel) {
                        // 如果新旧 vnode 的选择器不能对应，那就直接插入到旧 vnode 之前
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        // 选择器匹配上了，可以直接更新
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        oldCh[idxInOld] = undefined; // 已更新的旧 vnode 赋值为 undefined
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                }
                newStartVnode = newCh[++newStartIdx];
            }
        }
        // oldCh和newCh其中有一个遍历结束
        if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
            // oldCh先遍历结束，说明newCh中还有vnode元素，直接进行一次性插入
            if (oldStartIdx > oldEndIdx) {
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm; // newCh尾部子元素可能在oldCh中存在，直接在该dom节点之前插入节点即可
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            // newCh先遍历结束，说明oldCh中还有vnode元素，直接全部删除即可
            else {
                // 如果新数组先到达末尾，说明新数组比老数组少了一些元素，所以一次性删除
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
    }

    /**
     * 两个vnode相似，对比更新dom节点（对比两个Vnode）:
     * oldVnode: 老Vnode
     * vnode: 新vnode
     * insertedVnodeQueue: 用于收集patch中新插入的Vnode
     */
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var _a, _b, _c, _d, _e;
        // 用户是否定义了hook
        var hook = (_a = vnode.data) === null || _a === void 0 ? void 0 : _a.hook;
        // 如果用户自定义了 vnode.data.hook.prepatch，则执行 prepatch 钩子
        (_b = hook === null || hook === void 0 ? void 0 : hook.prepatch) === null || _b === void 0 ? void 0 : _b.call(hook, oldVnode, vnode);
        
        // 获取dom elm（就是将要修改的dom节点）
        var elm = vnode.elm = oldVnode.elm;

        // 获取新旧虚拟dom的子元素（children属性）
        var oldCh = oldVnode.children;
        var ch = vnode.children;

        // 新旧vnode的引用相同，表示没有改变，直接返回
        if (oldVnode === vnode)
            return;

        // 如果新的vnode中存在data，则调用全局钩子进行对比更新（核心模块中定义的钩子函数）
        if (vnode.data !== undefined) {
            // 1、首先执行全局的update钩子，对vnode.elm本身属性进行更新
            for (var i_3 = 0; i_3 < cbs.update.length; ++i_3)
                cbs.update[i_3](oldVnode, vnode);
            // 2、然后调用自定义的update钩子，再次对vnode.elm进行更新（执行 vnode.data.hook.update 钩子）
            (_d = (_c = vnode.data.hook) === null || _c === void 0 ? void 0 : _c.update) === null || _d === void 0 ? void 0 : _d.call(_c, oldVnode, vnode);
        }

        /**
         * 分情况讨论：
         * ps：如果本身存在文本节点，则不存在子节点，即：有text就不会存在ch，反之亦然。
         * 1 vnode不是文本节点
         *  1.1 vnode不是文本节点，vnode还存在子节点
         *      1.1.1 vnode不是文本节点，vnode中存在子节点，oldvnode中存在子节点
         *      1.1.2 vnode不是文本节点，vnode中存在子节点，oldvnode中不存在子节点
         *          1.1.2.1 vnode不是文本节点，vnode中存在子节点，oldvnode中不存在子节点，oldvnode是文本节点
         *  1.2 vnode不是文本节点，vnode中不存在文本节点
         *      1.2.1 vnode不是文本节点，vnode中不存在子节点，oldvnode中存在子节点
         *      1.2.2 vnode不是文本节点，vnode中不存在子节点，oldvnode是文本节点
         * 2 vnode是文本节点
         *  2.1 vnode不是文本节点，并且oldvnode和vnode的文本节点不相等
         *  ps：这里只需要讨论这一种情况，因为如果old存在子节点，那么文本节点text为undefined，则与new的text不相等直接node.textContent即可清楚old存在的子节点。若old存在子节点，且相等则无需修改
         */
        // 1.
        if (isUndef(vnode.text)) {
            // 1.1.1
            if (isDef(oldCh) && isDef(ch)) {
                // 当vnode和oldvnode中都存在子节点并且子节点不相同时，则更新子节点
                if (oldCh !== ch)
                    updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            // 1.1.2
            else if (isDef(ch)) {
                // oldvnode是文本节点，则将elm中的text清除
                // 1.1.2.1
                if (isDef(oldVnode.text))
                    api.setTextContent(elm, '');
                // 将vnode中children添加到elm中
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            // 1.2.1
            // 如果oldvnode中存在子节点，而vnode中不存在字节点，则移除elm中children
            else if (isDef(oldCh)) {
                // 如果 oldVnode 有 children，而新的 vnode 只有文本节点；
                // 那就移除 vnode 即可。
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            // 1.2.2
            // 如果oldvnode是文本节点，vnode和oldvnode都没有children且vnode中没有text，则删除oldvnode中text
            else if (isDef(oldVnode.text)) {
                api.setTextContent(elm, '');
            }
        }
        // vnode是文本节点
        // 2.1
        else if (oldVnode.text !== vnode.text) {
            // 如果 oldVnode 具有 children 属性（具有 vnode），那么移除所有 vnode。
            if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            // 设置文本内容
            api.setTextContent(elm, vnode.text);
        }

        // patch对比完成，触发 postpatch 钩子
        (_e = hook === null || hook === void 0 ? void 0 : hook.postpatch) === null || _e === void 0 ? void 0 : _e.call(hook, oldVnode, vnode);
    }

    // 修补节点
    return function patch(oldVnode, vnode) {
        debugger
        var i, elm, parent;
        // insertedVnodeQueue用于记录被插入的真实dom的vnode队列，用于批量触发insert
        var insertedVnodeQueue = [];
        
        // patch开始之前调用全局钩子pre
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        
        // 如果oldvnode非vnode，则创建一个空的vnode（第一次调用时，oldVnode是dom element）
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }

        // 如果是同个节点，则进行修补（sel值和key值相同）
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        else {
            // 不是同一个节点，将新的vnode插入，并将oldvnode从其父节点上删除
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            createElm(vnode, insertedVnodeQueue);
            // 插入新节点，删除老节点
            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }

        // 插入完后，调用被插入的vnode的insert钩子
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }

        // patch结束之前，调用全局post钩子
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();

        // 返回最新的vnode，供下次更新使用
        return vnode;
    };
}
//# sourceMappingURL=snabbdom.js.map