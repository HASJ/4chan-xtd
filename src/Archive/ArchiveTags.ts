import { E } from "../globals/globals";

const ArchiveTags = {
  '\n':         {innerHTML: "<br>"},
  '[b]':        {innerHTML: "<b>"},
  '[/b]':       {innerHTML: "</b>"},
  '[spoiler]':  {innerHTML: "<s>"},
  '[/spoiler]': {innerHTML: "</s>"},
  '[code]':     {innerHTML: "<pre class=\"prettyprint\">"},
  '[/code]':    {innerHTML: "</pre>"},
  '[moot]':     {innerHTML: "<div style=\"padding:5px;margin-left:.5em;border-color:#faa;border:2px dashed rgba(255,0,0,.1);border-radius:2px\">"},
  '[/moot]':    {innerHTML: "</div>"},
  '[banned]':   {innerHTML: "<strong style=\"color: red;\">"},
  '[/banned]':  {innerHTML: "</strong>"},
  '[fortune]'(text: string) { return {innerHTML: "<span class=\"fortune\" style=\"color:" + E(text.match(/#\w+|$/)[0]) + "\"><b>"}; },
  '[/fortune]': {innerHTML: "</b></span>"},
  '[i]':        {innerHTML: "<span class=\"mu-i\">"},
  '[/i]':       {innerHTML: "</span>"},
  '[red]':      {innerHTML: "<span class=\"mu-r\">"},
  '[/red]':     {innerHTML: "</span>"},
  '[green]':    {innerHTML: "<span class=\"mu-g\">"},
  '[/green]':   {innerHTML: "</span>"},
  '[blue]':     {innerHTML: "<span class=\"mu-b\">"},
  '[/blue]':    {innerHTML: "</span>"}
};

export default ArchiveTags;
