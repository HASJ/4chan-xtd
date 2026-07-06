// == Create CSS for Link Title Favicons == //
export const icons = (data: { name: string, data: string }[]) => (

  '/* Link Title Favicons */\n' +
  data.map(({ name, data }) =>
    `.linkify.${name}::before {
  content: "";
  background: transparent url('data:image/png;base64,${data}') center left no-repeat!important;
  padding-left: 18px;
}
`
  ).join('')

);
