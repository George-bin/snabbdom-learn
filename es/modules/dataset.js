var CAPS_REGEX = /[A-Z]/g;
// 更新dataset
function updateDataset(oldVnode, vnode) {
    var elm = vnode.elm;
    var oldDataset = oldVnode.data.dataset;
    var dataset = vnode.data.dataset;
    var key;
    // 不变的情况下不处理
    if (!oldDataset && !dataset)
        return;
    if (oldDataset === dataset)
        return;
    oldDataset = oldDataset || {};
    dataset = dataset || {};
    var d = elm.dataset;
    // 删除多余的 dataset
    for (key in oldDataset) {
        if (!dataset[key]) {
            if (d) {
                if (key in d) {
                    delete d[key];
                }
            }
            else {
                // 兼容性处理
                // 将驼峰式改为中划线分割  eg: userName ----> user-name
                elm.removeAttribute('data-' + key.replace(CAPS_REGEX, '-$&').toLowerCase());
            }
        }
    }
    // 修改有变化的 dataset
    for (key in dataset) {
        if (oldDataset[key] !== dataset[key]) {
            if (d) {
                d[key] = dataset[key];
            }
            else {
                // 兼容性处理
                // 将驼峰式改为中划线分割  eg: userName ----> user-name
                elm.setAttribute('data-' + key.replace(CAPS_REGEX, '-$&').toLowerCase(), dataset[key]);
            }
        }
    }
}
export var datasetModule = { create: updateDataset, update: updateDataset };
export default datasetModule;
//# sourceMappingURL=dataset.js.map