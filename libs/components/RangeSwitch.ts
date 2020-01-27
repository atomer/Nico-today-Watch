const DAY_SET = {
  "1": "1日以内",
  "2": "2日以内",
  "3": "3日以内",
  "4": "4日以内",
  "5": "5日以内",
  "6": "6日以内",
  "7": "１週間以内",
  "31": "１ヶ月以内"
};

export default class {
  value: number;

  constructor(options: Options) {
    const base: HTMLElement = document.querySelector(options.switchBase);
    const target: HTMLElement = base.querySelector(".a");
    const div: HTMLElement = document.createElement("div");
    base.parentNode.style.position = "relative";

    div.setAttribute("style", "position:absolute;top:5px;right:5px;width:100px;");
    const selector: string = createSelectorString(DAY_SET, 1);
    div.innerHTML = selector;
    const select: HTMLSelectElement = div.querySelector("SELECT");
    select.addEventListener("change", () => {
      this.value = parseInt(select.value, 10);
      const event: CustomEvent = new CustomEvent("change", {
        detail: this.value
      });
      this.dispatchEvent(event);
    }, false);
    base.insertBefore(div, target);
  }
}

interface Options {
  switchBase: string;
}

function createSelectorString(num: number | {}, selected: boolean | string): string {
  const selector: string[] = ['<select>'];

  if (typeof num === "number") {
      for (let i of __range__(0, num, false)) {
          let n: number = i + 1;
          selector.push(`<option value="${n}"${selected ? ' selected' : ''}>${n}</option>`);
      }
  } else if (typeof num === "object") {
      for (let val in num) {
          selector.push(`<option value="${val}"${selected === val ? ' selected' : ''}>${num[val]}</option>`);
      }
  }

  selector.join("</select>");

  return selector.join("");
}

function __range__(left, right, inclusive): number[] {
    const range: number[] = [];
    const ascending: boolean = left < right;
    const end: number = !inclusive ? right : ascending ? right + 1 : right - 1;
    for (let i: number = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
        range.push(i);
    }
    return range;
}
