import $ from 'jquery';
import Layer from '@flexui/layer';
import Popup from './lib/popup.js';
import * as Utils from '@flexui/utils';

// 实例缓存
var DIALOGS = {};
var HANDLE_ROLE = 'handle';
var ACTION_ROLE = 'action';
// 弹窗主体框架
var DIALOG_FRAME =
  '<div class="{{className}}-title">' +
  '  <div class="{{className}}-caption" title="{{title}}">{{title}}</div>' +
  '  <div class="{{className}}-handle">' +
  '    <a href="javascript:;" title="关闭" role="' + HANDLE_ROLE + '" data-action="close" class="{{className}}-handle-close">×</a>' +
  '  </div>' +
  '</div>' +
  '<div class="{{className}}-content">{{content}}</div>' +
  '<div class="{{className}}-action">{{buttons}}</div>';
// 弹窗按钮
var DIALOG_BUTTON =
  '<button class="{{className}}" type="button" role="' + ACTION_ROLE + '" title="{{label}}" data-action="{{index}}">{{label}}</button>';
// 事件委托过滤选择器
var HANDLE_SELECTOR = '.{{className}}-handle';
var ACTION_SELECTOR = '.{{className}}-action';
var DELEGATE_SELECTOR = HANDLE_SELECTOR + ' [role], ' + ACTION_SELECTOR + ' [role]';

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

  // 调用父类
  Popup.call(context);

  // 重新获取配置
  options = options || {};

  // 弹窗 id
  var id = options.id;

  // 有 id 存在的情况下防止重复弹出
  if (Utils.string(id)) {
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
    } else {
      // 缓存 id
      DIALOGS[id] = context;
    }
  }

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
Utils.win.on('keyup', function(e) {
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
   *@param {Object} options
   */
  __initOptions: function(options) {
    var context = this;

    // 合并默认参数
    context.options = options = Utils.mix({
      id: null,
      buttons: [],
      anchor: null,
      fixed: false,
      keyboard: true,
      title: '弹出消息',
      skin: 'ui-dialog',
      align: 'bottom left'
    }, options);

    options.title = Utils.string(options.title) ? options.title : '弹出消息';
    options.buttons = Array.isArray(options.buttons) ? options.buttons : [];

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
      var role = target.attr('role');
      var action = target.attr('data-action');

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
      buttons: buttons
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
    var refresh = false;

    switch (name) {
      case 'content':
        var content = context.content;

        context.__initContent(value || content);

        // 是否需要刷新
        if (content !== context.content) {
          refresh = true;
        }
        break;
      case 'options':
        if (value) {
          refresh = true;
          value.id = context.options.id;

          context.__initOptions(value);
        }
        break;
    }

    return refresh ? context.__render() : context;
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
      var id = context.options.id;
      var resize = context.__resize;

      // 调用父类方法
      POPUP_REMOVE.call(context);

      // 删除缓存
      if (context.destroyed) {
        // 移除窗口变更事件
        Utils.win.off('resize', resize);

        // 删除缓存
        if (Utils.string(id)) {
          delete DIALOGS[id];
        }
      }
    }

    return context;
  }
});
