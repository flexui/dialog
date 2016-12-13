import Layer from '@flexui/layer';
import Popup from './lib/popup.js';
import * as Utils from '@flexui/utils';

// 实例缓存
var DIALOGS = {};
var DIALOGFRAME =
  '<div class="{{className}}-title">' +
  '  <div class="{{className}}-handle">' +
  '    <a href="javascript:;" title="关闭" role="handle" data-action="close" class="{{className}}-handle-close">×</a>' +
  '  </div>' +
  '</div>' +
  '<div class="{{className}}-content">{{content}}</div>' +
  '<div class="{{className}}-action">{{buttons}}</div>';
var DIALOGBUTTON = '<button class="{{className}}" role="action" title="{{label}}" data-action="{{index}}">{{label}}</button>';

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
    fixed: false,
    anchor: null,
    keyboard: true,
    title: '弹出消息',
    skin: 'ui-dialog',
    align: 'bottom left',
    buttons: [{
      which: 13,
      label: '确认',
      className: 'ui-button ui-button-yes',
      action: function(e) {
        console.log('确认');
      }
    }, {
      which: 27,
      label: '取消',
      className: 'ui-button ui-button-no',
      action: function() {
        console.log('取消');
      }
    }]
  }, options);

  if (Utils.string(options.id) && DIALOGS[options.id]) {
    return context;
  }

  var buttons = '';

  if (Array.isArray(options.buttons)) {
    options.buttons.forEach(function(button, index) {
      buttons += Utils.template(DIALOGBUTTON, {
        className: button.className,
        label: button.label,
        index: index
      });
    });
  }

  content = Utils.string(content) ? content : '';

  context.innerHTML = Utils.template(DIALOGFRAME, {
    className: context.className,
    content: content,
    buttons: buttons
  });

  var selector = Utils.template('.{{className}}-handle [role], .{{className}}-action [role]', {
    className: context.className
  });

  context.__node.on('click', selector, function(e) {
    var target = $(this);
    var role = target.attr('role');
    var action = target.attr('data-action');

    switch (role) {
      case 'handle':
        if (action === 'close') {
          keyboard(27, context);
        }
        break;
      case 'action':
        var button = options.buttons ? options.buttons[action] : null;

        if (button) {
          if (button.which) {
            keyboard(button.which, context);
          } else {
            if (Utils.fn(button.action)) {
              button.action.call(context);
            }
          }
          break;
        }
    }
  });
}

Dialog.items = function() {
  return DIALOGS;
};

/**
 * 键盘响应函数
 *
 * @param {Number} which
 * @param {Dialog} context
 */
function keyboard(which, context) {
  if (Array.isArray(context.options.buttons)) {
    context.options.buttons.forEach(function(button) {
      if (button.which === which && Utils.fn(button.action)) {
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
    keyboard(e.which, active)
  }
});

Utils.inherits(Dialog, Popup, {
  /**
   * 构造函数
   * @public
   * @readonly
   */
  constructor: Dialog,
  set: function(name, value) {

  }
});
