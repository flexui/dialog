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
   *
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
       *
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
    // 当前依附实例
    anchor: null,
    // 遮罩节点
    node: $('<div tabindex="0"></div>').css({
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      userSelect: 'none'
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
     *
     * @param {Layer} anchor 定位弹窗实例
     */
    attach: function(anchor) {
      var node = anchor.node;
      var className = anchor.className + '-backdrop';

      BACKDROP.node
        .addClass(className)
        .insertBefore(node);

      // 当前依附实例
      BACKDROP.anchor = anchor;
    },
    /**
     * 显示遮罩
     *
     * @param {Layer} anchor 定位弹窗实例
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
     *
     * @param {Layer} anchor 定位弹窗实例
     */
    hide: function(anchor) {
      BACKDROP.alloc = BACKDROP.alloc.filter(function(item) {
        return anchor !== item;
      });

      var length = BACKDROP.alloc.length;

      if (!length) {
        BACKDROP.node.remove();

        // 清空当前依附实例
        BACKDROP.anchor = null;
      } else {
        anchor = BACKDROP.alloc[length - 1];

        BACKDROP.zIndex(anchor.zIndex);
        BACKDROP.attach(anchor);
      }
    }
  };

  // 焦点锁定层
  var TAB_LOCK = {
    // 锁定层
    node: $('<div tabindex="0"></div>').css({
      width: 0,
      height: 0,
      opacity: 0
    }),
    /**
     * 显示焦点锁定层
     *
     * @param {Layer} anchor
     */
    show: function(anchor) {
      if (BACKDROP.anchor) {
        TAB_LOCK.node.insertAfter(anchor.node);
      }
    },
    /**
     * 隐藏焦点锁定层
     */
    hide: function() {
      if (!BACKDROP.anchor) {
        TAB_LOCK.node.remove();
      }
    }
  };

  // 得到焦点类名
  var LAYER_CLASS_FOCUS = '-focus';

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
      // 设定 tab 索引
      .attr('tabindex', '0')
      // 得到焦点
      .on('focusin', function() {
        if (context !== Layer.active) {
          context.focus();
        }
      });
  }

  // 当前得到焦点的实例
  Layer.active = null;

  // 锁定 tab 焦点在弹窗内
  doc.on('focusin', function(e) {
    var target = e.target;
    var active = Layer.active;
    var anchor = BACKDROP.anchor;

    // 焦点不在弹窗让焦点失去焦点
    if (active && active !== anchor &&
      target !== active.node && !active.node.contains(target)) {
      active.blur(false);
    }

    // 锁定焦点
    if (anchor && anchor.open &&
      (target === BACKDROP.node[0] || target === TAB_LOCK.node[0])) {
      e.preventDefault();
      anchor.focus();
    }
  });

  /**
   * 清理激活状态
   *
   * @param {Layer} context
   */
  Layer.cleanActive = function(context) {
    if (Layer.active === context) {
      Layer.active = null;
    }
  };

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
     * 是否是模态窗口
     *
     * @public
     * @readonly
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
     * 只在浮层未初始化前可设置，之后不能更改
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

      // 激活实例
      var active = Layer.active;

      // 先让上一个激活实例失去焦点
      if (active && active !== context) {
        active.blur(false);
      }

      // 浮层
      var node = context.node;
      var layer = context.__node;
      var focused = context.__getActive();

      // 检查焦点是否在浮层里面
      if (node !== focused && !node.contains(focused)) {
        // 自动聚焦
        context.__focus(layer.find('[autofocus]')[0] || node);
      }

      // 非激活状态刷新浮层状态
      if (Layer.active !== context) {
        var index = context.zIndex = getZIndex(true);

        // 刷新遮罩
        if (context.modal && context !== BACKDROP.anchor) {
          // 刷新遮罩位置
          BACKDROP.show(context);
          // 刷新焦点锁定层
          TAB_LOCK.show(context);
          // 刷新遮罩层级
          BACKDROP.zIndex(index);
        }

        // 设置弹窗层级
        layer.css('zIndex', index);
        // 添加激活类名
        layer.addClass(context.className + LAYER_CLASS_FOCUS);
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
      Layer.cleanActive(context);

      if (isBlur !== false) {
        context.__focus(context.__activeElement);
      }

      context.__node.removeClass(context.className + LAYER_CLASS_FOCUS);
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
        if (!/^iframe$/i.test(element.nodeName)) {
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
     * 智能遮罩操作方法
     *
     * @private
     * @param {String} method
     * @param {Any} value
     */
    __backdrop: function(method, value) {
      var context = this;

      switch (method) {
        case 'show':
        case 'hide':
          // 遮罩层
          if (context.modal) {
            BACKDROP[method](context);
          }

          // 焦点锁定层
          TAB_LOCK[method](context);
          break;
        case 'z-index':
          if (context.modal) {
            BACKDROP.zIndex(value);
          }
          break;
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
   *
   * @param {String} value
   * @returns
   */
  function toMs(value) {
    return Number(value.slice(0, -1)) * 1000;
  }

  /**
   * getTimeout
   *
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
   *
   * @param {any} value
   * @returns {Array}
   */
  function toArray(value) {
    return value ? value.split(', ') : [];
  }

  /**
   * getEffectsInfo
   *
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
   *
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
  var POPUP_CLASS_SHOW = '-show';
  var POPUP_CLASS_CLOSE = '-close';
  var POPUP_CLASS_MODAL = '-modal';

  /**
   * Popup
   *
   * @export
   * @constructor
   * @returns {Popup}
   */
  function Popup() {
    var context = this;

    Layer.call(context);

    // 设置初始样式
    context.__node
      .addClass(context.className)
      .css({
        display: 'none',
        position: 'absolute',
        top: 0,
        left: 0
      });
  }

  inherits(Popup, Layer, {
    /**
     * close 返回值
     *
     * @public
     * @property
     */
    returnValue: undefined,
    /**
     * 跟随的 DOM 元素节点
     *
     * @public
     * @readonly
     */
    anchor: null,
    /**
     * 是否开启固定定位
     *
     * @public
     * @property
     */
    fixed: false,
    /**
     * 对齐方式
     *
     * @public
     * @property
     */
    align: 'bottom left',
    /**
     * CSS 类名
     * 只在浮层未初始化前可设置，之后不能更改
     *
     * @public
     * @property
     */
    className: 'ui-dialog',
    /**
     * 构造函数
     *
     * @public
     * @readonly
     */
    constructor: Popup,
    /**
     * 显示浮层（私有）
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

      var popup = context.__node;

      context.open = true;
      context.anchor = anchor || null;
      context.__activeElement = context.__getActive();

      // 设置浮层
      popup
        .attr('role', context.modal ? 'alertdialog' : 'dialog')
        .css('position', context.fixed ? 'fixed' : 'absolute')
        .removeClass(context.className + POPUP_CLASS_CLOSE)
        .addClass(context.className + POPUP_CLASS_SHOW);

      // 设置内容
      if (context.__innerHTML !== context.innerHTML) {
        // 设置内容
        popup.html(context.innerHTML);

        // 缓存内容,防止重复替换
        context.__innerHTML = context.innerHTML;
      }

      // 弹窗添加到文档树
      popup.appendTo(document.body);

      // 添加模态类名
      if (context.modal) {
        popup.addClass(context.className + POPUP_CLASS_MODAL);
      }

      // 智能遮罩层显示
      context.__backdrop('show');

      // 显示浮层
      popup.show();

      // 执行定位操作
      context.reset();

      // 触发事件
      context.emit('show');

      // 聚焦
      context.focus();

      // 智能遮罩层层级设定
      context.__backdrop('z-index', context.zIndex);

      return context;
    },
    /**
     * 显示浮层
     *
     * @public
     * @param {HTMLElement}  指定位置（可选）
     */
    show: function(anchor) {
      var context = this;

      // 关闭模态
      if (context.modal) {
        var popup = context.__node;

        // 智能遮罩层隐藏
        if (context.open) {
          context.__backdrop('hide');
        }

        // 移除类名
        popup.removeClass(context.className + POPUP_CLASS_MODAL);
      }

      // 重置模态状态
      context.modal = false;

      // 显示
      return context.__show(anchor);
    },
    /**
     * 显示模态浮层
     *
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
     *
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

      // 设置返回值
      if (result !== undefined) {
        context.returnValue = result;
      }

      var node = context.node;
      var popup = context.__node;

      // 切换弹窗样式
      popup
        .removeClass(context.className + POPUP_CLASS_SHOW)
        .addClass(context.className + POPUP_CLASS_CLOSE);

      // 恢复焦点，照顾键盘操作的用户
      context.blur();

      // 动画完成之后隐藏弹窗
      effectsEnd(popup, function() {
        // 隐藏弹窗
        popup.hide();

        // 智能遮罩层隐藏
        context.__backdrop('hide');

        // 切换打开状态
        context.open = false;

        // 关闭事件
        context.emit('close');
      });

      return context;
    },
    /**
     * 销毁浮层
     *
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
      Layer.cleanActive(context);

      // 智能遮罩层隐藏
      context.__backdrop('hide');

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
     *
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
     *
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
     *
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
     *
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
  var ARIA_DESCRIBEDBY = 'aria-content:{{id}}';

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
      .attr('aria-labelledby', template(ARIA_LABELLEDBY, { id: id }))
      .attr('aria-describedby', template(ARIA_DESCRIBEDBY, { id: id }));

    // 主题
    var skin = options.skin;

    // 设置主题
    context.className = skin && string(skin) ? skin : DIALOG_SETTINGS.skin;

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
      view += template(format, {
        className: template(item.className, { skin: skin }),
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
      if (item.which === which && fn(item.action)) {
        item.action.call(context, event, item);
      }
    });
  }

  // 按键响应
  doc.on('keydown', function(e) {
    var active = Layer.active;

    // 保证实例存在且开启了键盘事件
    if (active instanceof Dialog && !active.destroyed && active.options.keyboard) {
      var which = e.which;
      var target = e.target;
      var dialog = active.__node;
      var skin = active.className;

      // 窗体操作框容器
      var controls = dialog.find(template(DIALOG_CONTROLS_SELECTOR, { skin: skin }))[0];
      // 按钮容器
      var actions = dialog.find(template(DIALOG_ACTIONS_SELECTOR, { skin: skin }))[0];

      // 当焦点在按钮上时，enter 键会触发 click 事件，如果按钮绑定了 enter 键，会触发两次回调
      if (which !== 13 || (!controls.contains(target) && !actions.contains(target))) {
        var options = active.options;

        // 触发所有键盘绑定动作
        execAction(options.controls, e, active);
        execAction(options.actions, e, active);
      }
    }
  });

  // 父类移除方法缓存
  var POPUP_REMOVE = Popup.prototype.remove;

  // 原型方法
  inherits(Dialog, Popup, {
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

      // 格式化标题
      var title = options.title;
      var controls = options.controls;
      var actions = options.actions;
      var skin = options.skin;

      // 标题如果是字符串特殊处理
      if (string(title)) {
        title = { title: title, value: title };
      }

      // 格式化参数
      options.title = title || DIALOG_SETTINGS.title;
      options.controls = Array.isArray(controls) ? controls : DIALOG_SETTINGS.controls;
      options.actions = Array.isArray(actions) ? actions : DIALOG_SETTINGS.actions;
      options.skin = skin && string(skin) ? skin : DIALOG_SETTINGS.skin;

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
      var selector = template(DIALOG_DELEGATE_SELECTOR, {
        skin: context.className
      });

      // 绑定事件
      context.__node.on('click', selector, function(e) {
        var current;
        var target = $(this);
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
        if (current && fn(current.action)) {
          current.action.call(context, e, current);
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
      context.innerHTML = template(DIALOG_FRAME, {
        skin: skin,
        title: template(DIALOG_TITLE, {
          id: template(ARIA_LABELLEDBY, { id: id }),
          skin: skin,
          title: title.title || title.value || '',
          value: title.value || ''
        }),
        controls: controls,
        content: template(DIALOG_CONTENT, {
          id: template(ARIA_DESCRIBEDBY, { id: id }),
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
      if (!name || !string(name) || !value) {
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
          win.off('resize', resize);

          // 删除缓存
          if (DIALOGS[id]) {
            delete DIALOGS[id];
          }
        }
      }

      return context;
    }
  });

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
