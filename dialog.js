import $ from 'jquery';
import Popup from './lib/popup.js';
import Layer from '@flexui/layer';
import * as Utils from '@flexui/utils';

// 变量
var DIALOGS = {};
var DIALOG_CONTROL_ROLE = 'control';
var DIALOG_ACTION_ROLE = 'action';
var DIALOG_ROLE_ATTR = 'data-role';
var DIALOG_ACTION_ID_ATTR = 'data-action-id';
var DIALOG_CLASS_HEADER = '{{skin}}-header';
var DIALOG_CLASS_CONTROLS = '{{skin}}-controls';
var DIALOG_CLASS_ACTIONS = '{{skin}}-actions';
// 弹窗标题
var DIALOG_TITLE =
  '<div id="{{id}}" class="{{skin}}-title" title={{title}}>{{value}}</div>';
// 弹窗内容
var DIALOG_CONTENT =
  '<div id="{{id}}" class="{{skin}}-content">{{content}}</div>';
// 弹窗主体框架
var DIALOG_FRAME =
  '<div class="' + DIALOG_CLASS_HEADER + '">' +
  '  {{title}}' +
  '  <div class="' + DIALOG_CLASS_CONTROLS + '">{{controls}}</div>' +
  '</div>' +
  '{{content}}' +
  '<div class="' + DIALOG_CLASS_ACTIONS + '">{{actions}}</div>';
// 标题栏操作按钮，例如关闭，最大化，最小化等
var DIALOG_CONTROL =
  '<a href="javascript:;" class="{{className}}" title="{{title}}" ' +
  DIALOG_ROLE_ATTR + '="' + DIALOG_CONTROL_ROLE + '" ' + DIALOG_ACTION_ID_ATTR + '="{{index}}">{{value}}</a>';
// 弹窗按钮，例如确认，取消等
var DIALOG_ACTION =
  '<button type="button" class="{{className}}" title="{{title}}" ' +
  DIALOG_ROLE_ATTR + '="' + DIALOG_ACTION_ROLE + '" ' + DIALOG_ACTION_ID_ATTR + '="{{index}}">{{value}}</button>';
// 标题栏操作按钮面板选择器
var DIALOG_CONTROLS_SELECTOR =
  '> .' + DIALOG_CLASS_HEADER + ' > .' + DIALOG_CLASS_CONTROLS;
// 按钮面板
var DIALOG_ACTIONS_SELECTOR =
  '> .' + DIALOG_CLASS_ACTIONS;
// 事件委托选择器
var DIALOG_DELEGATE_SELECTOR =
  DIALOG_CONTROLS_SELECTOR + ' [' + DIALOG_ROLE_ATTR + '], ' + DIALOG_ACTIONS_SELECTOR + ' [' + DIALOG_ROLE_ATTR + ']';
// 默认设置
var DIALOG_SETTINGS = {
  // 弹窗标识，设置后可以防止重复弹窗
  id: null,
  // 弹出标题， {String|Object}
  title: { title: '', value: '' },
  // 标题栏操作按钮 { title, value, which, action }
  controls: [],
  // 弹窗按钮，参数同 controls
  actions: [],
  // 是否 fixed 定位
  fixed: false,
  // 键盘操作
  keyboard: true,
  // 皮肤
  skin: 'ui-dialog',
  // 定位方式
  align: 'bottom left'
};
// ID
var DIALOG_ID = Date.now();
// WAI-ARIA
var ARIA_LABELLEDBY = 'aria-title:{{id}}';
var ARIA_DESCRIBEDBY = 'aria-content:{{id}}'

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
      return cache.__render();
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

  // 设置 WAI-ARIA
  context.__node
    .attr('aria-labelledby', Utils.template(ARIA_LABELLEDBY, { id: id }))
    .attr('aria-describedby', Utils.template(ARIA_DESCRIBEDBY, { id: id }));

  // 主题
  var skin = options.skin;

  // 设置主题
  context.className = skin && Utils.string(skin) ? skin : DIALOG_SETTINGS.skin;

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
 * 渲染按钮和标题栏操作按钮
 *
 * @param {String} format
 * @param {Array} items
 * @param {String} skin
 * @returns {String}
 */
