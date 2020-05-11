import { vnode } from './vnode.js';
import * as is from './is.js';
function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        for (var i = 0; i < children.length; ++i) {
            var childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}

/**
 * 构建vnode
 * @param sel 选择器
 * @param b 数据
 * @param c 子节点
 */
export function h(sel, b, c) {
    var data = {}; // 属性：样式、属性、class名等
    var children; // 子节点类型
    var text; // 文本类型的数据(node | text)
    var i;
    // 三个参数
    if (c !== undefined) {
        // 三个参数的情况  sel , data , children | text
        if (b !== null) {
            data = b;
        }
        if (is.array(c)) {
            children = c;
        }
        // 文本（原始数据类型）
        else if (is.primitive(c)) {
            text = c;
        }
        // dom元素
        else if (c && c.sel) {
            children = [c];
        }
    }
    // 两个参数
    else if (b !== undefined && b !== null) { // 数据属性
        // 两个参数的情况 : sel , children | text
        // 两个参数的情况 : sel , data
        if (is.array(b)) {
            children = b;
        }
        else if (is.primitive(b)) { // 是否为基础类型string || number
            text = b;
        }
        else if (b && b.sel) { // 是否存在子组件
            children = [b];
        }
        else {
            data = b;
        }
    }
    // 存在子对象
    if (children !== undefined) {
        for (i = 0; i < children.length; ++i) {
            // 如果children是文本或数字，则创建文本节点
            if (is.primitive(children[i]))
                children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
        }
    }
    // 处理svg
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        // 增加 namespace
        addNS(data, children, sel);
    }
    // 生成vnode
    return vnode(sel, data, children, text, undefined); 
};
export default h;
//# sourceMappingURL=h.js.map