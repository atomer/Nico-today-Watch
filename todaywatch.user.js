// ==UserScript==
// @name        Nico today Watch
// @namespace   http://www.atomer.sakuran.ne.jp
// @description 自分のウォッチリストで現在時間から２４時間以内に更新したユーザーを強調表示する
// @include     http://www.nicovideo.jp/my/watchlist
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
    var todayWatcher = {
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
    
    var initializer = (function(win) {
        var trigger = {
            html: []
        };
        var fHTML = win.jQuery.fn.html;
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