function renderActionView(format, items, skin) {
  var view = '';

  // 遍历配置数组
  items.forEach(function(item, index) {
    view += Utils.template(format, {
      className: Utils.template(item.className, { skin: skin }),
      title: item.title || item.value || '',
      value: item.value || '',
      index: index
    });
  });

  return view;
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
    var dialog = active.__node;
    var skin = active.className;

    // 窗体操作框容器
    var controls = dialog.find(Utils.template(DIALOG_CONTROLS_SELECTOR, { skin: skin }))[0];
    // 按钮容器
    var actions = dialog.find(Utils.template(DIALOG_ACTIONS_SELECTOR, { skin: skin }))[0];

    // 当焦点在按钮上时，enter 键会触发 click 事件，如果按钮绑定了 enter 键，会触发两次回调
    if (which !== 13 || (!controls.contains(target) && !actions.contains(target))) {
      var options = active.options;

      // 触发所有键盘绑定动作，优先执行 actions
      execAction(options.actions, e, active);
      execAction(options.controls, e, active);
    }
  }
});

// 父类移除方法缓存
var POPUP_REMOVE = Popup.prototype.remove;

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
   * 初始化参数
   *
   * @private
   * @param {Object} options
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
    var title = options.title;
    var controls = options.controls;
    var actions = options.actions;
    var skin = options.skin;

    // 标题如果是字符串特殊处理
    if (Utils.string(title)) {
      title = { title: title, value: title };
    }

    // 格式化参数
    options.title = title || DIALOG_SETTINGS.title;
    options.controls = Array.isArray(controls) ? controls : DIALOG_SETTINGS.controls;
    options.actions = Array.isArray(actions) ? actions : DIALOG_SETTINGS.actions;
    options.skin = skin && Utils.string(skin) ? skin : DIALOG_SETTINGS.skin;

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
    // 选择器
    var selector = Utils.template(DIALOG_DELEGATE_SELECTOR, {
      skin: context.className
    });

    // 绑定事件
    context.__node.on('click', selector, function(e) {
      var current;
      var target = $(this);
      var options = context.options;
      var role = target.attr(DIALOG_ROLE_ATTR);
      var id = target.attr(DIALOG_ACTION_ID_ATTR);

      switch (role) {
        case DIALOG_CONTROL_ROLE:
          current = options.controls[id];
          break;
        case DIALOG_ACTION_ROLE:
          current = options.actions[id];
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

    return context;
  },
  /**
   * 渲染内容
   *
   * @private
   */
  __render: function() {
    var context = this;
    var id = context.id;
    var skin = context.className;
    var content = context.content;
    var options = context.options;
    var title = options.title;

    // 生成按钮
    var controls = renderActionView(DIALOG_CONTROL, options.controls, skin);
    var actions = renderActionView(DIALOG_ACTION, options.actions, skin);

    // 设置内容
    context.innerHTML = Utils.template(DIALOG_FRAME, {
      skin: skin,
      title: Utils.template(DIALOG_TITLE, {
        id: Utils.template(ARIA_LABELLEDBY, { id: id }),
        skin: skin,
        title: title.title || title.value || '',
        value: title.value || ''
      }),
      controls: controls,
      content: Utils.template(DIALOG_CONTENT, {
        id: Utils.template(ARIA_DESCRIBEDBY, { id: id }),
        skin: skin,
        content: content
      }),
      actions: actions
    });

    return context;
  },
  /**
   * 重新设置内容和参数
   *
   * @public
   * @param {String} name
   * @param {String|Object} value
   * @returns {Dialog}
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
        // 重新初始化参数， id 和 skin 禁止覆写
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
