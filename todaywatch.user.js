// ==UserScript==
// @name        Nico today Watch
// @namespace   http://www.atomer.sakuran.ne.jp
// @description 自分のウォッチリストで現在時間から２４時間以内に更新したユーザーを強調表示する
// @include     http://www.nicovideo.jp/my/top/user
// @include     http://www.nicovideo.jp/my/top
// @include     http://www.nicovideo.jp/my/watchlist*
// @grant       GM_addStyle
// @version     0.8.0
// ==/UserScript==
(function(window, loaded) {
    let fn;
    let GM_addStyle;
    let win = null;
    if (!loaded) {
        fn = `(${arguments.callee.toString()})(this,true);`;
        let script = document.createElement("script");
        script.appendChild(document.createTextNode(fn));
        document.body.appendChild(script);
        return;
    } else {
        win = window;
    }
    
    if (/^\/my\/watchlist.*/.test(location.pathname)) {
        let sc = document.createElement("script");
        sc.src = "https://raw.github.com/atomer/Nico-today-Watch/0.6.3/todaywatch.user.js";
        sc.type = "text/javascript";
        document.body.appendChild(sc);
        return;
    }
    
    /*
    レポートタイプの取得
    */
    let getReportType = function(s) {
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
    };
    
    let HOURS_24 = 1000 * 60 * 60 * 24;
    let styles = {
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
    let nodes = {
        SWITCH_BASE: "#nicorepo > H3",
        WATCH_LIST_ITEM: ".timeline .log",
        DATE: ".log-footer-date time",
        CAPTION: ".log-body",
        DETAIL: ".log-target-info"
    };
    let CLASS_NEWER_LIST = "ntw_newer";
    let CLASS_VISITED = "ntw_visited";
    
    let BEFORE_CLASS_DATA_ATTR = "data-nicotodaywatch-beforeclass";
    
    let DAY_SET = {
        "1": "1日以内",
        "3": "3日以内",
        "7": "１週間以内",
        "31": "１ヶ月以内"
    };
    
    let getHours = day=> day * HOURS_24;

    if (typeof GM_addStyle === "undefined") {
        GM_addStyle = function (css) {
            let head = document.getElementsByTagName("head")[0];
            if (!head) {
                return;
            }
            let style = document.createElement("style");
            style.type = "text/css";
            style.innerHTML = css;
            head.appendChild(style);
        };
    }
    /*
    today Watch
    http://www.nicovideo.jp/my/watchlistを拡張
    */
    let todayWatcher = {
        _day: 1,
        _beforeCache: "",
        
        init() {
            this.trigger();
            this.loadStyle();
            this.createSwitch();
            this.em();
        },
        
        loadStyle() {
            GM_addStyle([
                ".ntw_visited:link {}",
                ".ntw_visited:visited {color: #FFF !important;}"
            ].join(""));
        },
        
        _createSelector(num, selected) {
            let selector = ['<select>'];
            
            if (typeof num === "number") {
                for (let i of __range__(0, num, false)) {
                    let n = i + 1;
                    selector.push(`<option value="${n}"${selected === n ? ' selected' : ''}>${n}</option>`);
                }
            } else if (typeof num === "object") {
                for (let val in num) {
                    selector.push(`<option value="${val}"${selected === val ? ' selected' : ''}>${num[val]}</option>`);
                }
            }
            
            selector.join("</select>");
            
            return selector.join("");
        },
        
        createSwitch() {
            let base = document.querySelector(nodes.SWITCH_BASE);
            let target = base.querySelector(".a");
            let div = document.createElement("div");
            let that = this;
            
            base.parentNode.style.position = "relative";
            
            div.setAttribute("style",  styles.COLORING_DAY_SELECTOR);
            let selector = this._createSelector(DAY_SET, this._day);
            div.innerHTML = selector;
            div.querySelector("SELECT").addEventListener("change", function(){
                that.changeDay(parseInt(this.value));
            }, false);
            base.insertBefore(div, target);
        },
        
        changeDay(day) {
            this._day = day;
            this.em();
        },
        
        trigger() {
            let that = this;
            initializer.setTrigger("append", function(list) {
                that.em(list[0]);
            }, list => !!list.selector);
        },
        
        em(list) {
            let watchList = list ? list.querySelectorAll(nodes.WATCH_LIST_ITEM) : document.querySelectorAll(nodes.WATCH_LIST_ITEM);
            let NOW = +new Date();
            
            for (let i = 0; i < watchList.length; i++) {
                let beforeClass, cap;
                let v = watchList[i];
                let day = v.querySelector(nodes.DATE);
                if (!day) {
                    continue;
                }
                let s = day.getAttribute("datetime");
                let d = new Date(s);
                
                // 更新時間比較
                if (NOW - d.getTime() < getHours(this._day)) {
                    // 既に効果適用済み
                    let t;
                    if (v.className.indexOf(CLASS_NEWER_LIST) !== -1) {
                        continue;
                    }
                    
                    // クラスに効果適用フラグを設定
                    beforeClass = v.className;
                    v.setAttribute(BEFORE_CLASS_DATA_ATTR, beforeClass);
                    v.className = beforeClass + " " + CLASS_NEWER_LIST;
                    
                    // 更新のタイプを見てリストアイテムのバックグラウンドカラー変更
                    cap = v.querySelector(nodes.CAPTION);
                    let det = v.querySelector(nodes.DETAIL);
                    if (cap) {
                        t = getReportType(cap.textContent);
                        v.style.backgroundColor = styles.ITEM_BG_COLOR[t];
                        day.style.fontWeight = styles.DATE_STYLE.fontWeight;
                        this.addVisitedStyle(cap, t);
                    }
                    if (det) {
                        this.addVisitedStyle(det, t);
                    }
                } else {
                    // スタイルを元に戻す
                    beforeClass = v.getAttribute(BEFORE_CLASS_DATA_ATTR);
                    if (beforeClass) {
                        v.className = beforeClass;
                    }
                    v.removeAttribute(BEFORE_CLASS_DATA_ATTR);
                    
                    cap = v.querySelector(nodes.CAPTION);
                    if (cap) {
                        v.style.backgroundColor = "";
                        day.style.fontWeight = "";
                    }
                }
            }
        },
        
        addVisitedStyle(el, type) {
            let target;
            if (type === "live") {
                let as = el.querySelectorAll("A");
                for (let i = 0; i < as.length; i++) {
                    let v = as[i];
                    if (!v.getAttribute("title")) {
                        target = v;
                        break;
                    }
                }
                if (!target) {
                    return;
                }
            } else {
                target = el.querySelector("A");
            }
            let c = target.className;
            target.setAttribute("class", c + " " + CLASS_VISITED);
        }
    };
    
    let initializer = (function(win) {
        let trigger = {append: []};
        let fAppend = win.jQuery.fn.append;
        
        win.jQuery.fn.append = function(s) {
            if (!arguments.length) {
                return fAppend.apply(this, arguments);
            }
            fAppend.apply(this, arguments);
            for (let i = 0; i < trigger.append.length; i++) {
                let v = trigger.append[i];
                v(s);
            }
            
            return this;
        };
        
        return {
            setTrigger(type, callback, judge) {
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

function __range__(left, right, inclusive) {
    let range = [];
    let ascending = left < right;
    let end = !inclusive ? right : ascending ? right + 1 : right - 1;
    for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
        range.push(i);
    }
    return range;
}