import $ from 'jquery';
import Popup from './lib/popup.js';
import Layer from '@flexui/layer';
import * as Utils from '@flexui/utils';
import DIALOG_FRAME from './views/dialog.html';

// 变量
var DIALOGS = {};
// 弹窗标题栏
var DIALOG_PANEL_HEADER = '>.ui-dialog-header';
// 弹窗面板选择器映射
var DIALOG_PANELS = {
  header: DIALOG_PANEL_HEADER,
  title: DIALOG_PANEL_HEADER + '>.ui-dialog-title',
  controls: DIALOG_PANEL_HEADER + '>.ui-dialog-controls',
  content: '>.ui-dialog-content',
  buttons: '>.ui-dialog-buttons'
}

// ID
var DIALOG_ID = Date.now();
// WAI-ARIA
var ARIA_LABELLEDBY = 'aria-title:<%= @id %>';
var ARIA_DESCRIBEDBY = 'aria-content:<%= @id %>';

// 默认设置
var DIALOG_SETTINGS = {
  // 弹窗标识，设置后可以防止重复弹窗
  id: null,
  // 弹出标题， {String|Object}
  title: { title: '', value: '' },
  // 标题栏操作按钮 { title, value, which, action }
  controls: [],
  // 弹窗按钮，参数同 controls
  buttons: [],
  // 弹窗内容宽度
  width: 'auto',
  // 弹窗内容高度
  height: 'auto',
  // 是否 fixed 定位
  fixed: false,
  // 键盘操作
  keyboard: true,
  // 皮肤
  skin: 'default',
  // 定位方式
  align: 'bottom left'
};

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
      // 渲染内容
      cache.__render();

      return cache;
    }

    // ID
    context.id = id;
    // 缓存 id
    DIALOGS[id] = context;
  } else {
    // ID
    context.id = id = String(DIALOG_ID++);
  }

  // 调用父类
  Popup.call(context);

  // 初始化模板函数
  var views = context.views = {
    frame: Utils.template(DIALOG_FRAME),
    labelledby: Utils.template(ARIA_LABELLEDBY, { id: id }),
    describedby: Utils.template(ARIA_DESCRIBEDBY, { id: id })
  };

  // 设置 WAI-ARIA
  context.__node
    .attr('aria-labelledby', views.labelledby)
    .attr('aria-describedby', views.describedby);

  // 初始化内容
  context.__initContent(content);
  // 初始化参数
  context.__initOptions(options);
  // 初始化事件
  context.__initEvents();
  // 渲染内容
  context.__render();
}

/**
 * 执行动作回调
 *
 * @param {Array} items
 * @param {Event} event
 * @param {Dialog} context
 */
function execAction(items, event, context) {
  var which = event.which;

  // 遍历执行动作回掉
  items.forEach(function(item) {
    if (item.which === which && Utils.fn(item.action)) {
      item.action.call(context, event, item);
    }
  });
}

// 按键响应
Utils.doc.on('keydown', function(e) {
  var active = Layer.active;

  // 保证实例存在且开启了键盘事件
  if (active instanceof Dialog && !active.destroyed && active.options.keyboard) {
    var which = e.which;
    var target = e.target;
    var skin = active.className;

    // 按钮容器
    var buttons = active.panel('buttons');
    // 窗体操作框容器
    var controls = active.panel('controls');

    // 当焦点在按钮上时，enter 键会触发 click 事件，如果按钮绑定了 enter 键，会触发两次回调
    if (which !== 13 || (!buttons.contains(target) && !controls.contains(target))) {
      var options = active.options;

      // 触发所有键盘绑定动作，优先执行 buttons
      execAction(options.buttons, e, active);
      execAction(options.controls, e, active);
    }
  }
});

// 原型方法
Utils.inherits(Dialog, Popup, {
  /**
   * 构造函数
   *
   * @public
   * @readonly
   */
  constructor: Dialog,
  /**
   * 显示浮层（私有），覆写父类方法
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

    // 设置主题
    context.className = 'ui-' + context.options.skin + '-dialog';

    // 调用父类方法
    return Popup.prototype.__show.call(context, anchor);
  },
  /**
   * 初始化参数
   *
   * @private
   * @param {Object} options
   */
  __initContent: function(content) {
    var context = this;

    context.content = Utils.string(content) ? content : '';
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

    // 格式化标题
    var title = options.title;
    var controls = options.controls;
    var buttons = options.buttons;
    var skin = options.skin;

    // 标题如果是字符串特殊处理
    if (Utils.string(title)) {
      title = { title: title, value: title };
    }

    // 格式化参数
    options.title = title || DIALOG_SETTINGS.title;
    options.skin = skin && Utils.string(skin) ? skin : DIALOG_SETTINGS.skin;
    options.width = Utils.addCSSUnit(options.width) || DIALOG_SETTINGS.which;
    options.height = Utils.addCSSUnit(options.height) || DIALOG_SETTINGS.height;
    options.buttons = Array.isArray(buttons) ? buttons : DIALOG_SETTINGS.buttons;
    options.controls = Array.isArray(controls) ? controls : DIALOG_SETTINGS.controls;
  },
  /**
   * 初始化事件绑定
   *
   * @private
   */
  __initEvents: function() {
    var context = this;
    // 选择器
    var selector = DIALOG_PANELS.buttons + '>[data-role],' + DIALOG_PANELS.controls + '>[data-role]';

    // 绑定事件
    context.__node.on('click', selector, function(e) {
      var current;
      var target = $(this);
      var options = context.options;
      var role = target.attr('data-role');
      var id = target.attr('data-action-id');

      switch (role) {
        case 'control':
          current = options.controls[id];
          break;
        case 'action':
          current = options.buttons[id];
          break;
      }

      // 执行回掉
      if (current && Utils.fn(current.action)) {
        current.action.call(context, e, current);
      }
    });

    // 窗口改变重新定位
    Utils.win.on('resize', context.__resize = function() {
      context.reset();
    });
  },
  /**
   * 渲染内容
   *
   * @private
   */
  __render: function() {
    var context = this;
    var views = context.views;
    var data = $.extend({}, context.options, {
      content: context.content,
      labelledby: views.labelledby,
      describedby: views.describedby
    });

    // 设置内容
    context.innerHTML = views.frame(data);
  },
  /**
   * 获取弹窗各个面板
   *
   * @public
   * @param {String} panel
   * @returns{HTMLElement|Undefined}
   */
  panel: function(panel) {
    var dialog = this.__node;

    // 获取弹窗
    if (panel === 'dialog') {
      return dialog[0];
    }

    // 获取其它面板
    if (DIALOG_PANELS.hasOwnProperty(panel)) {
      return dialog.find(DIALOG_PANELS[panel])[0];
    }
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
      Popup.prototype.remove.call(context);

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
  }
});
