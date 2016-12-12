import Layer from '@flexui/layer';
import Popup from './lib/popup.js';
import * as Utils from '@flexui/utils';

var DIALOGS = {};

export default function Dialog(content, options) {
  var context = this;

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
      action: function(e) {
        console.log('确认');
      }
    }, {
      which: 27,
      label: '取消',
      action: function() {
        console.log('取消');
      }
    }]
  }, options);

  if (Utils.string(options.id) && DIALOGS[options.id]) {
    return context;
  }
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
