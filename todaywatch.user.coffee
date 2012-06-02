###
// ==UserScript==
// @name		Nico today Watch
// @namespace   http://www.atomer.sakuran.ne.jp
// @description 自分のウォッチリストで現在時間から２４時間以内に更新したユーザーを強調表示する
// @include	 http://www.nicovideo.jp/my/top/user
// @include	 http://www.nicovideo.jp/my/top
// @include	 http://www.nicovideo.jp/my/watchlist*
// @version	 0.7.1
// ==/UserScript==
###
((window, loaded) ->
	win = null
	if not loaded and @chrome
		fn = '(' + arguments.callee.toString() + ')(this,true);'
		script = document.createElement "script"
		script.appendChild(document.createTextNode fn)
		document.body.appendChild script
		return
	else if @chrome
		win = window
	else
		win = unsafeWindow? or window
	
	if /^\/my\/watchlist.*/.test location.pathname
		d = document.createElement "script"
		d.src = "http://userscripts.org/scripts/version/103101/456930.user.js"
		d.type = "text/javascript"
		document.body.appendChild d
		return
	
	###
	レポートタイプの取得
	###
	getReportType = (s) ->
		s = s.replace /^\s+|\s+$/g, ""
		# 動画投稿
		if /動画を投稿しました。$/.test s
			return "video"
		# 静画投稿
		else if /イラストを投稿しました。$/.test s
			return "illust"
		# 静画クリップ
		else if /イラストをクリップしました。$/.test s
			return "clip"
		# 生放送
		else if /生放送を開始しました。$/.test s
			return "live"
		# マイリスト登録
		else if /マイリスト登録しました。$/.test s
			return "mylist"
		# バッジ取得とか
		else if /取得しました。$/.test s
			return "stamp"
		# なんだっけ
		else if /紹介されました。$/.test s
			return "intro"
		# 宣伝
		else if /宣伝しました。$/.test s
			return "advert"
		# 動画再生記録
		else if /達成しました。$/.test s
			return "achiev"
		# その他
		else
			return "none"
	
	HOURS_24 = 1000 * 60 * 60 * 24
	styles =
		ITEM_BG_COLOR:
			video: "#FDD"
			illust: "#9E9"
			live: "#DDF"
			mylist: "#FEE4B2"
			clip: "#DDD"
			stamp: "#DDD"
			intro: "#DDD"
			advert: "#DDD"
			achiev: "#DDD"
			none: "#DDD"
		DATE_STYLE:
			fontWeight: "bold"
		COLORING_DAY_SELECTOR: "position:absolute;top:5px;right:185px;width:100px;"
	nodes =
		SWITCH_BASE: "#nicorepo > H3"
		WATCH_LIST_ITEM: ".timeline .log"
		DATE: ".relative"
		CAPTION: ".log-body"
	CSS_VISITED = "http://www.atomer.sakura.ne.jp/js/greasemonkey/todaywatch/override_visited.css"
	CLASS_NEWER_LIST = "ntw_newer"
	CLASS_VISITED = "ntw_visited"
	
	BEFORE_CLASS_DATA_ATTR = "data-nicotodaywatch-beforeclass"
	
	DAY_SET =
		"1": "1日以内"
		"3": "3日以内"
		"7": "１週間以内"
		"31": "１ヶ月以内"
	
	getHours = (day) ->
		return day * HOURS_24
	
	###
	today Watch
	http://www.nicovideo.jp/my/watchlistを拡張
	###
	todayWatcher =
		_day: 1
		_beforeCache: ""
		
		init: () ->
			@trigger()
			@loadStyle()
			@createSwitch()
			@em()
			
			return
		
		loadStyle: () ->
			style = document.createElement "link"
			
			style.setAttribute "href", CSS_VISITED
			style.setAttribute "type", "text/css"
			style.setAttribute "rel", "stylesheet"
			document.getElementsByTagName("head")[0].appendChild style
			
			return
		
		_createSelector: (num, selected) ->
			selector = ['<select>']
			
			if typeof num is "number"
				for i in [0...num]
					n = i + 1
					selector.push '<option value="' + n + '"' + (if selected is n then ' selected' else '') + '>' + n + '</option>'
			else if typeof num is "object"
				for val of num
					selector.push '<option value="' + val + '"' + (if selected == val then ' selected' else '') + '>' + num[val] + '</option>'
			
			selector.join "</select>"
			
			return selector.join ""
		
		createSwitch: () ->
			base = document.querySelector nodes.SWITCH_BASE
			target = base.querySelector ".a"
			div = document.createElement "div"
			that = @
			
			base.parentNode.style.position = "relative"
			
			div = document.createElement "div"
			div.setAttribute "style",  styles.COLORING_DAY_SELECTOR
			selector = @_createSelector DAY_SET, @_day
			div.innerHTML = selector
			div.querySelector("SELECT").addEventListener "change", () ->
				that.changeDay(parseInt @value)
				return
			, false
			base.insertBefore div, target
			
			return
		
		changeDay: (day) ->
			ul = document.querySelector ".timeline"
			@_day = day
			@em()
			
			return
		
		trigger: () ->
			that = @
			
			initializer.setTrigger "append", (list) ->
				that.em list[0]
				return
			, (list) ->
				return not not list.selector
			
			return
		
		em: (list) ->
			watchList = if list then list.querySelectorAll nodes.WATCH_LIST_ITEM else document.querySelectorAll nodes.WATCH_LIST_ITEM
			NOW = +new Date
			
			for i in [0...watchList.length]
				day = watchList[i].querySelector nodes.DATE
				if not day
					continue
				s = day.getAttribute "datetime"
				d = new Date s
				
				# 更新時間比較
				if NOW - d.getTime() < getHours @_day
					# 既に効果適用済み
					if watchList[i].className.indexOf(CLASS_NEWER_LIST) isnt -1
						continue
					
					# クラスに効果適用フラグを設定
					beforeClass = watchList[i].className
					watchList[i].setAttribute BEFORE_CLASS_DATA_ATTR, beforeClass
					watchList[i].className = beforeClass + " " + CLASS_NEWER_LIST
					
					# 更新のタイプを見てリストアイテムのバックグラウンドカラー変更
					cap = watchList[i].querySelector nodes.CAPTION
					if cap
						t = getReportType cap.textContent
						watchList[i].style.backgroundColor = styles.ITEM_BG_COLOR[t]
						day.style.fontWeight = styles.DATE_STYLE.fontWeight
						@addVisitedStyle cap, t
				else
					# スタイルを元に戻す
					beforeClass = watchList[i].getAttribute BEFORE_CLASS_DATA_ATTR
					beforeClass and watchList[i].className = beforeClass
					watchList[i].removeAttribute BEFORE_CLASS_DATA_ATTR
					
					cap = watchList[i].querySelector nodes.CAPTION
					if cap
						watchList[i].style.backgroundColor = ""
						day.style.fontWeight = ""
			
			return
		
		addVisitedStyle: (el, type) ->
			if type is "live"
				as = el.querySelectorAll "A"
				for i in [0...as.length]
					if not as[i].getAttribute "title"
						target = as[i]
						break
				if not target
					return
			else
				target = el.querySelector "A"
			c = target.className
			target.setAttribute "class", c + " " + CLASS_VISITED
			
			return
	
	initializer = ((win) ->
		trigger =
			append: []
		fAppend = win.jQuery.fn.append
		
		win.jQuery.fn.append = (s) ->
			if not arguments.length
				return fAppend.apply @, arguments
			fAppend.apply @, arguments
			for i in [0...trigger.append.length]
				trigger.append[i] s
			
			return @
		
		return {
			setTrigger: (type, callback, judge) ->
				not trigger[type] and trigger[type] = []
				trigger[type].push (s) ->
					if judge
						judge(s) and callback.apply null, arguments
					else
						callback.apply null, arguments
					return
				
				return
		}
	)(win)
	
	todayWatcher.init()
	return
)(window)