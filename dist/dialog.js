(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jquery')) :
  typeof define === 'function' && define.amd ? define('dialog', ['jquery'], factory) :
  (global.FlexUI = factory(global.jQuery));
}(this, (function ($) { 'use strict';

  $ = 'default' in $ ? $['default'] : $;

  var OP = Object.prototype;
  var AP = Array.prototype;
  var FP = Function.prototype;

  // toString
  var OPToString = OP.toString;
  var FPToString = FP.toString;

  /**
   * 获取数据类型
   *
   * @export
   * @param {any} value
   * @returns
   */
  function type(value) {
    return OPToString.call(value);
  }

  /**
   * 函数判定
   *
   * @export
   * @param {any} value
   * @returns
   */
  function fn(value) {
    return type(value) === '[object Function]';
  }

  /**
   * 字符串判定
   *
   * @export
   * @param {any} value
   * @returns
   */
  function string(value) {
    return type(value) === '[object String]';
  }

  /**
   * 数字判定
   *
   * @export
   * @param {any} value
   * @returns
   */
  function number(value) {
    return type(value) === '[object Number]';
  }

  /**
   * NaN判定
   *
   * @export
   * @param {any} value
   * @returns
   */


  // Native function RegExp
  // @see https://github.com/kgryte/regex-native-function/blob/master/lib/index.js
  var NATIVE_RE = '';

  // Use a native function as a template...
  NATIVE_RE += FPToString.call(Function);
  // Escape special RegExp characters...
  NATIVE_RE = NATIVE_RE.replace(/([.*+?^=!:$(){}|[\]\/\\])/g, '\\$1');
  // Replace any mentions of `Function` to make template generic.
  // Replace `for ...` and additional info provided in other environments, such as Rhino (see lodash).
  NATIVE_RE = NATIVE_RE.replace(/Function|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?');
  // Bracket the regex:
  NATIVE_RE = '^' + NATIVE_RE + '$';

  // Get RegExp
  NATIVE_RE = new RegExp(NATIVE_RE);

  /**
   * 是否是原生方法
   *
   * @export
   * @param {any} value
   * @returns
   */
  function native(value) {
    if (!fn(value)) {
      return false;
    }

    return NATIVE_RE.test(fn.toString());
  }

  // 类型判定接口
  // jquery 对象
  var win = $(window);
  var doc = $(document);

  /**
   * 属性拷贝
   *
   * @export
   * @param {Object} target 目标对象
   * @param {Object} seed 继承对象
   * @param {Array} list 名单
   * @param {Boolean} isWhite 是否是白名单
   */
  function mix(target, seed, list, isWhite) {
    if (!Array.isArray(list)) {
      list = false;
    }

    var index;

    // Copy "all" properties including inherited ones.
    for (var prop in seed) {
      if (seed.hasOwnProperty(prop)) {
        // 检测白名单
        if (list) {
          index = list.indexOf(prop);

          // 区分黑白名单
          if (isWhite ? index === -1 : index !== -1) {
            continue;
          }
        }

        // 在 iPhone 1 代等设备的 Safari 中，prototype 也会被枚举出来，需排除
        if (prop !== 'prototype') {
          target[prop] = seed[prop];
        }
      }
    }

    return target;
  }

  // 为了节省内存，使用一个共享的构造器
  function TClass() {
    // 空白中转类，可以减少内存占用
  }

  // Object setPrototypeOf
  var setPrototypeOf = Object.setPrototypeOf;

  // not suport setPrototypeOf
  if (!native(setPrototypeOf)) {
    setPrototypeOf = false;
  }

  // Object create
  var objectCreate = Object.create;

  // not suport create
  if (!native(objectCreate)) {
    objectCreate = false;
  }

  /**
   * 继承
   *
   * @export
   * @param {Class} subClass
   * @param {Class} superClass
   * @param {Object} properties
   * @returns {subClass}
   */
  function inherits(subClass, superClass, properties) {
    var superPrototype = superClass.prototype;

    if (setPrototypeOf) {
      setPrototypeOf(subClass.prototype, superPrototype);
    } else if (objectCreate) {
      subClass.prototype = objectCreate(superPrototype);
    } else {
      // 原型属性继承
      TClass.prototype = superPrototype;
      // 初始化实例
      subClass.prototype = new TClass();
      // 不要保持一个 superClass 的杂散引用
      TClass.prototype = null;
    }

    // 混合属性
    properties && mix(subClass.prototype, properties);

    // 设置构造函数
    subClass.prototype.constructor = subClass;

    return subClass;
  }

  /**
   * 高性能 apply
   *
   * @param  {Function} func
   * @param  {Any} context
   * @param  {Array} args
   * call is faster than apply, optimize less than 6 args
   * https://github.com/micro-js/apply
   * http://blog.csdn.net/zhengyinhui100/article/details/7837127
   */
  function apply(func, context, args) {
    switch (args.length) {
      // faster
      case 0:
        return func.call(context);
      case 1:
        return func.call(context, args[0]);
      case 2:
        return func.call(context, args[0], args[1]);
      case 3:
        return func.call(context, args[0], args[1], args[2]);
      default:
        // slower
        return func.apply(context, args);
    }
  }

  // original getComputedStyle
  var originalGetComputedStyle = window.getComputedStyle;

  /**
   * getComputedStyle
   * @export
   * @param {HTMLElement} element
   * @param {String} prop
   * @returns {Object}
   * @see https://github.com/the-simian/ie8-getcomputedstyle/blob/master/index.js
   * @see https://github.com/twolfson/computedStyle/blob/master/lib/computedStyle.js
   * @see http://www.zhangxinxu.com/wordpress/2012/05/getcomputedstyle-js-getpropertyvalue-currentstyle
   */
  function getComputedStyle(element, prop) {
    var style =
      // If we have getComputedStyle
      originalGetComputedStyle ?
      // Query it
      // From CSS-Query notes, we might need (node, null) for FF
      originalGetComputedStyle(element, null) :
      // Otherwise, we are in IE and use currentStyle
      element.currentStyle;

    // 返回 getPropertyValue 方法
    return {
      /**
       * getPropertyValue
       * @param {String} prop
       */
      getPropertyValue: function(prop) {
        if (style) {
          // Original support
          if (style.getPropertyValue) {
            return style.getPropertyValue(prop);
          }

          // Switch to camelCase for CSSOM
          // DEV: Grabbed from jQuery
          // https://github.com/jquery/jquery/blob/1.9-stable/src/css.js#L191-L194
          // https://github.com/jquery/jquery/blob/1.9-stable/src/core.js#L593-L597
          prop = prop.replace(/-(\w)/gi, function(word, letter) {
            return letter.toUpperCase();
          });

          // Old IE
          if (style.getAttribute) {
            return style.getAttribute(prop);
          }

          // Read property directly
          return style[prop];
        }
      }
    };
  }

  // 模板匹配正则
  var TEMPLATE_RE = /{{([a-z]*)}}/gi;

  /**
   * template
   *
   * @export
   * @param {String} format
   * @param {Object} data
   * @returns {String}
   * ```
   * var tpl = '{{name}}/{{version}}';
   * template(tpl, {name:'base', version: '1.0.0'});
   * ```
   */
  function template(format, data) {
    if (!string(format)) return '';

    if (!data) return format;

    return format.replace(TEMPLATE_RE, function(all, name) {
      return data.hasOwnProperty(name) ? data[name] : name;
    });
  }

  var slice = AP.slice;

  function Events() {
    // Keep this empty so it's easier to inherit from
    // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
  }

  Events.prototype = {
    on: function(name, listener, context) {
      var self = this;
      var events = self.__events || (self.__events = {});

      context = arguments.length < 3 ? self : context;

      (events[name] || (events[name] = [])).push({
        fn: listener,
        context: context
      });

      return self;
    },
    once: function(name, listener, context) {
      var self = this;

      function feedback() {
        self.off(name, feedback);
        apply(listener, this, arguments);
      }

      return self.on(name, feedback, context);
    },
    emit: function(name) {
      var context = this;
      var data = slice.call(arguments, 1);
      var events = context.__events || (context.__events = {});
      var listeners = events[name] || [];

      var result;
      var listener;
      var returned;

      // emit events
      for (var i = 0, length = listeners.length; i < length; i++) {
        listener = listeners[i];
        result = apply(listener.fn, listener.context, data);

        if (returned !== false) {
          returned = result;
        }
      }

      return returned;
    },
    off: function(name, listener, context) {
      var self = this;
      var events = self.__events || (self.__events = {});
      var length = arguments.length;

      switch (length) {
        case 0:
          self.__events = {};
          break;
        case 1:
          delete events[name];
          break;
        default:
          if (listener) {
            var listeners = events[name];

            if (listeners) {
              context = length < 3 ? self : context;
              length = listeners.length;

              for (var i = 0; i < length; i++) {
                if (evts[i].fn === listener && evts[i].fn.context === context) {
                  listeners.splice(i, 1);
                  break;
                }
              }

              // Remove event from queue to prevent memory leak
              // Suggested by https://github.com/lazd
              // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910
              if (!listeners.length) {
                delete events[name];
              }
            }
          }
          break;
      }

      return self;
    }
  };

  // 默认 z-index 值
  var Z_INDEX = 1024;

  /**
   * 设置初始 z-index 值
   *
   * @export
   * @param {Number} value
   * @returns {Number} Z_INDEX
   */
  function setZIndex(value) {
    if (number(value) && value > 0 && value !== Infinity) {
      Z_INDEX = value;
    }

    return Z_INDEX;
  }

  /**
   * 获取当前 z-index 值
   *
   * @export
   * @param {Boolean} increment 是否自增
   * @returns {Number} Z_INDEX
   */
  function getZIndex(increment) {
    return increment ? Z_INDEX++ : Z_INDEX;
  }

  var BACKDROP = {
    // 遮罩分配
    alloc: [],
    // 遮罩节点
    node: $('<div tabindex="0"></div>').css({
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      userSelect: 'none'
    }),
    // 锁定 tab 焦点层
    shim: $('<div tabindex="0"></div>').css({
      width: 0,
      height: 0,
      opacity: 0
    }),
    /**
     * 设置弹窗层级
     */
    zIndex: function(zIndex) {
      // 最小为 0
      zIndex = Math.max(0, --zIndex);

      // 设定 z-index
      BACKDROP.node.css('z-index', zIndex);
    },
    /**
     * 依附实例
     * @param {Dialog} anchor 定位弹窗实例
     */
    attach: function(anchor) {
      var node = anchor.node;
      var className = anchor.className + '-backdrop';

      BACKDROP.node
        .addClass(className)
        .insertBefore(node);

      BACKDROP.shim.insertAfter(node);
    },
    /**
     * 显示遮罩
     * @param {Dialog} anchor 定位弹窗实例
     */
    show: function(anchor) {
      var alloc = BACKDROP.alloc;
      var index = alloc.indexOf(anchor);

      // 不存在或者不在队尾重新刷新遮罩位置和缓存队列
      if (index === -1 || index !== alloc.length - 1) {
        // 跟随元素
        BACKDROP.attach(anchor);
        // 放置缓存到队尾
        alloc.push(anchor);
      }
    },
    /**
     * 隐藏遮罩
     * @param {Dialog} anchor 定位弹窗实例
     */
    hide: function(anchor) {
      BACKDROP.alloc = BACKDROP.alloc.filter(function(item) {
        return anchor !== item;
      });

      var length = BACKDROP.alloc.length;

      if (length === 0) {
        BACKDROP.node.remove();
        BACKDROP.shim.remove();
      } else {
        anchor = BACKDROP.alloc[length - 1];

        BACKDROP.zIndex(anchor.zIndex);
        BACKDROP.attach(anchor);
      }
    }
  };

  /**
   * Layer
   *
   * @constructor
   * @export
   */
  function Layer() {
    var context = this;

    context.destroyed = false;
    context.node = document.createElement('div');
    context.__node = $(context.node)
      // 设置 tabindex
      .attr('tabindex', '-1')
      // 绑定得到焦点事件
      .on('focusin', function() {
        context.focus();
      });
  }

  // 当前得到焦点的实例
  Layer.active = null;
  // 锁屏遮罩
  Layer.backdrop = BACKDROP;

  // 清理激活状体
  Layer.cleanActive = function(context) {
    if (Layer.active === context) {
      Layer.active = null;
    }
  };

  // 锁定 tab 焦点在弹窗内
  doc.on('focusin', function(e) {
    var active = Layer.active;

    if (active && active.modal) {
      var target = e.target;
      var node = active.node;

      if (target !== node && !node.contains(target)) {
        active.focus();
      }
    }
  });

  // 原型方法
  inherits(Layer, Events, {
    /**
     * 浮层 DOM 元素节点
     *
     * @public
     * @readonly
     */
    node: null,
    /**
     * 判断对话框是否删除
     *
     * @public
     * @readonly
     */
    destroyed: true,
    /**
     * 判断对话框是否显示
     *
     * @public
     * @readonly
     */
    open: false,
    /**
     * 是否自动聚焦
     *
     * @public
     * @property
     */
    autofocus: true,
    /**
     * 是否是模态窗口
     *
     * @public
     * @property
     */
    modal: false,
    /**
     * 内部的 HTML 字符串
     *
     * @public
     * @property
     */
    innerHTML: '',
    /**
     * CSS 类名
     *
     * @public
     * @property
     */
    className: 'ui-layer',
    /**
     * 构造函数
     *
     * @public
     * @readonly
     */
    constructor: Layer,
    /**
     * 让浮层获取焦点
     *
     * @public
     */
    focus: function() {
      var context = this;

      // 销毁，未打开和已经得到焦点不做处理
      if (context.destroyed || !context.open) {
        return context;
      }

      var node = context.node;
      var layer = context.__node;
      var active = Layer.active;

      if (active && active !== context) {
        active.blur(false);
      }

      // 检查焦点是否在浮层里面
      if (!node.contains(context.__getActive())) {
        var autofocus = layer.find('[autofocus]')[0];

        if (!context.__autofocus && autofocus) {
          context.__autofocus = true;
        } else {
          autofocus = node;
        }

        // 获取焦点
        context.__focus(autofocus);

        // 重新获取激活实例
        active = Layer.active;
      }

      // 非激活状态才做处理
      if (active !== context) {
        var index = context.zIndex = getZIndex(true);

        // 刷新遮罩
        if (context.modal) {
          BACKDROP.show(context);
          BACKDROP.zIndex(index);
        }

        // 设置弹窗层级
        layer.css('zIndex', index);
        // 添加激活类名
        layer.addClass(context.className + '-focus');
        // 触发事件
        context.emit('focus');

        // 保存当前激活实例
        Layer.active = context;
      }

      return context;
    },
    /**
     * 让浮层失去焦点。将焦点退还给之前的元素，照顾视力障碍用户
     *
     * @public
     */
    blur: function() {
      var context = this;

      // 销毁和未打开不做处理
      if (context.destroyed || !context.open) {
        return context;
      }

      var isBlur = arguments[0];

      // 清理激活状态
      context.__cleanActive();

      if (isBlur !== false) {
        context.__focus(context.__activeElement);
      }

      context.__autofocus = false;

      context.__node.removeClass(context.className + '-focus');
      context.emit('blur');

      return context;
    },
    /**
     * 对元素安全聚焦
     *
     * @private
     * @param {HTMLElement} element
     */
    __focus: function(element) {
      // 防止 iframe 跨域无权限报错
      // 防止 IE 不可见元素报错
      try {
        // ie11 bug: iframe 页面点击会跳到顶部
        if (this.autofocus && !/^iframe$/i.test(element.nodeName)) {
          element.focus();
        }
      } catch (e) {
        // error
      }
    },
    /**
     * 获取当前焦点的元素
     *
     * @private
     */
    __getActive: function() {
      try {
        // try: ie8~9, iframe #26
        var activeElement = document.activeElement;
        var contentDocument = activeElement.contentDocument;
        var element = contentDocument && contentDocument.activeElement || activeElement;

        return element;
      } catch (e) {
        // error
      }
    },
    /**
     * 清理激活状态
     *
     * @private
     */
    __cleanActive: function() {
      if (Layer.active === this) {
        Layer.active = null;
      }
    }
  });

  // 默认样式
  var styles = document.documentElement.style;

  // animationend 映射表
  var ANIMATIONEND_EVENTS = {
    animation: 'animationend',
    WebkitAnimation: 'webkitAnimationEnd',
    MozAnimation: 'mozAnimationEnd',
    OAnimation: 'oAnimationEnd',
    msAnimation: 'MSAnimationEnd',
    KhtmlAnimation: 'khtmlAnimationEnd'
  };
  // transition 映射表
  var TRANSITIONEND_EVENTS = {
    transition: 'transitionend',
    WebkitTransition: 'webkitTransitionEnd',
    MozTransition: 'mozTransitionEnd',
    OTransition: 'oTransitionEnd',
    msTransition: 'MSTransitionEnd',
    KhtmlTransition: 'khtmlTransitionEnd'
  };

  /**
   * detector
   * @param {Object} maps
   * @returns
   */
  function detector(maps) {
    for (var property in maps) {
      if (maps.hasOwnProperty(property) && styles[property] !== undefined) {
        return property;
      }
    }
  }

  // animation
  var ANIMATION = detector(ANIMATIONEND_EVENTS);
  // transition
  var TRANSITION = detector(TRANSITIONEND_EVENTS);

  /**
   * toMs
   * @param {String} value
   * @returns
   */
  function toMs(value) {
    return Number(value.slice(0, -1)) * 1000;
  }

  /**
   * getTimeout
   * @param {Array} delays
   * @param {Array} durations
   * @returns
   */
  function getTimeout(delays, durations) {
    /* istanbul ignore next */
    while (delays.length < durations.length) {
      delays = delays.concat(delays);
    }

    // 获取最大时长
    return Math.max.apply(null, durations.map(function(duration, i) {
      return toMs(duration) + toMs(delays[i]);
    }));
  }

  /**
   * toArray
   * @param {any} value
   * @returns {Array}
   */
  function toArray(value) {
    return value ? value.split(', ') : [];
  }

  /**
   * getEffectsInfo
   * @param {HTMLElement} element
   * @returns
   */
  function getEffectsInfo(element) {
    var styles = getComputedStyle(element);
    var transitioneDelays = toArray(styles.getPropertyValue(TRANSITION + '-delay'));
    var transitionDurations = toArray(styles.getPropertyValue(TRANSITION + '-duration'));
    var transitionTimeout = getTimeout(transitioneDelays, transitionDurations);
    var animationDelays = toArray(styles.getPropertyValue(ANIMATION + '-delay'));
    var animationDurations = toArray(styles.getPropertyValue(ANIMATION + '-duration'));
    var animationTimeout = getTimeout(animationDelays, animationDurations);

    var effect;
    var count;
    var timeout;

    timeout = Math.max(transitionTimeout, animationTimeout);
    effect = timeout > 0 ? (transitionTimeout > animationTimeout ? TRANSITION : ANIMATION) : null;
    count = effect ? (effect === TRANSITION ? transitionDurations.length : animationDurations.length) : 0;

    return {
      effect: effect,
      count: count,
      timeout: timeout
    };
  }

  /**
   * effectsEnd
   * @export
   * @param {jQueryElement} node
   * @param {Function} callback
   * @see https://github.com/vuejs/vue/blob/dev/src/platforms/web/runtime/transition-util.js
   */
  function effectsEnd(node, callback) {
    // 不支持动画
    if (!ANIMATION && !TRANSITION) {
      return callback();
    }

    var element = node[0];
    var info = getEffectsInfo(element);
    var effect = info.effect;

    // 没有动画
    if (!effect) {
      return callback();
    }

    var ended = 0;
    var count = info.count;
    var timeout = info.timeout;
    var event = effect === TRANSITION ?
      TRANSITIONEND_EVENTS[TRANSITION] :
      ANIMATIONEND_EVENTS[ANIMATION];

    var end = function() {
      node.off(event, onEnd);
      callback();
    };

    var onEnd = function(e) {
      if (e.target === element) {
        if (++ended >= count) {
          end();
        }
      }
    };

    // 防止有些动画没有触发结束事件
    setTimeout(function() {
      if (ended < count) {
        end();
      }
    }, timeout + 1);

    // 监听动画完成事件
    node.on(event, onEnd);
  }

  // 对齐方式拆分正则
  var ALIGNSPLIT_RE = /\s+/;

  function Popup() {
    var context = this;

    Layer.call(context);

    // 设置初始样式
    context.__node.css({
      display: 'none',
      position: 'absolute',
      outline: 0,
      top: 0,
      left: 0
    });
  }

  inherits(Popup, Layer, {
    /**
     * close 返回值
     * @public
     * @property
     */
    returnValue: undefined,
    /**
     * 跟随的 DOM 元素节点
     * @public
     * @readonly
     */
    anchor: null,
    /**
     * 是否开启固定定位
     * @public
     * @property
     */
    fixed: false,
    /**
     * 对齐方式
     * @public
     * @property
     */
    align: 'bottom left',
    /**
     * CSS 类名
     * @public
     * @property
     */
    className: 'ui-dialog',
    /**
     * 构造函数
     * @public
     * @readonly
     */
    constructor: Popup,
    /**
     * 显示浮层（私有）
     * @private
     * @param {HTMLElement}  指定位置（可选）
     */
    __show: function(anchor) {
      var context = this;

      // 已销毁
      if (context.destroyed) {
        return context;
      }

      var popup = context.__node;

      context.open = true;
      context.anchor = anchor || null;
      context.__activeElement = context.__getActive();

      // 初始化 show 方法
      if (!context.__ready) {
        // 设置样式
        popup
          .addClass(context.className)
          .css('position', context.fixed ? 'fixed' : 'absolute');

        // 弹窗添加到文档树
        popup.appendTo(document.body);

        // 切换ready状态
        context.__ready = true;
      }

      // 设置内容
      if (context.__innerHTML !== context.innerHTML) {
        // 设置内容
        popup.html(context.innerHTML);

        // 换成内容
        context.__innerHTML = context.innerHTML;
      }

      // 显示遮罩
      if (context.modal) {
        Layer.backdrop.show(context);
        popup.addClass(context.className + '-modal');
      }

      // 设置样式
      popup
        .attr('role', context.modal ? 'alertdialog' : 'dialog')
        .removeClass(context.className + '-close')
        .addClass(context.className + '-show')
        .show();

      // 执行定位操作
      context.reset();

      // 触发事件
      context.emit('show');

      // 聚焦
      context.focus();

      return context;
    },
    /**
     * 显示浮层
     * @public
     * @param {HTMLElement}  指定位置（可选）
     */
    show: function(anchor) {
      var context = this;

      // 关闭模态
      if (context.modal) {
        var popup = context.__node;

        // 关闭遮罩
        if (context.open) {
          Layer.backdrop.hide(context);
        }

        // 移除类名
        popup.removeClass(context.className + '-modal');
      }

      // 重置模态状态
      context.modal = false;

      // 显示
      return context.__show(anchor);
    },
    /**
     * 显示模态浮层。
     * @public
     * @param {HTMLElement}  指定位置（可选）
     */
    showModal: function(anchor) {
      var context = this;
      var popup = context.__node;

      // 重置模态状态
      context.modal = true;

      return context.__show(anchor);
    },
    /**
     * 关闭浮层
     * @public
     * @param {any} result
     */
    close: function(result) {
      var context = this;

      // 销毁和未打开不做处理
      if (context.destroyed || !context.open) {
        return context;
      }

      // 关闭前
      if (context.emit('beforeclose') === false) {
        return context;
      }

      // 关闭
      // 设置返回值
      if (result !== undefined) {
        context.returnValue = result;
      }

      var node = context.node;
      var popup = context.__node;

      // 切换弹窗样式
      popup
        .removeClass(context.className + '-show')
        .addClass(context.className + '-close');

      // 恢复焦点，照顾键盘操作的用户
      context.blur();

      // 动画完成之后隐藏弹窗
      effectsEnd(popup, function() {
        // 隐藏弹窗
        popup.hide();

        // 隐藏遮罩
        if (context.modal) {
          Layer.backdrop.hide(context);
        }

        // 切换打开状态
        context.open = false;

        // 关闭事件
        context.emit('close');
      });

      return context;
    },
    /**
     * 销毁浮层
     * @public
     */
    remove: function() {
      var context = this;

      // 已销毁
      if (context.destroyed) {
        return context;
      }

      // 移除前
      if (context.emit('beforeremove') === false) {
        return context;
      }

      // 清理激活项
      context.__cleanActive();

      // 隐藏遮罩
      if (context.open && context.modal) {
        Layer.backdrop.hide(context);
      }

      // 移除事件绑定并从 DOM 中移除节点
      context.__node
        .off()
        .remove();

      // 切换销毁状态
      context.destroyed = true;

      // 触发销毁事件
      context.emit('remove');

      // 清理属性
      for (var property in context) {
        delete context[property];
      }

      return context;
    },
    /**
     * 重置位置
     * @public
     */
    reset: function() {
      var context = this;

      // 销毁和未打开不做处理
      if (context.destroyed || !context.open) {
        return context;
      }

      // 对齐类名
      var align = context.__align;

      // 移除跟随定位类名
      if (align) {
        // 移除对齐类名
        context.__node.removeClass(align);

        // 清空对齐类名
        context.__align = null;
      }

      // 跟随元素
      var anchor = context.anchor;

      // 如果没有跟随居中显示
      if (anchor) {
        context.__follow(anchor);
      } else {
        // 居中显示
        context.__center();
      }

      // 触发事件
      context.emit('reset');

      return context;
    },
    /**
     * 居中浮层
     * @private
     */
    __center: function() {
      var context = this;
      var popup = context.__node;
      var fixed = context.fixed;
      var clientWidth = win.width();
      var clientHeight = win.height();
      var scrollLeft = fixed ? 0 : doc.scrollLeft();
      var scrollTop = fixed ? 0 : doc.scrollTop();
      var dialogWidth = popup.outerWidth();
      var dialogHeight = popup.outerHeight();
      var top = (clientHeight - dialogHeight) * 382 / 1000 + scrollTop; // 黄金比例
      var left = (clientWidth - dialogWidth) / 2 + scrollLeft;

      popup.css({
        top: Math.max(parseFloat(top), scrollTop),
        left: Math.max(parseFloat(left), scrollLeft)
      });
    },
    /**
     * 跟随元素
     * @private
     * @param {HTMLElement} anchor
     */
    __follow: function(anchor) {
      var context = this;
      var popup = context.__node;

      // 不能是根节点
      anchor = anchor.parentNode && $(anchor);

      // 定位元素不存在
      if (!anchor || !anchor.length) {
        return context.__center();
      }

      // 隐藏元素不可用
      if (anchor) {
        var offset = anchor.offset();

        if (offset.left * offset.top < 0) {
          return context.__center();
        }
      }

      var fixed = context.fixed;

      var clientWidth = win.width();
      var clientHeight = win.height();
      var scrollLeft = doc.scrollLeft();
      var scrollTop = doc.scrollTop();

      var dialogWidth = popup.outerWidth();
      var dialogHeight = popup.outerHeight();
      var anchorWidth = anchor ? anchor.outerWidth() : 0;
      var anchorHeight = anchor ? anchor.outerHeight() : 0;
      var offset = context.__offset(anchor[0]);
      var x = offset.left;
      var y = offset.top;
      var left = fixed ? x - scrollLeft : x;
      var top = fixed ? y - scrollTop : y;

      var minTop = fixed ? 0 : scrollTop;
      var minLeft = fixed ? 0 : scrollLeft;
      var maxTop = minTop + clientHeight - dialogHeight;
      var maxLeft = minLeft + clientWidth - dialogWidth;

      var css = {};
      var align = context.align.split(ALIGNSPLIT_RE);
      var className = context.className + '-';
      var reverse = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
      var name = { top: 'top', bottom: 'top', left: 'left', right: 'left' };

      var temp = [
        {
          top: top - dialogHeight,
          bottom: top + anchorHeight,
          left: left - dialogWidth,
          right: left + anchorWidth
        },
        {
          top: top,
          bottom: top - dialogHeight + anchorHeight,
          left: left,
          right: left - dialogWidth + anchorWidth
        }
      ];

      var center = {
        top: top + anchorHeight / 2 - dialogHeight / 2,
        left: left + anchorWidth / 2 - dialogWidth / 2
      };

      var range = {
        left: [minLeft, maxLeft],
        top: [minTop, maxTop]
      };

      // 超出可视区域重新适应位置
      align.forEach(function(value, i) {
        // 超出右或下边界：使用左或者上边对齐
        if (temp[i][value] > range[name[value]][1]) {
          value = align[i] = reverse[value];
        }

        // 超出左或右边界：使用右或者下边对齐
        if (temp[i][value] < range[name[value]][0]) {
          align[i] = reverse[value];
        }
      });

      // 一个参数的情况
      if (!align[1]) {
        name[align[1]] = name[align[0]] === 'left' ? 'top' : 'left';
        temp[1][align[1]] = center[name[align[1]]];
      }

      //添加anchor的css, 为了给css使用
      className += align.join('-') + ' ' + context.className + '-follow';

      // 保存对齐类名
      context.__align = className;

      // 添加样式
      popup.addClass(className);

      // 设置样式属性
      css[name[align[0]]] = parseFloat(temp[0][align[0]]);
      css[name[align[1]]] = parseFloat(temp[1][align[1]]);

      // 设置样式
      popup.css(css);
    },
    /**
     * 获取元素相对于页面的位置（包括iframe内的元素）
     * 暂时不支持两层以上的 iframe 套嵌
     * @private
     * @param {HTMLElement} anchor
     */
    __offset: function(anchor) {
      var isNode = anchor.parentNode;
      var offset = isNode ? $(anchor).offset() : {
        left: anchor.pageX,
        top: anchor.pageY
      };

      anchor = isNode ? anchor : anchor.target;

      var ownerDocument = anchor.ownerDocument;
      var defaultView = ownerDocument.defaultView || ownerDocument.parentWindow;

      if (defaultView == window) {
        // IE <= 8 只能使用两个等于号
        return offset;
      }

      // {Element: Ifarme}
      var frameElement = defaultView.frameElement;

      ownerDocument = $(ownerDocument);

      var scrollLeft = ownerDocument.scrollLeft();
      var scrollTop = ownerDocument.scrollTop();
      var frameOffset = $(frameElement).offset();
      var frameLeft = frameOffset.left;
      var frameTop = frameOffset.top;

      return {
        top: offset.top + frameTop - scrollTop,
        left: offset.left + frameLeft - scrollLeft
      };
    }
  });

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
  var ARIA_DESCRIBEDBY = 'dialog-content:{{id}}';

  /**
   * Dialog
   *
   * @export
   * @constructor
   * @param {String} content
   * @param {Object} options
   * @returns {Dialog}
   */
  function Dialog(content, options) {
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
    if (id && string(id)) {
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
      .attr('aria-labelledby', template(ARIA_LABELLEDBY, { id: context.id }))
      .attr('aria-describedby', template(ARIA_DESCRIBEDBY, { id: context.id }));

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
      if (button.which === which && fn(button.action)) {
        button.action.call(context);
      }
    });

    // Esc 按键
    if (which === 27) {
      context.close();
    }
  }

  // 按键响应
  doc.on('keyup', function(e) {
    var active = Layer.active;

    if (active instanceof Dialog && active.options.keyboard) {
      var which = e.which;
      var target = e.target;
      var selector = template(ACTION_SELECTOR, {
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
      if (number(zIndex) && zIndex > 0 && zIndex !== Infinity) {
        Layer.zIndex = zIndex;
      }
    }

    return Layer.zIndex;
  };

  // 父类移除方法缓存
  var POPUP_REMOVE = Popup.prototype.remove;

  // 原型方法
  inherits(Dialog, Popup, {
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

      context.content = string(content) ? content : '';

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
      options.title = string(options.title) ? options.title : DIALOG_SETTINGS.title;
      options.buttons = Array.isArray(options.buttons) ? options.buttons : DIALOG_SETTINGS.buttons;
      options.skin = options.skin && string(options.skin) ? options.skin : DIALOG_SETTINGS.skin;

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
      var selector = template(DELEGATE_SELECTOR, {
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

            if (button && fn(button.action)) {
              button.action.call(context);
            }
            break;
        }
      });

      // 窗口改变重新定位
      win.on('resize', context.__resize = function() {
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
        buttons += template(DIALOG_BUTTON, {
          className: button.className,
          label: button.label,
          index: index
        });
      });

      // 设置内容
      context.innerHTML = template(DIALOG_FRAME, {
        className: context.className,
        title: options.title,
        content: content,
        buttons: buttons,
        titleId: template(ARIA_LABELLEDBY, { id: context.id }),
        contentId: template(ARIA_DESCRIBEDBY, { id: context.id })
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

          // 重新初始化内容
          context.__initContent(value || content);

          // 是否需要刷新
          if (content !== context.content) {
            refresh = true;
          }
          break;
        case 'options':
          if (value) {
            refresh = true;

            // 禁止复写 id
            delete value.id;

            // 重新初始化参数
            context.__initOptions(value, context.options);
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
          win.off('resize', resize);

          // 删除缓存
          if (string(id)) {
            delete DIALOGS[id];
          }
        }
      }

      return context;
    }
  });

  // 对外接口
  var FlexUI = {
    dialog: Dialog,
    zIndex: function(value) {
      if (arguments.length) {
        return setZIndex(value)
      } else {
        return getZIndex();
      }
    }
  };

  return FlexUI;

})));
