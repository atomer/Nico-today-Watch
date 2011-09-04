// ==UserScript==
// @name		Nico today Watch
// @namespace   http://www.atomer.sakuran.ne.jp
// @description 自分のウォッチリストで現在時間から２４時間以内に更新したユーザーを強調表示する
// @include	 http://www.nicovideo.jp/my/watchlist*
// @version	 0.4.1
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
		if (/^動画.+投稿しました。$/.test(s)) {
			return "video";
		} else if (/^イラスト.+投稿しました。$/.test(s)) {
			return "illust";
		} else if (/^イラスト.+をクリップしました。$/.test(s)) {
			return "clip";
		} else if (/開始しました。$/.test(s)) {
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
	}
	
	var HOURS_24 = 1000 * 60 * 60 * 24,
		styles = {
			BASE: "myContBody",
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
				color: "#F33",
				fontWeight: "bold"
			},
			FILTER_BUTTON: "position:absolute;top:5px;right:5px;width:170px;padding:2px;border:1px solid #F33;",
			FILTER_ON_BUTTON: "text-align:center;background:#F33;color:#FFF",
			FILTER_OFF_BUTTON: "text-align:center;background:#FFF;color:#F33",
			COLORING_DAY_SELECTOR: "position:absolute;top:5px;right:185px;width:100px;"
		},
		nodes = {
			WATCH_LIST_ITEM: ".myContList > LI",
			DATE: ".report > H4 + P + P",
			CAPTION: ".report > H4 + P"
		},
		CSS_VISITED = "http://www.atomer.sakura.ne.jp/js/greasemonkey/todaywatch/override_visited.css",
		CLASS_NEWER_LIST = "ntw_newer",
		CLASS_VISITED = "ntw_visited",
		
		CLASS_FILTER_BUTTON = "ntw_filter",
		CLASS_FILTER_ON = "ntw_filter_on",
		CAPTION_FILTER_ON = "最新更新者のみ表示",
		CAPTION_FILTER_OFF = "すべて表示する",
		
		SEIGA_URI = "http://lohas.nicoseiga.jp/thumb/${id}i",

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
		
		_filtering: false,
		
		init: function() {
			this.trigger();
			this.loadStyle();
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
		
		createSwitch: function(filtering) {
			var base = document.getElementById(styles.BASE),
				target = base.querySelector(".spBox"),
				div = document.createElement("div"),
				defClass = CLASS_FILTER_BUTTON,
				defStyle = styles.FILTER_BUTTON,
				selector, defCaption, that = this;
			
			if (filtering) {
				defClass = CLASS_FILTER_BUTTON + " " + CLASS_FILTER_ON;
				defStyle += styles.FILTER_ON_BUTTON;
				defCaption = CAPTION_FILTER_OFF;
			} else {
				defClass = CLASS_FILTER_BUTTON;
				defStyle += styles.FILTER_OFF_BUTTON;
				defCaption = CAPTION_FILTER_ON;
			}
			div.setAttribute("style",  defStyle);
			div.innerHTML = '<a role="button" style="cursor:pointer;display:block;width:100%;height:100%;" class="' + defClass + '">' + defCaption + '</a>';
			base.insertBefore(div, target);
			base.parentNode.style.position = "relative";
			
			base.querySelector("." + CLASS_FILTER_BUTTON).addEventListener("click", function(e) {
				if (this.className.indexOf(CLASS_FILTER_ON) === -1) {
					this.parentNode.setAttribute("style", styles.FILTER_BUTTON + styles.FILTER_ON_BUTTON);
					this.textContent = CAPTION_FILTER_OFF;
					this.className = CLASS_FILTER_BUTTON + " " + CLASS_FILTER_ON;
					that._filtering = true;
					that.filter(true);
				} else {
					this.parentNode.setAttribute("style", styles.FILTER_BUTTON + styles.FILTER_OFF_BUTTON);
					this.textContent = CAPTION_FILTER_ON;
					this.className = CLASS_FILTER_BUTTON;
					that._filtering = false;
					that.filter(false);
				}
			}, false);

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
			var ul = document.querySelector(".myContList");
			
			this._day = day;
			this._beforeCache && (ul.innerHTML = this._beforeCache);
			this.em(this._filtering);
		},
		
		trigger: function() {
			var that = this;
			
			initializer.setTrigger("html", function() {
				that.createSwitch(that._filtering);
				that.em(that._filtering);
				that.addIllustImage();
			}, function(s) {
				return s.indexOf("myContHead") !== -1;
			});
		},
		
		em: function(filtering) {
			var ul = document.querySelector(".myContList"),
				watchList = ul.querySelectorAll(nodes.WATCH_LIST_ITEM),
				day, s, d, cap, t,
				NOW = +new Date;

			this._beforeCache = ul.innerHTML;
			
			for (var i = 0, len = watchList.length; i < len; i++) {
				day = watchList[i].querySelector(nodes.DATE);
				if (!day) {
					filtering && (watchList[i].style.display = "none");
					continue;
				}
				s = day.innerHTML.replace(/^(\d{2})年(\d{2})月(\d{2})日\(.\) (\d{2}):(\d{2})/, "20$1/$2/$3 $4:$5:00");
				d = new Date(s);
				if (NOW - d.getTime() < getHours(this._day)) {
					watchList[i].className += " " + CLASS_NEWER_LIST;
					cap = watchList[i].querySelector(nodes.CAPTION);
					if (!cap) {
						continue;
					}
					t = getReportType(cap.textContent);
					watchList[i].style.backgroundColor = styles.ITEM_BG_COLOR[t];
					day.style.color = styles.DATE_STYLE.color;
					day.style.fontWeight = styles.DATE_STYLE.fontWeight;
					this.addVisitedStyle(cap, t);
				} else {
					filtering && (watchList[i].style.display = "none");
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
		},
		
		filter: function(filtering) {
			var watchList, display;

			if (filtering) {
				display = "none";
				watchList = document.querySelectorAll(nodes.WATCH_LIST_ITEM + ":not(." + CLASS_NEWER_LIST + ")");
			} else {
				display = "block";
				watchList = document.querySelectorAll(nodes.WATCH_LIST_ITEM);
			}
			display = filtering ? "none" : "block";
			for (var i = 0, len = watchList.length; i < len; i++) {
				watchList[i].style.display = display;
			}
		},
		
		addIllustImage: function() {
			var watchList = document.querySelectorAll(nodes.WATCH_LIST_ITEM),
			cap, t, report, id, img, a;
			
			for (var i = 0, len = watchList.length; i < len; i++) {
				cap = watchList[i].querySelector(nodes.CAPTION);
				if (!cap) {
					continue;
				}
				t = getReportType(cap.textContent);
				if (t === "illust" || t === "clip") {
					a = cap.querySelector("A");
					id = a.href.replace(/^.+\/im(\d+)$/, "$1");
					img = document.createElement("img");
					img.setAttribute("src", SEIGA_URI.replace("${id}", id));
					img.setAttribute("height", "48");
					img.setAttribute("style", "margin-left:6px;");
					a.appendChild(img);
				}
			}
		}
	};
	
	var initializer = (function(win) {
		var trigger = {
			html: []
		},
			fHTML = win.jQuery.fn.html;
		
		win.jQuery.fn.html = function(s) {
			if (!arguments.length) {
				return fHTML.apply(this, arguments);
			}
			fHTML.apply(this, arguments);
			for (var i = 0, len = trigger.html.length; i < len; i++) {
				trigger.html[i](s);
			}
			return this;
		};
		return {
			setTrigger: function(type, callback, judge) {
				!trigger[type] && (trigger[type] = []);
				trigger[type].push(function(s) {
					if (judge) {
						judge(s) && callback();
					} else {
						callback();
					}
				});
			}
		};
	})(win);
	
	todayWatcher.init();
	
})(window);