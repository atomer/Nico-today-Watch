import RangeSwitch from "./RangeSwitch";

export default class extends EventTarget {
  switchBase: HTMLElement;
  switchBaseTarget: HTMLElement;

  constructor() {
    super();  
    this.trigger();
    this.loadStyle();
    this.switchBase = document.querySelector("#nicorepo > H3");
    this.switchBaseTarget = this.switchBase.querySelector(".a");
    const switchBaseParent: HTMLElement = this.switchBase.parentNode as HTMLElement;
    switchBaseParent.style.position = "relative";
  }

  insertRangeSwitch(el: HTMLElement) {
    this.switchBase.insertBefore(el, this.switchBaseTarget);
  }

  loadStyle() {
    addStyle([
      ".ntw_visited:link {}",
      ".ntw_visited:visited {color: #FFF !important;}"
    ].join(""));
  }

  trigger() {
    let isInit: boolean = false;
    setTrigger("#MyPageNicorepoApp", () => {
      const timeline: HTMLElement = document.querySelector(".timeline .log");
      if (!isInit && timeline) {
        const event: CustomEvent = new CustomEvent("update", {
          detail: timeline.childNodes
        });
        this.dispatchEvent(event);
        setTrigger('timeline' + Date.now(), (list) => {
          const event: CustomEvent = new CustomEvent("update", {
            detail: list.map((e) => e.addedNodes[0])
          });
          this.dispatchEvent(event);
        });
        isInit = true;
      }
    }, true);
  }
}

const trigger = {};

function addObserver(selector: string, isSubTree: boolean) {
  const observer = new MutationObserver((list) => {
      if (trigger[selector]) {
          trigger[selector].forEach(t => t(list));
      }
  });
  observer.observe(document.querySelector(selector), {
      childList: true,
      subtree: isSubTree
  });
}

function setTrigger(selector: string, callback: Function, isSubTree: boolean = false) {
    if (!trigger[selector]) {
        addObserver(selector, isSubTree);
        trigger[selector] = [];
    }
    trigger[selector].push(function(list) {
        callback.apply(null, [list]);
    });
}

function addStyle(css: string) {
  const head: HTMLElement = document.getElementsByTagName("head")[0];
  if (!head) {
    return;
  }
  const style: HTMLStyleElement = document.createElement("style");
  style.type = "text/css";
  style.innerHTML = css;
  head.appendChild(style);
}