const CLASS_NEWER_LIST: string = 'ntw_newer';
const CLASS_VISITED: string = 'ntw_visited';
const BEFORE_CLASS_DATA_ATTR: string = 'data-nicotodaywatch-beforeclass';
const CAPTION: string = '.log-body';
const DETAIL: string = '.log-target-info';
const ITEM_BG_COLOR = {
  video: '#FDD',
  illust: '#9E9',
  live: '#DDF',
  mylist: '#FEE4B2',
  clip: '#DDD',
  stamp: '#DDD',
  intro: '#DDD',
  advert: '#DDD',
  achiev: '#DDD',
  none: '#DDD',
};
const DATE_STYLE = {
  fontWeight: 'bold',
};

export default class {
  el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  updateEmphasis(day: number, list: NodeList | void) {
    const now: number = +new Date();
    (list || this.el.querySelectorAll('.timeline .log')).forEach(
      (v: HTMLElement) => {
        const time: HTMLElement = v.querySelector('.log-footer-date time');
        if (!time) {
          return;
        }
        const s: string = time.getAttribute('datetime');
        const d: Date = new Date(s);

        // 更新時間比較
        if (now - d.getTime() < getHours(day)) {
          this.emphasize(v, time);
        } else {
          this.demphasize(v, time);
        }
      }
    );
  }

  emphasize(v: HTMLElement, day: HTMLElement) {
    // 既に効果適用済み
    if (v.className.indexOf(CLASS_NEWER_LIST) !== -1) {
      return;
    }

    // クラスに効果適用フラグを設定
    const beforeClass: string = v.className;
    v.setAttribute(BEFORE_CLASS_DATA_ATTR, beforeClass);
    v.className = beforeClass + ' ' + CLASS_NEWER_LIST;

    // 更新のタイプを見てリストアイテムのバックグラウンドカラー変更
    const cap: HTMLElement = v.querySelector(CAPTION);
    const det: HTMLElement = v.querySelector(DETAIL);
    if (cap) {
      const t: string = getReportType(cap.textContent);
      v.style.backgroundColor = ITEM_BG_COLOR[t];
      day.style.fontWeight = DATE_STYLE.fontWeight;
      addVisitedStyle(cap, t);
    }
    if (det) {
      addVisitedStyle(det);
    }
  }

  demphasize(v: HTMLElement, day: HTMLElement) {
    // スタイルを元に戻す
    const beforeClass: string = v.getAttribute(BEFORE_CLASS_DATA_ATTR);
    if (beforeClass) {
      v.className = beforeClass;
    }
    v.removeAttribute(BEFORE_CLASS_DATA_ATTR);

    const cap: HTMLElement = v.querySelector(CAPTION);
    if (cap) {
      v.style.backgroundColor = '';
      day.style.fontWeight = '';
    }
  }
}

const HOURS_24: number = 1000 * 60 * 60 * 24;
function getHours(day: number): number {
  return day * HOURS_24;
}

/*
レポートタイプの取得
*/
function getReportType(s: string): string {
  s = s.replace(/^\s+|\s+$/g, '');
  // 動画投稿
  if (/動画を投稿しました。$/.test(s)) {
    return 'video';
    // 静画投稿
  } else if (/イラストを投稿しました。$/.test(s)) {
    return 'illust';
    // 静画クリップ
  } else if (/イラストをクリップしました。$/.test(s)) {
    return 'clip';
    // 生放送
  } else if (/生放送を開始しました。$/.test(s)) {
    return 'live';
    // マイリスト登録
  } else if (/マイリスト登録しました。$/.test(s)) {
    return 'mylist';
    // バッジ取得とか
  } else if (/取得しました。$/.test(s)) {
    return 'stamp';
    // なんだっけ
  } else if (/紹介されました。$/.test(s)) {
    return 'intro';
    // 宣伝
  } else if (/宣伝しました。$/.test(s)) {
    return 'advert';
    // 動画再生記録
  } else if (/達成しました。$/.test(s)) {
    return 'achiev';
    // その他
  } else {
    return 'none';
  }
}

function addVisitedStyle(el: HTMLElement, type: string | void) {
  let target: HTMLElement;
  if (type === 'live') {
    el.querySelectorAll('A').forEach((v: HTMLElement) => {
      if (!v.getAttribute('title')) {
        target = v;
      }
    });
    if (!target) {
      return;
    }
  } else {
    target = el.querySelector('A');
  }
  const c: string = target.className;
  target.setAttribute('class', c + ' ' + CLASS_VISITED);
}
