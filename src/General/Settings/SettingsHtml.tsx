import { g } from "../../globals/globals";
import h from "../../globals/jsx";
import meta from '../../../package.json';

// \u00A0 is non breaking space
const separator = '\u00A0|\u00A0';

const settingsHtml = <div id="fourchanx-settings" class="dialog">
  <nav>
    <div class="sections-list"></div>
    <p class="imp-exp-result warning"></p>
    <div class="credits">
      <button type="button" class="export">Export</button>
      <button type="button" class="import">Import</button>
      <button type="button" class="reset">Reset Settings</button>
      <input type="file" hidden accept=".json,application/json" />
      <a href={meta.page} target="_blank">{meta.name}</a>{separator}
      <a href={meta.changelog} target="_blank">{g.VERSION}</a>{separator}
      <a href={meta.issues} target="_blank">Issues</a>{separator}
      <button type="button" class="close" title="Close">✕</button>
    </div>
  </nav>
  <div class="subsections-list" hidden></div>
  <div class="section-container"><section></section></div>
</div>;

export default settingsHtml;
