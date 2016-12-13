import Layer from '@flexui/layer';
import Popup from './lib/popup.js';
import * as Utils from '@flexui/utils';

// 实例缓存
var DIALOGS = {};
var HANDLEROLE = 'handle';
var ACTIONROLE = 'action';
var DIALOGFRAME =
  '<div class="{{className}}-title">' +
  '  <div class="{{className}}-caption">{{title}}</div>' +
  '  <div class="{{className}}-handle">' +
  '    <a href="javascript:;" title="关闭" role="' + HANDLEROLE + '" data-action="close" class="{{className}}-handle-close">×</a>' +
  '  </div>' +
  '</div>' +
  '<div class="{{className}}-content">{{content}}</div>' +
  '<div class="{{className}}-action">{{buttons}}</div>';
var DELEGATESELECTOR = '.{{className}}-handle [role], .{{className}}-action [role]';
var DIALOGBUTTON = '<button class="{{className}}" type="button" role="' + ACTIONROLE + '" title="{{label}}" data-action="{{index}}">{{label}}</button>';

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

  // 初始化内容
  context.__initContent(content);
  // 初始化参数
  context.__initOptions(options);

  // 重新获取配置
  options = context.options;

  // 有 id 存在的情况下防止重复弹出
  if (Utils.string(options.id)) {
    if (DIALOGS[options.id]) {
      return context.__render();
    } else {
      DIALOGS[options.id] = context;
    }
  }

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
    var target = $(e.target);
    var role = target.attr('role');

    // 过滤 enter 键触发的事件，防止在特定情况回调两次的情况
    if (which !== 13 ||
      role !== ACTIONROLE ||
      !active.node.contains(e.target)) {
      keyboard(which, active);
    }
  }
});

// 父类移除方法缓存
var POPUPREMOVE = Popup.prototype.remove;

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
    var selector = Utils.template(DELEGATESELECTOR, {
      className: context.className
    });

    // 绑定事件
    context.__node.on('click', selector, function() {
      var target = $(this);
      var role = target.attr('role');
      var action = target.attr('data-action');

      switch (role) {
        case HANDLEROLE:
          if (action === 'close') {
            keyboard(27, context);
          }
          break;
        case ACTIONROLE:
          var button = options.buttons ? options.buttons[action] : null;

          if (button && Utils.fn(button.action)) {
            button.action.call(context);
          }
          break;
      }
    });

    return context;
  },
  /**
   * 渲染内容
   *
   * @private
   */
  __render: function(content, options) {
    var buttons = '';
    var context = this;
    var content = context.content;
    var options = context.options;

    // 生成按钮
    options.buttons.forEach(function(button, index) {
      buttons += Utils.template(DIALOGBUTTON, {
        className: button.className,
        label: button.label,
        index: index
      });
    });

    // 设置内容
    context.innerHTML = Utils.template(DIALOGFRAME, {
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

    switch (name) {
      case 'content':
        context.__initContent(value);
        break;
      case 'options':
        context.__initOptions(value);
        break;
    }

    return context.__render();
  },
  /**
   * 移除销毁弹窗
   *
   * @public
   */
  remove: function() {
    var context = this;
    var id = context.options.id;

    // 调用父类方法
    POPUPREMOVE.call(context);

    // 删除缓存
    if (context.destroyed && Utils.string(id)) {
      delete DIALOGS[id];
    }

    return context;
  }
});
