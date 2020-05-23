// Bindig `requestAnimationFrame` like this fixes a bug in IE/Edge. See #360 and #409.
var raf = (typeof window !== 'undefined' && (window.requestAnimationFrame).bind(window)) || setTimeout;
var nextFrame = function (fn) {
    raf(function () {
        raf(fn);
    });
};
var reflowForced = false; // 强迫回流标志位
function setNextFrame(obj, prop, val) {
    nextFrame(function () {
        obj[prop] = val;
    });
}

// 对比节点，更新样式
function updateStyle(oldVnode, vnode) {
    var cur;
    var name;
    var elm = vnode.elm;
    var oldStyle = oldVnode.data.style;
    var style = vnode.data.style;
    // 新旧Vnode中都不存在style
    if (!oldStyle && !style)
        return;
    // 新旧Vnode中的style相同
    if (oldStyle === style)
        return;
    oldStyle = oldStyle || {};
    style = style || {};
    var oldHasDel = 'delayed' in oldStyle;
    // 遍历oldStyle
    for (name in oldStyle) {
        if (!style[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.removeProperty(name);
            }
            else {
                elm.style[name] = '';
            }
        }
    }
    // 遍历style
    for (name in style) {
        cur = style[name];
        if (name === 'delayed' && style.delayed) {
            for (var name2 in style.delayed) {
                cur = style.delayed[name2];
                if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
                    setNextFrame(elm.style, name2, cur);
                }
            }
        }
        // 新增style样式
        else if (name !== 'remove' && cur !== oldStyle[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.setProperty(name, cur);
            }
            else {
                elm.style[name] = cur;
            }
        }
    }
}
// 卸载元素前调用(优先级1) => 主要为被删除元素的子元素添加动画效果（transition等）
function applyDestroyStyle(vnode) {
    var style;
    var name;
    var elm = vnode.elm;
    var s = vnode.data.style;
    if (!s || !(style = s.destroy))
        return;
    for (name in style) {
        elm.style[name] = style[name];
    }
}
// 卸载元素时调用(优先级2) => 动画过后，执行删除回调
function applyRemoveStyle(vnode, rm) {
    var s = vnode.data.style;
    if (!s || !s.remove) {
        rm();
        return;
    }
    if (!reflowForced) {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        vnode.elm.offsetLeft;
        reflowForced = true;
    }
    var name;
    var elm = vnode.elm;
    var i = 0;
    var compStyle;
    var style = s.remove;
    var amount = 0;
    var applied = [];
    for (name in style) {
        applied.push(name);
        elm.style[name] = style[name];
    }
    compStyle = getComputedStyle(elm);
    var props = compStyle['transition-property'].split(', ');
    for (; i < props.length; ++i) {
        if (applied.indexOf(props[i]) !== -1)
            amount++;
    }
    elm.addEventListener('transitionend', function (ev) {
        if (ev.target === elm)
            --amount;
        if (amount === 0)
            rm();
    });
}
// 强制回流
function forceReflow() {
    reflowForced = false;
}
export var styleModule = {
    pre: forceReflow,
    create: updateStyle,
    update: updateStyle,
    destroy: applyDestroyStyle,
    remove: applyRemoveStyle
};
export default styleModule;
//# sourceMappingURL=style.js.map