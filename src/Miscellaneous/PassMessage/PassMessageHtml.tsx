import h from '../../globals/jsx';
import meta from '../../../package.json';

const passMessagePage = <div class="box-inner">
  <div class="boxbar">
    <h2>
      {"Trouble buying a 4chan Pass? (a message from 4chan X) "}
      <button class="close-button" style="background: none; border: none; padding: 0; cursor: pointer; font: inherit; color: inherit; text-decoration: none; float: right; margin-right: 4px;" title="Close">×</button>
    </h2>
  </div>
  <div class="boxcontent">
    Check the 4chan X wiki for <a href={`${meta.captchaFAQ}#alternatives`} target="_blank" rel="noopener">alternative solutions</a>.
  </div>
</div>;
export default passMessagePage;
