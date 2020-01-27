import Base from './components/Base';
import NicoReport from './components/NicoReport';
import RangeSwitch from './components/RangeSwitch';

const base: Base = new Base();
const nicoReport: NicoReport = new NicoReport();
const rangeSwitch: RangeSwitch = new RangeSwitch();

base.addEventListener('update', () => {
  nicoReport.updateEmphasis(rangeSwitch.value);
});
rangeSwitch.addEventListener('change', (day: number) => {
  nicoReport.updateEmphasis(day);
});
