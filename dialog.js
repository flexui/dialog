import $ from 'jquery';
import Layer from '@flexui/layer';
import Popup from './lib/popup.js';
import * as Utils from '@flexui/utils';

// 实例缓存
var DIALOGS = {};
var HANDLE_ROLE = 'handle';
var ACTION_ROLE = 'action';
var ROLE_ATTR = 'data-role';
var ACTION_ID_ATTR = 'data-action-id';
// 弹窗标题
var DIALOG_TITLE =
  '<div id="{{id}}" class="{{skin}}-caption" title={{title}}>{{value}}</div>';
// 弹窗内容
var DIALOG_CONTENT =
  '<div id="{{id}}" class="{{skin}}-content">{{content}}</div>';
// 弹窗主体框架
var DIALOG_FRAME =
  '<div class="{{skin}}-title">' +
  '  {{title}}' +
  '  <div class="{{skin}}-handle">{{handles}}</div>' +
  '</div>' +
  '{{content}}' +
  '<div class="{{skin}}-action">{{buttons}}</div>';
// 标题栏操作按钮，例如关闭，最大化，最小化等
var DIALOG_HANDLE =
  '<a href="javascript:;" class="{{className}}" title="{{title}}" ' +
  ROLE_ATTR + '="' + HANDLE_ROLE + '" ' + ACTION_ID_ATTR + '="{{index}}">{{value}}</a>';
// 弹窗按钮，例如确认，取消等
var DIALOG_BUTTON =
  '<button type="button" class="{{className}}" title="{{title}}" ' +
  ROLE_ATTR + '="' + ACTION_ROLE + '" ' + ACTION_ID_ATTR + '="{{index}}">{{value}}</button>';
// 标题栏操作按钮面板选择器
var HANDLE_SELECTOR =
  '> .{{skin}}-title > .{{skin}}-handle';
// 按钮面板
var ACTION_SELECTOR =
  '> .{{skin}}-action';
// 事件委托选择器
var DELEGATE_SELECTOR =
  HANDLE_SELECTOR + ' [' + ROLE_ATTR + '], ' + ACTION_SELECTOR + ' [' + ROLE_ATTR + ']';
// 默认设置
var DIALOG_SETTINGS = {
  id: null,
  // 弹出标题， {String|Object}
  title: '',
  // 标题栏操作按钮
  handles: [],
  // 弹窗按钮，参数同 title
  buttons: [],
  fixed: false,
  // 键盘操作
  keyboard: true,
  // 皮肤
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
 * 执行动作回调
 *
 * @param items
 * @param which
 * @param context
 */
function execAction(items, which, context) {
  items.forEach(function(item) {
    if (item.which === which && Utils.fn(item.action)) {
      item.action.call(context, item);
    }
  });
}

/**
 * 键盘响应函数
 *
 * @param {Number} which
 * @param {Dialog} context
 */
function keyboard(which, context) {
  var options = context.options;

  execAction(options.handles, which, context);
  execAction(options.buttons, which, context);
}

// 按键响应
Utils.doc.on('keyup', function(e) {
  var active = Layer.active;

  if (active instanceof Dialog && active.options.keyboard) {
    var which = e.which;
    var target = e.target;
    var dialog = active.__node;
    var skin = active.className;

    // 按钮容器
    var action = dialog.find(Utils.template(ACTION_SELECTOR, { skin: skin }))[0];
    // 窗体操作框容器
    var handle = dialog.find(Utils.template(HANDLE_SELECTOR, { skin: skin }))[0];

    // 过滤 enter 键触发的事件，防止在特定情况回调两次的情况
    if (which === 13) {
      // 触发元素是否再容器中
      if ((handle && handle.contains(target)) || (action && action.contains(target))) {
        return e.preventDefault();
      }
    }

    // 执行逻辑
    keyboard(which, active);
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
   * @param {Object} options
   * @param {Object} defaults
   */
  __initOptions: function(options, defaults) {
    var context = this;

    // 合并默认参数
    context.options = options = $.extend({}, defaults || DIALOG_SETTINGS, options);

    // 格式化标题
    options.title = options.title || DIALOG_SETTINGS.title;

    // 标题如果是字符串特殊处理
    if (Utils.string(options.title)) {
      options.title = {
        title: options.title,
        value: options.title
      };
    }

    // 格式化其它参数
    options.handles = Array.isArray(options.handles) ? options.handles : DIALOG_SETTINGS.handles;
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
      skin: context.className
    });

    // 绑定事件
    context.__node.on('click', selector, function() {
      var current;
      var target = $(this);
      var role = target.attr(ROLE_ATTR);
      var id = target.attr(ACTION_ID_ATTR);

      switch (role) {
        case HANDLE_ROLE:
          current = options.handles[id];
          break;
        case ACTION_ROLE:
          current = options.buttons[id];
          break;
      }

      if (current && Utils.fn(current.action)) {
        current.action.call(context);
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
    var handles = '';
    var buttons = '';
    var context = this;
    var id = context.id;
    var skin = context.className;
    var content = context.content;
    var options = context.options;
    var title = options.title;

    // 生成标题栏操作按钮
    options.handles.forEach(function(handle, index) {
      handles += Utils.template(DIALOG_HANDLE, {
        className: Utils.template(handle.className, { skin: skin }),
        title: handle.title || handle.value || '',
        value: handle.value || '',
        index: index
      });
    });

    // 生成按钮
    options.buttons.forEach(function(button, index) {
      buttons += Utils.template(DIALOG_BUTTON, {
        className: Utils.template(button.className, { skin: skin }),
        title: button.title || button.value || '',
        value: button.value || '',
        index: index
      });
    });

    // 设置内容
    context.innerHTML = Utils.template(DIALOG_FRAME, {
      skin: skin,
      title: Utils.template(DIALOG_TITLE, {
        id: Utils.template(ARIA_LABELLEDBY, { id: id }),
        skin: skin,
        title: title.title || title.value || '',
        value: title.value || ''
      }),
      handles: handles,
      content: Utils.template(DIALOG_CONTENT, {
        id: Utils.template(ARIA_DESCRIBEDBY, { id: id }),
        skin: skin,
        content: content
      }),
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
