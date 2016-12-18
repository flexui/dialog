import $ from 'jquery';
import Layer from '@flexui/layer';
import * as Utils from '@flexui/utils';
import * as EffectsEvents from '@flexui/effects-events';

// 对齐方式拆分正则
var ALIGNSPLIT_RE = /\s+/;
var POPUP_CLASS_SHOW = '-show';
var POPUP_CLASS_CLOSE = '-close';
var POPUP_CLASS_MODAL = '-modal';

/**
 * Popup
 *
 * @export
 * @constructor
 * @returns {Popup}
 */
export default function Popup() {
  var context = this;

  Layer.call(context);

  // 设置初始样式
  context.__node
    .addClass(context.className)
    .css({
      display: 'none',
      position: 'absolute',
      top: 0,
      left: 0
    });
}

Utils.inherits(Popup, Layer, {
  /**
   * close 返回值
   *
   * @public
   * @property
   */
  returnValue: undefined,
  /**
   * 跟随的 DOM 元素节点
   *
   * @public
   * @readonly
   */
  anchor: null,
  /**
   * 是否开启固定定位
   *
   * @public
   * @property
   */
  fixed: false,
  /**
   * 对齐方式
   *
   * @public
   * @property
   */
  align: 'bottom left',
  /**
   * CSS 类名
   * 只在浮层未初始化前可设置，之后不能更改
   *
   * @public
   * @property
   */
  className: 'ui-dialog',
  /**
   * 构造函数
   *
   * @public
   * @readonly
   */
  constructor: Popup,
  /**
   * 显示浮层（私有）
   *
   * @private
   * @param {HTMLElement}  指定位置（可选）
   */
  __show: function(anchor) {
    var context = this;

    // 已销毁
    if (context.destroyed) {
      return context;
    }

    var popup = context.__node;

    context.open = true;
    context.anchor = anchor || null;

    // 设置浮层
    popup
      .attr('role', context.modal ? 'alertdialog' : 'dialog')
      .css('position', context.fixed ? 'fixed' : 'absolute')
      .removeClass(context.className + POPUP_CLASS_CLOSE)
      .addClass(context.className + POPUP_CLASS_SHOW);

    // 设置内容
    if (context.__innerHTML !== context.innerHTML) {
      // 设置内容
      popup.html(context.innerHTML);

      // 缓存内容,防止重复替换
      context.__innerHTML = context.innerHTML;
    }

    // 弹窗添加到文档树
    popup.appendTo(document.body);

    // 添加模态类名
    if (context.modal) {
      popup.addClass(context.className + POPUP_CLASS_MODAL);
    }

    // 智能遮罩层显示
    context.__backdrop('show');

    // 显示浮层
    popup.show();

    // 执行定位操作
    context.reset();

    // 触发事件
    context.emit('show');

    // 聚焦
    context.focus();

    // 智能遮罩层层级设定
    context.__backdrop('z-index', context.zIndex);

    // 动画完成
    EffectsEvents.effectsEnd(popup, function() {
      // 显示完成事件
      context.emit('showed');
    });

    return context;
  },
  /**
   * 显示浮层
   *
   * @public
   * @param {HTMLElement}  指定位置（可选）
   */
  show: function(anchor) {
    var context = this;

    // 关闭模态
    if (context.modal) {
      var popup = context.__node;

      // 智能遮罩层隐藏
      if (context.open) {
        context.__backdrop('hide');
      }

      // 移除类名
      popup.removeClass(context.className + POPUP_CLASS_MODAL);
    }

    // 重置模态状态
    context.modal = false;

    // 显示
    return context.__show(anchor);
  },
  /**
   * 显示模态浮层
   *
   * @public
   * @param {HTMLElement}  指定位置（可选）
   */
  showModal: function(anchor) {
    var context = this;
    var popup = context.__node;

    // 重置模态状态
    context.modal = true;

    return context.__show(anchor);
  },
  /**
   * 关闭浮层
   *
   * @public
   * @param {any} result
   */
  close: function(result) {
    var context = this;

    // 销毁和未打开不做处理
    if (context.destroyed || !context.open) {
      return context;
    }

    // 关闭前
    if (context.emit('beforeclose') === false) {
      return context;
    }

    // 设置返回值
    if (result !== undefined) {
      context.returnValue = result;
    }

    var node = context.node;
    var popup = context.__node;

    // 切换弹窗样式
    popup
      .removeClass(context.className + POPUP_CLASS_SHOW)
      .addClass(context.className + POPUP_CLASS_CLOSE);

    // 恢复焦点，照顾键盘操作的用户
    context.blur();

    // 切换打开状态
    context.open = false;

    // 关闭事件
    context.emit('close');

    // 动画完成
    EffectsEvents.effectsEnd(popup, function() {
      // 隐藏弹窗
      popup.hide();

      // 智能遮罩层隐藏
      context.__backdrop('hide');

      // 关闭完成事件
      context.emit('closed');
    });

    return context;
  },
  /**
   * 销毁浮层
   *
   * @public
   */
  remove: function() {
    var context = this;

    // 已销毁
    if (context.destroyed) {
      return context;
    }

    // 移除前
    if (context.emit('beforeremove') === false) {
      return context;
    }

    // 调用失焦方法
    context.blur();

    // 智能遮罩层隐藏
    context.__backdrop('hide');

    // 移除事件绑定并从 DOM 中移除节点
    context.__node
      .off()
      .remove();

    // 切换销毁状态
    context.destroyed = true;

    // 触发销毁事件
    context.emit('remove');

    // 清理属性
    for (var property in context) {
      delete context[property];
    }

    return context;
  },
  /**
   * 重置位置
   *
   * @public
   */
  reset: function() {
    var context = this;

    // 销毁和未打开不做处理
    if (context.destroyed || !context.open) {
      return context;
    }

    // 对齐类名
    var align = context.__align;

    // 移除跟随定位类名
    if (align) {
      // 移除对齐类名
      context.__node.removeClass(align);

      // 清空对齐类名
      context.__align = null;
    }

    // 跟随元素
    var anchor = context.anchor;

    // 如果没有跟随居中显示
    if (anchor) {
      context.__follow(anchor);
    } else {
      // 居中显示
      context.__center();
    }

    // 触发事件
    context.emit('reset');

    return context;
  },
  /**
   * 居中浮层
   *
   * @private
   */
  __center: function() {
    var context = this;
    var popup = context.__node;
    var fixed = context.fixed;
    var clientWidth = Utils.win.width();
    var clientHeight = Utils.win.height();
    var scrollLeft = fixed ? 0 : Utils.doc.scrollLeft();
    var scrollTop = fixed ? 0 : Utils.doc.scrollTop();
    var dialogWidth = popup.outerWidth();
    var dialogHeight = popup.outerHeight();
    var top = (clientHeight - dialogHeight) * 382 / 1000 + scrollTop; // 黄金比例
    var left = (clientWidth - dialogWidth) / 2 + scrollLeft;

    popup.css({
      top: Math.max(parseFloat(top), scrollTop),
      left: Math.max(parseFloat(left), scrollLeft)
    })
  },
  /**
   * 跟随元素
   *
   * @private
   * @param {HTMLElement} anchor
   */
  __follow: function(anchor) {
    var context = this;
    var popup = context.__node;

    // 不能是根节点
    anchor = anchor.parentNode && $(anchor);

    // 定位元素不存在
    if (!anchor || !anchor.length) {
      return context.__center();
    }

    // 隐藏元素不可用
    if (anchor) {
      var offset = anchor.offset();

      if (offset.left * offset.top < 0) {
        return context.__center();
      }
    }

    var fixed = context.fixed;

    var clientWidth = Utils.win.width();
    var clientHeight = Utils.win.height();
    var scrollLeft = Utils.doc.scrollLeft();
    var scrollTop = Utils.doc.scrollTop();

    var dialogWidth = popup.outerWidth();
    var dialogHeight = popup.outerHeight();
    var anchorWidth = anchor ? anchor.outerWidth() : 0;
    var anchorHeight = anchor ? anchor.outerHeight() : 0;
    var offset = context.__offset(anchor[0]);
    var x = offset.left;
    var y = offset.top;
    var left = fixed ? x - scrollLeft : x;
    var top = fixed ? y - scrollTop : y;

    var minTop = fixed ? 0 : scrollTop;
    var minLeft = fixed ? 0 : scrollLeft;
    var maxTop = minTop + clientHeight - dialogHeight;
    var maxLeft = minLeft + clientWidth - dialogWidth;

    var css = {};
    var align = context.align.split(ALIGNSPLIT_RE);
    var className = context.className + '-';
    var reverse = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    var name = { top: 'top', bottom: 'top', left: 'left', right: 'left' };

    var temp = [
      {
        top: top - dialogHeight,
        bottom: top + anchorHeight,
        left: left - dialogWidth,
        right: left + anchorWidth
      },
      {
        top: top,
        bottom: top - dialogHeight + anchorHeight,
        left: left,
        right: left - dialogWidth + anchorWidth
      }
    ];

    var center = {
      top: top + anchorHeight / 2 - dialogHeight / 2,
      left: left + anchorWidth / 2 - dialogWidth / 2
    };

    var range = {
      left: [minLeft, maxLeft],
      top: [minTop, maxTop]
    };

    // 超出可视区域重新适应位置
    align.forEach(function(value, i) {
      // 超出右或下边界：使用左或者上边对齐
      if (temp[i][value] > range[name[value]][1]) {
        value = align[i] = reverse[value];
      }

      // 超出左或右边界：使用右或者下边对齐
      if (temp[i][value] < range[name[value]][0]) {
        align[i] = reverse[value];
      }
    });

    // 一个参数的情况
    if (!align[1]) {
      name[align[1]] = name[align[0]] === 'left' ? 'top' : 'left';
      temp[1][align[1]] = center[name[align[1]]];
    }

    //添加anchor的css, 为了给css使用
    className += align.join('-') + ' ' + context.className + '-follow';

    // 保存对齐类名
    context.__align = className;

    // 添加样式
    popup.addClass(className);

    // 设置样式属性
    css[name[align[0]]] = parseFloat(temp[0][align[0]]);
    css[name[align[1]]] = parseFloat(temp[1][align[1]]);

    // 设置样式
    popup.css(css);
  },
  /**
   * 获取元素相对于页面的位置（包括iframe内的元素）
   * 暂时不支持两层以上的 iframe 套嵌
   *
   * @private
   * @param {HTMLElement} anchor
   */
  __offset: function(anchor) {
    var isNode = anchor.parentNode;
    var offset = isNode ? $(anchor).offset() : {
      left: anchor.pageX,
      top: anchor.pageY
    };

    anchor = isNode ? anchor : anchor.target;

    var ownerDocument = anchor.ownerDocument;
    var defaultView = ownerDocument.defaultView || ownerDocument.parentWindow;

    if (defaultView == window) {
      // IE <= 8 只能使用两个等于号
      return offset;
    }

    // {Element: Ifarme}
    var frameElement = defaultView.frameElement;

    ownerDocument = $(ownerDocument);

    var scrollLeft = ownerDocument.scrollLeft();
    var scrollTop = ownerDocument.scrollTop();
    var frameOffset = $(frameElement).offset();
    var frameLeft = frameOffset.left;
    var frameTop = frameOffset.top;

    return {
      top: offset.top + frameTop - scrollTop,
      left: offset.left + frameLeft - scrollLeft
    };
  }
});
