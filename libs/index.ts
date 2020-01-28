import Base from './components/Base';
import NicoReport from './components/NicoReport';
import RangeSwitch from './components/RangeSwitch';

const base: Base = new Base();
const nicoReport: NicoReport = new NicoReport(document.body);
const rangeSwitch: RangeSwitch = new RangeSwitch();

base.addEventListener('update', (e: CustomEvent) => {
  nicoReport.updateEmphasis(rangeSwitch.value, e.detail);
});
rangeSwitch.addEventListener('change', (e: CustomEvent) => {
  nicoReport.updateEmphasis(e.detail);
});

base.insertRangeSwitch(rangeSwitch.el);

nicoReport.updateEmphasis(rangeSwitch.value);