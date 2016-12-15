import $ from 'jquery';
import Layer from '@flexui/layer';
import Popup from './lib/popup.js';
import * as Utils from '@flexui/utils';

// 实例缓存
var DIALOGS = {};
var HANDLE_ROLE = 'handle';
var ACTION_ROLE = 'action';
var ROLE_ATTR = 'data-role';
var ACTION_ATTR = 'data-action';
// 弹窗主体框架
var DIALOG_FRAME =
  '<div class="{{className}}-title">' +
  '  <div id="{{titleId}}" class="{{className}}-caption" title="{{title}}">{{title}}</div>' +
  '  <div class="{{className}}-handle">' +
  '    <a href="javascript:;" title="关闭" ' + ROLE_ATTR + '="' + HANDLE_ROLE + '" ' +
  ACTION_ATTR + '="close" class="{{className}}-handle-close">×</a>' +
  '  </div>' +
  '</div>' +
  '<div id="{{contentId}}" class="{{className}}-content">{{content}}</div>' +
  '<div class="{{className}}-action">{{buttons}}</div>';
// 弹窗按钮
var DIALOG_BUTTON =
  '<button class="{{className}}" type="button" title="{{label}}" ' +
  ROLE_ATTR + '="' + ACTION_ROLE + '" ' + ACTION_ATTR + '="{{index}}">{{label}}</button>';
// 事件委托过滤选择器
var HANDLE_SELECTOR = '> .{{className}}-title > .{{className}}-handle';
var ACTION_SELECTOR = '> .{{className}}-action';
var DELEGATE_SELECTOR = HANDLE_SELECTOR + ' [data-role], ' + ACTION_SELECTOR + ' [data-role]';
// 默认设置
var DIALOG_SETTINGS = {
  id: null,
  buttons: [],
  fixed: false,
  keyboard: true,
  title: '弹出消息',
  skin: 'ui-dialog',
  align: 'bottom left'
};
// ID
var ID = Date.now();
// WAI-ARIA
var ARIA_LABELLEDBY = 'dialog-title:{{id}}';
var ARIA_DESCRIBEDBY = 'dialog-content:{{id}}'

/**
 * Dialog
 *
 * @export
 * @constructor
 * @param {String} content
 * @param {Object} options
 * @returns {Dialog}
 */
export default function Dialog(content, options) {
  var context = this;

  // 支持非 new 运算
  if (!(context instanceof Dialog)) {
    return new Dialog(content, options);
  }

  // 调用父类
  Popup.call(context);

  // 重新获取配置
  options = options || {};

  // 弹窗 id
  var id = options.id;

  // 有 id 存在的情况下防止重复弹出
  if (id && Utils.string(id)) {
    // 获取缓存
    var cache = DIALOGS[id];

    // 发现缓存
    if (cache) {
      // 移除所有绑定的事件
      cache.off();

      // 初始化内容
      cache.__initContent(content);
      // 初始化参数
      cache.__initOptions(options);

      // 渲染
      return cache.__render();
    }

    // ID
    context.id = id;
    // 缓存 id
    DIALOGS[id] = context;
  } else {
    // ID
    context.id = String(ID++);
  }

  // 设置 WAI-ARIA
  context.__node
    .attr('aria-labelledby', Utils.template(ARIA_LABELLEDBY, { id: context.id }))
    .attr('aria-describedby', Utils.template(ARIA_DESCRIBEDBY, { id: context.id }));

  // 初始化内容
  context.__initContent(content);
  // 初始化参数
  context.__initOptions(options);
  // 初始化事件
  context.__initEvents();
  // 渲染
  context.__render();
}

/**
 * 键盘响应函数
 *
 * @param {Number} which
 * @param {Dialog} context
 */
function keyboard(which, context) {
  context.options.buttons.forEach(function(button) {
    if (button.which === which && Utils.fn(button.action)) {
      button.action.call(context);
    }
  });

  // Esc 按键
  if (which === 27) {
    context.close();
  }
}

// 按键响应
Utils.doc.on('keyup', function(e) {
  var active = Layer.active;

  if (active instanceof Dialog && active.options.keyboard) {
    var which = e.which;
    var target = e.target;
    var selector = Utils.template(ACTION_SELECTOR, {
      className: active.className
    });
    var action = active.__node.find(selector)[0];

    // 过滤 enter 键触发的事件，防止在特定情况回调两次的情况
    if (which !== 13 || !action || !action.contains(target)) {
      keyboard(which, active);
    }
  }
});

