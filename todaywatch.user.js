
/*
// ==UserScript==
// @name		Nico today Watch
// @namespace   http://www.atomer.sakuran.ne.jp
// @description 自分のウォッチリストで現在時間から２４時間以内に更新したユーザーを強調表示する
// @include	 http://www.nicovideo.jp/my/top/user
// @include	 http://www.nicovideo.jp/my/top
// @include	 http://www.nicovideo.jp/my/watchlist*
// @version	 0.7.3
// ==/UserScript==
 */
(function(window, loaded) {
  var BEFORE_CLASS_DATA_ATTR, CLASS_NEWER_LIST, CLASS_VISITED, DAY_SET, GM_addStyle, HOURS_24, fn, getHours, getReportType, initializer, nodes, sc, script, styles, todayWatcher, win;
  win = null;
  if (!loaded) {
    fn = '(' + arguments.callee.toString() + ')(this,true);';
    script = document.createElement("script");
    script.appendChild(document.createTextNode(fn));
    document.body.appendChild(script);
    return;
  } else {
    win = window;
  }
  if (/^\/my\/watchlist.*/.test(location.pathname)) {
    sc = document.createElement("script");
    sc.src = "https://raw.github.com/atomer/Nico-today-Watch/0.6.3/todaywatch.user.js";
    sc.type = "text/javascript";
    document.body.appendChild(sc);
    return;
  }

  /*
  	レポートタイプの取得
   */
  getReportType = function(s) {
    s = s.replace(/^\s+|\s+$/g, "");
    if (/動画を投稿しました。$/.test(s)) {
      return "video";
    } else if (/イラストを投稿しました。$/.test(s)) {
      return "illust";
    } else if (/イラストをクリップしました。$/.test(s)) {
      return "clip";
    } else if (/生放送を開始しました。$/.test(s)) {
      return "live";
    } else if (/マイリスト登録しました。$/.test(s)) {
      return "mylist";
    } else if (/取得しました。$/.test(s)) {
      return "stamp";
    } else if (/紹介されました。$/.test(s)) {
      return "intro";
    } else if (/宣伝しました。$/.test(s)) {
      return "advert";
    } else if (/達成しました。$/.test(s)) {
      return "achiev";
    } else {
      return "none";
    }
  };
  HOURS_24 = 1000 * 60 * 60 * 24;
  styles = {
    ITEM_BG_COLOR: {
      video: "#FDD",
      illust: "#9E9",
      live: "#DDF",
      mylist: "#FEE4B2",
      clip: "#DDD",
      stamp: "#DDD",
      intro: "#DDD",
      advert: "#DDD",
      achiev: "#DDD",
      none: "#DDD"
    },
    DATE_STYLE: {
      fontWeight: "bold"
    },
    COLORING_DAY_SELECTOR: "position:absolute;top:5px;right:5px;width:100px;"
  };
  nodes = {
    SWITCH_BASE: "#nicorepo > H3",
    WATCH_LIST_ITEM: ".timeline .log",
    DATE: ".relative",
    CAPTION: ".log-body",
    DETAIL: ".log-target-info"
  };
  CLASS_NEWER_LIST = "ntw_newer";
  CLASS_VISITED = "ntw_visited";
  BEFORE_CLASS_DATA_ATTR = "data-nicotodaywatch-beforeclass";
  DAY_SET = {
    "1": "1日以内",
    "3": "3日以内",
    "7": "１週間以内",
    "31": "１ヶ月以内"
  };
  getHours = function(day) {
    return day * HOURS_24;
  };
  if (typeof GM_addStyle === "undefined") {
    GM_addStyle = function(css) {
      var head, style;
      head = document.getElementsByTagName("head")[0];
      if (!head) {
        return;
      }
      style = document.createElement("style");
      style.type = "text/css";
      style.innerHTML = css;
      head.appendChild(style);
    };
  }

  /*
  	today Watch
  	http://www.nicovideo.jp/my/watchlistを拡張
   */
  todayWatcher = {
    _day: 1,
    _beforeCache: "",
    init: function() {
      this.trigger();
      this.loadStyle();
      this.createSwitch();
      this.em();
    },
    loadStyle: function() {
      GM_addStyle([".ntw_visited:link {}", ".ntw_visited:visited {color: #FFF !important;}"].join(""));
    },
    _createSelector: function(num, selected) {
      var i, n, selector, val, _i;
      selector = ['<select>'];
      if (typeof num === "number") {
        for (i = _i = 0; 0 <= num ? _i < num : _i > num; i = 0 <= num ? ++_i : --_i) {
          n = i + 1;
          selector.push('<option value="' + n + '"' + (selected === n ? ' selected' : '') + '>' + n + '</option>');
        }
      } else if (typeof num === "object") {
        for (val in num) {
          selector.push('<option value="' + val + '"' + (selected === val ? ' selected' : '') + '>' + num[val] + '</option>');
        }
      }
      selector.join("</select>");
      return selector.join("");
    },
    createSwitch: function() {
      var base, div, selector, target, that;
      base = document.querySelector(nodes.SWITCH_BASE);
      target = base.querySelector(".a");
      div = document.createElement("div");
      that = this;
      base.parentNode.style.position = "relative";
      div = document.createElement("div");
      div.setAttribute("style", styles.COLORING_DAY_SELECTOR);
      selector = this._createSelector(DAY_SET, this._day);
      div.innerHTML = selector;
      div.querySelector("SELECT").addEventListener("change", function() {
        that.changeDay(parseInt(this.value));
      }, false);
      base.insertBefore(div, target);
    },
    changeDay: function(day) {
      var ul;
      ul = document.querySelector(".timeline");
      this._day = day;
      this.em();
    },
    trigger: function() {
      var that;
      that = this;
      initializer.setTrigger("append", function(list) {
        that.em(list[0]);
      }, function(list) {
        return !!list.selector;
      });
    },
    em: function(list) {
      var NOW, beforeClass, cap, d, day, det, i, s, t, v, watchList, _i, _len;
      watchList = list ? list.querySelectorAll(nodes.WATCH_LIST_ITEM) : document.querySelectorAll(nodes.WATCH_LIST_ITEM);
      NOW = +new Date();
      for (i = _i = 0, _len = watchList.length; _i < _len; i = ++_i) {
        v = watchList[i];
        day = watchList[i].querySelector(nodes.DATE);
        if (!day) {
          continue;
        }
        s = day.getAttribute("datetime");
        d = new Date(s);
        if (NOW - d.getTime() < getHours(this._day)) {
          if (watchList[i].className.indexOf(CLASS_NEWER_LIST) !== -1) {
            continue;
          }
          beforeClass = watchList[i].className;
          watchList[i].setAttribute(BEFORE_CLASS_DATA_ATTR, beforeClass);
          watchList[i].className = beforeClass + " " + CLASS_NEWER_LIST;
          cap = watchList[i].querySelector(nodes.CAPTION);
          det = watchList[i].querySelector(nodes.DETAIL);
          if (cap) {
            t = getReportType(cap.textContent);
            watchList[i].style.backgroundColor = styles.ITEM_BG_COLOR[t];
            day.style.fontWeight = styles.DATE_STYLE.fontWeight;
            this.addVisitedStyle(cap, t);
          }
          if (det) {
            this.addVisitedStyle(det, t);
          }
        } else {
          beforeClass = watchList[i].getAttribute(BEFORE_CLASS_DATA_ATTR);
          if (beforeClass) {
            watchList[i].className = beforeClass;
          }
          watchList[i].removeAttribute(BEFORE_CLASS_DATA_ATTR);
          cap = watchList[i].querySelector(nodes.CAPTION);
          if (cap) {
            watchList[i].style.backgroundColor = "";
            day.style.fontWeight = "";
          }
        }
      }
    },
    addVisitedStyle: function(el, type) {
      var as, c, i, target, v, _i, _len;
      if (type === "live") {
        as = el.querySelectorAll("A");
        for (i = _i = 0, _len = as.length; _i < _len; i = ++_i) {
          v = as[i];
          if (!as[i].getAttribute("title")) {
            target = as[i];
            break;
          }
        }
        if (!target) {
          return;
        }
      } else {
        target = el.querySelector("A");
      }
      c = target.className;
      target.setAttribute("class", c + " " + CLASS_VISITED);
    }
  };
  initializer = (function(win) {
    var fAppend, trigger;
    trigger = {
      append: []
    };
    fAppend = win.jQuery.fn.append;
    win.jQuery.fn.append = function(s) {
      var i, v, _i, _len, _ref;
      if (!arguments.length) {
        return fAppend.apply(this, arguments);
      }
      fAppend.apply(this, arguments);
      _ref = trigger.append;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        v = _ref[i];
        trigger.append[i](s);
      }
      return this;
    };
    return {
      setTrigger: function(type, callback, judge) {
        if (!trigger[type]) {
          trigger[type] = [];
        }
        trigger[type].push(function(s) {
          if (judge) {
            if (judge(s)) {
              callback.apply(null, arguments);
            }
          } else {
            callback.apply(null, arguments);
          }
        });
      }
    };
  })(win);
  todayWatcher.init();
})(window);
