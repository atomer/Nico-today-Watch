// ==UserScript==
// @name		Nico today Watch
// @namespace   http://www.atomer.sakuran.ne.jp
// @description 自分のウォッチリストで現在時間から２４時間以内に更新したユーザーを強調表示する
// @include	 http://www.nicovideo.jp/my/top/user
// @version	 0.7
// ==/UserScript==
(function(window, loaded){
	var win;
	if (!loaded && this.chrome) {
		var fn = '(' + arguments.callee.toString() + ')(this,true);';
		var script = document.createElement('script');
		script.appendChild(document.createTextNode(fn));
		document.body.appendChild(script);
		return;
	} else if (this.chrome) {
		win = window;
	} else {
		win = unsafeWindow;
	}
	
	/*
	 * レポートタイプの取得
	 */
	function getReportType(s) {
		s = s.replace(/^\s+|\s+$/g, "");
		// 動画投稿
		if (/動画を投稿しました。$/.test(s)) {
			return "video";
		// 静画投稿
		} else if (/イラストを投稿しました。$/.test(s)) {
			return "illust";
		// 静画クリップ
		} else if (/イラストをクリップしました。$/.test(s)) {
			return "clip";
		// 生放送
		} else if (/生放送を開始しました。$/.test(s)) {
			return "live";
		// マイリスト登録
		} else if (/マイリスト登録しました。$/.test(s)) {
			return "mylist";
		// バッジ取得とか
		} else if (/取得しました。$/.test(s)) {
			return "stamp";
		// なんだっけ
		} else if (/紹介されました。$/.test(s)) {
			return "intro";
		// 宣伝
		} else if (/宣伝しました。$/.test(s)) {
			return "advert";
		// 動画再生記録
		} else if (/達成しました。$/.test(s)) {
			return "achiev";
		// その他
		} else {
			return "none";
		}
	}
	
	var HOURS_24 = 1000 * 60 * 60 * 24,
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
			COLORING_DAY_SELECTOR: "position:absolute;top:5px;right:185px;width:100px;"
		},
		nodes = {
			SWITCH_BASE: "#nicorepo > H3",
			WATCH_LIST_ITEM: ".timeline .log",
			DATE: ".relative",
			CAPTION: ".log-body"
		},
		CSS_VISITED = "http://www.atomer.sakura.ne.jp/js/greasemonkey/todaywatch/override_visited.css",
		CLASS_NEWER_LIST = "ntw_newer",
		CLASS_VISITED = "ntw_visited",
		
		BEFORE_CLASS_DATA_ATTR = "data-nicotodaywatch-beforeclass",
		
		DAY_SET = {
			"1": "1日以内",
			"3": "3日以内",
			"7": "１週間以内",
			"31": "１ヶ月以内"
		};
	
	function getHours(day) {
		return day * HOURS_24;
	}
	
	/**
	 * today Watch
	 * http://www.nicovideo.jp/my/watchlistを拡張
	 */
	var todayWatcher = {

		_day: 1,

		_beforeCache: "",
		
		init: function() {
			this.trigger();
			this.loadStyle();
			this.createSwitch();
			this.em();
		},
		
		loadStyle: function() {
			var style = document.createElement("link");
			
			style.setAttribute("href", CSS_VISITED);
			style.setAttribute("type", "text/css");
			style.setAttribute("rel", "stylesheet");
			document.getElementsByTagName("head")[0].appendChild(style);
		},

		_createSelector: function(num, selected) {
			var selector = ['<select>'], n;

			if (typeof num === "number") {
				for (var i = 0; i < num; i++) {
					n = i + 1;
					selector.push('<option value="' + n + '"' +
								  (selected === n ? ' selected' : '') +
								  '>' + n + '</option>');
				}
			} else if (typeof num === 'object') {
				for (var val in num) {
					selector.push('<option value="' + val + '"' +
								  (selected == val ? ' selected' : '') +
								  '>' + num[val] + '</option>');
				}
			}
			selector.join('</select>');

			return selector.join("");
		},
		
		createSwitch: function() {
			var base = document.querySelector(nodes.SWITCH_BASE),
				target = base.querySelector(".a"),
				div = document.createElement("div"),
				selector, defCaption, that = this;
			
			base.parentNode.style.position = "relative";
			
			div = document.createElement("div");
			div.setAttribute("style",  styles.COLORING_DAY_SELECTOR);
			selector = this._createSelector(DAY_SET, this._day);
			div.innerHTML = selector;
			div.querySelector("SELECT").addEventListener("change", function() {
				that.changeDay(parseInt(this.value));
			}, false);
			base.insertBefore(div, target);
		},

		changeDay: function(day) {
			var ul = document.querySelector(".timeline");
			
			this._day = day;
			this.em();
		},
		
		trigger: function() {
			var that = this;
			
			initializer.setTrigger("append", function(list) {
				that.em(list[0]);
			}, function(list) {
				return !!list.selector;
			});
		},
		
		em: function(list) {
			var watchList = list ? list.querySelectorAll(nodes.WATCH_LIST_ITEM) :
									document.querySelectorAll(nodes.WATCH_LIST_ITEM),
				beforeClass,
				day, s, d, cap, t,
				NOW = +new Date;
			
			for (var i = 0, len = watchList.length; i < len; i++) {
				day = watchList[i].querySelector(nodes.DATE);
				if (!day) {
					continue;
				}
				s = day.getAttribute("datetime");
				d = new Date(s);
				
				// 更新時間比較
				if (NOW - d.getTime() < getHours(this._day)) {
					// 既に効果適用済み
					if (watchList[i].className.indexOf(CLASS_NEWER_LIST) !== -1) {
						continue;
					}
					
					// クラスに効果適用フラグを設定
					beforeClass = watchList[i].className;
					watchList[i].setAttribute(BEFORE_CLASS_DATA_ATTR, beforeClass);
					watchList[i].className = beforeClass + " " + CLASS_NEWER_LIST;
					
					// 更新のタイプを見てリストアイテムのバックグラウンドカラー変更
					cap = watchList[i].querySelector(nodes.CAPTION);
					if (cap) {
						t = getReportType(cap.textContent);
						watchList[i].style.backgroundColor = styles.ITEM_BG_COLOR[t];
						day.style.fontWeight = styles.DATE_STYLE.fontWeight;
						this.addVisitedStyle(cap, t);
					}
				} else {
					// スタイルを元に戻す
					beforeClass = watchList[i].getAttribute(BEFORE_CLASS_DATA_ATTR);
					beforeClass && (watchList[i].className = beforeClass);
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
			var target, as, h, c;
			
			if (type === "live") {
				as = el.querySelectorAll("A");
				for (var i = 0, len = as.length; i < len; i++) {
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
	
	var initializer = (function(win) {
		var trigger = {
				append: []
			},
			fAppend = win.jQuery.fn.append;
		
		win.jQuery.fn.append = function(s) {
			if (!arguments.length) {
				return fAppend.apply(this, arguments);
			}
			fAppend.apply(this, arguments);
			for (var i = 0, len = trigger.append.length; i < len; i++) {
				trigger.append[i](s);
			}
			return this;
		};
		return {
			setTrigger: function(type, callback, judge) {
				!trigger[type] && (trigger[type] = []);
				trigger[type].push(function(s) {
					if (judge) {
						judge(s) && callback.apply(null, arguments);
					} else {
						callback.apply(null, arguments);
					}
				});
			}
		};
	})(win);
	
	todayWatcher.init();
	
})(window);