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

  // 有 id 存在的情况下防止重复弹出
  if (Utils.string(options.id)) {
    if (DIALOGS[options.id]) {
      return context.__render(content, options);
    } else {
      DIALOGS[options.id] = context;
    }
  }

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

        if (button) {
          if (Utils.fn(button.action)) {
            button.action.call(context);
          }

          if (Utils.number(button.which)) {
            keyboard(button.which, context, button);
          }
          break;
        }
    }
  });

  // 渲染
  context.__render(content, options);
}

Dialog.items = function() {
  return DIALOGS;
};

/**
 * 键盘响应函数
 *
 * @param {Number} which
 * @param {Dialog} context
 * @param {Object} ignore
 */
function keyboard(which, context, ignore) {
  if (Array.isArray(context.options.buttons)) {
    context.options.buttons.forEach(function(button) {
      if (button.which === which && button !== ignore && Utils.fn(button.action)) {
        button.action.call(context);
      }
    });
  }

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

var POPUPREMOVE = Popup.prototype.remove;

Utils.inherits(Dialog, Popup, {
  /**
   * 构造函数
   * @public
   * @readonly
   */
  constructor: Dialog,
  __render: function(content, options) {
    var buttons = '';
    var context = this;

    // 生成按钮
    if (Array.isArray(options.buttons)) {
      options.buttons.forEach(function(button, index) {
        buttons += Utils.template(DIALOGBUTTON, {
          className: button.className,
          label: button.label,
          index: index
        });
      });
    }

    // 格式化内容
    content = Utils.string(content) ? content : '';

    // 设置内容
    context.innerHTML = Utils.template(DIALOGFRAME, {
      className: context.className,
      title: options.title,
      content: content,
      buttons: buttons
    });

    return context;
  },
  set: function(name, value) {

  },
  remove: function() {
    var context = this;
    var id = context.options.id;

    // 调用父类方法
    POPUPREMOVE.call(context);

    // 删除缓存
    if (context.destroyed && Utils.string(id)) {
      delete DIALOGS[id];
    }
  }
});
