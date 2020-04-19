// 更新props
function updateProps(oldVnode, vnode) {
    var key;
    var cur;
    var old;
    var elm = vnode.elm;
    var oldProps = oldVnode.data.props;
    var props = vnode.data.props;
    if (!oldProps && !props)
        return;
    if (oldProps === props)
        return;
    oldProps = oldProps || {};
    props = props || {};
    // 删除多余属性
    for (key in oldProps) {
        if (!props[key]) {
            delete elm[key];
        }
    }
    // 添加新增的属性
    for (key in props) {
        cur = props[key];
        old = oldProps[key];
        // key为value的情况，再判断是否value有变化
        // key不为value的情况，直接更新
        if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
            elm[key] = cur;
        }
    }
}
export var propsModule = { create: updateProps, update: updateProps };
export default propsModule;
//# sourceMappingURL=props.js.map