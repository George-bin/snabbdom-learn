// 更新class
function updateClass(oldVnode, vnode) {
    var cur;
    var name;
    // 当前要挂载的元素
    var elm = vnode.elm;
    var oldClass = oldVnode.data.class; // 老的clasName
    var klass = vnode.data.class; // 新的className
    // 新老的 className 都没有
    if (!oldClass && !klass)
        return;
    // 新老的 className 没变
    if (oldClass === klass)
        return;
    oldClass = oldClass || {};
    klass = klass || {};
    // 与新Vnode的class做比较，删除新Vnode上不存在的class
    for (name in oldClass) {
        if (!klass[name]) {
            elm.classList.remove(name);
        }
    }
    // 根据新Vnode，新增或删除 class
    for (name in klass) {
        cur = klass[name];
        if (cur !== oldClass[name]) { // 和oldClass不一致的键值
            elm.classList[cur ? 'add' : 'remove'](name);
        }
    }
}
export var classModule = { create: updateClass, update: updateClass };
export default classModule;
//# sourceMappingURL=class.js.map