/**
 * 初始 z-index 值
 *
 * @static
 * @param {Number} [zIndex]
 * @return {Number}
 */
Dialog.zIndex = function(zIndex) {
  if (arguments.length) {
    if (Utils.number(zIndex) && zIndex > 0 && zIndex !== Infinity) {
      Layer.zIndex = zIndex;
    }
  }

  return Layer.zIndex;
};

// 父类移除方法缓存
var POPUP_REMOVE = Popup.prototype.remove;

// 原型方法
Utils.inherits(Dialog, Popup, {
  /**
   * 构造函数
   * @public
   * @readonly
   */
  constructor: Dialog,
  /**
   * 初始化参数
   *
   * @private
   *@param {Object} options
   */
  __initContent: function(content) {
    var context = this;

    context.content = Utils.string(content) ? content : '';

    return context;
  },
  /**
   * 初始化参数
   *
   * @private
   * @param {Object} options
   * @param {Object} defaults
   */
  __initOptions: function(options, defaults) {
    var context = this;

    // 合并默认参数
    context.options = options = $.extend({}, defaults || DIALOG_SETTINGS, options);

    // 格式化属性
    options.title = Utils.string(options.title) ? options.title : DIALOG_SETTINGS.title;
    options.buttons = Array.isArray(options.buttons) ? options.buttons : DIALOG_SETTINGS.buttons;
    options.skin = options.skin && Utils.string(options.skin) ? options.skin : DIALOG_SETTINGS.skin;

    // 设置属性
    context.fixed = options.fixed;
    context.align = options.align;
    context.className = options.skin;

    return context;
  },
  /**
   * 初始化事件绑定
   *
   * @private
   */
  __initEvents: function() {
    var context = this;
    var options = context.options;
    // 选择器
    var selector = Utils.template(DELEGATE_SELECTOR, {
      className: context.className
    });

    // 绑定事件
    context.__node.on('click', selector, function() {
      var target = $(this);
      var role = target.attr(ROLE_ATTR);
      var action = target.attr(ACTION_ATTR);

      switch (role) {
        case HANDLE_ROLE:
          if (action === 'close') {
            keyboard(27, context);
          }
          break;
        case ACTION_ROLE:
          var button = options.buttons ? options.buttons[action] : null;

          if (button && Utils.fn(button.action)) {
            button.action.call(context);
          }
          break;
      }
    });

    // 窗口改变重新定位
    Utils.win.on('resize', context.__resize = function() {
      context.reset();
    });

    return context;
  },
  /**
   * 渲染内容
   *
   * @private
   */
  __render: function() {
    var buttons = '';
    var context = this;
    var content = context.content;
    var options = context.options;

    // 生成按钮
    options.buttons.forEach(function(button, index) {
      buttons += Utils.template(DIALOG_BUTTON, {
        className: button.className,
        label: button.label,
        index: index
      });
    });

    // 设置内容
    context.innerHTML = Utils.template(DIALOG_FRAME, {
      className: context.className,
      title: options.title,
      content: content,
      buttons: buttons,
      titleId: Utils.template(ARIA_LABELLEDBY, { id: context.id }),
      contentId: Utils.template(ARIA_DESCRIBEDBY, { id: context.id })
    });

    return context;
  },
  /**
   * 重新设置内容和参数
   *
   * @public
   * @param {String} name
   * @param {String|Object} value
   */
  set: function(name, value) {
    var context = this;

    // 参数不合法不做处理
    if (!name || !Utils.string(name) || !value) {
      return context;
    }

    switch (name) {
      case 'content':
        // 重新初始化内容
        context.__initContent(value);
        break;
      case 'options':
        // 重新初始化参数， id 禁止覆写
        context.__initOptions(value, context.options);
        break;
    }

    // 重新渲染
    return context.__render();
  },
  /**
   * 移除销毁弹窗
   *
   * @public
   */
  remove: function() {
    var context = this;

    // 销毁不做处理
    if (!context.destroyed) {
      var id = context.id;
      var resize = context.__resize;

      // 调用父类方法
      POPUP_REMOVE.call(context);

      // 删除缓存
      if (context.destroyed) {
        // 移除窗口变更事件
        Utils.win.off('resize', resize);

        // 删除缓存
        if (DIALOGS[id]) {
          delete DIALOGS[id];
        }
      }
    }

    return context;
  }
});
