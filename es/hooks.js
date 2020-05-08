// 在 `patch` 开始执行的时候调用
// pre?: PreHook;

// 在 `createElm`，进入的时候调用init => 已经创建了一个Vnode
// init?: InitHook;

// 创建真实DOM的时候，调用 create => 已经基于 vnode 创建了一个 DOM，但尚未挂载
// create?: CreateHook;

// 在`patch`方法接近完成的时候，才收集所有的插入节点，遍历调用响应的钩子 => 可以认为插入到DOM树时触发
// insert?: InsertHook;

// 在两个节点开始对比前调用 => 一个元素即将被 patch
// prepatch?: PrePatchHook;

// 更新过程中，调用update => 使用vnode中的属性同步oldvnode中的属性 => 调用create钩子中的所有update方法（class, props, style, event）
// update?: UpdateHook;

// 两个节点对比完成时候调用 => 元素已经 patch 完毕
// postpatch?: PostPatchHook;

// 删除节点的时候调用，包括子节点的destroy也会被触发 => 一个元素被直接或间接地移除了。间接移除的情况是指被移除元素的子元素
// destroy?: DestroyHook;

// 删除当前节点的时候调用。元素从父节点删除时触发，和destory略有不同，remove只影响到被移除节点中最顶层的节点 => 一个元素被直接移除了（卸载)
// remove?: RemoveHook;

// 在`patch`方法的最后调用，也就是patch完成后触发 => patch 结束
// post?: PostHook;

//# sourceMappingURL=hooks.js.map