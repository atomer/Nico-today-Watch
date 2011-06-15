// ==UserScript==
// @name        Nico today Watch
// @namespace   http://www.atomer.sakuran.ne.jp
// @description ニコニコ動画のマイページ拡張（ウォッチリスト内強調表示、ニコレポフィルター）
// @include     http://www.nicovideo.jp/my/*
// @version     0.3
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
    
    /**
     * nicomoner
     * ニコニコのマイページに関する共通的な拡張
     */
    var nicomoner = {
        VIDEO_RANKING: '<ul class="subNav nav4Main">' +
                           '<li><a href="http://www.nicovideo.jp/ranking/fav/hourly/all">毎時</a></li>' +
                           '<li><a href="http://www.nicovideo.jp/ranking/fav/daily/all">デイリー</a></li>' +
                           '<li><a href="http://www.nicovideo.jp/ranking/fav/weekly/all">週間</a></li>' +
                           '<li><a href="http://www.nicovideo.jp/ranking/fav/monthly/all">月間</a></li>' +
                           '<li><a href="http://www.nicovideo.jp/ranking/fav/total/all">合計</a></li>' +
                       '</ul>',
        insertRankingMenu: function() {
            var nav = document.querySelector("#mainNav");
            var li = nav.querySelector(".hasSubNav").previousSibling.previousSibling
            li.querySelector("A").appendChild(document.createTextNode("▼"));
            li.className = "hasSubNav";
            li.innerHTML = li.innerHTML + this.VIDEO_RANKING;
            li.querySelector(".subNav").style.marginLeft = "40px";
        }
    };
    
    var initializer;
    
    /*
     * レポートタイプの取得
     */
    function getReportType(s) {
        s = s.replace(/^\s+|\s+$/g, "");
        if (/^動画.+投稿しました。$/.test(s)) {
            return "video";
        } else if (/^イラスト.+投稿しました。$/.test(s)) {
            return "illust";
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
    
    /**
     * today Watch
     * http://www.nicovideo.jp/my/watchlistを拡張
     */
    var todayWatcher = {};
    todayWatcher.watchlist = {
        HOURS_24: 1000 * 60 * 60 * 24,
        BG_COLOR: {
            video: "#FDD",
            illust: "#9E9",
            live: "#DDF",
            mylist: "#FEE4B2",
            stamp: "#DDD",
            intro: "#DDD",
            advert: "#DDD",
            achiev: "#DDD",
            none: "#DDD"
        },
        CSS_VISITED: "http://www.atomer.sakura.ne.jp/js/greasemonkey/todaywatch/override_visited.css",
        CLASS_VISITED: "ntw_visited",
        init: function() {
            this._trigger();
            var style = document.createElement("link");
            style.setAttribute("href", this.CSS_VISITED);
            style.setAttribute("type", "text/css");
            style.setAttribute("rel", "stylesheet");
            document.getElementsByTagName("head")[0].appendChild(style);
        },
        _trigger: function() {
            var that = this;
            initializer.setTrigger("html", function() {
                that.em();
            }, function(s) {
                return s.indexOf("myContHead") !== -1;
            });
        },
        em: function() {
            var watchList = document.querySelectorAll(".myContList > LI");
            var day, s, d, cap, t;
            var NOW = +new Date;
            for (var i = 0, len = watchList.length; i < len; i++) {
                day = watchList[i].querySelector(".report > H4 + P + P");
                if (!day) {
                    continue;
                }
                s = day.innerHTML.replace(/^(\d{2})年(\d{2})月(\d{2})日\(.\) (\d{2}):(\d{2})/, "20$1/$2/$3 $4:$5:00");
                d = new Date(s);
                if (NOW - d.getTime() < this.HOURS_24) {
                    cap = watchList[i].querySelector(".report > H4 + P");
                    t = getReportType(cap.textContent);
                    watchList[i].style.backgroundColor = this.BG_COLOR[t];
                    day.style.color = "#F33";
                    day.style.fontWeight = "bold";
                    this.addVisitedStyle(cap, t);
                }
            }
        },
        addVisitedStyle: function(el, type) {
            var target;
            if (type === "live") {
                var as = el.querySelectorAll("A");
                var h;
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
            var c = target.className;
            target.setAttribute("class", c + " " + this.CLASS_VISITED);
        }
    };
    
    todayWatcher.top = {
        _labelList: [],
        _filterBase: null,
        _filterName: "",
        init: function() {
            this._trigger();
            this._getElement();
            
            this._filterBase = this._createFilterBase();
            this._attachEvent();
            
            this._refreshFilter();
        },
        _trigger: function() {
            var that = this;
            initializer.setTrigger("appendTo", function() {
                that._filter(that._filterName);
                that._refreshFilter(that._filterName);
            }, function(s) {
                if (typeof s === "object" && s.html && s.html().indexOf("SYS_TH_RES_POST_") !== -1) {
                    return true;
                }
                return false;
            });
        },
        _getElement: function() {
            this._reportList = document.getElementById("SYS_THREADS");
        },
        _attachEvent: function() {
            var that = this;
            this._filterBase.addEventListener("change", function(e) {
                var s = that._filterBase.options[that._filterBase.selectedIndex].value;
                that._filterName = s;
                that._filter(s);
                that._filterBase.blur();
            }, true);
        },
        _createFilterBase: function() {
            var base = document.getElementById("myContBody");
            var div = document.createElement("div");
            div.style.textAlign = "right";
            div.id = "todaywatch_nicorepo_filter";
            div.innerHTML = '<span>フィルター：</span>';
            var select = document.createElement("select");
            div.appendChild(select);
            base.insertBefore(div, this._reportList);
            return select;
        },
        _refreshFilter: function(defName) {
            var that = this;
            this._eachItem(function(name, el) {
                !that._labelList[name] && (that._labelList[name] = true);
            });
            
            var list = ['<option value="">フィルター無し</option>'];
            for (var s in this._labelList) {
                if (this._labelList.hasOwnProperty(s)) {
                    list.push('<option value="' + s + '"' + (defName === s ? ' selected' : '') + '>' + s + '</option>');
                }
            }
            this._filterBase.innerHTML = list.join("");
        },
        _filter: function(s) {
            this._eachItem(function(name, el) {
                if (name === s || s === "") {
                    el.style.display = "block";
                } else {
                    el.style.display = "none";
                }
            });
        },
        _eachItem: function(f) {
            var items = document.querySelectorAll("#SYS_THREADS > LI");
            var name;
            for (var i = 0, len = items.length; i < len; i++) {
                name = items[i].querySelector(".userName > A").textContent;
                f(name, items[i]);
            }
        }
    };
    
    nicomoner.insertRankingMenu();
    
    // trigger
    var url = window.location.href;
    var trigger = url.replace(/^http:\/\/www\.nicovideo\.jp\/my\/([^\/#\?]*)(\?|#.*)?$/, "$1");
    !trigger && (trigger = "top");
    if (todayWatcher[trigger]) {
        initializer = (function(win) {
            var trigger = {
                html: [],
                appendTo: []
            };
            var fHTML = win.jQuery.fn.html;
            var fAppendTo = win.jQuery.fn.appendTo;
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
            win.jQuery.fn.appendTo = function(s) {
                fAppendTo.apply(this, arguments);
                for (var i = 0, len = trigger.appendTo.length; i < len; i++) {
                    trigger.appendTo[i](s);
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
        todayWatcher[trigger].init();
    }
    
})(window);