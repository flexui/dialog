import Layer from '@flexui/layer';
import Popup from './lib/popup.js';
import * as Utils from '@flexui/utils';

var DIALOGS = {};

export default function Dialog(content, options) {
  var context = this;

  Popup.call(context);

  context.options = options = $(true, {
    id: null,
    fixed: false,
    anchor: null,
    title: '弹出消息',
    skin: 'ui-dialog',
    align: 'bottom left',
    buttons: [{
      label: '确认',
      action: function() {

      }
    }, {
      label: '取消',
      action: function() {

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

// 按键响应
Utils.win.on('keyup', function(e) {
  var active = Layer.active;

  if (e.which === 27 && active && active instanceof Dialog) {
    active.close();
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
